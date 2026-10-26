import asyncio
import json
import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from .. import config, db, guard, llm
from ..prompts import PLAN_SYSTEM, QUIZ_SYSTEM, TUTOR_SYSTEM
from ..db import oid
from ..schemas import ChatIn, ChatRename, Plan, Quiz
from ..security import current_user, rate_limit

log = logging.getLogger("eduverse.chat")
router = APIRouter(tags=["chat"])

QUIZ_RE = re.compile(r"\b(quiz me|make (me )?a quiz|create (a )?quiz|generate (a )?quiz|test me|mcqs?|practice questions)\b", re.I)
PLAN_RE = re.compile(r"\b(study plan|learning path|learning plan|roadmap|curriculum|syllabus|lesson plan)\b", re.I)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"


def _serialize(m: dict) -> dict:
    return {
        "id": str(m["_id"]),
        "role": m["role"],
        "type": m.get("type", "text"),
        "content": m["content"],
        "result": m.get("result"),
        "saved": m.get("saved", False),
        "review": m.get("review"),
        "blocked": m.get("blocked", False),
        "ts": m["ts"].isoformat().replace("+00:00", "Z"),
    }


def _prefs(user: dict) -> dict:
    p = user.get("preferences", {})
    return {
        "role": p.get("userRole", "Student"),
        "age_group": p.get("ageGroup", "18-25"),
        "language": p.get("language", "English"),
        "daily_hours": p.get("timeValue", 1),
    }


def _as_context(m: dict) -> dict:
    """History entry as plain text the model can follow; structured cards are summarised."""
    content = m["content"]
    if m.get("type") == "quiz":
        content = f"[Generated a quiz: {content.get('title')}]"
    elif m.get("type") == "plan":
        content = f"[Generated a study plan: {content.get('name')}]"
    return {"role": m["role"], "content": content}


async def _recent(username: str, chat_id) -> list[dict]:
    # Each chat is an independent context. Blocked (off-topic / injection) turns never reach the model again.
    cur = db.messages.find({"username": username, "chat_id": chat_id, "blocked": {"$ne": True}}).sort("ts", -1).limit(config.HISTORY_WINDOW)
    return [_as_context(m) for m in reversed(await cur.to_list())]


async def _store(username: str, chat_id, role: str, type_: str, content, **extra) -> dict:
    await db.chats.update_one({"_id": chat_id}, {"$set": {"updated": _now()}})
    doc = {"username": username, "chat_id": chat_id, "role": role, "type": type_, "content": content, "ts": _now(), **extra}
    doc["_id"] = (await db.messages.insert_one(doc)).inserted_id
    return doc


def _friendly(e: Exception) -> str:
    name = type(e).__name__
    if "RateLimit" in name:
        return "The AI service is busy right now. Please retry in a few seconds."
    if "Connection" in name or "Timeout" in name:
        return "Couldn't reach the AI service. Check your connection and retry."
    if isinstance(e, ValueError):
        return "I couldn't produce a reliable result for that. Please try again, maybe with a more specific topic."
    return "Something went wrong on our side. Please try again."


def _chat_out(c: dict) -> dict:
    return {"id": str(c["_id"]), "title": c["title"], "updated": c["updated"].isoformat().replace("+00:00", "Z")}


def _title_from(text: str) -> str:
    t = " ".join(text.split())
    return t if len(t) <= 48 else t[:47].rstrip() + "…"


@router.post("/chat/stream")
async def chat_stream(body: ChatIn, user: dict = Depends(rate_limit)):
    username = user["username"]
    text = body.message.strip()
    mode = body.mode
    if mode == "chat":
        mode = "quiz" if QUIZ_RE.search(text) else "plan" if PLAN_RE.search(text) else "chat"

    if body.chat_id:
        chat = await db.chats.find_one({"_id": oid(body.chat_id), "username": username})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        now = _now()
        chat = {"username": username, "title": _title_from(text), "created": now, "updated": now}
        chat["_id"] = (await db.chats.insert_one(chat)).inserted_id
    chat_id = chat["_id"]
    is_new = not body.chat_id

    history = await _recent(username, chat_id)
    prefs = _prefs(user)
    meta = {"chat_id": str(chat_id), "title": chat["title"], "new": is_new}

    async def events():
        try:
            # Layers 1+2: scope guard runs before any tutor model sees the message (fails closed).
            verdict = await guard.check_input(text, history)
            if not verdict.allowed:
                user_doc = await _store(username, chat_id, "user", "text", text, blocked=True)
                saved = await _store(username, chat_id, "assistant", "text", verdict.refusal, blocked=True)
                yield _sse("start", {**meta, "mode": "chat", "user_id": str(user_doc["_id"])})
                yield _sse("delta", {"t": verdict.refusal})
                yield _sse("review", {"verdict": "blocked", "notes": []})
                yield _sse("done", {"id": str(saved["_id"])})
                return

            user_doc = await _store(username, chat_id, "user", "text", text)
            yield _sse("start", {**meta, "mode": mode, "user_id": str(user_doc["_id"])})

            if mode == "chat":
                system = TUTOR_SYSTEM.format(**prefs)
                buf: list[str] = []
                saved = None
                try:
                    async for piece in llm.stream_text([{"role": "system", "content": system}, *history, {"role": "user", "content": text}]):
                        buf.append(piece)
                        yield _sse("delta", {"t": piece})
                finally:
                    # Persist even if the client pressed Stop mid-stream.
                    if buf:
                        saved = await asyncio.shield(_store(username, chat_id, "assistant", "text", "".join(buf)))
                yield _sse("done", {"id": str(saved["_id"]) if saved else None})

                answer = "".join(buf)
                if saved and len(answer) > 120:
                    # Layer 3: independent fact-check / scope review of the finished answer.
                    yield _sse("checking", {})
                    review = await guard.review_answer(text, answer)
                    if review.verdict == "off_topic":
                        await db.messages.update_one({"_id": saved["_id"]}, {"$set": {"content": guard.REFUSAL, "blocked": True, "review": {"verdict": "blocked", "notes": []}}})
                        yield _sse("review", {"verdict": "blocked", "notes": [], "text": guard.REFUSAL})
                    elif review.verdict != "skipped":
                        data = {"verdict": review.verdict, "notes": review.notes}
                        await db.messages.update_one({"_id": saved["_id"]}, {"$set": {"review": data}})
                        yield _sse("review", data)
                    else:
                        yield _sse("review", {"verdict": "skipped", "notes": []})
            else:
                yield _sse("status", {"t": "Designing your quiz…" if mode == "quiz" else "Drafting your study plan…"})
                if mode == "quiz":
                    system, model = QUIZ_SYSTEM.format(count=6, **prefs), Quiz
                else:
                    system, model = PLAN_SYSTEM.format(**prefs), Plan
                result = await llm.generate_structured(system, history, text, model)
                if mode == "quiz":
                    yield _sse("status", {"t": "Verifying answers…"})
                    result = await guard.verify_quiz(result)  # Layer 4
                saved = await _store(username, chat_id, "assistant", mode, result.model_dump())
                yield _sse("block", {"id": str(saved["_id"]), "type": mode, "content": saved["content"]})
                yield _sse("done", {"id": str(saved["_id"])})
        except Exception as e:  # noqa: BLE001 - surface a friendly message, log details
            log.exception("chat failed")
            yield _sse("error", {"message": _friendly(e)})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


async def _adopt_legacy(username: str) -> None:
    """Messages from before multi-chat support are gathered into one chat."""
    if await db.messages.count_documents({"username": username, "chat_id": {"$exists": False}}, limit=1):
        now = _now()
        chat = {"username": username, "title": "Earlier conversation", "created": now, "updated": now}
        cid = (await db.chats.insert_one(chat)).inserted_id
        await db.messages.update_many({"username": username, "chat_id": {"$exists": False}}, {"$set": {"chat_id": cid}})


@router.get("/chats")
async def list_chats(user: dict = Depends(current_user)):
    await _adopt_legacy(user["username"])
    cur = db.chats.find({"username": user["username"]}).sort("updated", -1).limit(200)
    return {"chats": [_chat_out(c) for c in await cur.to_list()]}


@router.patch("/chats/{chat_id}")
async def rename_chat(chat_id: str, body: ChatRename, user: dict = Depends(current_user)):
    res = await db.chats.find_one_and_update(
        {"_id": oid(chat_id), "username": user["username"]}, {"$set": {"title": body.title.strip()}}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Chat not found")
    return _chat_out(res)


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str, user: dict = Depends(current_user)):
    cid = oid(chat_id)
    if (await db.chats.delete_one({"_id": cid, "username": user["username"]})).deleted_count:
        await db.messages.delete_many({"username": user["username"], "chat_id": cid})
    return {"ok": True}


@router.get("/chats/{chat_id}/messages")
async def chat_messages(chat_id: str, user: dict = Depends(current_user)):
    cid = oid(chat_id)
    if not await db.chats.find_one({"_id": cid, "username": user["username"]}):
        raise HTTPException(status_code=404, detail="Chat not found")
    cur = db.messages.find({"username": user["username"], "chat_id": cid}).sort("ts", 1).limit(500)
    return {"messages": [_serialize(m) for m in await cur.to_list()]}

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..db import oid
from ..schemas import PlanSave, QuizSubmit, TopicToggle
from ..security import current_user

router = APIRouter(tags=["learning"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(d: datetime) -> str:
    return d.isoformat().replace("+00:00", "Z")


def _plan_out(p: dict) -> dict:
    total = len(p["plan"]["topics"])
    done = len(p.get("completed", []))
    return {
        "id": str(p["_id"]),
        "name": p["plan"]["name"],
        "plan": p["plan"],
        "completed": p.get("completed", []),
        "progress": round(100 * done / total) if total else 0,
        "created": _iso(p["created"]),
    }


@router.get("/plans")
async def list_plans(user: dict = Depends(current_user)):
    cur = db.plans.find({"username": user["username"]}).sort("created", -1)
    return {"plans": [_plan_out(p) for p in await cur.to_list()]}


@router.post("/plans", status_code=201)
async def save_plan(body: PlanSave, user: dict = Depends(current_user)):
    msg = await db.messages.find_one({"_id": oid(body.message_id), "username": user["username"], "type": "plan"})
    if not msg:
        raise HTTPException(status_code=404, detail="Plan not found")
    existing = await db.plans.find_one({"username": user["username"], "message_id": msg["_id"]})
    if existing:
        return _plan_out(existing)
    doc = {"username": user["username"], "message_id": msg["_id"], "plan": msg["content"], "completed": [], "created": _now()}
    doc["_id"] = (await db.plans.insert_one(doc)).inserted_id
    await db.messages.update_one({"_id": msg["_id"]}, {"$set": {"saved": True}})
    return _plan_out(doc)


@router.put("/plans/{plan_id}/topics/{index}")
async def toggle_topic(plan_id: str, index: int, body: TopicToggle, user: dict = Depends(current_user)):
    plan = await db.plans.find_one({"_id": oid(plan_id), "username": user["username"]})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if not 0 <= index < len(plan["plan"]["topics"]):
        raise HTTPException(status_code=400, detail="Invalid topic")
    op = {"$addToSet": {"completed": index}} if body.done else {"$pull": {"completed": index}}
    await db.plans.update_one({"_id": plan["_id"]}, op)
    return _plan_out(await db.plans.find_one({"_id": plan["_id"]}))


@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str, user: dict = Depends(current_user)):
    plan = await db.plans.find_one_and_delete({"_id": oid(plan_id), "username": user["username"]})
    if plan:
        await db.messages.update_one({"_id": plan["message_id"]}, {"$set": {"saved": False}})
    return {"ok": True}


@router.post("/quiz/submit")
async def submit_quiz(body: QuizSubmit, user: dict = Depends(current_user)):
    """Upsert the learner's answers. Callable after every answer, so partially-taken quizzes are saved
    too; the score is computed over the questions actually answered (e.g. 2/3)."""
    msg = await db.messages.find_one({"_id": oid(body.message_id), "username": user["username"], "type": "quiz"})
    if not msg:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = msg["content"]["questions"]
    answers = [a if isinstance(a, int) and 0 <= a <= 3 else None for a in (body.answers + [None] * len(questions))[: len(questions)]]
    answered = sum(1 for a in answers if a is not None)
    score = sum(1 for q, a in zip(questions, answers) if a is not None and a == q["answer_index"])
    finished = body.finished or answered == len(questions)
    result = {"score": score, "answered": answered, "total": len(questions), "answers": answers, "finished": finished}
    await db.messages.update_one({"_id": msg["_id"]}, {"$set": {"result": result}})
    if answered:
        await db.quiz_results.update_one(
            {"username": user["username"], "message_id": msg["_id"]},
            {"$set": {"title": msg["content"]["title"], "topic": msg["content"].get("topic", ""), **result, "ts": _now()}},
            upsert=True,
        )
    return result


@router.get("/quiz/results")
async def quiz_results(user: dict = Depends(current_user)):
    cur = db.quiz_results.find({"username": user["username"]}).sort("ts", -1).limit(100)
    items = [
        {
            "id": str(r["_id"]), "title": r["title"], "topic": r.get("topic", ""), "score": r["score"],
            "answered": r.get("answered", r.get("total", 0)), "total": r["total"], "finished": r.get("finished", True), "ts": _iso(r["ts"]),
        }
        for r in await cur.to_list()
    ]
    return {"results": items}

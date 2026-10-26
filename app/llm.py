import json
import logging
import re
from typing import AsyncIterator, TypeVar

from groq import AsyncGroq
from pydantic import BaseModel, ValidationError

from . import config
from .prompts import JSON_REPAIR

log = logging.getLogger("eduverse.llm")
client = AsyncGroq(api_key=config.GROQ_API_KEY or "missing", max_retries=2, timeout=60)
T = TypeVar("T", bound=BaseModel)


def _opts() -> dict:
    # gpt-oss models spend tokens "thinking" first; keep it light for latency.
    return {"reasoning_effort": "low"} if "gpt-oss" in config.MODEL_NAME else {}


async def stream_text(messages: list[dict]) -> AsyncIterator[str]:
    stream = await client.chat.completions.create(
        model=config.MODEL_NAME,
        messages=messages,
        stream=True,
        temperature=0.3,
        max_completion_tokens=3000,
        **_opts(),
    )
    async for chunk in stream:
        if chunk.choices and (text := chunk.choices[0].delta.content):
            yield text


def loads_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


async def generate_structured(system: str, context: list[dict], user: str, model: type[T], retries: int = 1) -> T:
    """JSON-mode completion validated against a pydantic model, with one repair round."""
    messages = [{"role": "system", "content": system}, *context, {"role": "user", "content": user}]
    last_error = ""
    for attempt in range(retries + 1):
        resp = await client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.5,
            max_completion_tokens=6000,
            **_opts(),
        )
        raw = resp.choices[0].message.content or ""
        try:
            return model.model_validate(loads_json(raw))
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = str(e)[:300]
            log.warning("structured output invalid (attempt %s): %s", attempt + 1, last_error)
            messages = [*messages, {"role": "assistant", "content": raw}, {"role": "user", "content": JSON_REPAIR.format(error=last_error)}]
    raise ValueError(f"Model returned invalid {model.__name__}: {last_error}")

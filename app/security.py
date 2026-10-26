import asyncio
import base64
import hashlib
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config, db

_bearer = HTTPBearer(auto_error=False)


def _prehash(password: str) -> bytes:
    # bcrypt rejects >72 bytes; prehashing keeps long passphrases working.
    return base64.b64encode(hashlib.sha256(password.encode()).digest())


async def hash_password(password: str) -> str:
    return (await asyncio.to_thread(bcrypt.hashpw, _prehash(password), bcrypt.gensalt())).decode()


async def verify_password(password: str, hashed: str) -> bool:
    try:
        return await asyncio.to_thread(bcrypt.checkpw, _prehash(password), hashed.encode())
    except ValueError:
        return False


def create_token(username: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=config.JWT_TTL_DAYS)
    return jwt.encode({"sub": username, "exp": exp}, config.JWT_SECRET, algorithm="HS256")


async def current_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        username = jwt.decode(creds.credentials, config.JWT_SECRET, algorithms=["HS256"])["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired, please sign in again")
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return user


_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(user: dict = Depends(current_user)) -> dict:
    """Sliding-window limiter on the expensive LLM endpoints (per process)."""
    now = time.monotonic()
    q = _hits[user["username"]]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= config.RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="You're going a bit fast. Give it a few seconds and try again.")
    q.append(now)
    return user

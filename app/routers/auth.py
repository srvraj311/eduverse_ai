import asyncio

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pymongo.errors import DuplicateKeyError

from .. import config, db
from ..schemas import GoogleIn, LoginIn, Preferences, SignupIn
from ..security import create_token, current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(user: dict) -> dict:
    return {
        "name": user["name"],
        "username": user["username"],
        "preferences": {**Preferences().model_dump(), **user.get("preferences", {})},
    }


@router.post("/signup", status_code=201)
async def signup(body: SignupIn):
    doc = {
        "name": body.name.strip(),
        "username": body.username,
        "password": await hash_password(body.password),
        "preferences": Preferences().model_dump(),
    }
    try:
        await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    return {"token": create_token(body.username), **_public(doc)}


@router.post("/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"username": body.username})
    if not user or not await verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"token": create_token(user["username"]), **_public(user)}


@router.get("/config")
async def public_config():
    return {"google_client_id": config.GOOGLE_CLIENT_ID or None}


@router.post("/google")
async def google_login(body: GoogleIn):
    """Verify a Google Identity Services ID token, then sign in (creating the account on first use)."""
    if not config.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in isn't configured")
    try:
        info = await asyncio.to_thread(id_token.verify_oauth2_token, body.credential, google_requests.Request(), config.GOOGLE_CLIENT_ID)
    except ValueError:
        raise HTTPException(status_code=401, detail="Google sign-in failed. Please try again.")
    if not info.get("email") or not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Your Google email isn't verified")
    email = info["email"].lower()
    user = await db.users.find_one({"username": email})
    if not user:
        user = {
            "name": info.get("name") or email.split("@")[0],
            "username": email,
            "password": None,
            "provider": "google",
            "preferences": Preferences().model_dump(),
        }
        try:
            await db.users.insert_one(user)
        except DuplicateKeyError:  # raced with a parallel sign-in
            user = await db.users.find_one({"username": email})
    return {"token": create_token(email), **_public(user)}


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return _public(user)


@router.put("/preferences")
async def save_preferences(prefs: Preferences, user: dict = Depends(current_user)):
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"preferences": prefs.model_dump()}})
    return prefs

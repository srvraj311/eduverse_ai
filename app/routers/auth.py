from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from .. import db
from ..schemas import LoginIn, Preferences, SignupIn
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


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return _public(user)


@router.put("/preferences")
async def save_preferences(prefs: Preferences, user: dict = Depends(current_user)):
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"preferences": prefs.model_dump()}})
    return prefs

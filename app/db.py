from bson import ObjectId
from fastapi import HTTPException
from pymongo import AsyncMongoClient

from . import config

client = AsyncMongoClient(config.MONGO_URI, serverSelectionTimeoutMS=8000, tz_aware=True)
db = client[config.MONGO_DB]

users = db["users"]
chats = db["chats"]
messages = db["messages"]
plans = db["plans"]
quiz_results = db["quiz_results"]


async def init_indexes() -> None:
    await users.create_index("username", unique=True)
    await chats.create_index([("username", 1), ("updated", -1)])
    await messages.create_index([("username", 1), ("chat_id", 1), ("ts", 1)])
    await plans.create_index([("username", 1), ("created", -1)])
    await quiz_results.create_index([("username", 1), ("ts", -1)])
    await quiz_results.create_index([("username", 1), ("message_id", 1)])


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")

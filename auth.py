import os
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import users_collection
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Router for authentication
auth_router = APIRouter()

# JWT Secret
JWT_SECRET = os.getenv("JWT_SECRET")

# Request Models
class SignupRequest(BaseModel):
    name: str
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

# Password Hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

# Generate JWT Token
def create_jwt_token(username: str):
    expiration = datetime.utcnow() + timedelta(days=1)
    payload = {"sub": username, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# Signup Endpoint
@auth_router.post("/signup")
async def signup(request: SignupRequest):
    if not request.name.strip() or not request.username.strip() or not request.password.strip():
        raise HTTPException(status_code=400, detail="All fields are required")

    if users_collection.find_one({"username": request.username}):
        raise HTTPException("User already exists")

    hashed_password = hash_password(request.password)

    # Default Preferences
    default_preferences = {
        "userRole": "Student",
        "timeValue": 15,
        "language": "English",
        "ageGroup": "Under 10"
    }

    users_collection.insert_one({
        "name": request.name,
        "username": request.username,
        "password": hashed_password,
        "preferences": default_preferences
    })

    return {"message": "User registered successfully with default preferences"}

# Login Endpoint
@auth_router.post("/login")
async def login(request: LoginRequest):
    user = users_collection.find_one({"username": request.username})
    
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException("No user exists with this mail")

    # Check and add default preferences if not present
    default_preferences = {
        "userRole": "Student",
        "timeValue": 15,
        "language": "English",
        "ageGroup": "Under 10"
    }
    
    if not user.get("preferences"):
        users_collection.update_one(
            {"username": request.username},
            {"$set": {"preferences": default_preferences}}
        )
        user["preferences"] = default_preferences

    token = create_jwt_token(request.username)
    return {"token": token, "username": request.username, "preferences": user["preferences"], "name": user["name"]}

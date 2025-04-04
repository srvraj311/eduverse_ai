# chat.py
import json
import datetime
import asyncio
import groq
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from database import chats_collection
from constants import LEARNING_PATH_PROMPT, BASIC_ENVIRONMENT_PROMPT, REGENRATE_OR_FILTER_JSON, CALCULATE_SCORE
from fastapi import Body
from utils import extract_json
import os
from learning_path import process_learning_path_query

# Router for chat
chat_router = APIRouter()

client = groq.Client(api_key=os.getenv("API_KEY"))

def generate_response(prompt):
    """Generates a response using Groq's model"""
    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME"),
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Error generating response. Please try again."

async def generate_chat_stream(messages):
    """Streams chat responses from Groq asynchronously"""
    try:
        response_stream = client.chat.completions.create(
            model=os.getenv("MODEL_NAME"),
            messages=messages,
            stream=True,
        )

        for chunk in response_stream:
            yield chunk.choices[0].delta.content
    except Exception as e:
        print(f"Error in chat stream: {e}")
        yield "Error in chat stream. Please try again."

def store_chat_history(username, messages):
    """Stores chat history in MongoDB"""
    try:
        chats_collection.update_one(
            {"username": username},
            {"$push": {"messages": messages}},
            upsert=True
        )
    except Exception as e:
        print(f"Error storing chat history: {e}")

def filter_messages(messages):
    """Filters messages to keep only role and content."""
    return [{"role": msg["role"], "content": msg["content"]} for msg in messages if "role" in msg and "content" in msg]


@chat_router.post("/ask")
async def chat(user_prompt: str, username: str, isQuiz: bool = False, isLearningPath: bool = False):
    """Handles chat requests (both normal and streaming responses)"""
    try:
        print(f"👤 User: {user_prompt} | 🆔 Username: {username}")

        user_timestamp = datetime.datetime.utcnow().isoformat() + "Z"

        chat_session = chats_collection.find_one({"username": username}) or {}
        prev_5_messages = chat_session.get("messages", [])[-10:] if "messages" in chat_session else []
        prev_5_messages = [msg for msg in prev_5_messages if msg.get("type") != "learning_path"]
        user_message = {
            "role": "user",
            "content": user_prompt,
            "type": "content",
            "timestamp": user_timestamp
        }
        
        if not isQuiz: 
            store_chat_history(username, user_message)
        prev_5_messages.append(user_message)

        if isQuiz:
            user_prompt = f"{user_prompt} {CALCULATE_SCORE}"
        
        # Case 1: Learning Path JSON generation 
        if isLearningPath:
            user_preferences = chat_session.get("preferences", {})
            prompt_with_preference = LEARNING_PATH_PROMPT.format(
                userRole=user_preferences.get("userRole", "Student"),
                timeValue=user_preferences.get("timeValue", 5),
                language=user_preferences.get("language", "English"),
                ageGroup=user_preferences.get("ageGroup", "Under 18")
            )

            user_message = {
                "role": "user",
                "content": user_prompt,
                "type": "learning_path",
                "timestamp": user_timestamp
            }
            store_chat_history(username, user_message)
            return process_learning_path_query(user_prompt, username, generate_response, extract_json, store_chat_history, REGENRATE_OR_FILTER_JSON, prompt_with_preference)

        # Case 2 : Stream prompt
        user_prompt = f"{user_prompt} {BASIC_ENVIRONMENT_PROMPT}"

        async def chat_stream():
            response_content = ""
            async for token in generate_chat_stream(filter_messages(prev_5_messages)):
                if token:  # Ensure token is not None
                    response_content += token
                    yield token

            response_timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            response_message = {
                "role": "assistant",
                "content": response_content,
                "type": "content",
                "timestamp": response_timestamp
            }
            store_chat_history(username, response_message)

        return StreamingResponse(chat_stream(), media_type="text/plain")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        response_timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        response_message = {
            "role": "assistant",
            "content": "There seems to be some error on our side, Please try again later.",
            "type": "content",
            "timestamp": response_timestamp
        }
        store_chat_history(username, response_message)
        raise HTTPException(status_code=500, detail=str(e))


@chat_router.get("/history")
async def get_chat_history(username: str):
    print(f"Fetching Chat History for: {username}")

    chat_session = chats_collection.find_one({"username": username})
    
    if not chat_session:
        raise HTTPException(status_code=404, detail="No chat history found for this user.")
    
    messages = chat_session.get("messages", [])
    return {"history": messages}

@chat_router.post("/save-path")
async def save_path(
    username: str = Body(...),
    path: dict = Body(...),
    learning_goal_name: str = Body(None)
):
    """Saves learning path as part of a learning goal."""
    try:
        if not isinstance(path, dict):
            raise HTTPException(status_code=400, detail="Path must be a valid JSON object")

        chat_session = chats_collection.find_one({"username": username}) or {}
        learning_goals = chat_session.get("learning_goals", [])

        if not learning_goal_name:
            learning_goal_name = f"Unnamed Learning Goal {len(learning_goals) + 1}"

        duration = path.get("course_duration", "Unknown")

        existing_goal = next((goal for goal in learning_goals if goal["name"] == learning_goal_name), None)

        if existing_goal:
            existing_goal["study_plans"].append(path)
        else:
            new_goal = {
                "name": learning_goal_name,
                "duration": duration,
                "study_plans": [path]
            }
            learning_goals.append(new_goal)

        chats_collection.update_one(
            {"username": username},
            {"$set": {"learning_goals": learning_goals}},
            upsert=True
        )

        return {"message": f"Learning path saved successfully under '{learning_goal_name}'"}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@chat_router.get("/get-all-goals")
async def get_all_goals(username: str):
    """Retrieves all learning goals for a given user."""
    try:
        chat_session = chats_collection.find_one({"username": username})
        if not chat_session or "learning_goals" not in chat_session:
            return {"learning_goals": []}  # Return empty list if no goals found
        
        return {"learning_goals": chat_session["learning_goals"]}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@chat_router.delete("/clear")
async def clear_chat(username: str):
    """Clears the chat history for a specific user."""
    try:
        result = chats_collection.update_one(
            {"username": username},
            {"$set": {"messages": []}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="No chat history found for this user.")

        return {"message": "Chat history cleared successfully."}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

    # New API to store user preferences
@chat_router.post("/save-preferences")
async def save_preferences(username: str = Body(...), preferences: dict = Body(...)):
    """Stores user preferences in the database."""
    try:
        if not isinstance(preferences, dict):
            raise HTTPException(status_code=400, detail="Preferences must be a valid JSON object")

        # Update or insert preferences under the username
        chats_collection.update_one(
            {"username": username},
            {"$set": {"preferences": preferences}},
            upsert=True
        )

        return {"message": "Preferences saved successfully."}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from auth import auth_router
from chat import chat_router
import os

# Initialize FastAPI app
app = FastAPI(
    title="Eduverse.ai API",
    description="Chatbot with Authentication, MongoDB, and LLM integration"
)

# Allowed frontend origins (Update if deploying)
origins = [
    "http://localhost:5173",  # Vite Frontend
    "http://127.0.0.1:5173",  # Alternative local Vite
    "http://localhost:3000",  # React Dev Server
    "http://127.0.0.1:3000",
    "https://eduverse-ai.vercel.app",  # Deployed frontend on Vercel
]

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Only allow specific frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ✅ 1. Include Routers **before** mounting frontend
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])

# ✅ 2. Root API Endpoint
@app.get("/api")
async def root():
    return {"message": "Welcome to Eduverse.ai API"}

# ✅ 3. Mount frontend **at the end** to prevent route conflicts
FRONTEND_BUILD_DIR = os.path.join(os.getcwd(), "frontend", "dist")
app.mount("/", StaticFiles(directory=FRONTEND_BUILD_DIR, html=True), name="frontend")

# if os.path.exists(FRONTEND_BUILD_DIR):

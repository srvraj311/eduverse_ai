import os
import secrets

from dotenv import load_dotenv

load_dotenv()


def _env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


MONGO_URI = _env("MONGO_URI")
MONGO_DB = _env("MONGO_DB", default="eduverse")
GROQ_API_KEY = _env("GROQ_API_KEY", "API_KEY")
MODEL_NAME = _env("MODEL_NAME", default="openai/gpt-oss-120b")
GUARD_MODEL = _env("GUARD_MODEL", default="openai/gpt-oss-20b")  # fast model for scope + fact-check layers
GOOGLE_CLIENT_ID = _env("GOOGLE_CLIENT_ID")  # enables "Continue with Google" when set
JWT_SECRET = _env("JWT_SECRET") or secrets.token_urlsafe(48)  # random per boot if unset (dev only)
JWT_TTL_DAYS = int(_env("JWT_TTL_DAYS", default="7"))
CORS_ORIGINS = [o.strip() for o in _env("CORS_ORIGINS", default="http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
RATE_LIMIT_PER_MIN = int(_env("RATE_LIMIT_PER_MIN", default="20"))
HISTORY_WINDOW = 12  # text messages sent to the model as context

"""Compatibility entrypoint so `uvicorn main:app` (the old Render start command) keeps working.
The real app lives in app/main.py; prefer `uvicorn app.main:app`."""
from app.main import app  # noqa: F401

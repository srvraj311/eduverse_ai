import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import config, db
from .routers import auth, chat, learning

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("eduverse")

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not config.GROQ_API_KEY:
        log.warning("GROQ_API_KEY/API_KEY not set - AI features will fail")
    try:
        await db.init_indexes()
        log.info("Connected to MongoDB db=%s, model=%s", config.MONGO_DB, config.MODEL_NAME)
    except Exception:  # noqa: BLE001 - keep serving so /api/health and logs show the real problem
        log.exception("MongoDB unreachable at startup (check MONGO_URI and Atlas Network Access)")
    yield
    await db.client.close()


app = FastAPI(title="Eduverse.ai API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(chat.router)
api.include_router(learning.router)


@api.get("/health")
async def health():
    return {"status": "ok", "model": config.MODEL_NAME}


app.include_router(api)


@app.exception_handler(Exception)
async def unhandled(_, exc: Exception):
    log.exception("unhandled error")
    return JSONResponse({"detail": "Internal server error"}, status_code=500)


if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str):
        if path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        file = (DIST / path).resolve()
        if path and file.is_file() and DIST in file.parents:
            return FileResponse(file)
        return FileResponse(DIST / "index.html")

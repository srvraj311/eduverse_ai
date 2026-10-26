# Eduverse.ai

An AI tutor with streaming chat, interactive quizzes and personalised study plans.

- **Frontend:** React 19 + Vite, tsParticles background, Apple-style glass UI (light/dark)
- **Backend:** FastAPI, async MongoDB (PyMongo), JWT auth, Groq LLM (`openai/gpt-oss-120b` by default)
- **Streaming:** Server-Sent Events over `POST /api/chat/stream` with typed events (`delta`, `block`, `status`, `done`, `error`)

## Run locally

```sh
cp .env.example .env          # fill in MONGO_URI, API_KEY (Groq), JWT_SECRET
python -m venv venv && venv\Scripts\activate   # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd frontend && npm install && npm run dev       # http://localhost:5173 (proxies /api to :8000)
```

To serve everything from one process, run `npm run build` in `frontend/` and open http://localhost:8000.

## Deploy on Render

1. Push this repo to GitHub, then in Render choose **New → Blueprint** and select it (`render.yaml`).
2. Set the secret env vars: `MONGO_URI` and `API_KEY`. `JWT_SECRET` is generated for you.
3. In MongoDB Atlas, **Network Access** must allow Render (add `0.0.0.0/0`, or Render's outbound IPs).
4. If your service URL differs from `eduverse-ai.onrender.com`, update `CORS_ORIGINS` (only needed if the frontend is hosted elsewhere).

The Dockerfile builds the frontend and serves it from FastAPI, so it is a single service.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup`, `/api/auth/login` | Create account / sign in (returns JWT) |
| GET/PUT | `/api/auth/me`, `/api/auth/preferences` | Profile and learning preferences |
| POST | `/api/chat/stream` | `{message, mode: chat\|quiz\|plan}` → SSE stream |
| GET/DELETE | `/api/chat/history` | Conversation history |
| GET/POST/DELETE | `/api/plans`, `/api/plans/{id}` | Saved study plans |
| PUT | `/api/plans/{id}/topics/{index}` | Tick a topic done/not done |
| POST/GET | `/api/quiz/submit`, `/api/quiz/results` | Score a quiz, list past results |
| GET | `/api/health` | Health check |

Data lives in the `eduverse` database: `users`, `messages`, `plans`, `quiz_results`.

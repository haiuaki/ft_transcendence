import os
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from rag import format_rag_prompt, get_relevant_context, store_message_with_embedding

from database import init_db_pool

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Missing GOOGLE_API_KEY environment variable")

client = genai.Client(api_key=api_key)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application lifecycle"""
    app.state.db_pool = await init_db_pool()
    yield
    await app.state.db_pool.close()

app = FastAPI(title="LLM", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"error": f"Rate limit exceeded: {exc}"},
    )

class PromptRequest(BaseModel):
    prompt: str
    channel_id: int | None = None

DEFAULT_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
]

async def stream_generator(prompt: str) -> AsyncGenerator[str, None]:
    last_error = None
    for model_name in DEFAULT_MODELS:
        try:
            chat = client.chats.create(model=model_name)
            response = chat.send_message_stream(prompt)

            streamed_any = False
            for chunk in response:
                if chunk.text:
                    streamed_any = True
                    yield f"data: {chunk.text}\n\n"

            if streamed_any:
                yield "data: Done\n\n"
                return
        except Exception as e:
            last_error = e
            # Try next fallback model if 503 UNAVAILABLE or 429 RESOURCE_EXHAUSTED
            continue

    clean_error = str(last_error).replace("\n", " ") if last_error else "Service unavailable"
    yield f"data: [ERROR: {clean_error}]\n\n"

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/stream")
@limiter.limit("20/minute")
async def stream_ai(request: Request, body: PromptRequest):
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    context = await get_relevant_context(
            client=client,
            db_pool=request.app.state.db_pool,
            user_prompt=body.prompt,
            channel_id=body.channel_id,
    )

    augmented_prompt = format_rag_prompt(context=context, user_prompt=body.prompt)
    return StreamingResponse(
            stream_generator(augmented_prompt),
            media_type="text/event-stream",
    )

class MessageCreateRequest(BaseModel):
    sender_id: str
    channel_id: int
    content: str

@app.post("/messages", status_code=201)
async def create_message(request: Request, body: MessageCreateRequest):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    try:
        message_id = await store_message_with_embedding(
                client=client,
                db_pool=request.app.state.db_pool,
                sender_id=body.sender_id,
                channel_id=body.channel_id,
                content=body.content,
        )
        return {"id": message_id, "status": "stored"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to store message: {str(e)}"
        )

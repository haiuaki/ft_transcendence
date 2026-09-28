import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from google import genai
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Missing GOOGLE_API_KEY environment variable")

client = genai.Client(api_key=api_key)
app = FastAPI(title="LLM")

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

async def stream_generator(prompt: str) -> AsyncGenerator[str, None]:
    try:
        chat = client.chats.create(model="gemini-3.6-flash")

        response = chat.send_message_stream(prompt)

        for chunk in response:
            if chunk.text:
                yield f"data: {chunk.text}\n\n"
        yield "data: Done\n\n"

    except Exception as e:
        yield f"data: [ERROR: {str(e)}]\n\n"

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/stream")
@limiter.limit("3/minute")
async def stream_ai(request: Request, body: PromptRequest):
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    return StreamingResponse(
            stream_generator(body.prompt),
            media_type="text/event-stream",
            )

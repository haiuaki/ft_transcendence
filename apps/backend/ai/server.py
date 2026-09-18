from dotenv import load_dotenv
import os
from google import genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import AsyncGenerator
from fastapi.responses import StreamingResponse
import warnings

load_dotenv()
warnings.filterwarnings("ignore", message=".*Direct use of automatic function calling.*")

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Missing GOOGLE_API_KEY environment variable")

client = genai.Client(api_key=api_key)
app = FastAPI(title="LLM")

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
async def stream_ai(request: PromptRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    return StreamingResponse(
            stream_generator(request.prompt),
            media_type="text/event-stream",
            )

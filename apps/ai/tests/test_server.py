from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient
from apps.ai.server import app

client = TestClient(app)

def test_health_check():
    """Checks if the service is alive"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_stream_empty_prompt():
    """Checks empty prompts rejection."""
    response = client.post("/stream", json={"prompt": "   "})
    assert response.status_code == 400
    assert "Prompt cannot be empty" in response.json()["detail"]

def test_stream_prompt_too_long():
    """Checks prompts over 500 characters are rejected, like on the frontend."""
    response = client.post("/stream", json={"prompt": "a" * 501})
    assert response.status_code == 422

def test_message_too_long():
    """Checks stored messages over 500 characters are rejected."""
    response = client.post("/messages", json={"sender_id": "x", "channel_id": 1, "content": "a" * 501})
    assert response.status_code == 422

def test_rate_limiting(monkeypatch):
    """Checks limiter blocks after 20 queries (code 429)."""
    app.state.db_pool = MagicMock()
    monkeypatch.setattr("apps.ai.server.get_relevant_context", AsyncMock(return_value=""))
    async def dummy_stream(*args, **kwargs):
        yield "chunk"
    monkeypatch.setattr("apps.ai.server.stream_generator", dummy_stream)

    status_codes = []
    
    # Sending up to 25 queries. The limiter should throw an error after 20
    for _ in range(25):
        res = client.post("/stream", json={"prompt": "test"})
        status_codes.append(res.status_code)
        if res.status_code == 429:
            assert "Rate limit exceeded" in res.json()["error"]
            break
            
    assert 429 in status_codes


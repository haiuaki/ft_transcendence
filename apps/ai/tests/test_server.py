from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient
from apps.ai.server import app, current_user_id

client = TestClient(app)

# Most tests act as a logged-in user; test_stream_requires_login checks the real auth
@pytest.fixture(autouse=True)
def logged_in_user():
    app.dependency_overrides[current_user_id] = lambda: "00000000-0000-0000-0000-000000000001"
    yield
    app.dependency_overrides.clear()

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

def test_stream_requires_login():
    """Checks the assistant refuses requests without a valid session token."""
    app.dependency_overrides.clear()
    missing = client.post("/stream", json={"prompt": "hello"})
    assert missing.status_code == 401
    forged = client.post("/stream", json={"prompt": "hello"}, headers={"Authorization": "Bearer not-a-real-token"})
    assert forged.status_code == 401

def test_stream_searches_as_the_logged_in_user(monkeypatch):
    """Checks the RAG search is scoped to the user from the token, not to anyone."""
    app.state.db_pool = MagicMock()
    get_context = AsyncMock(return_value="")
    monkeypatch.setattr("apps.ai.server.get_relevant_context", get_context)
    async def dummy_stream(*args, **kwargs):
        yield "chunk"
    monkeypatch.setattr("apps.ai.server.stream_generator", dummy_stream)

    response = client.post("/stream", json={"prompt": "what did alice say?"})
    assert response.status_code == 200
    assert get_context.call_args.kwargs["user_id"] == "00000000-0000-0000-0000-000000000001"

def test_messages_endpoint_removed():
    """Checks the unauthenticated endpoint that stored messages for any sender is gone."""
    response = client.post("/messages", json={"sender_id": "x", "channel_id": 1, "content": "hi"})
    assert response.status_code in (404, 405)

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


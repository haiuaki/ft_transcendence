from unittest.mock import AsyncMock, MagicMock
import pytest
from apps.ai.rag import format_rag_prompt, generate_embedding, get_relevant_context, store_message_with_embedding

def test_format_rag_prompt():
    """Checks that context and prompt are combined into the system prompt."""
    context = "[2026-09-30 14:00] user1: Hello world! (relevance: 0.85)"
    user_prompt = "What did user1 say?"

    result = format_rag_prompt(context=context, user_prompt=user_prompt)

    assert "System context:" in result
    assert context in result
    assert f"User query: {user_prompt}" in result

def test_generate_embedding():
    """Checks embedding generation using mocked Google GenAI client."""
    mock_client = MagicMock()
    mock_values = [0.12, -0.45, 0.78]
    mock_embedding = MagicMock()
    mock_embedding.values = mock_values

    mock_response = MagicMock()
    mock_response.embeddings = [mock_embedding]
    mock_client.models.embed_content.return_value = mock_response

    result = generate_embedding(mock_client, "Sample test text")

    assert result == mock_values
    mock_client.models.embed_content.assert_called_once_with(
        model="gemini-embedding-001",
        contents="Sample test text",
        config={"output_dimensionality": 768},
    )

@pytest.mark.asyncio
async def test_get_relevant_context_with_matches(monkeypatch):
    """Checks context retrieval when matching messages are found."""
    # Simulate embedding function
    monkeypatch.setattr("apps.ai.rag.generate_embedding", lambda client, text: [0.1, 0.2])

    # Simulate database pool and connection
    mock_conn = AsyncMock()
    mock_conn.fetch.return_value = [
        {
            "id": 1,
            "username": "user1",
            "content": "Tournament starts at 18:00",
            "created_at": MagicMock(strftime=lambda fmt: "2026-09-30 18:00"),
            "distance": 0.15,
            "channel_name": "general",
            "channel_type": "PUBLIC",
            "participants": "",
        }
    ]

    mock_pool = MagicMock()
    mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

    mock_client = MagicMock()
    context = await get_relevant_context(
        client=mock_client,
        db_pool=mock_pool,
        user_prompt="When is the tournament?",
    )

    assert "user1: Tournament starts at 18:00" in context
    assert "relevance: 0.85" in context

@pytest.mark.asyncio
async def test_get_relevant_context_empty(monkeypatch):
    """Checks fallback message when no relevant messages are found."""
    monkeypatch.setattr("apps.ai.rag.generate_embedding", lambda client, text: [0.1, 0.2])

    mock_conn = AsyncMock()
    mock_conn.fetch.return_value = []

    mock_pool = MagicMock()
    mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

    context = await get_relevant_context(
        client=MagicMock(),
        db_pool=mock_pool,
        user_prompt="Any secret codes?",
    )

    assert context == "No semantically relevant messages found in database archives."

@pytest.mark.asyncio
async def test_store_message_with_embedding(monkeypatch):
    """Checks storing a message along with its semantic embedding."""
    fake_vector = [0.01, 0.02, 0.03]
    monkeypatch.setattr("apps.ai.rag.generate_embedding", lambda client, text: fake_vector)

    mock_conn = AsyncMock()
    mock_conn.fetchval.return_value = 42

    mock_pool = MagicMock()
    mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

    message_id = await store_message_with_embedding(
        client=MagicMock(),
        db_pool=mock_pool,
        sender_id="d60db698-1eee-4a20-93dc-fa34b5174718",
        channel_id=1,
        content="Hello Pong world",
    )

    assert message_id == 42
    mock_conn.fetchval.assert_called_once()

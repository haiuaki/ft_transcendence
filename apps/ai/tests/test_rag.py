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

def test_format_rag_prompt_with_history():
    """Checks that conversation history is formatted into the prompt."""
    context = "System context dummy"
    user_prompt = "And who won?"
    history = [
        {"role": "user", "content": "Did Alice play Bob?"},
        {"role": "assistant", "content": "Yes, they played yesterday."},
    ]

    result = format_rag_prompt(context=context, user_prompt=user_prompt, history=history)

    assert "Recent conversation history:" in result
    assert "User: Did Alice play Bob?" in result
    assert "Assistant: Yes, they played yesterday." in result
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
        user_id="00000000-0000-0000-0000-000000000001",
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
        user_id="00000000-0000-0000-0000-000000000001",
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


@pytest.mark.asyncio
async def test_get_relevant_context_only_searches_own_channels(monkeypatch):
    """Checks both searches are limited to the channels the user belongs to."""
    monkeypatch.setattr("apps.ai.rag.generate_embedding", lambda client, text: [0.1, 0.2])

    mock_conn = AsyncMock()
    mock_conn.fetch.side_effect = [
        [],  # messages still waiting for an embedding
        [{"username": "alice"}],  # usernames mentioned in the prompt
        [],  # semantic search
        [],  # search on the mentioned users' conversations
    ]
    mock_pool = MagicMock()
    mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

    user_id = "00000000-0000-0000-0000-000000000001"
    await get_relevant_context(
        client=MagicMock(),
        db_pool=mock_pool,
        user_prompt="What did alice say in her DMs?",
        user_id=user_id,
    )

    semantic_call, targeted_call = mock_conn.fetch.call_args_list[-2:]
    for query_call in (semantic_call, targeted_call):
        query, *params = query_call.args
        assert "FROM channel_members" in query
        assert user_id in params

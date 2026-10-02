import json
import pytest
from unittest.mock import AsyncMock, patch
from apps.ai.export_dataset import export_to_json

@pytest.mark.asyncio
async def test_export_to_json_creates_valid_file(tmp_path, monkeypatch):
    """Checks that export_to_json generates a valid JSON file with all tables."""
    # Change current working directory to tmp_path to avoid modifying root dataset.json
    monkeypatch.chdir(tmp_path)

    # Simulate asyncpg connection
    mock_conn = AsyncMock()

    def mock_fetch(query):
        if "FROM users" in query:
            return [{"id": "uuid-1234", "username": "alice", "email": "alice@test.com"}]
        if "FROM messages" in query:
            return [{"id": 1, "content": "Hello", "embedding": "[0.1, 0.2]"}]
        return []

    mock_conn.fetch.side_effect = mock_fetch

    with patch("apps.ai.export_dataset.asyncpg.connect", AsyncMock(return_value=mock_conn)):
        await export_to_json()

    output_file = tmp_path / "dataset.json"
    assert output_file.exists()

    with open(output_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "users" in data
    assert "friendships" in data
    assert "channels" in data
    assert "channel_members" in data
    assert "messages" in data
    assert len(data["users"]) == 1
    assert data["users"][0]["username"] == "alice"
    assert len(data["messages"]) == 1
    assert data["messages"][0]["content"] == "Hello"

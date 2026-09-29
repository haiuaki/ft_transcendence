import asyncpg

async def get_relevant_context(db_pool: asyncpg.Pool, channel_id: int | None = None, limit: int = 50) -> str:
    """Retrieves recent channel messages with author usernames from PostgreSQL."""
    query = """
        SELECT u.username, m.content, m.created_at
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE ($1::INT IS NULL OR m.channel_id = $1)
        ORDER BY m.created_at DESC
        LIMIT $2
    """
    async with db_pool.acquire() as connection:
        rows = await connection.fetch(query, channel_id, limit)

    if not rows:
        return "No recent message history found."

    # Reverse rows to maintain chronological order for the model
    ordered_rows = list(reversed(rows))
    context_lines = [
        f"[{r['created_at'].strftime('%H:%M')}] {r['username']}: {r['content']}"
        for r in ordered_rows
    ]
    return "Recent chat history:\n" + "\n".join(context_lines)


def format_rag_prompt(context: str, user_prompt: str) -> str:
    """Merges the extracted database context with the user prompt."""
    return (
        f"System context:\n{context}\n\n"
        f"User query: {user_prompt}\n\n"
        "Provide a helpful response based on the conversation history above."
    )

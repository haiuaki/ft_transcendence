import json
import asyncpg
from google import genai


def generate_embedding(client: genai.Client, text: str) -> list[float]:
    """Generates a 768-dimension semantic vector using Google text-embedding-004."""
    result = client.models.embed_content(
        model="text-embedding-004",
        contents=text,
    )
    return result.embeddings[0].values


async def get_relevant_context(
    client: genai.Client,
    db_pool: asyncpg.Pool,
    user_prompt: str,
    channel_id: int | None = None,
    limit: int = 5,
) -> str:
    """Retrieves messages with the highest semantic similarity to the prompt."""
    prompt_vector = generate_embedding(client, user_prompt)
    vector_json = json.dumps(prompt_vector)

    query = """
        SELECT 
            u.username, 
            m.content, 
            m.created_at,
            (m.embedding <=> $1::vector) AS distance
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.embedding IS NOT NULL
          AND ($2::INT IS NULL OR m.channel_id = $2)
        ORDER BY distance ASC
        LIMIT $3
    """

    async with db_pool.acquire() as connection:
        rows = await connection.fetch(query, vector_json, channel_id, limit)

    if not rows:
        return "No semantically relevant messages found in database archives."

    lines = [
        f"[{r['created_at'].strftime('%Y-%m-%d %H:%M')}] {r['username']}: {r['content']} (relevance: {1 - r['distance']:.2f})"
        for r in rows
    ]
    return "Relevant context extracted from archives:\n" + "\n".join(lines)


def format_rag_prompt(context: str, user_prompt: str) -> str:
    """Merges semantic context with the user query."""
    return (
        f"System context:\n{context}\n\n"
        f"User query: {user_prompt}\n\n"
        "Provide an accurate response based on the contextual information above."
    )

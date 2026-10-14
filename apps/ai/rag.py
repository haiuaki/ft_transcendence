import json
import asyncpg
from google import genai

def generate_embedding(client: genai.Client, text: str) -> list[float]:
    """Generates a 768-dimension semantic vector using Google gemini-embedding-001."""
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={"output_dimensionality": 768},
    )
    if not result.embeddings or not result.embeddings[0].values:
        raise ValueError("Failed to retrieve embeddings from Gemini API")
    return list(result.embeddings[0].values)


async def sync_pending_embeddings(client: genai.Client, db_pool: asyncpg.Pool) -> int:
    """Finds messages without embeddings and calculates them automatically."""
    query_select = """
        SELECT id, content 
        FROM messages 
        WHERE embedding IS NULL
        LIMIT 50
    """
    async with db_pool.acquire() as connection:
        rows = await connection.fetch(query_select)
        if not rows:
            return 0

        for r in rows:
            try:
                vector = generate_embedding(client, r["content"])
                vector_json = json.dumps(vector)
                await connection.execute(
                    "UPDATE messages SET embedding = $1::vector WHERE id = $2",
                    vector_json,
                    r["id"],
                )
            except Exception as e:
                print(f"Error computing embedding for message {r['id']}: {e}")
                continue

    return len(rows)


import re

async def get_relevant_context(
    client: genai.Client,
    db_pool: asyncpg.Pool,
    user_prompt: str,
    channel_id: int | None = None,
    limit: int = 15,
) -> str:
    """Retrieves messages with semantic similarity and channel/DM context."""
    # Ensure any recent messages without embeddings get vectorized
    try:
        await sync_pending_embeddings(client, db_pool)
    except Exception as e:
        print(f"Sync embeddings warning: {e}")

    prompt_vector = generate_embedding(client, user_prompt)
    vector_json = json.dumps(prompt_vector)

    async with db_pool.acquire() as connection:
        # Check if prompt specifically mentions any known usernames
        tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", user_prompt)
        mentioned_users: list[str] = []
        if tokens:
            user_rows = await connection.fetch(
                "SELECT username FROM users WHERE username = ANY($1)", tokens
            )
            mentioned_users = [r["username"] for r in user_rows]

        # 1. Semantic similarity query with channel metadata and DM participants
        semantic_query = """
            SELECT 
                m.id,
                u.username, 
                c.name AS channel_name,
                c.type AS channel_type,
                (
                    SELECT string_agg(u2.username, ', ')
                    FROM channel_members cm2
                    JOIN users u2 ON cm2.user_id = u2.id
                    WHERE cm2.channel_id = m.channel_id
                ) AS participants,
                m.content, 
                m.created_at,
                (m.embedding <=> $1::vector) AS distance
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            JOIN channels c ON m.channel_id = c.id
            WHERE m.embedding IS NOT NULL
              AND ($2::INT IS NULL OR m.channel_id = $2)
            ORDER BY distance ASC
            LIMIT $3
        """
        rows = await connection.fetch(semantic_query, vector_json, channel_id, limit)

        # 2. If specific users were mentioned (e.g. "DMs between ksilvest and user3"),
        # also retrieve their most recent direct messages/conversations so they are not missed
        targeted_rows = []
        if mentioned_users:
            targeted_query = """
                SELECT DISTINCT
                    m.id,
                    u.username,
                    c.name AS channel_name,
                    c.type AS channel_type,
                    (
                        SELECT string_agg(u2.username, ', ')
                        FROM channel_members cm2
                        JOIN users u2 ON cm2.user_id = u2.id
                        WHERE cm2.channel_id = m.channel_id
                    ) AS participants,
                    m.content,
                    m.created_at,
                    0.0 AS distance
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                JOIN channels c ON m.channel_id = c.id
                JOIN channel_members cm ON cm.channel_id = m.channel_id
                JOIN users member_u ON cm.user_id = member_u.id
                WHERE member_u.username = ANY($1)
                ORDER BY m.created_at DESC
                LIMIT 10
            """
            targeted_rows = await connection.fetch(targeted_query, mentioned_users)

    # Merge results without duplicates, prioritizing targeted user messages then semantic matches
    seen_ids = set()
    combined_rows = []
    for r in list(targeted_rows) + list(rows):
        row_id = r.get("id") if isinstance(r, dict) else getattr(r, "id", None)
        if row_id is not None:
            if row_id in seen_ids:
                continue
            seen_ids.add(row_id)
        combined_rows.append(r)

    if not combined_rows:
        return "No semantically relevant messages found in database archives."

    lines = []
    for r in combined_rows:
        c_type = r.get("channel_type") if isinstance(r, dict) else getattr(r, "channel_type", None)
        c_name = r.get("channel_name") if isinstance(r, dict) else getattr(r, "channel_name", "")
        participants = r.get("participants") if isinstance(r, dict) else getattr(r, "participants", "")

        if c_type == "DIRECT":
            channel_info = f"DM [participants: {participants}]"
        elif c_name:
            channel_info = f"Salon {c_name} ({c_type})"
        else:
            channel_info = ""

        prefix = f"({channel_info}) " if channel_info else ""
        created = r["created_at"].strftime("%Y-%m-%d %H:%M")
        dist = r["distance"]
        relevance_str = f"relevance: {1 - dist:.2f}" if dist > 0 else "direct match"
        lines.append(f"[{created}] {prefix}{r['username']}: {r['content']} ({relevance_str})")

    return "Relevant context extracted from archives:\n" + "\n".join(lines)


def format_rag_prompt(context: str, user_prompt: str) -> str:
    """Merges semantic context with the user query."""
    return (
        f"System context:\n{context}\n\n"
        f"User query: {user_prompt}\n\n"
        "Provide an accurate response based on the contextual information above."
    )


async def store_message_with_embedding(
    client: genai.Client,
    db_pool: asyncpg.Pool,
    sender_id: str,
    channel_id: int,
    content: str,
) -> int:
    """Calculates semantic vector and persists message to PostgreSQL."""
    vector = generate_embedding(client, content)
    vector_json = json.dumps(vector)

    query = """
        INSERT INTO messages (sender_id, channel_id, content, embedding)
        VALUES ($1::UUID, $2::INT, $3, $4::vector)
        RETURNING id
    """

    async with db_pool.acquire() as connection:
        message_id = await connection.fetchval(
            query, sender_id, channel_id, content, vector_json
        )

    return message_id

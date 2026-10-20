import asyncio
import json
import os
from pathlib import Path
import asyncpg
from dotenv import load_dotenv
from google import genai
from rag import generate_embedding

root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=root_env)


async def import_from_json(json_path: str = "dataset.json"):
    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    host = os.getenv("POSTGRES_HOST")
    port = os.getenv("POSTGRES_PORT")
    db = os.getenv("POSTGRES_DB")
    db_url = os.getenv("DATABASE_URL", f"postgresql://{user}:{password}@{host}:{port}/{db}")

    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else None

    # Load dataset.json
    path = Path(json_path)
    if not path.exists():
        print(f"File {json_path} not found.")
        return

    with open(path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    conn = await asyncpg.connect(db_url)
    try:
        # Import Users
        for u in dataset.get("users", []):
            await conn.execute(
                """
                INSERT INTO users (id, username, email, password_hash, is_verified, status)
                VALUES ($1::UUID, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE 
                SET username = EXCLUDED.username, is_verified = EXCLUDED.is_verified;
                """,
                u["id"],
                u["username"],
                u.get("email"),
                u.get("password_hash"),
                u.get("is_verified", True),
                u.get("status", "OFFLINE"),
            )
        print(f"Imported {len(dataset.get('users', []))} users.")

        # Import Channels
        for c in dataset.get("channels", []):
            await conn.execute(
                """
                INSERT INTO channels (id, name, type, password_hash, owner_id)
                VALUES ($1, $2, $3, $4, $5::UUID)
                ON CONFLICT (id) DO NOTHING;
                """,
                c["id"],
                c["name"],
                c.get("type", "PUBLIC"),
                c.get("password_hash"),
                c.get("owner_id"),
            )
        print(f"Imported {len(dataset.get('channels', []))} channels.")

        # Import Channel Members
        for m in dataset.get("channel_members", []):
            await conn.execute(
                """
                INSERT INTO channel_members (channel_id, user_id, role, status)
                VALUES ($1, $2::UUID, $3, $4)
                ON CONFLICT (channel_id, user_id) DO NOTHING;
                """,
                m["channel_id"],
                m["user_id"],
                m.get("role", "MEMBER"),
                m.get("status", "ACTIVE"),
            )
        print(f"Imported {len(dataset.get('channel_members', []))} channel members.")

        # Import Friendships
        for f in dataset.get("friendships", []):
            await conn.execute(
                """
                INSERT INTO friendships (user_id, friend_id, status)
                VALUES ($1::UUID, $2::UUID, $3)
                ON CONFLICT DO NOTHING;
                """,
                f["user_id"],
                f["friend_id"],
                f.get("status", "ACCEPTED"),
            )
        print(f"Imported {len(dataset.get('friendships', []))} friendships.")

        # Import Messages with Embeddings for RAG
        messages = dataset.get("messages", [])
        for msg in messages:
            content = msg["content"]
            embedding = msg.get("embedding")

            # Generate semantic embedding if missing and client is available
            if not embedding and client:
                try:
                    vec = generate_embedding(client, content)
                    embedding = json.dumps(vec)
                except Exception as e:
                    print(f"Warning: Failed to generate embedding for message '{content}': {e}")
                    embedding = None

            await conn.execute(
                """
                INSERT INTO messages (id, sender_id, channel_id, content, embedding)
                VALUES ($1, $2::UUID, $3, $4, $5::vector)
                ON CONFLICT (id) DO NOTHING;
                """,
                msg["id"],
                msg["sender_id"],
                msg["channel_id"],
                content,
                embedding,
            )
        print(f"Imported {len(messages)} messages with RAG embeddings.")

        # Resynchronize database sequences after inserting explicit IDs
        await conn.execute(
            """
            SELECT setval('messages_id_seq', COALESCE((SELECT MAX(id) FROM messages), 1));
            SELECT setval('channels_id_seq', COALESCE((SELECT MAX(id) FROM channels), 1));
            """
        )

        print("\nDataset successfully imported into PostgreSQL!")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(import_from_json())

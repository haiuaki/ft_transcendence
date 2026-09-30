import asyncio
import json
import os
from pathlib import Path
import asyncpg
from dotenv import load_dotenv

# Load .env explicitly from root of the project
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=root_env)


async def export_to_json():
    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    host = os.getenv("POSTGRES_HOST")
    port = os.getenv("POSTGRES_PORT")
    db = os.getenv("POSTGRES_DB")

    # If DATABASE_URL is set, use it, otherwise build from .env variables
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"

    print(f"Connecting to database '{db}' as user '{user}' on {host}:{port}...")

    # Connect to PostgreSQL
    conn = await asyncpg.connect(db_url)

    # Tables from init.sql
    tables = ["users", "friendships", "channels", "channel_members", "messages"]
    dataset = {}

    for table in tables:
        # Fetch rows (cast vector embedding to text)
        if table == "messages":
            query = "SELECT id, sender_id, channel_id, content, embedding::text, created_at FROM messages;"
        else:
            query = f"SELECT * FROM {table};"

        rows = await conn.fetch(query)
        dataset[table] = [dict(row) for row in rows]
        print(f"Exported {len(rows)} rows from {table}")

    await conn.close()

    # Save to dataset.json
    output_file = "dataset.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, default=str, indent=2, ensure_ascii=False)

    print(f"Dataset successfully saved to {output_file}!")


if __name__ == "__main__":
    asyncio.run(export_to_json())

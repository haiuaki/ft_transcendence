import os
import asyncpg

import asyncio

async def init_db_pool(max_retries: int = 15, delay: float = 1.0):
    """Creates a persistent connection pool to PostgreSQL with retry logic."""
    database_url = os.getenv("DATABASE_URL")
    postgres_host = os.getenv("POSTGRES_HOST")

    if database_url and postgres_host:
        database_url = database_url.replace("@localhost:", f"@{postgres_host}:").replace("@127.0.0.1:", f"@{postgres_host}:")
    elif not database_url:
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "")
        host = postgres_host or "database"
        port = os.getenv("POSTGRES_PORT", "5432")
        db = os.getenv("POSTGRES_DB", "transcendence")
        database_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"

    for attempt in range(1, max_retries + 1):
        try:
            return await asyncpg.create_pool(dsn=database_url)
        except Exception as e:
            if attempt == max_retries:
                raise e
            print(f"Waiting for database connection ({attempt}/{max_retries}): {e}")
            await asyncio.sleep(delay)

import os
import asyncpg

async def init_db_pool():
    """Creates a persistent connection pool to PostgreSQL."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("Missing DATABASE_URL environment variable")
    return await asyncpg.create_pool(dsn=database_url)

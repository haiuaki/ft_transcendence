import os
import asyncpg

async def init_db_pool():
    """Creates a persistent connection pool to PostgreSQL."""
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

    return await asyncpg.create_pool(dsn=database_url)

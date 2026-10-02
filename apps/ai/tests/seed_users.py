import asyncio
import os
from pathlib import Path
import asyncpg
from dotenv import load_dotenv

root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=root_env)

async def seed_users(count: int = 10):
    """Inserts pre-verified test users with password 'password123'."""
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "transcendence")
    db_url = os.getenv("DATABASE_URL", f"postgresql://{user}:{password}@{host}:{port}/{db}")

    # Valid bcrypt hash for password 'password123'
    password_hash = "$2a$14$RClFzJq4po6aw/rdFmFRO.HAUAKEh6V3bq0xgDxePGxed2D0KALeu"

    conn = await asyncpg.connect(db_url)
    try:
        # Create users
        for i in range(1, count + 1):
            username = f"user{i}"
            email = f"user{i}@test.com"
            await conn.execute(
                """
                INSERT INTO users (username, email, password_hash, is_verified, status)
                VALUES ($1, $2, $3, TRUE, 'ONLINE')
                ON CONFLICT (username) DO UPDATE 
                SET is_verified = TRUE, password_hash = EXCLUDED.password_hash;
                """,
                username,
                email,
                password_hash,
            )

        # Create friendships between some users
        await conn.execute(
            """
            INSERT INTO friendships (user_id, friend_id, status)
            SELECT u1.id, u2.id, 'ACCEPTED'
            FROM users u1, users u2
            WHERE u1.username = 'user1' AND u2.username IN ('user2', 'user3')
            ON CONFLICT DO NOTHING;
            """
        )

        print(f"[SUCCESS] {count} verified users created!")
        print("Login credentials:")
        print(" - Username: user1 (to user10)")
        print(" - Password: password123")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_users())

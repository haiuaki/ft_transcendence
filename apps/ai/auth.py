import os

import jwt
from fastapi import HTTPException, Request


async def current_user_id(request: Request) -> str:
    """Returns the id of the logged-in user, from the session token issued by the Go backend.

    The token is signed with the same JWT_SECRET, and carries the user's email
    (see sessionToken in apps/backend/src/services/auth/twofactor.go).
    """
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Log in to chat with the assistant.")

    try:
        claims = jwt.decode(
            authorization.removeprefix("Bearer "),
            os.getenv("JWT_SECRET", ""),
            algorithms=["HS256"],
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")

    email = claims.get("email")
    if not isinstance(email, str):
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")

    async with request.app.state.db_pool.acquire() as connection:
        user_id = await connection.fetchval(
            "SELECT id::text FROM users WHERE email = $1 AND deleted_at IS NULL", email
        )
    if user_id is None:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    return user_id

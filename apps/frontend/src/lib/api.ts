export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

// Throws when a request failed. Expected failures (wrong password, name taken...) come back as
// 200 {error, status} so the browser console stays clean, real failures keep their HTTP status
export const checkResponse = async (response: Response, fallback: string) => {
    if (!response.ok)
        throw new ApiError(await response.text() || fallback, response.status);
    if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.clone().json().catch(() => null);
        if (data && typeof data === "object" && !Array.isArray(data) && typeof data.error === "string")
            throw new ApiError(data.error || fallback, typeof data.status === "number" ? data.status : 400);
    }
    return response;
}

// True when a session token is malformed or past its `exp` claim, so it can be dropped
// without sending a request the backend would reject with a 401
export const isTokenExpired = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

import { checkResponse } from "@/src/lib/api";
const URL = "/api"

export interface DailyActivity {
    date: string; // YYYY-MM-DD
    time_spent_seconds: number;
    messages_sent: number;
}

export interface UpdateProfilePayload {
    username?: string;
    avatar_url?: string;
}

const userService = {
    login: async (email: string, password: string) => {
        const response = await fetch(URL + "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
            })
        })
        await checkResponse(response, "Failed to login user");
        return response.json();
    },
    signup: async (email: string, password: string, username: string) => {
        const response = await fetch(URL + "/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                username,
                password,
            })
        })
        await checkResponse(response, "Unable to create account.");
        const message = await response.text();
        return message;
    },
    verify: async (token: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/verify?token=" + encodeURIComponent(token), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        })
        await checkResponse(response, "Failed to verify user");
        return response.text();
    },
    profile: async (token: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/profile", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        await checkResponse(response, "Failed to get user");
        return response.json();
    },
    getUser: async (token: string, username: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!username.trim())
            throw new Error("Username is required")
        const response = await fetch(URL + "/users/" + encodeURIComponent(username), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        await checkResponse(response, "Failed to get user");
        return response.json();
    },
    edit: async (token: string, updates: UpdateProfilePayload) => {
        if (!token.trim())
            throw new Error("Token is required")

        const response = await fetch(URL + "/profile/edit", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        })

        await checkResponse(response, "Failed to update profile");
        const message = await response.text();

        return message;
    },
    getAnalytics: async (token: string, days: number): Promise<DailyActivity[]> => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/profile/analytics?days=" + days, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        await checkResponse(response, "Failed to get analytics");
        return response.json();
    },
    exportData: async (token: string): Promise<{ blob: Blob, filename: string }> => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/profile/export", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        await checkResponse(response, "Failed to export your data");
        const filename = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "ft_cluster-data.json";
        return { blob: await response.blob(), filename };
    },
    delete: async (token: string, username: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/profile/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ username })
        })
        await checkResponse(response, "Failed to delete account");
        const message = await response.text();
        return message;
    }
}

export default userService;

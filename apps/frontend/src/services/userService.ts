const URL = "/api"

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
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Failed to login user")
        }
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
        const message = await response.text();
        if (!response.ok)
            throw new Error(message || "Unable to create account.")
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
        if (!response.ok)
            throw new Error("Failed to verify user")
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
        if (!response.ok)
            throw new Error("Failed to get user")
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
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Failed to get user")
        }
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

        const message = await response.text();
        if (!response.ok)
            throw new Error(message || "Failed to update profile")

        return message;
    },
    delete: async (token: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/profile/delete", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        if (!response.ok)
            throw new Error("Failed to delete user")
        return response.text();
    }
}

export default userService;

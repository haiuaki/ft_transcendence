const URL = "/api"

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
        if (!response.ok)
        {
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
        const response = await fetch(URL + "/profile", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        if (!response.ok)
            throw new Error("Failed to get user")
        return response.json();
    }
}

export default userService;
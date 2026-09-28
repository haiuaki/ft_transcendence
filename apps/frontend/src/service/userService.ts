const URL = "/api"

const userService = {
    login: async (email: string, password: string) => {
        const response = await fetch(URL + "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password,
            })
        })
        if (!response.ok)
            throw new Error("Failed to login user")
        return response.json;
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
        if (!response.ok)
            throw new Error("Failed to create user")
        return response.json;
    }
}

export default userService;
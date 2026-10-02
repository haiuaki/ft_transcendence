const URL = "/api"

const roomService = {
    rooms: async (token: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/rooms", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok)
            throw new Error(await response.text() || "Failed to fetch rooms")
        const data = await response.json();
        return (data);
    },
    create: async (token: string, name: string, type: "PUBLIC" | "PRIVATE", password: string | undefined) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!name.trim())
            throw new Error("Name is required")
        const response = await fetch(URL + "/rooms/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name.trim(),
                type: type,
                password: password || undefined,
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new Error(message || `Failed to create ${name}`)
        return (message);
    },
    join: async (token: string, channelId: string, password: string | undefined) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!channelId.trim())
            throw new Error("Channel ID is required")
        const response = await fetch(URL + "/rooms/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                channel_id: channelId.trim(),
                password: password || undefined,
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new Error(message || `Failed to join room : ${channelId}`)
        return (message);
    },
    leave: async (token: string, channelId: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!channelId.trim())
            throw new Error("Channel ID is required")
        const response = await fetch(URL + "/rooms/leave", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                channel_id: channelId.trim(),
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new Error(message || `Failed to leave room : ${channelId}`)
        return (message);
    },
    delete: async (token: string, channelId: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!channelId.trim())
            throw new Error("Channel ID is required")
        const response = await fetch(URL + "/rooms/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                channel_id: channelId.trim(),
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new Error(message || `Failed to leave room : ${channelId}`)
        return (message);
    },
}

export default roomService;
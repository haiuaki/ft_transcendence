const URL = "/api"

export interface Message {
    id: number
    username: string
    content: string
    created_at: string
}

export interface DMResponse {
    channel_id: number
    message: string
}

const chatService = {
    startDM: async (token:string, targetUsername:string) => {
        if (!token.trim())
            throw new Error("Token is required");
        if (!targetUsername.trim())
            throw new Error("Username is required");
        const response = await fetch(URL + "/dms/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                target_username:targetUsername.trim()
            })
        })
        if (!response.ok)
            throw new Error(await response.text() || `Failed to open chat with ${targetUsername}`)
        return (await response.json());
    },
    messages: async (token:string, channelId:number, beforeId?:number) => {
        if (!token.trim())
            throw new Error("Token is required");
        if (!channelId)
            throw new Error("Channel ID is required");
        const params = new URLSearchParams({ room_id: String(channelId) })
        if (beforeId)
            params.set("before_id", String(beforeId));
        const response = await fetch(URL + "/dms/messages?" + params.toString(), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        if (!response.ok) 
            throw new Error(await response.text() || "Failed to fetch messages")
        return (await response.json());
    }
}

export default chatService;
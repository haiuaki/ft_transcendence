
const URL = "/api"

export interface Room {
    id: number;
    name: string;
    type: "PUBLIC" | "PRIVATE";
    model_type: string;
    max_capacity: number;
    owner_id?: string;
    active_members: number;
    created_at: string;
}

export interface RoomModel {
    id: string;
    name: string;
    max_capacity: number;
}


export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}


const roomService = {
    rooms: async (token: string): Promise<Room[]> => {
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
        const data: Room[] = await response.json();
        return (data);
    },
    models: async (token: string): Promise<RoomModel[]> => {
        const response = await fetch(URL + "/rooms/models", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok)
            throw new ApiError(await response.text() || "Failed to fetch models", response.status)
        return response.json();
    },

    create: async (token: string, name: string, type: "PUBLIC" | "PRIVATE", password: string | undefined, model: string) => {
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
                password: type === "PRIVATE" ? password : undefined,
                model: model,
            })
        });
        if (!response.ok)
            throw new ApiError(await response.text() || `Failed to create ${name}`, response.status)
        const data: { room_id: number } = await response.json();
        return (data.room_id);
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
                channel_id: Number(channelId.trim()),
                password: password || undefined,
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new ApiError(message || `Failed to join room : ${channelId}`, response.status)
        return (message);
    },
    // The members endpoint is only allowed for users currently seated in the room
    isSeated: async (token: string, channelId: string): Promise<boolean> => {
        const response = await fetch(URL + "/rooms/members?room_id=" + encodeURIComponent(channelId), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (response.status === 403)
            return false;
        if (!response.ok)
            throw new ApiError(await response.text() || "Failed to check room presence", response.status)
        return true;
    },
    leave: async (token: string, channelId: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!channelId.trim())
            throw new Error("Channel ID is required")
        const response = await fetch(URL + "/rooms/leave", {
            method: "POST",
            keepalive: true,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,

            },
            body: JSON.stringify({
                channel_id: Number(channelId.trim()),
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new ApiError(message || `Failed to leave room : ${channelId}`, response.status)
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
                channel_id: Number(channelId.trim()),
            })
        });
        const message = await response.text();
        if (!response.ok)
            throw new Error(message || `Failed to delete room : ${channelId}`)
        return (message);
    },
}

export default roomService;

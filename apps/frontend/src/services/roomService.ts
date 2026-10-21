import { ApiError, checkResponse } from "@/src/lib/api";

export { ApiError };

const URL = "/api"

export interface Room {
    id: number;
    name: string;
    type: "PUBLIC" | "PRIVATE";
    model_type: string;
    max_capacity: number;
    owner_id?: string;
    is_owner: boolean;
    active_members: number;
    created_at: string;
}

export interface RoomMember {
    username: string;
    avatar_url: string | null;
    role: string;
    joined_at: string;
}

export interface RoomModel {
    id: string;
    name: string;
    max_capacity: number;
}



const roomService = {
    members: async (token: string, roomId: string, signal?: AbortSignal): Promise<RoomMember[]> => {
        const response = await fetch(`${URL}/rooms/members?room_id=${encodeURIComponent(roomId)}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal,
            cache: "no-store",
        });
        await checkResponse(response, "Failed to fetch room members");
        return response.json();
    },
    rooms: async (token: string): Promise<Room[]> => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/rooms", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await checkResponse(response, "Failed to fetch rooms");
        const data: Room[] = await response.json();
        return (data);
    },
    models: async (token: string): Promise<RoomModel[]> => {
        const response = await fetch(URL + "/rooms/models", {
            headers: { Authorization: `Bearer ${token}` }
        });
        await checkResponse(response, "Failed to fetch models");
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
        await checkResponse(response, `Failed to create ${name}`);
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
        await checkResponse(response, `Failed to join room : ${channelId}`);
        const message = await response.text();
        return (message);
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
        await checkResponse(response, `Failed to leave room : ${channelId}`);
        const message = await response.text();
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
        await checkResponse(response, `Failed to delete room : ${channelId}`);
        const message = await response.text();
        return (message);
    },
}

export default roomService;

import { checkResponse } from "@/src/lib/api";
const URL = "/api"

export type FriendshipStatus = "friends" | "pending_sent" | "pending_received" | "none"

export interface Friend {
    username: string
    avatar_url: string | null
    status: string
}


const friendService = {
    friends: async (token: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/friends", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await checkResponse(response, "Failed to fetch friends");
        const data = await response.json();
        return (data);
    },
    add: async (token: string, friendUsername: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!friendUsername.trim())
            throw new Error("Username is required")
        const response = await fetch(URL + "/friends/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                friend_username: friendUsername.trim()
            })
        });
        await checkResponse(response, `Failed to add ${friendUsername}`);
        const message = await response.text();
        return (message);
    },
    remove: async (token: string, friendUsername: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!friendUsername.trim())
            throw new Error("Username is required")
        const response = await fetch(URL + "/friends/remove", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                friend_username: friendUsername.trim()
            })
        });
        await checkResponse(response, `Failed to remove ${friendUsername}`);
        const message = await response.text();
        return (message);
    },
    requests: async (token: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        const response = await fetch(URL + "/friends/requests", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await checkResponse(response, "Failed to fetch friends requests");
        const data = await response.json();
        return (data);
    },
    accept: async (token: string, friendUsername: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!friendUsername.trim())
            throw new Error("Username is required")
        const response = await fetch(URL + "/friends/requests/accept", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                friend_username: friendUsername.trim()
            })
        });
        await checkResponse(response, `Failed to accept ${friendUsername}`);
        const message = await response.text();
        return (message);
 
    },
    deny: async (token: string, friendUsername: string) => {
        if (!token.trim())
            throw new Error("Token is required")
        if (!friendUsername.trim())
            throw new Error("Username is required")
        const response = await fetch(URL + "/friends/requests/deny", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                friend_username: friendUsername.trim()
            })
        });
        await checkResponse(response, `Failed to deny ${friendUsername}`);
        const message = await response.text();
        return (message);
    }
}

export default friendService;
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

interface SocketProviderProps {
    children: ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SocketMessage = { type: string, payload: any }
type SocketListener = (message: SocketMessage) => void

interface SocketContextProps {
    isConnected: boolean,
    send: (message: SocketMessage) => boolean,
    subscribe: (listener: SocketListener) => () => void,
}

const RECONNECT_DELAY_MS = 3000;

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

// One WebSocket per logged-in tab, so the backend marks the user ONLINE
// for as long as the app is open, not only while a chat page is open
export const SocketProvider = ({ children }: SocketProviderProps) => {
    const { token, user, profile } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Set<SocketListener>>(new Set());
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!token) return;

        let closedByCleanup = false;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            const protocol = window.location.protocol === "https:" ? "wss" : "ws";
            const socket = new WebSocket(`${protocol}://${window.location.host}/api/ws`);
            socketRef.current = socket;

            socket.onopen = () => {
                socket.send(JSON.stringify({ type: "auth", payload: { token } }));
                setIsConnected(true);
            };
            socket.onmessage = (event) => {
                let data: SocketMessage;
                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }
                listenersRef.current.forEach((listener) => listener(data));
            };
            socket.onclose = () => {
                setIsConnected(false);
                if (socketRef.current === socket) socketRef.current = null;
                if (!closedByCleanup) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
            };
        };
        connect();

        return () => {
            closedByCleanup = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            socketRef.current?.close();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [token])

    const send = useCallback((message: SocketMessage) => {
        const socket = socketRef.current;
        if (socket?.readyState !== WebSocket.OPEN) return false;
        socket.send(JSON.stringify(message));
        return true;
    }, [])

    const subscribe = useCallback((listener: SocketListener) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, [])

    // Refresh our own profile when it was edited from another tab
    useEffect(() => {
        if (!token || !user) return;
        return subscribe((message) => {
            if (message.type === "user_updated" && message.payload.old_username === user.username)
                profile(token).catch(() => {});
        });
    }, [subscribe, token, user, profile])

    return (
        <SocketContext.Provider value={{ isConnected, send, subscribe }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext);

    if (!context)
        throw new Error("useSocket must be used within a SocketProvider")
    return context
}

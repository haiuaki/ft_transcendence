"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import userService from "../services/userService";
import twoFactorService, { TwoFactorSetupResponse } from "../services/twoFactorService";
import { FriendshipStatus } from "../services/friendService";
import { clearAiHistory } from "../lib/aiHistory";

interface AuthProviderProps {
    children: ReactNode
}

export interface User {
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
    created_at: string;
    total_messages_sent: number;
    cumulative_time_seconds: number;
    is_2fa_enabled?: boolean
    friendship_status?: FriendshipStatus
}

export type LoginResult = { twoFactorRequired: false } | { twoFactorRequired: true, tempToken: string };

interface AuthContextProps {
    login: (email: string, password: string) => Promise<LoginResult>,
    completeTwoFactor: (tempToken: string, code: string) => Promise<void>,
    logout: () => void,
    deleteProfile: (token: string, username: string) => Promise<void>,
    setupTwoFactor: () => Promise<TwoFactorSetupResponse>,
    enableTwoFactor: (code: string) => Promise<void>,
    disableTwoFactor: (code: string) => Promise<void>,
    isAuthenticated: boolean,
    profile: (token: string) => Promise<void>,
    isLoading: boolean,
    token: string | null,
    user: User | null,
}



const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isAuthenticated = token !== null;

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const connectedUser = await userService.profile(token);
                setToken(token);
                setUser(connectedUser);
            } catch {
                setToken(null)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }
        restoreSession();
    }, [])

    const profile = async (token: string) => {
        const data = await userService.profile(token);
        setUser(data);
    }

    const deleteProfile = async (token: string, username: string) => {
        await userService.delete(token, username);
        logout()
    }

    const setupTwoFactor = async () => {
        if (!token) throw new Error("Not authenticated");
        return twoFactorService.setup(token);
    }
    const startSession = async (newToken: string) => {
        const connectedUser = await userService.profile(newToken);
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(connectedUser);
    }

    const login = async (email: string, password: string): Promise<LoginResult> => {
        const data = await userService.login(email, password);
        if (data.two_factor_required)
            return { twoFactorRequired: true, tempToken: data.temp_token };
        await startSession(data.token);
        return { twoFactorRequired: false };
    }

    const completeTwoFactor = async (tempToken: string, code: string) => {
        const { token: newToken } = await twoFactorService.verify(tempToken, code);
        await startSession(newToken);
    }

    const enableTwoFactor = async (code: string) => {
        if (!token) throw new Error("Not authenticated");
        await twoFactorService.enable(token, code);
        await profile(token);
    }

    const disableTwoFactor = async (code: string) => {
        if (!token) throw new Error("Not authenticated");
        await twoFactorService.disable(token, code);
        await profile(token);
    }

    const logout = async () => {
        localStorage.removeItem("token");
        clearAiHistory();
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{ token, login, completeTwoFactor, logout, isAuthenticated, isLoading, profile, user, deleteProfile, enableTwoFactor, setupTwoFactor, disableTwoFactor }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context)
        throw new Error("Error")
    return context
}

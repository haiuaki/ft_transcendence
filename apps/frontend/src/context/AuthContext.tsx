"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import userService from "../services/userService";

interface AuthProviderProps {
    children: ReactNode
}

export interface User {
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
    created_at: string;
}

interface AuthContextProps {
    login: (email: string, password: string) => Promise<void>,
    logout: () => void,
    deleteProfile: (token: string) => Promise<void>,
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

    const login = async (email: string, password: string) => {
        const { token: newToken } = await userService.login(email, password);
        const connectedUser = await userService.profile(newToken);
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(connectedUser)
    }

    const profile = async (token: string) => {
        const data = await userService.profile(token);
        setUser(data);
    }

    const deleteProfile = async (token: string) => {
        await userService.delete(token);
        logout()
    }

    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{ token, login, logout, isAuthenticated, isLoading, profile, user, deleteProfile }}
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

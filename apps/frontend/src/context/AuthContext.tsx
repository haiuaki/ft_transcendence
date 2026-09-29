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
    login: (email:string, password:string) => Promise<void>,
    logout: () => void,
    isAuthenticated: boolean,
    profile: (token:string) => Promise<void>,
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
        const fetchUser = async (token: string) => {
            const connectedUser = await userService.profile(token);
            setUser(connectedUser);
        }
        const token = localStorage.getItem("token")
        setToken(token);
        fetchUser(token || "")
        setIsLoading(false)
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

    const logout = async () => {
        localStorage.removeItem("token");
    }

    return (
        <AuthContext.Provider
            value={{ token, login, logout, isAuthenticated, isLoading, profile, user }}
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
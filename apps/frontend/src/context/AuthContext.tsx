"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import userService from "../services/userService";
import { setuid } from "process";


interface AuthProviderProps {
    children: ReactNode
}

interface AuthContextProps {
    login: any,
    logout: any,
    isAuthenticated: any,
    user: any,
    isLoading: any,
    token: any,
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<{ id: number, email: string, username: string }>({ id: 0, email: "", username: "" })
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = localStorage.getItem("token")
        setToken(token);
        setIsLoading(false)
    })

    const login = async (email: string, password: string) => {
        const data = await userService.login(email, password);
        console.log("data : :::", data);
    }

    const isAuthenticated = () => {
        if (!token) return false;
        return true
    }

    const logout = async () => {
        localStorage.removeItem("token");
    }

    return (
        <AuthContext.Provider
            value={{ token, login, logout, isAuthenticated, isLoading, user }}
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
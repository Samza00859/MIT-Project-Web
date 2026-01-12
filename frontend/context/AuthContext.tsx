"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    "/introduction",
    "/Auth/login",
    "/Auth/register",
    "/Auth/verify-code",
    "/docs",
    "/view-docs",
    "/contact-public",
];

// Routes that should redirect to Generate if already logged in
const AUTH_ROUTES = ["/Auth/login", "/Auth/register"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = () => {
            try {
                const storedUser = localStorage.getItem("tradingagents_user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Error checking auth:", error);
                localStorage.removeItem("tradingagents_user");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Handle route protection
    useEffect(() => {
        if (isLoading) return;

        const isPublicRoute = PUBLIC_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(route + "/")
        );
        const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

        // If on auth route and already logged in, redirect to Generate
        if (isAuthRoute && user) {
            router.replace("/");
            return;
        }

        // If on protected route and not logged in, redirect to introduction
        if (!isPublicRoute && !user && pathname !== "/") {
            router.replace("/introduction");
            return;
        }

        // Special case: root path "/" - redirect to intro if not logged in
        if (pathname === "/" && !user) {
            router.replace("/introduction");
            return;
        }
    }, [isLoading, user, pathname, router]);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            // Mock login - in production, this would call your backend API
            // For now, we accept any email/password combination
            const mockUser: User = {
                email: email,
                name: email.split("@")[0],
            };

            setUser(mockUser);
            localStorage.setItem("tradingagents_user", JSON.stringify(mockUser));
            return true;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    }, []);

    const register = useCallback(async (
        name: string,
        email: string,
        password: string
    ): Promise<boolean> => {
        try {
            // Mock registration - in production, this would call your backend API
            const mockUser: User = {
                email: email,
                name: name,
            };

            setUser(mockUser);
            localStorage.setItem("tradingagents_user", JSON.stringify(mockUser));
            return true;
        } catch (error) {
            console.error("Registration error:", error);
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("tradingagents_user");
        router.push("/introduction");
    }, [router]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    }), [user, isLoading, login, register, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallbackPath?: string;
}

export default function ProtectedRoute({
    children,
    fallbackPath = "/introduction",
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(fallbackPath);
        }
    }, [isAuthenticated, isLoading, router, fallbackPath]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/70 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render protected content if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

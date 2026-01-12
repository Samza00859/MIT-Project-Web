"use client";

import { GenerationProvider } from "../context/GenerationContext";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <GenerationProvider>{children}</GenerationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

"use client";

import { GenerationProvider } from "../context/GenerationContext";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <LanguageProvider>
                    <GenerationProvider>{children}</GenerationProvider>
                </LanguageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

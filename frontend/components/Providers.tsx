"use client";

import { GenerationProvider } from "../context/GenerationContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <GenerationProvider>{children}</GenerationProvider>
        </ThemeProvider>
    );
}

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function normalizeTheme(value: unknown): ThemeMode | null {
  if (value === "dark" || value === "light") return value;
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Initialize state lazily to avoid useEffect setState warning
    if (typeof window !== "undefined") {
      try {
        const stored = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
        if (stored) return stored;
      } catch {
        // ignore
      }
    }
    return "dark";
  });

  // Keep DOM + storage in sync.
  useEffect(() => {
    try {
      document.body.setAttribute("data-theme", theme);
    } catch {
      // ignore
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}



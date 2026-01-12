"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  isDarkMode: boolean;
  hasMounted: boolean;
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
  // IMPORTANT: Always initialize with the same value on both server and client
  // to prevent hydration mismatch. We use "dark" as the default.
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [hasMounted, setHasMounted] = useState(false);

  // Read from localStorage only after hydration is complete
  useEffect(() => {
    try {
      const stored = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
      if (stored && stored !== theme) {
        setThemeState(stored);
      }
    } catch {
      // ignore
    }
    setHasMounted(true);
  }, []);

  // Keep DOM + storage in sync (only after mounted to avoid SSR issues)
  useEffect(() => {
    if (!hasMounted) return;
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
  }, [theme, hasMounted]);

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      hasMounted,
      setTheme,
      toggleTheme,
    }),
    [theme, hasMounted, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}



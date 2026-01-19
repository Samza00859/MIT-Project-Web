"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "th";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string; // Simple helper for components if they want to use it, though objects are common
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Default to 'en'
    const [language, setLanguageState] = useState<Language>("en");
    useEffect(() => {
        // Could persist to localStorage here
        const savedLang = localStorage.getItem("language");
        if (savedLang === "en" || savedLang === "th") {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
    };

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "th" : "en");
    };

    // Placeholder t function - complex translations usually handled in components or i18n libs
    const t = (key: string) => key;



    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

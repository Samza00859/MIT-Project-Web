"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";

export default function GlobalLanguageSwitcher() {
    const { language, toggleLanguage } = useLanguage();
    const { isDarkMode } = useTheme();
    // User requested to use this styled button on ALL pages.
    // We will render it globally.
    // If specific pages have conflicting elements (like Download button on View Docs),
    // those pages should position their elements relative to this global button.

    // Position: fixed top-6 right-6 (to match the request)
    return (
        <div className="fixed top-6 right-6 z-[100]">
            <button
                onClick={toggleLanguage}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border shadow-sm ${isDarkMode
                    ? 'border-white/20 text-white/80 bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-[#2df4c6] hover:text-[#2df4c6]'
                    : 'border-slate-200 text-slate-600 bg-white/50 backdrop-blur-md hover:bg-slate-100 hover:border-[#2563EB] hover:text-[#2563EB]'
                    }`}
            >
                <Languages size={18} />
                {language === 'en' ? 'EN' : 'TH'}
            </button>
        </div>
    );
}

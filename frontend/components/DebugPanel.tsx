import React from "react";

const TRANSLATIONS = {
    en: {
        systemStatus: "System Status",
        connected: "Connected",
        connecting: "Connecting",
        disconnected: "Disconnected"
    },
    th: {
        systemStatus: "สถานะระบบ",
        connected: "เชื่อมต่อแล้ว",
        connecting: "กำลังเชื่อมต่อ",
        disconnected: "ไม่ได้เชื่อมต่อ"
    }
};

interface DebugPanelProps {
    wsStatus: "connected" | "connecting" | "disconnected";
    isDarkMode: boolean;
    language?: "en" | "th";
}

export default function DebugPanel({ wsStatus, isDarkMode, language = "en" }: DebugPanelProps) {
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    const statusText = {
        connected: t.connected,
        connecting: t.connecting,
        disconnected: t.disconnected
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="text-[0.7rem] uppercase tracking-widest text-[#8b94ad]">
                {t.systemStatus}
            </div>
            <div className="flex items-center gap-2">
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${wsStatus === "connected"
                        ? "bg-[#2df4c6] shadow-[0_0_8px_#2df4c6]"
                        : wsStatus === "connecting"
                            ? "animate-pulse bg-[#f9a826]"
                            : "bg-[#ff4d6d]"
                        }`}
                />
                <span className={`text-sm font-medium ${isDarkMode ? "text-[#f8fbff]" : "text-[#1a202c]"}`}>
                    {statusText[wsStatus]}
                </span>
            </div>
        </div>
    );
}

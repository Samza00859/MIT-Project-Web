import React from "react";

interface DebugPanelProps {
    wsStatus: "connected" | "connecting" | "disconnected";
    isDarkMode: boolean;
}

export default function DebugPanel({ wsStatus, isDarkMode }: DebugPanelProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="text-[0.7rem] uppercase tracking-widest text-[#8b94ad]">
                System Status
            </div>
            <div className="flex items-center gap-2">
                <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${wsStatus === "connected"
                        ? "bg-[#2df4c6] shadow-[0_0_8px_#2df4c6]"
                        : wsStatus === "connecting"
                            ? "animate-pulse bg-[#f9a826]"
                            : "bg-[#ff4d6d]"
                        }`}
                />
                <span className={`text-sm font-medium capitalize ${isDarkMode ? "text-[#f8fbff]" : "text-[#1a202c]"}`}>
                    {wsStatus}
                </span>
            </div>
        </div>
    );
}

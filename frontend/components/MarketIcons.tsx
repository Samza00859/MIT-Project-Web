import React from "react";

// --- Market Icons & Info ---
export const MARKET_INFO: Record<
    string,
    { label: string; icon: React.ReactNode }
> = {
    US: {
        label: "US Stocks",
        icon: (
            <svg
                viewBox="0 0 32 24"
                className="w-6 h-4 rounded-sm shadow-sm overflow-hidden"
            >
                <rect width="32" height="24" fill="#B22234" />
                <path
                    d="M0 4h32M0 8h32M0 12h32M0 16h32M0 20h32"
                    stroke="white"
                    strokeWidth="2"
                />
                <rect width="14" height="13" fill="#3C3B6E" />
                <path
                    d="M2 2h10M2 4.25h10M2 6.5h10M2 8.75h10M2 11h10"
                    stroke="white"
                    strokeWidth="1"
                    strokeDasharray="1 1"
                />
            </svg>
        ),
    },
    TH: {
        label: "Thai Stocks",
        icon: (
            <svg
                viewBox="0 0 32 24"
                className="w-6 h-4 rounded-sm shadow-sm overflow-hidden"
            >
                <rect width="32" height="24" fill="#F4F5F8" />
                <rect y="0" width="32" height="4" fill="#ED1C24" />
                <rect y="20" width="32" height="4" fill="#ED1C24" />
                <rect y="8" width="32" height="8" fill="#241D4E" />
            </svg>
        ),
    },
    CN: {
        label: "China Stocks",
        icon: (
            <svg
                viewBox="0 0 32 24"
                className="w-6 h-4 rounded-sm shadow-sm overflow-hidden"
            >
                <rect width="32" height="24" fill="#EE1C25" />
                <circle cx="5" cy="6" r="3" fill="#FFFF00" />
                <circle cx="10" cy="3" r="1" fill="#FFFF00" />
                <circle cx="12" cy="5" r="1" fill="#FFFF00" />
                <circle cx="12" cy="8" r="1" fill="#FFFF00" />
                <circle cx="10" cy="10" r="1" fill="#FFFF00" />
            </svg>
        ),
    },
    GOLD: {
        label: "Gold / Precious Metals",
        icon: (
            <svg viewBox="0 0 32 24" className="w-6 h-4 rounded-sm shadow-sm">
                <rect width="32" height="24" fill="#1e293b" rx="2" />
                <circle
                    cx="16"
                    cy="12"
                    r="7"
                    fill="#FFD700"
                    stroke="#B8860B"
                    strokeWidth="2"
                />
                <path
                    d="M16 8v8M14 10h2a2 2 0 1 1 0 4h-2"
                    stroke="#B8860B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        ),
    },
};

// Market Selector Component
interface MarketSelectorProps {
    selectedMarket: string;
    showMarketSelector: boolean;
    setShowMarketSelector: (show: boolean) => void;
    setSelectedMarket: (market: string) => void;
    isDarkMode: boolean;
}

export function MarketSelector({
    selectedMarket,
    showMarketSelector,
    setShowMarketSelector,
    setSelectedMarket,
    isDarkMode,
}: MarketSelectorProps) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowMarketSelector(!showMarketSelector)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isDarkMode
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
            >
                {MARKET_INFO[selectedMarket]?.icon}
                <span className="text-sm font-medium">
                    {MARKET_INFO[selectedMarket]?.label}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${showMarketSelector ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {showMarketSelector && (
                <div
                    className={`absolute top-full left-0 mt-2 w-56 rounded-xl border shadow-xl z-50 ${isDarkMode
                            ? "bg-[#1a2035] border-white/10"
                            : "bg-white border-gray-200"
                        }`}
                >
                    {Object.entries(MARKET_INFO).map(([key, { label, icon }]) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSelectedMarket(key);
                                setShowMarketSelector(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedMarket === key
                                    ? "bg-[#2df4c6]/10 text-[#2df4c6]"
                                    : isDarkMode
                                        ? "hover:bg-white/5"
                                        : "hover:bg-gray-50"
                                }`}
                        >
                            {icon}
                            <span className="font-medium">{label}</span>
                            {selectedMarket === key && (
                                <svg
                                    className="w-4 h-4 ml-auto"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

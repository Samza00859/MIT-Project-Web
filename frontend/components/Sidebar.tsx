"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/image/Logo.png";

interface NavItem {
    id: string;
    icon: string;
    label: string;
    href: string;
}

interface SidebarProps {
    activeId: string;
    isDarkMode: boolean;
    toggleTheme: () => void;
    children?: ReactNode;
    navItems?: NavItem[];
    hideThemeToggle?: boolean;
}

export default function Sidebar({
    activeId,
    isDarkMode,
    toggleTheme,
    children,
    navItems,
    hideThemeToggle = false,
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const [isTelegramModalOpen, setIsTelegramModalOpen] = React.useState(false);
    const [telegramChatId, setTelegramChatId] = React.useState("");
    const [telegramStatus, setTelegramStatus] = React.useState<"idle" | "saving" | "success" | "error" | "waiting">("idle");
    const [pairingMessage, setPairingMessage] = React.useState("");

    // Auto-Pairing Logic
    const handleAutoPair = async () => {
        setTelegramStatus("saving");
        setPairingMessage("Checking for messages...");

        try {
            let apiUrl = "http://localhost:8000";
            if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
                const protocol = window.location.protocol;
                const host = window.location.hostname;
                apiUrl = `${protocol}//${host}:8000`;
            }

            const res = await fetch(`${apiUrl}/api/settings/telegram/pair`, {
                method: "POST",
            });

            const data = await res.json();

            if (data.status === "success") {
                setTelegramChatId(data.chat_id);
                setTelegramStatus("success");
                setPairingMessage("Connected! Chat ID: " + data.chat_id);
                setTimeout(() => {
                    setIsTelegramModalOpen(false);
                    setTelegramStatus("idle");
                    setPairingMessage("");
                }, 2000);
            } else if (data.status === "waiting") {
                setTelegramStatus("waiting");
                setPairingMessage(data.message);
            } else {
                setTelegramStatus("error");
                setPairingMessage("Error: " + (data.detail || "Unknown error"));
            }
        } catch (e: any) {
            console.error(e);
            setTelegramStatus("error");
            setPairingMessage("Connection failed.");
        }
    };

    // Manual Save Logic
    const handleSaveTelegram = async () => {
        if (!telegramChatId.trim()) return;

        setTelegramStatus("saving");
        try {
            // Determine API URL
            let apiUrl = "http://localhost:8000";
            if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
                const protocol = window.location.protocol;
                const host = window.location.hostname;
                apiUrl = `${protocol}//${host}:8000`;
            }

            const res = await fetch(`${apiUrl}/api/settings/telegram`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: telegramChatId }),
            });

            if (!res.ok) throw new Error("Failed to save");

            setTelegramStatus("success");
            setTimeout(() => {
                setIsTelegramModalOpen(false);
                setTelegramStatus("idle");
                setTelegramChatId("");
            }, 1000);
        } catch (e) {
            console.error(e);
            setTelegramStatus("error");
        }
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className={`fixed left-4 top-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors md:hidden ${isDarkMode
                    ? "bg-[#1e2330] border-gray-700 text-white"
                    : "bg-white border-gray-200 text-gray-600"
                    }`}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col gap-8 border-r transition-all duration-300 ease-in-out md:sticky md:translate-x-0 overflow-y-auto overflow-x-hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    } ${isCollapsed ? "w-20 px-2 py-8" : "w-[280px] px-6 py-8"
                    } ${isDarkMode
                        ? "border-white/5 bg-gradient-to-b from-[#0f1216] to-[#141922]"
                        : "border-gray-200 bg-white"
                    }`}
            >
                {/* Collapse Button (Desktop Only or inside drawer) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute right-2 top-2 z-50 hidden md:flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all ${isDarkMode
                        ? "bg-[#1e2330] border-gray-700 text-white hover:bg-[#2df4c6] hover:text-black"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-[#2df4c6] hover:text-black"
                        }`}
                >
                    {isCollapsed ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    )}
                </button>

                {/* Mobile Close Button (inside drawer) */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className={`absolute right-4 top-4 md:hidden text-gray-400 hover:text-white`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-center"} ${isCollapsed ? "py-2" : "py-2"}`}>
                    <div
                        className={`relative flex items-center justify-center flex-shrink-0 transition-all duration-200 rounded-2xl overflow-hidden ${
                            isCollapsed ? "h-12 w-12" : "h-20 w-full max-w-[240px]"
                        } ${
                            isDarkMode
                                ? ""
                                : "bg-[#020617] shadow-[0_12px_35px_rgba(15,23,42,0.25)] border border-gray-200/60"
                        }`}
                    >
                        <Image
                            src={Logo}
                            alt="TradingAgents Logo"
                            width={240}
                            height={80}
                            className="object-contain w-full h-full"
                            priority
                        />
                    </div>
                </div>

                {/* Divider Line */}
                <div className={`border-t ${isDarkMode ? "border-white/10" : "border-gray-200"} ${isCollapsed ? "mx-2" : "mx-4"}`} />

                <nav className="flex flex-col gap-2.5">
                    {(navItems || [
                        { id: "intro", icon: "👋", label: "Intro", href: "/introduction" },
                        { id: "generate", icon: "🌐", label: "Generate", href: "/" },
                        { id: "history", icon: "📜", label: "History", href: "/history" },
                        { id: "contact", icon: "📬", label: "Contact", href: "/contact" },
                        { id: "docs", icon: "📄", label: "View Docs", href: "/view-docs" },
                    ]).map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)} // Close on click
                            className={`flex items-center gap-3 rounded-xl py-3 text-[0.95rem] transition-colors ${isCollapsed ? "justify-center px-2" : "px-4"
                                } ${activeId === item.id
                                    ? "bg-[#2df4c6] text-[#03161b] font-semibold shadow-md"
                                    : isDarkMode
                                        ? "text-[#8b94ad] hover:bg-[#2df4c6]/10 hover:text-[#f8fbff]"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                        </Link>
                    ))}

                    {/* Telegram Button */}
                    <button
                        onClick={() => setIsTelegramModalOpen(true)}
                        className={`flex items-center gap-3 rounded-xl py-3 text-[0.95rem] transition-colors ${isCollapsed ? "justify-center px-2" : "px-4"
                            } ${isDarkMode
                                ? "text-[#8b94ad] hover:bg-[#2df4c6]/10 hover:text-[#f8fbff]"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                        title={isCollapsed ? "Connect Telegram" : undefined}
                    >
                        <span className="text-lg flex-shrink-0">📱</span>
                        {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Connect Telegram</span>}
                    </button>
                </nav>

                {!hideThemeToggle && (
                    <div className={`mt-auto flex items-center ${isCollapsed ? "justify-center flex-col gap-4" : "justify-between"} text-sm text-[#8b94ad]`}>
                        {!isCollapsed && <span>{isDarkMode ? "Dark mode" : "Light mode"}</span>}
                        <label className="relative inline-block h-5 w-10 cursor-pointer flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={!isDarkMode}
                                onChange={toggleTheme}
                                className="peer sr-only"
                            />
                            <span className="absolute inset-0 rounded-full bg-[#394054] transition-all before:absolute before:bottom-[2px] before:left-[2px] before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all peer-checked:bg-[#00d18f] peer-checked:before:translate-x-5"></span>
                        </label>
                    </div>
                )}

                {children && (
                    <div className={`mt-6 border-t border-white/5 pt-4 text-[0.85rem] ${isCollapsed ? "hidden" : "block"}`}>
                        {children}
                    </div>
                )}
            </aside>

            {/* Telegram Modal */}
            {isTelegramModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all ${isDarkMode ? "bg-[#1e2330] border border-gray-700" : "bg-white"
                        }`}>
                        <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Connect Telegram
                        </h3>

                        {/* Streamlined Flow */}
                        <div className="space-y-6">
                            {/* Step 1: Open Bot */}
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    1. Click link to open bot and press <b>Start</b>
                                </p>
                                <a
                                    href="https://t.me/TradingAgentsBot?start=connect"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm"
                                >
                                    <span>👉 Open Bot @TradingAgentsBot</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </a>
                            </div>

                            {/* Step 2: Auto-detect */}
                            <div className="">
                                <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    2. Come back here and click Connect
                                </p>
                                <button
                                    onClick={handleAutoPair}
                                    disabled={telegramStatus === "saving"}
                                    className={`w-full py-3 rounded-xl font-bold text-md transition-all flex items-center justify-center gap-2 ${telegramStatus === "success"
                                        ? "bg-green-500 text-white"
                                        : telegramStatus === "error"
                                            ? "bg-red-500 text-white"
                                            : "bg-[#2df4c6] text-[#03161b] hover:bg-[#20dcb0]"
                                        }`}
                                >
                                    {telegramStatus === "saving" && <span className="animate-spin">⌛</span>}
                                    {telegramStatus === "saving" ? "Connecting..." : telegramStatus === "success" ? "Connected!" : telegramStatus === "error" ? "Try Again" : "Connect Automatically"}
                                </button>
                                {pairingMessage && (
                                    <p className={`mt-2 text-center text-xs ${telegramStatus === "error" ? "text-red-400" :
                                        telegramStatus === "waiting" ? "text-yellow-400" :
                                            telegramStatus === "success" ? "text-green-400" : "text-gray-400"
                                        }`}>
                                        {pairingMessage}
                                    </p>
                                )}
                            </div>

                            {/* Advanced / Manual Toggle (Optional, maybe hidden or small) */}
                            <div className="pt-4 border-t border-gray-700/50">
                                <details className="text-xs group">
                                    <summary className={`cursor-pointer list-none flex items-center gap-2 ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                                        <span>Manual Connect (Advanced)</span>
                                        <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </summary>
                                    <div className="pt-3 space-y-3">
                                        <input
                                            type="text"
                                            value={telegramChatId}
                                            onChange={(e) => setTelegramChatId(e.target.value)}
                                            placeholder="Enter Chat ID Manually"
                                            className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2df4c6] ${isDarkMode
                                                ? "bg-[#0c111f] text-white"
                                                : "bg-gray-50 text-gray-900 border border-gray-200"
                                                }`}
                                        />
                                        <button
                                            onClick={handleSaveTelegram}
                                            className={`w-full py-2 rounded-lg text-xs font-medium border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-white/5" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            Save ID Manually
                                        </button>
                                    </div>
                                </details>
                            </div>
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setIsTelegramModalOpen(false)}
                                className={`text-xs ${isDarkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


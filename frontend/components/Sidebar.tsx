"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/image/Logo.png";
import LogoBlack from "@/image/Logo_black.png";

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

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className={`fixed left-4 top-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors md:hidden ${isDarkMode
                    ? "bg-[#1e2330] border-gray-700 text-white"
                    : "bg-white border-[#E2E8F0] text-[#64748B]"
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
                className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col gap-8 border-r transition-all duration-300 ease-in-out md:sticky md:top-0 md:inset-y-auto md:h-auto md:max-h-screen md:translate-x-0 overflow-y-auto overflow-x-hidden no-scrollbar ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    } ${isCollapsed ? "w-20 px-2 py-8" : "w-[280px] px-6 py-8"
                    } ${isDarkMode
                        ? "border-white/5 bg-gradient-to-b from-[#0f1216] to-[#141922]"
                        : "border-[#E2E8F0] bg-[#F1F5F9]"
                    }`}
            >
                {/* Collapse Button (Desktop Only or inside drawer) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute right-2 top-2 z-50 hidden md:flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all ${isDarkMode
                        ? "bg-[#1e2330] border-gray-700 text-white hover:bg-[#2df4c6] hover:text-black"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#2563EB] hover:text-white"
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
                            isCollapsed ? "h-12 w-12" : "h-32 w-full max-w-[360px]"
                        }`}
                    >
                        <Image
                            src={isDarkMode ? Logo : LogoBlack}
                            alt="TradingAgents Logo"
                            width={360}
                            height={128}
                            className="object-contain w-full h-full"
                            priority
                        />
                    </div>
                </div>

                {/* Divider Line */}
                <div className={`border-t -mt-2 ${isDarkMode ? "border-white/10" : "border-[#E2E8F0]"} ${isCollapsed ? "mx-2" : "mx-4"}`} />

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
                                    ? isDarkMode 
                                    ? "bg-[#2df4c6] text-[#03161b] font-semibold shadow-md"
                                        : "bg-[#2563EB] text-white font-semibold shadow-md"
                                    : isDarkMode
                                        ? "text-[#8b94ad] hover:bg-[#2df4c6]/10 hover:text-[#f8fbff]"
                                        : "text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                                }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                        </Link>
                    ))}

                </nav>

                {!hideThemeToggle && (
                    <div className={`mt-auto flex items-center ${isCollapsed ? "justify-center flex-col gap-4" : "justify-between"} text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                        {!isCollapsed && <span>{isDarkMode ? "Dark mode" : "Light mode"}</span>}
                        <label className="relative inline-block h-5 w-10 cursor-pointer flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={!isDarkMode}
                                onChange={toggleTheme}
                                className="peer sr-only"
                            />
                            <span className={`absolute inset-0 rounded-full transition-all before:absolute before:bottom-[2px] before:left-[2px] before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all ${isDarkMode 
                                ? "bg-[#394054] peer-checked:bg-[#00d18f] peer-checked:before:translate-x-5"
                                : "bg-[#CBD5E1] peer-checked:bg-[#2563EB] peer-checked:before:translate-x-5"
                            }`}></span>
                        </label>
                    </div>
                )}

                {children && (
                    <div className={`mt-6 border-t ${isDarkMode ? "border-white/5" : "border-[#E2E8F0]"} pt-4 text-[0.85rem] ${isCollapsed ? "hidden" : "block"}`}>
                        {children}
                    </div>
                )}
            </aside>

        </>
    );
}


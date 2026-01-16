"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import Logo from "@/image/Logo.png";
import LogoBlack from "@/image/Logo_black.png";
import { useTheme } from "@/context/ThemeContext";
import { useGeneration } from "@/context/GenerationContext";
import { useAuth } from "@/context/AuthContext";
import DebugPanel from "./DebugPanel";

interface NavItem {
    id: string;
    icon: string;
    label: string;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: "generate", icon: "🌐", label: "Generate", href: "/" },
    { id: "history", icon: "📜", label: "History", href: "/history" },
    // { id: "contact", icon: "📬", label: "Contact", href: "/contact" },
    { id: "docs", icon: "📄", label: "View Docs", href: "/view-docs" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isDarkMode, toggleTheme, hasMounted } = useTheme();
    const { wsStatus } = useGeneration();
    const { user, isAuthenticated, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        setIsMobileOpen(false);
    };

    // Determine active ID based on pathname
    const activeId = React.useMemo(() => {
        if (pathname === "/") return "generate";
        if (pathname.startsWith("/history")) return "history";
        if (pathname === "/contact") return "contact";
        if (pathname.startsWith("/view-docs")) return "docs";
        return "";
    }, [pathname]);

    React.useEffect(() => {
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState) {
            setIsCollapsed(savedState === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebarCollapsed", String(newState));
    };

    // Hide sidebar on introduction, docs, and all contact pages
    if (pathname === "/introduction" || pathname === "/docs" || pathname === "/contact-public" || pathname === "/Auth/register" || pathname === "/Auth/login") return null;

    // Prevent hydration mismatch by not rendering until theme is determined
    if (!hasMounted) return null;

    return (
        <>
            {/* Mobile Menu Button - Visible mainly when sidebar is hidden/collapsed on mobile */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className={`fixed left-4 top-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors lg:hidden ${isDarkMode
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
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col gap-8 border-r transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:inset-y-auto lg:h-auto lg:max-h-screen lg:translate-x-0 overflow-y-auto overflow-x-hidden no-scrollbar ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    } ${isCollapsed ? "w-20 px-2 py-8" : "w-64 px-4 py-8"
                    } ${isDarkMode
                        ? "border-white/5 bg-linear-to-b from-[#0f1216] to-[#141922]"
                        : "border-[#E2E8F0] bg-[#F1F5F9]"
                    }`}
            >
                {/* Collapse Button (Desktop Only or inside drawer) */}
                <button
                    onClick={toggleCollapse}
                    className={`absolute right-2 top-2 z-50 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all ${isDarkMode
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
                    className={`absolute right-4 top-4 lg:hidden text-gray-400 hover:text-white`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-center"} ${isCollapsed ? "py-2" : "py-2"}`}>
                    <Link
                        href="/introduction"
                        onClick={() => setIsMobileOpen(false)}
                        className={`relative flex items-center justify-center shrink-0 transition-all duration-200 rounded-2xl overflow-hidden hover:opacity-80 ${isCollapsed ? "h-12 w-12" : "h-32 w-full max-w-[360px]"
                            }`}
                        title="Go to Introduction"
                    >
                        <Image
                            src={isDarkMode ? Logo : LogoBlack}
                            alt="TradingAgents Logo"
                            width={360}
                            height={128}
                            className="object-contain w-full h-full"
                            priority
                        />
                    </Link>
                </div>

                {/* Divider Line */}
                <div className={`border-t -mt-2 ${isDarkMode ? "border-white/10" : "border-[#E2E8F0]"} ${isCollapsed ? "mx-2" : "mx-4"}`} />

                <nav className="flex flex-col gap-2.5">
                    {NAV_ITEMS.map((item) => (
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
                            <span className="text-lg shrink-0">{item.icon}</span>
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                        </Link>
                    ))}

                </nav>

                {/* User Info & Logout - Only show when authenticated */}
                {isAuthenticated && (
                    <div className={`mt-6 border-t ${isDarkMode ? "border-white/10" : "border-[#E2E8F0]"} pt-4`}>
                        {/* User Info */}
                        {!isCollapsed && user && (
                            <div className={`mb-3 px-2 text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                                <span>Welcome, </span>
                                <span className="font-medium">{user.name || user.email}</span>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 rounded-xl py-3 w-full text-[0.95rem] transition-colors ${isCollapsed ? "justify-center px-2" : "px-4"
                                } ${isDarkMode
                                    ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    : "text-red-500 hover:bg-red-50 hover:text-red-600"
                                }`}
                            title={isCollapsed ? "Logout" : undefined}
                        >
                            <span className="text-lg shrink-0">🚪</span>
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
                        </button>
                    </div>
                )}

                {/* Dark mode toggle - normal position for non-Generate pages */}
                {pathname !== "/" && (
                    <div className={`mt-auto flex items-center ${isCollapsed ? "justify-center flex-col gap-4" : "justify-between"} text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                        {!isCollapsed && <span>{isDarkMode ? "Dark mode" : "Light mode"}</span>}
                        <label className="relative inline-block h-5 w-10 cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={!isDarkMode}
                                onChange={toggleTheme}
                                className="peer sr-only"
                            />
                            <div className={`absolute inset-0 rounded-full transition-all flex items-center justify-between px-1 ${isDarkMode
                                ? "bg-[#394054] peer-checked:bg-[#00d18f]"
                                : "bg-[#CBD5E1] peer-checked:bg-[#2563EB]"
                                } after:absolute after:bottom-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5`}>
                                <Moon size={10} className={`text-white transition-opacity ${!isDarkMode ? 'opacity-0' : 'opacity-100'} absolute right-1`} />
                                <Sun size={10} className={`text-white transition-opacity ${isDarkMode ? 'opacity-0' : 'opacity-100'} absolute left-1`} />
                            </div>
                        </label>
                    </div>
                )}

                {/* For Generate page: Dark mode toggle right above the divider line */}
                {pathname === "/" && (
                    <>
                        <div className={`mt-auto flex items-center ${isCollapsed ? "justify-center flex-col gap-4" : "justify-between"} text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                            {!isCollapsed && <span>{isDarkMode ? "Dark mode" : "Light mode"}</span>}
                            <label className="relative inline-block h-5 w-10 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={!isDarkMode}
                                    onChange={toggleTheme}
                                    className="peer sr-only"
                                />
                                <div className={`absolute inset-0 rounded-full transition-all flex items-center justify-between px-1 ${isDarkMode
                                    ? "bg-[#394054] peer-checked:bg-[#00d18f]"
                                    : "bg-[#CBD5E1] peer-checked:bg-[#2563EB]"
                                    } after:absolute after:bottom-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5`}>
                                    <Moon size={10} className={`text-white transition-opacity ${!isDarkMode ? 'opacity-0' : 'opacity-100'} absolute right-1`} />
                                    <Sun size={10} className={`text-white transition-opacity ${isDarkMode ? 'opacity-0' : 'opacity-100'} absolute left-1`} />
                                </div>
                            </label>
                        </div>
                        {/* Divider line + Debug Panel */}
                        <div className={`mt-0 border-t ${isDarkMode ? "border-white/5" : "border-[#E2E8F0]"} pt-4 text-[0.85rem] ${isCollapsed ? "hidden" : "block"}`}>
                            <DebugPanel wsStatus={wsStatus} isDarkMode={isDarkMode} />
                        </div>
                    </>
                )}
            </aside>

        </>
    );
}


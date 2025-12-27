"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ContactContent from "@/components/ContactContent";
import { useTheme } from "@/context/ThemeContext";

export default function ContactPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const toggleCard = (index: number) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedCards(newExpanded);
    };

    return (
        <div className={`flex h-screen w-full font-['Inter','Montserrat',sans-serif] transition-colors duration-300 relative overflow-x-hidden overflow-y-auto no-scrollbar ${isDarkMode ? "bg-[#0d1117] text-[#e8eefc]" : "bg-[#F6F9FC] text-[#0F172A]"}`}>
            {/* Data Stream Background Depth Layer - Dark Mode */}
            {isDarkMode && (
                <>
                    <div className="pointer-events-none absolute inset-0 data-stream-layer" />
                    <div className="pointer-events-none absolute inset-0 data-stream-grid" />
                    <div className="pointer-events-none absolute inset-0 data-stream-lines" />
                    <style jsx>{`
                        .data-stream-layer {
                            background: 
                                radial-gradient(circle at 20% 30%, rgba(45, 244, 198, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 50% 50%, rgba(94, 92, 255, 0.06) 0%, transparent 60%);
                            background-size: 400% 400%;
                            animation: dataStreamMove 25s ease-in-out infinite;
                            opacity: 0.5;
                        }
                        .data-stream-grid {
                            background-image: 
                                repeating-linear-gradient(
                                    0deg,
                                    transparent,
                                    transparent 98px,
                                    rgba(45, 244, 198, 0.03) 98px,
                                    rgba(45, 244, 198, 0.03) 100px
                                ),
                                repeating-linear-gradient(
                                    90deg,
                                    transparent,
                                    transparent 98px,
                                    rgba(56, 189, 248, 0.03) 98px,
                                    rgba(56, 189, 248, 0.03) 100px
                                );
                            animation: dataStreamGridMove 40s linear infinite;
                            opacity: 0.3;
                        }
                        .data-stream-lines {
                            background-image: 
                                linear-gradient(45deg, transparent 30%, rgba(45, 244, 198, 0.1) 50%, transparent 70%),
                                linear-gradient(-45deg, transparent 30%, rgba(56, 189, 248, 0.1) 50%, transparent 70%);
                            background-size: 300% 300%;
                            animation: dataStreamLines 15s ease-in-out infinite;
                            opacity: 0.4;
                        }
                        @keyframes dataStreamMove {
                            0%, 100% {
                                background-position: 0% 0%, 0% 0%, 0% 0%;
                            }
                            33% {
                                background-position: 100% 50%, 50% 100%, 50% 50%;
                            }
                            66% {
                                background-position: 50% 100%, 100% 50%, 100% 0%;
                            }
                        }
                        @keyframes dataStreamGridMove {
                            0% {
                                transform: translate(0, 0);
                            }
                            100% {
                                transform: translate(100px, 100px);
                            }
                        }
                        @keyframes dataStreamLines {
                            0%, 100% {
                                background-position: 0% 0%, 100% 100%;
                            }
                            50% {
                                background-position: 100% 100%, 0% 0%;
                            }
                        }
                    `}</style>
                </>
            )}
            
            {/* Light Mode Background - Subtle blue gradient */}
            {!isDarkMode && (
                <>
                    <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]" />
                    <div 
                        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.03),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.04),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.05),transparent_60%)] animate-[gradient_18s_ease_infinite] opacity-60 transform-gpu scale-[1.8] origin-center"
                    />
                    <style jsx>{`
                        @keyframes gradient {
                            0%, 100% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                        }
                    `}</style>
                </>
            )}

            {/* Sidebar */}
            <Sidebar
                activeId="contact"
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                navItems={[
                    { id: "intro", icon: "👋", label: "Intro", href: "/introduction" },
                    { id: "generate", icon: "🌐", label: "Generate", href: "/" },
                    { id: "history", icon: "📜", label: "History", href: "/history" },
                    { id: "contact", icon: "📬", label: "Contact", href: "/contact" },
                    { id: "docs", icon: "📄", label: "View Docs", href: "/view-docs" },
                ]}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0 relative z-10 md:ml-[280px]">
            <ContactContent
                isDarkMode={isDarkMode}
                expandedCards={expandedCards}
                onToggleCard={toggleCard}
            />
            </div>
        </div>
    );
}

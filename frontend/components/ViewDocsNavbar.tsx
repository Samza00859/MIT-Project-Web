"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { Download, Menu, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ViewDocsNavbarProps {
    activeSection: string;
    onSelectItem: (id: string) => void;
    language: 'EN' | 'TH';
    onToggleLanguage: () => void;
}

export default function ViewDocsNavbar({ activeSection, onSelectItem, language, onToggleLanguage }: ViewDocsNavbarProps) {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollContainer = document.getElementById('main-content') || window;
            // @ts-ignore
            const scrollTop = scrollContainer.scrollTop !== undefined ? scrollContainer.scrollTop : (window.pageYOffset || document.documentElement.scrollTop);
            setIsScrolled(scrollTop > 20);
        };

        const scrollContainer = document.getElementById('main-content') || window;
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'introduction', label: 'How it Works' },
        { id: 'role-specialization', label: 'Agent Roles' },
        { id: 'tutorials-header', label: 'Tutorial' },
    ];

    const handleNavClick = (id: string) => {
        onSelectItem(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav
            className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled || isMobileMenuOpen
                ? isDarkMode ? "bg-[#0b0e14]/90 backdrop-blur-md border-b border-white/10" : "bg-white/90 backdrop-blur-md border-b border-slate-200"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2">
                        <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            TRADINGAGENTS<span className="text-[#2df4c6]">.AI</span>
                        </span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`text-sm font-medium transition-colors hover:text-[#2df4c6] ${activeSection === item.id || (item.id === 'introduction' && ['introduction', 'related-work', 'agent-workflow'].includes(activeSection)) || (item.id === 'role-specialization' && ['role-specialization', 'agent-team', 'research-team', 'trader-team'].includes(activeSection))
                                ? "text-[#2df4c6]"
                                : isDarkMode ? "text-slate-300" : "text-slate-600"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}

                    <a
                        href="https://arxiv.org/pdf/2412.20138"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105 ${isDarkMode
                            ? "bg-[#2df4c6] text-[#020617] hover:bg-[#26dcb2] shadow-[0_0_20px_rgba(45,244,198,0.3)]"
                            : "bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/30"
                            }`}
                    >
                        <Download size={16} />
                        Download Docs
                    </a>



                    {/* Language Toggle */}
                    <button
                        onClick={onToggleLanguage}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors border ${isDarkMode
                            ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                            : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                            }`}
                    >
                        {language === 'EN' ? 'EN' : 'TH'}
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-slate-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className={`md:hidden absolute top-20 left-0 right-0 border-b p-4 flex flex-col gap-4 shadow-xl ${isDarkMode ? "bg-[#020617] border-white/10" : "bg-white border-slate-200"
                    }`}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`text-left py-2 font-medium ${isDarkMode ? "text-slate-300 hover:text-[#2df4c6]" : "text-slate-600 hover:text-blue-600"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <a
                        href="https://arxiv.org/pdf/2412.20138"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold bg-[#2df4c6] text-[#020617]"
                    >
                        <Download size={16} />
                        Download Docs
                    </a>
                </div>
            )}
        </nav>
    );
}

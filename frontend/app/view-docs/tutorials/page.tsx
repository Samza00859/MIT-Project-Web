"use client";

import React, { useState, useEffect } from 'react';
import {
    Home, Aperture, Users, FileText, Menu, LineChart,
    Play, Lock, Activity, BarChart2, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

// --- 1. ปรับหัวข้อ (SECTIONS) ให้ครบ 7 หัวข้อตามภาพ Tutorials ---
const SECTIONS = [
    {
        id: 'create-account',
        title: 'Creating an Account',
        content: 'Step-by-step guide to setting up your TradingAgent profile. Learn how to verify your identity, set up two-factor authentication (2FA), and link your preferred exchange API keys securely.'
    },
    {
        id: 'dashboard',
        title: 'Dashboard Overview',
        content: 'Navigate through the command center. We explain every widget on your main dashboard, including real-time portfolio value, active agent status, and recent system notifications.'
    },
    {
        id: 'use-agents',
        title: 'How to Use the Trading Agents',
        content: 'Master the core functionality. Learn how to select specific agent roles (Analyst, Risk Manager, Executor), configure their individual parameters, and start your first multi-agent session.'
    },
    {
        id: 'backtest',
        title: 'How to Run a Backtest',
        content: 'Validate your strategies before risking real capital. This tutorial covers selecting historical datasets, setting timeframes, and interpreting the simulation results to refine your approach.'
    },
    {
        id: 'decisions',
        title: 'Understanding Trade Decisions',
        content: 'Why did the agent buy? Analyze the "Explainable AI" logs to see the specific market signals, sentiment scores, and risk calculations that triggered a specific trade execution.'
    },
    {
        id: 'metrics',
        title: 'Performance Metrics Explained',
        content: 'Go beyond just ROI. Understand advanced metrics like Sharpe Ratio, Maximum Drawdown, Alpha, and Beta to truly evaluate the risk-adjusted performance of your trading bots.'
    },
    {
        id: 'risks',
        title: 'Managing Risks and Alerts',
        content: 'Safety first. Configure stop-loss limits, max daily drawdown caps, and set up instant email or Telegram alerts to keep you informed of any critical market anomalies.'
    },
];

import Sidebar from '../../../components/Sidebar';

export default function TutorialsPage() {
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    // --- Scroll Spy Logic ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 300; // Offset ให้ Active ก่อนถึงหัวข้อ

            for (const section of SECTIONS) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section.id);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 120; // เผื่อความสูง Header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#111317] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>

            {/* ================= LEFT SIDEBAR (Global) ================= */}
            <Sidebar
                activeId="docs"
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            >
                <div
                    className="mb-3 flex cursor-pointer select-none items-center gap-2 font-medium text-[#8b94ad] hover:text-[#f8fbff]"
                    onClick={() => setIsDebugCollapsed(!isDebugCollapsed)}
                >
                </div>
            </Sidebar>

            {/* ================= MIDDLE SIDEBAR (Menu) ================= */}
            <aside className="sticky top-0 h-screen w-[280px] shrink-0 bg-[#161616] flex flex-col pt-24 px-8 border-r border-zinc-800/50 hidden md:flex z-40 overflow-y-auto custom-scrollbar">
                <h2 className="text-xl font-bold text-white mb-8 tracking-tight pl-2">
                    Tutorials
                </h2>

                <div className="relative flex flex-col gap-1 pl-2 pb-20">
                    {/* Main Hierarchy Line */}
                    <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-zinc-800"></div>

                    {SECTIONS.map((section) => (
                        <MenuItem
                            key={section.id}
                            label={section.title}
                            active={activeSection === section.id}
                            onClick={() => scrollToSection(section.id)}
                        />
                    ))}
                </div>
            </aside>

            {/* ================= MAIN CONTENT (Scrollable) ================= */}
            <main className="flex-1 flex flex-col bg-[#161616] relative min-h-screen min-w-0">

                {/* Sticky Header */}
                <div className="sticky top-0 bg-[#161616]/95 backdrop-blur-sm pt-8 pb-4 px-12 z-30 border-b border-zinc-800/30 flex items-center gap-4">
                    <Link href="/view-docs" className="text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <p className="text-zinc-500 font-medium text-sm flex items-center gap-2">
                        View Docs <span className="text-zinc-700">/</span> <span className="text-white">Tutorials</span>
                    </p>
                </div>

                <div className="px-12 max-w-4xl w-full pb-60 pt-8">
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Tutorials
                    </h1>
                    <p className="text-zinc-400 mb-16 text-lg">
                        Master the TradingAgent platform with our comprehensive video guides.
                    </p>

                    {/* Loop Render Sections */}
                    <div className="flex flex-col gap-32">
                        {SECTIONS.map((section, index) => (
                            <section key={section.id} id={section.id} className="scroll-mt-40 animate-in fade-in duration-700">

                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    {section.title}
                                </h2>

                                <p className="text-zinc-400 leading-relaxed text-lg mb-8 max-w-2xl">
                                    {section.content}
                                </p>

                                {/* Video Placeholder Box */}
                                <div className="w-full aspect-video bg-[#0f0f0f] border border-zinc-800 rounded-xl flex flex-col items-center justify-center group cursor-pointer hover:border-zinc-600 hover:bg-[#1a1a1a] transition-all relative overflow-hidden shadow-2xl">

                                    {/* Decorative Background */}
                                    <div className="absolute inset-0 opacity-20"
                                        style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                                    </div>

                                    {/* Play Button */}
                                    <div className="w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-300 shadow-2xl z-10 backdrop-blur-sm border border-white/5">
                                        <Play size={32} fill="currentColor" className="ml-1 text-white group-hover:text-black transition-colors" />
                                    </div>

                                    {/* Duration Badge */}
                                    <div className="absolute bottom-4 right-4 bg-black/80 text-xs font-mono px-2 py-1 rounded text-zinc-300 border border-zinc-800">
                                        {/* Mock Duration */}
                                        {['05:20', '12:45', '08:30', '15:10', '06:15', '10:00', '07:45'][index]}
                                    </div>

                                    <p className="mt-6 text-zinc-500 font-medium text-sm z-10 group-hover:text-zinc-300 transition-colors">
                                        Watch Tutorial
                                    </p>
                                </div>

                                {/* Additional Resources / Steps */}
                                <div className="mt-8 pt-6 border-t border-zinc-800/50">
                                    <h4 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                                        <Activity size={16} className="text-cyan-500" /> Key Takeaways
                                    </h4>
                                    <ul className="space-y-2 text-zinc-500 text-sm list-disc pl-5">
                                        <li>Understand the core mechanics of {section.title.toLowerCase()}.</li>
                                        <li>Best practices for implementation and error handling.</li>
                                        <li>Advanced configuration options for power users.</li>
                                    </ul>
                                </div>

                            </section>
                        ))}
                    </div>

                </div>

            </main>
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function NavIcon({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
    return (
        <div className={`cursor-pointer p-2.5 rounded-xl transition-all duration-200 relative ${active ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}>
            {active && (<div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full"></div>)}
            {icon}
        </div>
    );
}

function MenuItem({ label, active = false, onClick }: { label: string, active?: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`relative pl-6 py-3 text-sm cursor-pointer transition-all duration-200 select-none group
      ${active ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}
    `}>

            {/* Active Indicator Line (White overlay on gray line) */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] bg-white rounded-full transition-all duration-200
        ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}></div>

            {label}
        </div>
    );
}
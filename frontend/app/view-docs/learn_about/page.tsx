"use client";

import React, { useState, useEffect } from 'react';
import {
    Home, Aperture, Users, FileText, Menu, LineChart,
    Search, TrendingUp, Globe, BarChart, BookOpen, BrainCircuit, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

// --- 1. ข้อมูลเนื้อหา (Sections) ของหน้า Learn About ---
const SECTIONS = [
    {
        id: 'fundamentals',
        title: 'Fundamentals Analysis',
        icon: <BarChart size={32} className="text-cyan-400" />,
        role: 'Financial Statement Processor',
        content: 'The Fundamentals Analyst Agent parses quarterly earnings reports (10-K, 10-Q) and balance sheets. It calculates key ratios like P/E, PEG, and Debt-to-Equity to determine the intrinsic value of an asset compared to its current market price.'
    },
    {
        id: 'sentiment',
        title: 'Sentiment Analyst',
        icon: <BrainCircuit size={32} className="text-purple-400" />,
        role: 'Social & Market Mood Scraper',
        content: 'This agent monitors social media platforms (X, Reddit) and financial forums in real-time. Using NLP models (BERT/RoBERTa), it quantifies the "fear and greed" index of the market, detecting viral trends before they impact price action.'
    },
    {
        id: 'news',
        title: 'News Analyst',
        icon: <Globe size={32} className="text-green-400" />,
        role: 'Macro Event Interpreter',
        content: 'Connected to global newswires (Bloomberg, Reuters), the News Analyst filters noise to find high-impact events. It distinguishes between scheduled economic calendar releases and unexpected "Black Swan" events, adjusting risk parameters instantly.'
    },
    {
        id: 'technical',
        title: 'Technical Analyst',
        icon: <TrendingUp size={32} className="text-yellow-400" />,
        role: 'Chart Pattern Recognition',
        content: 'Specializing in price action, this agent utilizes indicators like RSI, MACD, and Bollinger Bands. It identifies support/resistance zones and executes trades based on probability setups like Breakouts, Reversals, and Trend Following.'
    },
    {
        id: 'researcher',
        title: 'Researcher',
        icon: <Search size={32} className="text-pink-400" />,
        role: 'Long-term Strategy Optimizer',
        content: 'The Researcher operates on a slower timeframe, backtesting new strategies against decades of historical data. It constantly evolves the meta-strategy, suggesting weight adjustments for the other agents based on changing market regimes.'
    },
];

import Sidebar from '../../../components/Sidebar';

export default function LearnAboutPage() {
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    // --- Scroll Spy Logic ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 250;

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
            const headerOffset = 120;
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
                <h2 className="text-sm font-bold text-gray-100 mb-6 tracking-wide uppercase text-zinc-400">
                    TradingAgent Multi Agent
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
                        View Docs <span className="text-zinc-700">/</span> <span className="text-white">Learn about our Agent</span>
                    </p>
                </div>

                <div className="px-12 max-w-4xl w-full pb-60 pt-8">
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Learn about our Agent
                    </h1>
                    <p className="text-zinc-400 mb-16 text-lg">
                        Meet the specialized agents powering our autonomous trading system.
                    </p>

                    {/* Loop Render Sections */}
                    <div className="flex flex-col gap-16">
                        {SECTIONS.map((section) => (
                            <section key={section.id} id={section.id} className="scroll-mt-40 animate-in fade-in duration-700">

                                {/* Agent Card Design */}
                                <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-8 hover:border-zinc-600 transition-colors shadow-lg relative overflow-hidden group">

                                    {/* Decorative Gradient Blob */}
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all"></div>

                                    <div className="flex items-start gap-6 relative z-10">
                                        {/* Icon Box */}
                                        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-inner shrink-0">
                                            {section.icon}
                                        </div>

                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">
                                                {section.title}
                                            </h2>
                                            <p className="text-cyan-400 text-sm font-mono mb-4 uppercase tracking-wider">
                                                Role: {section.role}
                                            </p>

                                            <p className="text-zinc-300 leading-relaxed text-lg mb-6">
                                                {section.content}
                                            </p>

                                            {/* Mock Stats / Tags */}
                                            <div className="flex flex-wrap gap-3">
                                                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 border border-zinc-700">High Frequency</span>
                                                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 border border-zinc-700">Low Latency</span>
                                                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 border border-zinc-700">AI Driven</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Skeleton Text (เนื้อหาเพิ่มเติมแบบในรูปภาพ) */}
                                <div className="space-y-3 mt-8 opacity-30 px-4">
                                    <div className="h-2 bg-zinc-700 rounded-full w-full"></div>
                                    <div className="h-2 bg-zinc-700 rounded-full w-[94%]"></div>
                                    <div className="h-2 bg-zinc-700 rounded-full w-[60%]"></div>
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

            {/* Active Indicator Line */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] bg-white rounded-full transition-all duration-200
        ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}></div>

            {label}
        </div>
    );
}
"use client";

import React, { useState, useEffect } from 'react';
import {
    Home, Aperture, Users, FileText, Menu, LineChart,
    Search, TrendingUp, Globe, BarChart, BookOpen, BrainCircuit, Activity, ChevronLeft, Newspaper, Zap, Shield, Scale, MinusCircle, TrendingDown, Gavel, ArrowLeftRight, Flame
} from 'lucide-react';
import Link from 'next/link';

// --- 1. ข้อมูลเนื้อหา (Teams & Agents) ---
const TEAMS = [
    {
        id: 'analyst-team',
        title: 'Analyst Team',
        description: 'The foundation. specialized agents collect and process raw data from multiple sources—quantitative, fundamental, technical, and sentiment—to create a unified view of the market.',
        agents: [
            {
                id: 'market-data',
                title: 'Market Data Agent',
                icon: <BarChart size={32} className="text-cyan-400" />,
                role: 'Market Aggregator',
                content: 'Fetches raw financial data including historical prices, trading volumes, and key financial ratios. Ensures all analysis is based on the most accurate numbers.'
            },
            {
                id: 'fundamental',
                title: 'Fundamental Agent',
                icon: <BookOpen size={32} className="text-blue-400" />,
                role: 'Fundamental Aggregator',
                content: 'Parses 10-K/10-Q reports and balance sheets. It calculates intrinsic value metrics to determine if an asset is mispriced relative to its financial health.'
            },
            {
                id: 'news',
                title: 'News Agent',
                icon: <Newspaper size={32} className="text-green-400" />,
                role: 'News Aggregator',
                content: 'Monitors global newswires/RSS feeds. It filters noise to find high-impact economic events and corporate announcements that could move markets.'
            },
            {
                id: 'social',
                title: 'Social Agent',
                icon: <Globe size={32} className="text-purple-400" />,
                role: 'Social Media Aggregator',
                content: 'Quantifies market psychology by scanning social platforms. It detects accumulating fear or greed trends that often precede price reversals.'
            }
        ]
    },
    {
        id: 'research-team',
        title: 'Research Team',
        description: 'The war room. Here, the Research Manager (CIO) moderates a fierce debate between the Bull and Bear to form a balanced initial thesis.',
        agents: [
            {
                id: 'bull',
                title: 'Bull Researcher',
                icon: <TrendingUp size={32} className="text-green-500" />,
                role: 'Growth Strategist',
                content: 'The Optimist. Focuses purely on upside catalysts, growth potential, and reasons why the asset could outperform.'
            },
            {
                id: 'bear',
                title: 'Bear Researcher',
                icon: <TrendingDown size={32} className="text-red-500" />,
                role: 'Risk Strategist',
                content: 'The Skeptic. Focuses on valuation gaps, macro headwinds, and flaws in the bullish thesis to expose downside risks.'
            }
        ]
    },
    {
        id: 'trader-team',
        title: 'Trader',
        description: 'The execution arm. This agent takes the final plan and executes the trade with precision.',
        agents: [
            {
                id: 'trader',
                title: 'Trader',
                icon: <ArrowLeftRight size={32} className="text-yellow-500" />,
                role: 'Executor',
                content: 'The Trader. It listens to the Bull and Bear arguments, synthesizing the conflicting data into a coherent "Investment Plan" (Buy/Sell/Hold).'
            }
        ]
    },
    {
        id: 'risk-team',
        title: 'Risk Team',
        description: 'The stress test. Before execution, the trade must survive the "Council of Risks" where the Risk Manager adjudicates between conflicting risk perspectives.',
        agents: [
            {
                id: 'risky-agent',
                title: 'Aggressive Risk Agent',
                icon: <Flame size={32} className="text-red-400" />,
                role: 'Risk Taker',
                content: 'Advocates for maximizing exposure when conviction is high. It argues for wider stops and larger sizing to capture full trend potential.'
            },
            {
                id: 'safe-agent',
                title: 'Conservative Risk Agent',
                icon: <Shield size={32} className="text-green-400" />,
                role: 'Capital Preserver',
                content: 'Prioritizes capital preservation above all. It argues for tight stops, small position sizes, and hedging against volatility.'
            },
            {
                id: 'neutral-agent',
                title: 'Neutral Risk Agent',
                icon: <Scale size={32} className="text-gray-400" />,
                role: 'Balancer',
                content: 'Provides the middle ground, balancing the aggressive profit-seeking against conservative fears to find optimal risk-adjusted entries.'
            }
        ]
    },
    {
        id: 'manager-team',
        title: 'Manager',
        description: 'The manager. Once the plan is approved and risk-adjusted, the Trader Agent executes the order with surgical precision.',
        agents: [
            {
                id: 'manager',
                title: 'Manager',
                icon: <Gavel size={32} className="text-blue-500" />,
                role: 'Decision Maker',
                content: 'The Manager. Takes the final "Risk-Adjusted Plan" and executes the trade, managing entry timing and order types to minimize slippage.'
            }
        ]
    }
];

import Sidebar from '../../../components/Sidebar';

export default function LearnAboutPage() {
    const [activeTeamId, setActiveTeamId] = useState(TEAMS[0].id);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    // --- Scroll Spy Logic ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;

            for (const team of TEAMS) {
                const element = document.getElementById(team.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveTeamId(team.id);
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
            const elementRect = element.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            // Calculate position to center the element
            const offsetPosition = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveTeamId(id);
        }
    };

    return (
        <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#111317] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>

            {/* ================= LEFT SIDEBAR (Global) ================= */}
            <Sidebar
                activeId="docs"
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                navItems={[
                    { id: "intro", icon: "👋", label: "Intro", href: "/introduction" },
                    { id: "generate", icon: "🌐", label: "Generate", href: "/" },
                    { id: "contact", icon: "📬", label: "Contact", href: "/contact" },
                    { id: "docs", icon: "📄", label: "View Docs", href: "/view-docs" },
                ]}
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
                    Agent Teams
                </h2>

                <div className="relative flex flex-col gap-1 pl-2 pb-20">
                    {/* Main Hierarchy Line */}
                    <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-zinc-800"></div>

                    {TEAMS.map((team) => (
                        <MenuItem
                            key={team.id}
                            label={team.title}
                            active={activeTeamId === team.id}
                            onClick={() => scrollToSection(team.id)}
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
                        View Docs <span className="text-zinc-700">/</span> <span className="text-white">Our Agents</span>
                    </p>
                </div>

                <div className="px-12 max-w-5xl w-full pb-60 pt-8">
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Our Agents
                    </h1>
                    <p className="text-zinc-400 mb-16 text-lg">
                        Meet the specialized teams powering our autonomous trading system.
                    </p>

                    {/* Loop Render Teams */}
                    <div className="flex flex-col gap-24">
                        {TEAMS.map((team) => (
                            <section key={team.id} id={team.id} className="scroll-mt-40 animate-in fade-in duration-700">

                                {/* Team Header */}
                                <div className="mb-10">
                                    <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                                        <span className="text-cyan-500">
                                            {team.id === 'aggregation-team' && <Users size={28} />}
                                            {team.id === 'research-team' && <BrainCircuit size={28} />}
                                            {team.id === 'risk-team' && <Activity size={28} />}
                                        </span>
                                        {team.title}
                                    </h2>
                                    <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl border-l-2 border-zinc-700 pl-4">
                                        {team.description}
                                    </p>
                                </div>

                                {/* Agents Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {team.agents.map((agent) => (
                                        <div key={agent.id} className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-colors shadow-lg relative overflow-hidden group flex flex-col h-full">

                                            {/* Decorative Gradient Blob */}
                                            <div className="absolute -right-16 -top-16 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>

                                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-700 shadow-inner">
                                                    {agent.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white leading-tight">
                                                        {agent.title}
                                                    </h3>
                                                    <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider mt-1">
                                                        {agent.role}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-zinc-400 text-sm leading-relaxed relative z-10 flex-1">
                                                {agent.content}
                                            </p>

                                        </div>
                                    ))}
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
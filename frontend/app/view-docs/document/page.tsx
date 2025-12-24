"use client";

import React, { useState, useEffect } from 'react';
import {
    Home,
    Aperture,
    Users,
    FileText,
    Menu,
    LineChart,
    ChevronLeft,
    Download
} from 'lucide-react';
import Link from 'next/link';


// --- 1. Content Data (Consolidated from sub-pages) ---
const SECTIONS = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: (
            <div className="space-y-4">
                <p>
                    Significant progress has been made in automated problem-solving using societies of agents powered by large language models (LLMs). While single-agent systems handle specific tasks well, complex financial markets require collaborative dynamics similar to real-world trading firms.
                </p>
                <p>
                    <strong>TradingAgents</strong> proposes a novel stock trading framework inspired by professional trading firms, featuring LLM-powered agents in specialized roles. By simulating a dynamic, collaborative trading environment, this framework aims to replicate the multi-faceted decision-making process of successful investment houses.
                </p>
                <p>
                    This comprehensive multi-agent system moves beyond simple data gathering, integrating diverse perspectives from fundamental analysis to technical indicators, debating insights, and synthesizing them into informed trading decisions.
                </p>
            </div>
        )
    },
    {
        id: 'related-work',
        title: 'Related Work',
        content: (
            <div className="space-y-4">
                <p>
                    In the domain of financial trading, efforts have historically focused on quantitative models and, more recently, single-agent LLM systems.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Single-Agent Systems:</strong> Often limited to handling specific, isolated tasks such as sentiment analysis of news headlines or pattern recognition in price charts.
                    </li>
                    <li>
                        <strong>Traditional Multi-Agent Frameworks:</strong> Previous attempts have largely operated independently, with agents gathering data in silos without true collaborative synthesis.
                    </li>
                    <li>
                        <strong>TradingAgents Approach:</strong> Unlike predecessors, this framework emphasizes the <em>collaborative dynamics</em> found in institutional firms. It introduces structured debates and hierarchical decision-making, allowing agents to challenge and refine each other's insights before a trade is executed.
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'role-specialization',
        title: 'Role Specialization',
        content: (
            <div className="space-y-4">
                <p>
                    The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Fundamental Analysts</h3>
                        <p className="text-sm">Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Technical Analysts</h3>
                        <p className="text-sm">Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Sentiment Analysts</h3>
                        <p className="text-sm">Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Risk Management</h3>
                        <p className="text-sm">Monitor portfolio exposure and set strict limits to preserve capital and manage downside risk.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'agent-workflow',
        title: 'Agent Workflow',
        content: (
            <div className="space-y-4">
                <p>
                    The decision-making process follows a structured workflow designed to mimic an investment committee:
                </p>
                <ol className="list-decimal pl-5 space-y-3">
                    <li>
                        <strong>Data Gathering:</strong> Individual specialists (Fundamental, Technical, Sentiment) independently gather data and form initial hypotheses.
                    </li>
                    <li>
                        <strong>Bull & Bear Debate:</strong> Dedicated <strong>Bull</strong> and <strong>Bear</strong> researcher agents assess market conditions from opposing viewpoints, challenging assumptions to uncover blind spots.
                    </li>
                    <li>
                        <strong>Synthesis:</strong> Traders synthesize the diverse insights from the debate and analyst reports, weighing conflicting evidence.
                    </li>
                    <li>
                        <strong>Execution:</strong> Informed decisions are made, with final checks by the Risk Management team to ensure alignment with portfolio constraints before execution.
                    </li>
                </ol>
            </div>
        )
    },
];

import Sidebar from '../../../components/Sidebar';

export default function DocumentPage() {
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    // --- 2. Scroll Spy Logic ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200; // Offset

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
            window.scrollTo({
                top: element.offsetTop - 100,
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

                <div className="relative flex flex-col gap-4 pl-2">
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

                {/* Sticky Header / Breadcrumb */}
                <div className="sticky top-0 bg-[#161616]/90 backdrop-blur-sm pt-8 pb-4 px-12 z-30 border-b border-zinc-800/30 flex items-center gap-4">
                    <Link href="/view-docs" className="text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <p className="text-zinc-500 font-medium text-sm">
                        View Docs / <span className="text-white">Document</span>
                    </p>
                </div>

                <div className="px-12 max-w-4xl w-full pb-40 pt-8">
                    <div className="flex justify-between items-center mb-16">
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            TradingAgent Multi Agent
                        </h1>
                        <a
                            href="https://arxiv.org/pdf/2412.20138"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                            <Download size={18} />
                            Download PDF
                        </a>
                    </div>

                    {/* Loop Render Sections */}
                    <div className="flex flex-col gap-24">
                        {SECTIONS.map((section) => (
                            <section key={section.id} id={section.id} className="scroll-mt-32 animate-in fade-in duration-700">

                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="text-cyan-400">#</span> {section.title}
                                </h2>

                                {/* Content */}
                                <div className="text-zinc-400 leading-relaxed text-lg mb-8">
                                    {section.content}
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
            className={`relative pl-6 py-2 text-sm cursor-pointer transition-all duration-200 select-none group
      ${active ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}>

            {/* Active Indicator Line */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] bg-white rounded-full transition-all duration-300
        ${active ? 'h-5 opacity-100' : 'h-0 opacity-0'}`}></div>

            {label}
        </div>
    );
}

function SkeletonLine({ width }: { width: string }) {
    return (
        <div className="h-[6px] bg-zinc-600 rounded-full animate-pulse" style={{ width: width }}></div>
    );
}
"use client";

import React, { useState, useEffect } from 'react';
import {
    Home, Aperture, Users, FileText, Menu, LineChart,
    Play, Lock, Activity, BarChart2, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

// --- 1. Adjust sections (SECTIONS) to include all 7 topics as shown in Tutorials image ---
const SECTIONS = [
    {
        id: 'start-analysis',
        title: 'Starting an Analysis',
        content: null, // content is simple, simplified below in steps
        steps: [
            "Navigate to the Homepage: Open the main dashboard where you'll see the input panel.",
            "Enter Stock Ticker: Type the symbol of the company you want to analyze (e.g., 'AAPL' for Apple, 'TSLA' for Tesla).",
            "Select Date Range: Choose the start and end dates for the historical data analysis.",
            "Click Generate: Hit the 'Generate Analysis' button to initialize the multi-agent system. The agents will begin gathering data immediately."
        ]
    },
    {
        id: 'understanding-reports',
        title: 'Understanding the Report',
        content: null,
        steps: [
            "Agent Insights: Review the individual outputs from Fundamental, Technical, and Sentiment agents. Each provides a unique perspective on the stock.",
            "Conversation Flow: Observe the internal dialogue and debate between specialized agents. You can see how the Bull and Bear agents argue their cases and how the Risk Manager weighs in before a final decision is made.",
            "Consensus Verdict: The consensus verdict is the final decision of the system. It is the aggregated decision from all agents."
        ]
    },
    {
        id: 'telegram-alerts',
        title: 'Connecting Telegram Alerts',
        content: null,
        steps: [
            "Open Connect Menu: Click the mobile phone icon (📱) in the left sidebar.",
            "Start the Bot: Click the provided link to open 'TradingAgentsBot' in Telegram and tap 'Start'.",
            "Auto-Connect: Return to the website and click 'Connect Automatically'. The system will detect your Chat ID and pair your account instantly.",
            "Receive Alerts: You will now get real-time notifications whenever a report is ready."
        ]
    },
    {
        id: 'exporting-pdf',
        title: 'Exporting Reports to PDF',
        content: null,
        steps: [
            "Complete Analysis: Wait for the progress bar to reach 100% and the report to be fully generated.",
            "Locate Download Button: Look for the 'Download Report' button usually located at the top-right of the report card.",
            "Save File: Click the button to generate a clean, professional PDF version of the analysis, suitable for printing or sharing."
        ]
    },
];

import Sidebar from '@/components/Sidebar';

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
            const scrollPosition = window.scrollY + 300; // Offset to activate before reaching the section

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
            const headerOffset = 120; // Account for header height
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
                    <Link href="/dashboard/view-docs" className="text-zinc-400 hover:text-white transition-colors">
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
                        Step-by-step guides to mastering the TradingAgent platform.
                    </p>

                    {/* Loop Render Sections */}
                    <div className="flex flex-col gap-32">
                        {SECTIONS.map((section, index) => (
                            <section key={section.id} id={section.id} className="scroll-mt-40 animate-in fade-in duration-700">

                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="text-cyan-500 font-mono text-xl">0{index + 1}.</span> {section.title}
                                </h2>

                                {/* Text Steps */}
                                <div className="space-y-6">
                                    {section.steps.map((step, i) => {
                                        const [title, desc] = step.split(': ');
                                        return (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 mt-1 flex items-center justify-center text-zinc-400 font-bold text-sm group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400 transition-all">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 bg-zinc-900/50 p-5 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                                    <h3 className="font-bold text-gray-200 mb-2">{title}</h3>
                                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                                        {desc || title}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
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
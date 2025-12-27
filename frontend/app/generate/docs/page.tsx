"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import {
    Download, ChevronRight, ChevronDown,
    BarChart, BookOpen, Newspaper, Globe,
    TrendingUp, TrendingDown, ArrowLeftRight,
    Flame, Shield, Scale, Gavel, Users,
    BrainCircuit, Activity, Zap
} from 'lucide-react';

// --- Navigation Data Structure ---
interface NavSubItem {
    id: string;
    title: string;
}

interface NavCategory {
    id: string;
    title: string;
    items: NavSubItem[];
}

const NAV_STRUCTURE: NavCategory[] = [
    {
        id: 'document',
        title: 'Document',
        items: [
            { id: 'introduction', title: 'Introduction' },
            { id: 'related-work', title: 'Related Work' },
            { id: 'role-specialization', title: 'TradingAgents: Role Specialization' },
            { id: 'agent-workflow', title: 'TradingAgents: Agent Workflow' },
        ]
    },
    {
        id: 'tutorials',
        title: 'Tutorials',
        items: [
            { id: 'start-analysis', title: 'Starting an analysis' },
            { id: 'understanding-reports', title: 'Understanding Report' },
            { id: 'telegram-alerts', title: 'Connecting Telegram Alert' },
            { id: 'exporting-pdf', title: 'Exporting Report to PDF' },
        ]
    },
    {
        id: 'our-agent',
        title: 'Our Agent',
        items: [
            { id: 'analyst-team', title: 'Analyst Team' },
            { id: 'research-team', title: 'Research Team' },
            { id: 'trader-team', title: 'Trader Team' },
            { id: 'risk-team', title: 'Risk Team' },
            { id: 'manager-team', title: 'Manager Team' },
        ]
    }
];

// --- 1. Document Content ---
const DOCUMENT_SECTIONS = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: (
            <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                    Significant progress has been made in automated problem-solving using societies of agents powered by large language models (LLMs). While single-agent systems handle specific tasks well, complex financial markets require collaborative dynamics similar to real-world trading firms.
                </p>
                <p>
                    <strong className="text-white">TradingAgents</strong> proposes a novel stock trading framework inspired by professional trading firms, featuring LLM-powered agents in specialized roles. By simulating a dynamic, collaborative trading environment, this framework aims to replicate the multi-faceted decision-making process of successful investment houses.
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
            <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                    In the domain of financial trading, efforts have historically focused on quantitative models and, more recently, single-agent LLM systems.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong className="text-white">Single-Agent Systems:</strong> Often limited to handling specific, isolated tasks such as sentiment analysis of news headlines or pattern recognition in price charts.
                    </li>
                    <li>
                        <strong className="text-white">Traditional Multi-Agent Frameworks:</strong> Previous attempts have largely operated independently, with agents gathering data in silos without true collaborative synthesis.
                    </li>
                    <li>
                        <strong className="text-white">TradingAgents Approach:</strong> Unlike predecessors, this framework emphasizes the <em>collaborative dynamics</em> found in institutional firms. It introduces structured debates and hierarchical decision-making, allowing agents to challenge and refine each other's insights before a trade is executed.
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'role-specialization',
        title: 'TradingAgents: Role Specialization',
        content: (
            <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                    The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Fundamental Analysts</h3>
                        <p className="text-sm">Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Technical Analysts</h3>
                        <p className="text-sm">Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Sentiment Analysts</h3>
                        <p className="text-sm">Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <h3 className="font-bold text-cyan-400 mb-2">Risk Management</h3>
                        <p className="text-sm">Monitor portfolio exposure and set strict limits to preserve capital and manage downside risk.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'agent-workflow',
        title: 'TradingAgents: Agent Workflow',
        content: (
            <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                    The decision-making process follows a structured workflow designed to mimic an investment committee:
                </p>
                <ol className="list-decimal pl-5 space-y-3">
                    <li>
                        <strong className="text-white">Data Gathering:</strong> Individual specialists (Fundamental, Technical, Sentiment) independently gather data and form initial hypotheses.
                    </li>
                    <li>
                        <strong className="text-white">Bull & Bear Debate:</strong> Dedicated <strong>Bull</strong> and <strong>Bear</strong> researcher agents assess market conditions from opposing viewpoints, challenging assumptions to uncover blind spots.
                    </li>
                    <li>
                        <strong className="text-white">Synthesis:</strong> Traders synthesize the diverse insights from the debate and analyst reports, weighing conflicting evidence.
                    </li>
                    <li>
                        <strong className="text-white">Execution:</strong> Informed decisions are made, with final checks by the Risk Management team to ensure alignment with portfolio constraints before execution.
                    </li>
                </ol>
            </div>
        )
    },
];

// --- 2. Tutorials Content ---
const TUTORIAL_SECTIONS = [
    {
        id: 'start-analysis',
        title: 'Starting an Analysis',
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
        steps: [
            "Agent Insights: Review the individual outputs from Fundamental, Technical, and Sentiment agents. Each provides a unique perspective on the stock.",
            "Conversation Flow: Observe the internal dialogue and debate between specialized agents. You can see how the Bull and Bear agents argue their cases and how the Risk Manager weighs in before a final decision is made.",
            "Consensus Verdict: The consensus verdict is the final decision of the system. It is the aggregated decision from all agents."
        ]
    },
    {
        id: 'telegram-alerts',
        title: 'Connecting Telegram Alerts',
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
        steps: [
            "Complete Analysis: Wait for the progress bar to reach 100% and the report to be fully generated.",
            "Locate Download Button: Look for the 'Download Report' button usually located at the top-right of the report card.",
            "Save File: Click the button to generate a clean, professional PDF version of the analysis, suitable for printing or sharing."
        ]
    },
];

// --- 3. Our Agent Content ---
const AGENT_TEAMS = [
    {
        id: 'analyst-team',
        title: 'Analyst Team',
        description: 'The foundation. specialized agents collect and process raw data from multiple sources—quantitative, fundamental, technical, and sentiment—to create a unified view of the market.',
        agents: [
            { id: 'market-data', title: 'Market Data Agent', icon: <BarChart size={24} className="text-cyan-400" />, role: 'Market Aggregator', content: 'Fetches raw financial data including historical prices, trading volumes, and key financial ratios.' },
            { id: 'fundamental', title: 'Fundamental Agent', icon: <BookOpen size={24} className="text-blue-400" />, role: 'Fundamental Aggregator', content: 'Parses 10-K/10-Q reports and balance sheets. Calculates intrinsic value metrics.' },
            { id: 'news', title: 'News Agent', icon: <Newspaper size={24} className="text-green-400" />, role: 'News Aggregator', content: 'Monitors global newswires/RSS feeds. Filters noise to find high-impact economic events.' },
            { id: 'social', title: 'Social Agent', icon: <Globe size={24} className="text-purple-400" />, role: 'Social Media Aggregator', content: 'Quantifies market psychology by scanning social platforms. Detects accumulating fear or greed trends.' }
        ]
    },
    {
        id: 'research-team',
        title: 'Research Team',
        description: 'The war room. Here, the Research Manager (CIO) moderates a fierce debate between the Bull and Bear to form a balanced initial thesis.',
        agents: [
            { id: 'bull', title: 'Bull Researcher', icon: <TrendingUp size={24} className="text-green-500" />, role: 'Growth Strategist', content: 'The Optimist. Focuses purely on upside catalysts, growth potential, and reasons why the asset could outperform.' },
            { id: 'bear', title: 'Bear Researcher', icon: <TrendingDown size={24} className="text-red-500" />, role: 'Risk Strategist', content: 'The Skeptic. Focuses on valuation gaps, macro headwinds, and flaws in the bullish thesis to expose downside risks.' }
        ]
    },
    {
        id: 'trader-team',
        title: 'Trader Team',
        description: 'The execution arm. This agent takes the final plan and executes the trade with precision.',
        agents: [
            { id: 'trader', title: 'Trader', icon: <ArrowLeftRight size={24} className="text-yellow-500" />, role: 'Executor', content: 'The Trader. It listens to the Bull and Bear arguments, synthesizing the conflicting data into a coherent "Investment Plan".' }
        ]
    },
    {
        id: 'risk-team',
        title: 'Risk Team',
        description: 'The stress test. Before execution, the trade must survive the "Council of Risks" where the Risk Manager adjudicates between conflicting risk perspectives.',
        agents: [
            { id: 'risky-agent', title: 'Aggressive Risk Agent', icon: <Flame size={24} className="text-red-400" />, role: 'Risk Taker', content: 'Advocates for maximizing exposure when conviction is high. Argues for wider stops.' },
            { id: 'safe-agent', title: 'Conservative Risk Agent', icon: <Shield size={24} className="text-green-400" />, role: 'Capital Preserver', content: 'Prioritizes capital preservation above all. Argues for tight stops and hedging.' },
            { id: 'neutral-agent', title: 'Neutral Risk Agent', icon: <Scale size={24} className="text-gray-400" />, role: 'Balancer', content: 'Provides the middle ground, balancing aggressive profit-seeking against conservative fears.' }
        ]
    },
    {
        id: 'manager-team',
        title: 'Manager Team',
        description: 'The manager. Once the plan is approved and risk-adjusted, the Trader Agent executes the order with surgical precision.',
        agents: [
            { id: 'manager', title: 'Manager', icon: <Gavel size={24} className="text-blue-500" />, role: 'Decision Maker', content: 'The Manager. Takes the final "Risk-Adjusted Plan" and executes the trade.' }
        ]
    }
];

// --- Navigation Item Component ---
function NavMenuItem({
    category,
    isExpanded,
    onToggle,
    activeSection,
    onSelectItem
}: {
    category: NavCategory;
    isExpanded: boolean;
    onToggle: () => void;
    activeSection: string;
    onSelectItem: (id: string) => void;
}) {
    return (
        <div className="mb-2">
            {/* Category Header */}
            <div
                className="flex items-center gap-2 py-2 cursor-pointer text-white font-semibold text-sm hover:text-zinc-300"
                onClick={onToggle}
            >
                {isExpanded ? (
                    <ChevronDown size={14} className="text-zinc-500" />
                ) : (
                    <ChevronRight size={14} className="text-zinc-500" />
                )}
                <span>{category.title}</span>
            </div>

            {/* Sub Items */}
            {isExpanded && (
                <div className="relative ml-2 pl-4 border-l border-zinc-700">
                    {category.items.map((item) => (
                        <div
                            key={item.id}
                            className={`relative py-2 text-sm cursor-pointer select-none
                                ${activeSection === item.id
                                    ? 'text-white font-semibold'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            onClick={() => onSelectItem(item.id)}
                        >
                            {/* Active Indicator */}
                            {activeSection === item.id && (
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-white rounded-full"></div>
                            )}
                            <span className="relative z-10">{item.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function GenerateDocsPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState('introduction');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['document', 'tutorials', 'our-agent']);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Scroll Spy
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 250;
            const allSections = [
                ...DOCUMENT_SECTIONS,
                ...TUTORIAL_SECTIONS,
                ...AGENT_TEAMS
            ];

            for (const section of allSections) {
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
                top: element.offsetTop - 120,
                behavior: 'auto'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className={`flex min-h-screen w-full font-sans ${isDarkMode ? "bg-[#161616] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>
            {/* ================= LEFT SIDEBAR (Global) ================= */}
            <Sidebar
                activeId="docs"
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

            {/* ================= MIDDLE SIDEBAR (Navigation Tree) ================= */}
            <aside className="sticky top-0 h-screen w-[280px] shrink-0 bg-[#1a1a1a] flex flex-col pt-8 px-6 border-r border-zinc-800/50 hidden md:flex z-40 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <h2 className="text-lg font-bold text-white mb-6 tracking-tight">
                    TradingAgent Multi Agent
                </h2>

                {/* Navigation Tree */}
                <nav className="flex flex-col pb-20">
                    {NAV_STRUCTURE.map((category) => (
                        <NavMenuItem
                            key={category.id}
                            category={category}
                            isExpanded={expandedCategories.includes(category.id)}
                            onToggle={() => toggleCategory(category.id)}
                            activeSection={activeSection}
                            onSelectItem={scrollToSection}
                        />
                    ))}
                </nav>
            </aside>

            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-1 flex flex-col bg-[#161616] relative min-h-screen min-w-0 overflow-y-auto">
                {/* Header with Download Button */}
                <div className="sticky top-0 bg-[#161616]/95 backdrop-blur-sm pt-8 pb-6 px-12 z-30 border-b border-zinc-800/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                View Docs
                            </h1>
                            <p className="text-zinc-400 text-base">
                                Document & Tutorials & Agent
                            </p>
                        </div>
                        <a
                            href="https://arxiv.org/pdf/2412.20138"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#00e33d] hover:bg-[#00c936] text-black px-4 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-green-500/20"
                        >
                            <Download size={16} />
                            Download Document
                        </a>
                    </div>
                </div>

                {/* Content Area */}
                <div className="px-8 md:px-12 w-full max-w-[1600px] pb-40 pt-8 mx-auto">

                    {/* ================= Document Sections ================= */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white tracking-tight border-b border-zinc-700 pb-4">
                            Document
                        </h2>
                    </div>

                    <div className="flex flex-col gap-16 mb-24">
                        {DOCUMENT_SECTIONS.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-40"
                            >
                                <h3 className="text-xl font-bold text-white mb-6">
                                    {section.title}
                                </h3>
                                <div className="text-base text-zinc-400">
                                    {section.id === 'role-specialization' ? (
                                        <div className="space-y-4">
                                            <p>
                                                The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <h3 className="font-bold text-cyan-400 mb-2">Fundamental Analysts</h3>
                                                    <p className="text-sm">Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                                                </div>
                                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <h3 className="font-bold text-cyan-400 mb-2">Technical Analysts</h3>
                                                    <p className="text-sm">Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                                                </div>
                                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <h3 className="font-bold text-cyan-400 mb-2">Sentiment Analysts</h3>
                                                    <p className="text-sm">Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                                                </div>
                                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <h3 className="font-bold text-cyan-400 mb-2">Risk Management</h3>
                                                    <p className="text-sm">Monitor portfolio exposure and set strict limits to preserve capital and manage downside risk.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        section.content
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* ================= Tutorials Sections ================= */}
                    <div className="mb-8" id="tutorials-header">
                        <h2 className="text-2xl font-bold text-white tracking-tight border-b border-zinc-700 pb-4">
                            Tutorials
                        </h2>
                    </div>

                    <div className="flex flex-col gap-16 mb-24">
                        {TUTORIAL_SECTIONS.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-40"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">{index + 1}.</span> {section.title}
                                </h3>
                                <div className="space-y-4">
                                    {section.steps.map((step, i) => {
                                        const [title, desc] = step.split(': ');
                                        return (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                                    <h4 className="font-bold text-gray-200 mb-1">{title}</h4>
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

                    {/* ================= Our Agent Sections ================= */}
                    <div className="mb-8" id="agents-header">
                        <h2 className="text-2xl font-bold text-white tracking-tight border-b border-zinc-700 pb-4">
                            Our Agents
                        </h2>
                    </div>

                    <div className="flex flex-col gap-20">
                        {AGENT_TEAMS.map((team) => (
                            <section
                                key={team.id}
                                id={team.id}
                                className="scroll-mt-40"
                            >
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                        {team.title}
                                    </h3>
                                    <p className="text-zinc-400 text-base leading-relaxed border-l-2 border-zinc-700 pl-4 max-w-4xl">
                                        {team.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {team.agents.map((agent) => (
                                        <div key={agent.id} className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 relative overflow-hidden group h-full">
                                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                                                    {agent.icon}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-base">
                                                        {agent.title}
                                                    </h4>
                                                    <p className="text-cyan-500 text-[11px] uppercase tracking-wider font-bold">
                                                        {agent.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
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


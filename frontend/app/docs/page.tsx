"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    BarChart, BookOpen, Newspaper, Globe,
    TrendingUp, TrendingDown, ArrowLeftRight,
    Flame, Shield, Scale, Gavel, Users,
    BrainCircuit, Activity, Zap
} from 'lucide-react';
import ViewDocsSidebar from '@/components/ViewDocsSidebar';
import { useTheme } from "@/context/ThemeContext";

const DOCUMENT_SECTIONS = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: (
            <div className="space-y-4 text-[#f8fbff]/90 leading-relaxed">
                <p>
                    Significant progress has been made in automated problem-solving using societies of agents powered by large language models (LLMs). While single-agent systems handle specific tasks well, complex financial markets require collaborative dynamics similar to real-world trading firms.
                </p>
                <p>
                    <strong className="text-[#f8fbff]">TradingAgents</strong> proposes a novel stock trading framework inspired by professional trading firms, featuring LLM-powered agents in specialized roles. By simulating a dynamic, collaborative trading environment, this framework aims to replicate the multi-faceted decision-making process of successful investment houses.
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
            <div className="space-y-4 text-[#f8fbff]/90 leading-relaxed">
                <p>
                    In the domain of financial trading, efforts have historically focused on quantitative models and, more recently, single-agent LLM systems.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong className="text-[#f8fbff]">Single-Agent Systems:</strong> Often limited to handling specific, isolated tasks such as sentiment analysis of news headlines or pattern recognition in price charts.
                    </li>
                    <li>
                        <strong className="text-[#f8fbff]">Traditional Multi-Agent Frameworks:</strong> Previous attempts have largely operated independently, with agents gathering data in silos without true collaborative synthesis.
                    </li>
                    <li>
                        <strong className="text-[#f8fbff]">TradingAgents Approach:</strong> Unlike predecessors, this framework emphasizes the <em>collaborative dynamics</em> found in institutional firms. It introduces structured debates and hierarchical decision-making, allowing agents to challenge and refine each other's insights before a trade is executed.
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'role-specialization',
        title: 'TradingAgents: Role Specialization',
        content: (
            <div className="space-y-4 text-[#f8fbff]/90 leading-relaxed">
                <p>
                    The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 bg-[#040b10]/90 backdrop-blur-sm rounded-lg border border-white/10 ring-1 ring-white/5">
                        <h3 className="font-bold text-cyan-400 mb-2">Fundamental Analysts</h3>
                        <p className="text-sm text-[#f8fbff]/80">Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                    </div>
                    <div className="p-4 bg-[#040b10]/90 backdrop-blur-sm rounded-lg border border-white/10 ring-1 ring-white/5">
                        <h3 className="font-bold text-cyan-400 mb-2">Technical Analysts</h3>
                        <p className="text-sm text-[#f8fbff]/80">Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                    </div>
                    <div className="p-4 bg-[#040b10]/90 backdrop-blur-sm rounded-lg border border-white/10 ring-1 ring-white/5">
                        <h3 className="font-bold text-cyan-400 mb-2">Sentiment Analysts</h3>
                        <p className="text-sm text-[#f8fbff]/80">Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                    </div>
                    <div className="p-4 bg-[#040b10]/90 backdrop-blur-sm rounded-lg border border-white/10 ring-1 ring-white/5">
                        <h3 className="font-bold text-cyan-400 mb-2">Risk Management</h3>
                        <p className="text-sm text-[#f8fbff]/80">Monitor portfolio exposure and set strict limits to preserve capital and manage downside risk.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'agent-workflow',
        title: 'TradingAgents: Agent Workflow',
        content: (
            <div className="space-y-4 text-[#f8fbff]/90 leading-relaxed">
                <p>
                    The decision-making process follows a structured workflow designed to mimic an investment committee:
                </p>
                <ol className="list-decimal pl-5 space-y-3">
                    <li>
                        <strong className="text-[#f8fbff]">Data Gathering:</strong> Individual specialists (Fundamental, Technical, Sentiment) independently gather data and form initial hypotheses.
                    </li>
                    <li>
                        <strong className="text-[#f8fbff]">Bull & Bear Debate:</strong> Dedicated <strong>Bull</strong> and <strong>Bear</strong> researcher agents assess market conditions from opposing viewpoints, challenging assumptions to uncover blind spots.
                    </li>
                    <li>
                        <strong className="text-[#f8fbff]">Synthesis:</strong> Traders synthesize the diverse insights from the debate and analyst reports, weighing conflicting evidence.
                    </li>
                    <li>
                        <strong className="text-[#f8fbff]">Execution:</strong> Informed decisions are made, with final checks by the Risk Management team to ensure alignment with portfolio constraints before execution.
                    </li>
                </ol>
            </div>
        )
    },
];

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

const AGENT_TEAMS = [
    {
        id: 'analyst-team',
        title: 'Analyst Team',
        description: 'The foundation. specialized agents collect and process raw data from multiple sources—quantitative, fundamental, technical, and sentiment—to create a unified view of the market.',
        agents: [
            { id: 'market-data', title: 'Market Data Agent', icon: <BarChart size={24} className="text-[#f8fbff]" />, role: 'Market Aggregator', content: 'Fetches raw financial data including historical prices, trading volumes, and key financial ratios.' },
            { id: 'fundamental', title: 'Fundamental Agent', icon: <BookOpen size={24} className="text-[#f8fbff]" />, role: 'Fundamental Aggregator', content: 'Parses 10-K/10-Q reports and balance sheets. Calculates intrinsic value metrics.' },
            { id: 'news', title: 'News Agent', icon: <Newspaper size={24} className="text-[#f8fbff]" />, role: 'News Aggregator', content: 'Monitors global newswires/RSS feeds. Filters noise to find high-impact economic events.' },
            { id: 'social', title: 'Social Agent', icon: <Globe size={24} className="text-[#f8fbff]" />, role: 'Social Media Aggregator', content: 'Quantifies market psychology by scanning social platforms. Detects accumulating fear or greed trends.' }
        ]
    },
    {
        id: 'research-team',
        title: 'Research Team',
        description: 'The war room. Here, the Research Manager (CIO) moderates a fierce debate between the Bull and Bear to form a balanced initial thesis.',
        agents: [
            { id: 'bull', title: 'Bull Researcher', icon: <TrendingUp size={24} className="text-[#f8fbff]" />, role: 'Growth Strategist', content: 'The Optimist. Focuses purely on upside catalysts, growth potential, and reasons why the asset could outperform.' },
            { id: 'bear', title: 'Bear Researcher', icon: <TrendingDown size={24} className="text-[#f8fbff]" />, role: 'Risk Strategist', content: 'The Skeptic. Focuses on valuation gaps, macro headwinds, and flaws in the bullish thesis to expose downside risks.' }
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
            { id: 'neutral-agent', title: 'Neutral Risk Agent', icon: <Scale size={24} className="text-[#f8fbff]/60" />, role: 'Balancer', content: 'Provides the middle ground, balancing aggressive profit-seeking against conservative fears.' }
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

// Tooltip Component for Explain-on-Hover
function Tooltip({ text, children, isDarkMode }: { text: string; children: React.ReactNode; isDarkMode: boolean }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-block group">
            <span 
                className="underline decoration-dotted cursor-help"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {children}
            </span>
            {show && (
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-2 rounded-lg text-xs max-w-xs shadow-lg backdrop-blur-sm border ${isDarkMode 
                    ? 'bg-[#040b10]/95 text-[#f8fbff] border-white/20'
                    : 'bg-white text-[#0F172A] border-[#E2E8F0] shadow-xl'
                }`}>
                    {text}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-l-transparent border-r-transparent border-b-transparent ${isDarkMode ? 'border-t-[#040b10]/95' : 'border-t-white'}`} />
                </div>
            )}
        </span>
    );
}

export default function DocsPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState('introduction');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['document', 'tutorials', 'our-agent']);
    const [readingMode, setReadingMode] = useState(false);

    // Track if component is mounted (client-side only)
    const [mounted, setMounted] = useState(false);
    
    // Generate stars only on client side to avoid hydration mismatch
    const [stars, setStars] = useState<Array<{
        id: number;
        size: number;
        left: number;
        top: number;
        delay: number;
        duration: number;
        opacity: number;
    }>>([]);

    useEffect(() => {
        // Mark as mounted and generate stars only on client side
        setMounted(true);
        setStars(Array.from({ length: 150 }).map((_, i) => {
            const size = Math.random() * 2 + 0.5;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            const opacity = Math.random() * 0.8 + 0.2;
            
            return {
                id: i,
                size,
                left,
                top,
                delay,
                duration,
                opacity,
            };
        }));
    }, []);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

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

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Add class directly to element for animation
                    entry.target.classList.add('animate-in');
                    entry.target.classList.remove('animate-out');
                } else {
                    // Remove animation class when out of viewport to allow re-animation
                    entry.target.classList.remove('animate-in');
                    entry.target.classList.add('animate-out');
                }
            });
        }, observerOptions);

        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // Observe all sections
            const allSections = [
                ...DOCUMENT_SECTIONS,
                ...TUTORIAL_SECTIONS,
                ...AGENT_TEAMS
            ];

            allSections.forEach((section) => {
                const element = document.getElementById(section.id);
                if (element) {
                    // Check if element is already in viewport
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                    if (isVisible) {
                        element.classList.add('animate-in');
                    }
                    observer.observe(element);
                }
            });

            // Also observe section headers
            const headers = ['tutorials-header', 'agents-header'];
            headers.forEach((id) => {
                const element = document.getElementById(id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                    if (isVisible) {
                        element.classList.add('animate-in');
                    }
                    observer.observe(element);
                }
            });
        }, 100);

        return () => {
            observer.disconnect();
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 120,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <>
            <style jsx>{`
                .animate-in {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
                .animate-out {
                    opacity: 0;
                    transform: translateY(2rem);
                }
                @keyframes twinkle {
                    0%, 100% {
                        opacity: 0.2;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
            `}</style>
            <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 relative ${isDarkMode ? 'bg-[#020617] text-[#f8fbff]' : 'bg-[#F6F9FC] text-[#0F172A]'}`}>
            {/* Starry Night Sky Effect - only in dark mode */}
            {mounted && isDarkMode && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    {stars.map((star) => (
                        <div
                            key={star.id}
                            className="absolute rounded-full"
                            style={{
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                left: `${star.left}%`,
                                top: `${star.top}%`,
                                backgroundColor: 'rgb(255, 255, 255)',
                                opacity: star.opacity,
                                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                                animationDelay: `${star.delay}s`,
                                boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
                            }}
                        />
                    ))}
                </div>
            )}
            {/* Navigation Bar */}
            <nav className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-sm ${isDarkMode ? 'bg-[#020617]/80' : 'bg-[#F6F9FC]/80'}`}>
                {/* Left side - empty for spacing */}
                <div className="flex-1"></div>
                
                {/* Center - Navigation Links */}
                <div className="flex items-center gap-4 text-sm font-medium tracking-wide">
                    {/* Home */}
                    <Link
                        href="/introduction"
                        className={`rounded-full px-6 py-2 transition-all hover:-translate-y-0.5 hover:scale-105 ${isDarkMode 
                            ? 'hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] bg-white/5 text-white hover:bg-white/10 border border-white/10'
                            : 'hover:shadow-[0_10px_30px_rgba(37,99,235,0.15)] bg-white text-[#334155] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB]/30'
                        }`}
                    >
                        Home
                    </Link>
                    {/* View Docs (active) */}
                    <Link
                        href="/docs"
                        className={`rounded-full px-6 py-2 transition-all hover:-translate-y-0.5 hover:scale-105 ${isDarkMode
                            ? 'bg-[#2df4c6] text-black border border-[#2df4c6] shadow-[0_16px_40px_rgba(45,244,198,0.4)] hover:shadow-[0_20px_50px_rgba(45,244,198,0.55)]'
                            : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white border border-transparent shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/30'
                        }`}
                    >
                        View Docs
                    </Link>
                    {/* Contact */}
                    <Link
                        href="/contact-public"
                        className={`rounded-full px-6 py-2 transition-all hover:-translate-y-0.5 hover:scale-105 ${isDarkMode
                            ? 'hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] bg-white/5 text-white hover:bg-white/10 border border-white/10'
                            : 'hover:shadow-[0_10px_30px_rgba(37,99,235,0.15)] bg-white text-[#334155] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB]/30'
                        }`}
                    >
                        Contact
                    </Link>
                </div>
                
                {/* Right side - Theme Toggle */}
                <div className="flex-1 flex justify-end">
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" checked={!isDarkMode} onChange={toggleTheme} className="peer sr-only" />
                        <div className={`peer h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 ${isDarkMode ? 'bg-gray-700 after:border-gray-300 after:bg-white peer-checked:bg-gray-300 peer-checked:after:border-white peer-focus:ring-[#2df4c6]' : 'bg-[#CBD5E1] after:border-[#F1F5F9] after:bg-white peer-checked:bg-[#2563EB] peer-checked:after:border-white peer-focus:ring-[#2563EB]'}`}></div>
                        <span className={`ml-3 text-sm font-medium ${isDarkMode ? "text-white" : "text-[#64748B]"}`}>
                            {isDarkMode ? "Dark Mode" : "Light Mode"}
                        </span>
                    </label>
                </div>
            </nav>

            {/* Left navigation panel */}
            <ViewDocsSidebar
                activeSection={activeSection}
                expandedCategories={expandedCategories}
                onToggleCategory={toggleCategory}
                onSelectItem={scrollToSection}
                isDarkMode={isDarkMode}
            />

            <main className="flex-1 flex flex-col relative min-h-screen min-w-0 z-10 bg-transparent">
                <div className={`sticky top-0 z-30 border-b px-12 pt-24 pb-8 ${isDarkMode ? 'bg-[#020617]/95 border-white/5' : 'bg-[#F6F9FC]/95 border-[#E2E8F0]'}`}>
                        <div>
                            <h1 className={`text-3xl font-bold mb-2 tracking-tight ${isDarkMode ? 'text-[#f8fbff]' : 'text-[#0F172A]'}`}>
                                View Docs
                            </h1>
                            <p className={`text-base ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>
                                Document & Tutorials & Agent
                            </p>
                    </div>
                </div>

                <div className="px-8 md:px-12 w-full max-w-[1600px] pb-40 pt-10 mx-auto bg-transparent">

                    <div className="mb-8">
                        <h2 className={`text-2xl font-bold tracking-tight border-b pb-4 ${isDarkMode ? 'text-[#f8fbff] border-white/10' : 'text-[#0F172A] border-[#E2E8F0]'}`}>
                            Document
                        </h2>
                    </div>

                    <div className="flex flex-col gap-12 mb-24">
                        {DOCUMENT_SECTIONS.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className={`scroll-mt-40 transition-all duration-700 ease-out ${index === 0 ? 'opacity-100 translate-y-0 animate-in' : 'opacity-0 translate-y-8 animate-out'}`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#f8fbff]' : 'text-[#0F172A]'}`}>
                                        {section.title}
                                    </h3>
                                <div className={`text-base leading-relaxed backdrop-blur-md border rounded-2xl p-6 ring-1 ${isDarkMode 
                                    ? 'text-[#f8fbff]/90 bg-gradient-to-b from-[#0f1216]/80 to-[#141922]/90 border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)] ring-white/5'
                                    : 'text-[#334155] bg-white border-[#E2E8F0] shadow-lg shadow-[#2563EB]/5 ring-[#E2E8F0]'
                                }`}>
                                    {section.id === 'role-specialization' ? (
                                        <div className="space-y-4">
                                            <p className="text-[#f8fbff]/90">
                                                The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                                <div className={`p-4 backdrop-blur-sm rounded-lg border ring-1 ${isDarkMode 
                                                    ? 'bg-[#040b10]/90 border-white/10 ring-white/5'
                                                    : 'bg-white border-[#E2E8F0] ring-[#E2E8F0] shadow-sm'
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-[#2563EB]'}`}>Fundamental Analysts</h3>
                                                    <p className={`text-sm ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                                                </div>
                                                <div className={`p-4 backdrop-blur-sm rounded-lg border ring-1 ${isDarkMode 
                                                    ? 'bg-[#040b10]/90 border-white/10 ring-white/5'
                                                    : 'bg-white border-[#E2E8F0] ring-[#E2E8F0] shadow-sm'
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-[#2563EB]'}`}>Technical Analysts</h3>
                                                    <p className={`text-sm ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                                                </div>
                                                <div className={`p-4 backdrop-blur-sm rounded-lg border ring-1 ${isDarkMode 
                                                    ? 'bg-[#040b10]/90 border-white/10 ring-white/5'
                                                    : 'bg-white border-[#E2E8F0] ring-[#E2E8F0] shadow-sm'
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-[#2563EB]'}`}>Sentiment Analysts</h3>
                                                    <p className={`text-sm ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                                                </div>
                                                <div className={`p-4 backdrop-blur-sm rounded-lg border ring-1 ${isDarkMode 
                                                    ? 'bg-[#040b10]/90 border-white/10 ring-white/5'
                                                    : 'bg-white border-[#E2E8F0] ring-[#E2E8F0] shadow-sm'
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-[#2563EB]'}`}>Risk Management</h3>
                                                    <p className={`text-sm ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>Monitor portfolio exposure and set strict limits to preserve capital and manage downside risk.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={isDarkMode ? '' : '[&_p]:text-[#334155] [&_strong]:text-[#0F172A] [&_li]:text-[#334155] [&_em]:text-[#0F172A]'}>
                                            {section.content}
                                        </div>
                                    )}
                                </div>
                            </section>
                            ))}
                        </div>

                    <div 
                        className="mb-8 opacity-0 translate-y-8 transition-all duration-700 ease-out animate-out"
                        id="tutorials-header"
                    >
                        <h2 className={`text-2xl font-bold tracking-tight border-b pb-4 ${isDarkMode ? 'text-[#f8fbff] border-white/10' : 'text-[#0F172A] border-[#E2E8F0]'}`}>
                            Tutorials
                        </h2>
                    </div>

                    <div className="flex flex-col gap-12 mb-24">
                        {TUTORIAL_SECTIONS.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-40 opacity-0 translate-y-8 transition-all duration-700 ease-out animate-out"
                                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                            >
                                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-[#f8fbff]' : 'text-[#0F172A]'}`}>
                                    <span className={`font-mono ${isDarkMode ? 'text-cyan-500' : 'text-[#2563EB]'}`}>{index + 1}.</span> {section.title}
                                </h3>
                                <div className="space-y-4">
                                    {section.steps.map((step, i) => {
                                        const [title, desc] = step.split(': ');
                                        return (
                                            <div key={i} className="flex gap-4 group">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full backdrop-blur-xl border ring-1 flex items-center justify-center font-bold text-sm ${isDarkMode 
                                                    ? 'bg-gradient-to-b from-[#0f1216]/80 to-[#141922]/90 border-white/10 ring-white/5 text-[#f8fbff]'
                                                    : 'bg-white border-[#E2E8F0] ring-[#E2E8F0] text-[#2563EB] shadow-sm'
                                                }`}>
                                                    {i + 1}
                                                </div>
                                                <div className={`flex-1 backdrop-blur-xl p-4 rounded-xl border ring-1 ${isDarkMode
                                                    ? 'bg-gradient-to-b from-[#0f1216]/80 to-[#141922]/90 border-white/10 ring-white/5 shadow-[0_32px_80px_rgba(0,0,0,0.8)]'
                                                    : 'bg-white border-[#E2E8F0] ring-[#E2E8F0] shadow-md'
                                                }`}>
                                                    <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-[#f8fbff]' : 'text-[#0F172A]'}`}>{title}</h4>
                                                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>
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

                    <div 
                        className="mb-8 opacity-0 translate-y-8 transition-all duration-700 ease-out animate-out"
                        id="agents-header"
                    >
                        <h2 className={`text-2xl font-bold tracking-tight border-b pb-4 ${isDarkMode ? 'text-[#f8fbff] border-white/10' : 'text-[#0F172A] border-[#E2E8F0]'}`}>
                            Our Agents
                        </h2>
                                </div>

                    <div className="flex flex-col gap-16">
                        {AGENT_TEAMS.map((team, teamIndex) => (
                            <section
                                key={team.id}
                                id={team.id}
                                className="scroll-mt-40 opacity-0 translate-y-8 transition-all duration-700 ease-out animate-out"
                                style={{ transitionDelay: `${(teamIndex + 1) * 150}ms` }}
                            >
                                <div className="mb-8">
                                    <h3 className={`text-xl font-bold mb-2 flex items-center gap-3 ${isDarkMode ? 'text-[#f8fbff]' : 'text-[#0F172A]'}`}>
                                        {team.title}
                                </h3>
                                    <p className={`text-base leading-relaxed border-l-2 pl-4 max-w-4xl ${isDarkMode ? 'text-[#f8fbff]/80 border-white/10' : 'text-[#64748B] border-[#E2E8F0]'}`}>
                                        {team.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {team.agents.map((agent) => (
                                        <div key={agent.id} className={`backdrop-blur-xl border rounded-2xl p-6 transition-colors relative overflow-hidden group h-full ring-1 ${isDarkMode
                                            ? 'bg-gradient-to-b from-[#0f1216]/80 to-[#141922]/90 border-white/10 hover:border-white/20 shadow-[0_32px_80px_rgba(0,0,0,0.8)] ring-white/5'
                                            : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/30 shadow-lg shadow-[#2563EB]/5 ring-[#E2E8F0]'
                                        }`}>
                                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                                <div className={`p-2 backdrop-blur-sm rounded-lg border ring-1 ${isDarkMode
                                                    ? 'bg-[#040b10]/90 border-white/10 ring-white/5'
                                                    : 'bg-[#F8FAFC] border-[#E2E8F0] ring-[#E2E8F0]'
                                                }`}>
                                                    {agent.icon}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-base ${isDarkMode ? 'text-[#f8fbff]' : 'text-[#0F172A]'}`}>
                                                        {agent.title}
                                                    </h4>
                                                    <p className={`text-[11px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-cyan-500' : 'text-[#2563EB]'}`}>
                                                        {agent.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-[#64748B]'}`}>
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
        </>
    );
}

















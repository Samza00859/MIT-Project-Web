"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ViewDocsSidebar from "../../components/ViewDocsSidebar";
import Sidebar from "../../components/Sidebar";
import {
    Download,
    BarChart, BookOpen, Newspaper, Globe,
    TrendingUp, TrendingDown, ArrowLeftRight,
    Flame, Shield, Scale, Gavel, Users,
    BrainCircuit, Activity, Zap, HelpCircle
} from 'lucide-react';

// --- 1. Document Content ---
const DOCUMENT_SECTIONS = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: (
            <div className="space-y-4 text-zinc-300 leading-relaxed">
                <p>
                    Significant progress has been made in automated problem-solving using societies of agents powered by <Tooltip text="Large Language Models - advanced AI systems that can understand and generate human-like text" isDarkMode={true}><strong className="text-white">LLMs</strong></Tooltip>. While single-agent systems handle specific tasks well, complex financial markets require collaborative dynamics similar to real-world trading firms.
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
            <div className="space-y-4 text-zinc-300 leading-relaxed">
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
            <div className="space-y-4 text-zinc-300 leading-relaxed">
                <p>
                    The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/60">
                        <h3 className="font-bold text-cyan-400 mb-2">Fundamental Analysts</h3>
                        <p className="text-sm">Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                    </div>
                    <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/60">
                        <h3 className="font-bold text-cyan-400 mb-2">Technical Analysts</h3>
                        <p className="text-sm">Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                    </div>
                    <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/60">
                        <h3 className="font-bold text-cyan-400 mb-2">Sentiment Analysts</h3>
                        <p className="text-sm">Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                    </div>
                    <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/60">
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
            <div className="space-y-4 text-zinc-300 leading-relaxed">
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
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-2 rounded-lg text-xs max-w-xs shadow-lg ${isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-900 text-white border border-gray-600'
                    }`}>
                    {text}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-l-transparent border-r-transparent border-b-transparent ${isDarkMode ? 'border-t-gray-800' : 'border-t-gray-900'
                        }`} />
                </div>
            )}
        </span>
    );
}

export default function ViewDocsPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeSection, setActiveSection] = useState('introduction');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['document', 'tutorials', 'our-agent']);
    const [focusedSection, setFocusedSection] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Generate stars once for the night sky effect (matching home page)
    const stars = useMemo(() => {
        return Array.from({ length: 150 }).map((_, i) => {
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
        });
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
    };

    useEffect(() => {
        document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };


    // Enhanced Scroll Spy with Focus Detection (Throttled)
    const activeSectionRef = useRef(activeSection);
    const focusedSectionRef = useRef(focusedSection);

    // Keep refs in sync with state
    useEffect(() => {
        activeSectionRef.current = activeSection;
    }, [activeSection]);

    useEffect(() => {
        focusedSectionRef.current = focusedSection;
    }, [focusedSection]);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollPosition = window.scrollY + 250;
                    const viewportHeight = window.innerHeight;
                    const allSections = [
                        ...DOCUMENT_SECTIONS,
                        ...TUTORIAL_SECTIONS,
                        ...AGENT_TEAMS
                    ];

                    let newActiveSection = activeSectionRef.current;
                    let newFocusedSection: string | null = focusedSectionRef.current;

                    for (const section of allSections) {
                        const element = document.getElementById(section.id);
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            const { offsetTop, offsetHeight } = element;

                            // Check if section is in viewport (active section)
                            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                                newActiveSection = section.id;
                            }

                            // Check if section is focused (centered in viewport)
                            const elementTop = rect.top + window.scrollY;
                            const elementCenter = elementTop + offsetHeight / 2;
                            const viewportCenter = window.scrollY + viewportHeight / 2;

                            if (Math.abs(elementCenter - viewportCenter) < viewportHeight * 0.3 && rect.top < viewportHeight && rect.bottom > 0) {
                                newFocusedSection = section.id;
                            }
                        }
                    }

                    // Only update state if values actually changed
                    if (newActiveSection !== activeSectionRef.current) {
                        setActiveSection(newActiveSection);
                        activeSectionRef.current = newActiveSection;
                    }

                    if (newFocusedSection !== focusedSectionRef.current) {
                        setFocusedSection(newFocusedSection);
                        focusedSectionRef.current = newFocusedSection;
                    }

                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
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

    // Create document sections with proper classes based on theme
    const documentSectionsWithTheme = useMemo(() => {
        return DOCUMENT_SECTIONS.map(section => {
            if (section.id === 'introduction') {
                return {
                    ...section,
                    content: (
                        <div className={`space-y-4 leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-gray-900'}`}>
                            <p>
                                Significant progress has been made in automated problem-solving using societies of agents powered by <Tooltip text="Large Language Models - advanced AI systems that can understand and generate human-like text" isDarkMode={isDarkMode}><strong className={isDarkMode ? "text-white" : "text-gray-900"}>LLMs</strong></Tooltip>. While single-agent systems handle specific tasks well, complex financial markets require collaborative dynamics similar to real-world trading firms.
                            </p>
                            <p>
                                <strong className={isDarkMode ? "text-white" : "text-gray-900"}>TradingAgents</strong> proposes a novel stock trading framework inspired by professional trading firms, featuring LLM-powered agents in specialized roles. By simulating a dynamic, collaborative trading environment, this framework aims to replicate the multi-faceted decision-making process of successful investment houses.
                            </p>
                            <p>
                                This comprehensive multi-agent system moves beyond simple data gathering, integrating diverse perspectives from fundamental analysis to technical indicators, debating insights, and synthesizing them into informed trading decisions.
                            </p>
                        </div>
                    )
                };
            } else if (section.id === 'related-work') {
                return {
                    ...section,
                    content: (
                        <div className={`space-y-4 leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-gray-900'}`}>
                            <p>
                                In the domain of financial trading, efforts have historically focused on quantitative models and, more recently, single-agent LLM systems.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Single-Agent Systems:</strong> Often limited to handling specific, isolated tasks such as sentiment analysis of news headlines or pattern recognition in price charts.
                                </li>
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Traditional Multi-Agent Frameworks:</strong> Previous attempts have largely operated independently, with agents gathering data in silos without true collaborative synthesis.
                                </li>
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>TradingAgents Approach:</strong> Unlike predecessors, this framework emphasizes the <em>collaborative dynamics</em> found in institutional firms. It introduces structured debates and hierarchical decision-making, allowing agents to challenge and refine each other's insights before a trade is executed.
                                </li>
                            </ul>
                        </div>
                    )
                };
            } else if (section.id === 'agent-workflow') {
                return {
                    ...section,
                    content: (
                        <div className={`space-y-4 leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-gray-900'}`}>
                            <p>
                                The decision-making process follows a structured workflow designed to mimic an investment committee:
                            </p>
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Data Gathering:</strong> Individual specialists (Fundamental, Technical, Sentiment) independently gather data and form initial hypotheses.
                                </li>
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Bull & Bear Debate:</strong> Dedicated <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Bull</strong> and <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Bear</strong> researcher agents assess market conditions from opposing viewpoints, challenging assumptions to uncover blind spots.
                                </li>
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Synthesis:</strong> Traders synthesize the diverse insights from the debate and analyst reports, weighing conflicting evidence.
                                </li>
                                <li>
                                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Execution:</strong> Informed decisions are made, with final checks by the Risk Management team to ensure alignment with portfolio constraints before execution.
                                </li>
                            </ol>
                        </div>
                    )
                };
            }
            return section;
        });
    }, [isDarkMode]);

    return (
        <>
            <style jsx>{`
                .light-mode-content,
                .light-mode-content *,
                .light-mode-content p,
                .light-mode-content div,
                .light-mode-content span,
                .light-mode-content .text-zinc-300,
                .light-mode-content .text-white {
                    color: #000000 !important;
                }
                .light-mode-content strong,
                .light-mode-content strong *,
                .light-mode-content .text-white {
                    color: #000000 !important;
                    font-weight: 600;
                }
                .light-mode-content li,
                .light-mode-content li * {
                    color: #000000 !important;
                }
                .light-mode-content em {
                    color: #000000 !important;
                    font-style: italic;
                }
                /* Override text colors in light mode for all content - High specificity */
                body[data-theme="light"] .text-zinc-300,
                body[data-theme="light"] .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main .text-zinc-300,
                body[data-theme="light"] main .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main div .text-zinc-300,
                body[data-theme="light"] main div .text-white:not(.bg-clip-text):not(.text-transparent) {
                    color: #000000 !important;
                }
                body[data-theme="light"] section .text-zinc-300,
                body[data-theme="light"] section .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] section p,
                body[data-theme="light"] section li,
                body[data-theme="light"] section strong,
                body[data-theme="light"] section em,
                body[data-theme="light"] section ol,
                body[data-theme="light"] section ul,
                body[data-theme="light"] section div,
                body[data-theme="light"] section span,
                body[data-theme="light"] main section .text-zinc-300,
                body[data-theme="light"] main section .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section p,
                body[data-theme="light"] main section li,
                body[data-theme="light"] main section strong,
                body[data-theme="light"] main section em,
                body[data-theme="light"] main section div,
                body[data-theme="light"] main section span,
                body[data-theme="light"] main section div .text-zinc-300,
                body[data-theme="light"] main section div .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section div p,
                body[data-theme="light"] main section div li,
                body[data-theme="light"] main section div strong,
                body[data-theme="light"] main section div em,
                body[data-theme="light"] main section div ol,
                body[data-theme="light"] main section div ul {
                    color: #000000 !important;
                }
                body[data-theme="light"] section strong,
                body[data-theme="light"] main section strong,
                body[data-theme="light"] main section div strong {
                    color: #000000 !important;
                    font-weight: 600;
                }
                /* Global override for all text in light mode within main content */
                body[data-theme="light"] main section[id] div[class*="space-y"] p,
                body[data-theme="light"] main section[id] div[class*="space-y"] li,
                body[data-theme="light"] main section[id] div[class*="space-y"] strong,
                body[data-theme="light"] main section[id] div[class*="space-y"] em,
                body[data-theme="light"] main section[id] div[class*="space-y"] ol,
                body[data-theme="light"] main section[id] div[class*="space-y"] ul,
                body[data-theme="light"] main section[id] div[class*="space-y"] div,
                body[data-theme="light"] main section[id] div[class*="space-y"] span {
                    color: #000000 !important;
                }
                body[data-theme="light"] main section[id] div[class*="space-y"] strong {
                    color: #000000 !important;
                    font-weight: 600;
                }
                /* Ultimate override for text content in light mode - exclude headings */
                body[data-theme="light"] main section[id] div[class*="space-y"] *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section[id] div[class*="leading-relaxed"] *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section[id] div.text-zinc-300 *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section[id] div.text-zinc-300,
                body[data-theme="light"] main section[id] p.text-zinc-300,
                body[data-theme="light"] main section[id] li.text-zinc-300,
                body[data-theme="light"] main section[id] strong.text-white,
                body[data-theme="light"] main section[id] span.text-white:not(.bg-clip-text):not(.text-transparent) {
                    color: #000000 !important;
                }
                body[data-theme="light"] main section[id] div[class*="space-y"] strong,
                body[data-theme="light"] main section[id] div[class*="leading-relaxed"] strong,
                body[data-theme="light"] main section[id] div.text-zinc-300 strong,
                body[data-theme="light"] main section[id] p strong,
                body[data-theme="light"] main section[id] li strong {
                    color: #000000 !important;
                    font-weight: 600;
                }
                /* Force all text in document sections to be black in light mode */
                body[data-theme="light"] main section#introduction *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section#related-work *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section#agent-workflow *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section#introduction .text-zinc-300,
                body[data-theme="light"] main section#introduction .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section#related-work .text-zinc-300,
                body[data-theme="light"] main section#related-work .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section#agent-workflow .text-zinc-300,
                body[data-theme="light"] main section#agent-workflow .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section#introduction div.text-zinc-300,
                body[data-theme="light"] main section#introduction p.text-zinc-300,
                body[data-theme="light"] main section#introduction li.text-zinc-300,
                body[data-theme="light"] main section#related-work div.text-zinc-300,
                body[data-theme="light"] main section#related-work p.text-zinc-300,
                body[data-theme="light"] main section#related-work li.text-zinc-300,
                body[data-theme="light"] main section#agent-workflow div.text-zinc-300,
                body[data-theme="light"] main section#agent-workflow p.text-zinc-300,
                body[data-theme="light"] main section#agent-workflow li.text-zinc-300 {
                    color: #000000 !important;
                }
                body[data-theme="light"] main section#introduction strong,
                body[data-theme="light"] main section#introduction strong.text-white,
                body[data-theme="light"] main section#related-work strong,
                body[data-theme="light"] main section#related-work strong.text-white,
                body[data-theme="light"] main section#agent-workflow strong,
                body[data-theme="light"] main section#agent-workflow strong.text-white {
                    color: #000000 !important;
                    font-weight: 600;
                }
                /* Ultimate override with maximum specificity */
                body[data-theme="light"] main section[id] div.light-mode-content .text-zinc-300,
                body[data-theme="light"] main section[id] div.light-mode-content .text-white:not(.bg-clip-text):not(.text-transparent),
                body[data-theme="light"] main section[id] div.light-mode-content p,
                body[data-theme="light"] main section[id] div.light-mode-content li,
                body[data-theme="light"] main section[id] div.light-mode-content strong,
                body[data-theme="light"] main section[id] div.light-mode-content em,
                body[data-theme="light"] main section[id] div.light-mode-content div,
                body[data-theme="light"] main section[id] div.light-mode-content span,
                body[data-theme="light"] main section[id] div.light-mode-content ol,
                body[data-theme="light"] main section[id] div.light-mode-content ul {
                    color: #000000 !important;
                }
                body[data-theme="light"] main section[id] div.light-mode-content strong {
                    color: #000000 !important;
                    font-weight: 600;
                }
                /* Maximum specificity override for all text classes in light mode */
                body[data-theme="light"] main section[id] [class*="text-zinc-300"],
                body[data-theme="light"] main section[id] [class*="text-white"]:not([class*="bg-clip-text"]):not([class*="text-transparent"]),
                body[data-theme="light"] main section[id] div[class*="text-zinc-300"],
                body[data-theme="light"] main section[id] p[class*="text-zinc-300"],
                body[data-theme="light"] main section[id] li[class*="text-zinc-300"],
                body[data-theme="light"] main section[id] strong[class*="text-white"]:not([class*="bg-clip-text"]):not([class*="text-transparent"]),
                body[data-theme="light"] main section[id] span[class*="text-white"]:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {
                    color: #000000 !important;
                }
                body[data-theme="light"] main section[id] strong[class*="text-white"]:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {
                    color: #000000 !important;
                    font-weight: 600;
                }
                .reading-mode {
                    max-width: 65ch;
                    margin: 0 auto;
                    font-size: 1.125rem;
                    line-height: 1.8;
                }
                .reading-mode section {
                    margin-bottom: 3rem;
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
                @keyframes sunrise {
                    0%, 100% { 
                        transform: translate(-50%, -20%) scale(1);
                        opacity: 0.6;
                    }
                    50% { 
                        transform: translate(-50%, -15%) scale(1.1);
                        opacity: 0.8;
                    }
                }
                @keyframes gradient {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-2%, -2%) scale(1.05); }
                }
            `}</style>
            <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 relative overflow-hidden ${isDarkMode ? 'bg-[#020617] text-[#f8fbff]' : 'bg-gradient-to-br from-[#e0f2fe] via-[#fef3c7] to-[#fce7f3] text-[#1a202c]'}`}>
            {/* Starry Night Sky Effect (matching home page) - only render on client */}
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
            
            {/* Morning Sky Effect for Light Mode */}
            {mounted && !isDarkMode && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#fef3c7]/60 via-[#fce7f3]/40 to-[#e0f2fe]/50" />
                    <div 
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle,rgba(255,237,153,0.35),rgba(255,200,87,0.25),transparent_70%)] rounded-full blur-3xl animate-[sunrise_20s_ease_infinite]"
                        style={{ transform: 'translate(-50%, -20%)' }}
                    />
                    <div
                        className="absolute inset-[-40%] bg-[radial-gradient(circle_at_20%_30%,rgba(255,237,153,0.20),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(255,200,87,0.18),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.12),transparent_60%),radial-gradient(circle_at_10%_70%,rgba(249,168,212,0.15),transparent_55%)] animate-[gradient_20s_ease_infinite] opacity-50"
                    />
                </div>
            )}

            {/* Main Sidebar for navigation to other pages */}
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

            {/* Docs-specific sidebar for internal navigation */}
            <ViewDocsSidebar
                activeSection={activeSection}
                expandedCategories={expandedCategories}
                onToggleCategory={toggleCategory}
                onSelectItem={scrollToSection}
                isDarkMode={isDarkMode}
            />

            <main className="flex-1 flex flex-col relative min-h-screen min-w-0 overflow-y-auto z-10 bg-transparent">
                <div className={`sticky top-0 backdrop-blur-xl z-30 border-b px-12 py-8 ${isDarkMode ? 'bg-[#020617]/95 border-white/5' : 'bg-white/80 border-[#fbbf24]/20'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className={`text-3xl font-bold mb-2 tracking-tight ${isDarkMode ? 'text-[#f8fbff]' : 'text-gray-900'}`}>
                                View Docs
                            </h1>
                            <p className={`text-base ${isDarkMode ? 'text-[#f8fbff]/80' : 'text-gray-700'}`}>
                                Document & Tutorials & Agent
                            </p>
                        </div>
                        <a
                            href="https://arxiv.org/pdf/2412.20138"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-all hover:scale-105 ${isDarkMode ? 'bg-[#00e33d] hover:bg-[#00c936] text-black shadow-green-500/20' : 'bg-gradient-to-r from-[#f59e0b] to-[#ec4899] text-white shadow-[0_8px_24px_rgba(245,158,11,0.3)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.4)]'}`}
                        >
                            <Download size={16} />
                            Download Document
                        </a>
                    </div>
                </div>

                <div className="px-8 md:px-12 w-full max-w-[1600px] pb-40 pt-10 mx-auto bg-transparent">

                    {/* ================= Document Sections ================= */}
                    <div className="mb-8">
                        <h2 className={`text-2xl font-bold tracking-tight border-b pb-4 ${isDarkMode ? 'text-[#f8fbff] border-white/10' : 'text-gray-900 border-[#fbbf24]/30'}`}>
                            Document
                        </h2>
                    </div>

                    <div className="flex flex-col gap-16 mb-24">
                        {documentSectionsWithTheme.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-40"
                            >
                                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#f8fbff]' : 'text-gray-900'}`}>
                                    {section.title}
                                </h3>
                                <div className={`text-base leading-relaxed ${isDarkMode ? 'text-[#f8fbff]/90' : 'text-gray-800'} ${!isDarkMode ? 'light-mode-content' : ''}`}>
                                    {section.id === 'introduction' ? (
                                        section.content
                                    ) : section.id === 'role-specialization' ? (
                                        <div className="space-y-4">
                                            <p>
                                                The framework assigns specialized roles to LLM agents, ensuring expert-level analysis across all market dimensions:
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                                <div className={`p-4 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
                                                    isDarkMode
                                                        ? "bg-zinc-800/40 border-zinc-700/60"
                                                        : "bg-white/80 backdrop-blur-sm border-[#fbbf24]/30 hover:border-[#f59e0b]/50 shadow-sm"
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? "text-cyan-400" : "text-[#d97706]"}`}>Fundamental Analysts</h3>
                                                    <p className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>Analyze company financial health, earnings reports, and macroeconomic indicators to determine long-term value.</p>
                                                </div>
                                                <div className={`p-4 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
                                                    isDarkMode
                                                        ? "bg-zinc-800/40 border-zinc-700/60"
                                                        : "bg-white/80 backdrop-blur-sm border-[#fbbf24]/30 hover:border-[#f59e0b]/50 shadow-sm"
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? "text-cyan-400" : "text-[#d97706]"}`}>Technical Analysts</h3>
                                                    <p className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>Study price action, trends, and volume patterns to identify optimal entry and exit points.</p>
                                                </div>
                                                <div className={`p-4 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
                                                    isDarkMode
                                                        ? "bg-zinc-800/40 border-zinc-700/60"
                                                        : "bg-white/80 backdrop-blur-sm border-[#fbbf24]/30 hover:border-[#f59e0b]/50 shadow-sm"
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? "text-cyan-400" : "text-[#d97706]"}`}>Sentiment Analysts</h3>
                                                    <p className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>Process news, social media, and market chatter to gauge market psychology and potential volatility.</p>
                                                </div>
                                                <div className={`p-4 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
                                                    isDarkMode
                                                        ? "bg-zinc-800/40 border-zinc-700/60"
                                                        : "bg-white/80 backdrop-blur-sm border-[#fbbf24]/30 hover:border-[#f59e0b]/50 shadow-sm"
                                                }`}>
                                                    <h3 className={`font-bold mb-2 ${isDarkMode ? "text-cyan-400" : "text-[#d97706]"}`}>Risk Management</h3>
                                                    <p className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>Monitor portfolio exposure and set strict limits to preserve capital and manage downside risk.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`${isDarkMode ? "" : "light-mode-content"}`}>
                                            {section.content}
                                        </div>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* ================= Tutorials Sections ================= */}
                    <div 
                        className="mb-8"
                        id="tutorials-header"
                    >
                        <h2 className={`text-2xl font-bold tracking-tight border-b pb-4 ${isDarkMode ? 'text-[#f8fbff] border-white/10' : 'text-gray-900 border-[#fbbf24]/30'}`}>
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
                                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"}`}>
                                    <span className={`font-mono ${isDarkMode ? "text-cyan-500" : "text-[#d97706]"}`}>{index + 1}.</span> {section.title}
                                </h3>
                                <div className="space-y-4">
                                    {section.steps.map((step, i) => {
                                        const [title, desc] = step.split(': ');
                                        return (
                                            <div key={i} className="flex gap-4 group">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm transition-all group-hover:scale-110 ${
                                                    isDarkMode
                                                        ? "bg-zinc-700/50 border-zinc-600 text-zinc-200"
                                                        : "bg-[#fbbf24]/20 border-[#f59e0b]/40 text-[#d97706]"
                                                }`}>
                                                    {i + 1}
                                                </div>
                                                <div className={`flex-1 p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg ${
                                                    isDarkMode
                                                        ? "bg-zinc-800/40 border-zinc-700/60"
                                                        : "bg-white/80 backdrop-blur-sm border-[#fbbf24]/30 hover:border-[#f59e0b]/50 shadow-sm"
                                                }`}>
                                                    <h4 className={`font-bold mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{title}</h4>
                                                    <p className={`text-sm leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
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
                    <div 
                        className="mb-8"
                        id="agents-header"
                    >
                        <h2 className={`text-2xl font-bold tracking-tight border-b pb-4 ${
                            isDarkMode
                                ? "text-[#f8fbff] border-white/10"
                                : "text-gray-900 border-[#fbbf24]/30"
                        }`}>
                            Our Agents
                        </h2>
                    </div>

                    <div className="flex flex-col gap-20">
                        {AGENT_TEAMS.map((team, teamIndex) => (
                            <section
                                key={team.id}
                                id={team.id}
                                className="scroll-mt-40"
                            >
                                <div className="mb-8">
                                    <h3 className={`text-xl font-bold mb-2 flex items-center gap-3 ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"}`}>
                                        {team.title}
                                    </h3>
                                    <p className={`text-base leading-relaxed border-l-2 pl-4 max-w-4xl ${
                                        isDarkMode
                                            ? "text-[#f8fbff]/80 border-white/10"
                                            : "text-gray-700 border-[#fbbf24]/30"
                                    }`}>
                                        {team.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {team.agents.map((agent) => (
                                        <div key={agent.id} className={`border rounded-xl p-6 relative overflow-hidden group h-full transition-all hover:scale-105 hover:shadow-lg ${
                                            isDarkMode
                                                ? "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600"
                                                : "bg-white/80 backdrop-blur-sm border-[#fbbf24]/30 hover:border-[#f59e0b]/50 shadow-sm"
                                        }`}>
                                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                                <div className={`p-2 rounded-lg border transition-all group-hover:scale-110 ${
                                                    isDarkMode
                                                        ? "bg-zinc-800/50 border-zinc-600"
                                                        : "bg-[#fbbf24]/20 border-[#f59e0b]/40"
                                                        }`}>
                                                        {agent.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold text-base ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"}`}>
                                                            {agent.title}
                                                        </h4>
                                                        <p className={`text-[11px] uppercase tracking-wider font-bold ${isDarkMode ? "text-cyan-500" : "text-[#d97706]"}`}>
                                                            {agent.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? "text-[#f8fbff]/80" : "text-gray-700"}`}>
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

"use client";

import React, { useState, useEffect, useMemo } from "react";
import ViewDocsNavbar from "../../components/ViewDocsNavbar";
import { useTheme } from "@/context/ThemeContext";
import {
    BarChart, BookOpen, Newspaper, Globe,
    TrendingUp, TrendingDown,
    Flame, Shield, Scale, Gavel,
    BrainCircuit, Activity, Zap, HelpCircle,
    Search, Users, Briefcase, ArrowRight,
    Target, RefreshCw, CheckCircle2,
    Calendar, Send, FileText, Download, Smartphone
} from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";

const TRANSLATIONS = {
    en: {
        tagline: "Trading Agents",
        title: "MULTI-AGENT SYSTEM",
        description: "Simulating a professional trading firm through collaborative AI. Moving beyond single-agent systems to mimic the multi-faceted decision-making process of successful investment houses.",
        features: {
            collab: { title: "Collaborative AI", desc: "Specialized agents (Market, Fundamental, Researcher) working in a DAG (Directed Acyclic Graph) workflow." },
            diverse: { title: "Multi-Modal Analysis", desc: "Integrates Quantitative Technicals (RSI, MACD), Fundamental Ratios (P/E, ROE), and News Sentiment." },
            debate: { title: "Adversarial Review", desc: "Bull & Bear agents debate the thesis to eliminate hallucination and bias before execution." }
        },
        workflow: {
            header: "Agent Workflow Pipeline",
            subheader: "From raw data to executed trade: a 4-step automated process",
            steps: [
                { title: "Data Mining", desc: "Analysts fetch & process raw market/financial data" },
                { title: "Thesis Generation", desc: "Bull & Bear researchers form opposing arguments" },
                { title: "Synthesis", desc: "Trader Agent weighs evidence to form a consensus" },
                { title: "Risk Check", desc: "Final validation of entry/exit points against risk rules" }
            ]
        },
        teams: {
            header: "Specialized Agent Teams",
            analyst: {
                title: "Analyst Team",
                desc: "The Data Layer. Responsible for fetching, cleaning, and calculating raw metrics.",
                market: { title: "Technical Analyst", desc: "Calculates SMA-50, EMA-10, RSI, MACD, and Bollinger Bands to identify Trend & Momentum." },
                fundamental: { title: "Fundamental Analyst", desc: "Analyzes 10-year financials: Revenue Growth, P/E Ratio, Debt-to-Equity, and Free Cash Flow." },
                news: { title: "News Analyst", desc: "Scrapes global headlines to assess Macro sentiment and specific catalysts." },
                social: { title: "Social Analyst", desc: "Quantifies retail sentiment (Fear/Greed index) from social platforms." }
            },
            research: {
                title: "Research Team",
                desc: "The Logic Layer. Interprets the data to form coherent investment theses.",
                manager: { title: "Research Manager", desc: "Orchestrator. Assigns tasks and ensures the debate stays fact-based." },
                bull: { title: "Bull Researcher", desc: "Constructs a Growth Thesis focusing on upside potential and undervalued assets." },
                bear: { title: "Bear Researcher", desc: "Constructs a Risk Thesis focusing on overvaluation, weak financials, or technical breakdown." }
            },

        },
        execution: {
            header: "Execution & Risk Management",
            subheader: "The Decision Layer. Converting analysis into actionable orders.",
            trader: { title: "Chief Trader", desc: "Synthesizes the Bull vs Bear debate. Determines the final Signal (Buy/Sell/Hold) and Confidence Score." },
            submit: "Submit Plan",
            risk: { title: "Risk Controller", desc: "Validates the trade. Calculates Position Size, Stop Loss, and Take Profit levels based on volatility (ATR)." },
            manager: { title: "Portfolio Manager", desc: "Final Sign-off. Executes the approved order into the system." },
            levels: { aggressive: "Aggressive", neutral: "Neutral", conservative: "Conservative" }
        },
        tutorials: {
            header: "User Guide",
            subheader: "A step-by-step guide to generating and reviewing AI trading analysis.",
            step1: {
                title: "Generate Analysis",
                desc: "Navigate to the Dashboard to start a new simulation.",
                points: [
                    { title: "Input Parameters", desc: "Select a Market (e.g. US), enter a Ticker (e.g. AAPL), and pick an Analysis Date." },
                    { title: "Start Simulation", desc: "Click the 'Generate' button to initialize the agent fleet." }
                ]
            },
            step2: {
                title: "Monitor Progress",
                desc: "Watch the analysis unfold in real-time.",
                points: [
                    { title: "Progress Bar", desc: "Track the completion status of Data Gathering, Research, and Trading phases." },
                    { title: "Live Logs", desc: "View detailed internal logs to see what each agent is doing." }
                ]
            },
            step3: {
                title: "Review Results",
                desc: "Analyze the generated report.",
                points: [
                    { title: "Recommendation", desc: "See the final Buy/Sell signal and Confidence Score." },
                    { title: "Detailed Report", desc: "Read the full thesis, including Bull vs Bear arguments and financial metrics." }
                ]
            },
            step4: {
                title: "View History",
                desc: "Access past analyses.",
                points: [
                    { title: "History Page", desc: "Navigate to the 'History' tab to see a list of all previous runs." },
                    { title: "Re-visit Reports", desc: "Click on any past item to view the full PDF report or summary." }
                ]
            }
        }
    },
    th: {
        tagline: "Trading Agents",
        title: "MULTI-AGENT SYSTEM",
        description: "ระบบจำลองทีมวิเคราะห์การลงทุนระดับสถาบันด้วย AI ที่ทำงานร่วมกัน (Cooperative AI) เพื่อเลียนแบบกระบวนการตัดสินใจที่รัดกุมและตรวจสอบได้",
        features: {
            collab: { title: "Collaborative AI", desc: "การทำงานร่วมกันของ Agent ผู้เชี่ยวชาญเฉพาะด้าน (Technical, Fundamental, Research) แบบเป็นขั้นเป็นตอน" },
            diverse: { title: "Multi-Modal Analysis", desc: "วิเคราะห์ครบทุกมิติ: ปัจจัยทางเทคนิค (RSI, MACD), ปัจจัยพื้นฐาน (งบการเงิน), และข่าวสาร (Sentiment)" },
            debate: { title: "Adversarial Review", desc: "กระบวนการ Debates ระหว่างทีม Bull และ Bear เพื่อลบความลำเอียง (Bias) ก่อนตัดสินใจ" }
        },
        workflow: {
            header: "Agent Workflow Pipeline",
            subheader: "กระบวนการทำงานอัตโนมัติ 4 ขั้นตอน: จากข้อมูลดิบสู่คำสั่งซื้อขาย",
            steps: [
                { title: "Data Mining", desc: "Analyst ดึงข้อมูลราคาและงบการเงิน พร้อมคำนวณตัวชี้วัด" },
                { title: "Thesis Generation", desc: "Research สร้างสมมติฐานการลงทุนทั้งฝั่งบวกและลบ" },
                { title: "Synthesis", desc: "Trader ชั่งน้ำหนักข้อมูลทั้งหมดเพื่อหาข้อสรุป (Consensus)" },
                { title: "Risk Check", desc: "ตรวจสอบความเสี่ยงและกำหนดจุดซื้อขายที่เหมาะสม" }
            ]
        },
        teams: {
            header: "Specialized Agent Teams",
            analyst: {
                title: "Analyst Team",
                desc: "หน่วยรวบรวมข้อมูล: เปรียบเสมือน Junior Analyst ที่คอยเตรียมข้อมูลดิบให้พร้อม",
                market: { title: "Technical Analyst", desc: "คำนวณอินดิเคเตอร์เชิงเทคนิค: SMA, EMA, RSI, MACD, Bollinger Bands เพื่อหาแนวโน้ม (Trend)" },
                fundamental: { title: "Fundamental Analyst", desc: "วิเคราะห์สุขภาพการเงิน 10 ปีย้อนหลัง: การเติบโตของรายได้, P/E, D/E Ratio และ ROE" },
                news: { title: "News Analyst", desc: "รวบรวมข่าวเศรษฐกิจรอบโลกเพื่อวิเคราะห์ Sentiment ตลาด" },
                social: { title: "Social Analyst", desc: "จับอารมณ์นักลงทุนรายย่อย (Fear & Greed) จากโซเชียลมีเดีย" }
            },
            research: {
                title: "Research Team",
                desc: "หน่วยวิเคราะห์: แปรผลข้อมูลดิบให้เป็นบทวิเคราะห์ที่มีเหตุผลรองรับ",
                manager: { title: "Research Manager", desc: "ผู้คุมกฎ: จัดการการประชุมและดูแลให้การถกเถียงอยู่บนพื้นฐานของข้อมูล" },
                bull: { title: "Bull Researcher", desc: "ทีมมองขึ้น: หาเหตุผลสนับสนุนให้ 'ซื้อ' (Growth, Undervalued)" },
                bear: { title: "Bear Researcher", desc: "ทีมมองลง: หาจุดอ่อนและความเสี่ยง เพื่อสนับสนุนให้ 'ขาย' หรือ 'Wait'" }
            }
        },
        execution: {
            header: "Execution & Risk Management",
            subheader: "หน่วยตัดสินใจ: แปลงบทวิเคราะห์ให้เป็นแผนการเทรดจริง",
            trader: { title: "Chief Trader", desc: "ผู้ติดสินใจ: ฟังเหตุผลของ Bull/Bear แล้วสรุปเป็น Signal (Buy/Sell) พร้อมระดับความมั่นใจ" },
            submit: "ส่งแผน",
            risk: { title: "Risk Controller", desc: "ฝ่ายบริหารความเสี่ยง: คำนวณ Position Size, Stop Loss และ Take Profit ตามค่าความผันผวน (ATR)" },
            manager: { title: "Portfolio Manager", desc: "ผู้อนุมัติ: ตรวจสอบครั้งสุดท้ายและส่งคำสั่งเข้าระบบ" },
            levels: { aggressive: "Aggressive", neutral: "Neutral", conservative: "Conservative" }
        },
        tutorials: {
            header: "User Guide",
            subheader: "คู่มือการใช้งานระบบ: ตั้งแต่การสร้างคำสั่งจนถึงการดูประวัติย้อนหลัง",
            step1: {
                title: "Generate Analysis",
                desc: "เริ่มการวิเคราะห์หุ้นโดยไปที่หน้า Generate",
                points: [
                    { title: "ระบุข้อมูล", desc: "เลือกตลาด (Market), พิมพ์ชื่อหุ้น (Ticker) และเลือกวันที่ที่ต้องการวิเคราะห์" },
                    { title: "กดปุ่ม Generate", desc: "เพื่อเริ่มกระบวนการจำลองการเทรดของทีม AI" }
                ]
            },
            step2: {
                title: "Monitor Progress",
                desc: "ติดตามการทำงานของระบบแบบเรียลไทม์",
                points: [
                    { title: "ดู Progress Bar", desc: "เพื่อดูความคืบหน้าของแต่ละขั้นตอน (Data, Research, Trading)" },
                    { title: "อ่าน Live Logs", desc: "เพื่อดูรายละเอียดสิ่งที่ Agent กำลังทำอยู่เบื้องหลัง" }
                ]
            },
            step3: {
                title: "Review Results",
                desc: "ดูผลสรุปการวิเคราะห์เมื่อระบบทำงานเสร็จ",
                points: [
                    { title: "Recommendation", desc: "ดูคำแนะนำ (Buy/Sell) และคะแนนความมั่นใจ" },
                    { title: "Full Report", desc: "อ่านเหตุผลประกอบการตัดสินใจของแต่ละฝ่ายอย่างละเอียด" }
                ]
            },
            step4: {
                title: "View History",
                desc: "ดูประวัติการวิเคราะห์ย้อนหลัง",
                points: [
                    { title: "ไปที่หน้า History", desc: "เพื่อดูรายการหุ้นทั้งหมดที่เคยวิเคราะห์ไปแล้ว" },
                    { title: "ดูรายละเอียด", desc: "กดที่รายการเพื่อดูรายงานฉบับเต็มหรือดาวน์โหลด PDF" }
                ]
            }
        }
    }
};

export default function ViewDocsPage() {
    const { isDarkMode } = useTheme();
    const [activeSection, setActiveSection] = useState('introduction');
    const [mounted, setMounted] = useState(false);
    const { language } = useLanguage();

    const t = TRANSLATIONS[language];

    // Generate stars for background
    const stars = useMemo(() => {
        return Array.from({ length: 150 }).map((_, i) => {
            const size = Math.random() * 2 + 0.5;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            const opacity = Math.random() * 0.8 + 0.2;
            return { id: i, size, left, top, delay, duration, opacity };
        });
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll handling for active section
    useEffect(() => {
        const scrollContainer = document.getElementById('main-content') || window;
        const handleScroll = () => {
            const sections = ['introduction', 'role-specialization', 'tutorials-header'];
            // @ts-ignore
            const scrollPosition = (parseInt(scrollContainer.scrollTop) || window.scrollY) + 300;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection(section);
                }
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        const scrollContainer = document.getElementById('main-content') || window;

        if (element) {
            // @ts-ignore
            if (scrollContainer.scrollTo) {
                // @ts-ignore
                const top = element.offsetTop - 100;
                // @ts-ignore
                scrollContainer.scrollTo({ top, behavior: 'smooth' });
            } else {
                element.scrollIntoView({ behavior: 'smooth' });
            }
            setActiveSection(id);
        }
    };



    return (
        <div className={`min-h-screen w-full font-sans selection:bg-[#2df4c6]/30 ${isDarkMode ? 'bg-[#0b0e14] text-[#f8fbff]' : 'text-slate-900'}`}>
            <style jsx global>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .text-glow {
                    text-shadow: 0 0 20px rgba(45,244,198,0.3);
                }
                .card-glow:hover {
                    box-shadow: 0 0 30px rgba(45,244,198,0.15);
                }

                /* ==================== LIGHT MODE - OCEAN WAVES ==================== */
                .ocean-base-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, #F5FAFF 0%, #E0F7FA 50%, #B2EBF2 100%);
                    z-index: 0;
                }

                .wave-layer {
                    position: absolute;
                    inset: 0;
                    background-size: 200% 100%;
                    background-repeat: repeat-x;
                    z-index: 1;
                    opacity: 0.4;
                }

                .wave-layer-1 {
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(128, 222, 234, 0.3) 25%,
                        rgba(178, 235, 242, 0.2) 50%,
                        rgba(224, 247, 250, 0.3) 75%,
                        transparent 100%
                    );
                    animation: waveFlow1 50s linear infinite;
                }

                .wave-layer-2 {
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(178, 235, 242, 0.25) 30%,
                        rgba(128, 222, 234, 0.2) 60%,
                        rgba(224, 247, 250, 0.25) 90%,
                        transparent 100%
                    );
                    animation: waveFlow2 60s linear infinite;
                    animation-delay: -10s;
                }

                .wave-layer-3 {
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(224, 247, 250, 0.2) 20%,
                        rgba(178, 235, 242, 0.25) 40%,
                        rgba(128, 222, 234, 0.2) 60%,
                        rgba(178, 235, 242, 0.2) 80%,
                        transparent 100%
                    );
                    animation: waveFlow3 70s linear infinite;
                    animation-delay: -20s;
                }

                @keyframes waveFlow1 {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 200% 0%; }
                }

                @keyframes waveFlow2 {
                    0% { background-position: 0% 0%; }
                    100% { background-position: -200% 0%; }
                }

                @keyframes waveFlow3 {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 200% 0%; }
                }
            `}</style>

            {/* Background Effects */}
            {mounted && isDarkMode && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#2df4c6]/5 blur-[100px]" />
                    {stars.map((star) => (
                        <div
                            key={star.id}
                            className="absolute rounded-full bg-white"
                            style={{
                                width: `${star.size}px`, height: `${star.size}px`,
                                left: `${star.left}%`, top: `${star.top}%`,
                                opacity: star.opacity,
                                animation: `twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Light Mode - Ocean Waves Background */}
            {mounted && !isDarkMode && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Ocean Base Gradient */}
                    <div className="ocean-base-gradient" />

                    {/* Wave Layer 1 */}
                    <div className="wave-layer wave-layer-1" />

                    {/* Wave Layer 2 */}
                    <div className="wave-layer wave-layer-2" />

                    {/* Wave Layer 3 */}
                    <div className="wave-layer wave-layer-3" />
                </div>
            )}

            {/* Floating Controls (Top Right) */}
            <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
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


            </div>

            <main className="relative z-10 pt-8 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-20">

                {/* HERO / INTRODUCTION */}
                <section id="introduction" className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className={`border px-6 py-2 rounded-full text-lg font-extrabold tracking-widest uppercase mb-4 ${isDarkMode ? "border-[#2df4c6]/30 bg-[#2df4c6]/5 text-[#2df4c6]" : "border-[#0f766e]/30 bg-[#0f766e]/10 text-[#0f766e]"}`}>
                        {t.tagline}
                    </div>
                    <h1 className={`text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent pb-2 text-glow ${isDarkMode ? 'bg-linear-to-r from-white via-[#2df4c6] to-white' : 'bg-linear-to-r from-slate-900 via-blue-600 to-slate-900'}`}>
                        {t.title}
                    </h1>
                    <p className={`max-w-3xl text-xl md:text-2xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                        {t.description}
                    </p>

                    {/* Key Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                                <BrainCircuit size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.features.collab.title}</h3>
                            <p className={`text-base ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{t.features.collab.desc}</p>
                        </div>
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="h-10 w-10 rounded-lg bg-[#2df4c6]/20 text-[#2df4c6] flex items-center justify-center mb-4">
                                <Search size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.features.diverse.title}</h3>
                            <p className={`text-base ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{t.features.diverse.desc}</p>
                        </div>
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="h-10 w-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                                <Gavel size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.features.debate.title}</h3>
                            <p className={`text-base ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{t.features.debate.desc}</p>
                        </div>
                    </div>
                </section>

                <div className="w-full h-px bg-linear-to-r from-transparent via-[#2df4c6]/30 to-transparent" />

                {/* WORKFLOW INFOGRAPHIC */}
                <section id="agent-workflow" className="scroll-mt-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">{t.workflow.header}</h2>
                        <p className={`text-base ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{t.workflow.subheader}</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-1 bg-linear-to-r from-blue-900 via-[#2df4c6]/50 to-blue-900 z-0" />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            {[
                                { title: t.workflow.steps[0].title, desc: t.workflow.steps[0].desc, icon: <Search size={32} />, color: "border-blue-500 text-blue-500" },
                                { title: t.workflow.steps[1].title, desc: t.workflow.steps[1].desc, icon: <Users size={32} />, color: "border-[#2df4c6] text-[#2df4c6]" },
                                { title: t.workflow.steps[2].title, desc: t.workflow.steps[2].desc, icon: <BrainCircuit size={32} />, color: "border-purple-500 text-purple-500" },
                                { title: t.workflow.steps[3].title, desc: t.workflow.steps[3].desc, icon: <Target size={32} />, color: "border-green-500 text-green-500" },
                            ].map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center group">
                                    <div className={`w-32 h-32 rounded-full border-4 ${step.color} ${isDarkMode ? 'bg-[#0b0e14]' : 'bg-white'} flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 duration-300`}>
                                        {step.icon}
                                    </div>
                                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-sm font-bold mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                                        {idx + 1}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                    <p className={`text-base px-4 ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ANALYST & RESEARCH TEAMS (Infographic Style) */}
                <section id="role-specialization" className="scroll-mt-32 space-y-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">{t.teams.header}</h2>
                    </div>

                    <div className={`rounded-3xl overflow-hidden border backdrop-blur-sm ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'}`}>

                        {/* Analyst Team Strip */}
                        <div className={`grid grid-cols-1 lg:grid-cols-[300px_1fr] border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className={`p-8 flex flex-col justify-center border-r ${isDarkMode ? 'bg-blue-900/20 border-slate-700/50' : 'bg-blue-50 border-slate-100'}`}>
                                <h3 className="text-2xl font-bold text-blue-400 mb-2">{t.teams.analyst.title}</h3>
                                <p className={`text-base ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{t.teams.analyst.desc}</p>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.analyst.market.title} icon={<BarChart />} desc={t.teams.analyst.market.desc} color="text-cyan-400" />
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.analyst.fundamental.title} icon={<BookOpen />} desc={t.teams.analyst.fundamental.desc} color="text-blue-400" />
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.analyst.news.title} icon={<Newspaper />} desc={t.teams.analyst.news.desc} color="text-green-400" />
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.analyst.social.title} icon={<Globe />} desc={t.teams.analyst.social.desc} color="text-purple-400" />
                            </div>
                        </div>

                        {/* Research Team Strip */}
                        <div className={`grid grid-cols-1 lg:grid-cols-[300px_1fr] ${isDarkMode ? 'bg-green-900/5' : 'bg-slate-50'}`}>
                            <div className={`p-8 flex flex-col justify-center border-r ${isDarkMode ? 'bg-green-900/20 border-slate-700/50' : 'bg-green-50 border-slate-100'}`}>
                                <h3 className="text-2xl font-bold text-green-400 mb-2">{t.teams.research.title}</h3>
                                <p className={`text-base ${isDarkMode ? 'opacity-70' : 'text-slate-700'}`}>{t.teams.research.desc}</p>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.research.manager.title} icon={<Briefcase />} desc={t.teams.research.manager.desc} color={isDarkMode ? "text-white" : "text-slate-700"} />
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.research.bull.title} icon={<TrendingUp />} desc={t.teams.research.bull.desc} color="text-green-500" />
                                <TeamMemberCard isDarkMode={isDarkMode} title={t.teams.research.bear.title} icon={<TrendingDown />} desc={t.teams.research.bear.desc} color="text-red-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* BOTTOM SECTION: TRADER & RISK (Purple area) */}
                <section id="trader-team" className={`rounded-3xl border p-8 md:p-12 relative overflow-hidden text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="relative z-10 mb-12">
                        <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.execution.header}</h2>
                        <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>{t.execution.subheader}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {/* Trader */}
                        <div className="text-center group">
                            <div className="w-24 h-24 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-4 ring-2 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                <Zap size={40} />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.execution.trader.title}</h3>
                            <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>{t.execution.trader.desc}</p>
                        </div>

                        {/* Arrows pointing to Manager */}
                        <div className="hidden md:flex flex-col justify-center items-center opacity-50">
                            <ArrowRight size={40} className={`mb-2 ${isDarkMode ? 'text-white' : 'text-slate-400'}`} />
                            <div className={`text-sm uppercase tracking-widest ${isDarkMode ? '' : 'text-slate-600'}`}>{t.execution.submit}</div>
                        </div>

                        {/* Risk Manager */}
                        <div className="text-center group">
                            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <Shield size={40} />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.execution.risk.title}</h3>
                            <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>{t.execution.risk.desc}</p>
                            <div className="flex justify-center gap-2 mt-4">
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 text-[10px] rounded">{t.execution.levels.aggressive}</span>
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-[10px] rounded">{t.execution.levels.neutral}</span>
                                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-[10px] rounded">{t.execution.levels.conservative}</span>
                            </div>
                        </div>
                    </div>

                    {/* Manager at Bottom */}
                    <div className="mt-16 text-center border-t border-white/10 pt-12">
                        <div className="inline-flex flex-col items-center">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-4 ring-4 ring-blue-500/20">
                                <Gavel size={32} />
                            </div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.execution.manager.title}</h3>
                            <p className={`text-base max-w-md ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>{t.execution.manager.desc}</p>
                        </div>
                    </div>
                </section>

                {/* TUTORIALS SECTION */}
                <section id="tutorials-header" className="pt-16 pb-32">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent ${isDarkMode ? 'bg-linear-to-r from-white via-slate-200 to-slate-400' : 'bg-linear-to-r from-slate-900 via-slate-700 to-slate-500'}`}>
                            {t.tutorials.header}
                        </h2>
                        <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                            {t.tutorials.subheader}
                        </p>
                    </div>

                    <div className="space-y-24">
                        {/* Step 1: Search / Start */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="text-green-500 bg-green-500/10 p-3 rounded-full font-bold">1</div>
                                    <h3 className="text-2xl font-bold">{t.tutorials.step1.title}</h3>
                                </div>
                                <p className={`text-xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                                    {t.tutorials.step1.desc}
                                </p>
                                <ul className="space-y-4 pt-4">
                                    {t.tutorials.step1.points.map((point, idx) => (
                                        <li key={idx} className="flex gap-4">
                                            <div className="mt-1 text-green-400"><CheckCircle2 size={20} /></div>
                                            <div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{point.title}</div>
                                                <div className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>{point.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-r from-[#2df4c6] to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={isDarkMode ? "/ST1,2.png" : "/ST1,2_w.png"}
                                    alt="Analysis Generation UI"
                                    className="relative w-full rounded-2xl shadow-2xl border border-white/10"
                                />
                            </div>
                        </div>

                        {/* Step 2: Reports */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:order-2 lg:col-span-5 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="text-orange-500 bg-orange-500/10 p-3 rounded-full font-bold">2</div>
                                    <h3 className="text-2xl font-bold">{t.tutorials.step2.title}</h3>
                                </div>
                                <p className={`text-xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{t.tutorials.step2.desc}</p>
                                <ul className="space-y-4 pt-4">
                                    {t.tutorials.step2.points.map((point, idx) => (
                                        <li key={idx} className="flex gap-4">
                                            <div className="mt-1 text-orange-400"><CheckCircle2 size={20} /></div>
                                            <div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{point.title}</div>
                                                <div className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>{point.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:order-1 lg:col-span-7 relative group">
                                <div className="absolute -inset-1 bg-linear-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={isDarkMode ? "/progress.png" : "/progress_w.png"}
                                    alt="Analysis Progress UI"
                                    className="relative w-full h-auto rounded-2xl shadow-2xl border border-white/10"
                                />
                            </div>
                        </div>

                        {/* Step 3: Telegram */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-5 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="text-blue-500 bg-blue-500/10 p-3 rounded-full font-bold">3</div>
                                    <h3 className="text-2xl font-bold">{t.tutorials.step3.title}</h3>
                                </div>
                                <p className={`text-xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{t.tutorials.step3.desc}</p>
                                <ul className="space-y-4 pt-4">
                                    {t.tutorials.step3.points.map((point, idx) => (
                                        <li key={idx} className="flex gap-4">
                                            <div className="mt-1 text-blue-400"><Smartphone size={20} /></div>
                                            <div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{point.title}</div>
                                                <div className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>{point.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:col-span-7 flex flex-col gap-6 relative group">
                                <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-[3rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={isDarkMode ? "/summary.png" : "/summary_w.png"}
                                    alt="Analysis Summary UI"
                                    className="relative w-full h-auto rounded-2xl shadow-2xl border border-white/10"
                                />
                                <img
                                    src={isDarkMode ? "/report.png" : "/report_w.png"}
                                    alt="Analysis Report UI"
                                    className="relative w-full h-auto rounded-2xl shadow-2xl border border-white/10"
                                />
                            </div>
                        </div>

                        {/* Step 4: Export */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="lg:order-2 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="text-slate-400 bg-slate-500/10 p-3 rounded-full font-bold">4</div>
                                    <h3 className="text-2xl font-bold">{t.tutorials.step4.title}</h3>
                                </div>
                                <p className={`text-xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{t.tutorials.step4.desc}</p>
                                <ul className="space-y-4 pt-4">
                                    {t.tutorials.step4.points.map((point, idx) => (
                                        <li key={idx} className="flex gap-4">
                                            <div className="mt-1 text-slate-400"><FileText size={20} /></div>
                                            <div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{point.title}</div>
                                                <div className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>{point.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:order-1 relative group flex justify-center">
                                <div className="absolute -inset-1 bg-linear-to-r from-slate-600 to-slate-400 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={isDarkMode ? "/history.png" : "/history_w.png"}
                                    alt="Analysis History UI"
                                    className="relative w-full h-auto rounded-2xl shadow-xl border border-white/10"
                                />
                            </div>
                        </div>

                    </div>
                </section>

            </main>
        </div>
    );
}

// Helper Components for Cleaner JSX
// Helper Components for Cleaner JSX
function TeamMemberCard({ title, icon, desc, color, isDarkMode }: { title: string, icon: React.ReactNode, desc: string, color: string, isDarkMode: boolean }) {
    return (
        <div className={`p-5 rounded-xl border transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-[#0b0e14]/50 border-white/5 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
            <div className={`mb-3 ${color} flex items-center gap-2`}>
                {/* @ts-ignore */}
                {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                <h4 className={`font-bold text-base tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{desc}</p>
        </div>
    );
}

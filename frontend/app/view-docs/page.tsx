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
    Target, RefreshCw, CheckCircle2
} from 'lucide-react';

const TRANSLATIONS = {
    EN: {
        tagline: "Trading Agents Framework",
        title: "MULTI-AGENT SYSTEM",
        description: "Simulating a professional trading firm through collaborative AI. Moving beyond single-agent systems to mimic the multi-faceted decision-making process of successful investment houses.",
        features: {
            collab: { title: "Collaborative AI", desc: "LLM-powered specialized agents working together in a structured hierarchy." },
            diverse: { title: "Diverse Perspectives", desc: "Integrates Fundamental, Technical, and Sentiment analysis for holistic views." },
            debate: { title: "Structured Debate", desc: "Bull & Bear researchers challenge assumptions before final execution." }
        },
        workflow: {
            header: "Agent Workflow Pipeline",
            subheader: "From raw data to executed trade: a 4-step automated process",
            steps: [
                { title: "Data Gathering", desc: "Specialists gather data & form hypotheses" },
                { title: "Bull & Bear Debate", desc: "Opposing viewpoints challenge assumptions" },
                { title: "Synthesis", desc: "Traders weigh evidence & form a plan" },
                { title: "Execution", desc: "Risk checks & final trade execution" }
            ]
        },
        teams: {
            header: "Specialized Agent Teams",
            analyst: {
                title: "Analyst Team",
                desc: "The foundation. Collecting and processing raw data from diverse sources.",
                market: { title: "Market Data", desc: "Historical prices, volume, ratios" },
                fundamental: { title: "Fundamental", desc: "Reports, balance sheets, intrinsic value" },
                news: { title: "News Agent", desc: "Global newswires, economic events" },
                social: { title: "Social Agent", desc: "Market psychology, fear/greed trends" }
            },
            research: {
                title: "Research Team",
                desc: "The war room. Moderated debate to form a balanced thesis.",
                manager: { title: "Research Manager", desc: "CIO. Moderates debate, forms thesis" },
                bull: { title: "Bull Researcher", desc: "Focuses on growth & upside catalysts" },
                bear: { title: "Bear Researcher", desc: "Focuses on risks, valuation gaps" }
            }
        },
        execution: {
            header: "Execution & Risk Management",
            subheader: "The final checkpoint. Synthesis and safety checks.",
            trader: { title: "Trader Agent", desc: "Executor. Synthesizes conflicting data into a coherent \"Investment Plan\"." },
            submit: "Submit Plan",
            risk: { title: "Risk Team", desc: "\"Council of Risks\". Adjudicates between aggressive and conservative approaches." },
            manager: { title: "Manager Agent", desc: "Final Decision Maker. Executes the risk-adjusted plan." },
            levels: { aggressive: "Aggressive", neutral: "Neutral", conservative: "Conservative" }
        },
        tutorials: {
            header: "Platform Tutorials",
            step1: { title: "Starting an Analysis", desc: "Enter a ticker (e.g., AAPL), select your date range, and click Generate to start the swarm." },
            step2: { title: "Understanding Reports", desc: "Review individual agent outputs, observe the Bull/Bear debate, and check the final verdict." },
            step3: { title: "Connecting Telegram Alerts", desc: "Link your account to our Telegram bot to receive real-time notifications when reports are ready." },
            step4: { title: "Exporting to PDF", desc: "Once analysis is complete, download a professional-grade PDF report for offline application." }
        }
    },
    TH: {
        tagline: "ระบบ Trading Agents",
        title: "ระบบเทรดแบบหลาย Agent",
        description: "ระบบจำลองทีมเทรดอัจฉริยะที่ใช้ AI หลายตัวทำงานร่วมกัน ช่วยให้การตัดสินใจลงทุนรอบคอบขึ้น เหมือนมีทีมผู้เชี่ยวชาญคอยช่วยวิเคราะห์",
        features: {
            collab: { title: "ทำงานเป็นทีม", desc: "AI แต่ละตัวมีหน้าที่ชัดเจน และส่งต่อข้อมูลหากันอย่างเป็นระบบ" },
            diverse: { title: "มองรอบด้าน", desc: "วิเคราะห์ครบทั้งพื้นฐาน กราฟเทคนิค และข่าวสาร เพื่อไม่ให้พลาดทุกประเด็น" },
            debate: { title: "มีระบบถ่วงดุล", desc: "มีฝ่ายเชียร์และฝ่ายค้าน คอยโต้แย้งข้อมูลกันเพื่อหาข้อสรุปที่ดีที่สุด" }
        },
        workflow: {
            header: "ขั้นตอนการทำงาน",
            subheader: "จากข้อมูลดิบสู่คำสั่งซื้อขาย: ทำงานอัตโนมัติ 4 ขั้นตอน",
            steps: [
                { title: "หาข้อมูล", desc: "ทีมงานรวบรวมข้อมูลดิบและตั้งข้อสังเกตเบื้องต้น" },
                { title: "ถกเถียง", desc: "ฝ่าย Bull (มองขึ้น) และ Bear (มองลง) โต้เถียงกันด้วยข้อมูล" },
                { title: "ตัดสินใจ", desc: "Trader รวบรวมข้อมูลทั้งหมดแล้ววางแผนการเทรด" },
                { title: "ดำเนินการ", desc: "ตรวจสอบความเสี่ยงครั้งสุดท้ายแล้วส่งคำสั่งซื้อขาย" }
            ]
        },
        teams: {
            header: "ทีมงานผู้เชี่ยวชาญ",
            analyst: {
                title: "ทีมนักวิเคราะห์",
                desc: "ฝ่ายหาข้อมูล รวบรวมข้อมูลดิบจากแหล่งต่างๆ มาเตรียมไว้",
                market: { title: "ข้อมูลตลาด", desc: "ดูราคา ปริมาณการซื้อขาย และงบการเงิน" },
                fundamental: { title: "ปัจจัยพื้นฐาน", desc: "อ่านรายงานประจำปี งบดุล และประเมินมูลค่าหุ้น" },
                news: { title: "ข่าวสาร", desc: "ติดตามข่าวรอบโลกและตัวเลขเศรษฐกิจ" },
                social: { title: "กระแสสังคม", desc: "จับอารมณ์ตลาดจากโซเชียลมีเดีย" }
            },
            research: {
                title: "ทีมวิจัย",
                desc: "ห้องประชุม นำข้อมูลมาถกเถียงกันเพื่อหาข้อสรุป",
                manager: { title: "หัวหน้าทีมวิจัย", desc: "คุมการประชุมและสรุปผลการวิเคราะห์" },
                bull: { title: "ฝ่ายมองขึ้น", desc: "หาเหตุผลว่าทำไมหุ้นตัวนี้ถึงน่าจะขึ้น" },
                bear: { title: "ฝ่ายมองลง", desc: "หาความเสี่ยงและเหตุผลที่หุ้นอาจจะตก" }
            }
        },
        execution: {
            header: "ส่วนตัดสินใจและคุมความเสี่ยง",
            subheader: "ด่านสุดท้ายก่อนเทรดจริง",
            trader: { title: "Trader", desc: "คนกลาง ฟังข้อมูลจากทุกฝ่ายแล้วเขียนแผนการเทรด" },
            submit: "ส่งแผน",
            risk: { title: "ทีมคุมความเสี่ยง", desc: "กรรมการ ตรวจเช็คความปลอดภัยของแผน" },
            manager: { title: "ผู้จัดการ", desc: "คนเคาะ สั่งซื้อขายตามแผนที่ผ่านการตรวจสอบแล้ว" },
            levels: { aggressive: "สายซิ่ง", neutral: "ปานกลาง", conservative: "ปลอดภัยไว้ก่อน" }
        },
        tutorials: {
            header: "วิธีใช้งาน",
            step1: { title: "เริ่มใช้งาน", desc: "พิมพ์ชื่อหุ้น (เช่น AAPL) เลือกวันที่ แล้วกดปุ่ม Generate" },
            step2: { title: "อ่านผลลัพธ์", desc: "ดูสิ่งที่ AI แต่ละตัวคุยกัน และดูผลสรุปสุดท้าย" },
            step3: { title: "รับแจ้งเตือน", desc: "เชื่อมต่อกับ Telegram เพื่อรับการแจ้งเตือนเมื่อวิเคราะห์เสร็จ" },
            step4: { title: "โหลดรายงาน", desc: "โหลดไฟล์ PDF เก็บไว้อ่านหรือนำไปใช้งานต่อได้เลย" }
        }
    }
};

export default function ViewDocsPage() {
    const { isDarkMode } = useTheme();
    const [activeSection, setActiveSection] = useState('introduction');
    const [mounted, setMounted] = useState(false);
    const [language, setLanguage] = useState<'EN' | 'TH'>('EN');

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

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'EN' ? 'TH' : 'EN');
    };

    return (
        <div className={`min-h-screen w-full font-sans selection:bg-[#2df4c6]/30 ${isDarkMode ? 'bg-[#0b0e14] text-[#f8fbff]' : 'bg-slate-50 text-slate-900'}`}>
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

            <ViewDocsNavbar
                activeSection={activeSection}
                onSelectItem={scrollToSection}
                language={language}
                onToggleLanguage={toggleLanguage}
            />

            <main className="relative z-10 pt-8 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-20">

                {/* HERO / INTRODUCTION */}
                <section id="introduction" className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="border border-[#2df4c6]/30 bg-[#2df4c6]/5 px-6 py-2 rounded-full text-[#2df4c6] text-sm font-bold tracking-wider uppercase mb-4">
                        {t.tagline}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-[#2df4c6] to-white pb-2 text-glow">
                        {t.title}
                    </h1>
                    <p className={`max-w-3xl text-lg md:text-xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {t.description}
                    </p>

                    {/* Key Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                                <BrainCircuit size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.features.collab.title}</h3>
                            <p className="text-sm opacity-70">{t.features.collab.desc}</p>
                        </div>
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="h-10 w-10 rounded-lg bg-[#2df4c6]/20 text-[#2df4c6] flex items-center justify-center mb-4">
                                <Search size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.features.diverse.title}</h3>
                            <p className="text-sm opacity-70">{t.features.diverse.desc}</p>
                        </div>
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="h-10 w-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                                <Gavel size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.features.debate.title}</h3>
                            <p className="text-sm opacity-70">{t.features.debate.desc}</p>
                        </div>
                    </div>
                </section>

                <div className="w-full h-px bg-linear-to-r from-transparent via-[#2df4c6]/30 to-transparent" />

                {/* WORKFLOW INFOGRAPHIC */}
                <section id="agent-workflow" className="scroll-mt-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">{t.workflow.header}</h2>
                        <p className="opacity-70">{t.workflow.subheader}</p>
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
                                    <div className={`w-32 h-32 rounded-full border-4 ${step.color} bg-[#0b0e14] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 duration-300`}>
                                        {step.icon}
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold mb-4">
                                        {idx + 1}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                    <p className="text-sm opacity-70 px-4">{step.desc}</p>
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

                    <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm">

                        {/* Analyst Team Strip */}
                        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] border-b border-slate-800">
                            <div className="bg-blue-900/20 p-8 flex flex-col justify-center border-r border-slate-700/50">
                                <h3 className="text-2xl font-bold text-blue-400 mb-2">{t.teams.analyst.title}</h3>
                                <p className="text-sm opacity-70">{t.teams.analyst.desc}</p>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <TeamMemberCard title={t.teams.analyst.market.title} icon={<BarChart />} desc={t.teams.analyst.market.desc} color="text-cyan-400" />
                                <TeamMemberCard title={t.teams.analyst.fundamental.title} icon={<BookOpen />} desc={t.teams.analyst.fundamental.desc} color="text-blue-400" />
                                <TeamMemberCard title={t.teams.analyst.news.title} icon={<Newspaper />} desc={t.teams.analyst.news.desc} color="text-green-400" />
                                <TeamMemberCard title={t.teams.analyst.social.title} icon={<Globe />} desc={t.teams.analyst.social.desc} color="text-purple-400" />
                            </div>
                        </div>

                        {/* Research Team Strip */}
                        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] bg-green-900/5">
                            <div className="bg-green-900/20 p-8 flex flex-col justify-center border-r border-slate-700/50">
                                <h3 className="text-2xl font-bold text-green-400 mb-2">{t.teams.research.title}</h3>
                                <p className="text-sm opacity-70">{t.teams.research.desc}</p>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <TeamMemberCard title={t.teams.research.manager.title} icon={<Briefcase />} desc={t.teams.research.manager.desc} color="text-white" />
                                <TeamMemberCard title={t.teams.research.bull.title} icon={<TrendingUp />} desc={t.teams.research.bull.desc} color="text-green-500" />
                                <TeamMemberCard title={t.teams.research.bear.title} icon={<TrendingDown />} desc={t.teams.research.bear.desc} color="text-red-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* BOTTOM SECTION: TRADER & RISK (Purple area) */}
                <section id="trader-team" className="rounded-3xl bg-linear-to-br from-[#1a1625] to-[#2d2a4a] border border-white/5 p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[100px] rounded-full" />

                    <div className="relative z-10 text-center mb-12">
                        <h2 className="text-3xl font-bold text-purple-300">{t.execution.header}</h2>
                        <p className="text-purple-200/60 mt-2">{t.execution.subheader}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {/* Trader */}
                        <div className="text-center group">
                            <div className="w-24 h-24 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-4 ring-2 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                <Zap size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t.execution.trader.title}</h3>
                            <p className="text-sm text-purple-200/70">{t.execution.trader.desc}</p>
                        </div>

                        {/* Arrows pointing to Manager */}
                        <div className="hidden md:flex flex-col justify-center items-center opacity-50">
                            <ArrowRight size={40} className="text-white mb-2" />
                            <div className="text-xs uppercase tracking-widest">{t.execution.submit}</div>
                        </div>

                        {/* Risk Manager */}
                        <div className="text-center group">
                            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <Shield size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t.execution.risk.title}</h3>
                            <p className="text-sm text-purple-200/70">{t.execution.risk.desc}</p>
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
                            <h3 className="text-lg font-bold text-white">{t.execution.manager.title}</h3>
                            <p className="text-sm text-purple-200/70 max-w-md">{t.execution.manager.desc}</p>
                        </div>
                    </div>
                </section>

                {/* TUTORIALS SECTION */}
                <section id="tutorials-header" className="pt-16 pb-32">
                    <h2 className="text-3xl font-bold mb-12 text-center">{t.tutorials.header}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TutorialCard
                            step="01"
                            title={t.tutorials.step1.title}
                            desc={t.tutorials.step1.desc}
                        />
                        <TutorialCard
                            step="02"
                            title={t.tutorials.step2.title}
                            desc={t.tutorials.step2.desc}
                        />
                        <TutorialCard
                            step="03"
                            title={t.tutorials.step3.title}
                            desc={t.tutorials.step3.desc}
                        />
                        <TutorialCard
                            step="04"
                            title={t.tutorials.step4.title}
                            desc={t.tutorials.step4.desc}
                        />
                    </div>
                </section>

            </main>
        </div>
    );
}

// Helper Components for Cleaner JSX
function TeamMemberCard({ title, icon, desc, color }: { title: string, icon: React.ReactNode, desc: string, color: string }) {
    return (
        <div className="bg-[#0b0e14]/50 p-5 rounded-xl border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
            <div className={`mb-3 ${color} flex items-center gap-2`}>
                {/* @ts-ignore */}
                {React.cloneElement(icon as React.ReactElement, { size: 20 })}
                <h4 className="font-bold text-sm tracking-wide">{title}</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
}

function TutorialCard({ step, title, desc }: { step: string, title: string, desc: string }) {
    return (
        <div className="flex gap-6 p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
            <div className="text-4xl font-black text-white/5 select-none font-mono">{step}</div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-[#2df4c6]">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
            </div>
        </div>
    );
}

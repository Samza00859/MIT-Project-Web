"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { format } from "date-fns";

interface ReportResult {
    id: number;
    report_type: string;
    title: string;
    content: any;
    created_at: string;
}

interface HistoryItem {
    id: number;
    timestamp: string;
    ticker: string;
    analysis_date: string;
    status: string;
    error_message: string | null;
    reports: ReportResult[];
}

const REPORT_ORDER = [
    "Fundamentals Review",
    "Market Analysis",
    "Social Sentiment",
    "News Analysis",
    "Bull Case",
    "Bear Case",
    "Risk: Conservative",
    "Risk: Aggressive",
    "Risk: Neutral",
    "Trader Plan",
    "Research Team Decision",
    "Portfolio Management Decision"
];

function escapeHtml(text: string) {
    if (typeof text !== 'string') return String(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatInlineMarkdown(text: string) {
    return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function RenderMarkdown({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="space-y-2">
            {text.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={idx} />;
                if (/^[-*•]/.test(trimmed)) {
                    return (
                        <div key={idx} className="ml-4 flex items-start gap-2 text-sm md:text-base">
                            <span className="mt-1.5 h-1.5 w-1.5 min-w-[6px] rounded-full bg-current opacity-60" />
                            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.replace(/^[-*•]\s*/, "")) }} />
                        </div>
                    );
                }
                return <p key={idx} className="text-sm md:text-base" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />;
            })}
        </div>
    );
}

function RenderJsonData({ data, isDarkMode }: { data: any; isDarkMode: boolean }) {
    if (Array.isArray(data)) {
        const isPrimitives = data.every(item => ['string', 'number', 'boolean'].includes(typeof item));
        if (isPrimitives) {
            return (
                <div className={`flex w-fit max-w-full flex-wrap gap-2 rounded-xl border p-4 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}>
                    {data.map((item, idx) => (
                        <span key={idx} className={`rounded px-2.5 py-1 text-sm font-medium ${isDarkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                            {String(item)}
                        </span>
                    ))}
                </div>
            );
        }
        return (
            <div className="grid gap-4 md:grid-cols-2">
                {data.map((item, idx) => (
                    <div key={idx} className={`flex flex-col gap-3 rounded-xl border p-4 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}>
                        <RenderJsonData data={item} isDarkMode={isDarkMode} />
                    </div>
                ))}
            </div>
        );
    }
    if (typeof data === "object" && data !== null) {
        return (
            <div className="flex flex-col gap-4">
                {Object.entries(data).map(([key, value]) => {
                    if (["selected_indicators", "memory_application", "count"].includes(key)) return null;
                    return (
                        <div key={key} className={`border-l-2 pl-4 ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
                            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider opacity-50">{key.replace(/_/g, " ")}</h4>
                            <div className="opacity-90">
                                {typeof value === "string" ? <RenderMarkdown text={value} /> : <RenderJsonData data={value} isDarkMode={isDarkMode} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return <p className="text-sm md:text-base">{String(data)}</p>;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [viewMode, setViewMode] = useState<"formatted" | "json">("formatted");

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            let apiUrl = "http://localhost:8000";
            if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
                const protocol = window.location.protocol;
                const host = window.location.hostname;
                apiUrl = `${protocol}//${host}:8000`;
            }
            const res = await fetch(`${apiUrl}/api/history/`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const getGroupedSections = (item: HistoryItem) => {
        const sectionsMap: Record<string, { sum?: any, full?: any }> = {};

        item.reports.forEach(report => {
            const title = report.title || "Report";
            if (!sectionsMap[title]) sectionsMap[title] = {};
            if (report.report_type === "sum_report") sectionsMap[title].sum = report.content;
            if (report.report_type === "full_report") sectionsMap[title].full = report.content;
        });

        return REPORT_ORDER.filter(title => sectionsMap[title]).map(title => ({
            label: title,
            sum: sectionsMap[title].sum,
            full: sectionsMap[title].full
        }));
    };

    const getSummary = (item: HistoryItem) => {
        const portSummary = item.reports.find(r => r.title === "Portfolio Management Decision" && r.report_type === "sum_report");
        const portFull = item.reports.find(r => r.title === "Portfolio Management Decision" && r.report_type === "full_report");

        if (!portSummary) return null;

        let decision = "N/A";
        if (portFull && typeof portFull.content === 'object') {
            decision = portFull.content.judge_decision || portFull.content.decision || "N/A";
        }

        return {
            summary: portSummary.content,
            decision: decision
        };
    };

    return (
        <div className={`flex h-screen overflow-hidden ${isDarkMode ? "bg-[#0c111f] text-white" : "bg-gray-50 text-gray-900"}`}>
            <Sidebar activeId="history" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <main className="flex-1 flex overflow-hidden">
                {/* List Sidebar */}
                <div className={`w-80 border-r flex flex-col ${isDarkMode ? "border-white/10 bg-[#161b2c]" : "border-gray-200 bg-white"}`}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">Execution History</h2>
                        <div className="flex justify-between items-center mt-1">
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {history.length} records found
                            </p>
                            <button onClick={fetchHistory} className="text-xs text-[#2df4c6] hover:underline">Refresh</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center animate-pulse">Loading...</div>
                        ) : (
                            history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`w-full text-left p-4 border-b transition-all ${selectedItem?.id === item.id
                                        ? (isDarkMode ? "bg-[#2df4c6]/10 border-l-4 border-l-[#2df4c6]" : "bg-[#2df4c6]/10 border-l-4 border-l-[#2df4c6]")
                                        : (isDarkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50")
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-xs tracking-widest opacity-70">ID #{item.id}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.status === "success"
                                            ? "bg-[#2df4c6]/20 text-[#2df4c6]"
                                            : "bg-red-500/20 text-red-400"
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="font-bold text-lg">{item.ticker}</div>
                                    <div className="text-sm opacity-60">{item.analysis_date}</div>
                                    <div className="text-[10px] opacity-40 mt-2">
                                        {format(new Date(item.timestamp), "MMM d, yyyy HH:mm:ss")}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {selectedItem ? (
                        <div className="max-w-5xl mx-auto">
                            <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl font-bold">{selectedItem.ticker}</h1>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedItem.status === "success" ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-red-500/10 text-red-500"}`}>
                                            {selectedItem.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="opacity-50 text-lg">Analysis for {selectedItem.analysis_date}</p>
                                </div>
                                <div className={`flex rounded-full border p-1 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-100"}`}>
                                    <button
                                        onClick={() => setViewMode("formatted")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "formatted" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                    >
                                        Formatted
                                    </button>
                                    <button
                                        onClick={() => setViewMode("json")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "json" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                    >
                                        Raw JSON
                                    </button>
                                </div>
                            </header>

                            {selectedItem.status === "error" ? (
                                <div className="p-8 rounded-[20px] bg-red-500/5 border border-red-500/20 text-red-400">
                                    <h3 className="text-xl font-bold mb-4">Analysis Failed</h3>
                                    <p className="bg-black/20 p-4 rounded-xl font-mono text-sm">{selectedItem.error_message}</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Final Summary Card */}
                                    {(() => {
                                        const summary = getSummary(selectedItem);
                                        if (!summary) return null;
                                        return (
                                            <section className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5" : "bg-white border-gray-200 shadow-sm"}`}>
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#8b94ad] mb-2">Final Recommendation Summary</h3>
                                                        <div className="text-lg opacity-90 italic leading-relaxed">
                                                            <RenderMarkdown text={String(summary.summary)} />
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-auto p-6 rounded-2xl bg-[#2df4c6]/10 border border-[#2df4c6]/30 text-center">
                                                        <span className="text-xs uppercase font-bold text-[#2df4c6] block mb-1">Recommendation</span>
                                                        <strong className="text-3xl text-[#2df4c6]">{summary.decision}</strong>
                                                    </div>
                                                </div>
                                            </section>
                                        );
                                    })()}

                                    {/* Detailed Reports */}
                                    {viewMode === "formatted" ? (
                                        <div className="space-y-8">
                                            {getGroupedSections(selectedItem).map((section, idx) => (
                                                <div key={idx} className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "bg-white border-gray-200 shadow-sm"}`}>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2df4c6]/20 text-sm text-[#2df4c6]">
                                                            {idx + 1}
                                                        </span>
                                                        {section.label}
                                                    </h3>

                                                    <div className="space-y-8">
                                                        {section.sum && (
                                                            <div className={`p-5 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 text-[#2df4c6]">Executive Summary</h4>
                                                                <RenderMarkdown text={String(section.sum)} />
                                                            </div>
                                                        )}

                                                        {section.full && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Detailed Data / Research</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.full === 'string' ? (
                                                                        <RenderMarkdown text={section.full} />
                                                                    ) : (
                                                                        <RenderJsonData data={section.full} isDarkMode={isDarkMode} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5" : "bg-white border-gray-200 shadow-sm"}`}>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#8b94ad] mb-4">Raw Execution Data</h3>
                                            <pre className={`text-xs p-6 rounded-2xl overflow-auto h-[600px] ${isDarkMode ? "bg-black/40 text-[#2df4c6] font-mono" : "bg-gray-100 text-blue-900 font-mono"}`}>
                                                {JSON.stringify(selectedItem, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <div className="w-24 h-24 mb-6 relative">
                                <div className="absolute inset-0 border-4 border-[#2df4c6] rounded-full animate-ping opacity-20"></div>
                                <div className="absolute inset-2 border-2 border-[#2df4c6] rounded-full opacity-40"></div>
                                <svg className="absolute inset-0 m-auto text-[#2df4c6]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold">Select a record</h2>
                            <p>Select an analysis result from the sidebar to view details</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

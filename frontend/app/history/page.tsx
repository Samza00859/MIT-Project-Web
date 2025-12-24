"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";

// Helper function to format date
function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
    } catch {
        return dateString;
    }
}

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

const TITLE_MAP: Record<string, string> = {
    "fundamental": "Fundamentals Review",
    "market": "Market Analysis",
    "sentiment": "Social Sentiment",
    "news": "News Analysis",
    "trader": "Trader Plan",
    "risk": "Portfolio Management Decision",
    "technical": "Market Analysis"
};

function escapeHtml(text: string) {
    if (typeof text !== 'string') return String(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatInlineMarkdown(text: string) {
    // Remove all asterisks for display
    return escapeHtml(text).replace(/\*+/g, "");
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
    // If data is a string, try to parse it as JSON first
    let parsedData = data;
    if (typeof data === "string") {
        const trimmed = data.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                parsedData = JSON.parse(trimmed);
            } catch {
                return <RenderMarkdown text={data} />;
            }
        } else {
            return <RenderMarkdown text={data} />;
        }
    }

    if (Array.isArray(parsedData)) {
        // Optimization: If array contains only primitives, render as a tag cloud
        const isPrimitives = parsedData.every(item => ['string', 'number', 'boolean'].includes(typeof item));

        if (isPrimitives) {
            return (
                <div className={`flex w-fit max-w-full flex-wrap gap-2 rounded-xl border p-4 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}>
                    {parsedData.length > 0 ? parsedData.map((item, idx) => (
                        <span key={idx} className={`rounded px-2.5 py-1 text-sm font-medium ${isDarkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                            {String(item)}
                        </span>
                    )) : <span className="text-base opacity-50">None</span>}
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {parsedData.map((item, idx) => {
                    // Smart Card Logic: Try to find a "Title" key
                    let title = "";
                    let content = item;

                    if (typeof item === "object" && item !== null) {
                        const outputItem = { ...item };
                        const titleKey = Object.keys(item).find(k =>
                            ["headline", "topic", "indicator_full_name", "title", "name", "section_name"].includes(k)
                        );
                        if (titleKey) {
                            title = item[titleKey];
                            delete outputItem[titleKey];
                            content = outputItem;
                            if (titleKey === "indicator_full_name") delete outputItem["indicator"];
                        }
                    }

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}
                        >
                            {title && (
                                <h4 className={`text-base font-bold leading-tight ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"}`}>
                                    {title}
                                </h4>
                            )}

                            {typeof content === "object" && content !== null ? (
                                Object.entries(content).map(([k, v]) => {
                                    // Hide specific sections
                                    if (["selected_indicators", "memory_application", "count", "raw", "_dedup_key"].includes(k)) return null;

                                    const displayKey = k.replace(/_/g, " ");

                                    return (
                                        <div key={k}>
                                            <p className="mb-0.5 text-xs font-bold uppercase tracking-wider opacity-50">
                                                {displayKey}
                                            </p>
                                            <div className="text-base opacity-90">
                                                {typeof v === "string" ? (
                                                    <RenderMarkdown text={v} />
                                                ) : (
                                                    <RenderJsonData data={v} isDarkMode={isDarkMode} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-base">{String(content)}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (typeof parsedData === "object" && parsedData !== null) {
        // Keys to hide completely
        const skipKeys = ["selected_indicators", "memory_application", "count", "raw", "_dedup_key"];

        // If the object only has a "text" key, render its content directly
        const keys = Object.keys(parsedData).filter(k => !skipKeys.includes(k));
        if (keys.length === 1 && keys[0] === "text") {
            const textContent = parsedData["text"];
            // Try to extract JSON from markdown-style text
            if (typeof textContent === "string") {
                const cleanedText = extractAndCleanContent(textContent);
                return <RenderMarkdown text={cleanedText} />;
            }
            return <RenderJsonData data={textContent} isDarkMode={isDarkMode} />;
        }

        return (
            <div className="flex flex-col gap-4">
                {Object.entries(parsedData).map(([key, value]) => {
                    if (skipKeys.includes(key)) return null;

                    // Skip "text" key if we're rendering full object
                    if (key === "text" && keys.length > 1) return null;

                    // Handle nested JSON strings
                    let parsedValue = value;
                    if (typeof value === 'string') {
                        const trimmed = value.trim();
                        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                            try {
                                parsedValue = JSON.parse(trimmed);
                            } catch { /* ignore */ }
                        }
                    }

                    // All keys use the same simple rendering
                    return (
                        <div
                            key={key}
                            className={`border-l-2 pl-4 ${isDarkMode ? "border-white/10" : "border-gray-200"}`}
                        >
                            <h4 className="mb-2 text-sm font-bold uppercase tracking-wider opacity-60">
                                {key.replace(/_/g, " ")}
                            </h4>
                            <div className="text-base leading-relaxed opacity-90">
                                {typeof parsedValue === "string" ? (
                                    <RenderMarkdown text={parsedValue} />
                                ) : typeof parsedValue === "object" ? (
                                    <RenderJsonData data={parsedValue} isDarkMode={isDarkMode} />
                                ) : (
                                    String(parsedValue)
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return <p className="text-sm md:text-base">{String(parsedData)}</p>;
}

// Helper function to clean content that has JSON mixed with markdown
function extractAndCleanContent(text: string): string {
    if (!text) return "";

    // Remove markdown headers like "### Portfolio Manager Decision"
    let cleaned = text.replace(/^###?\s+.+$/gm, "");

    // Try to find and format JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const jsonData = JSON.parse(jsonMatch[0]);
            // Convert JSON to readable format
            const lines: string[] = [];
            for (const [key, value] of Object.entries(jsonData)) {
                const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                if (typeof value === "string" && value.length > 0) {
                    lines.push(`${label}: ${value}`);
                }
            }
            if (lines.length > 0) {
                return lines.join("\n\n");
            }
        } catch {
            // Not valid JSON, return cleaned text
        }
    }

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    return cleaned || text;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [viewMode, setViewMode] = useState<"summary" | "detailed">("detailed");

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
        const titlesFound = new Set<string>();

        item.reports.forEach(report => {
            let title = report.title || "Report";
            // Map known short titles to full titles
            if (TITLE_MAP[title.toLowerCase()]) {
                title = TITLE_MAP[title.toLowerCase()];
            }

            if (!sectionsMap[title]) sectionsMap[title] = {};

            let content = report.content;
            if (typeof content === 'object' && content !== null) {
                content = content.summary || content.text || content.reasoning || content;
            }

            if (report.report_type === "sum_report") {
                sectionsMap[title].sum = content;
            } else if (report.report_type === "full_report") {
                sectionsMap[title].full = report.content;
            }
            titlesFound.add(title);
        });

        // Combine titles in order + any extra titles found
        const orderedTitles = REPORT_ORDER.filter(title => sectionsMap[title]);
        const otherTitles = Array.from(titlesFound).filter(t => !REPORT_ORDER.includes(t));

        return [...orderedTitles, ...otherTitles].map(title => ({
            label: title,
            sum: sectionsMap[title].sum,
            full: sectionsMap[title].full
        }));
    };

    const getSummary = (item: HistoryItem) => {
        const portSummary = item.reports.find(r =>
            (r.title === "Portfolio Management Decision" || r.title?.toLowerCase() === "risk") &&
            r.report_type === "sum_report"
        );
        const portFull = item.reports.find(r =>
            (r.title === "Portfolio Management Decision" || r.title?.toLowerCase() === "risk") &&
            r.report_type === "full_report"
        );

        if (!portSummary) return null;

        let content = portSummary.content;
        if (typeof content === 'object' && content !== null) {
            content = content.summary || content.text || content.reasoning || content;
        }

        let decision = "N/A";
        if (portFull && typeof portFull.content === 'object' && portFull.content !== null) {
            // 1. Try direct keys
            decision = portFull.content.judge_decision ||
                portFull.content.decision ||
                portFull.content.recommendation ||
                (portFull.content.score ? `SCORE: ${portFull.content.score}` : "N/A");

            // 2. If still N/A, try to parse JSON from 'text' (e.g. if it had markdown headers)
            if (decision === "N/A" && typeof portFull.content.text === 'string') {
                try {
                    const text = portFull.content.text;
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        const jsonStr = text.substring(firstBrace, lastBrace + 1);
                        const parsed = JSON.parse(jsonStr);
                        decision = parsed.judge_decision ||
                            parsed.decision ||
                            parsed.recommendation ||
                            (parsed.score ? `SCORE: ${parsed.score}` : "N/A");
                    }
                } catch (e) {
                    // ignore parse error
                }
            }
        }

        return {
            summary: content,
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
                                            : (item.status === "executing" && item.reports.length === 0)
                                                ? "bg-red-500/20 text-red-400"
                                                : item.status === "executing"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}>
                                            {item.status === "executing" && item.reports.length === 0
                                                ? "INCOMPLETE"
                                                : item.status}
                                        </span>
                                    </div>
                                    <div className="font-bold text-lg">{item.ticker}</div>
                                    <div className="text-sm opacity-60">{item.analysis_date}</div>
                                    <div className="text-[10px] opacity-40 mt-2">
                                        {formatDate(item.timestamp)}
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
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedItem.status === "success"
                                            ? "bg-[#2df4c6]/20 text-[#2df4c6]"
                                            : (selectedItem.status === "executing" && selectedItem.reports.length === 0)
                                                ? "bg-red-500/10 text-red-500"
                                                : selectedItem.status === "executing"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-red-500/10 text-red-500"
                                            }`}>
                                            {selectedItem.status === "executing" && selectedItem.reports.length === 0
                                                ? "INCOMPLETE"
                                                : selectedItem.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="opacity-50 text-lg">Analysis for {selectedItem.analysis_date}</p>
                                </div>
                                <div className={`flex rounded-full border p-1 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-100"}`}>
                                    <button
                                        onClick={() => setViewMode("summary")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "summary" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                    >
                                        Summary report
                                    </button>
                                    <button
                                        onClick={() => setViewMode("detailed")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "detailed" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                    >
                                        Full report
                                    </button>
                                </div>
                            </header>

                            {/* Show error for: error, cancelled, OR executing with no reports (incomplete) */}
                            {selectedItem.status === "error" || selectedItem.status === "cancelled" ||
                                (selectedItem.status === "executing" && selectedItem.reports.length === 0) ? (
                                <div className="p-8 rounded-[20px] bg-red-500/5 border border-red-500/20 text-red-400">
                                    <h3 className="text-xl font-bold mb-4">
                                        {selectedItem.status === "cancelled"
                                            ? "Analysis Cancelled"
                                            : selectedItem.status === "executing"
                                                ? "Analysis Incomplete"
                                                : "Analysis Failed"}
                                    </h3>
                                    <p className="bg-black/20 p-4 rounded-xl font-mono text-sm">
                                        {selectedItem.error_message ||
                                            (selectedItem.status === "cancelled"
                                                ? "This analysis was cancelled before completion."
                                                : selectedItem.status === "executing"
                                                    ? "This analysis was interrupted and did not complete. No reports were saved."
                                                    : "Unknown error")}
                                    </p>
                                </div>
                            ) : selectedItem.reports.length === 0 ? (
                                <div className="p-8 rounded-[20px] bg-gray-500/5 border border-gray-500/20 text-gray-400">
                                    <h3 className="text-xl font-bold mb-4">No Reports Available</h3>
                                    <p className="opacity-70">
                                        This analysis completed but no reports were saved. This may indicate an issue during the summarization process.
                                    </p>
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
                                                            {typeof summary.summary === 'string' ? (
                                                                <RenderMarkdown text={summary.summary} />
                                                            ) : (
                                                                <RenderJsonData data={summary.summary} isDarkMode={isDarkMode} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-auto p-6 rounded-2xl bg-[#2df4c6]/10 border border-[#2df4c6]/30 text-center">
                                                        <span className="text-xs uppercase font-bold text-[#2df4c6] block mb-1">Recommendation</span>
                                                        <strong className="text-3xl text-[#2df4c6] uppercase">{summary.decision}</strong>
                                                    </div>
                                                </div>
                                            </section>
                                        );
                                    })()}

                                    {/* Selected View Content */}
                                    <div className="space-y-8">
                                        {getGroupedSections(selectedItem).map((section, idx) => {
                                            const hasContent = (viewMode === "summary" && section.sum) || (viewMode === "detailed" && section.full);
                                            if (!hasContent) return null;

                                            return (
                                                <div key={idx} className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "bg-white border-gray-200 shadow-sm"}`}>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2df4c6]/20 text-sm text-[#2df4c6]">
                                                            {idx + 1}
                                                        </span>
                                                        {section.label}
                                                    </h3>

                                                    <div className="space-y-8">
                                                        {viewMode === "summary" && section.sum && (
                                                            <div className={`p-5 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 text-[#2df4c6]">Executive Summary</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.sum === 'string' ? (
                                                                        <RenderMarkdown text={section.sum} />
                                                                    ) : (
                                                                        <RenderJsonData data={section.sum} isDarkMode={isDarkMode} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {viewMode === "detailed" && section.full && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Detailed Data / Research</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.full === 'string' ? (
                                                                        <RenderMarkdown text={section.full} />
                                                                    ) : (
                                                                        <div className="mt-4">
                                                                            <RenderJsonData data={section.full} isDarkMode={isDarkMode} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
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

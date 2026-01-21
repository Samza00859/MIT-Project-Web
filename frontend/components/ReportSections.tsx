import React from "react";
import { jsPDF } from "jspdf";
import TelegramConnect from "./TelegramConnect";
import { TEAM_KEYS } from "../lib/constants";

interface ReportSectionsProps {
    reportSections: { key: string; label: string; text: string }[];
    isDarkMode: boolean;
    ticker: string;
    analysisDate: string;
    decision: string;
    copyFeedback: string;
    setCopyFeedback: (feedback: string) => void;
}

// Helper Functions needed for Report Generation
function extractKeyPoints(text: string) {
    const keyPoints: string[] = [];
    const bulletMatches = text.match(/[-*•·]\s*([^\n]+)/g);
    if (bulletMatches) {
        bulletMatches.slice(0, 3).forEach((match) => {
            const point = match.replace(/^[-*•·]\s*/, "• ").trim();
            if (point.length > 10 && point.length < 200) {
                keyPoints.push(point);
            }
        });
    }
    return keyPoints;
}

function escapeHtml(text: string) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatInlineMarkdown(text: string) {
    // Remove all asterisks for display
    return escapeHtml(text).replace(/\*+/g, "");
}

interface ReportSectionsDisplayProps extends ReportSectionsProps {
    handleCopyReport: () => void;
    handleDownloadPdf: () => void;
    reportLength: "summary report" | "full report";
    setReportLength: (length: "summary report" | "full report") => void;
    isRunning?: boolean;
    language?: "en" | "th";
    setLanguage?: (lang: "en" | "th") => void;
    isTranslating?: boolean;
    teamState?: any;
}

// Helper to render Markdown text (with bold/list support)
function RenderMarkdown({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="space-y-2">
            {text.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={idx} />; // Preserve empty lines
                if (/^[-*•]/.test(trimmed)) {
                    return (
                        <div key={idx} className="ml-4 flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 min-w-[6px] rounded-full bg-current opacity-60" />
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: formatInlineMarkdown(trimmed.replace(/^[-*•]\s*/, "")),
                                }}
                            />
                        </div>
                    );
                }
                return (
                    <p
                        key={idx}
                        dangerouslySetInnerHTML={{
                            __html: formatInlineMarkdown(trimmed),
                        }}
                    />
                );
            })}
        </div>
    );
}

// Helper to render JSON Data Beautifully
function RenderJsonData({ data, isDarkMode }: { data: any; isDarkMode: boolean }) {
    // Handle string data - parse as JSON if possible
    let parsedData = data;
    if (typeof data === "string") {
        let trimmed = data.trim();

        // Handle markdown code blocks (```json ... ```)
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "")
                .trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed
                .replace(/^```\s*/, "")
                .replace(/\s*```$/, "")
                .trim();
        }

        if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
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
        // Optimization: If array contains only primitives (strings/numbers), render as a tag cloud/list in ONE box
        const isPrimitives = parsedData.every(item => ['string', 'number', 'boolean'].includes(typeof item));

        if (isPrimitives) {
            return (
                <div className={`flex w-fit max-w-full flex-wrap gap-2 rounded-xl border p-4 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
                    }`}>
                    {parsedData.length > 0 ? parsedData.map((item, idx) => (
                        <span key={idx} className={`rounded px-2.5 py-1 text-sm font-medium ${isDarkMode
                            ? "bg-white/10 text-gray-200"
                            : "bg-gray-100 text-gray-700"
                            }`}>
                            {String(item)}
                        </span>
                    )) : <span className="text-base opacity-50">None</span>}
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {parsedData.map((item: any, idx: number) => {
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
                            className={`flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${isDarkMode
                                ? "border-white/10 bg-white/5"
                                : "border-gray-200 bg-white"
                                }`}
                        >
                            {title && (
                                <h4 className={`text-base font-bold leading-tight ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"
                                    }`}>
                                    {title}
                                </h4>
                            )}

                            {typeof content === "object" && content !== null ? (
                                Object.entries(content).map(([k, v]) => {
                                    // Hide specific sections requested by user
                                    if (["selected_indicators", "memory_application", "count"].includes(k)) return null;

                                    // Key Renaming Map for better UX
                                    const keyMap: Record<string, string> = {
                                        "selected_indicators": "Indicators Used",
                                        "indicator_analysis": "Technical Analysis Details"
                                    };
                                    const displayKey = keyMap[k] || k.replace(/_/g, " ");

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
        return (
            <div className="flex flex-col gap-6">
                {Object.entries(parsedData).map(([key, value]) => {
                    // Hide specific sections requested by user
                    if (["selected_indicators", "memory_application", "count"].includes(key)) return null;

                    const isDecision =
                        key.includes("decision") || key.includes("recommendation") || key.includes("verdict");
                    const isSummary = key.includes("summary") || key.includes("overview");

                    // Highlight Decisions/Verdicts
                    if (isDecision) {
                        let parsedValue = value;
                        if (typeof value === 'string') {
                            const trimmed = value.trim();
                            if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                                try {
                                    parsedValue = JSON.parse(trimmed);
                                } catch (e) { /* ignore */ }
                            }
                        }

                        return (
                            <div
                                key={key}
                                className={`w-fit max-w-full rounded-xl border p-5 shadow-sm ${isDarkMode
                                    ? "border-white/10"
                                    : "border-gray-200"
                                    }`}
                            >
                                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest opacity-70">
                                    {key.replace(/_/g, " ")}
                                </h4>
                                <div className="text-lg font-medium leading-relaxed opacity-90">
                                    {typeof parsedValue === 'object' ? (
                                        <RenderJsonData data={parsedValue} isDarkMode={isDarkMode} />
                                    ) : (
                                        <RenderMarkdown text={String(parsedValue)} />
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Highlight Summaries
                    if (isSummary && typeof value === "string") {
                        let parsedValue = value;
                        const trimmed = value.trim();
                        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                            try {
                                parsedValue = JSON.parse(trimmed);
                            } catch (e) { /* ignore */ }
                        }

                        return (
                            <div
                                key={key}
                                className={`w-fit max-w-full rounded-xl border p-5 shadow-sm ${isDarkMode
                                    ? "border-white/10"
                                    : "border-gray-200"
                                    }`}
                            >
                                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest opacity-70">
                                    {key.replace(/_/g, " ")}
                                </h4>
                                <div className="text-lg font-medium leading-relaxed opacity-90">
                                    {typeof parsedValue === 'object' ? (
                                        <RenderJsonData data={parsedValue} isDarkMode={isDarkMode} />
                                    ) : (
                                        <RenderMarkdown text={String(parsedValue)} />
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={key}
                            className={`border-l-2 pl-4 ${isDarkMode ? "border-white/10" : "border-gray-200"
                                }`}
                        >
                            <h4 className="mb-2 text-sm font-bold uppercase tracking-wider opacity-60">
                                {key.replace(/_/g, " ")}
                            </h4>
                            <div className="text-base leading-relaxed opacity-90">
                                {typeof value === "string" ? (
                                    <RenderMarkdown text={value} />
                                ) : typeof value === "object" ? (
                                    <RenderJsonData data={value} isDarkMode={isDarkMode} />
                                ) : (
                                    String(value)
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return <p>{String(parsedData)}</p>;
}

const TRANSLATIONS = {
    en: {
        currentReport: "Current Report",
        liveUpdates: "Live updates from TradingAgents graph",
        summaryReport: "Summary",
        fullReport: "Full",
        downloadPdf: "PDF",
        generating: "Generating report... Please wait.",
        runPipeline: "Run the pipeline to load the latest report.",
        copyReport: "Copy report",
        copyShort: "Copy",
        copied: "Copied!",
        copyFailed: "Failed",
        teams: {
            analyst: { title: "Analyst team" },
            research: { title: "Research team" },
            trader: { title: "Trader team" },
            risk: { title: "Risk & Portfolio" },
            portfolio: { title: "Portfolio Management" }
        },
        roles: {
            "Market Analyst": "Market Analyst",
            "Social Media Analyst": "Social Media Analyst",
            "News Analyst": "News Analyst",
            "Fundamentals Analyst": "Fundamentals Analyst",
            "Bull Research": "Bull Research",
            "Bear Research": "Bear Research",
            "Research Manager": "Research Manager",
            "Trader": "Trader",
            "Risk Analyst": "Risk Analyst",
            "Neutral Analyst": "Neutral Analyst",
            "Safe Analyst": "Safe Analyst",
            "Portfolio Manager": "Portfolio Manager"
        },
        progressStatus: {
            in_progress: "Working"
        }
    },
    th: {
        currentReport: "รายงานปัจจุบัน",
        liveUpdates: "อัปเดตสดจากกราฟ TradingAgents",
        summaryReport: "สรุป",
        fullReport: "ฉบับเต็ม",
        downloadPdf: "PDF",
        generating: "กำลังสร้างรายงาน... โปรดรอสักครู่",
        runPipeline: "เรียกใช้ระบบเพื่อโหลดรายงานล่าสุด",
        copyReport: "คัดลอกรายงาน",
        copyShort: "คัดลอก",
        copied: "แล้ว!",
        copyFailed: "ผิดพลาด",
        teams: {
            analyst: { title: "ทีมรวบรวมข้อมูล" },
            research: { title: "ทีมวิเคราะห์และวิจัย" },
            trader: { title: "ทีมเทรดเดอร์" },
            risk: { title: "ทีมบริหารความเสี่ยง" },
            portfolio: { title: "ผู้จัดการกองทุน" }
        },
        roles: {
            "Market Analyst": "นักวิเคราะห์ตลาด",
            "Social Media Analyst": "นักวิเคราะห์โซเชียล",
            "News Analyst": "นักวิเคราะห์ข่าว",
            "Fundamentals Analyst": "นักวิเคราะห์พื้นฐาน",
            "Bull Research": "วิจัยแนวโน้มขาขึ้น",
            "Bear Research": "วิจัยแนวโน้มขาลง",
            "Research Manager": "ผู้จัดการงานวิจัย",
            "Trader": "เทรดเดอร์",
            "Risk Analyst": "นักวิเคราะห์ความเสี่ยง",
            "Neutral Analyst": "วิเคราะห์แนวโน้มกลาง",
            "Safe Analyst": "นักวิเคราะห์ความปลอดภัย",
            "Portfolio Manager": "ผู้จัดการพอร์ต"
        },
        progressStatus: {
            in_progress: "กำลังทำ"
        }
    }
};

export default function ReportSections({
    reportSections,
    isDarkMode,
    ticker,
    analysisDate,
    decision,
    copyFeedback,
    setCopyFeedback,
    handleCopyReport,
    handleDownloadPdf,
    reportLength,
    setReportLength,
    isRunning = false,
    language = "en",
    setLanguage,
    isTranslating = false,
    teamState,
}: ReportSectionsDisplayProps) {
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    // Handle Copy Button Text Translation
    let displayCopyText = copyFeedback;
    let displayCopyTextShort = copyFeedback;
    if (copyFeedback === "Copy report") {
        displayCopyText = t.copyReport;
        displayCopyTextShort = t.copyShort;
    } else if (copyFeedback === "Copied!") {
        displayCopyText = t.copied;
        displayCopyTextShort = t.copied;
    } else if (copyFeedback === "Copy failed") {
        displayCopyText = t.copyFailed;
        displayCopyTextShort = t.copyFailed;
    }

    return (
        <section
            className={`flex flex-1 min-h-[250px] sm:h-full flex-col rounded-[20px] border p-3 sm:p-4 md:p-6 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"
                }`}
        >
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 mb-3 md:mb-6">
                <div className="shrink-0">
                    <h3 className={`text-sm sm:text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{t.currentReport}</h3>
                    <p className="text-[10px] sm:text-[0.85rem] text-[#8b94ad] hidden sm:block">
                        {t.liveUpdates}
                    </p>
                </div>

                {/* Buttons Row - Horizontal scroll on very small mobile */}
                <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
                        {/* Summary/Full Toggle */}
                        <div className={`flex overflow-hidden rounded-full border ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-gray-200 bg-gray-50"}`}>
                            <button
                                onClick={() => setReportLength("summary report")}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${reportLength === "summary report"
                                    ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#DBEAFE] text-[#1D4ED8]")
                                    : (isDarkMode ? "text-[#8b94ad] hover:bg-white/5" : "text-[#334155] hover:bg-white")
                                    }`}
                            >
                                {t.summaryReport}
                            </button>
                            <div className={`w-px ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                            <button
                                onClick={() => setReportLength("full report")}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${reportLength === "full report"
                                    ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#DBEAFE] text-[#1D4ED8]")
                                    : (isDarkMode ? "text-[#8b94ad] hover:bg-white/5" : "text-[#334155] hover:bg-white")
                                    }`}
                            >
                                {t.fullReport}
                            </button>
                        </div>

                        {/* Language Toggle */}
                        {setLanguage && !isRunning && (
                            <div className={`flex overflow-hidden rounded-full border ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-gray-200 bg-gray-50"}`}>
                                <button
                                    onClick={() => setLanguage("en")}
                                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${language === "en"
                                        ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#DBEAFE] text-[#1e3a8a]")
                                        : (isDarkMode ? "text-[#8b94ad] hover:bg-white/5" : "text-[#334155] hover:bg-white")
                                        }`}
                                >
                                    EN
                                </button>
                                <div className={`w-px ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                                <button
                                    onClick={() => setLanguage("th")}
                                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${language === "th"
                                        ? (isDarkMode ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-[#fef3c7] text-[#b45309]")
                                        : (isDarkMode ? "text-[#8b94ad] hover:bg-white/5" : "text-[#334155] hover:bg-white")
                                        }`}
                                >
                                    TH
                                </button>
                            </div>
                        )}

                        {/* Copy Button */}
                        <button
                            onClick={handleCopyReport}
                            className={`cursor-pointer rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap hover:opacity-80 ${isDarkMode
                                ? "border-white/10 bg-transparent text-[#f8fbff]"
                                : "border-gray-200 bg-gray-50 text-gray-900"
                                }`}
                        >
                            <span className="sm:hidden">{displayCopyTextShort}</span>
                            <span className="hidden sm:inline">{displayCopyText}</span>
                        </button>

                        {/* Download PDF Button */}
                        {reportSections.length > 0 && !isRunning && !reportSections.some(s => s.key === "error") && (
                            <button
                                onClick={handleDownloadPdf}
                                className={`cursor-pointer rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${isDarkMode
                                    ? "text-[#2df4c6] border-white/20 bg-transparent hover:bg-[#2df4c6]/10"
                                    : "text-white border-[#1D4ED8] bg-[#1D4ED8] hover:bg-[#1E40AF]"
                                    }`}
                            >
                                {t.downloadPdf}
                            </button>
                        )}

                        {/* Telegram Button */}
                        <TelegramConnect variant="header-button" data={reportSections} />
                    </div>
                </div>
            </header>
            <article
                className={`flex-1 min-h-[150px] sm:min-h-[200px] overflow-auto rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-[#8b94ad] md:p-6 md:text-base lg:p-6 ${isDarkMode ? "bg-[#090d17]" : "bg-gray-50"
                    }`}
            >
                {reportSections.length === 0 ? (
                    <div className="flex h-full min-h-[200px] flex-col items-center justify-center opacity-70">
                        {isRunning ? (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <div className={`h-10 w-10 animate-spin rounded-full border-4 border-t-transparent ${isDarkMode ? "border-[#2df4c6]" : "border-teal-900"}`}></div>
                                <p className={`font-medium text-center px-4 ${isDarkMode ? "text-[#2df4c6]" : "text-teal-900"}`}>
                                    {(() => {
                                        if (teamState) {
                                            for (const teamKey of TEAM_KEYS) {
                                                const members = teamState[teamKey];
                                                // Find the first member that is running or pending (not completed)
                                                const activeMember = members.find((m: any) => m.status !== "completed");
                                                if (activeMember) {
                                                    // @ts-ignore
                                                    const teamName = t.teams[teamKey]?.title || teamKey;
                                                    // @ts-ignore
                                                    const memberName = t.roles[activeMember.name] || activeMember.name;
                                                    return `${teamName}: ${memberName} ${t.progressStatus?.in_progress || "Working"}...`;
                                                }
                                            }
                                        }
                                        return t.generating;
                                    })()}
                                </p>
                            </div>
                        ) : (
                            <p>{t.runPipeline}</p>
                        )}
                    </div>
                ) : (
                    reportSections.map((section, idx) => (
                        <div
                            key={idx}
                            className="mt-8 border-t border-dashed border-white/10 pt-8 first:mt-0 first:border-0 first:pt-0"
                        >
                            <h3
                                className={`mb-6 flex items-center gap-3 text-lg font-bold tracking-tight ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"
                                    }`}
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#2df4c6]/20 text-xs text-[#2df4c6]">
                                    {idx + 1}
                                </span>
                                {section.label}
                            </h3>
                            <div className="space-y-2">
                                {(() => {
                                    if (typeof section.text !== 'string') {
                                        return <RenderJsonData data={section.text} isDarkMode={isDarkMode} />;
                                    }

                                    const trimmedText = section.text.trim();
                                    let jsonToParse = null;

                                    // Case A: Clearly marked Markdown JSON block
                                    if (trimmedText.startsWith("```json")) {
                                        jsonToParse = trimmedText
                                            .replace(/^```json\s*/, "")
                                            .replace(/\s*```$/, "");
                                    }
                                    // Case B: Raw JSON string (e.g. object or array)
                                    else if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
                                        jsonToParse = trimmedText;
                                    }

                                    if (jsonToParse) {
                                        try {
                                            const jsonData = JSON.parse(jsonToParse);
                                            return (
                                                <RenderJsonData
                                                    data={jsonData}
                                                    isDarkMode={isDarkMode}
                                                />
                                            );
                                        } catch (e) {
                                            // Silent fail, fall through to Markdown
                                        }
                                    }

                                    // 2. Enhanced Markdown Rendering with Section Parsing
                                    // If the text contains markdown headers (###), split and render as pseudo-sections
                                    if (typeof section.text === 'string' && section.text.includes("###")) {
                                        const parts = section.text.split(/(?=###)/g);
                                        return (
                                            <div className="flex flex-col gap-6">
                                                {parts.map((part, pIdx) => {
                                                    const match = part.match(/###\s*(.+)\n([\s\S]*)/);
                                                    if (match) {
                                                        const title = match[1].trim();
                                                        const content = match[2].trim();

                                                        // Detect if this is a "Decision" or "Recommendation" section
                                                        // Keywords for both English and Thai
                                                        const isDecision = /decision|recommendation|verdict|summary|overview|ตัดสินใจ|แนะนำ|สรุป|ภาพรวม/i.test(title);

                                                        if (isDecision) {
                                                            // Render as Box (like Judge Decision)
                                                            return (
                                                                <div
                                                                    key={pIdx}
                                                                    className={`w-fit max-w-full rounded-xl border p-5 shadow-sm ${isDarkMode
                                                                        ? "border-white/10"
                                                                        : "border-gray-200"
                                                                        }`}
                                                                >
                                                                    <h4 className="mb-3 text-sm font-bold uppercase tracking-widest opacity-70">
                                                                        {title}
                                                                    </h4>
                                                                    <div className="text-lg font-medium leading-relaxed opacity-90">
                                                                        <RenderMarkdown text={content} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            // Render as Indented Section (like History/Analysis)
                                                            return (
                                                                <div
                                                                    key={pIdx}
                                                                    className={`border-l-2 pl-4 ${isDarkMode ? "border-white/10" : "border-gray-200"}`}
                                                                >
                                                                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wider opacity-60">
                                                                        {title}
                                                                    </h4>
                                                                    <div className="text-base leading-relaxed opacity-90">
                                                                        <RenderMarkdown text={content} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                    // Content without header (intro text)
                                                    if (part.trim()) {
                                                        return (
                                                            <div key={pIdx} className={`rounded-xl border p-5 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}>
                                                                <RenderMarkdown text={part} />
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        );
                                    }

                                    // 3. Default Fallback
                                    return (
                                        <div className={`rounded-xl border p-5 ${isDarkMode
                                            ? "border-white/10 bg-white/5"
                                            : "border-gray-200 bg-white"
                                            }`}>
                                            <RenderMarkdown text={section.text} />
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ))
                )}
            </article>
        </section>
    );
}

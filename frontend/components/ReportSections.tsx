import React from "react";
import { jsPDF } from "jspdf";
import TelegramConnect from "./TelegramConnect";

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
    if (Array.isArray(data)) {
        // Optimization: If array contains only primitives (strings/numbers), render as a tag cloud/list in ONE box
        const isPrimitives = data.every(item => ['string', 'number', 'boolean'].includes(typeof item));

        if (isPrimitives) {
            return (
                <div className={`flex w-fit max-w-full flex-wrap gap-2 rounded-xl border p-4 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
                    }`}>
                    {data.length > 0 ? data.map((item, idx) => (
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
                {data.map((item, idx) => {
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

    if (typeof data === "object" && data !== null) {
        return (
            <div className="flex flex-col gap-6">
                {Object.entries(data).map(([key, value]) => {
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

    return <p>{String(data)}</p>;
}

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
}: ReportSectionsDisplayProps) {
    return (
        <section
            className={`flex h-full flex-col rounded-[20px] border p-4 md:p-6 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"
                }`}
        >
            <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Current Report</h3>
                    <p className="text-[0.85rem] text-[#8b94ad]">
                        Live updates from TradingAgents graph
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Toggle Report Length Button */}
                    <div className={`flex overflow-hidden rounded-full border ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-gray-200 bg-gray-50"}`}>
                        <button
                            onClick={() => setReportLength("summary report")}
                            className={`px-4 py-2.5 text-xs font-semibold transition-colors ${reportLength === "summary report"
                                ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#DBEAFE] text-[#1D4ED8]")
                                : (isDarkMode ? "text-[#8b94ad] hover:bg-white/5" : "text-[#334155] hover:bg-white")
                                }`}
                        >
                            Summary report
                        </button>
                        <div className={`w-px ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                        <button
                            onClick={() => setReportLength("full report")}
                            className={`px-4 py-2.5 text-xs font-semibold transition-colors ${reportLength === "full report"
                                ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#DBEAFE] text-[#1D4ED8]")
                                : (isDarkMode ? "text-[#8b94ad] hover:bg-white/5" : "text-[#334155] hover:bg-white")
                                }`}
                        >
                            Full report
                        </button>
                    </div>

                    <div className={`h-6 w-px ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />

                    <button
                        onClick={handleCopyReport}
                        className={`cursor-pointer rounded-full border px-4 py-2.5 text-xs font-medium transition-all hover:opacity-80 ${isDarkMode
                            ? "border-white/10 bg-transparent text-[#f8fbff]"
                            : "border-gray-200 bg-gray-50 text-gray-900"
                            }`}
                    >
                        {copyFeedback}
                    </button>
                    {reportSections.length > 0 && !isRunning && !reportSections.some(s => s.key === "error") && (
                        <button
                            onClick={handleDownloadPdf}
                            className={`cursor-pointer rounded-full border px-4 py-2.5 text-xs font-medium transition-all ${
                                isDarkMode
                                    ? "text-[#2df4c6] border-white/20 bg-transparent hover:bg-[#2df4c6]/10"
                                    : "text-white border-[#1D4ED8] bg-[#1D4ED8] hover:bg-[#1E40AF]"
                            }`}
                        >
                            Download PDF
                        </button>
                    )}

                    {/* Compact Telegram Button */}
                    <TelegramConnect variant="header-button" />
                </div>
            </header>
            <article
                className={`flex-1 min-h-0 overflow-auto rounded-2xl p-4 text-sm leading-relaxed text-[#8b94ad] md:p-6 md:text-base lg:p-6 ${isDarkMode ? "bg-[#090d17]" : "bg-gray-50"
                    }`}
            >
                {reportSections.length === 0 ? (
                    <div className="flex h-full min-h-[200px] flex-col items-center justify-center opacity-70">
                        {isRunning ? (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2df4c6] border-t-transparent"></div>
                                <p className="text-[#2df4c6] font-medium">Generating report... Please wait.</p>
                            </div>
                        ) : (
                            <p>Run the pipeline to load the latest report.</p>
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

                                    // 2. Default Markdown Rendering (Fallback) - Wrapped in Card Style
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

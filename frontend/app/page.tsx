"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";

// --- Constants & Types ---

const ANALYSTS_DATA = [
  { label: "Market Analyst", value: "market" },
  { label: "Social Media Analyst", value: "social" },
  { label: "News Analyst", value: "news" },
  { label: "Fundamentals Analyst", value: "fundamentals" },
];

const RESEARCH_DEPTH_OPTIONS = [
  {
    label: "Shallow",
    helper: "Quick research, single debate loop",
    value: 1,
  },
  {
    label: "Medium",
    helper: "Balanced debate and risk review",
    value: 3,
  },
  {
    label: "Deep",
    helper: "Comprehensive discussions + full risk audits",
    value: 5,
  },
];

const SHALLOW_AGENTS = {
  google: [
    ["Gemini 2.0 Flash-Lite • low latency", "gemini-2.0-flash-lite"],
    ["Gemini 2.0 Flash • next-gen speed", "gemini-2.0-flash"],
  ],
};

const DEEP_AGENTS = {
  google: [
    ["Gemini 2.0 Flash-Lite", "gemini-2.0-flash-lite"],
    ["Gemini 2.0 Flash", "gemini-2.0-flash"],
  ],
};

const TEAM_TEMPLATE = {
  analyst: [
    { name: "Market Analyst", status: "pending" },
    { name: "Social Media Analyst", status: "pending" },
    { name: "News Analyst", status: "pending" },
    { name: "Fundamentals Analyst", status: "pending" },
  ],
  research: [
    { name: "Bull Research", status: "pending" },
    { name: "Bear Research", status: "pending" },
    { name: "Research Manager", status: "pending" },
  ],
  trader: [{ name: "Trader", status: "pending" }],
  risk: [
    { name: "Risk Analyst", status: "pending" },
    { name: "Neutral Analyst", status: "pending" },
    { name: "Safe Analyst", status: "pending" },
    { name: "Portfolio Manager", status: "pending" },
  ],
};

const AGENT_TO_TEAM_MAP: Record<string, [keyof typeof TEAM_TEMPLATE, string]> = {
  "Market Analyst": ["analyst", "Market Analyst"],
  "Social Analyst": ["analyst", "Social Media Analyst"],
  "News Analyst": ["analyst", "News Analyst"],
  "Fundamentals Analyst": ["analyst", "Fundamentals Analyst"],
  "Bull Researcher": ["research", "Bull Research"],
  "Bear Researcher": ["research", "Bear Research"],
  "Research Manager": ["research", "Research Manager"],
  "Trader": ["trader", "Trader"],
  "Risky Analyst": ["risk", "Risk Analyst"],
  "Neutral Analyst": ["risk", "Neutral Analyst"],
  "Safe Analyst": ["risk", "Safe Analyst"],
  "Portfolio Manager": ["risk", "Portfolio Manager"],
};

// --- Helper Functions ---

function toISODate() {
  return new Date().toISOString().split("T")[0];
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInlineMarkdown(text: string) {
  // Simple bold replacement
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function extractDecision(markdownText: string) {
  const match = markdownText.match(
    /(BUY|SELL|HOLD|REDUCE|MONITOR|RE-EVALUATE)/i
  );
  return match ? match[0].toUpperCase() : "REVIEW";
}

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
  if (keyPoints.length === 0) {
    const sentences = text.split(/[.!?]+/).filter((s) => {
      const trimmed = s.trim();
      return trimmed.length > 30 && trimmed.length < 250;
    });
    const importantTerms = [
      "buy",
      "sell",
      "hold",
      "recommend",
      "price",
      "target",
      "risk",
      "opportunity",
      "trend",
      "analysis",
    ];
    const scoredSentences = sentences
      .map((s) => {
        const lower = s.toLowerCase();
        const score = importantTerms.reduce(
          (acc, term) => acc + (lower.includes(term) ? 1 : 0),
          0
        );
        return { text: s.trim(), score };
      })
      .sort((a, b) => b.score - a.score);
    scoredSentences.slice(0, 2).forEach((item) => {
      if (item.text) {
        keyPoints.push(item.text + ".");
      }
    });
  }
  return keyPoints;
}

function summarizeReport(reportText: string, decision: string) {
  if (!reportText) return "";
  const lines = reportText.split("\n");
  const summary: string[] = [];
  let currentSection: string | null = null;
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const isHeader =
      (line.match(/^[A-Z][A-Za-z\s]+$/) &&
        line.length < 80 &&
        !line.includes(".") &&
        !line.includes(",")) ||
      line.match(/^#{1,6}\s/) ||
      (line.endsWith(":") && line.length < 60);

    if (
      isHeader &&
      !line.startsWith("•") &&
      !line.startsWith("-") &&
      !line.startsWith("*")
    ) {
      if (currentSection) {
        summary.push(currentSection);
        const keyPoints = extractKeyPoints(currentContent.join(" "));
        if (keyPoints.length > 0) {
          summary.push(...keyPoints);
        }
        summary.push("");
      }
      currentSection = line.replace(/^#+\s*/, "").replace(":", "");
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    } else {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    summary.push(currentSection);
    const keyPoints = extractKeyPoints(currentContent.join(" "));
    if (keyPoints.length > 0) {
      summary.push(...keyPoints);
    }
  } else if (currentContent.length > 0) {
    const keyPoints = extractKeyPoints(currentContent.join(" "));
    summary.push(...keyPoints);
  }

  if (decision && decision !== "Awaiting run" && decision !== "—") {
    summary.push("");
    summary.push(`RECOMMENDATION: ${decision}`);
  }
  return summary.join("\n");
}

// --- Components ---

export default function Home() {
  // State
  const [ticker, setTicker] = useState("SPY");
  const [analysisDate, setAnalysisDate] = useState("");
  const [researchDepth, setResearchDepth] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [teamState, setTeamState] = useState(deepClone(TEAM_TEMPLATE));
  const [reportSections, setReportSections] = useState<
    { key: string; label: string; text: string }[]
  >([]);
  const [decision, setDecision] = useState("Awaiting run");
  const [copyFeedback, setCopyFeedback] = useState("Copy report");

  // Debug State
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);
  const [debugLogs, setDebugLogs] = useState<
    { time: string; type: string; content: string }[]
  >([]);
  const [wsStatus, setWsStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");
  const [wsUrl, setWsUrl] = useState("");
  const [msgCount, setMsgCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [lastType, setLastType] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const debugLogRef = useRef<HTMLDivElement>(null);

  // Initialize Date
  useEffect(() => {
    setAnalysisDate(toISODate());
  }, []);

  // Auto-scroll debug logs
  useEffect(() => {
    if (debugLogRef.current) {
      debugLogRef.current.scrollTop = debugLogRef.current.scrollHeight;
    }
  }, [debugLogs]);

  // WebSocket Logic
  const addDebugLog = useCallback(
    (type: string, content: string, isError = false) => {
      const time = new Date().toLocaleTimeString();
      setDebugLogs((prev) => {
        const newLogs = [...prev, { time, type, content: String(content) }];
        if (newLogs.length > 50) newLogs.shift();
        return newLogs;
      });
      setMsgCount((prev) => prev + 1);
      setLastUpdate(new Date().toISOString());
      setLastType(type);
      if (isError) setErrorCount((prev) => prev + 1);
    },
    []
  );

  const runPipeline = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setTeamState(deepClone(TEAM_TEMPLATE));
    setReportSections([]);
    setDecision("Awaiting run");
    setDebugLogs([]);
    setMsgCount(0);
    setErrorCount(0);

    let url;
    if (
      typeof window !== "undefined" &&
      (window.location.protocol === "file:" || window.location.hostname === "")
    ) {
      url = "ws://localhost:8000/ws";
    } else if (typeof window !== "undefined") {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.hostname;
      // Connect to backend port 8000
      const wsPort = "8000";
      url = `${wsProtocol}//${wsHost}:${wsPort}/ws`;
    } else {
      url = "ws://localhost:8000/ws";
    }

    setWsUrl(url);
    setWsStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        addDebugLog("system", "WebSocket connected", false);
        const request = {
          action: "start_analysis",
          request: {
            ticker: ticker,
            analysis_date: analysisDate,
            analysts: ANALYSTS_DATA.map((a) => a.value),
            research_depth: researchDepth,
            llm_provider: "google",
            backend_url: "https://generativelanguage.googleapis.com/v1",
            shallow_thinker: SHALLOW_AGENTS.google[0][1],
            deep_thinker: DEEP_AGENTS.google[0][1],
          },
        };
        ws.send(JSON.stringify(request));
        addDebugLog("request", `Starting analysis for ${ticker}`, false);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        addDebugLog(
          type,
          JSON.stringify(data).substring(0, 200),
          type === "error"
        );

        switch (type) {
          case "status":
            if (data.agents) {
              setTeamState((prev) => {
                const newState = deepClone(prev);
                Object.entries(data.agents).forEach(([agentName, status]) => {
                  const mapping = AGENT_TO_TEAM_MAP[agentName];
                  if (mapping) {
                    const [teamKey, frontendName] = mapping;
                    const member = newState[teamKey].find(
                      (m) => m.name === frontendName
                    );
                    if (member) member.status = status as string;
                  }
                });
                return newState;
              });
            }
            break;

          case "report":
            setReportSections((prev) => {
              const existingIndex = prev.findIndex(
                (s) => s.key === data.section
              );
              const newSection = {
                key: data.section,
                label: data.label,
                text: data.content,
              };
              if (existingIndex >= 0) {
                const newSections = [...prev];
                newSections[existingIndex] = newSection;
                return newSections;
              } else {
                return [...prev, newSection];
              }
            });
            break;

          case "complete":
            if (data.final_state) {
              const sectionMap: Record<string, { key: string; label: string }> =
              {
                market_report: { key: "market", label: "Market Analysis" },
                sentiment_report: {
                  key: "sentiment",
                  label: "Social Sentiment",
                },
                news_report: { key: "news", label: "News Analysis" },
                fundamentals_report: {
                  key: "fundamentals",
                  label: "Fundamentals Review",
                },
                investment_plan: {
                  key: "investment_plan",
                  label: "Research Team Decision",
                },
                trader_investment_plan: {
                  key: "trader",
                  label: "Trader Investment Plan",
                },
                final_trade_decision: {
                  key: "final",
                  label: "Portfolio Management Decision",
                },
              };

              const finalSections: {
                key: string;
                label: string;
                text: string;
              }[] = [];
              Object.entries(data.final_state).forEach(([key, content]) => {
                if (content && sectionMap[key]) {
                  finalSections.push({
                    key: sectionMap[key].key,
                    label: sectionMap[key].label,
                    text: content as string,
                  });
                }
              });
              if (finalSections.length > 0) {
                setReportSections(finalSections);
              }
            }

            let finalDecision = data.decision;
            if (!finalDecision) {
              // Try to extract from final report if not explicitly sent
              setReportSections((currentSections) => {
                const finalSection = currentSections.find(
                  (s) => s.key === "final_trade_decision"
                );
                if (finalSection) {
                  finalDecision = extractDecision(finalSection.text);
                }
                return currentSections;
              });
            }
            if (finalDecision) {
              setDecision(finalDecision);
            }

            // Mark all as completed
            setTeamState((prev) => {
              const newState = deepClone(prev);
              Object.keys(newState).forEach((key) => {
                newState[key as keyof typeof TEAM_TEMPLATE].forEach((m) => {
                  m.status = "completed";
                });
              });
              return newState;
            });

            setIsRunning(false);
            ws.close();
            break;

          case "error":
            addDebugLog("error", data.message, true);
            setReportSections((prev) => [
              ...prev,
              {
                key: "error",
                label: "Error",
                text: `Error: ${data.message}`,
              },
            ]);
            setIsRunning(false);
            ws.close();
            break;
        }
      };

      ws.onerror = () => {
        console.error("WebSocket connection failed. Ensure the backend is running on port 8000.");
        setWsStatus("disconnected");
        addDebugLog("error", "WebSocket connection failed. Is the backend running?", true);
        setReportSections((prev) => [
          ...prev,
          {
            key: "error",
            label: "Connection Error",
            text: "Connection error. Make sure the FastAPI backend is running on port 8000.",
          },
        ]);
        setIsRunning(false);
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
        addDebugLog("system", "WebSocket connection closed", false);
        setIsRunning(false);
      };
    } catch (error: any) {
      console.error("Error starting analysis:", error);
      setReportSections((prev) => [
        ...prev,
        {
          key: "error",
          label: "Error",
          text: `Error: ${error.message}`,
        },
      ]);
      setIsRunning(false);
    }
  }, [isRunning, ticker, analysisDate, researchDepth, addDebugLog]);

  // Handlers
  const handleCopyReport = async () => {
    const fullText = reportSections
      .map((s) => `${s.label}\n${s.text}`)
      .join("\n\n");
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback("Copy report"), 1800);
    } catch (err) {
      setCopyFeedback("Copy failed");
      setTimeout(() => setCopyFeedback("Copy report"), 1800);
    }
  };

  const handleDownloadPdf = () => {
    const fullText = reportSections
      .map((s) => `${s.label}\n${s.text}`)
      .join("\n\n");
    if (!fullText) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 14;

    let yPosition = margin + 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`TradingAgents Report: ${ticker}`, margin, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Analysis Date: ${analysisDate}`, margin, yPosition);
    yPosition += 30;

    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 25;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Current Report", margin, yPosition);
    yPosition += 20;

    const summarizedReport = summarizeReport(fullText, decision);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const summaryLines = doc.splitTextToSize(summarizedReport, maxWidth);

    for (let i = 0; i < summaryLines.length; i++) {
      const line = summaryLines[i];
      if (yPosition > pageHeight - margin - lineHeight) {
        doc.addPage();
        yPosition = margin;
      }
      if (line.trim().match(/^[A-Z][A-Z\s:]+$/) && line.trim().length < 80) {
        yPosition += 5;
        if (yPosition > pageHeight - margin - lineHeight) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(line.trim(), margin, yPosition);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      } else {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
    }

    doc.save(`TradingAgents_Report_${ticker}_${analysisDate}.pdf`);
  };

  // Render Helpers
  const getRecommendationVariant = (decision: string) => {
    const d = decision.toLowerCase();
    if (d.includes("buy")) return "buy";
    if (d.includes("sell")) return "sell";
    if (d.includes("reduce")) return "reduce";
    return "neutral";
  };

  const recVariant = getRecommendationVariant(decision);

  return (
    <div className="grid min-h-screen grid-cols-[250px_1fr] bg-[#070a13] text-[#f8fbff] font-sans">
      {/* Sidebar */}
      <aside className="flex flex-col gap-8 border-r border-white/5 bg-[#0c111f] px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-[#2df4c6]/40">
            <span className="absolute h-1.5 w-1.5 animate-[pulse_2s_linear_infinite] rounded-full bg-[#2df4c6]"></span>
            <span className="absolute h-1.5 w-1.5 animate-[pulse_2s_linear_infinite_0.35s] rounded-full bg-[#2df4c6]"></span>
            <span className="absolute h-1.5 w-1.5 animate-[pulse_2s_linear_infinite_0.7s] rounded-full bg-[#2df4c6]"></span>
          </div>
          <div>
            <p className="font-semibold tracking-wide">TradingAgents</p>
            <p className="text-sm text-[#8b94ad]">LLM Trading Lab</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2.5">
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "generate", icon: "🌐", label: "Generate", active: true },
            { id: "contact", icon: "📬", label: "Contact" },
            { id: "docs", icon: "📄", label: "View Docs" },
          ].map((item) => (
            <button
              key={item.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] transition-colors ${item.active
                ? "bg-[#2df4c6]/10 text-[#f8fbff]"
                : "text-[#8b94ad] hover:bg-[#2df4c6]/10 hover:text-[#f8fbff]"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between text-sm text-[#8b94ad]">
          <span>Dark mode</span>
          <label className="relative inline-block h-5 w-10 cursor-pointer">
            <input type="checkbox" checked readOnly className="peer sr-only" />
            <span className="absolute inset-0 rounded-full bg-[#394054] transition-all before:absolute before:bottom-[2px] before:left-[2px] before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all peer-checked:bg-[#00d18f] peer-checked:before:translate-x-5"></span>
          </label>
        </div>

        <div className="mt-6 border-t border-white/5 pt-4 text-[0.85rem]">
          <div
            className="mb-3 flex cursor-pointer select-none items-center gap-2 font-medium text-[#8b94ad] hover:text-[#f8fbff]"
            onClick={() => setIsDebugCollapsed(!isDebugCollapsed)}
          >
            <span>🐛</span>
            <span>Debug Panel</span>
            <button className="ml-auto p-1 text-xs transition-transform">
              {isDebugCollapsed ? "▶" : "▼"}
            </button>
          </div>

          {!isDebugCollapsed && (
            <div className="flex max-h-[600px] flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20">
              <div className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-wider text-[#8b94ad]">
                  WebSocket Status
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#f8fbff]">
                  <span
                    className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${wsStatus === "connected"
                      ? "bg-[#2df4c6] shadow-[0_0_6px_#2df4c6]"
                      : wsStatus === "connecting"
                        ? "animate-pulse bg-[#f9a826]"
                        : "bg-[#ff4d6d]"
                      }`}
                  ></span>
                  <span className="capitalize">{wsStatus}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-wider text-[#8b94ad]">
                  Connection URL
                </div>
                <div className="break-all text-xs text-[#f8fbff]">
                  {wsUrl || "—"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-wider text-[#8b94ad]">
                  Messages Received
                </div>
                <div className="text-xs text-[#f8fbff]">{msgCount}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-wider text-[#8b94ad]">
                  Errors
                </div>
                <div className="text-xs text-[#f8fbff]">{errorCount}</div>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <div className="text-xs uppercase tracking-wider text-[#8b94ad]">
                  Recent Messages
                </div>
                <div
                  ref={debugLogRef}
                  className="max-h-[400px] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[0.85rem] leading-relaxed"
                >
                  {debugLogs.length === 0 ? (
                    <div className="p-2 text-center italic text-[#8b94ad]">
                      No messages yet
                    </div>
                  ) : (
                    debugLogs.map((entry, i) => (
                      <div
                        key={i}
                        className={`border-b border-white/5 py-1.5 last:border-0 ${entry.type === "error"
                          ? "text-[#ff4d6d]"
                          : entry.type === "warning"
                            ? "text-[#f9a826]"
                            : ""
                          }`}
                      >
                        <span className="mr-2 text-[#8b94ad]">
                          {entry.time}
                        </span>
                        <span className="mr-2 font-medium text-[#2df4c6]">
                          [{entry.type}]
                        </span>
                        <span className="break-words text-[#f8fbff]">
                          {entry.content.substring(0, 100)}
                          {entry.content.length > 100 ? "..." : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setDebugLogs([]);
                    setMsgCount(0);
                    setErrorCount(0);
                  }}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#8b94ad] transition-all hover:border-white/20 hover:bg-white/10 hover:text-[#f8fbff]"
                >
                  Clear Log
                </button>
                <button
                  onClick={async () => {
                    const logText = debugLogs
                      .map(
                        (e) => `[${e.time}] [${e.type}] ${e.content}`
                      )
                      .join("\n");
                    try {
                      await navigator.clipboard.writeText(logText);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#8b94ad] transition-all hover:border-white/20 hover:bg-white/10 hover:text-[#f8fbff]"
                >
                  Copy Log
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col gap-8 px-9 py-8 pb-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.85rem] uppercase tracking-widest text-[#8b94ad]">
              Trading workflow
            </p>
            <h1 className="text-2xl font-semibold">Generate</h1>
          </div>
          <div className="flex items-end gap-4">
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="rounded-full bg-[#2df4c6] px-9 py-6 text-lg font-semibold text-[#03161b] shadow-lg transition-all hover:-translate-y-px hover:shadow-[0_10px_25px_rgba(45,244,198,0.35)] disabled:cursor-wait disabled:opacity-40"
            >
              {isRunning ? "Running…" : "Generate"}
            </button>
          </div>
        </header>

        {/* Step Grid */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          <article className="flex flex-col gap-3.5 rounded-[20px] border border-white/5 bg-[#111726] p-5">
            <header>
              <p className="text-[0.7rem] uppercase tracking-widest text-[#8b94ad]">
                Step 1
              </p>
              <h2 className="text-lg font-semibold">Ticker Symbol</h2>
            </header>
            <label className="flex flex-col gap-1.5 text-[0.85rem] text-[#8b94ad]">
              <span>Select (ex. SPY)</span>
              <input
                type="text"
                list="ticker-suggestions"
                autoComplete="off"
                placeholder="SPY"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="min-w-[160px] rounded-xl border border-white/10 bg-[#1a2133] px-3 py-2.5 text-[#f8fbff]"
              />
              <datalist id="ticker-suggestions">
                <option value="SPY"></option>
                <option value="NVDA"></option>
                <option value="AAPL"></option>
                <option value="TSLA"></option>
                <option value="MSFT"></option>
              </datalist>
            </label>
          </article>

          <article className="flex flex-col gap-3.5 rounded-[20px] border border-white/5 bg-[#111726] p-5">
            <header>
              <p className="text-[0.7rem] uppercase tracking-widest text-[#8b94ad]">
                Step 2
              </p>
              <h2 className="text-lg font-semibold">Analysis Date</h2>
            </header>
            <label className="flex flex-col gap-1.5 text-[0.85rem] text-[#8b94ad]">
              <span>YYYY-MM-DD</span>
              <input
                type="date"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className="min-w-[160px] rounded-xl border border-white/10 bg-[#1a2133] px-3 py-2.5 text-[#f8fbff]"
              />
            </label>
          </article>
        </section>

        {/* Teams Grid */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {Object.entries(teamState).map(([teamKey, members]) => {
            const completedCount = members.filter(
              (m) => m.status === "completed"
            ).length;
            const progress = Math.round(
              (completedCount / members.length) * 100
            );

            let headerTitle = "";
            let headerSub = "";
            if (teamKey === "analyst") {
              headerTitle = "Analyst team";
              headerSub = "Market • News • Social • Fundamentals";
            } else if (teamKey === "research") {
              headerTitle = "Research team";
              headerSub = "Bull • Bear • Manager";
            } else if (teamKey === "trader") {
              headerTitle = "Trader team";
              headerSub = "Execution";
            } else if (teamKey === "risk") {
              headerTitle = "Risk & Portfolio";
              headerSub = "Risky • Neutral • Safe • Manager";
            }

            return (
              <article
                key={teamKey}
                className="flex flex-col gap-4 rounded-[20px] border border-white/5 bg-[#111726] p-5"
              >
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.85rem] text-[#8b94ad]">
                      {headerTitle}
                    </p>
                    <span className="text-[0.85rem] text-[#8b94ad]">
                      {headerSub}
                    </span>
                  </div>
                  <div
                    className="relative grid h-20 w-20 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#2df4c6 ${(progress / 100) * 360}deg, rgba(255,255,255,0.05) 0deg)`,
                    }}
                  >
                    <div className="absolute inset-[10px] rounded-full bg-[#111726]"></div>
                    <span className="relative font-semibold">{progress}%</span>
                  </div>
                </header>
                <ul className="flex flex-col gap-2.5">
                  {members.map((member, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-sm text-[#8b94ad]"
                    >
                      <span>{member.name}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs capitalize ${member.status === "completed"
                          ? "bg-[#2df4c6]/10 text-[#2df4c6]"
                          : member.status === "pending"
                            ? "bg-[#f9a826]/10 text-[#f9a826]"
                            : member.status === "in_progress"
                              ? "bg-[#3db8ff]/10 text-[#3db8ff]"
                              : "bg-[#ff4d6d]/10 text-[#ff4d6d]"
                          }`}
                      >
                        {member.status.replace("_", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        {/* Report Panel */}
        <section className="flex flex-col gap-4 rounded-[20px] border border-white/5 bg-[#111726] p-5">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p>Current Report</p>
              <small className="text-[0.85rem] text-[#8b94ad]">
                Live updates from TradingAgents graph
              </small>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyReport}
                className="cursor-pointer rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-[#f8fbff]"
              >
                {copyFeedback}
              </button>
              <button
                onClick={handleDownloadPdf}
                className="cursor-pointer rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-[#2df4c6]"
              >
                Download PDF
              </button>
            </div>
          </header>
          <article
            className="min-h-[200px] max-h-[360px] overflow-auto rounded-2xl bg-[#090d17] p-5 text-[0.95rem] leading-relaxed text-[#8b94ad]"
          >
            {reportSections.length === 0 ? (
              <p>Run the pipeline to load the latest markdown report.</p>
            ) : (
              reportSections.map((section, idx) => (
                <div
                  key={idx}
                  className="mt-4 border-t border-white/5 pt-4 first:mt-0 first:border-0 first:pt-0"
                >
                  <h3 className="mb-2 text-base text-[#f8fbff]">
                    {section.label}
                  </h3>
                  <div className="space-y-2">
                    {section.text.split("\n").map((line, lIdx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      if (/^[-*]/.test(trimmed)) {
                        return (
                          <ul key={lIdx} className="ml-4 list-disc pl-2">
                            <li
                              dangerouslySetInnerHTML={{
                                __html: formatInlineMarkdown(
                                  trimmed.replace(/^[-*]\s*/, "")
                                ),
                              }}
                            />
                          </ul>
                        );
                      }
                      return (
                        <p
                          key={lIdx}
                          dangerouslySetInnerHTML={{
                            __html: formatInlineMarkdown(trimmed),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </article>
        </section>

        {/* Summary Panel */}
        <section className="flex flex-row items-center justify-between gap-4 rounded-[20px] border border-white/5 bg-[#111726] p-5">
          <div>
            <p className="mb-2">Summary</p>
            <div className="flex gap-6">
              <div>
                <span className="block text-[0.85rem] text-[#8b94ad]">
                  Symbol
                </span>
                <strong className="text-xl">{ticker}</strong>
              </div>
              <div>
                <span className="block text-[0.85rem] text-[#8b94ad]">
                  Date
                </span>
                <strong className="text-xl">{analysisDate}</strong>
              </div>
              <div>
                <span className="block text-[0.85rem] text-[#8b94ad]">
                  Research depth
                </span>
                <strong className="text-xl">
                  {
                    RESEARCH_DEPTH_OPTIONS.find(
                      (o) => o.value === researchDepth
                    )?.label
                  }
                </strong>
              </div>
            </div>
          </div>
          <div
            className={`rounded-2xl border px-8 py-4 text-center ${recVariant === "buy"
              ? "border-[#2df4c6]/40 bg-[#2df4c6]/10"
              : recVariant === "sell" || recVariant === "reduce"
                ? "border-[#ff4d6d]/40 bg-[#ff4d6d]/10"
                : "border-[#ff4d6d]/40 bg-[#ff4d6d]/10"
              }`}
          >
            <span className="block text-[#8b94ad]">Recommendation</span>
            <strong
              className={`text-2xl ${recVariant === "buy" ? "text-[#2df4c6]" : "text-[#ff4d6d]"
                }`}
            >
              {decision}
            </strong>
          </div>
        </section>
      </main>
    </div>
  );
}

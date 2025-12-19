"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import Sidebar from "../components/Sidebar";
import DebugPanel from "../components/DebugPanel";
import ReportSections from "../components/ReportSections";
import TelegramConnect from "../components/TelegramConnect";

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
  deepseek: [
    ["DeepSeek Chat", "deepseek-chat"],
  ],
};

const DEEP_AGENTS = {
  deepseek: [
    ["DeepSeek Reasoner", "deepseek-reasoner"],
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
  ],
  portfolio: [{ name: "Portfolio Manager", status: "pending" }],
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
  "Portfolio Manager": ["portfolio", "Portfolio Manager"],
};

const REPORT_ORDER = [
  "market_report", "Summarize_market_report",
  "sentiment_report", "Summarize_social_report",
  "news_report", "Summarize_news_report",
  "fundamentals_report", "Summarize_fundamentals_report",
  "bull_researcher_summarizer",
  "bear_researcher_summarizer",
  "investment_plan", "Summarize_investment_plan_report",
  "trader_investment_plan", "trader_summarizer",
  "Summarize_conservative_report",
  "Summarize_aggressive_report",
  "Summarize_neutral_report",
  "final_trade_decision", "Summarize_final_trade_decision_report"
];

const TEAM_KEYS = ["analyst", "research", "trader", "risk", "portfolio"] as const;

const SECTION_MAP: Record<string, { key: string; label: string }> = {
  market_report: { key: "market", label: "Market Analysis (Full)" },
  Summarize_market_report: { key: "sum_market", label: "Market Analysis (Summary)" },

  sentiment_report: { key: "sentiment", label: "Social Sentiment (Full)" },
  Summarize_social_report: { key: "sum_social", label: "Social Sentiment (Summary)" },

  news_report: { key: "news", label: "News Analysis (Full)" },
  Summarize_news_report: { key: "sum_news", label: "News Analysis (Summary)" },

  fundamentals_report: { key: "fundamentals", label: "Fundamentals Review (Full)" },
  Summarize_fundamentals_report: { key: "sum_funda", label: "Fundamentals Review (Summary)" },

  bull_researcher_summarizer: { key: "sum_bull", label: "Bull Case (Summary)" },
  bear_researcher_summarizer: { key: "sum_bear", label: "Bear Case (Summary)" },

  investment_plan: { key: "investment_plan", label: "Research Team Decision (Full)" },
  Summarize_investment_plan_report: { key: "sum_invest", label: "Research Team Decision (Summary)" },

  trader_investment_plan: { key: "trader", label: "Trader Investment Plan (Full)" },
  trader_summarizer: { key: "sum_trader", label: "Trader Plan (Summary)" },

  Summarize_conservative_report: { key: "sum_cons", label: "Risk: Conservative (Summary)" },
  Summarize_aggressive_report: { key: "sum_aggr", label: "Risk: Aggressive (Summary)" },
  Summarize_neutral_report: { key: "sum_neut", label: "Risk: Neutral (Summary)" },

  final_trade_decision: { key: "final", label: "Portfolio Management Decision (Full)" },
  Summarize_final_trade_decision_report: { key: "sum_final", label: "Portfolio Decision (Summary)" },
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

function summarizeReport(reportText: string | any, decision: string) {
  if (!reportText) return "";
  // Ensure reportText is a string
  const text = typeof reportText === 'string' ? reportText : String(reportText);
  const lines = text.split("\n");
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
  const [reportLength, setReportLength] = useState<"summary report" | "full report">("summary report");
  const [isRunning, setIsRunning] = useState(false);
  const [teamState, setTeamState] = useState(deepClone(TEAM_TEMPLATE));
  const [reportSections, setReportSections] = useState<
    { key: string; label: string; text: string }[]
  >([]);
  const [decision, setDecision] = useState("Awaiting run");
  const [finalReportData, setFinalReportData] = useState<any>(null);
  const [copyFeedback, setCopyFeedback] = useState("Copy report");
  const [progress, setProgress] = useState(0);
  const [teamProgress, setTeamProgress] = useState({
    analyst: 0,
    research: 0,
    trader: 0,
    risk: 0,
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
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

  const [marketData, setMarketData] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState("");

  // Fetch Market Data Effect
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchMarketData = async (retries = 2) => {
      if (!isMounted) return;
      try {
        // Determine API Base URL (similar to WS logic but http)
        let apiUrl = "http://localhost:8000";
        if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
          const protocol = window.location.protocol;
          const host = window.location.hostname;
          apiUrl = `${protocol}//${host}:8000`;
        }

        // Only clear data on initial attempt
        if (retries === 2) {
          setMarketData(null); // Reset while loading
          setLogoError(false); // Reset logo error
          setLogoSrc(""); // Reset logo source
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const res = await fetch(`${apiUrl}/quote/${ticker}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMarketData(data);
            setLogoSrc(data.logo_url);
          }
        } else {
          throw new Error(`Status: ${res.status}`);
        }
      } catch (e: any) {
        if (!isMounted) return;

        // Only log error on final retry to reduce console spam
        if (retries <= 0) {
          console.warn(`Market data fetch failed for ${ticker}. Backend may not be running.`);
        }

        // Retry only once more if we have retries left
        if (retries > 0) {
          retryTimeout = setTimeout(() => fetchMarketData(retries - 1), 3000);
        }
      }
    };

    if (ticker) {
      // Debounce slightly to avoid rapid calls if typing
      const timeout = setTimeout(() => fetchMarketData(), 500);
      return () => {
        isMounted = false;
        clearTimeout(timeout);
        clearTimeout(retryTimeout);
      };
    }
  }, [ticker]);

  // Helper to format large numbers
  const formatVolume = (num: number) => {
    if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + "B";
    if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + "M";
    if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + "K";
    return num.toString();
  };

  // Handle Logo Error with Fallback
  const handleLogoError = () => {
    if (marketData?.website && !logoSrc.includes("google.com")) {
      // Try Google Favicon as fallback
      try {
        let domain = new URL(marketData.website).hostname;
        if (domain.startsWith("www.")) domain = domain.substring(4);
        setLogoSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } catch (e) {
        setLogoError(true);
      }
    } else {
      setLogoError(true);
    }
  };

  // Helper to create sparkline path
  const createSparklinePath = (data: number[]) => {
    if (!data || data.length === 0) return "";
    // Filter out invalid numbers
    const validData = data.filter(n => Number.isFinite(n));
    if (validData.length < 2) return "";

    const width = 100;
    const height = 50;
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;

    // Create points
    const points = validData.map((val, i) => {
      const x = (i / (validData.length - 1)) * width;
      const y = height - ((val - min) / range) * height * 0.8 - height * 0.1; // Add padding
      return `${x},${y}`;
    });

    // Create area path
    return `M 0,${height} L ${points[0]} L ${points.join(" L ")} L ${width},${height} Z`;
  };

  // Create line only path
  const createLinePath = (data: number[]) => {
    if (!data || data.length === 0) return "";
    const validData = data.filter(n => Number.isFinite(n));
    if (validData.length < 2) return "";

    const width = 100;
    const height = 50;
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;

    const points = validData.map((val, i) => {
      const x = (i / (validData.length - 1)) * width;
      const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
      return `${x} ${y}`;
    });
    return `M ${points.join(" L ")}`;
  };


  const wsRef = useRef<WebSocket | null>(null);
  const debugLogRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  // Effect: Update Report Sections when data or mode changes
  useEffect(() => {
    if (!finalReportData) return;

    const finalSections: {
      key: string;
      label: string;
      text: string;
    }[] = [];

    REPORT_ORDER.forEach((key) => {
      const content = finalReportData[key];
      if (content && SECTION_MAP[key]) {
        const entry = SECTION_MAP[key];
        const isSummary = entry.label.includes("(Summary)");

        // Filtering Logic
        let shouldInclude = false;
        if (reportLength === "summary report") {
          shouldInclude = isSummary;
        } else {
          shouldInclude = !isSummary;
        }

        if (shouldInclude) {
          // Format content
          let textContent = "";
          if (typeof content === "object") {
            // Keep JSON structure for smart rendering
            textContent = "```json\n" + JSON.stringify(content, null, 2) + "\n```";
          } else {
            textContent = String(content);
          }

          finalSections.push({
            key: SECTION_MAP[key].key,
            label: SECTION_MAP[key].label,
            text: textContent,
          });
        }
      }
    });

    if (finalSections.length > 0) {
      setReportSections(finalSections);
    }
  }, [finalReportData, reportLength]);

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

  // WebSocket Connection Effect
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      if (!isMounted) return;

      let url;
      if (
        typeof window !== "undefined" &&
        (window.location.protocol === "file:" || window.location.hostname === "")
      ) {
        url = "ws://localhost:8000/ws";
      } else if (typeof window !== "undefined") {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname;
        const wsPort = "8000";
        url = `${wsProtocol}//${wsHost}:${wsPort}/ws`;
      } else {
        url = "ws://localhost:8000/ws";
      }

      setWsUrl(url);
      setWsStatus("connecting");

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        setWsStatus("connected");
        addDebugLog("system", "WebSocket connected", false);
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
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
            break;

          case "complete":
            if (data.final_state) {
              setFinalReportData(data.final_state);
            }

            let finalDecision = data.decision;
            if (!finalDecision && data.final_state?.final_trade_decision) {
              const decisionContent = data.final_state.final_trade_decision;
              const textToCheck = typeof decisionContent === 'string'
                ? decisionContent
                : JSON.stringify(decisionContent);
              finalDecision = extractDecision(textToCheck);
            }
            if (finalDecision) {
              setDecision(finalDecision);
            }

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
            break;
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        console.warn("WebSocket connection error. Retrying...");
        ws.close(); // Trigger onclose
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setWsStatus("disconnected");
        // Retry connection after 3 seconds
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [addDebugLog]);

  const runPipeline = useCallback(() => {
    if (isRunning) return;

    // Check connection first
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("WebSocket is not connected. Please refresh or check backend.");
      return;
    }

    setIsRunning(true);
    setTeamState(deepClone(TEAM_TEMPLATE));
    setReportSections([]);
    setDecision("Awaiting run");
    setDebugLogs([]);
    setMsgCount(0);
    setErrorCount(0);
    setFinalReportData(null); // Clear previous data

    const request = {
      action: "start_analysis",
      request: {
        ticker: ticker,
        analysis_date: analysisDate,
        analysts: ANALYSTS_DATA.map((a) => a.value),
        research_depth: researchDepth,
        llm_provider: "deepseek",
        backend_url: "https://api.deepseek.com",
        shallow_thinker: SHALLOW_AGENTS.deepseek[0][1],
        deep_thinker: DEEP_AGENTS.deepseek[0][1],
        report_length: reportLength,
      },
    };

    try {
      wsRef.current.send(JSON.stringify(request));
      addDebugLog("request", `Starting analysis for ${ticker}`, false);
    } catch (err: any) {
      console.error("Send error:", err);
      setIsRunning(false);
      addDebugLog("error", "Failed to send request", true);
    }
  }, [isRunning, ticker, analysisDate, researchDepth, reportLength, addDebugLog]);

  const stopPipeline = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ action: "stop" }));
    addDebugLog("system", "Stopping analysis...", true);
    setIsRunning(false);

    // Reset Dashboard State
    setTeamState(deepClone(TEAM_TEMPLATE));
    setReportSections([]);
    setDecision("Awaiting run");
    setFinalReportData(null);
  }, [addDebugLog]);

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
    // 1. Setup Document
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 14;

    let yPosition = margin + 20;

    // รายการ Key ที่ต้องการซ่อน
    const KEYS_TO_HIDE = [
      "selected_indicators", "memory_application", "count",
      "indicator", "validation_notes", "metadata"
    ];

    // --- Helpers ---

    const drawPageFooter = (pageNumber: number) => {
      const str = `Page ${pageNumber}`;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(str, pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text("Generated by TradingAgents", pageWidth - margin, pageHeight - 20, { align: 'right' });
    };

    const checkPageBreak = (neededHeight: number) => {
      if (yPosition + neededHeight > pageHeight - margin) {
        drawPageFooter(doc.getNumberOfPages());
        doc.addPage();
        yPosition = margin + 20;
        // Reset style after new page
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        return true;
      }
      return false;
    };

    // ฟังก์ชันพิมพ์ข้อความแบบรองรับการตัดบรรทัดอัตโนมัติ
    const addText = (text: string, fontSize = 10, isBold = false, indent = 0, color: [number, number, number] = [50, 50, 50]) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color[0], color[1], color[2]);

      const lines = doc.splitTextToSize(text, maxWidth - indent);

      for (let i = 0; i < lines.length; i++) {
        const pageBreakTriggered = checkPageBreak(lineHeight);
        if (pageBreakTriggered) {
          // Re-apply style if page break happened
          doc.setFontSize(fontSize);
          doc.setFont("helvetica", isBold ? "bold" : "normal");
          doc.setTextColor(color[0], color[1], color[2]);
        }

        doc.text(lines[i], margin + indent, yPosition);
        yPosition += lineHeight;
      }
    };

    const toSentenceCase = (str: string) => {
      const s = str.replace(/_/g, " ");
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    // --- Recursive Data Processor (Logic หลักที่คุณต้องการ) ---
    const processData = (data: any, indent = 0) => {
      if (!data) return;

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            // เส้นคั่นระหว่าง Item ใน Array
            if (index > 0) {
              yPosition += 8;
              checkPageBreak(10);
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.5);
              doc.line(margin + indent, yPosition, pageWidth - margin, yPosition);
              yPosition += 12;
            }
            processData(item, indent);
            yPosition += 4;
          } else {
            // Text ใน Array
            let parsedItem = item;
            if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
              try { parsedItem = JSON.parse(item); } catch (e) { }
            }

            if (typeof parsedItem === 'object') {
              processData(parsedItem, indent + 10);
            } else {
              addText(`•  ${String(parsedItem).replace(/\*\*/g, "")}`, 10, false, indent + 10);
            }
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          if (KEYS_TO_HIDE.includes(key)) return;

          const label = toSentenceCase(key);
          let valToProcess = value;

          // Parse JSON String inside Value
          if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
            try { valToProcess = JSON.parse(value); } catch (e) { }
          }

          // DECISION LOGIC: Inline vs Block
          const isComplex = typeof valToProcess === 'object' && valToProcess !== null;
          const strVal = String(valToProcess).replace(/\*\*/g, ""); // ลบ Markdown bold
          const isShortText = strVal.length < 80 && !strVal.includes('\n');

          checkPageBreak(20); // เช็คก่อนเริ่ม Key ใหม่

          if (isComplex) {
            // Case 1: Complex Object -> Block Style (หัวข้ออยู่บรรทัดบน)
            addText(label + ":", 10, true, indent, [0, 0, 0]); // สีดำ
            processData(valToProcess, indent + 15);
            yPosition += 4;
          } else {
            if (isShortText) {
              // Case 2: Short Text -> Inline Style (หัวข้อและเนื้อหาอยู่บรรทัดเดียวกัน)
              doc.setFontSize(10);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(50, 50, 50); // Key สีเทาเข้ม
              const keyWidth = doc.getTextWidth(label + ": ");

              // เช็คว่าพื้นที่พอมั้ย
              if (margin + indent + keyWidth + doc.getTextWidth(strVal) < maxWidth) {
                doc.text(label + ": ", margin + indent, yPosition);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0); // Value สีดำ
                doc.text(strVal, margin + indent + keyWidth, yPosition);
                yPosition += lineHeight;
              } else {
                // ถ้าไม่พอ ให้ปัดลง
                addText(label + ":", 10, true, indent, [50, 50, 50]);
                addText(strVal, 10, false, indent + 15, [0, 0, 0]);
              }
            } else {
              // Case 3: Long Text -> Block Indented
              addText(label + ":", 10, true, indent, [50, 50, 50]);
              addText(strVal, 10, false, indent + 15, [0, 0, 0]);
              yPosition += 4;
            }
          }
        });
      } else {
        // Base case (Primitive)
        const strVal = String(data).replace(/\*\*/g, "");
        addText(strVal, 10, false, indent, [0, 0, 0]);
      }
    };

    // --- เริ่มวาด PDF ---

    // 1. Main Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102); // Navy Blue
    doc.text(`TradingAgents Report: ${ticker}`, margin, yPosition);
    yPosition += 20;

    // Sub-header
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100); // Gray
    doc.text(`Analysis Date: ${analysisDate}`, margin, yPosition);
    yPosition += 25;

    // เส้นคั่น
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 25;

    // 2. Recommendation Section
    // (สมมติว่า decision อยู่ใน props หรือ state ของ component นี้)
    if (decision) {
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Recommendation: ${decision}`, margin, yPosition);
      yPosition += 30;
    }

    // 3. Loop Sections
    reportSections.forEach((section: any) => {
      checkPageBreak(60);

      // Section Header Background
      doc.setFillColor(245, 245, 245); // Light Gray Background
      doc.rect(margin, yPosition - 12, maxWidth, 24, 'F');

      // Section Title
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(section.label, margin + 8, yPosition + 5);
      yPosition += 30;

      // Prepare Content
      let contentData: any = section.text;
      try {
        if (typeof section.text === 'string') {
          // Clean markdown json blocks if any
          const cleanJsonStr = section.text.replace(/```json/g, "").replace(/```/g, "").trim();
          if (cleanJsonStr.startsWith('{') || cleanJsonStr.startsWith('[')) {
            contentData = JSON.parse(cleanJsonStr);
          }
        }
      } catch (e) { }

      // Render Content
      processData(contentData);

      yPosition += 25; // Spacing between sections
    });

    // 4. Footer Last Page
    drawPageFooter(doc.getNumberOfPages());

    // Save
    doc.save(`TradingAgents_${ticker}_${analysisDate}.pdf`);
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#070a13] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>
      {/* Sidebar */}
      <Sidebar
        activeId="generate"
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      >
        <DebugPanel wsStatus={wsStatus} isDarkMode={isDarkMode} />
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-8 px-4 py-6 md:px-9 md:py-8 md:pb-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.85rem] uppercase tracking-widest text-[#8b94ad]">
              Trading workflow
            </p>
            <h1 className="text-2xl font-semibold">Generate</h1>
          </div>

        </header>

        {/* Step Grid */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
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
                className={`min-w-[160px] rounded-xl border px-3 py-2.5 ${isDarkMode ? "border-white/10 bg-[#1a2133] text-[#f8fbff]" : "border-gray-200 bg-gray-50 text-gray-900"}`}
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

          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
            <header>
              <p className="text-[0.7rem] uppercase tracking-widest text-[#8b94ad]">
                Step 2
              </p>
              <h2 className="text-lg font-semibold">Analysis Date</h2>
            </header>
            <div className="flex items-end gap-3">
              <label className="flex flex-1 flex-col gap-1.5 text-[0.85rem] text-[#8b94ad]">
                <span>Select Date (DD-MM-YYYY)</span>
                <div className="relative w-full">
                  {/* Visual Input (DD/MM/YYYY) */}
                  <input
                    type="text"
                    readOnly
                    value={analysisDate.split('-').reverse().join('/')}
                    onClick={() => dateInputRef.current?.showPicker()}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 shadow-inner outline-none transition-all ${isDarkMode
                      ? "border-white/10 bg-[#1a2133] text-[#f8fbff] placeholder-gray-600 focus:border-[#2df4c6]/50"
                      : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#2df4c6]"
                      }`}
                  />
                  {/* Hidden Actual Date Input */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={analysisDate}
                    onChange={(e) => setAnalysisDate(e.target.value)}
                    className="absolute inset-0 -z-10 opacity-0"
                  />
                </div>
              </label>
              <button
                onClick={() => dateInputRef.current?.showPicker()}
                className={`flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${isDarkMode
                  ? "border-[#2df4c6]/30 bg-[#2df4c6]/10 text-[#2df4c6] hover:bg-[#2df4c6]/20 hover:shadow-[0_0_15px_rgba(45,244,198,0.3)]"
                  : "border-[#2df4c6] bg-[#2df4c6]/10 text-[#00c05e]"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </button>
            </div>
          </article>



          {/* Live Market Data Card */}
          <article className={`relative flex flex-col justify-between overflow-hidden rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
            {/* Header */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2df4c6] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2df4c6]"></span>
                </span>
                <span className="text-[0.7rem] font-bold uppercase tracking-widest text-[#2df4c6]">
                  Live Market Data
                </span>
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[0.65rem] font-semibold uppercase ${isDarkMode ? "border-white/10 text-[#8b94ad]" : "border-gray-200 text-gray-500"}`}>
                {marketData?.sector || "Loading..."}
              </span>
            </div>

            {/* Main Info */}
            <div className="relative z-10 mt-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full overflow-hidden ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                  {logoSrc && !logoError ? (
                    <img
                      src={logoSrc}
                      alt="logo"
                      className="h-full w-full object-cover"
                      onError={handleLogoError}
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                      <path d="M12 2a10 10 0 0 1 10 10H12V2z" fill="currentColor"></path>
                      <path d="M21.18 10.98a10.05 10.05 0 0 0-9.16-8.96"></path>
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold truncate">
                  {marketData?.shortName || ticker}
                </h3>
              </div>
              <div className="mt-2 min-h-[40px]">
                {marketData ? (
                  <span className="text-4xl font-bold tracking-tight text-[#2df4c6]">${marketData.price?.toFixed(2)}</span>
                ) : (
                  <span className="animate-pulse text-2xl font-bold opacity-50">Loading...</span>
                )}
              </div>
            </div>

            {/* Footer / Stats */}
            <div className="relative z-10 mt-4 flex items-center justify-between">
              {marketData && (
                <div className="flex items-center gap-3">
                  <span className={`flex items-center rounded-md px-2 py-1 text-xs font-bold ${marketData.change >= 0 ? "bg-[#2df4c6]/10 text-[#2df4c6]" : "bg-[#ff4d6d]/10 text-[#ff4d6d]"}`}>
                    {marketData.change >= 0 ? "↑" : "↓"} {marketData.change > 0 ? "+" : ""}{marketData.percentChange}%
                  </span>
                  <span className="text-xs text-[#8b94ad]">
                    Vol: {formatVolume(marketData.volume)}
                  </span>
                </div>
              )}
            </div>

            {/* Mini Chart SVG (Absolute Background) */}
            <div className="absolute bottom-0 right-0 h-24 w-40 translate-x-4 translate-y-2 pointer-events-none">
              <svg viewBox="0 0 100 50" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {marketData?.sparkline && (
                  <>
                    {/* Area */}
                    <path d={createSparklinePath(marketData.sparkline)} fill="url(#chartGradient)" />
                    {/* Line */}
                    <path d={createLinePath(marketData.sparkline)} fill="none" stroke={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} strokeWidth="2" />
                  </>
                )}
                {!marketData?.sparkline && (
                  <>
                    <path d="M0 40 Q 20 35, 40 38 T 70 20 T 100 5 L 100 50 L 0 50 Z" fill="url(#chartGradient)" />
                    <path d="M0 40 Q 20 35, 40 38 T 70 20 T 100 5" fill="none" stroke={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} strokeWidth="2" />
                  </>
                )}
              </svg>
            </div>
          </article>


          {/* Generate / Stop Button */}
          {isRunning ? (
            <button
              onClick={stopPipeline}
              className="flex w-full flex-row items-center justify-center gap-3 rounded-[16px] border-2 border-white/20 bg-[#ff4d6d] py-4 text-xl font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#ff3355] hover:shadow-[0_10px_25px_rgba(255,77,109,0.35)]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-transparent">
                <div className="h-2.5 w-2.5 rounded-[1px] bg-white" />
              </div>
              <span>Stop Generating</span>
            </button>
          ) : (
            <button
              onClick={runPipeline}
              disabled={wsStatus !== "connected"}
              className="flex w-full flex-row items-center justify-center gap-3 rounded-[16px] border-2 border-white/20 bg-[#00c05e] py-4 text-xl font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#00b056] hover:shadow-[0_10px_25px_rgba(0,192,94,0.35)] disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Generate</span>
            </button>
          )}
        </section>

        {/* Teams Grid */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {TEAM_KEYS.map((teamKey, index) => {
            const members = teamState[teamKey];
            const completedCount = members.filter(
              (m) => m.status === "completed"
            ).length;
            const progress = Math.round(
              (completedCount / members.length) * 100
            );

            // Logic: Show "Completed" (Green) only if:
            // 1. The entire team is finished
            // 2. OR the next team has already started working
            const isTeamFinished = members.every((m) => m.status === "completed");
            const nextTeamKey = TEAM_KEYS[index + 1];
            const isNextTeamStarted = nextTeamKey
              ? teamState[nextTeamKey].some((m) => m.status !== "pending")
              : false;

            const showGreenCompletion = isTeamFinished || isNextTeamStarted;

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
            } else if (teamKey === "portfolio") {
              headerTitle = "Portfolio Management";
              headerSub = "Portfolio";
            }

            return (
              <article
                key={teamKey}
                className={`flex flex-col gap-4 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}
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
                    className="relative grid h-20 w-20 flex-shrink-0 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#2df4c6 ${(progress / 100) * 360}deg, rgba(255,255,255,0.05) 0deg)`,
                      transition: "background 1s ease-out",
                    }}
                  >
                    <div className={`absolute inset-[10px] rounded-full ${isDarkMode ? "bg-[#111726]" : "bg-white"}`}></div>
                    <span className="relative font-semibold">{progress}%</span>
                  </div>
                </header>
                <ul className="flex flex-col gap-2.5">
                  {members.map((member, idx) => {
                    let statusLabel = member.status.replace("_", " ");
                    let statusColorClass = "";

                    if (member.status === "completed") {
                      if (showGreenCompletion) {
                        statusColorClass = "bg-[#2df4c6]/10 text-[#2df4c6]";
                      } else {
                        statusLabel = "Completed";
                        statusColorClass = isDarkMode
                          ? "bg-green-600/10 text-green-600"
                          : "bg-green-600 text-green-600";
                      }
                    } else if (member.status === "pending") {
                      statusColorClass = "bg-[#f9a826]/10 text-[#f9a826]";
                    } else if (member.status === "in_progress") {
                      statusColorClass = "bg-[#3db8ff]/10 text-[#3db8ff]";
                    } else {
                      statusColorClass = "bg-[#ff4d6d]/10 text-[#ff4d6d]";
                    }

                    return (
                      <li
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-y-1 text-sm text-[#8b94ad]"
                      >
                        <span>{member.name}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs capitalize ${statusColorClass}`}
                        >
                          {(member.status === "in_progress" || (member.status === "pending" && isRunning)) && (
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                          {statusLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </section>

        {/* Report Panel */}
        <ReportSections
          reportSections={reportSections}
          isDarkMode={isDarkMode}
          ticker={ticker}
          analysisDate={analysisDate}
          decision={decision}
          copyFeedback={copyFeedback}
          setCopyFeedback={setCopyFeedback}
          handleCopyReport={handleCopyReport}
          handleDownloadPdf={handleDownloadPdf}
          reportLength={reportLength}
          setReportLength={setReportLength}
          isRunning={isRunning}
        />

        {/* Summary Panel */}
        <section className={`flex flex-col lg:flex-row items-center justify-between gap-4 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
          <div className="w-full lg:w-auto">
            <p className="mb-2">Summary</p>
            <div className="flex flex-wrap gap-6">
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
    </div >
  );
}

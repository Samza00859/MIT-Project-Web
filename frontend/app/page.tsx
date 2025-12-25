"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/image/Logo.png";
import { jsPDF } from "jspdf";
import Sidebar from "../components/Sidebar";
import DebugPanel from "../components/DebugPanel";
import ReportSections from "../components/ReportSections";
import { buildApiUrl, buildWsUrl, mapFetchError } from "@/lib/api";
import TelegramConnect from "../components/TelegramConnect";
import { useGeneration } from "../context/GenerationContext";

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
  google: [
    ["google", "gemini-2.5-flash-lite"],
  ]
};

const DEEP_AGENTS = {
  deepseek: [
    ["DeepSeek Reasoner", "deepseek-reasoner"],
  ],
  google: [
    ["google", "gemini-2.5-flash"],
  ]
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

// --- Market Icons & Info ---
const MARKET_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  US: {
    label: "US Stocks",
    icon: (
      <svg viewBox="0 0 32 24" className="w-6 h-4 rounded-sm shadow-sm overflow-hidden">
        <rect width="32" height="24" fill="#B22234" />
        <path d="M0 4h32M0 8h32M0 12h32M0 16h32M0 20h32" stroke="white" strokeWidth="2" />
        <rect width="14" height="13" fill="#3C3B6E" />
        <path d="M2 2h10M2 4.25h10M2 6.5h10M2 8.75h10M2 11h10" stroke="white" strokeWidth="1" strokeDasharray="1 1" />
      </svg>
    ),
  },
  TH: {
    label: "Thai Stocks",
    icon: (
      <svg viewBox="0 0 32 24" className="w-6 h-4 rounded-sm shadow-sm overflow-hidden">
        <rect width="32" height="24" fill="#F4F5F8" />
        <rect y="0" width="32" height="4" fill="#ED1C24" />
        <rect y="20" width="32" height="4" fill="#ED1C24" />
        <rect y="8" width="32" height="8" fill="#241D4E" />
      </svg>
    ),
  },
  CN: {
    label: "China Stocks",
    icon: (
      <svg viewBox="0 0 32 24" className="w-6 h-4 rounded-sm shadow-sm overflow-hidden">
        <rect width="32" height="24" fill="#EE1C25" />
        <circle cx="5" cy="6" r="3" fill="#FFFF00" />
        <circle cx="10" cy="3" r="1" fill="#FFFF00" />
        <circle cx="12" cy="5" r="1" fill="#FFFF00" />
        <circle cx="12" cy="8" r="1" fill="#FFFF00" />
        <circle cx="10" cy="10" r="1" fill="#FFFF00" />
      </svg>
    ),
  },
  GOLD: {
    label: "Gold / Precious Metals",
    icon: (
      <svg viewBox="0 0 32 24" className="w-6 h-4 rounded-sm shadow-sm">
        <rect width="32" height="24" fill="#1e293b" rx="2" />
        <circle cx="16" cy="12" r="7" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
        <path d="M16 8v8M14 10h2a2 2 0 1 1 0 4h-2" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
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
  // Get global generation context
  const {
    startGeneration,
    stopGeneration: stopPipeline,
    // Form State (persisted from context)
  } = useGeneration();

  // Local State (UI-specific only)
  // State
  const [ticker, setTicker] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("US");
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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [marketData, setMarketData] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState("");

  // Trigger to refetch market data when component mounts
  const [mountKey, setMountKey] = useState(0);
  useEffect(() => {
    // Increment mountKey to trigger market data fetch on each mount
    setMountKey(prev => prev + 1);
  }, []);
  // Ticker Search State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [marketTickers, setMarketTickers] = useState<any[]>([]); // Cache for backend list
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMarketSelector, setShowMarketSelector] = useState(false); // New Dropdown State
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate stars once for the night sky effect
  const stars = React.useMemo(() => {
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

  // Fetch Full Ticker List from Backend
  const fetchMarketTickers = async (market: string) => {
    try {
      let apiUrl = "http://localhost:8000";
      if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        apiUrl = `${protocol}//${host}:8000`;
      }

      const res = await fetch(`${apiUrl}/api/tickers?market=${market}`);
      if (res.ok) {
        const data = await res.json();
        setMarketTickers(data);
        if (ticker.length < 2) {
          setSuggestions(data);
        }
      }
    } catch (error) {
      console.error("Error fetching market tickers:", error);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions(marketTickers);
      return;
    }

    try {
      let apiUrl = "http://localhost:8000";
      if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        apiUrl = `${protocol}//${host}:8000`;
      }

      const res = await fetch(`${apiUrl}/api/search?q=${query}&market=${selectedMarket}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Logic: When Market changes -> Fetch Tickers for that market
  useEffect(() => {
    fetchMarketTickers(selectedMarket);
    // Note: we don't clear suggestions immediately here because fetch will update them
  }, [selectedMarket]);

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTicker(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.length < 2) {
      // Revert to backend list if input cleared
      setSuggestions(marketTickers);
      setShowSuggestions(true);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>) => {
    setShowSuggestions(true);
    // Always show the full list on focus so user can switch easily
    setSuggestions(marketTickers);

    // Optional: Select text (if it's a focus event) for quick replacement, 
    // unless it's a click where user might want to place cursor
    if (e.type === 'focus') {
      (e.target as HTMLInputElement).select();
    }
  };

  const selectSuggestion = (symbol: string) => {
    setTicker(symbol);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Fetch Market Data Effect
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchMarketData = async (retries = 2) => {
      if (!isMounted) return;
      try {
        const apiUrl = buildApiUrl(`/quote/${ticker}`);

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

            // Smarter Logo Logic:
            // 1. Try provided logo_url
            // 2. If website exists, try Google Favicon (reliable for global sites)
            // 3. Fallback to clearbit in JSX onError
            if (data.logo_url) {
              setLogoSrc(data.logo_url);
            } else if (data.website) {
              // Clean website url to get domain
              try {
                const domain = new URL(data.website).hostname;
                setLogoSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
              } catch (e) {
                setLogoSrc("");
              }
            } else {
              setLogoSrc("");
            }
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
  }, [ticker, mountKey]); // Added mountKey to trigger refetch on mount

  // Helper to format large numbers
  const formatVolume = (num: number) => {
    if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + "B";
    if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + "M";
    if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + "K";
    return num.toString();
  };

  // Handle Logo Error with Fallback
  const handleLogoError = () => {
    // If current logo failed, try fallback strategy
    if (marketData?.website && !logoSrc.includes("google.com")) {
      try {
        const domain = new URL(marketData.website).hostname;
        setLogoSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
        return;
      } catch (e) {
        // Failed to parse URL, proceed to error
      }
    }
    setLogoError(true);
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
  const isRunningRef = useRef(false);
  const debugLogRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Sync isRunning state with ref
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

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

      const url = buildWsUrl("/ws");
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
        setConnectionError(null);
        if (isRunningRef.current) {
          addDebugLog("system", "WebSocket reconnected. Analysis continues...", false);
        } else {
          addDebugLog("system", "WebSocket connected", false);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        let message;
        try {
          message = JSON.parse(event.data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
          addDebugLog("error", "Failed to parse message from server", true);
          return;
        }
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
            if (data.message) {
              // Handle status messages (e.g., "Analysis cancelled", "Analysis stopped")
              addDebugLog("system", data.message, false);
              if (data.message.includes("stopped") || data.message.includes("cancelled")) {
                setIsRunning(false);
              }
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

          case "pong":
            // Keep-alive response, no action needed
            break;
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        console.warn("WebSocket connection error. Retrying...");
        setConnectionError(
          "Realtime connection failed. Verify the backend websocket is reachable on http://localhost:8000/ws and that CORS allows this origin."
        );
        if (isRunningRef.current) {
          addDebugLog("warning", "Connection lost during analysis. Attempting to reconnect...", true);
        }
        ws.close(); // Trigger onclose
      };

      ws.onclose = (event) => {
        if (!isMounted) return;
        setWsStatus("disconnected");
        
        // If analysis was running, the backend has cancelled it
        // Stop the analysis state and notify user
        if (isRunningRef.current) {
          setIsRunning(false);
          addDebugLog("error", "Connection lost. Analysis was interrupted. Please restart the analysis.", true);
          setReportSections((prev) => [
            ...prev,
            {
              key: "connection_error",
              label: "Connection Error",
              text: "WebSocket connection was lost during analysis. The analysis was interrupted. Please restart the analysis after reconnection.",
            },
          ]);
        }
        setConnectionError("Realtime connection lost. Reconnecting to backend...");
        
        // Retry connection after 3 seconds
        reconnectTimeout = setTimeout(() => {
          if (isMounted) {
            connectWebSocket();
          }
        }, 3000);
      };
    };

    connectWebSocket();

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ action: "ping" }));
        } catch (err) {
          console.warn("Failed to send ping:", err);
        }
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [addDebugLog]);

  const runPipeline = useCallback(() => {
    if (isRunning) return;

    if (wsStatus !== "connected") {
      alert("WebSocket is not connected. Please wait and try again.");
      return;
    }

    startGeneration({
      ticker,
      analysisDate,
      analysts: ANALYSTS_DATA.map((a) => a.value),
      researchDepth,
      llmProvider: "google",
      backendUrl: "http://localhost:8000",
      shallowThinker: SHALLOW_AGENTS.google[0][1],
      deepThinker: DEEP_AGENTS.google[0][1],
      reportLength,
    });
  }, [isRunning, wsStatus, startGeneration, ticker, analysisDate, researchDepth, reportLength]);

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

  const handleDownloadPdf = async () => {
    // 1. Setup Document
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Load Fonts Implementation
    const loadFont = async (url: string): Promise<string> => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove data:application/octet-stream;base64, prefix
          const base64data = (reader.result as string).split(",")[1];
          resolve(base64data);
        };
        reader.readAsDataURL(blob);
      });
    };

    try {
      const [sarabunRegular, sarabunBold, maishan] = await Promise.all([
        loadFont("/fonts/Sarabun-Regular.ttf"),
        loadFont("/fonts/Sarabun-Bold.ttf"),
        loadFont("/fonts/Maishan.ttf"),
      ]);

      doc.addFileToVFS("Sarabun-Regular.ttf", sarabunRegular);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");

      doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBold);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");

      doc.addFileToVFS("Maishan.ttf", maishan);
      doc.addFont("Maishan.ttf", "Maishan", "normal");
    } catch (error) {
      console.error("Error loading fonts:", error);
      // Fallback to standard fonts if loading fails
    }

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
      // Determine font for footer (numbers are safe in Sarabun)
      doc.setFont("Sarabun", "normal");
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
        return true;
      }
      return false;
    };

    // ฟังก์ชันพิมพ์ข้อความแบบรองรับการตัดบรรทัดอัตโนมัติ และเปลี่ยน Font ตามภาษา
    const addText = (text: string, fontSize = 10, isBold = false, indent = 0, color: [number, number, number] = [50, 50, 50]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);

      // Simple language detection
      // Check for Thai characters
      const hasThai = /[\u0E00-\u0E7F]/.test(text);
      // Check for Chinese characters
      const hasChinese = /[\u4E00-\u9FFF]/.test(text);

      let currentFont = "Sarabun"; // Default to Sarabun (covers Eng + Thai)
      if (hasChinese && !hasThai) {
        currentFont = "Maishan";
      } else if (hasChinese && hasThai) {
        // Mixed content: Sarabun might not show Chinese well, Maishan might not show Thai well.
        // Prioritize Thai (Sarabun) as it is likely the primary non-English context for this user,
        // OR default to Sarabun. Ideally we split text, but for simplicity:
        currentFont = "Sarabun";
      }

      // Check if we requested bold but the font doesn't support it (Maishan might only have normal)
      let currentStyle = isBold ? "bold" : "normal";
      if (currentFont === "Maishan") {
        currentStyle = "normal"; // Assuming Maishan only has normal
      }

      doc.setFont(currentFont, currentStyle);

      const lines = doc.splitTextToSize(text, maxWidth - indent);

      for (let i = 0; i < lines.length; i++) {
        const pageBreakTriggered = checkPageBreak(lineHeight);
        if (pageBreakTriggered) {
          // Re-apply style if page break happened
          doc.setFontSize(fontSize);
          doc.setFont(currentFont, currentStyle);
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
              doc.setFont("Sarabun", "bold");
              doc.setTextColor(50, 50, 50); // Key สีเทาเข้ม
              const keyWidth = doc.getTextWidth(label + ": ");

              // Detect value language for inline text
              const hasThai = /[\u0E00-\u0E7F]/.test(strVal);
              const hasChinese = /[\u4E00-\u9FFF]/.test(strVal);
              let valFont = "Sarabun";
              if (hasChinese && !hasThai) valFont = "Maishan";

              // Check width with correct font
              doc.setFont(valFont, "normal");
              const valWidth = doc.getTextWidth(strVal);

              // เช็คว่าพื้นที่พอมั้ย
              if (margin + indent + keyWidth + valWidth < maxWidth) {
                // Draw Label
                doc.setFont("Sarabun", "bold");
                doc.setTextColor(50, 50, 50);
                doc.text(label + ": ", margin + indent, yPosition);

                // Draw Value
                doc.setFont(valFont, "normal");
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
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(0, 51, 102); // Navy Blue
    doc.text(`TradingAgents Report: ${ticker}`, margin, yPosition);
    yPosition += 20;

    // Sub-header
    doc.setFontSize(10);
    doc.setFont("Sarabun", "normal");
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
      doc.setFont("Sarabun", "bold");
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
      doc.setFont("Sarabun", "bold");
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
    <div
      className={`flex min-h-screen w-full font-sans transition-colors duration-300 relative overflow-hidden ${
        isDarkMode
          ? "bg-[#020617] text-[#f8fbff]"
          : "bg-gradient-to-br from-[#e0f2fe] via-[#fef3c7] to-[#fce7f3] text-[#0f172a]"
      }`}
    >
      {/* Starry Night Sky Effect - Dark Mode */}
      {isDarkMode && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  opacity: star.opacity,
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
                }}
              />
            ))}
          </div>
          <style jsx>{`
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
        </>
      )}

      {/* Morning Sky Background - Light Mode */}
      {!isDarkMode && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fef3c7]/60 via-[#fce7f3]/40 to-[#e0f2fe]/50" />
          <div 
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,237,153,0.4),rgba(255,200,87,0.2),transparent_70%)] rounded-full blur-3xl animate-[sunrise_20s_ease_infinite]"
            style={{ transform: 'translate(-50%, -20%)' }}
          />
          <div
            className="pointer-events-none absolute inset-[-40%] bg-[radial-gradient(circle_at_20%_30%,rgba(255,237,153,0.25),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(255,200,87,0.20),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.15),transparent_60%),radial-gradient(circle_at_10%_70%,rgba(249,168,212,0.18),transparent_55%)] animate-[gradient_18s_ease_infinite] opacity-60"
          />
          <style jsx>{`
            @keyframes gradient {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
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
          `}</style>
        </>
      )}

      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-start px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-black/70 ring-2 ring-[#2df4c6]/60 shadow-[0_0_18px_rgba(45,244,198,0.45)] overflow-hidden">
            <Image
              src={Logo}
              alt="Trading Agents Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar
        activeId="generate"
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        navItems={[
          { id: "intro", icon: "👋", label: "Intro", href: "/introduction" },
          { id: "generate", icon: "🌐", label: "Generate", href: "/" },
          { id: "history", icon: "📜", label: "History", href: "/history" },
          { id: "contact", icon: "📬", label: "Contact", href: "/contact" },
          { id: "docs", icon: "📄", label: "View Docs", href: "/view-docs" },
        ]}
      >
        <DebugPanel wsStatus={wsStatus} isDarkMode={isDarkMode} />
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-8 px-4 py-6 md:px-9 md:py-8 md:pb-12 pt-20 relative z-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`text-[0.85rem] uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
              Trading workflow
            </p>
            <h1 className={`text-2xl font-semibold ${isDarkMode ? "" : "text-gray-900"}`}>Generate</h1>
          </div>
        </header>

        {connectionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {connectionError}
          </div>
        )}

        {/* Step Grid */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 h-[210px] ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#f59e0b]/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.1)]"}`}>
            <header>
              <p className={`text-[0.7rem] uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                Step 1
              </p>
              <h2 className={`text-lg font-semibold ${isDarkMode ? "" : "text-gray-900"}`}>Ticker Symbol</h2>
            </header>
            <div className={`flex flex-col gap-1.5 text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-700"}`}>
              <span>Select Market & Ticker</span>
              <div className="flex gap-2">
                {/* Custom Market Select Dropdown */}
                <div
                  className="relative z-[100]"
                  onBlur={(e) => {
                    // Close dropdown if focus leaves the container
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setShowMarketSelector(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowMarketSelector(!showMarketSelector)}
                    className={`flex items-center gap-2 h-full rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] hover:bg-white/5" : "border-[#f59e0b]/30 bg-white/80 hover:bg-white hover:border-[#f59e0b]/50"}`}
                  >
                    {MARKET_INFO[selectedMarket]?.icon || <span>?</span>}
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${showMarketSelector ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Market Dropdown Menu */}
                  {showMarketSelector && (
                    <div className={`absolute left-0 top-full z-[100] mt-1 w-48 rounded-xl border shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? "bg-[#1a2133] border-white/10" : "bg-white/95 backdrop-blur-sm border-[#f59e0b]/30 shadow-[0_8px_24px_rgba(245,158,11,0.15)]"}`}>
                      {Object.entries(MARKET_INFO).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedMarket(key);
                            setShowMarketSelector(false);
                          }}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${key === selectedMarket ? (isDarkMode ? "bg-white/10 text-white" : "bg-[#f59e0b]/15 text-[#d97706]") : (isDarkMode ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-[#f59e0b]/5")}`}
                        >
                          {info.icon}
                          <span className="font-medium">{info.label}</span>
                          {key === selectedMarket && <span className="ml-auto text-xs opacity-60">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ticker Input */}
                <div className="relative flex-1 z-[100]">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Select or Type Symbol"
                    value={ticker}
                    onChange={handleTickerChange}
                    onFocus={handleInputFocus}
                    onClick={() => {
                      if (!showSuggestions) {
                        setShowSuggestions(true);
                        setSuggestions(marketTickers);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`w-full min-w-[120px] rounded-xl border pl-3 pr-8 py-2.5 cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] text-[#f8fbff]" : "border-[#f59e0b]/30 bg-white/80 text-gray-900"}`}
                  />
                  {/* Chevron Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className={`absolute left-0 top-full z-[100] mt-1 w-full max-h-60 overflow-y-auto rounded-xl border py-1 shadow-lg ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-[#f59e0b]/30 bg-white/95 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.15)]"}`}>
                      {/* Optional Header for List */}
                      <li className={`px-4 py-2 text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? "bg-white/5 text-gray-400 opacity-50" : "bg-[#f59e0b]/10 text-gray-600"}`}>
                        {ticker.length < 2 ? "Popular Recommendations" : "Search Results"}
                      </li>
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => selectSuggestion(item.symbol)}
                          className={`cursor-pointer px-4 py-2 text-sm flex justify-between items-center transition-colors ${isDarkMode ? "hover:bg-white/5 text-gray-200" : "hover:bg-[#f59e0b]/10 text-gray-800"}`}
                        >
                          <div>
                            <span className={`font-bold ${isDarkMode ? "" : "text-gray-900"}`}>{item.symbol}</span>
                            <span className={`ml-2 text-xs ${isDarkMode ? "opacity-70" : "text-gray-600"}`}>{item.name}</span>
                          </div>
                          <span className={`text-[10px] border rounded px-1 ${isDarkMode ? "opacity-50" : "border-[#f59e0b]/30 text-gray-600 bg-white/50"}`}>{item.exchange}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 h-[210px] ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#f59e0b]/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.1)]"}`}>
            <header>
              <p className={`text-[0.7rem] uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                Step 2
              </p>
              <h2 className={`text-lg font-semibold ${isDarkMode ? "" : "text-gray-900"}`}>Analysis Date</h2>
            </header>
            <div className="flex items-end gap-3">
              <label className={`flex flex-1 flex-col gap-1.5 text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-700"}`}>
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
                      : "border-[#f59e0b]/30 bg-white/80 text-gray-900 focus:border-[#f59e0b]"
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
                  : "border-[#f59e0b]/50 bg-[#f59e0b]/15 text-[#d97706] hover:bg-[#f59e0b]/25 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
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
          <article className={`relative flex flex-col overflow-hidden rounded-[20px] border p-5 h-[210px] transition-all duration-300 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#f59e0b]/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.1)]"}`}>
            {/* Header */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2df4c6] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2df4c6]"></span>
                </span>
                <span className={`text-[0.7rem] font-bold uppercase tracking-widest ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>
                  Live Market Data
                </span>
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[0.65rem] font-semibold uppercase ${isDarkMode ? "border-white/10 text-[#8b94ad]" : "border-[#f59e0b]/30 bg-white/80 text-gray-700"}`}>
                {marketData?.sector || "Loading..."}
              </span>
            </div>

            {/* Main Info */}
            <div className="relative z-10 mt-4 flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                  {logoSrc && !logoError ? (
                    <img
                      src={logoSrc}
                      alt="logo"
                      className="h-full w-full object-cover"
                      onError={handleLogoError}
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                      <path d="M12 2a10 10 0 0 1 10 10H12V2z" fill="currentColor"></path>
                      <path d="M21.18 10.98a10.05 10.05 0 0 0-9.16-8.96"></path>
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold truncate">
                  {/* Prioritize full name from our curated list, then market data name */}
                  {marketTickers.find(t => t.symbol === ticker)?.name || marketData?.name || marketData?.shortName || ticker}
                </h3>
              </div>
              <div className="mt-2 min-h-[40px]">
                {marketData ? (
                  <span className={`text-4xl font-bold tracking-tight ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>${marketData.price?.toFixed(2)}</span>
                ) : (
                  <span className={`animate-pulse text-2xl font-bold opacity-50 ${isDarkMode ? "" : "text-gray-700"}`}>Loading...</span>
                )}
              </div>
            </div>

            {/* Footer / Stats */}
            <div className="relative z-10 mt-4 flex items-center justify-between">
              {marketData && (
                <div className="flex items-center gap-3">
                  <span className={`flex items-center rounded-md px-2 py-1 text-xs font-bold ${marketData.change >= 0 
                    ? isDarkMode ? "bg-[#2df4c6]/10 text-[#2df4c6]" : "bg-[#f59e0b]/15 text-[#d97706]"
                    : "bg-[#ff4d6d]/10 text-[#ff4d6d]"
                  }`}>
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
              className="flex w-full flex-row items-center justify-center gap-2 rounded-[16px] border-2 border-white/20 bg-[#ff4d6d] py-2.5 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#ff3355] hover:shadow-[0_10px_25px_rgba(255,77,109,0.35)]"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-transparent">
                <div className="h-2 w-2 rounded-[1px] bg-white" />
              </div>
              <span>Stop Generating</span>
            </button>
          ) : (
            <button
              onClick={runPipeline}
              disabled={wsStatus !== "connected"}
              className={`flex w-full flex-row items-center justify-center gap-1.5 rounded-[12px] border-2 py-2 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale ${
                isDarkMode
                  ? "border-white/20 bg-[#00c05e] hover:bg-[#00b056] hover:shadow-[0_10px_25px_rgba(0,192,94,0.35)]"
                  : "border-[#f59e0b]/50 bg-gradient-to-r from-[#f59e0b] to-[#ec4899] hover:from-[#fbbf24] hover:to-[#f472b6] hover:shadow-[0_10px_25px_rgba(245,158,11,0.4)]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Generate</span>
            </button>
          )}
        </section>

        {/* Teams Grid */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 relative z-0">
          {TEAM_KEYS.map((teamKey, index) => {
            const members = teamState[teamKey];
            const completedCount = members.filter(
              (m: { status: string; }) => m.status === "completed"
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
                className={`flex flex-col gap-4 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#f59e0b]/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.1)]"}`}
              >
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-700"}`}>
                      {headerTitle}
                    </p>
                    <span className={`text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                      {headerSub}
                    </span>
                  </div>
                  <div
                    className="relative grid h-20 w-20 flex-shrink-0 place-items-center rounded-full"
                    style={{
                      background: isDarkMode 
                        ? `conic-gradient(#2df4c6 ${(progress / 100) * 360}deg, rgba(255,255,255,0.05) 0deg)`
                        : `conic-gradient(#f59e0b ${(progress / 100) * 360}deg, rgba(255,255,255,0.3) 0deg)`,
                      transition: "background 1s ease-out",
                    }}
                  >
                    <div className={`absolute inset-[10px] rounded-full ${isDarkMode ? "bg-[#111726]" : "bg-white/80"}`}></div>
                    <span className="relative font-semibold">{progress}%</span>
                  </div>
                </header>
                <ul className="flex flex-col gap-2.5">
                  {members.map((member, idx) => {
                    let statusLabel = member.status.replace("_", " ");
                    let statusColorClass = "";

                    if (member.status === "completed") {
                      if (showGreenCompletion) {
                        statusColorClass = isDarkMode ? "bg-[#2df4c6]/10 text-[#2df4c6]" : "bg-[#f59e0b]/15 text-[#d97706]";
                      } else {
                        statusLabel = "Completed";
                        statusColorClass = isDarkMode
                          ? "bg-green-600/10 text-green-600"
                          : "bg-green-600/15 text-green-700";
                      }
                    } else if (member.status === "pending") {
                      statusColorClass = isDarkMode ? "bg-[#f9a826]/10 text-[#f9a826]" : "bg-[#f59e0b]/15 text-[#d97706]";
                    } else if (member.status === "in_progress") {
                      statusColorClass = isDarkMode ? "bg-[#3db8ff]/10 text-[#3db8ff]" : "bg-[#f59e0b]/20 text-[#d97706]";
                    } else {
                      statusColorClass = "bg-[#ff4d6d]/10 text-[#ff4d6d]";
                    }

                    return (
                      <li
                        key={idx}
                        className={`flex flex-wrap items-center justify-between gap-y-1 text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-gray-700"}`}
                      >
                        <span className={isDarkMode ? "" : "text-gray-800"}>{member.name}</span>
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
        />

        {/* Summary Panel */}
        <section className={`flex flex-col lg:flex-row items-center justify-between gap-4 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#f59e0b]/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.1)]"}`}>
          <div className="w-full lg:w-auto">
            <p className="mb-2">Summary</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className={`block text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                  Symbol
                </span>
                <strong className={`text-xl ${isDarkMode ? "" : "text-gray-900"}`}>{ticker}</strong>
              </div>
              <div>
                <span className={`block text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                  Date
                </span>
                <strong className={`text-xl ${isDarkMode ? "" : "text-gray-900"}`}>{analysisDate}</strong>
              </div>
              <div>
                <span className={`block text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                  Research depth
                </span>
                <strong className={`text-xl ${isDarkMode ? "" : "text-gray-900"}`}>
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
              ? isDarkMode ? "border-[#2df4c6]/40 bg-[#2df4c6]/10" : "border-[#f59e0b]/40 bg-[#f59e0b]/15"
              : recVariant === "sell" || recVariant === "reduce"
                ? "border-[#ff4d6d]/40 bg-[#ff4d6d]/10"
                : "border-[#ff4d6d]/40 bg-[#ff4d6d]/10"
              }`}
          >
            <span className={`block ${isDarkMode ? "text-[#8b94ad]" : "text-gray-700"}`}>Recommendation</span>
            <strong
              className={`text-2xl ${recVariant === "buy" 
                ? isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"
                : "text-[#ff4d6d]"
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

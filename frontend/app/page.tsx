"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import Sidebar from "../components/Sidebar";
import DebugPanel from "../components/DebugPanel";
import ReportSections from "../components/ReportSections";
import TelegramConnect from "../components/TelegramConnect";
import { useGeneration } from "../context/GenerationContext";

// Import from shared modules for better code splitting
import {
  ANALYSTS_DATA,
  RESEARCH_DEPTH_OPTIONS,
  SHALLOW_AGENTS,
  DEEP_AGENTS,
  REPORT_ORDER,
  SECTION_MAP,
  TEAM_KEYS,
} from "../lib/constants";
import {
  toISODate,
  deepClone,
  getApiUrl,
  formatVolume,
} from "../lib/helpers";
import { MARKET_INFO } from "../components/MarketIcons";

// --- Components ---

export default function Home() {
  // Get global generation context
  const {
    // Generation State
    isRunning,
    teamState,
    reportSections: contextReportSections,
    decision: contextDecision,
    finalReportData: contextFinalReportData,
    progress: contextProgress,
    // Debug State
    debugLogs,
    wsStatus,
    wsUrl,
    msgCount,
    errorCount,
    lastUpdate,
    lastType,
    // Actions
    startGeneration,
    stopGeneration: stopPipeline,
    addDebugLog,
    // Setters
    setReportSections: setContextReportSections,
    setFinalReportData: setContextFinalReportData,
    // Form State (persisted from context)
    ticker,
    setTicker,
    analysisDate,
    setAnalysisDate,
    researchDepth,
    setResearchDepth,
    reportLength,
    setReportLength,
    selectedMarket,
    setSelectedMarket,
    // Market Data State (persisted from context)
    marketData,
    setMarketData,
    logoSrc,
    setLogoSrc,
    logoError,
    setLogoError,
  } = useGeneration();

  // Local State (UI-specific only)
  const [copyFeedback, setCopyFeedback] = useState("Copy report");
  const [teamProgress, setTeamProgress] = useState({
    analyst: 0,
    research: 0,
    trader: 0,
    risk: 0,
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

  // Track last fetched ticker to avoid refetching same data
  const lastFetchedTickerRef = useRef<string>("");

  // Ticker Search State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [marketTickers, setMarketTickers] = useState<any[]>([]); // Cache for backend list
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMarketSelector, setShowMarketSelector] = useState(false); // New Dropdown State
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch Market Data Effect - only fetch when ticker changes
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    // Skip fetch if ticker hasn't changed and we already have data
    if (marketData && lastFetchedTickerRef.current === ticker) {
      return;
    }

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

        // Only clear data on initial attempt when ticker changed
        if (retries === 2 && lastFetchedTickerRef.current !== ticker) {
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
            lastFetchedTickerRef.current = ticker;

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
  }, [ticker, marketData, setMarketData, setLogoError, setLogoSrc]);

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


  const debugLogRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Note: Date is now initialized in GenerationContext, no need to initialize here

  // Auto-scroll debug logs
  useEffect(() => {
    if (debugLogRef.current) {
      debugLogRef.current.scrollTop = debugLogRef.current.scrollHeight;
    }
  }, [debugLogs]);

  // Effect: Update Report Sections when data or mode changes
  useEffect(() => {
    if (!contextFinalReportData) return;

    const finalSections: {
      key: string;
      label: string;
      text: string;
    }[] = [];

    REPORT_ORDER.forEach((key) => {
      const content = contextFinalReportData[key];
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
      setContextReportSections(finalSections);
    }
  }, [contextFinalReportData, reportLength, setContextReportSections]);

  // Create runPipeline function that uses global context
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
    const fullText = contextReportSections
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
    if (contextDecision) {
      yPosition += lineHeight * 1.5;
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 200, 0);
      doc.text(`Recommendation: ${contextDecision}`, margin, yPosition);
      yPosition += lineHeight * 2;
    }

    // 4. Render Report Sections
    doc.setFont("Sarabun", "normal");
    doc.setFontSize(11);
    contextReportSections.forEach((section: any) => {
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
    return "text-gray-500";
  };

  const recVariant = getRecommendationVariant(contextDecision);

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
          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 h-[210px] ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
            <header>
              <p className="text-[0.7rem] uppercase tracking-widest text-[#8b94ad]">
                Step 1
              </p>
              <h2 className="text-lg font-semibold">Ticker Symbol</h2>
            </header>
            <div className="flex flex-col gap-1.5 text-[0.85rem] text-[#8b94ad]">
              <span>Select Market & Ticker</span>
              <div className="flex gap-2">
                {/* Custom Market Select Dropdown */}
                <div
                  className="relative"
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
                    className={`flex items-center gap-2 h-full rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] hover:bg-white/5" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                  >
                    {MARKET_INFO[selectedMarket]?.icon || <span>?</span>}
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${showMarketSelector ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Market Dropdown Menu */}
                  {showMarketSelector && (
                    <div className={`absolute left-0 top-full z-[60] mt-1 w-48 rounded-xl border shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? "bg-[#1a2133] border-white/10" : "bg-white border-gray-100"}`}>
                      {Object.entries(MARKET_INFO).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedMarket(key);
                            setShowMarketSelector(false);
                          }}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${key === selectedMarket ? (isDarkMode ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600") : (isDarkMode ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50")}`}
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
                <div className="relative flex-1">
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
                    className={`w-full min-w-[120px] rounded-xl border pl-3 pr-8 py-2.5 cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] text-[#f8fbff]" : "border-gray-200 bg-gray-50 text-gray-900"}`}
                  />
                  {/* Chevron Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className={`absolute left-0 top-full z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border py-1 shadow-lg ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-gray-200 bg-white"}`}>
                      {/* Optional Header for List */}
                      <li className={`px-4 py-2 text-[10px] uppercase tracking-wider font-semibold opacity-50 ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}>
                        {ticker.length < 2 ? "Popular Recommendations" : "Search Results"}
                      </li>
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => selectSuggestion(item.symbol)}
                          className={`cursor-pointer px-4 py-2 text-sm flex justify-between items-center transition-colors ${isDarkMode ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}
                        >
                          <div>
                            <span className="font-bold">{item.symbol}</span>
                            <span className="ml-2 text-xs opacity-70">{item.name}</span>
                          </div>
                          <span className="text-[10px] opacity-50 border rounded px-1">{item.exchange}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 h-[210px] ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
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
          <article className={`relative flex flex-col overflow-hidden rounded-[20px] border p-5 h-[210px] transition-all duration-300 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-gray-200 bg-white shadow-sm"}`}>
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
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${isDarkMode ? "bg-white text-black" : "bg-white text-gray-700 shadow-md border border-gray-200"}`}>
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
          reportSections={contextReportSections}
          isDarkMode={isDarkMode}
          ticker={ticker}
          analysisDate={analysisDate}
          decision={contextDecision}
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
              {contextDecision}
            </strong>
          </div>
        </section>
      </main>
    </div >
  );
}

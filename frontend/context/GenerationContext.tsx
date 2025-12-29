"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    ReactNode,
} from "react";
import { getWsUrl } from "../lib/api";
import { REPORT_ORDER, SECTION_MAP } from "../lib/constants";

// --- Types ---
export interface TeamMember {
    name: string;
    status: string;
}

export interface TeamState {
    analyst: TeamMember[];
    research: TeamMember[];
    trader: TeamMember[];
    risk: TeamMember[];
    portfolio: TeamMember[];
}

export interface DebugLog {
    time: string;
    type: string;
    content: string;
}

export interface ReportSection {
    key: string;
    label: string;
    text: string;
}

export interface GenerationRequest {
    ticker: string;
    analysisDate: string;
    analysts: string[];
    researchDepth: number;
    llmProvider: string;
    backendUrl: string;
    shallowThinker: string;
    deepThinker: string;
    reportLength: "summary report" | "full report";
}

export interface GenerationContextType {
    // WebSocket State
    wsStatus: "connected" | "connecting" | "disconnected";
    wsUrl: string;

    // Generation State
    isRunning: boolean;
    currentTicker: string;
    progress: number;
    teamState: TeamState;
    reportSections: ReportSection[];
    finalReportData: any;
    decision: string;

    // Form State (persisted across navigation)
    ticker: string;
    setTicker: React.Dispatch<React.SetStateAction<string>>;
    analysisDate: string;
    setAnalysisDate: React.Dispatch<React.SetStateAction<string>>;
    researchDepth: number;
    setResearchDepth: React.Dispatch<React.SetStateAction<number>>;
    reportLength: "summary report" | "full report";
    setReportLength: React.Dispatch<React.SetStateAction<"summary report" | "full report">>;
    selectedMarket: string;
    setSelectedMarket: React.Dispatch<React.SetStateAction<string>>;

    // Market Data State (persisted across navigation)
    marketData: any;
    setMarketData: React.Dispatch<React.SetStateAction<any>>;
    logoSrc: string;
    setLogoSrc: React.Dispatch<React.SetStateAction<string>>;
    logoError: boolean;
    setLogoError: React.Dispatch<React.SetStateAction<boolean>>;

    // Debug State
    debugLogs: DebugLog[];
    msgCount: number;
    errorCount: number;
    lastUpdate: string | null;
    lastType: string | null;

    // Actions
    startGeneration: (request: GenerationRequest) => void;
    stopGeneration: () => void;
    clearGeneration: () => void;
    addDebugLog: (type: string, content: string, isError?: boolean) => void;

    // Setters for external use
    setReportSections: React.Dispatch<React.SetStateAction<ReportSection[]>>;
    setFinalReportData: React.Dispatch<React.SetStateAction<any>>;
}

// --- Constants ---
const TEAM_TEMPLATE: TeamState = {
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

const AGENT_TO_TEAM_MAP: Record<string, [keyof TeamState, string]> = {
    "Market Analyst": ["analyst", "Market Analyst"],
    "Social Analyst": ["analyst", "Social Media Analyst"],
    "News Analyst": ["analyst", "News Analyst"],
    "Fundamentals Analyst": ["analyst", "Fundamentals Analyst"],
    "Bull Researcher": ["research", "Bull Research"],
    "Bear Researcher": ["research", "Bear Research"],
    "Research Manager": ["research", "Research Manager"],
    Trader: ["trader", "Trader"],
    "Risky Analyst": ["risk", "Risk Analyst"],
    "Neutral Analyst": ["risk", "Neutral Analyst"],
    "Safe Analyst": ["risk", "Safe Analyst"],
    "Portfolio Manager": ["portfolio", "Portfolio Manager"],
};

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

function extractDecision(markdownText: string) {
    const match = markdownText.match(
        /(BUY|SELL|HOLD|REDUCE|MONITOR|RE-EVALUATE)/i
    );
    return match ? match[0].toUpperCase() : "REVIEW";
}

// --- Context ---
const GenerationContext = createContext<GenerationContextType | undefined>(
    undefined
);

export function useGeneration() {
    const context = useContext(GenerationContext);
    if (!context) {
        throw new Error("useGeneration must be used within a GenerationProvider");
    }
    return context;
}

// --- Provider ---
export function GenerationProvider({ children }: { children: ReactNode }) {
    // WebSocket State
    const [wsStatus, setWsStatus] = useState<
        "connected" | "connecting" | "disconnected"
    >("disconnected");
    const [wsUrl, setWsUrl] = useState("");

    // Generation State
    const [isRunning, setIsRunning] = useState(false);
    const [currentTicker, setCurrentTicker] = useState("");
    const [progress, setProgress] = useState(0);
    const [teamState, setTeamState] = useState<TeamState>(deepClone(TEAM_TEMPLATE));
    const [reportSections, setReportSections] = useState<ReportSection[]>([]);
    const [finalReportData, setFinalReportData] = useState<any>(null);
    const [decision, setDecision] = useState("Awaiting run");

    // Form State (persisted across navigation)
    const [ticker, setTicker] = useState("");
    const [analysisDate, setAnalysisDate] = useState(() => {
        // Initialize with current date
        return new Date().toISOString().split("T")[0];
    });
    const [researchDepth, setResearchDepth] = useState(3);
    const [reportLength, setReportLength] = useState<"summary report" | "full report">("summary report");
    const [selectedMarket, setSelectedMarket] = useState("US");

    // Market Data State (persisted across navigation)
    const [marketData, setMarketData] = useState<any>(null);
    const [logoSrc, setLogoSrc] = useState("");
    const [logoError, setLogoError] = useState(false);

    // Debug State
    const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
    const [msgCount, setMsgCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [lastType, setLastType] = useState<string | null>(null);

    // Effect: Update Report Sections when data or mode changes
    useEffect(() => {
        if (!finalReportData) return;

        const finalSections: ReportSection[] = [];

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

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Add Debug Log
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

    // WebSocket Connection - Persistent across page navigations
    useEffect(() => {
        let isMounted = true;

        const connectWebSocket = () => {
            if (!isMounted) return;

            // Prevent multiple connections
            if (
                wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                    wsRef.current.readyState === WebSocket.CONNECTING)
            ) {
                return;
            }

            // Use centralized URL utility for proper production deployment
            const url = getWsUrl();

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
                try {
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
                            // Handle intermediate reports if needed
                            break;

                        case "complete":
                            if (data.final_state) {
                                setFinalReportData(data.final_state);
                            }

                            let finalDecision = data.decision;
                            if (!finalDecision && data.final_state?.final_trade_decision) {
                                const decisionContent = data.final_state.final_trade_decision;
                                const textToCheck =
                                    typeof decisionContent === "string"
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
                                    newState[key as keyof TeamState].forEach((m) => {
                                        m.status = "completed";
                                    });
                                });
                                return newState;
                            });

                            setIsRunning(false);
                            addDebugLog("system", "Analysis completed!", false);
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
                } catch (err) {
                    console.error("Failed to parse WebSocket message:", err);
                }
            };

            ws.onerror = () => {
                if (!isMounted) return;
                console.warn("WebSocket connection error. Retrying...");
                ws.close();
            };

            ws.onclose = () => {
                if (!isMounted) return;
                setWsStatus("disconnected");
                // Clear existing timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                // Retry connection after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket();
                }, 3000);
            };
        };

        connectWebSocket();

        return () => {
            isMounted = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            // Don't close WebSocket on unmount - it will persist
        };
    }, [addDebugLog]);

    // Start Generation
    const startGeneration = useCallback(
        (request: GenerationRequest) => {
            if (isRunning) {
                addDebugLog("warning", "Generation already in progress", false);
                return;
            }

            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                addDebugLog(
                    "error",
                    "WebSocket is not connected. Please wait and try again.",
                    true
                );
                return;
            }

            setIsRunning(true);
            setCurrentTicker(request.ticker);
            setTeamState(deepClone(TEAM_TEMPLATE));
            setReportSections([]);
            setDecision("Awaiting run");
            setDebugLogs([]);
            setMsgCount(0);
            setErrorCount(0);
            setFinalReportData(null);
            setProgress(0);

            const wsRequest = {
                action: "start_analysis",
                request: {
                    ticker: request.ticker,
                    analysis_date: request.analysisDate,
                    analysts: request.analysts,
                    research_depth: request.researchDepth,
                    llm_provider: request.llmProvider,
                    backend_url: request.backendUrl,
                    shallow_thinker: request.shallowThinker,
                    deep_thinker: request.deepThinker,
                    report_length: request.reportLength,
                },
            };

            try {
                wsRef.current.send(JSON.stringify(wsRequest));
                addDebugLog("request", `Starting analysis for ${request.ticker}`, false);
            } catch (err: any) {
                console.error("Send error:", err);
                setIsRunning(false);
                addDebugLog("error", "Failed to send request", true);
            }
        },
        [isRunning, addDebugLog]
    );

    // Stop Generation
    const stopGeneration = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            addDebugLog("warning", "WebSocket not connected", false);
            return;
        }

        wsRef.current.send(JSON.stringify({ action: "stop" }));
        addDebugLog("system", "Stopping analysis...", true);
        setIsRunning(false);
    }, [addDebugLog]);

    // Clear Generation (reset all state)
    const clearGeneration = useCallback(() => {
        setIsRunning(false);
        setCurrentTicker("");
        setProgress(0);
        setTeamState(deepClone(TEAM_TEMPLATE));
        setReportSections([]);
        setFinalReportData(null);
        setDecision("Awaiting run");
        setDebugLogs([]);
        setMsgCount(0);
        setErrorCount(0);
    }, []);

    const value: GenerationContextType = {
        // WebSocket State
        wsStatus,
        wsUrl,

        // Generation State
        isRunning,
        currentTicker,
        progress,
        teamState,
        reportSections,
        finalReportData,
        decision,

        // Form State
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

        // Market Data State
        marketData,
        setMarketData,
        logoSrc,
        setLogoSrc,
        logoError,
        setLogoError,

        // Debug State
        debugLogs,
        msgCount,
        errorCount,
        lastUpdate,
        lastType,

        // Actions
        startGeneration,
        stopGeneration,
        clearGeneration,
        addDebugLog,

        // Setters
        setReportSections,
        setFinalReportData,
    };

    return (
        <GenerationContext.Provider value={value}>
            {children}
        </GenerationContext.Provider>
    );
}

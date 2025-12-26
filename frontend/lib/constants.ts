// --- Constants & Types ---

export const ANALYSTS_DATA = [
    { label: "Market Analyst", value: "market" },
    { label: "Social Media Analyst", value: "social" },
    { label: "News Analyst", value: "news" },
    { label: "Fundamentals Analyst", value: "fundamentals" },
];

export const RESEARCH_DEPTH_OPTIONS = [
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

export const SHALLOW_AGENTS = {
    deepseek: [["DeepSeek Chat", "deepseek-chat"]],
    google: [["google", "gemini-2.5-flash-lite"]],
};

export const DEEP_AGENTS = {
    deepseek: [["DeepSeek Reasoner", "deepseek-reasoner"]],
    google: [["google", "gemini-2.5-flash"]],
};

export const TEAM_TEMPLATE = {
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

export const AGENT_TO_TEAM_MAP: Record<
    string,
    [keyof typeof TEAM_TEMPLATE, string]
> = {
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

export const REPORT_ORDER = [
    "market_report",
    "Summarize_market_report",
    "sentiment_report",
    "Summarize_social_report",
    "news_report",
    "Summarize_news_report",
    "fundamentals_report",
    "Summarize_fundamentals_report",
    "bull_researcher_summarizer",
    "bear_researcher_summarizer",
    "investment_plan",
    "Summarize_investment_plan_report",
    "trader_investment_plan",
    "trader_summarizer",
    "Summarize_conservative_report",
    "Summarize_aggressive_report",
    "Summarize_neutral_report",
    "final_trade_decision",
    "Summarize_final_trade_decision_report",
];

export const TEAM_KEYS = [
    "analyst",
    "research",
    "trader",
    "risk",
    "portfolio",
] as const;

export const SECTION_MAP: Record<string, { key: string; label: string }> = {
    market_report: { key: "market", label: "Market Analysis (Full)" },
    Summarize_market_report: {
        key: "sum_market",
        label: "Market Analysis (Summary)",
    },

    sentiment_report: { key: "sentiment", label: "Social Sentiment (Full)" },
    Summarize_social_report: {
        key: "sum_social",
        label: "Social Sentiment (Summary)",
    },

    news_report: { key: "news", label: "News Analysis (Full)" },
    Summarize_news_report: { key: "sum_news", label: "News Analysis (Summary)" },

    fundamentals_report: {
        key: "fundamentals",
        label: "Fundamentals Review (Full)",
    },
    Summarize_fundamentals_report: {
        key: "sum_funda",
        label: "Fundamentals Review (Summary)",
    },

    bull_researcher_summarizer: { key: "sum_bull", label: "Bull Case (Summary)" },
    bear_researcher_summarizer: { key: "sum_bear", label: "Bear Case (Summary)" },

    investment_plan: {
        key: "investment_plan",
        label: "Research Team Decision (Full)",
    },
    Summarize_investment_plan_report: {
        key: "sum_invest",
        label: "Research Team Decision (Summary)",
    },

    trader_investment_plan: {
        key: "trader",
        label: "Trader Investment Plan (Full)",
    },
    trader_summarizer: { key: "sum_trader", label: "Trader Plan (Summary)" },

    Summarize_conservative_report: {
        key: "sum_cons",
        label: "Risk: Conservative (Summary)",
    },
    Summarize_aggressive_report: {
        key: "sum_aggr",
        label: "Risk: Aggressive (Summary)",
    },
    Summarize_neutral_report: {
        key: "sum_neut",
        label: "Risk: Neutral (Summary)",
    },

    final_trade_decision: {
        key: "final",
        label: "Portfolio Management Decision (Full)",
    },
    Summarize_final_trade_decision_report: {
        key: "sum_final",
        label: "Portfolio Decision (Summary)",
    },
};

// History page constants
export const HISTORY_REPORT_ORDER = [
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
    "Portfolio Management Decision",
];

export const TITLE_MAP: Record<string, string> = {
    fundamental: "Fundamentals Review",
    market: "Market Analysis",
    sentiment: "Social Sentiment",
    news: "News Analysis",
    trader: "Trader Plan",
    risk: "Portfolio Management Decision",
    technical: "Market Analysis",
};

"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { format } from "date-fns";

interface HistoryItem {
    id: number;
    timestamp: string;
    action_type: string;
    input_params: any;
    output_result: any;
    status: string;
    error_message: string | null;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);

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

    return (
        <div className={`flex min-h-screen ${isDarkMode ? "bg-[#0c111f] text-white" : "bg-gray-50 text-gray-900"}`}>
            <Sidebar activeId="history" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <main className="flex-1 flex overflow-hidden h-screen">
                {/* History List Sidebar (Internal Sidebar) */}
                <div className={`w-80 border-r flex flex-col ${isDarkMode ? "border-white/10 bg-[#161b2c]" : "border-gray-200 bg-white"}`}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">Execution History</h2>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Showing {history.length} records
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center animate-pulse">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No history found</div>
                        ) : (
                            history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`w-full text-left p-4 border-b transition-colors ${selectedItem?.id === item.id
                                            ? (isDarkMode ? "bg-[#2df4c6]/10 border-l-4 border-l-[#2df4c6]" : "bg-blue-50 border-l-4 border-l-blue-500")
                                            : (isDarkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50")
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold uppercase text-xs tracking-wider opacity-70">
                                            {item.action_type}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.status === "success"
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-red-500/20 text-red-400"
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="font-medium truncate">
                                        {item.input_params?.ticker || "Unknown"} - {item.input_params?.analysis_date}
                                    </div>
                                    <div className="text-xs opacity-50 mt-1">
                                        {format(new Date(item.timestamp), "MMM d, yyyy HH:mm:ss")}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area (Details) */}
                <div className="flex-1 overflow-y-auto p-8">
                    {selectedItem ? (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">History Detail</h1>
                                    <p className="opacity-60">ID: #{selectedItem.id} • {format(new Date(selectedItem.timestamp), "PPPP p")}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-full font-bold ${selectedItem.status === "success"
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}>
                                    {selectedItem.status.toUpperCase()}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1e2330] border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <span>📥</span> Input Parameters
                                    </h3>
                                    <pre className={`text-xs overflow-x-auto p-4 rounded-xl ${isDarkMode ? "bg-black/30" : "bg-gray-50"}`}>
                                        {JSON.stringify(selectedItem.input_params, null, 2)}
                                    </pre>
                                </div>

                                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1e2330] border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <span>🏁</span> Result Summary
                                    </h3>
                                    {selectedItem.status === "error" ? (
                                        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                                            <strong>Error Message:</strong>
                                            <p className="mt-2">{selectedItem.error_message}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <span className="opacity-60">Decision:</span>
                                                <span className="font-bold text-xl">{selectedItem.output_result?.decision}</span>
                                            </div>
                                            <div>
                                                <span className="opacity-60 block mb-2">Summary:</span>
                                                <p className="text-sm leading-relaxed">{selectedItem.output_result?.summary}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1e2330] border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>📄</span> Full JSON Output
                                </h3>
                                <pre className={`text-xs overflow-x-auto p-4 rounded-xl ${isDarkMode ? "bg-black/30" : "bg-gray-50"}`}>
                                    {JSON.stringify(selectedItem.output_result, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="text-6xl mb-4">📜</div>
                            <h2 className="text-2xl font-bold">Select an item from the sidebar</h2>
                            <p>To view the full execution details</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

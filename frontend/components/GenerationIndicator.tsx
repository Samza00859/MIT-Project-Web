"use client";

import React from "react";
import { useGeneration } from "../context/GenerationContext";
import { useRouter } from "next/navigation";

export default function GenerationIndicator() {
    const { isRunning, currentTicker, wsStatus, stopGeneration } = useGeneration();
    const router = useRouter();

    if (!isRunning) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                border: "1px solid rgba(99, 102, 241, 0.5)",
                borderRadius: "16px",
                padding: "16px 20px",
                boxShadow: "0 8px 32px rgba(99, 102, 241, 0.3)",
                zIndex: 9999,
                minWidth: "280px",
                backdropFilter: "blur(10px)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Animated Spinner */}
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            border: "2px solid rgba(99, 102, 241, 0.3)",
                            borderTop: "2px solid #6366f1",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    />
                    <span
                        style={{
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: "14px",
                        }}
                    >
                        Generating Analysis
                    </span>
                </div>

                {/* Connection Status */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background:
                                wsStatus === "connected"
                                    ? "#22c55e"
                                    : wsStatus === "connecting"
                                        ? "#f59e0b"
                                        : "#ef4444",
                            animation: wsStatus === "connected" ? "pulse 2s infinite" : "none",
                        }}
                    />
                    <span
                        style={{
                            color: "rgba(255, 255, 255, 0.6)",
                            fontSize: "11px",
                            textTransform: "capitalize",
                        }}
                    >
                        {wsStatus}
                    </span>
                </div>
            </div>

            {/* Ticker Info */}
            <div
                style={{
                    background: "rgba(99, 102, 241, 0.15)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "12px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px" }}>
                        Ticker
                    </span>
                    <span
                        style={{
                            color: "#a5b4fc",
                            fontWeight: "700",
                            fontSize: "16px",
                            letterSpacing: "0.5px",
                        }}
                    >
                        {currentTicker || "—"}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
                {/* View Progress Button */}
                <button
                    onClick={() => router.push("/")}
                    style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    View Progress
                </button>

                {/* Stop Button */}
                <button
                    onClick={stopGeneration}
                    style={{
                        padding: "10px 16px",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.5)",
                        borderRadius: "8px",
                        color: "#ef4444",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                        e.currentTarget.style.borderColor = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                    }}
                >
                    Stop
                </button>
            </div>

            {/* CSS Animation */}
            <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
        </div>
    );
}

"use client";
import React, { useEffect, useState } from 'react';

declare global {
    interface Window {
        onTelegramAuth?: (user: any) => void;
    }
}

interface TelegramConnectProps {
    variant?: "card" | "header-button";
}

export default function TelegramConnect({ variant = "card" }: TelegramConnectProps) {
    const [botName, setBotName] = useState("Stock_Price_error_bot");
    // const [isWidgetLoaded, setIsWidgetLoaded] = useState(false); // No longer needed as widget is removed
    const [status, setStatus] = useState<"idle" | "connected" | "error">("idle");
    const [user, setUser] = useState<any>(null);
    const [showConnect, setShowConnect] = useState(false); // Kept for card variant toggle
    const [currentChatId, setCurrentChatId] = useState("");
    const [isOpen, setIsOpen] = useState(false); // For modal variant

    // Determine API Base URL
    const getApiUrl = () => {
        if (typeof window !== "undefined" && window.location.hostname !== "" && window.location.protocol !== "file:") {
            const protocol = window.location.protocol;
            const host = window.location.hostname;
            return `${protocol}//${host}:8000`;
        }
        return "http://localhost:8000";
    };

    // Fetch initial status from backend
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/telegram/status`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.connected && data.chat_id) {
                        setStatus("connected");
                        setCurrentChatId(data.chat_id);
                    }
                    if (data.bot_name) {
                        setBotName(data.bot_name);
                    } else {
                        // Fallback to local storage if backend doesn't have it (e.g. no token)
                        const savedBot = localStorage.getItem("telegram_bot_name");
                        if (savedBot) setBotName(savedBot);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch telegram status", e);
            }
        };

        // Delay slightly to ensure backend is ready if just restarted
        // const timer = setTimeout(fetchStatus, 500); // Removed setTimeout
        // return () => clearTimeout(timer);
        fetchStatus();
    }, []);

    // Effect to load widget when botName is set - REMOVED, using one-click connect now
    // useEffect(() => {
    //     if (!botName || !showConnect || isWidgetLoaded) return;

    //     // Check if script already exists to avoid duplicates
    //     if (document.getElementById('telegram-widget-script')) {
    //         // If script exists but we want to re-render (e.g. different bot name), we might need to remove it?
    //         // But usually we just let it be.
    //         return;
    //     }

    //     const script = document.createElement('script');
    //     script.id = 'telegram-widget-script';
    //     script.src = "https://telegram.org/js/telegram-widget.js?22";
    //     script.setAttribute('data-telegram-login', botName);
    //     script.setAttribute('data-size', 'large');
    //     script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    //     script.setAttribute('data-request-access', 'write');
    //     script.async = true;

    //     // Wait until wrapper exists
    //     const tryMount = () => {
    //         const container = document.getElementById('telegram-login-wrapper');
    //         if (container) {
    //             container.innerHTML = ""; // Clear previous
    //             container.appendChild(script);
    //             setIsWidgetLoaded(true);
    //         } else {
    //             // Retry if not rendered yet
    //             setTimeout(tryMount, 100);
    //         }
    //     };
    //     tryMount();

    //     window.onTelegramAuth = async (userData: any) => {
    //         console.log("Telegram Auth:", userData);
    //         setUser(userData);

    //         // Send to backend
    //         try {
    //             const res = await fetch(`${getApiUrl()}/api/telegram/connect`, {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ chat_id: String(userData.id) })
    //             });

    //             if (res.ok) {
    //                 setStatus("connected");
    //                 setCurrentChatId(String(userData.id));
    //             } else {
    //                 setStatus("error");
    //             }
    //         } catch (e) {
    //             console.error(e);
    //             setStatus("error");
    //         }
    //     }

    //     return () => {
    //         // Cleanup global callback not strictly necessary if component stays mounted
    //     };
    // }, [botName, showConnect, isWidgetLoaded]);

    const handleSetBotName = () => {
        localStorage.setItem("telegram_bot_name", botName);
        // Trigger reload of widget area if needed - REMOVED
        // setIsWidgetLoaded(false);
        // const container = document.getElementById('telegram-login-wrapper');
        // if (container) container.innerHTML = "";
    };

    const handleReset = () => {
        // Disconnect locally
        // Ideally call backend to unset, but requirements only asked to "change" chat id.
        // We will just allow re-login.
        setStatus("idle");
        localStorage.removeItem("telegram_bot_name"); // Added this
        // setIsWidgetLoaded(false); // Removed
        // const container = document.getElementById('telegram-login-wrapper'); // Removed
        // if (container) container.innerHTML = ""; // Removed
    };


    const [isDetecting, setIsDetecting] = useState(false);
    const [detectMessage, setDetectMessage] = useState("");
    const [countdown, setCountdown] = useState(0);

    // One-click Connect Flow
    const handleConnectClick = () => {
        // Validation
        if (!botName) {
            setDetectMessage("Please enter a bot username first.");
            return;
        }

        // 1. Open Telegram in new tab
        const url = `https://t.me/${botName.replace('@', '')}?start=connect`;
        window.open(url, '_blank');

        // 2. Start polling for 60 seconds
        startPolling();
    };

    const startPolling = () => {
        setIsDetecting(true);
        setDetectMessage("Waiting for you to press 'Start' on Telegram...");
        setCountdown(60);

        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60s

        const pollInterval = setInterval(async () => {
            attempts++;
            setCountdown(prev => prev - 1);

            try {
                const res = await fetch(`${getApiUrl()}/api/telegram/detect`, {
                    method: 'POST'
                });
                const data = await res.json();

                if (res.ok && data.found) {
                    clearInterval(pollInterval);
                    setStatus("connected");
                    setCurrentChatId(data.chat_id);
                    setDetectMessage("Success! Connected to " + data.username);
                    setIsDetecting(false);
                    setCountdown(0);
                }
            } catch (e) {
                // Ignore errors during polling
            }

            if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setIsDetecting(false);
                setCountdown(0);
                setDetectMessage("Connection timed out. Please try again.");
            }
        }, 2000); // Poll every 2 seconds
    };

    // --- Content Renderer ---
    const renderContent = () => (
        <div className="flex flex-col gap-4">
            {status === "connected" ? (
                <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="font-bold">Connected Successfully</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500 mb-3 text-center">
                        Chat ID: <span className="font-mono bg-green-200 dark:bg-black/20 px-1 rounded">{currentChatId}</span>
                        <br />
                        <span className="text-xs opacity-70">Notifications enabled</span>
                    </p>
                    <button
                        onClick={handleReset}
                        className="text-xs text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 underline"
                    >
                        Change Account
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-full">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">1. Enter Bot Username</label>
                        <div className="flex gap-2 mb-1">
                            <input
                                type="text"
                                value={botName || "Stock_Price_error_bot"}
                                readOnly
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                            />
                            <div className="flex items-center justify-center p-2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-4">* Username of your bot from BotFather</p>

                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">2. Connect & Auto-Detect</label>
                        <button
                            onClick={handleConnectClick}
                            disabled={!botName || isDetecting}
                            className={`w-full text-white text-sm font-medium px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${isDetecting
                                ? 'bg-amber-500 cursor-wait'
                                : 'bg-[#24a1de] hover:bg-[#2095cf]'
                                }`}
                        >
                            {isDetecting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Listening... ({countdown}s)
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.4-.35 0-1.03-.2-1.54-.35-.62-.18-1.12-.28-1.08-.59.02-.16.24-.32.65-.49 2.56-1.11 4.27-1.85 5.13-2.2 2.44-1.01 2.95-1.18 3.28-1.18.07 0 .23.01.33.09.09.07.12.17.13.24 0 .04.01.07.01.12z" /></svg>
                                    Open Telegram & Connect
                                </>
                            )}
                        </button>

                        {isDetecting && (
                            <p className="text-xs text-center text-amber-600 mt-2 animate-pulse">
                                Checking for connection... Press <b>START</b> in the Telegram window.
                            </p>
                        )}

                        {detectMessage && !isDetecting && (
                            <p className={`text-xs mt-3 text-center ${detectMessage.includes("Success") ? "text-green-600" : "text-amber-600"}`}>
                                {detectMessage}
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    // --- Header Button Variant ---
    if (variant === "header-button") {
        return (
            <>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 cursor-pointer rounded-full bg-[#24a1de] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#2095cf] shadow-sm hover:shadow-md"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.4-.35 0-1.03-.2-1.54-.35-.62-.18-1.12-.28-1.08-.59.02-.16.24-.32.65-.49 2.56-1.11 4.27-1.85 5.13-2.2 2.44-1.01 2.95-1.18 3.28-1.18.07 0 .23.01.33.09.09.07.12.17.13.24 0 .04.01.07.01.12z" /></svg>
                    Send to Telegram
                </button>

                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Telegram Notifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Receive real-time trading updates directly to your chat.</p>

                            {renderContent()}
                        </div>
                    </div>
                )}
            </>
        );
    }

    // --- Default Card Variant ---
    return (
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${showConnect ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Telegram Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive real-time trading updates</p>
                    </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showConnect} onChange={(e) => setShowConnect(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {showConnect && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
                    {renderContent()}
                </div>
            )}
        </div>
    );
}

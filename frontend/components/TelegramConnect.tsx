"use client";
import React, { useEffect, useState } from 'react';
import { buildApiUrl, mapFetchError } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

declare global {
    interface Window {
        onTelegramAuth?: (user: any) => void;
    }
}

interface TelegramData {
    key: string;
    label: string;
    text: string;
}

interface TelegramConnectProps {
    variant?: "card" | "header-button";
    data?: TelegramData[];
}

const TRANSLATIONS = {
    en: {
        connectToTelegram: "Connect to Telegram",
        sendToTelegram: "Send to Telegram",
        title: "Telegram Notifications",
        subtitle: "Receive real-time trading updates",
        connected: "Connected Successfully",
        changeAccount: "Change Account",
        enterBot: "1. Enter Bot Username",
        connect: "2. Connect & Auto-Detect",
        openAndConnect: "Open Telegram & Connect",
        listening: "Listening...",
        checking: "Checking for connection... Press START in the Telegram window.",
        botDesc: "* Username of your bot from BotFather",
        notificationsEnabled: "Notifications enabled",
        successPrefix: "Success! Connected to ",
        timeout: "Connection timed out. Please try again.",
        waitMessage: "Waiting for you to press 'Start' on Telegram...",
        enterBotFirst: "Please enter a bot username first."
    },
    th: {
        connectToTelegram: "เชื่อมต่อกับ Telegram",
        sendToTelegram: "ส่งเข้า Telegram",
        title: "การแจ้งเตือน Telegram",
        subtitle: "รับข้อมูลการเทรดแบบเรียลไทม์",
        connected: "เชื่อมต่อสำเร็จ",
        changeAccount: "เปลี่ยนบัญชี",
        enterBot: "1. ใส่ชื่อบอท (Bot ID)",
        connect: "2. เชื่อมต่อและค้นหาอัตโนมัติ",
        openAndConnect: "เปิด Telegram และเชื่อมต่อ",
        listening: "กำลังรอ...",
        checking: "กำลังตรวจสอบการเชื่อมต่อ... กด START ในหน้า Telegram",
        botDesc: "* ชื่อผู้ใช้บอทของคุณจาก BotFather",
        notificationsEnabled: "เปิดการแจ้งเตือนอยู่",
        successPrefix: "สำเร็จ! เชื่อมต่อกับ ",
        timeout: "หมดเวลาเชื่อมต่อ กรุณาลองใหม่",
        waitMessage: "กำลังรอให้คุณกด 'Start' บน Telegram...",
        enterBotFirst: "กรุณาระบุชื่อบอทก่อน"
    }
};

export default function TelegramConnect({
    variant = "card",
    data = []
}: TelegramConnectProps) {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    const [botName, setBotName] = useState("Stock_Price_error_bot");
    // const [isWidgetLoaded, setIsWidgetLoaded] = useState(false); // No longer needed as widget is removed
    const [status, setStatus] = useState<"idle" | "connected" | "error">("idle");
    const [user, setUser] = useState<any>(null);
    const [showConnect, setShowConnect] = useState(false); // Kept for card variant toggle
    const [currentChatId, setCurrentChatId] = useState("");
    const [isOpen, setIsOpen] = useState(false); // For modal variant
    const [isSending, setIsSending] = useState(false);

    console.log("data : ", data.at(-1)?.text);

    const formatElegantReport = (text: string) => {
    // 1. แยกประโยคออกจากกันด้วยจุด (Period) เพื่อจัดระเบียบใหม่
    const sentences = text.split('. ').filter(s => s.trim() !== "");
    
    // 2. ประโยคแรกมักจะเป็น "สรุปผล" ให้ทำเป็นตัวหนาและมี Emoji
    let formatted = `🎯 <b>Summary:</b>\n${sentences[0]}.\n\n`;

    // 3. ประโยคที่เหลือให้จัดเป็น Bullet Points เพื่อให้อ่านง่ายขึ้น
    formatted += `📝 <b>Details:</b>\n`;
    const details = sentences.slice(1).map(s => {
        let line = s.trim();
        // ถ้าเจอตัวเลขราคา $ ให้ทำเป็น Code Tag (กดก๊อปปี้ได้)
        line = line.replace(/(\$\d+(\.\d{1,2})?)/g, "<code>$1</code>");
        // ใส่ Emoji หน้าคีย์เวิร์ดสำคัญ
        if (line.includes("stop-loss")) line = "🛑 " + line;
        if (line.includes("profit-taking")) line = "💰 " + line;
        if (line.includes("monitoring") || line.includes("war")) line = "⚠️ " + line;
        
        return `• ${line}${line.endsWith('.') ? '' : '.'}`;
    }).join('\n');

    return formatted + details;
};
    const handleSendData = async (chatIdToUse?: string) => {
        const targetChatId = chatIdToUse || currentChatId;
        
        if (!targetChatId || data.length === 0) {
            setIsOpen(true);
            return;
        }

        setIsSending(true);
        try {
            const formattedMessage =data.at(-1)?.text || ""
            const res = await fetch(buildApiUrl("/api/telegram/send"), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    message: formattedMessage,
                    parse_mode: "HTML"
                })
            });

            if (res.ok) {
                alert(t.sendToTelegram + " Success!");
                setIsOpen(false); // ปิด modal ทันทีที่ส่งสำเร็จ
            }
        } catch (e) {
            console.error("Send failed", e);
        } finally {
            setIsSending(false);
        }
    };

    // Fetch initial status from backend
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(buildApiUrl("/api/telegram/status"));
                if (res.ok) {
                    const data = await res.json();
                    console.log("Fetched telegram status:", data);

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
                console.error("Failed to fetch telegram status", e, mapFetchError(e, "/api/telegram/status"));
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

            if (status === "connected") {
            handleSendData();
            return;
        }

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
        setDetectMessage("Waiting for 'Start' on Telegram...");
        setCountdown(10);

        let attempts = 0;
        const maxAttempts = 5;
        const startTime = Date.now() / 1000;

        const pollInterval = setInterval(async () => {
            attempts++;
            setCountdown(prev => prev - 1);

            try {
                const res = await fetch(buildApiUrl("/api/telegram/detect"), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ start_time: startTime })
                });
                const result = await res.json();
                
                if (res.ok && result.found) {
                    clearInterval(pollInterval);
                    setStatus("connected");
                    setCurrentChatId(result.chat_id);
                    setIsDetecting(false);
                    
                    // *** จุดสำคัญ: ส่งข้อมูลทันทีเมื่อเชื่อมต่อสำเร็จ ***
                    if (data && data.length > 0) {
                        setDetectMessage("Connected! Sending report...");
                        // ส่ง chatId ที่เพิ่งได้รับมาเข้าไปในฟังก์ชันส่งโดยตรง
                        handleSendData(result.chat_id); 
                    }
                }
            } catch (e) {
                setDetectMessage("Connection error. Please try again.");
            }

            if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setIsDetecting(false);
                setDetectMessage("Timed out. Please try again.");
            }
        }, 2000);
    };

    // --- Content Renderer ---
    const renderContent = () => (
        <div className="flex flex-col gap-3 sm:gap-4">
            {status === "connected" ? (
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="font-bold text-sm sm:text-base">{t.connected}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-500 mb-2 sm:mb-3 text-center">
                        Chat ID: <span className="font-mono bg-green-200 dark:bg-black/20 px-1 rounded">{currentChatId}</span>
                        <br />
                        <span className="text-[10px] sm:text-xs opacity-70">{t.notificationsEnabled}</span>
                    </p>
                    <button
                        onClick={handleReset}
                        className="text-[10px] sm:text-xs text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 underline"
                    >
                        {t.changeAccount}
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-full">
                        <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 block">{t.enterBot}</label>
                        <div className="flex gap-2 mb-1">
                            <input
                                type="text"
                                value={botName || "Stock_Price_error_bot"}
                                readOnly
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                            />
                            <div className="flex items-center justify-center p-1.5 sm:p-2 text-green-500">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 mb-3 sm:mb-4">{t.botDesc}</p>

                        <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 block">{t.connect}</label>
                        <button
                            onClick={handleConnectClick}
                            disabled={!botName || isDetecting}
                            className={`w-full text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${isDetecting
                                ? 'bg-amber-500 cursor-wait'
                                : 'bg-[#24a1de] hover:bg-[#2095cf]'
                                }`}
                        >
                            {isDetecting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {t.listening} ({countdown}s)
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.4-.35 0-1.03-.2-1.54-.35-.62-.18-1.12-.28-1.08-.59.02-.16.24-.32.65-.49 2.56-1.11 4.27-1.85 5.13-2.2 2.44-1.01 2.95-1.18 3.28-1.18.07 0 .23.01.33.09.09.07.12.17.13.24 0 .04.01.07.01.12z" /></svg>
                                    {t.openAndConnect}
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
                    onClick={() => {
                        if (status === "connected" && data && data.length > 0) {
                            handleSendData();
                        } else {
                            setIsOpen(true);
                        }
                    }}
                    disabled={isSending}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer rounded-full p-2 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold text-white transition-all shadow-sm hover:shadow-md ${isSending ? 'bg-gray-400 cursor-wait' : 'bg-[#24a1de] hover:bg-[#2095cf]'}`}
                >
                    {isSending ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="hidden sm:inline">Sending...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.4-.35 0-1.03-.2-1.54-.35-.62-.18-1.12-.28-1.08-.59.02-.16.24-.32.65-.49 2.56-1.11 4.27-1.85 5.13-2.2 2.44-1.01 2.95-1.18 3.28-1.18.07 0 .23.01.33.09.09.07.12.17.13.24 0 .04.01.07.01.12z" /></svg>
                            <span className="hidden sm:inline">{data?.length ? t.sendToTelegram : t.connectToTelegram}</span>
                        </>
                    )}
                </button>

                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                        <div className="relative w-full max-w-[320px] sm:max-w-md max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <h3 className="text-base sm:text-xl font-bold mb-1 text-gray-900 dark:text-white">{t.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-6">{t.subtitle}</p>

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

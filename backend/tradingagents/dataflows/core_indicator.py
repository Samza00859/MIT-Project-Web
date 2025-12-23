import os
import sys
import pandas as pd
import requests
from typing import Annotated
from datetime import datetime
from langchain_core.tools import tool
import concurrent.futures
import time

# --- Import Provider Functions (ตรวจสอบ Path ให้ถูกต้อง) ---
from tradingagents.dataflows.y_finance import get_stock_stats_indicators_window
from tradingagents.dataflows.alpha_vantage_indicator import get_indicator
from tradingagents.dataflows.trading_view import get_tradingview_indicators

# ==========================================
# Helper Functions
# ==========================================

def compute_core_indicator_score(data_yf, data_av, data_tv, indicator, tolerance=0.01):
    """
    Compare data from different providers and score their similarity.
    """
    dict_yf, dict_av, dict_tv = {}, {}, {}

    # 1. Parse Yahoo Finance Data (list of tuples: (date_str, value))
    if data_yf:
        try:
            dict_yf = {str(d): float(v) for d, v in data_yf if v is not None}
        except Exception: pass

    # 2. Parse Alpha Vantage Data (list of tuples: (datetime_obj, value))
    if data_av:
        try:
            dict_av = {dt.strftime('%Y-%m-%d'): float(v) for dt, v in data_av if v is not None}
        except Exception: pass

    # 3. Parse TradingView Data (DataFrame)
    if isinstance(data_tv, pd.DataFrame) and not data_tv.empty:
        try:
            # ตรวจสอบว่ามี column datetime และ indicator ที่ต้องการไหม
            if 'datetime' in data_tv.columns and indicator in data_tv.columns:
                for _, row in data_tv.iterrows():
                    if pd.notna(row[indicator]):
                        dt_str = row['datetime'].strftime('%Y-%m-%d') if hasattr(row['datetime'], 'strftime') else str(row['datetime'])[:10]
                        dict_tv[dt_str] = float(row[indicator])
        except Exception: pass

    # Find intersection of dates (เฉพาะวันที่ที่มีข้อมูลครบอย่างน้อย 2 เจ้าถึงจะเทียบได้)
    all_dates = set(dict_yf.keys()) | set(dict_av.keys()) | set(dict_tv.keys())
    
    scores = {'yahoo': 0, 'alpha': 0, 'tv': 0}

    for date in sorted(all_dates):
        vals = {
            'yahoo': dict_yf.get(date), 
            'alpha': dict_av.get(date), 
            'tv': dict_tv.get(date)
        }
        
        # เปรียบเทียบทีละคู่ (เฉพาะคู่ที่มีค่าทั้งสองฝั่ง)
        pairs = [('yahoo', 'alpha'), ('yahoo', 'tv'), ('alpha', 'tv')]
        
        for src1, src2 in pairs:
            v1, v2 = vals[src1], vals[src2]
            if v1 is not None and v2 is not None:
                try:
                    # คำนวณความต่างสัมพัทธ์
                    diff = abs(v1 - v2)
                    denom = max(abs(v1), abs(v2))
                    if denom == 0: # กันหารด้วยศูนย์ (กรณีค่าเป็น 0 ทั้งคู่)
                        if diff == 0:
                            scores[src1] += 1
                            scores[src2] += 1
                    elif (diff / denom) <= tolerance:
                        scores[src1] += 1
                        scores[src2] += 1
                except Exception: pass

    # เลือก source ที่คะแนนสูงสุด
    max_score = max(scores.values()) if scores else 0
    best_sources = [k for k, v in scores.items() if v == max_score]
    
    # Fallback: ถ้าคะแนนเป็น 0 หมด ให้เลือกเจ้าที่มีข้อมูลเยอะสุด
    if max_score == 0:
        counts = {'yahoo': len(dict_yf), 'alpha': len(dict_av), 'tv': len(dict_tv)}
        max_count = max(counts.values())
        if max_count > 0:
            best_sources = [k for k, v in counts.items() if v == max_count]
        else:
            best_sources = ['alpha'] # Default สุดท้ายถ้าไม่มีข้อมูลเลย

    return scores, best_sources

import yfinance as yf

# --- 1. นักสืบหาตลาด (Auto-Detect) ---
def auto_detect_market(symbol: str) -> str:
    symbol = symbol.upper().strip()
    
    # ทองคำ/Forex
    if symbol in ["GOLD", "XAUUSD", "GC=F", "XAU/USD"]: return "GOLD"
    
    # หุ้นจีน/ฮ่องกง (ตัวเลข)
    if symbol.isdigit():
        if len(symbol) <= 5: return "HK" # ฮ่องกง
        return "CN" # จีนแผ่นดินใหญ่
        
    # หุ้นไทย (เช็ค YF เร็วๆ)
    try:
        if yf.Ticker(f"{symbol}.BK").fast_info.market_cap is not None: return "TH"
    except: pass

    return "US" # Default

# --- 2. ตัวแปลงรหัสให้ตรงแต่ละค่าย (Resolver) ---
def resolve_symbol_for_indicators(symbol: str, market: str):
    symbol = symbol.upper().strip()
    
    # Default = US Stocks
    mapping = {
        "yfinance": symbol,
        "alphavantage": symbol,
        "tradingview": symbol 
    }

    if market == "TH":
        clean = symbol.replace(".BK", "")
        mapping["yfinance"] = f"{clean}.BK"
        mapping["alphavantage"] = f"{clean}.BK" # AlphaVantage รองรับ .BK
        mapping["tradingview"] = f"SET:{clean}"

    elif market == "CN":
        # จีน: ต้องแยก Shanghai (6xxxx) / Shenzhen (0xxxx/3xxxx)
        # Yahoo ใช้ .SS/.SZ
        # AlphaVantage ใช้ .SH/.SZ
        suffix_yf = ".SS" if symbol.startswith("6") else ".SZ"
        suffix_av = ".SH" if symbol.startswith("6") else ".SZ" # AV บางทีใช้ SH สำหรับ Shanghai
        
        mapping["yfinance"] = f"{symbol}{suffix_yf}"
        mapping["alphavantage"] = f"{symbol}{suffix_av}"
        
        prefix_tv = "SSE" if symbol.startswith("6") else "SZSE"
        mapping["tradingview"] = f"{prefix_tv}:{symbol}"

    elif market == "HK":
        clean = symbol.replace(".HK", "").zfill(4) # เติม 0 ให้ครบ 4 หลัก
        mapping["yfinance"] = f"{clean}.HK"
        mapping["alphavantage"] = f"{clean}.HK"
        mapping["tradingview"] = f"HKEX:{int(clean)}" # TV ไม่เอาเลข 0 นำหน้า

    elif market == "GOLD":
        # ทองคำ ความยากคือ AV กับ YF ใช้คนละตัว
        mapping["yfinance"] = "GC=F"       # Gold Futures
        mapping["alphavantage"] = "XAUUSD" # Spot Gold (Forex) แม่นกว่าสำหรับ Indicator
        mapping["tradingview"] = "OANDA:XAUUSD"

    return mapping

def sent_to_telegram(report_message):
    """Send comparison result to Telegram bot."""
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    
    if not TOKEN or not CHAT_ID:
        return

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {
        "chat_id": CHAT_ID,
        "text": report_message
    }

    # write text file
    with open("all_report_message.txt", "a", encoding='utf-8') as file:
        file.write(report_message + "\n")

    # try:
    #     requests.post(url, data=data, timeout=5)
    # except Exception as e:
    #     print(f"Telegram Error: {e}")

# ==========================================
# ✅ MAIN TOOL DEFINITION
# ==========================================

# @tool
def get_indicators(
    symbol: str,
    indicator: str,
    curr_date: str,
    look_back_days: int,
    market: str = None
) -> str:
    """
    Retrieve technical indicators for a given ticker symbol.
    
    This tool compares indicator values from multiple providers (Yahoo, Alpha Vantage, TradingView)
    to ensure accuracy and returns the most reliable dataset.
    
    Args:
        symbol (str): Ticker symbol (e.g., AAPL).
        indicator (str): Indicator code (e.g., 'rsi', 'macd', 'sma').
        curr_date (str): The current date for analysis (YYYY-MM-DD).
        look_back_days (int): Number of past days to retrieve data for.
        
    Returns:
        str: A formatted string containing the indicator data.
    """
    
    # 1. Auto-Detect Market (ถ้าไม่ได้ส่งมา)
    if not market:
        market = auto_detect_market(symbol)

    # 2. Resolve Symbol ให้ตรงกับแต่ละเจ้า
    tickers = resolve_symbol_for_indicators(symbol, market)

    print(f"\n🚀 Fetching Indicator '{indicator}' for {symbol} (Market: {market})...")
    print(f"   [Target Tickers] YF: {tickers['yfinance']}, AV: {tickers['alphavantage']}, TV: {tickers['tradingview']}")

    # --- 3. Fetch Data (ส่ง Ticker ที่ถูกต้องไป) ---
    
    # YFinance
    result_str_yf, data_yf = "", []
    try:
        # ส่ง tickers['yfinance'] แทน symbol เดิม
        result_str_yf, data_yf = get_stock_stats_indicators_window(
            tickers['yfinance'], indicator, curr_date, look_back_days
        )
    except Exception as e:
        print(f"⚠️ Yahoo Finance Error: {e}")

    # Alpha Vantage
    result_str_av, data_av = "", []
    try:
        # ส่ง tickers['alphavantage']
        # หมายเหตุ: สำหรับทองคำ (XAUUSD) ใน Alpha Vantage อาจต้องเรียกฟังก์ชันแยกถ้า library คุณแยก endpoint
        # แต่ถ้าใช้ฟังก์ชันมาตรฐานที่เรียก TIME_SERIES_DAILY มันอาจจะไม่เจอ XAUUSD
        # ถ้าโค้ด get_indicator ของคุณรองรับ FX_DAILY จะดีมาก
        result_str_av, data_av = get_indicator(
            tickers['alphavantage'], indicator, curr_date, look_back_days
        )
    except Exception as e:
        print(f"⚠️ Alpha Vantage Error: {e}")

    # TradingView
    result_str_tv, data_tv = "", pd.DataFrame()
    try:
        # ส่ง tickers['tradingview']
        result_str_tv, data_tv = get_tradingview_indicators(
            tickers['tradingview'], indicator, curr_date, look_back_days
        )
    except Exception as e:
        print(f"⚠️ TradingView Error: {e}")

    # --- 4. Compute Scores (เหมือนเดิม) ---
    # หมายเหตุ: ทองคำราคา Future กับ Spot อาจต่างกันเล็กน้อย 
    # คุณอาจต้องปรับ tolerance เพิ่มขึ้นถ้า market == "GOLD"
    current_tolerance = 0.05 if market == "GOLD" else 0.01

    scores, best_sources = compute_core_indicator_score(
        data_yf=data_yf,
        data_av=data_av,
        data_tv=data_tv,
        indicator=indicator,
        tolerance=current_tolerance # ปรับความยืดหยุ่นตามสินทรัพย์
    )

    print(f"   Scores: {scores} => Best: {best_sources}")

    # --- 5. Report & Return (เหมือนเดิม) ---
    report_message = (
        f"📊 Indicator '{indicator}' Source Comparison for {symbol} ({market}):\n"
        f"Yahoo ({tickers['yfinance']}): {scores.get('yahoo', 0)}\n"
        f"AlphaV ({tickers['alphavantage']}): {scores.get('alpha', 0)}\n"
        f"TradingView ({tickers['tradingview']}): {scores.get('tv', 0)}\n"
        f"🏆 Best: {', '.join([s.upper() for s in best_sources])}\n"
    )
    # sent_to_telegram(report_message) # Uncomment ถ้าต้องการส่ง

    # Priority Logic
    if 'alpha' in best_sources and result_str_av: return result_str_av
    elif 'yahoo' in best_sources and result_str_yf: return result_str_yf
    elif 'tv' in best_sources and result_str_tv: return result_str_tv
    
    # Fallback
    if result_str_av: return result_str_av
    if result_str_yf: return result_str_yf
    if result_str_tv: return result_str_tv
    
    return f"No data found for indicator {indicator}"

def get_all_indicators_batch(symbol: str, curr_date: str, look_back_days: int = 7) -> str:
    """
    Fetch all key indicators in parallel using ThreadPoolExecutor.
    """
    # List of key indicators corresponding to the Market Analyst's needs
    indicators_list = [
        "close_50_sma", "close_200_sma", "close_10_ema",
        "macd", "rsi", "boll", "atr", "vwma"
    ]
    
    results = {}
    
    def fetch_one(ind):
        try:
            # Safety delay to prevent IP blocking / Rate Limiting
            time.sleep(2)
            # Call the existing tool function directly
            return get_indicators(symbol=symbol, indicator=ind, curr_date=curr_date, look_back_days=look_back_days)
        except Exception as e:
            return f"Error fetching {ind}: {e}"

    print(f"\n🚀🚀 Batch Fetching {len(indicators_list)} Indicators for {symbol}...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_ind = {executor.submit(fetch_one, ind): ind for ind in indicators_list}
        for future in concurrent.futures.as_completed(future_to_ind):
            ind = future_to_ind[future]
            try:
                data = future.result()
                # Clean up the output slightly if it contains long strings
                results[ind] = data.strip()
            except Exception as e:
                results[ind] = f"Error: {e}"

    # Format Output as a consolidated string
    output_lines = []
    output_lines.append(f"=== BATCH INDICATOR REPORT FOR {symbol} ===")
    for ind in indicators_list: # Preserve order
        val = results.get(ind, "N/A")
        output_lines.append(f"--- {ind.upper()} ---")
        output_lines.append(val)
        output_lines.append("") # Empty line separator
    
    return "\n".join(output_lines)
import os
import sys
import pandas as pd
import io
import re
import requests
from langchain_core.tools import tool
from typing import Annotated

# --- Import Provider Functions ---
# ตรวจสอบ Path ให้ตรงกับโปรเจกต์ของคุณ
from tradingagents.dataflows.y_finance import get_YFin_data_online
from tradingagents.dataflows.alpha_vantage_stock import get_alpha_vantage_stock
from tradingagents.dataflows.trading_view import get_TV_data_online
from tradingagents.dataflows.twelve_data import get_twelvedata_stock

# ==========================================
# Helper Functions
# ==========================================

def to_df(csv_string: str) -> pd.DataFrame:
    """Convert CSV string to pandas DataFrame."""
    if not csv_string or csv_string.strip() == "":
        return pd.DataFrame()
    try:
        return pd.read_csv(io.StringIO(csv_string))
    except Exception:
        return pd.DataFrame()

def extract_record_count(header: str) -> int:
    """Extract 'Total records: XXX' from header."""
    if not header:
        return 0
    match = re.search(r"Total records:\s*(\d+)", header)
    if match:
        return int(match.group(1))
    return 0

def sent_to_telegram(report_message, score: dict, best_source: str):
    """Send comparison result to Telegram bot."""
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    
    if not TOKEN or not CHAT_ID:
        return

    MESSAGE = (f"🏷️ Stock Data Source Comparison Result:\n\n"
               f"{report_message}\n"
               f"===== SIMILARITY SCORE =====\n"
               f"YFinance Score: {score.get('yfinance', 0)}\n"
               f"TwelveData Score: {score.get('twelvedata', 0)}\n"
               f"TradingView Score: {score.get('tradingview', 0)}\n\n"
               f"🏆 Best Source: {best_source.upper()}")
    
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {
        "chat_id": CHAT_ID,
        "text": MESSAGE
    }

    # write text file
    with open("all_report_message.txt", "w", encoding='utf-8') as file:
        file.write(MESSAGE + "\n\n")

    # try:
    #     requests.post(url, data=data, timeout=5)
    # except Exception as e:
    #     print(f"Telegram Error: {e}")

# ==========================================
# Core Logic: Compare Providers
# ==========================================

def resolve_symbol(symbol, market="US"):
    symbol = symbol.upper().strip()
    
    mapping = {
        "yfinance": symbol,
        "twelvedata": symbol,
        "tradingview": symbol,
        "market_type": "stock"
    }

    # --- ตลาดฮ่องกง (HK) ---
    if market == "HK":
        # ถ้า User พิมพ์ 0700.HK มาแล้ว ให้ลบ .HK ออกก่อนเพื่อ process ง่ายๆ
        raw_code = symbol.replace(".HK", "")
        
        # YFinance: ต้องมี 4 หลัก + .HK (เช่น 0700.HK)
        yf_code = raw_code.zfill(4)
        mapping["yfinance"] = f"{yf_code}.HK"
        
        # TradingView: ปกติใช้รหัสเลขได้เลย หรือ HKEX:รหัส
        # ตัดเลข 0 นำหน้าออกสำหรับ TradingView (บางที 0700 ต้องใช้ 700)
        tv_code = str(int(raw_code)) 
        mapping["tradingview"] = f"HKEX:{tv_code}"
        
        # TwelveData: ใช้รหัสเลข 4 หลัก
        mapping["twelvedata"] = raw_code.zfill(4)

    # --- ตลาดจีนแผ่นดินใหญ่ (CN) ---
    elif market == "CN":
        # ถ้ามี suffix มาแล้ว (.SS/.SZ)
        if "." in symbol:
            mapping["yfinance"] = symbol
            # แปลง suffix เป็น prefix สำหรับ TV
            code, suffix = symbol.split(".")
            exchange = "SSE" if suffix == "SS" else "SZSE"
            mapping["tradingview"] = f"{exchange}:{code}"
        else:
            # เดาจากเลข
            suffix = ".SS" if symbol.startswith("6") else ".SZ"
            mapping["yfinance"] = f"{symbol}{suffix}"
            prefix = "SSE" if symbol.startswith("6") else "SZSE"
            mapping["tradingview"] = f"{prefix}:{symbol}"

    # --- ตลาดไทย (TH) ---
    elif market == "TH":
        raw_code = symbol.replace(".BK", "")
        mapping["yfinance"] = f"{raw_code}.BK"
        mapping["tradingview"] = f"SET:{raw_code}"
        mapping["twelvedata"] = raw_code

    # --- ตลาดทอง (GOLD) ---
    elif market == "GOLD":
        mapping["market_type"] = "commodities"
        mapping["yfinance"] = "GC=F"
        mapping["twelvedata"] = "XAU/USD"
        mapping["tradingview"] = "OANDA:XAUUSD"

    return mapping

import yfinance as yf

def _check_ticker_exists(symbol):
    try:
        t = yf.Ticker(symbol)
        # เช็ก history 1 วัน ชัวร์กว่า fast_info
        hist = t.history(period="5d") # เอา 5 วันเผื่อติดวันหยุด
        return not hist.empty
    except:
        return False

def auto_detect_market(symbol):
    symbol = symbol.upper().strip()
    print(f"🕵️ Checking market for: {symbol} ...")

    # 1. เช็ก Suffix ที่ User ใส่มาเอง (Trust User)
    if symbol.endswith(".HK"): return "HK"  # ฮ่องกง
    if symbol.endswith(".BK"): return "TH"  # ไทย
    if symbol.endswith(".SS"): return "CN"  # จีน (Shanghai)
    if symbol.endswith(".SZ"): return "CN"  # จีน (Shenzhen)

    # 2. เช็กทองคำ
    if symbol in ["GOLD", "XAUUSD", "GC=F", "XAU/USD"]: return "GOLD"

    # 3. เช็กตัวเลข (หุ้นจีน / ฮ่องกง)
    if symbol.isdigit():
        # -- ฮ่องกง (HK) --
        # หุ้นฮ่องกงมักมี 1-5 หลัก (เช่น 700, 9988)
        # ลองเติม 0 ข้างหน้าให้ครบ 4 หลัก (ตาม format Yahoo)
        hk_code = symbol.zfill(4)
        if _check_ticker_exists(f"{hk_code}.HK"):
            print(f"   👉 Found: Hong Kong Stock (.HK)")
            return "HK"
            
        # -- จีนแผ่นดินใหญ่ (CN) --
        # หุ้นจีนมักมี 6 หลัก
        if len(symbol) == 6:
            if symbol.startswith("6") and _check_ticker_exists(f"{symbol}.SS"):
                print(f"   👉 Found: China Shanghai (.SS)")
                return "CN"
            if _check_ticker_exists(f"{symbol}.SZ"):
                print(f"   👉 Found: China Shenzhen (.SZ)")
                return "CN"

    # 4. เช็ก US / Global (เช่น BABA, AAPL, TSLA)
    # BABA จะตกมาที่นี่
    if _check_ticker_exists(symbol):
        print(f"   👉 Found: US/Global Stock")
        return "US"

    # 5. Fallback: ลองเช็กตลาดไทย (.BK) กรณีไม่ได้ใส่ suffix
    # เช่น user พิมพ์ "KBANK" แล้วหาใน US ไม่เจอ
    if _check_ticker_exists(f"{symbol}.BK"):
        print(f"   👉 Found: Thai Stock (.BK)")
        return "TH"

    print(f"   ⚠️ Not found, defaulting to US")
    return "US"

# เพิ่ม parameter market="US" เป็นค่าเริ่มต้น
def compare_stock_providers(symbol, start_date, end_date, market=None):

    if market is None:
        market = auto_detect_market(symbol)
    
    # ✅ 1. Resolve Symbol ก่อนเริ่มงาน
    tickers = resolve_symbol(symbol, market)
    
    print(f"\n🚀 Fetching & Comparing Data for {symbol} ({market}) - {start_date} to {end_date}...")
    print(f"   ► YFinance: {tickers['yfinance']}")
    print(f"   ► TwelveData: {tickers['twelvedata']}")
    print(f"   ► TradingView: {tickers['tradingview']}")

    raw_data = {
        "yfinance": {"header": "", "csv": "", "count": 0},
        "twelvedata": {"header": "", "csv": "", "count": 0},
        "tradingview": {"header": "", "csv": "", "count": 0},
    }

    # --- 2. Call Each Provider (Using Specific Tickers) ---
    
    # YFinance
    try:
        # ส่ง tickers["yfinance"] แทน symbol เดิม
        h, c = get_YFin_data_online(tickers["yfinance"], start_date, end_date)
        raw_data["yfinance"] = {"header": h, "csv": c, "count": extract_record_count(h)}
    except Exception as e:
        print(f"⚠️ YFinance Failed: {e}")

    # TwelveData
    try:
        # หมายเหตุ: TwelveData อาจต้องแก้ฟังก์ชัน get_twelvedata ให้รับ exchange parameter เพิ่มถ้าเป็นหุ้นไทย
        h, c = get_twelvedata_stock(tickers["twelvedata"], start_date, end_date)
        raw_data["twelvedata"] = {"header": h, "csv": c, "count": extract_record_count(h)}
    except Exception as e:
        print(f"⚠️ TwelveData Failed: {e}")

    # TradingView
    try:
        h, c = get_TV_data_online(tickers["tradingview"], start_date, end_date)
        raw_data["tradingview"] = {"header": h, "csv": c, "count": extract_record_count(h)}
    except Exception as e:
        print(f"⚠️ TradingView Failed: {e}")

    # --- 3. Convert & Pre-process (เหมือนเดิม) ---
    df_yf = to_df(raw_data["yfinance"]["csv"])
    df_tw = to_df(raw_data["twelvedata"]["csv"])
    df_tv = to_df(raw_data["tradingview"]["csv"])

    if not df_yf.empty: df_yf["Date"] = pd.to_datetime(df_yf["Date"])
    if not df_tw.empty: df_tw["Date"] = pd.to_datetime(df_tw["Date"])
    if not df_tv.empty: df_tv["Date"] = pd.to_datetime(df_tv["Date"])

    # --- 4. Report Message ---
    report_message = f"===== TOTAL RECORDS CHECK ({symbol} - {market}) =====\n"
    report_message += f"YFinance ({tickers['yfinance']}):      {raw_data['yfinance']['count']}\n"
    report_message += f"TwelveData ({tickers['twelvedata']}):    {raw_data['twelvedata']['count']}\n"
    report_message += f"TradingView ({tickers['tradingview']}):   {raw_data['tradingview']['count']}\n\n"

    if df_yf.empty and df_tw.empty and df_tv.empty:
        return f"# Error: No data found for {symbol}.\n", ""

    # --- 5. Scoring (ปรับปรุง Logic ทองคำ) ---
    score = {"yfinance": 0, "twelvedata": 0, "tradingview": 0}
    compare_cols = ["Open", "Close"]
    
    # หมายเหตุสำหรับทองคำ: ราคาทองแต่ละเจ้าอาจต่างกันเล็กน้อย (Futures vs Spot) 
    # อาจต้องปรับ round(2) เป็น round(0) หรือ round(1) ถ้าเป็นทองคำเพื่อให้ match ง่ายขึ้น
    rounding = 1 if market == "GOLD" else 2 

    def calculate_match(df1, df2, suffix1, suffix2):
        if df1.empty or df2.empty: return 0
        try:
            merged = df1.merge(df2, on="Date", suffixes=(suffix1, suffix2), how="inner")
            if merged.empty: return 0
            
            total_matches = 0
            for col in compare_cols:
                # ใช้ rounding dynamic ตามประเภทสินทรัพย์
                c1 = merged[f"{col}{suffix1}"].round(rounding)
                c2 = merged[f"{col}{suffix2}"].round(rounding)
                
                # สำหรับทองคำ ยอมให้ต่างกันได้นิดหน่อย (Tolerance)
                if market == "GOLD":
                     # ยอมให้ต่างกันไม่เกิน 0.5 ดอลลาร์
                    matches = (abs(c1 - c2) <= 0.5).sum()
                else:
                    matches = (c1 == c2).sum()
                    
                total_matches += matches
            return total_matches
        except Exception:
            return 0

    # Execute comparisons
    s_yf_tw = calculate_match(df_yf, df_tw, "_yf", "_tw")
    score["yfinance"] += s_yf_tw
    score["twelvedata"] += s_yf_tw

    s_yf_tv = calculate_match(df_yf, df_tv, "_yf", "_tv")
    score["yfinance"] += s_yf_tv
    score["tradingview"] += s_yf_tv

    s_tw_tv = calculate_match(df_tw, df_tv, "_tw", "_tv")
    score["twelvedata"] += s_tw_tv
    score["tradingview"] += s_tw_tv


    # --- 6. Find Winner (เหมือนเดิม) ---
    valid_sources = {k: v for k, v in score.items() if raw_data[k]["count"] > 0}
    
    if valid_sources:
        best_source = max(valid_sources, key=lambda k: (valid_sources[k], raw_data[k]["count"]))
    else:
        valid_counts = {k: raw_data[k]["count"] for k in raw_data if raw_data[k]["count"] > 0}
        if valid_counts:
            best_source = max(valid_counts, key=valid_counts.get)
        else:
            return f"# Error: Comparison failed for {symbol}\n", ""

    sent_to_telegram(report_message, score, best_source)

    return raw_data[best_source]["header"], raw_data[best_source]["csv"]

# ==========================================
# ✅ MAIN TOOL DEFINITION (For Agent)
# ==========================================

# @tool
def get_stock_data(
    symbol: Annotated[str, "Ticker symbol of the company, e.g. AAPL, TSM"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """Retrieve stock price data (OHLCV) for a given ticker symbol.
    
    This tool compares data from multiple providers (Yahoo Finance, TwelveData, TradingView)
    and returns the most reliable dataset in CSV format.
    
    Args:
        symbol: Ticker symbol of the company.
        start_date: Start date string (YYYY-MM-DD).
        end_date: End date string (YYYY-MM-DD).
    Returns:
        str: A formatted CSV string containing the stock price data.
    """
    
    # เรียกฟังก์ชันเปรียบเทียบโดยตรง (Bypass Router เพื่อแก้ปัญหา Local/Config)
    header, csv_string = compare_stock_providers(symbol, start_date, end_date)
    
    return header + csv_string
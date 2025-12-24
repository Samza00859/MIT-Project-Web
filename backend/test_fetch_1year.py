import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
import os

def fetch_1year_fundamentals(symbol):
    print(f"🚀 Fetching 1-year fundamentals for {symbol}...")
    
    # 1. Resolve Symbol (KBANK -> KBANK.BK if needed)
    if not symbol.endswith(".BK") and not symbol.endswith(".HK"):
        # Quick check if it's a Thai stock candidate
        # For this test, we force .BK if it's KBANK or PTT
        if symbol in ["KBANK", "PTT", "CPALL", "ADVANC", "AOT"]:
             symbol = f"{symbol}.BK"
    
    t = yf.Ticker(symbol)
    
    # Calculate cutoff date (1 year ago)
    cutoff_date = datetime.now() - timedelta(days=365)
    print(f"📅 Filter Date: >= {cutoff_date.strftime('%Y-%m-%d')}")

    data = {
        "symbol": symbol,
        "fetched_at": datetime.now().isoformat(),
        "start_date": cutoff_date.strftime('%Y-%m-%d'),
        "financials": {},
        "balance_sheet": {},
        "cashflow": {}
    }

    def filter_1year(df):
        if df is None or df.empty:
            return {}
        
        # Ensure columns are datetime
        # yfinance columns are usually timestamps
        valid_cols = []
        for col in df.columns:
            # col is usually a Timestamp
            if isinstance(col, pd.Timestamp):
                if col >= cutoff_date:
                    valid_cols.append(col)
            else:
                # Try to parse string? Usually YF returns Timestamp objects
                pass
        
        # Filter dataframe
        if not valid_cols:
            return {}
            
        filtered = df[valid_cols]
        
        # Convert to dict with string keys for JSON serialization
        # Format: { "2024-12-31": { "Total Assets": 12345, ... } }
        result = {}
        for col in valid_cols:
            date_str = col.strftime('%Y-%m-%d')
            # Convert series to dict, handle NaNs
            series_dict = filtered[col].to_dict()
            clean_dict = {k: v for k, v in series_dict.items() if pd.notna(v)}
            result[date_str] = clean_dict
            
        return result

    # Fetch and Process
    try:
        print("   ► Balance Sheet...")
        data["balance_sheet"] = filter_1year(t.balance_sheet)
        
        print("   ► Cash Flow...")
        data["cashflow"] = filter_1year(t.cashflow)
        
        print("   ► Financials (Income Stmt)...")
        data["financials"] = filter_1year(t.financials) # .financials is Income Statement
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")

    return data

def save_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"💾 Saved to {filename}")

if __name__ == "__main__":
    ticker = "KBANK" # Or change to "PTT", "AAPL"
    result = fetch_1year_fundamentals(ticker)
    save_json(result, "test_1year_data.json")

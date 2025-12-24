import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
import os

def fetch_10year_fundamentals(symbol):
    print(f"🚀 Fetching 10-year fundamentals for {symbol}...")
    
    # 1. Resolve Symbol (KBANK -> KBANK.BK if needed)
    if not symbol.endswith(".BK") and not symbol.endswith(".HK"):
        # Quick check if it's a Thai stock candidate
        # For this test, we force .BK if it's KBANK or PTT
        if symbol in ["KBANK", "PTT", "CPALL", "ADVANC", "AOT"]:
             symbol = f"{symbol}.BK"
    
    t = yf.Ticker(symbol)
    
    # Calculate cutoff date (10 years ago)
    years = 10
    cutoff_date = datetime.now() - timedelta(days=365 * years)
    print(f"📅 Filter Date: >= {cutoff_date.strftime('%Y-%m-%d')} (Last {years} years)")

    data = {
        "symbol": symbol,
        "fetched_at": datetime.now().isoformat(),
        "start_date": cutoff_date.strftime('%Y-%m-%d'),
        "data_availability": {
            "balance_sheet_years": 0,
            "financials_years": 0,
            "cashflow_years": 0
        },
        "financials": {},
        "balance_sheet": {},
        "cashflow": {}
    }

    def filter_years(df, name):
        if df is None or df.empty:
            print(f"   ⚠️ No data found for {name}")
            return {}
        
        # Ensure columns are datetime
        valid_cols = []
        oldest_date = None
        newest_date = None
        
        for col in df.columns:
            if isinstance(col, pd.Timestamp):
                if oldest_date is None or col < oldest_date:
                    oldest_date = col
                if newest_date is None or col > newest_date:
                    newest_date = col
                    
                if col >= cutoff_date:
                    valid_cols.append(col)
        
        # Report availability
        years_found = 0
        if oldest_date and newest_date:
            diff = newest_date - oldest_date
            years_found = diff.days / 365.0
            print(f"   ℹ️ {name}: Found data from {oldest_date.date()} to {newest_date.date()} (~{years_found:.1f} years)")
        else:
            print(f"   ℹ️ {name}: No timestamp columns found or empty.")

        # Filter dataframe
        if not valid_cols:
            return {}
            
        filtered = df[valid_cols]
        
        # Convert to dict with string keys for JSON serialization
        result = {}
        for col in valid_cols:
            date_str = col.strftime('%Y-%m-%d')
            series_dict = filtered[col].to_dict()
            clean_dict = {k: v for k, v in series_dict.items() if pd.notna(v)}
            result[date_str] = clean_dict
            
        return result

    # Fetch and Process
    try:
        print("   ► Balance Sheet...")
        data["balance_sheet"] = filter_years(t.balance_sheet, "Balance Sheet")
        
        print("   ► Cash Flow...")
        data["cashflow"] = filter_years(t.cashflow, "Cash Flow")
        
        print("   ► Financials (Income Stmt)...")
        data["financials"] = filter_years(t.financials, "Financials")
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")

    return data

def save_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"💾 Saved to {filename}")

if __name__ == "__main__":
    ticker = "KBANK" # Or change to "PTT", "AAPL"
    result = fetch_10year_fundamentals(ticker)
    save_json(result, "test_10year_data.json")

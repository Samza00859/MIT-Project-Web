import sys
import os
from datetime import datetime, timedelta

# Add backend to sys.path
sys.path.append(os.path.abspath("backend"))

from tradingagents.dataflows.core_stock_price import get_stock_data
from tradingagents.dataflows.core_calculator import process_indicators_from_csv

def test_fetch():
    ticker = "0700.HK"
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    
    print(f"Fetching data for {ticker} from {start_date} to {end_date}...")
    
    try:
        csv_data = get_stock_data(ticker, start_date, end_date)
        print("\n--- Fetched CSV Data (First 10 lines) ---")
        print("\n".join(csv_data.splitlines()[:10]))
        
        print("\n--- Processing Indicators ---")
        indicators, df = process_indicators_from_csv(csv_data)
        
        if df is not None and not df.empty:
            print(f"\nDataFrame Head:\n{df.head()}")
            print(f"\nDataFrame Tail:\n{df.tail()}")
            print(f"\nColumns: {df.columns.tolist()}")
        else:
            print("\nDataFrame is empty!")
            
        if indicators:
            print(f"\nIndicators: {indicators}")
            
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_fetch()

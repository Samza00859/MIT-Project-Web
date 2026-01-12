import sys
import os
from datetime import datetime, timedelta
# Add current directory to path
sys.path.append(os.getcwd())

from tradingagents.dataflows.core_stock_price import get_stock_data
from tradingagents.dataflows.core_calculator import process_indicators_from_csv
import json

def test_market_analyst_logic():
    ticker = "IBM"
    current_date = "2025-12-25"
    
    # Logic copied from market_analyst.py for verification
    try:
        curr_date_obj = datetime.strptime(current_date, "%Y-%m-%d")
        start_date = (curr_date_obj - timedelta(days=365)).strftime("%Y-%m-%d")
    except Exception:
        start_date = "2024-01-01"

    print(f"📊 Market Analyst Test: Pre-fetching data for {ticker}...")
    try:
        # 1. Fetch Stock Data
        stock_data = get_stock_data(ticker, start_date, current_date)
        
        # 2. Calculate Indicators Locally (No API Call)
        indicators, df = process_indicators_from_csv(stock_data)
        
        indicators_context = ""
        if indicators and "error" not in indicators:
            indicators_context = json.dumps(indicators, indent=2)
            
            # Add Historical Context (Last 5 Days)
            if df is not None and not df.empty:
                from tradingagents.dataflows.core_calculator import (
                    calculate_sma, calculate_ema, calculate_rsi, calculate_macd, 
                    calculate_bollinger_bands, calculate_atr
                )
                
                # Recalculate series for history
                df['SMA_50'] = calculate_sma(df, 50)
                df['SMA_200'] = calculate_sma(df, 200)
                df['RSI'] = calculate_rsi(df, 14)
                macd, _, _ = calculate_macd(df)
                df['MACD'] = macd
                ub, lb = calculate_bollinger_bands(df)
                df['BOLL_UB'] = ub
                df['BOLL_LB'] = lb
                
                cols = ['Close', 'SMA_50', 'SMA_200', 'RSI', 'MACD', 'BOLL_UB', 'BOLL_LB']
                history_str = df[cols].tail(5).to_string()
                indicators_context += f"\n\nRECENT HISTORICAL DATA (Last 5 Days):\n{history_str}"
        else:
                indicators_context = f"Error calculating indicators: {indicators.get('error')}"

        data_context = f"""
        STOCK PRICE DATA (Last 1 Year - CSV Format):
        {stock_data[-500:] if len(stock_data) > 500 else stock_data} 
        
        TECHNICAL INDICATORS (Current & History):
        {indicators_context}
        """
        
        print("\n✅ Data Context Generated Successfully:")
        print(data_context)
        
    except Exception as e:
        print(f"⚠️ Data pre-fetch failed: {e}")

if __name__ == "__main__":
    test_market_analyst_logic()

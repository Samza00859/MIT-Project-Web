import argparse
import json
import pandas as pd
from datetime import datetime, timedelta
from tradingagents.dataflows.core_stock_price import get_stock_data
from tradingagents.dataflows.core_calculator import (
    process_indicators_from_csv, 
    calculate_sma, calculate_ema, calculate_rsi, calculate_macd, 
    calculate_bollinger_bands, calculate_atr, calculate_vwma
)

def run_test(ticker, date, lookback_days, show_history):
    # Calculate Start Date Automatically
    date_obj = datetime.strptime(date, "%Y-%m-%d")
    start_date_obj = date_obj - timedelta(days=lookback_days)
    start_date = start_date_obj.strftime("%Y-%m-%d")

    # 1. Fetch Stock Price (OHLCV)
    print(f"📉 1. Fetching Stock Price Data (Lookback: {lookback_days} days -> {start_date} to {date})...")
    try:
        stock_price_csv = get_stock_data(ticker, start_date, date)
        
        # Check if we got valid data
        if "Date,Open,High" not in stock_price_csv:
            print("❌ Failed to fetch valid CSV data.")
            print(stock_price_csv)
        else:
            print(f"✅ Data Fetched! ({len(stock_price_csv)} chars)")
            
            # 2. Calculate Indicators Locally using Pandas
            print(f"\n🧠 2. Calculating Indicators using Math/Pandas...")
            indicators, df = process_indicators_from_csv(stock_price_csv)
            
            if indicators and "error" not in indicators:
                print("\n✅ Calculation Success! Results (Latest):")
                for k, v in indicators.items():
                    print(f"   ► {k.upper()}: {v:.4f}")
                
                print(f"\n(Based on {len(df)} rows of data)")

                if show_history > 0:
                    print(f"\n📜 Historical Data (Last {show_history} days):")
                    
                    # Recalculate series for display
                    df['SMA_50'] = calculate_sma(df, 50)
                    df['SMA_200'] = calculate_sma(df, 200)
                    df['EMA_10'] = calculate_ema(df, 10)
                    df['RSI'] = calculate_rsi(df, 14)
                    macd, signal, hist = calculate_macd(df)
                    df['MACD'] = macd
                    df['MACD_S'] = signal
                    df['MACD_H'] = hist
                    ub, lb = calculate_bollinger_bands(df)
                    df['BOLL_UB'] = ub
                    df['BOLL_LB'] = lb
                    df['ATR'] = calculate_atr(df)
                    df['VWMA'] = calculate_vwma(df)

                    # Select columns to display
                    display_cols = ['Close', 'SMA_50','SMA_200', 'EMA_10', 'RSI', 'MACD','MACD_S','MACD_H','BOLL_UB','BOLL_LB','ATR','VWMA']
                    print(df[display_cols].tail(show_history).to_string())

            else:
                print(f"❌ Calculation Failed: {indicators.get('error')}")

    except Exception as e:
        print(f"❌ Critical Error: {e}")

    print("\n✅ Test Complete.")


res = run_test("IBM", "2025-12-22", 365, 365)
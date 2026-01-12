import asyncio
import os
import sys
import json

# Adjust path to find backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from tradingagents.dataflows.local_call import get_10years_fundamentals
except ImportError:
    # Fallback if running from root
    sys.path.append(os.getcwd())
    from backend.tradingagents.dataflows.local_call import get_10years_fundamentals
    
from tradingagents.dataflows.local import pick_fundamental_source_10years, fetch_yfinance_10y

async def main():
    # symbol = "PTT" # Known Thai Stock
    # symbol = "AAPL" # Known US Stock
    symbol = "GOLD"
    print(f"🚀 Testing 10-year fetch for {symbol}...")
    
    try:
        result = await pick_fundamental_source_10years(symbol)

        print(result)
        print(result['chosen_source'], result['years_found'])
            
        print("\nTest Completed Successfully.")
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

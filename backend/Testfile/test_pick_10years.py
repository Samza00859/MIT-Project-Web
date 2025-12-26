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

async def main():
    # symbol = "PTT" # Known Thai Stock
    # symbol = "AAPL" # Known US Stock
    symbol = "GOLD"
    print(f"🚀 Testing 10-year fetch for {symbol}...")
    
    try:
        result = await get_10years_fundamentals(symbol)

        print(result)
            
        print("\nTest Completed Successfully.")
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

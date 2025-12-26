import asyncio
from tradingagents.agents.utils.fundamental_data_tools import get_fundamentals

async def test_fundamental_ana():
    ticker = "0700.HK"
    curr_date = "2025-02-04"
    
    print("📊 Testing Fundamental Analysis...")
    
    report = await get_fundamentals(ticker, curr_date)
    print("\n✅ Fundamental Analysis Successful!")
    print(f"Report length: {len(report)} characters")
    print("Sample content:")
    print(report)

if __name__ == "__main__":
    asyncio.run(test_fundamental_ana())

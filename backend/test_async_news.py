import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from tradingagents.agents.utils.news_data_tools import get_all_news_batch

async def test_async_news():
    ticker = "IBM"
    start_date = "2024-12-15"
    end_date = "2024-12-22"
    
    print("📰 Testing Async News Fetching...")
    
    try:
        report = await get_all_news_batch(ticker, start_date, end_date)
        print("\n✅ Async News Fetching Successful!")
        print(f"Report length: {len(report)} characters")
        print("Sample content:")
        print(report[:500])
    except Exception as e:
        print(f"❌ Error during async fetch: {e}")

if __name__ == "__main__":
    asyncio.run(test_async_news())

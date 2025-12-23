import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from tradingagents.agents.utils.news_data_tools import fetch_social_data

async def test_async_social():
    ticker = "IBM"
    
    print("💬 Testing Async Social Media Fetching...")
    
    try:
        report = await fetch_social_data(ticker)
        print("\n✅ Async Social Fetching Successful!")
        print(f"Report length: {len(report)} characters")
        print("Sample content:")
        print(report[:400])
    except Exception as e:
        print(f"❌ Error during async fetch: {e}")

if __name__ == "__main__":
    asyncio.run(test_async_social())

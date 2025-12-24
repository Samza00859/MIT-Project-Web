import asyncio
import sys
import os
from datetime import datetime

# Add validation for import
sys.path.append(os.getcwd())

from tradingagents.agents.analysts.social_media_analyst import create_social_media_analyst

# Mock LLM
class MockLLM:
    def invoke(self, messages):
        # Return a dummy response that satisfies the parser
        return MockResponse("""
        {
            "sentiment_verdict": "Neutral",
            "social_volume": "Low volume observed.",
            "dominant_narrative": "Waiting for market direction.",
            "top_topics": [
                {
                    "topic": "Earnings",
                    "sentiment": "Mixed",
                    "analysis_snippet": "discussion on upcoming earnings."
                }
            ],
            "psychology": "Cautious"
        }
        """)

class MockResponse:
    def __init__(self, content):
        self.content = content
        self.tool_calls = []

async def test_node():
    print("🚀 Testing Social Media Analyst Node...")
    
    node_func = create_social_media_analyst(MockLLM())
    
    state = {
        "company_of_interest": "IBM",
        "trade_date": datetime.now().strftime("%Y-%m-%d"),
        "messages": []
    }
    
    try:
        result = await node_func(state)
        print("\n✅ Node execution successful!")
        print(f"Report: {result['sentiment_report']}")
    except Exception as e:
        print(f"\n❌ Node execution failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_node())

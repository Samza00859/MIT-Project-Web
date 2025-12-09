import asyncio
import websockets
import json

async def test():
    uri = "ws://127.0.0.1:8000/ws"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            payload = {
                "action": "start_analysis",
                "request": {
                    "ticker": "SPY",
                    "analysis_date": "2025-01-15",
                    "analysts": ["market"],
                    "research_depth": 1,
                    "llm_provider": "google",
                    "backend_url": "https://generativelanguage.googleapis.com/v1",
                    "shallow_thinker": "gemini-2.5-flash",
                    "deep_thinker": "gemini-2.5-flash"
                }
            }
            
            print(f"Sending payload: {json.dumps(payload, indent=2)}")
            await websocket.send(json.dumps(payload))
            
            print("Listening for messages...")
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print(f"Received: {data.get('type')}")
                if data.get('type') == 'error':
                    print(f"Error: {data}")
                    break
                if data.get('type') == 'complete':
                    print("Analysis complete!")
                    break
                    
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())

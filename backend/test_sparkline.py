import requests

url = "http://localhost:8000/quote/AAPL"
try:
    print(f"Calling {url}...")
    r = requests.get(url)
    if r.status_code == 200:
        data = r.json()
        print("Success!")
        print(f"Symbol: {data.get('symbol')}")
        print(f"Price: {data.get('price')}")
        sparkline = data.get('sparkline')
        if sparkline:
            print(f"Sparkline found: {len(sparkline)} points")
            print(f"Sample: {sparkline[:5]}")
        else:
            print(" Sparkline Missing!")
    else:
        print(f"Error ({r.status_code}): {r.text}")
except Exception as e:
    print(f"Failed: {e}")

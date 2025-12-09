import urllib.request
import json

def test_health():
    url = "http://127.0.0.1:8000/api/health"
    print(f"Checking {url}...")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            print(f"Status: {data}")
    except Exception as e:
        print(f"Health check failed: {e}")

if __name__ == "__main__":
    test_health()

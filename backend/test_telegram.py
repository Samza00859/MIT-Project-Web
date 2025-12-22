import os
import requests
from dotenv import load_dotenv

# Explicitly load from .env file
load_dotenv(".env")

def sent_to_telegram(message: str):
    """Send a message to Telegram if configured."""
    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    
    print(f"Checking configuration...")
    # Hide sensitive info in logs but verify existence
    if TELEGRAM_TOKEN:
        print("TELEGRAM_TOKEN: Found")
    else:
        print("TELEGRAM_TOKEN: Missing")
        
    if TELEGRAM_CHAT_ID:
        print("TELEGRAM_CHAT_ID: Found")
    else:
        print("TELEGRAM_CHAT_ID: Missing")

    if TELEGRAM_TOKEN and TELEGRAM_CHAT_ID:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
        }
        
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,  # Maximum number of retries
            backoff_factor=1,  # Wait 1s, 2s, 4s between retries
            status_forcelist=[429, 500, 502, 503, 504],  # Retry on these status codes
            allowed_methods=["POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        http = requests.Session()
        http.mount("https://", adapter)
        http.mount("http://", adapter)

        try:
            print(f"Sending request to {url.replace(TELEGRAM_TOKEN, '***')}...")
            # timeout=(connect, read)
            response = http.post(url, data=payload, timeout=(30, 60))
            response.raise_for_status()
            print("✅ Report sent to Telegram successfully!")
        except requests.RequestException as e:
            print(f"❌ Failed to send report to Telegram after retries: {e}")
        finally:
            http.close()
    else:
        print("⚠️ Telegram not configured.")

if __name__ == "__main__":
    sent_to_telegram("🔔 Test message from *Antigravity* with increased timeout (30s).")

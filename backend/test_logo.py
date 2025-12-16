import yfinance as yf
from urllib.parse import urlparse

ticker = "AAPL"
t = yf.Ticker(ticker)
try:
    info = t.info
    print(f"Website: {info.get('website')}")
    print(f"Logo URL from info: {info.get('logo_url')}")
    
    website = info.get('website')
    if website:
        domain = urlparse(website).netloc
        if domain.startswith("www."):
            domain = domain[4:]
        print(f"Extracted Domain: {domain}")
        print(f"Clearbit URL: https://logo.clearbit.com/{domain}")
except Exception as e:
    print(f"Error: {e}")

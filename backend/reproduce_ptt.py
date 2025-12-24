
import sys
import os
import yfinance as yf

# Mocking _is_valid_ticker based on local.py implementation
def _is_valid_ticker(symbol: str) -> bool:
    try:
        t = yf.Ticker(symbol)
        # เช็ก history 1 วัน ชัวร์กว่า fast_info
        hist = t.history(period="5d") # เอา 5 วันเผื่อติดวันหยุด
        return not hist.empty
    except:
        return False

def auto_resolve_symbol(symbol: str) -> str:
    s = symbol.upper().strip()
    
    if s in ["XAUUSD", "GC=F", "GOLD_SPOT"]:
        return "GOLD"

    if "." in s:
        return s

    if s.isdigit():
        if _is_valid_ticker(f"{s}.SS"): return f"{s}.SS"
        if _is_valid_ticker(f"{s}.SZ"): return f"{s}.SZ"
        return s

    # The problematic logic:
    print(f"Checking {s}...")
    if _is_valid_ticker(s):
        print(f"Found {s} directly")
        return s
    
    print(f"Checking {s}.BK...")
    if _is_valid_ticker(f"{s}.BK"):
        return f"{s}.BK"
    
    return f"{s}.BK" if len(s) >= 3 else s

if __name__ == "__main__":
    target = "PTT"
    resolved = auto_resolve_symbol(target)
    print(f"\nFinal Resolution for '{target}': {resolved}")

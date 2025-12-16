"""
Start the FastAPI backend server for TradingAgents web interface.
"""
import uvicorn
import sys
import os

# Enforce UTF-8 for Windows console
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    os.environ["PYTHONIOENCODING"] = "utf-8"

if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host="localhost",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )


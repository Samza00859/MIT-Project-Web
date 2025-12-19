"""
Start the FastAPI backend server for TradingAgents web interface.
"""
import sys
import os
import uvicorn
from pathlib import Path

# Get the directory where start_api.py is located
CURRENT_DIR = Path(__file__).parent
# Assuming the project root is the parent of the 'backend' directory
PROJECT_ROOT = CURRENT_DIR.parent

# Add the project root to sys.path
sys.path.insert(0, str(PROJECT_ROOT))


def main() -> None:
    """
    Launch the FastAPI server on http://localhost:8000 (or PORT env override).

    Keeping this in one place makes it obvious to developers where to change
    the listening port/host when running in other environments.
    """
    host = os.getenv("HOST", "localhost")
    port = int(os.getenv("PORT", "8000"))
    try:
        print(f"Starting backend at http://{host}:{port}")
        uvicorn.run(
            "backend.api.main:app",  # Use absolute import path for the app
            host=host,
            port=port,
            reload=True,  # Enable auto-reload during development
            log_level="info",
        )
    except Exception as exc:
        # Surface startup failures (e.g., port in use) clearly for debugging.
        print(f"Failed to start backend on http://{host}:{port}: {exc}")
        raise


if __name__ == "__main__":
    main()


"""
Start the FastAPI backend server for TradingAgents web interface.
Supports ngrok port forwarding for external access.
"""
import sys
import os
import uvicorn
from pathlib import Path
import atexit
import signal

# Get the directory where start_api.py is located (project root)
PROJECT_ROOT = Path(__file__).parent

# Add the project root to sys.path
sys.path.insert(0, str(PROJECT_ROOT))

# Enforce UTF-8 for Windows console
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    os.environ["PYTHONIOENCODING"] = "utf-8"

# Global ngrok tunnel reference for cleanup
ngrok_tunnel = None


def setup_ngrok(port: int) -> str:
    """
    Setup ngrok tunnel for port forwarding.
    Returns the public URL.
    """
    try:
        from pyngrok import ngrok, conf
        
        # Get ngrok auth token from environment if available
        ngrok_token = os.getenv("NGROK_AUTH_TOKEN")
        if ngrok_token:
            ngrok.set_auth_token(ngrok_token)
        
        # Start ngrok tunnel
        public_url = ngrok.connect(port, bind_tls=True)
        tunnel_url = public_url.public_url
        
        print(f"\n{'='*60}")
        print(f"🌐 Ngrok tunnel established!")
        print(f"📍 Public URL: {tunnel_url}")
        print(f"🔒 Local URL: http://localhost:{port}")
        print(f"{'='*60}\n")
        
        return tunnel_url
    except ImportError:
        print("⚠️  pyngrok not installed. Install it with: pip install pyngrok")
        print("   Or set ENABLE_NGROK=false to disable port forwarding.\n")
        return None
    except Exception as e:
        print(f"⚠️  Failed to setup ngrok tunnel: {e}")
        print("   Continuing without port forwarding...\n")
        return None


def cleanup_ngrok():
    """Cleanup ngrok tunnel on exit."""
    global ngrok_tunnel
    if ngrok_tunnel:
        try:
            from pyngrok import ngrok
            ngrok.kill()
            print("\n🔌 Ngrok tunnel closed.")
        except Exception:
            pass


def main() -> None:
    """
    Launch the FastAPI server on http://localhost:8000 (or PORT env override).
    Optionally setup ngrok port forwarding if ENABLE_NGROK=true.
    """
    global ngrok_tunnel
    
    host = os.getenv("HOST", "0.0.0.0")  # Changed to 0.0.0.0 to allow external connections
    port = int(os.getenv("PORT", "8000"))
    enable_ngrok = os.getenv("ENABLE_NGROK", "false").strip().lower() in {"1", "true", "yes", "on"}
    
    # Setup ngrok if enabled
    public_url = None
    if enable_ngrok:
        public_url = setup_ngrok(port)
        ngrok_tunnel = public_url  # Store reference
        
        # Register cleanup handler
        atexit.register(cleanup_ngrok)
        signal.signal(signal.SIGTERM, lambda s, f: (cleanup_ngrok(), sys.exit(0)))
        signal.signal(signal.SIGINT, lambda s, f: (cleanup_ngrok(), sys.exit(0)))
        
        # Update FRONTEND_URL environment variable if not already set
        if public_url and not os.getenv("FRONTEND_URL"):
            os.environ["FRONTEND_URL"] = public_url
            print(f"💡 Set FRONTEND_URL={public_url} for email verification links\n")
    
    try:
        print(f"🚀 Starting backend at http://{host}:{port}")
        if enable_ngrok and public_url:
            print(f"🌐 Public access via: {public_url}")
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Check email configuration
        email_enabled = os.getenv("EMAIL_SENDING", "false").strip().lower() in {"1", "true", "yes", "on"}
        if email_enabled:
            resend_api_key = os.getenv("RESEND_API_KEY", "")
            resend_from_email = os.getenv("RESEND_FROM_EMAIL", "")
            if not resend_api_key or resend_api_key == "your_resend_api_key":
                print("⚠️  EMAIL_SENDING is enabled but RESEND_API_KEY not configured properly.")
                print("   Email verification codes will not be sent. Please configure your .env file.")
            elif not resend_from_email:
                print("⚠️  EMAIL_SENDING is enabled but RESEND_FROM_EMAIL not configured.")
                print("   Email verification codes will not be sent. Please configure your .env file.")
            else:
                print("📧 Email sending is ENABLED (Resend)")
        else:
            print("📧 Email sending is DISABLED (set EMAIL_SENDING=true in .env to enable)")
        
        print()
        
        uvicorn.run(
            "backend.api.main:app",  # Use correct import path
            host=host,
            port=port,
            reload=True,  # Enable auto-reload during development
            log_level="info",
        )
    except KeyboardInterrupt:
        cleanup_ngrok()
        print("\n👋 Server stopped.")
    except Exception as exc:
        cleanup_ngrok()
        # Surface startup failures (e.g., port in use) clearly for debugging.
        print(f"❌ Failed to start backend on http://{host}:{port}: {exc}")
        raise


if __name__ == "__main__":
    main()


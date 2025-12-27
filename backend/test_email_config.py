import os
import sys
from pathlib import Path

# Add the project root to sys.path so we can import backend
sys.path.append(str(Path(__file__).parent.parent))

try:
    from backend.config import EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT, EMAIL_SENDING
    
    print("=" * 60)
    print("Email Configuration Test")
    print("=" * 60)
    print(f"EMAIL_SENDING: {EMAIL_SENDING}")
    print(f"EMAIL_HOST:    {EMAIL_HOST}")
    print(f"EMAIL_PORT:    {EMAIL_PORT}")
    print(f"EMAIL_USERNAME: {EMAIL_USERNAME if EMAIL_USERNAME != 'your_email@gmail.com' else '⚠️ NOT SET'}")
    
    # Check if password is set but don't show it
    if EMAIL_PASSWORD and EMAIL_PASSWORD != 'your_app_password':
        print(f"EMAIL_PASSWORD: ✅ SET (Length: {len(EMAIL_PASSWORD)})")
    else:
        print(f"EMAIL_PASSWORD: ❌ NOT SET")
        
    print("-" * 60)
    if EMAIL_SENDING:
        if EMAIL_USERNAME != 'your_email@gmail.com' and EMAIL_PASSWORD != 'your_app_password':
            print("✅ Email sending is ENABLED and credentials appear to be set.")
        else:
            print("⚠️ Email sending is ENABLED but credentials are still default values!")
    else:
        print("❌ Email sending is currently DISABLED (EMAIL_SENDING=false).")
    print("=" * 60)

except ImportError as e:
    print(f"Error importing config: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
























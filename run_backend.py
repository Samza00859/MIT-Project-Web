"""Run backend server with error handling"""
import sys
from pathlib import Path

# Get project root
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

print(f"Project root: {PROJECT_ROOT}")
print(f"Python path: {sys.path[:3]}")

try:
    print("\n1. Testing imports...")
    from backend.auth import UserCreate
    print("   ✅ backend.auth imported")
    
    from backend.email_service import send_verification_email
    print("   ✅ backend.email_service imported")
    
    from backend.config import ACCESS_TOKEN_EXPIRE_MINUTES
    print("   ✅ backend.config imported")
    
    print("\n2. Starting server...")
    import uvicorn
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)





















"""Test if backend imports work correctly"""
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

print("Testing imports...")

try:
    print("1. Testing backend.auth...")
    from backend.auth import UserCreate, UserInDB
    print("   ✅ backend.auth imported successfully")
except Exception as e:
    print(f"   ❌ Error importing backend.auth: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    print("2. Testing backend.api.main...")
    from backend.api.main import app
    print("   ✅ backend.api.main imported successfully")
except Exception as e:
    print(f"   ❌ Error importing backend.api.main: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ All imports successful!")



















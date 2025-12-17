"""
Script to create a test user for login.
Run this script to create a default test user.
"""
import json
import bcrypt
from pathlib import Path

# User data
PROJECT_ROOT = Path(__file__).parent
USERS_FILE = PROJECT_ROOT / "users.json"

# Test user credentials
test_user = {
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
}

def create_test_user():
    """Create a test user in users.json file."""
    # Hash password
    hashed_password = bcrypt.hashpw(
        test_user["password"].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')
    
    # Create user object
    user_data = {
        test_user["email"].lower(): {
            "name": test_user["name"],
            "email": test_user["email"].lower(),
            "password": hashed_password,
            "created_at": "2025-01-01T00:00:00"
        }
    }
    
    # Save to file
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(user_data, f, indent=2, ensure_ascii=False)
    
    print("=" * 50)
    print("Test User Created Successfully!")
    print("=" * 50)
    print(f"Email: {test_user['email']}")
    print(f"Password: {test_user['password']}")
    print("=" * 50)
    print(f"User data saved to: {USERS_FILE}")
    print("=" * 50)

if __name__ == "__main__":
    create_test_user()


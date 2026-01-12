#!/usr/bin/env python3
"""
Script to check if required API keys are set in environment variables.
Run this script to verify your API configuration before starting the backend.
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded .env file from: {env_path}")
else:
    print(f"⚠ .env file not found at: {env_path}")
    print("  Environment variables will be read from system environment only.")

print("\n" + "="*60)
print("API Key Configuration Check")
print("="*60 + "\n")

# Check current LLM provider from config
try:
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from tradingagents.default_config import DEFAULT_CONFIG
    llm_provider = DEFAULT_CONFIG.get("llm_provider", "unknown")
    print(f"Current LLM Provider: {llm_provider.upper()}\n")
except Exception as e:
    print(f"⚠ Could not load config: {e}\n")
    llm_provider = "unknown"

# Required API keys based on provider
required_keys = {
    "deepseek": ["DEEPSEEK_API_KEY"],
    "openai": ["OPENAI_API_KEY"],
    "typhoon": ["TYPHOON_API_KEY"],
    "google": ["GEMINI_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY"],
}

# Always check for Typhoon (used by summarizers)
always_check = ["TYPHOON_API_KEY"]

# Optional but recommended keys
optional_keys = [
    "ALPHA_VANTAGE_API_KEY",
    "FINNHUB_API_KEY",
    "TWELVEDATA_API_KEY",
]

# Check required keys for current provider
if llm_provider.lower() in required_keys:
    keys_to_check = required_keys[llm_provider.lower()]
else:
    keys_to_check = []

# Add always-check keys
keys_to_check.extend(always_check)
keys_to_check = list(set(keys_to_check))  # Remove duplicates

print("Required API Keys:")
print("-" * 60)
all_required_ok = True
for key in keys_to_check:
    value = os.getenv(key)
    if value:
        # Mask the key for security (show first 4 and last 4 chars)
        masked = value[:4] + "*" * (len(value) - 8) + value[-4:] if len(value) > 8 else "*" * len(value)
        print(f"✓ {key:25} = {masked}")
    else:
        print(f"✗ {key:25} = NOT SET")
        all_required_ok = False

print("\nOptional API Keys:")
print("-" * 60)
for key in optional_keys:
    value = os.getenv(key)
    if value:
        masked = value[:4] + "*" * (len(value) - 8) + value[-4:] if len(value) > 8 else "*" * len(value)
        print(f"✓ {key:25} = {masked}")
    else:
        print(f"○ {key:25} = NOT SET (optional)")

print("\n" + "="*60)
if all_required_ok:
    print("✓ All required API keys are set!")
    print("  You can start the backend server.")
else:
    print("✗ Some required API keys are missing!")
    print("\nTo fix this:")
    print("1. Create a .env file in the backend directory")
    print("2. Add the missing API keys:")
    for key in keys_to_check:
        if not os.getenv(key):
            print(f"   {key}=your_api_key_here")
    print("\nSee backend/API_KEY_FIX.md for detailed instructions.")
print("="*60 + "\n")


import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load .env file with error handling
# Suppress warnings for parse errors (e.g., comments with colons)
try:
    # Load .env file, but don't fail if it has parse warnings
    # dotenv will still load valid variables even if some lines have parse warnings
    load_dotenv(override=False, verbose=False)
except Exception as e:
    logger.warning(f"Could not load .env file: {e}")
    # Continue with default values

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key") # Change this to a strong, random key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email Settings (Resend API)
# How to get Resend API Key:
# 1. Sign up at https://resend.com
# 2. Go to API Keys in your dashboard
# 3. Create a new API key
# 4. Add your domain and verify it
# 5. Use the API key and your verified sender email below
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "your_resend_api_key")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", os.getenv("EMAIL_FROM", "onboarding@resend.dev"))  # Must be a verified domain in Resend

# Email sending + verification feature flags
# - EMAIL_SENDING: actually send emails via Resend (requires valid API key)
# - EMAIL_VERIFICATION_ENABLED: require users to verify via link or 6-digit code
#
# Defaults are chosen for local development:
# - verification ON (so the passcode UI works out of the box)
# - sending OFF (so you can test without configuring Gmail)
EMAIL_SENDING = os.getenv("EMAIL_SENDING", "false").strip().lower() in {"1", "true", "yes", "on"}
EMAIL_VERIFICATION_ENABLED = os.getenv("EMAIL_VERIFICATION_ENABLED", "true").strip().lower() in {"1", "true", "yes", "on"}

# Email verification flow settings
# - EMAIL_VERIFICATION_EXPIRE_HOURS: how long the email verification link/code is valid
# - EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: min time between resends (basic anti-spam)
EMAIL_VERIFICATION_EXPIRE_HOURS = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_HOURS", "24"))
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = int(os.getenv("EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS", "60"))

# Legacy (unused): shared secret for a removed Node email verification service.
VERIFICATION_TOKEN_SECRET = os.getenv("VERIFICATION_TOKEN_SECRET", "dev-verify-token-secret")

# SMTP Email Settings (for email_utils.py - alternative to Resend)
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "your_email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your_app_password")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))


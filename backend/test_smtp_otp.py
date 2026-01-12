"""
Test SMTP email sending with 6-digit OTP code
Usage: python test_smtp_otp.py <recipient_email>
"""
import asyncio
import sys
import random
import string
import os
from pathlib import Path

# Add parent directory to path for proper imports
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)
    print(f"✓ Loaded .env from: {env_file}")
else:
    print(f"⚠ No .env file found at: {env_file}")
    print("Using default/environment variables")

# Import email sending function directly
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Get SMTP config from environment
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "your_email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your_app_password")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

async def send_email_smtp(to_email: str, subject: str, body_html: str, body_text: str) -> bool:
    """Send email via SMTP (simplified for testing)"""
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_USERNAME
        message["To"] = to_email
        
        # Add text and HTML parts
        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Connect and send
        print(f"Connecting to {EMAIL_HOST}:{EMAIL_PORT}...")
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.set_debuglevel(0)
            server.ehlo()
            server.starttls()
            server.ehlo()
            print(f"Logging in as {EMAIL_USERNAME}...")
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            print(f"Sending email to {to_email}...")
            server.send_message(message)
        
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise

def generate_6_digit_code() -> str:
    """Generate a random 6-digit code"""
    return ''.join(random.choices(string.digits, k=6))

async def test_smtp_send(recipient_email: str):
    """Test sending a 6-digit OTP via SMTP"""
    
    # Generate test code
    test_code = generate_6_digit_code()
    
    print("=" * 60)
    print("Testing SMTP Email with 6-Digit OTP")
    print("=" * 60)
    print(f"Recipient: {recipient_email}")
    print(f"Test Code: {test_code}")
    print()
    print("SMTP Configuration:")
    print(f"  Host: {EMAIL_HOST}:{EMAIL_PORT}")
    print(f"  Username: {EMAIL_USERNAME}")
    print(f"  Password: {'*' * 8 + '...' if EMAIL_PASSWORD and len(EMAIL_PASSWORD) > 8 else '(not set)'}")
    print("-" * 60)
    
    # Create email content
    subject = "Your Verification Code - Test"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .code-box {{ background-color: #fff; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }}
            .code {{ font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Verification Test</h1>
            </div>
            <div class="content">
                <h2>Your Verification Code</h2>
                <p>This is a test email to verify SMTP configuration.</p>
                <p>Your 6-digit verification code is:</p>
                <div class="code-box">
                    <div class="code">{test_code}</div>
                </div>
                <p>This code will expire in 24 hours.</p>
                <p><strong>Note:</strong> This is a test email. If you did not request this, please ignore it.</p>
            </div>
            <div class="footer">
                <p>This is an automated test email from TradingAgents Authentication System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Email Verification Test
    
    Your 6-digit verification code is: {test_code}
    
    This code will expire in 24 hours.
    
    Note: This is a test email. If you did not request this, please ignore it.
    
    ---
    TradingAgents Authentication System
    """
    
    print("Sending email via SMTP...")
    print()
    
    try:
        success = await send_email_smtp(
            to_email=recipient_email,
            subject=subject,
            body_html=html_body,
            body_text=text_body
        )
        
        print("-" * 60)
        if success:
            print("✅ SUCCESS: Email sent successfully!")
            print(f"✅ Check inbox (or spam folder) at: {recipient_email}")
            print(f"✅ The verification code is: {test_code}")
            print()
            print("Next steps:")
            print("  1. Check your email inbox")
            print("  2. Look in spam/promotions folder if not in inbox")
            print("  3. If email received, SMTP is working correctly!")
        else:
            print("❌ FAILED: Email was not sent")
            print()
            print("Troubleshooting:")
            print("  1. Check backend/.env file has these settings:")
            print("     EMAIL_USERNAME=javvvy67@gmail.com")
            print("     EMAIL_PASSWORD=<your_16_char_app_password>")
            print("     EMAIL_HOST=smtp.gmail.com")
            print("     EMAIL_PORT=587")
            print()
            print("  2. Make sure you're using Gmail App Password:")
            print("     - Go to https://myaccount.google.com/security")
            print("     - Enable 2-Step Verification")
            print("     - Generate App Password")
            print("     - Use the 16-character password (no spaces)")
        print("=" * 60)
        
        return success
        
    except Exception as e:
        print("-" * 60)
        print(f"❌ ERROR: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_smtp_otp.py <recipient_email>")
        print("Example: python test_smtp_otp.py user@example.com")
        sys.exit(1)
    
    recipient = sys.argv[1]
    
    # Validate email format (basic check)
    if '@' not in recipient or '.' not in recipient:
        print(f"❌ Invalid email format: {recipient}")
        sys.exit(1)
    
    # Run the test
    success = asyncio.run(test_smtp_send(recipient))
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()


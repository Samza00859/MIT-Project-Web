import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from typing import Optional

from .config import EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT, EMAIL_VERIFICATION_EXPIRE_HOURS

async def send_verification_email(recipient_email: str, verification_link: str, verification_code: Optional[str] = None):
    """
    Send verification email with 6-digit code via SMTP.
    
    Args:
        recipient_email: User's email address
        verification_link: Email verification link (optional, for backward compatibility)
        verification_code: 6-digit verification code (required for this workflow)
    """
    if not EMAIL_USERNAME or not EMAIL_PASSWORD or EMAIL_USERNAME == "your_email@gmail.com":
        print("Email credentials not set in config.py. Skipping email sending.")
        return False

    sender_email = EMAIL_USERNAME
    sender_password = EMAIL_PASSWORD
    expire_text = f"{EMAIL_VERIFICATION_EXPIRE_HOURS} hours"

    # Create multipart message for HTML email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header("Verify Your Email for TradingAgents", "utf-8")
    msg["From"] = sender_email
    msg["To"] = recipient_email

    # Plain text version
    if verification_code:
        text_content = f"""Hello,

Thank you for registering with TradingAgents!

Your verification code is: {verification_code}

Please enter this 6-digit code on the verification page to complete your registration.

This code will expire in {expire_text}.

If you did not create an account, please ignore this email.

Best regards,
TradingAgents Team
"""
    else:
        text_content = f"""Hello,

Thank you for registering with TradingAgents!

Please click the link below to verify your email address:
{verification_link}

This link will expire in {expire_text}.

If you did not create an account, please ignore this email.

Best regards,
TradingAgents Team
"""

    # HTML version
    code_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #2df4c6; background: #000; padding: 20px; display: inline-block; border-radius: 5px;">
                {verification_code}
            </div>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Verification Code</p>
        </div>
    """ if verification_code else ""

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
        }}
        .header {{
            color: #2df4c6;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 30px;
            background-color: #2df4c6;
            color: #000;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Welcome to TradingAgents!</div>
        <p>Hello,</p>
        <p>Thank you for registering with TradingAgents!</p>
        {code_html}
        {f'<p>Please click the button below to verify your email address:</p><div style="text-align: center;"><a href="{verification_link}" class="button">Verify Email Address</a></div>' if verification_link else ''}
        <p><strong>This code will expire in {expire_text}.</strong></p>
        <p>If you did not create an account, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>TradingAgents Team</p>
        </div>
    </div>
</body>
</html>
"""

    # Attach both plain text and HTML versions
    part1 = MIMEText(text_content, "plain", "utf-8")
    part2 = MIMEText(html_content, "html", "utf-8")
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        print(f"Verification email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send verification email to {recipient_email}: {e}")
        return False


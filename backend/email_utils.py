import smtplib
from email.mime.text import MIMEText
from email.header import Header

from .config import EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT

async def send_verification_email(recipient_email: str, verification_link: str):
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        print("Email credentials not set in config.py. Skipping email sending.")
        return

    sender_email = EMAIL_USERNAME
    sender_password = EMAIL_PASSWORD

    msg = MIMEText(
        f"Please click the link to verify your email: {verification_link}",
        "plain",
        "utf-8"
    )
    msg["Subject"] = Header("Verify Your Email for TradingAgents", "utf-8")
    msg["From"] = sender_email
    msg["To"] = recipient_email

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        print(f"Verification email sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send verification email to {recipient_email}: {e}")


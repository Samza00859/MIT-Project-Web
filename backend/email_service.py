"""
Email Service Module
Handles email sending using Resend API.
"""
import logging
from typing import Optional

try:
    from resend import Resend
except ImportError:
    Resend = None

from .config import RESEND_API_KEY, EMAIL_VERIFICATION_EXPIRE_HOURS, RESEND_FROM_EMAIL

logger = logging.getLogger(__name__)


class EmailService:
    """Email service class for sending emails via Resend API."""
    
    def __init__(self):
        self.api_key = RESEND_API_KEY
        self.from_email = RESEND_FROM_EMAIL
        
        if Resend is None:
            logger.warning("resend package not installed. Email sending will be disabled.")
            self.client = None
        elif not self.api_key or self.api_key == "your_resend_api_key":
            logger.warning("RESEND_API_KEY not configured. Email sending disabled.")
            self.client = None
        else:
            try:
                self.client = Resend(api_key=self.api_key)
                logger.info("Resend email service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Resend client: {e}")
                self.client = None
        
    def _validate_config(self) -> bool:
        """Validate email configuration."""
        if self.client is None:
            return False
        if not self.api_key or self.api_key == "your_resend_api_key":
            logger.warning("RESEND_API_KEY not configured. Email sending disabled.")
            return False
        if not self.from_email:
            logger.warning("RESEND_FROM_EMAIL not configured. Email sending disabled.")
            return False
        return True
    
    def send_verification_email(self, recipient_email: str, verification_link: str, verification_code: Optional[str] = None) -> bool:
        """
        Send email verification email using Resend.
        
        Args:
            recipient_email: User's email address
            verification_link: Email verification link
            verification_code: Optional numeric verification code
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self._validate_config():
            return False
        
        subject = "Verify Your Email for TradingAgents"
        expire_text = f"{EMAIL_VERIFICATION_EXPIRE_HOURS} hours"

        # HTML version with code display
        code_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #2df4c6; background: #000; padding: 20px; display: inline-block; border-radius: 5px;">
                {verification_code}
            </div>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Verification Code</p>
        </div>
        """ if verification_code else ""

        html_body = f"""
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
        .button:hover {{
            background-color: #26dcb2;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
        }}
        .link {{
            word-break: break-all;
            color: #2df4c6;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Welcome to TradingAgents!</div>
        <p>Hello,</p>
        <p>Thank you for registering with TradingAgents!</p>
        {code_html}
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center;">
            <a href="{verification_link}" class="button">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p class="link">{verification_link}</p>
        <p><strong>This link and code will expire in {expire_text}.</strong></p>
        <p>If you did not create an account, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>TradingAgents Team</p>
        </div>
    </div>
</body>
</html>
"""
        
        # Plain text version
        if verification_code:
            text_body = f"""
Hello,

Thank you for registering with TradingAgents!

Your verification code is: {verification_code}

Please enter this code on the verification page or click the link below:
{verification_link}

This code and link will expire in {expire_text}.

If you did not create an account, please ignore this email.

Best regards,
TradingAgents Team
"""
        else:
            text_body = f"""
Hello,

Thank you for registering with TradingAgents!

Please click the link below to verify your email address:
{verification_link}

This link will expire in {expire_text}.

If you did not create an account, please ignore this email.

Best regards,
TradingAgents Team
"""
        
        try:
            params = {
                "from": self.from_email,
                "to": recipient_email,
                "subject": subject,
                "html": html_body,
            }
            
            # Resend API can accept 'text' but it's optional
            if text_body:
                params["text"] = text_body
            
            response = self.client.emails.send(params)
            
            # Resend returns a response object with 'id' attribute on success
            if response:
                email_id = getattr(response, 'id', None) or (response.get('id') if isinstance(response, dict) else None)
                if email_id:
                    logger.info(f"Email sent successfully to {recipient_email} (Resend ID: {email_id})")
                    return True
                else:
                    logger.info(f"Email sent successfully to {recipient_email}")
                    return True
            else:
                logger.error(f"Unexpected response from Resend: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email} via Resend: {e}", exc_info=True)
            return False

    def send_account_deletion_email(self, recipient_email: str) -> bool:
        """
        Send account deletion confirmation email using Resend.
        
        Args:
            recipient_email: User's email address
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self._validate_config():
            return False
        
        subject = "Account Deleted - TradingAgents"
        
        # Plain text version
        text_body = f"""
Hello,

Your TradingAgents account ({recipient_email}) has been successfully deleted.

All your data has been removed from our system. If you change your mind, you can always register for a new account.

Thank you for using TradingAgents!

Best regards,
TradingAgents Team
"""
        
        # HTML version
        html_body = f"""
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
            color: #ff4d4f;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
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
        <div class="header">Account Deleted</div>
        <p>Hello,</p>
        <p>Your TradingAgents account (<strong>{recipient_email}</strong>) has been successfully deleted.</p>
        <p>All your data has been removed from our system. If you change your mind, you can always register for a new account.</p>
        <p>Thank you for using TradingAgents!</p>
        <div class="footer">
            <p>Best regards,<br>TradingAgents Team</p>
        </div>
    </div>
</body>
</html>
"""
        
        try:
            params = {
                "from": self.from_email,
                "to": recipient_email,
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }
            
            response = self.client.emails.send(params)
            
            if response and hasattr(response, 'id'):
                logger.info(f"Account deletion email sent successfully to {recipient_email} (Resend ID: {response.id})")
                return True
            else:
                logger.error(f"Unexpected response from Resend: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send account deletion email to {recipient_email} via Resend: {e}")
            return False


# Create a singleton instance
email_service = EmailService()


# Convenience functions for backward compatibility
async def send_verification_email(recipient_email: str, verification_link: str, verification_code: Optional[str] = None) -> bool:
    """
    Async wrapper for sending verification email.
    
    Args:
        recipient_email: User's email address
        verification_link: Email verification link
        verification_code: Optional numeric verification code
        
    Returns:
        True if email sent successfully, False otherwise
    """
    return email_service.send_verification_email(recipient_email, verification_link, verification_code)

async def send_account_deletion_email(recipient_email: str) -> bool:
    """
    Async wrapper for sending account deletion email.
    
    Args:
        recipient_email: User's email address
        
    Returns:
        True if email sent successfully, False otherwise
    """
    return email_service.send_account_deletion_email(recipient_email)

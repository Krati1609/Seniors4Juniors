import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_verification_email(email: str, token: str, full_name: str):
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = f"Verify your email for {settings.PROJECT_NAME}"
        
        body_text = f"""
Hello {full_name},

Thank you for registering on {settings.PROJECT_NAME}!
Please verify your email address by clicking the link below:

{verify_url}

If you did not create this account, please ignore this email.
Best regards,
The {settings.PROJECT_NAME} Team
"""
        # Always log prominent banner to console for instant local developer testing
        print("\n" + "="*70)
        print(f"📧 [EMAIL NOTIFICATION - VERIFY EMAIL]")
        print(f"To: {email} ({full_name})")
        print(f"Subject: {subject}")
        print(f"🔗 Verification Link: {verify_url}")
        print("="*70 + "\n")
        
        # If SMTP is configured, attempt sending real email
        if settings.SMTP_HOST and settings.SMTP_USER and not settings.EMAIL_CONSOLE_MODE:
            EmailService._send_smtp_email(email, subject, body_text)

    @staticmethod
    def send_password_reset_email(email: str, token: str, full_name: str):
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = f"Password Reset Request for {settings.PROJECT_NAME}"
        
        body_text = f"""
Hello {full_name},

We received a request to reset your password on {settings.PROJECT_NAME}.
Click the link below to set a new password:

{reset_url}

This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.
Best regards,
The {settings.PROJECT_NAME} Team
"""
        print("\n" + "="*70)
        print(f"🔑 [EMAIL NOTIFICATION - PASSWORD RESET]")
        print(f"To: {email} ({full_name})")
        print(f"Subject: {subject}")
        print(f"🔗 Password Reset Link: {reset_url}")
        print("="*70 + "\n")
        
        if settings.SMTP_HOST and settings.SMTP_USER and not settings.EMAIL_CONSOLE_MODE:
            EmailService._send_smtp_email(email, subject, body_text)

    @staticmethod
    def _send_smtp_email(to_email: str, subject: str, body_text: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body_text, 'plain'))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Successfully dispatched SMTP email to {to_email}")
        except Exception as e:
            logger.error(f"Failed to dispatch SMTP email to {to_email}: {e}")

email_service = EmailService()

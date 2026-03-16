"""
Email service for sending verification and password reset emails.

Uses Flask-Mail for SMTP delivery. In development, set MAIL_SUPPRESS_SEND=True
in .env to skip SMTP entirely — the email body and link will be printed to the
terminal so you can test the flow without any email account.
"""
from flask_mail import Mail, Message
from flask import current_app

mail = Mail()


def init_mail(app):
    """
    Initialize Flask-Mail with the Flask application.
    Call this from app.py create_app().
    """
    mail.init_app(app)


def _console_fallback(subject, recipient, body):
    """Print email content to terminal when mail is suppressed (dev mode)."""
    print("\n" + "=" * 60)
    print("DEV MODE — EMAIL SUPPRESSED (not sent via SMTP)")
    print(f"To:      {recipient}")
    print(f"Subject: {subject}")
    print("-" * 60)
    print(body)
    print("=" * 60 + "\n")


def send_verification_email(user_email, token):
    """
    Send an email verification link to a newly registered user.

    Args:
        user_email (str): The recipient's email address.
        token (str): The verification token from User.generate_verification_token().
    """
    frontend_url = current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:3000')
    verify_link = f"{frontend_url}/verify-email?token={token}"

    subject = "Verify your Amanda account"
    body = (
        f"Welcome to Amanda!\n\n"
        f"Please verify your email address by clicking the link below:\n\n"
        f"{verify_link}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"If you did not create an account, you can safely ignore this email."
    )

    if current_app.config.get('MAIL_SUPPRESS_SEND', True):
        _console_fallback(subject, user_email, body)
        return

    msg = Message(subject=subject, recipients=[user_email], body=body)
    mail.send(msg)


def send_password_reset_email(user_email, token):
    """
    Send a password reset link to a user who requested it.

    Args:
        user_email (str): The recipient's email address.
        token (str): The reset token from User.generate_reset_token().
    """
    frontend_url = current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token}"

    subject = "Reset your Amanda password"
    body = (
        f"You requested a password reset for your Amanda account.\n\n"
        f"Click the link below to set a new password:\n\n"
        f"{reset_link}\n\n"
        f"This link expires in 1 hour.\n\n"
        f"If you did not request this, you can safely ignore this email. "
        f"Your password will not be changed."
    )

    if current_app.config.get('MAIL_SUPPRESS_SEND', True):
        _console_fallback(subject, user_email, body)
        return

    msg = Message(subject=subject, recipients=[user_email], body=body)
    mail.send(msg)

"""
Email verification routes.

POST /api/auth/verify-email       — consume a verification token
POST /api/auth/resend-verification — resend the verification email
"""
from flask import Blueprint, request, jsonify
from database import db
from models.user import User
from services.email_service import send_verification_email
from utils.rate_limiter import rate_limit, RateLimit
from datetime import datetime

email_verification_bp = Blueprint('email_verification', __name__, url_prefix='/api/auth')


@email_verification_bp.route('/verify-email', methods=['POST'])
@rate_limit(RateLimit(10, 60), identity="ip", scope="verify_email")
def verify_email():
    """
    Verify a user's email address using a token.

    Request JSON:
        { "token": "<token_from_email_link>" }

    Response JSON (success 200):
        { "success": true, "message": "Email verified successfully. You can now log in." }

    Response JSON (failure 400):
        { "success": false, "message": "<reason>" }
    """
    try:
        data = request.get_json()
        if not data or 'token' not in data:
            return jsonify({'success': False, 'message': 'Token is required'}), 400

        token = data['token'].strip()

        user = User.query.filter_by(verification_token=token).first()

        if not user:
            return jsonify({'success': False, 'message': 'Invalid or expired verification link'}), 400

        if user.is_verified:
            return jsonify({'success': True, 'message': 'Email already verified. You can log in.'}), 200

        if user.verification_token_expires < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Verification link has expired. Please request a new one.'
            }), 400

        # Mark as verified and clear the token
        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Email verified successfully. You can now log in.'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Email verification error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred during verification'}), 500


@email_verification_bp.route('/resend-verification', methods=['POST'])
@rate_limit(RateLimit(3, 300), identity="ip", scope="resend_verification")
def resend_verification():
    """
    Resend the verification email for an unverified account.
    Rate limited to 3 requests per 5 minutes to prevent abuse.

    Request JSON:
        { "email": "user@example.com" }

    Response JSON (always 200 — never reveals whether the email is registered):
        { "success": true, "message": "..." }
    """
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'success': False, 'message': 'Email is required'}), 400

        email = data['email'].strip().lower()
        user = User.query.filter_by(email=email).first()

        # Only send if the account exists and is not yet verified
        if user and not user.is_verified:
            token = user.generate_verification_token()
            db.session.commit()
            send_verification_email(user.email, token)

        # Always return the same response to prevent email enumeration
        return jsonify({
            'success': True,
            'message': 'If that account exists and is unverified, a new verification email has been sent.'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Resend verification error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500

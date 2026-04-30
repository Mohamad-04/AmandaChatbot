"""
Password reset routes.

POST /api/auth/forgot-password  — request a reset email
POST /api/auth/reset-password   — set a new password using the reset token
"""
from flask import Blueprint, request, jsonify
from database import db
from models.user import User
from services.email_service import send_password_reset_email
from utils.rate_limiter import rate_limit, RateLimit
from datetime import datetime

password_reset_bp = Blueprint('password_reset', __name__, url_prefix='/api/auth')


@password_reset_bp.route('/forgot-password', methods=['POST'])
@rate_limit(RateLimit(3, 300), identity="ip", scope="forgot_password")
def forgot_password():
    """
    Request a password reset email.
    Rate limited to 3 requests per 5 minutes.

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

        if user:
            token = user.generate_reset_token()
            db.session.commit()
            send_password_reset_email(user.email, token)

        # Always return the same response to prevent email enumeration
        return jsonify({
            'success': True,
            'message': 'If that email is registered, a password reset link has been sent.'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Forgot password error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@password_reset_bp.route('/verify-reset-token', methods=['POST'])
@rate_limit(RateLimit(5, 60), identity="ip", scope="verify_reset_token")
def verify_reset_token():
    """
    Validate a password reset token without consuming it.

    Request JSON:
        { "token": "<token>" }

    Response JSON (success 200):
        { "success": true }

    Response JSON (failure 400):
        { "success": false, "message": "<reason>" }
    """
    try:
        data = request.get_json()
        if not data or 'token' not in data:
            return jsonify({'success': False, 'message': 'Token is required'}), 400

        token = data['token'].strip()
        user = User.query.filter_by(reset_token=token).first()

        if not user:
            return jsonify({'success': False, 'message': 'Invalid or expired reset token'}), 400

        if user.reset_token_expires < datetime.utcnow():
            return jsonify({'success': False, 'message': 'Reset token has expired. Please request a new one.'}), 400

        return jsonify({'success': True}), 200

    except Exception as e:
        print(f"Verify reset token error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@password_reset_bp.route('/reset-password', methods=['POST'])
@rate_limit(RateLimit(5, 60), identity="ip", scope="reset_password")
def reset_password():
    """
    Set a new password using a valid reset token.

    Request JSON:
        {
            "token": "<token_from_email_link>",
            "password": "newpassword123"
        }

    Response JSON (success 200):
        { "success": true, "message": "Password reset successfully. You can now log in." }

    Response JSON (failure 400):
        { "success": false, "message": "<reason>" }
    """
    try:
        data = request.get_json()
        if not data or 'token' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Token and new password are required'}), 400

        token = data['token'].strip()
        new_password = data['password']

        if len(new_password) < 8:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 8 characters long'
            }), 400

        user = User.query.filter_by(reset_token=token).first()

        if not user:
            return jsonify({'success': False, 'message': 'Invalid or expired reset link'}), 400

        if user.reset_token_expires < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Reset link has expired. Please request a new one.'
            }), 400

        # Set new password and invalidate the token
        user.set_password(new_password)
        user.clear_reset_token()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Password reset successfully. You can now log in.'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Reset password error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred during password reset'}), 500

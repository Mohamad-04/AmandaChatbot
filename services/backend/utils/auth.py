"""
Shared authentication utilities.
Provides reusable decorators for protecting routes.
"""

from functools import wraps
from flask import session, jsonify


def require_auth(f):
    """
    Decorator to protect routes that require authentication.
    Checks if user_id exists in session.
    Returns 401 if not authenticated.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({
                "message": "Authentication required",
                "success": False
            }), 401

        return f(*args, **kwargs)

    return decorated_function

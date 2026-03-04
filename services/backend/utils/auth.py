"""
Shared authentication utilities.
Provides reusable decorators for protecting routes.
"""

from functools import wraps
from flask import session, jsonify, request


def require_auth(f):
    """
    Decorator to protect routes that require authentication.
    Checks if user_id exists in session.
    Returns 401 if not authenticated.
    OPTIONS preflight requests are passed through so CORS works correctly.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)

        if "user_id" not in session:
            return jsonify({
                "message": "Authentication required",
                "success": False
            }), 401

        return f(*args, **kwargs)

    return decorated_function

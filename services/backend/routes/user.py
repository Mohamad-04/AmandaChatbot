"""
User profile routes.

This file contains endpoints related to the authenticated user's profile.
These routes use the shared `require_auth` decorator from utils/auth.py,
so we don’t duplicate authentication logic across multiple route files.
"""

# Shared authentication decorator (centralised, reused across routes)
from utils.auth import require_auth

# Flask imports
from flask import Blueprint, jsonify, session

# User model (SQLAlchemy)
from models.user import User


# -----------------------------------------------------------------------------
# Blueprint Configuration
# -----------------------------------------------------------------------------
# Blueprint groups user-related endpoints under the /api/user prefix.
# Example endpoint: GET /api/user/profile
# -----------------------------------------------------------------------------
user_bp = Blueprint('user', __name__, url_prefix='/api/user')


# =============================================================================
# GET PROFILE
# =============================================================================
@user_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """
    Get current user's profile information.

    Authentication Flow:
        - `@require_auth` checks if "user_id" exists in the session.
        - If missing, the decorator returns 401 BEFORE this function runs.

    Session:
        - We use `session['user_id']` as the source of truth for who is logged in.
        - This avoids trusting client-side input (more secure).

    Response JSON:
        {
            "id": 1,
            "email": "user@example.com",
            "created_at": "2024-01-01T00:00:00"
        }
    """
    try:
        # ---------------------------------------------------------------------
        # Get the authenticated user's ID from the session
        # require_auth guarantees this exists.
        # ---------------------------------------------------------------------
        user_id = session["user_id"]

        # ---------------------------------------------------------------------
        # Fetch the user record from the database.
        # NOTE:
        # - Your current code uses User.query.get(...)
        # - That works, but in SQLAlchemy 2.x the preferred modern style is:
        #     db.session.get(User, user_id)
        # - We keep your approach to avoid breaking the current structure.
        # ---------------------------------------------------------------------
        user = User.query.get(user_id)

        # ---------------------------------------------------------------------
        # If user_id exists in session but the DB record is missing,
        # something is inconsistent (deleted account, bad session, etc).
        # Return 404 for "User not found".
        # ---------------------------------------------------------------------
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        # ---------------------------------------------------------------------
        # Return safe user info.
        # `to_dict()` should NEVER include password_hash.
        # ---------------------------------------------------------------------
        return jsonify(user.to_dict()), 200

    except Exception as e:
        # ---------------------------------------------------------------------
        # Generic exception catch:
        # If DB query fails or something unexpected happens,
        # we log the error server-side and return a generic error message.
        # ---------------------------------------------------------------------
        print(f"Profile error: {e}")

        return jsonify({
            "success": False,
            "message": "An error occurred fetching profile"
        }), 500

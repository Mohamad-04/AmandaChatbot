"""
User profile routes.
"""
from flask import Blueprint, jsonify, session
from functools import wraps
from models.user import User

# Create blueprint
user_bp = Blueprint('user', __name__, url_prefix='/api/user')


def require_auth(f):
    """
    Decorator to require authentication for routes.
    Checks if user_id exists in session.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        return f(*args, **kwargs)
    return decorated_function


@user_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """
    Get current user's profile information.
    
    Response JSON:
        {
            "id": 1,
            "email": "user@example.com",
            "created_at": "2024-01-01T00:00:00"
        }
    """
    try:
        user = User.query.get(session['user_id'])
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        print(f"Profile error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred fetching profile'
        }), 500

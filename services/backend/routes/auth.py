"""
Authentication routes for user signup, login, logout, and session checking.
"""
from flask import Blueprint, request, jsonify, session
from database import db
from models.user import User
import re

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def is_valid_email(email):
    """
    Validate email format using regex.
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if valid email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user account.
    
    Request JSON:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Response JSON:
        {
            "success": true,
            "message": "Account created successfully",
            "user_id": 1
        }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validate email format
        if not is_valid_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate password length
        if len(password) < 8:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 8 characters long'
            }), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 409
        
        # Create new user
        user = User(email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Auto-login after signup
        session['user_id'] = user.id
        session['email'] = user.email
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Signup error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during signup'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and create session.
    
    Request JSON:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Response JSON:
        {
            "success": true,
            "message": "Login successful",
            "user": {
                "id": 1,
                "email": "user@example.com"
            }
        }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        # Verify credentials
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Create session
        session['user_id'] = user.id
        session['email'] = user.email
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during login'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Destroy user session and logout.
    
    Response JSON:
        {
            "success": true,
            "message": "Logged out successfully"
        }
    """
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during logout'
        }), 500


@auth_bp.route('/check', methods=['GET'])
def check():
    """
    Check if user is authenticated.
    
    Response JSON:
        {
            "authenticated": true,
            "user": {
                "id": 1,
                "email": "user@example.com"
            }
        }
    """
    try:
        if 'user_id' in session:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': session['user_id'],
                    'email': session['email']
                }
            }), 200
        else:
            return jsonify({
                'authenticated': False
            }), 200
    except Exception as e:
        print(f"Auth check error: {e}")
        return jsonify({
            'authenticated': False
        }), 200

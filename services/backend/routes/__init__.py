"""
API routes package.
Contains all REST API endpoint blueprints.
"""
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.user import user_bp

__all__ = ['auth_bp', 'chat_bp', 'user_bp']

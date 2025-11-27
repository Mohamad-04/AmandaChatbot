"""
Chat management routes for creating chats and retrieving messages.
"""
from flask import Blueprint, jsonify, session
from functools import wraps
from database import db
from models.chat import Chat
from models.message import Message
from sqlalchemy import desc

# Create blueprint
chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


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


@chat_bp.route('/list', methods=['GET'])
@require_auth
def list_chats():
    """
    Get all chats for the current user, ordered by most recent activity.
    
    Response JSON:
        {
            "chats": [
                {
                    "id": 1,
                    "title": "My first conversation",
                    "created_at": "2024-01-01T00:00:00",
                    "last_message_time": "2024-01-01T00:05:00"
                },
                ...
            ]
        }
    """
    try:
        user_id = session['user_id']
        
        # Get all chats for this user
        chats = Chat.query.filter_by(user_id=user_id).all()
        
        # Convert to dict and sort by last message time
        chat_list = [chat.to_dict() for chat in chats]
        chat_list.sort(key=lambda x: x['last_message_time'], reverse=True)
        
        return jsonify({
            'chats': chat_list
        }), 200
        
    except Exception as e:
        print(f"List chats error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred fetching chats'
        }), 500


@chat_bp.route('/create', methods=['POST'])
@require_auth
def create_chat():
    """
    Create a new chat for the current user.
    
    Response JSON:
        {
            "chat_id": 1,
            "title": "New Chat",
            "created_at": "2024-01-01T00:00:00"
        }
    """
    try:
        user_id = session['user_id']
        
        # Create new chat
        chat = Chat(user_id=user_id, title='New Chat')
        
        db.session.add(chat)
        db.session.commit()
        
        return jsonify({
            'chat_id': chat.id,
            'title': chat.title,
            'created_at': chat.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create chat error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred creating chat'
        }), 500


@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
@require_auth
def get_messages(chat_id):
    """
    Get all messages for a specific chat.
    Verifies that the chat belongs to the current user.
    
    Args:
        chat_id (int): ID of the chat
        
    Response JSON:
        {
            "messages": [
                {
                    "id": 1,
                    "role": "user",
                    "content": "Hello",
                    "timestamp": "2024-01-01T00:00:00"
                },
                ...
            ]
        }
    """
    try:
        user_id = session['user_id']
        
        # Get chat and verify ownership
        chat = Chat.query.get(chat_id)
        
        if not chat:
            return jsonify({
                'success': False,
                'message': 'Chat not found'
            }), 404
        
        if chat.user_id != user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get all messages for this chat, ordered by timestamp
        messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp).all()
        
        return jsonify({
            'messages': [msg.to_dict() for msg in messages]
        }), 200
        
    except Exception as e:
        print(f"Get messages error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred fetching messages'
        }), 500

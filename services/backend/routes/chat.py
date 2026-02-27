"""
Chat management routes for creating chats and retrieving messages.

This file defines all API endpoints related to chat sessions.
These routes are protected using the shared require_auth decorator,
which ensures that only authenticated users can access chat data.
"""

# Flask imports
from flask import Blueprint, jsonify, session

# Shared authentication decorator (prevents duplication across files)
from utils.auth import require_auth

# Database and models
from database import db
from models.chat import Chat
from models.message import Message


# Blueprint Configuration
# A Blueprint allows us to group related routes together.
# All routes here will be prefixed with /api/chat
# Example: /api/chat/list

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


# LIST CHATS
@chat_bp.route('/list', methods=['GET'])
@require_auth
def list_chats():
    """
    Get all chats for the currently authenticated user.

    Authentication Flow:
        - require_auth decorator ensures 'user_id' exists in session.
        - If not authenticated → returns 401 before entering this function.

    Returns:
        JSON list of chats ordered by most recent activity.
    """
    try:
        # Get user ID from session
        # The session is stored server-side (filesystem session).
        # require_auth guarantees this key exists.
        user_id = session["user_id"]

        # Query all chats belonging to this specific user
        # This ensures users cannot see other users' chats.
      
        chats = Chat.query.filter_by(user_id=user_id).all()

       
        # Convert SQLAlchemy objects to dictionary format for JSON response.
        # We then sort by last message time (most recent first).
     
        chat_list = [chat.to_dict() for chat in chats]
        chat_list.sort(key=lambda x: x["last_message_time"], reverse=True)

      
        # Return successful response
        # 200 = OK
   
        return jsonify({
            "success": True,
            "chats": chat_list
        }), 200

    except Exception as e:
       
        # If anything fails (database error, unexpected issue),
        # we log it and return a generic error response.
    
        print(f"List chats error: {e}")

        return jsonify({
            "success": False,
            "message": "An error occurred fetching chats"
        }), 500  # 500 = Internal Server Error



# CREATE CHAT

@chat_bp.route('/create', methods=['POST'])
@require_auth
def create_chat():
    """
    Create a new chat for the currently authenticated user.

    The chat is initially given a default title "New Chat".
    The title can later be updated based on the first message.
    """
    try:
        # Get authenticated user ID
        user_id = session["user_id"]

      
        # Create new Chat model instance
        # The relationship is enforced via user_id foreign key.
     
        chat = Chat(user_id=user_id, title="New Chat")

        # Add to session and commit to database
        db.session.add(chat)
        db.session.commit()

        # Return created chat information
        # 201 = Resource Created
        return jsonify({
            "success": True,
            "chat_id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat()
        }), 201

    except Exception as e:
      
        # If commit fails, rollback is critical.
        # Prevents partial writes and keeps DB consistent.
      
        db.session.rollback()

        print(f"Create chat error: {e}")

        return jsonify({
            "success": False,
            "message": "An error occurred creating chat"
        }), 500



# GET CHAT MESSAGES

@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
@require_auth
def get_messages(chat_id):
    """
    Retrieve all messages for a specific chat.

    Security Measures:
        1. User must be authenticated.
        2. Chat must exist.
        3. Chat must belong to the requesting user.

    Args:
        chat_id (int): ID of the chat to retrieve messages from.
    """
    try:
        # Get authenticated user ID
        user_id = session["user_id"]

      
        # Retrieve chat from database.
        # db.session.get() is the modern SQLAlchemy 2.x approach.
    
        chat = db.session.get(Chat, chat_id)

        # If chat does not exist
        if not chat:
            return jsonify({
                "success": False,
                "message": "Chat not found"
            }), 404  # 404 = Not Found

    
        # Ownership validation
        # This prevents users from accessing chats that do not belong to them.
        # Critical for data security.
    
        if chat.user_id != user_id:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403  # 403 = Forbidden

        # ---------------------------------------------------------------------
        # Fetch all messages belonging to this chat.
        # Ordered chronologically by timestamp.
        # ---------------------------------------------------------------------
        messages = (
            Message.query
            .filter_by(chat_id=chat_id)
            .order_by(Message.timestamp)
            .all()
        )

        # Convert message objects to JSON-safe dictionaries
        return jsonify({
            "success": True,
            "messages": [msg.to_dict() for msg in messages]
        }), 200

    except Exception as e:
        print(f"Get messages error: {e}")

        return jsonify({
            "success": False,
            "message": "An error occurred fetching messages"
        }), 500

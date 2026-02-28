"""
WebSocket chat handler for real-time streaming chat functionality.
Handles message sending and AI response streaming via Socket.IO.
"""
from flask_socketio import emit, disconnect
from flask import session, request
from database import db
from models.chat import Chat
from models.message import Message
from services.grpc_client import GRPCClient
from config import get_config
from utils.rate_limiter import socket_rate_limit, RateLimit


def require_auth(f):
    """
    Decorator to require authentication for WebSocket events.
    Checks if user_id exists in session.
    """
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            emit('error', {'message': 'Authentication required'})
            disconnect()
            return
        return f(*args, **kwargs)
    return decorated_function


def register_handlers(socketio):
    """
    Register all WebSocket event handlers with the SocketIO instance.
    
    Args:
        socketio: Flask-SocketIO instance
    """
    
    @socketio.on('connect')
    def handle_connect():
        """
        Handle client connection.
        Verify authentication via session.
        """
        if 'user_id' not in session:
            print("WebSocket connection rejected: Not authenticated")
            return False  # Reject connection
        
        print(f"WebSocket connected: User {session['user_id']}")
        return True
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection."""
        if 'user_id' in session:
            print(f"WebSocket disconnected: User {session['user_id']}")
    
    @socketio.on('send_message')
    @require_auth
    @socket_rate_limit(RateLimit(20, 60), identity="user", scope="chat_send")
    def handle_send_message(data):
        """
        Handle incoming chat message from client.
        
        This function:
        1. Validates the message data
        2. Verifies chat ownership
        3. Saves user message to database
        4. Streams AI response via gRPC
        5. Emits response tokens in real-time
        6. Saves assistant message to database
        
        Args:
            data (dict): {
                'chat_id': int,
                'message': str
            }
        
        Emits:
            'message_token': {text: str} - For each chunk of AI response
            'message_complete': {message_id: int, full_text: str} - When done
            'error': {message: str} - On any error
        """
        try:
            user_id = session['user_id']
            
            # Validate input
            if not data or 'chat_id' not in data or 'message' not in data:
                emit('error', {'message': 'Invalid message data'})
                return
            
            chat_id = data['chat_id']
            message_text = data['message'].strip()
            
            if not message_text:
                emit('error', {'message': 'Message cannot be empty'})
                return
            
            # Verify chat exists and belongs to user
            chat = Chat.query.get(chat_id)
            
            if not chat:
                emit('error', {'message': 'Chat not found'})
                return
            
            if chat.user_id != user_id:
                emit('error', {'message': 'Access denied'})
                return
            
            # Save user message to database
            user_message = Message(
                chat_id=chat_id,
                role=Message.ROLE_USER,
                content=message_text
            )
            db.session.add(user_message)
            db.session.commit()
            
            # Update chat title if this is the first message
            message_count = Message.query.filter_by(chat_id=chat_id).count()
            if message_count == 1:  # Only user message so far
                chat.update_title_from_first_message()
                db.session.commit()
            
            # Stream response from AI backend via gRPC
            config = get_config()
            grpc_client = GRPCClient(
                host=config.GRPC_AI_BACKEND_HOST,
                port=config.GRPC_AI_BACKEND_PORT
            )
            
            full_response = ""
            
            try:
                # Stream each chunk from the AI
                for chunk in grpc_client.stream_chat(
                    user_id=str(user_id),
                    chat_id=str(chat_id),
                    message=message_text
                ):
                    # Emit token to client
                    emit('message_token', {'text': chunk})
                    full_response += chunk
                
                # Save assistant message to database
                assistant_message = Message(
                    chat_id=chat_id,
                    role=Message.ROLE_ASSISTANT,
                    content=full_response
                )
                db.session.add(assistant_message)
                db.session.commit()
                
                # Emit completion event
                emit('message_complete', {
                    'message_id': assistant_message.id,
                    'full_text': full_response
                })
                
            except Exception as grpc_error:
                print(f"gRPC streaming error: {grpc_error}")
                emit('error', {
                    'message': 'AI service unavailable. Please try again later.'
                })
                
            finally:
                grpc_client.close()
            
        except Exception as e:
            print(f"WebSocket message error: {e}")
            db.session.rollback()
            emit('error', {
                'message': 'An error occurred processing your message'
            })

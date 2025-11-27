"""
Main Flask application for Amanda Backend.
This is the entry point that initializes all services and starts the server.
"""
from flask import Flask, session
from flask_socketio import SocketIO
from flask_session import Session
from flask_cors import CORS
import os

# Import configuration
from config import get_config

# Import database initialization
from database import db, init_db

# Import route blueprints
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.user import user_bp

# Import WebSocket handlers
from websocket.chat_handler import register_handlers
from websocket.voice_handler import register_voice_handlers


def create_app():
    """
    Application factory pattern.
    Creates and configures the Flask application.
    
    Returns:
        tuple: (Flask app, SocketIO instance)
    """
    # Create Flask application
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Initialize session handling
    Session(app)
    
    # Initialize CORS for cross-origin requests
    CORS(app, 
         origins=config.CORS_ORIGINS,
         supports_credentials=True,
         allow_headers=['Content-Type'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Initialize database
    init_db(app)
    
    # Register API blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(user_bp)
    
    # Initialize SocketIO for WebSocket support
    socketio = SocketIO(
        app,
        cors_allowed_origins=config.CORS_ORIGINS,
        manage_session=False,  # We manage sessions ourselves
        async_mode='threading'  # Use threading for Python 3.12+ compatibility
    )
    
    # Register WebSocket event handlers
    register_handlers(socketio)
    register_voice_handlers(socketio)
    
    # Root endpoint for health check
    @app.route('/')
    def index():
        return {
            'service': 'Amanda Backend',
            'status': 'running',
            'version': '1.0.0'
        }, 200
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200
    
    return app, socketio


def main():
    """
    Main entry point.
    Creates and runs the Flask application with SocketIO.
    """
    # Create application
    app, socketio = create_app()
    
    # Get configuration
    config = get_config()
    
    print("=" * 60)
    print("Amanda Backend Server")
    print("=" * 60)
    print(f"Environment: {config.FLASK_ENV}")
    print(f"Host: {config.FLASK_HOST}")
    print(f"Port: {config.FLASK_PORT}")
    print(f"Database: {config.DATABASE_URL}")
    print(f"AI Backend: {config.GRPC_AI_BACKEND_HOST}:{config.GRPC_AI_BACKEND_PORT}")
    print("=" * 60)
    print("Server starting...")
    print("Press CTRL+C to quit")
    print("=" * 60)
    
    # Run the application with SocketIO
    socketio.run(
        app,
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=(config.FLASK_ENV == 'development'),
        use_reloader=False,  # Disable reloader to prevent double initialization
        allow_unsafe_werkzeug=True  # Allow Werkzeug for development/demo purposes
    )


if __name__ == '__main__':
    main()

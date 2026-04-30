"""
Main Flask application for Amanda Backend.
This is the entry point that initializes all services and starts the server.
"""
from flask import Flask, session
from flask_socketio import SocketIO
from flask_session import Session
from flask_cors import CORS
import os
import re

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

# Import configuration
from config import get_config

# Import database initialization
from database import db, init_db

# Import route blueprints
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.user import user_bp
from routes.email_verification import email_verification_bp
from routes.password_reset import password_reset_bp
from routes.admin import admin_bp
from routes.admin_api import admin_api_bp
from routes.admin_spa import admin_spa_bp
from routes.frontend import frontend_bp

# Import WebSocket handlers
from websocket.chat_handler import register_handlers
from websocket.voice_handler import register_voice_handlers

# Import email service
from services.email_service import init_mail


def create_app():
    """
    Application factory pattern.
    Creates and configures the Flask application.
    
    Returns:
        tuple: (Flask app, SocketIO instance)
    """
    # Create Flask application — static folder serves frontend assets at /static/
    app = Flask(
        __name__,
        static_folder=os.path.join(FRONTEND_DIR, 'static'),
        static_url_path='/static'
    )
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)

    # Initialize database first so Flask-Session can use our db instance
    init_db(app)

    # Give Flask-Session our existing SQLAlchemy instance (avoids double-registration)
    if config.SESSION_TYPE == 'sqlalchemy':
        app.config['SESSION_SQLALCHEMY'] = db

    # Initialize session handling
    Session(app)

    # CORS — allow localhost and any local network IP in dev
    CORS(app,
         origins=re.compile(r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?"),
         supports_credentials=True,
         allow_headers=["Content-Type"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    cors_origins = config.CORS_ORIGINS

    # Initialize email service
    init_mail(app)

    # Register API blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(email_verification_bp)
    app.register_blueprint(password_reset_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(admin_api_bp)
    app.register_blueprint(admin_spa_bp)
    # Frontend must be registered last — its catch-all serves all non-API paths
    app.register_blueprint(frontend_bp)

    # Initialize SocketIO for WebSocket support
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        manage_session=False,
        async_mode=config.SOCKETIO_ASYNC_MODE
    )

    # Register WebSocket event handlers
    register_handlers(socketio)
    register_voice_handlers(socketio)
    
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
    
    is_dev = config.FLASK_ENV == 'development'

    # Run the application with SocketIO
    socketio.run(
        app,
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=is_dev,
        use_reloader=False,
        allow_unsafe_werkzeug=is_dev,
        ssl_context=None
    )


if __name__ == '__main__':
    main()

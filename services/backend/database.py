"""
Database initialization and configuration module.
Sets up SQLAlchemy with Flask application.
"""
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
# This will be configured with the Flask app in app.py
db = SQLAlchemy()


def init_db(app):
    """
    Initialize the database with the Flask application.
    This function configures SQLAlchemy and creates all tables.
    
    Args:
        app: The Flask application instance
    """
    # Initialize the database with app context
    db.init_app(app)
    
    # Create all tables within application context
    with app.app_context():
        # Import all models to ensure they are registered with SQLAlchemy
        from models.user import User
        from models.chat import Chat
        from models.message import Message
        
        # Create all tables
        db.create_all()
        
        print("Database initialized successfully")
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

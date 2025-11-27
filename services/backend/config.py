"""
Configuration module for Amanda Backend.
Loads environment variables and provides configuration settings.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """
    Configuration class that holds all application settings.
    All sensitive data should be loaded from environment variables.
    """
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///amanda.db')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # AI Backend gRPC Configuration
    GRPC_AI_BACKEND_HOST = os.getenv('GRPC_AI_BACKEND_HOST', 'localhost')
    GRPC_AI_BACKEND_PORT = int(os.getenv('GRPC_AI_BACKEND_PORT', 50051))
    
    # Session Configuration
    SESSION_TYPE = os.getenv('SESSION_TYPE', 'filesystem')
    SESSION_PERMANENT = os.getenv('SESSION_PERMANENT', 'False').lower() == 'true'
    SESSION_USE_SIGNER = os.getenv('SESSION_USE_SIGNER', 'True').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8000').split(',')
    CORS_SUPPORTS_CREDENTIALS = True
    
    @classmethod
    def validate(cls):
        """
        Validate that all required configuration variables are set.
        Raises ValueError if any required variable is missing.
        """
        required_vars = ['SECRET_KEY']
        missing = [var for var in required_vars if not getattr(cls, var)]
        
        if missing:
            raise ValueError(f"Missing required configuration variables: {', '.join(missing)}")
        
        if cls.SECRET_KEY == 'dev-secret-key-change-in-production' and cls.FLASK_ENV == 'production':
            raise ValueError("SECRET_KEY must be changed in production environment")


def get_config():
    """
    Get the configuration object and validate it.
    
    Returns:
        Config: The validated configuration object
    """
    Config.validate()
    return Config

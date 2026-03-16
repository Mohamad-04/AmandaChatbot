"""
User model for authentication and user management.
"""
from datetime import datetime, timedelta
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from database import db


class User(db.Model):
    """
    User model representing registered users in the system.
    
    Attributes:
        id (int): Primary key, auto-incremented
        email (str): Unique email address for the user
        password_hash (str): Hashed password (never store plain text!)
        created_at (datetime): Timestamp when user was created
        chats (relationship): One-to-many relationship with Chat model
    """
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Email verification
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(64), nullable=True, index=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)

    # Password reset
    reset_token = db.Column(db.String(64), nullable=True, index=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    # Relationships
    chats = db.relationship('Chat', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """
        Hash and set the user's password.
        Uses Werkzeug's security functions with bcrypt.
        
        Args:
            password (str): Plain text password
        """
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """
        Verify a password against the stored hash.
        
        Args:
            password (str): Plain text password to verify
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)
    
    def generate_verification_token(self):
        """
        Generate a new email verification token valid for 24 hours.
        Stores it on the model; caller must db.session.commit().

        Returns:
            str: The plain token string to embed in the verification link.
        """
        token = secrets.token_urlsafe(32)
        self.verification_token = token
        self.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        return token

    def generate_reset_token(self):
        """
        Generate a new password reset token valid for 1 hour.
        Stores it on the model; caller must db.session.commit().

        Returns:
            str: The plain token string to embed in the reset link.
        """
        token = secrets.token_urlsafe(32)
        self.reset_token = token
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return token

    def clear_reset_token(self):
        """
        Invalidate the reset token after successful use.
        Caller must db.session.commit().
        """
        self.reset_token = None
        self.reset_token_expires = None

    def to_dict(self):
        """
        Convert user object to dictionary for API responses.
        Never include password_hash in the response!

        Returns:
            dict: User data safe for API responses
        """
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_verified': self.is_verified
        }
    
    def __repr__(self):
        return f'<User {self.email}>'

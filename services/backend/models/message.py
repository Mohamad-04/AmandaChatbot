"""
Message model for storing chat messages.
"""
from datetime import datetime
from database import db


class Message(db.Model):
    """
    Message model representing individual messages in a chat.
    
    Attributes:
        id (int): Primary key, auto-incremented
        chat_id (int): Foreign key to chats table
        role (str): Message sender role ('user' or 'assistant')
        content (str): Message text content
        timestamp (datetime): When the message was created
        chat (relationship): Many-to-one relationship with Chat model
    """
    
    __tablename__ = 'messages'
    
    # Role constants
    ROLE_USER = 'user'
    ROLE_ASSISTANT = 'assistant'
    VALID_ROLES = [ROLE_USER, ROLE_ASSISTANT]
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    chat = db.relationship('Chat', back_populates='messages')
    
    def __init__(self, chat_id, role, content):
        """
        Initialize a new message.
        
        Args:
            chat_id (int): ID of the chat this message belongs to
            role (str): Message role ('user' or 'assistant')
            content (str): Message text content
            
        Raises:
            ValueError: If role is not valid
        """
        if role not in self.VALID_ROLES:
            raise ValueError(f"Invalid role: {role}. Must be one of {self.VALID_ROLES}")
        
        self.chat_id = chat_id
        self.role = role
        self.content = content
    
    def to_dict(self):
        """
        Convert message object to dictionary for API responses.
        
        Returns:
            dict: Message data for API responses
        """
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat()
        }
    
    def __repr__(self):
        preview = self.content[:30] + '...' if len(self.content) > 30 else self.content
        return f'<Message {self.id} ({self.role}): {preview}>'

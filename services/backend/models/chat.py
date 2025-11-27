"""
Chat model for managing conversation sessions.
"""
from datetime import datetime
from database import db


class Chat(db.Model):
    """
    Chat model representing a conversation session between user and AI.
    
    Attributes:
        id (int): Primary key, auto-incremented
        user_id (int): Foreign key to users table
        title (str): Chat title (auto-generated from first message)
        created_at (datetime): Timestamp when chat was created
        user (relationship): Many-to-one relationship with User model
        messages (relationship): One-to-many relationship with Message model
    """
    
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(100), nullable=False, default='New Chat')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='chats')
    messages = db.relationship('Message', back_populates='chat', lazy='dynamic', 
                              cascade='all, delete-orphan', order_by='Message.timestamp')
    
    def update_title_from_first_message(self):
        """
        Update chat title based on the first user message.
        Takes the first 40 characters of the first message as the title.
        """
        first_message = self.messages.filter_by(role='user').first()
        if first_message:
            # Take first 40 characters, add ellipsis if longer
            content = first_message.content
            if len(content) > 40:
                self.title = content[:40] + '...'
            else:
                self.title = content
    
    def get_last_message_time(self):
        """
        Get the timestamp of the most recent message in this chat.
        
        Returns:
            datetime: Timestamp of last message, or created_at if no messages
        """
        last_message = self.messages.order_by(db.desc('timestamp')).first()
        if last_message:
            return last_message.timestamp
        return self.created_at
    
    def to_dict(self, include_messages=False):
        """
        Convert chat object to dictionary for API responses.
        
        Args:
            include_messages (bool): Whether to include full message list
            
        Returns:
            dict: Chat data for API responses
        """
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'last_message_time': self.get_last_message_time().isoformat()
        }
        
        if include_messages:
            data['messages'] = [msg.to_dict() for msg in self.messages]
        
        return data
    
    def __repr__(self):
        return f'<Chat {self.id}: {self.title}>'

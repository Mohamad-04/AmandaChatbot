# Amanda Backend Service

The Amanda Backend is a Flask-based REST API and WebSocket server that handles user authentication, chat management, and real-time communication with the AI service.

## Features

- **User Authentication**: Session-based authentication with secure password hashing
- **Chat Management**: Create and manage conversation sessions
- **Real-time Messaging**: WebSocket support for streaming AI responses
- **Database**: SQLite with SQLAlchemy ORM
- **gRPC Integration**: Communicates with AI Backend for intelligent responses

## Architecture

```
backend/
├── app.py                  # Main Flask application
├── config.py              # Configuration management
├── database.py            # Database initialization
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
│
├── models/               # Database models
│   ├── user.py          # User model
│   ├── chat.py          # Chat model
│   └── message.py       # Message model
│
├── routes/              # REST API endpoints
│   ├── auth.py         # Authentication routes
│   ├── chat.py         # Chat management routes
│   └── user.py         # User profile routes
│
├── services/           # Business logic services
│   ├── grpc_client.py # gRPC client for AI Backend
│   └── auth_service.py # Password hashing utilities
│
└── websocket/          # WebSocket handlers
    └── chat_handler.py # Real-time chat handling
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- AI Backend service running (see `../ai_backend/README.md`)

### Installation

1. **Navigate to the backend directory**:
   ```bash
   cd services/backend
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your configuration:
   - `SECRET_KEY`: Change this to a random secret key for production
   - `GRPC_AI_BACKEND_HOST`: AI Backend host (default: localhost)
   - `GRPC_AI_BACKEND_PORT`: AI Backend port (default: 50051)
   - Other settings as needed

5. **Run the server**:
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000` by default.

### Database

The database is automatically created on first run. It uses SQLite by default, creating an `amanda.db` file in the backend directory.

To reset the database, simply delete `amanda.db` and restart the server.

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user_id": 1
}
```

#### POST `/api/auth/login`
Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/logout`
Destroy user session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/check`
Check authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### User Endpoints

#### GET `/api/user/profile`
Get current user's profile (requires authentication).

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-01-01T00:00:00"
}
```

### Chat Endpoints

#### GET `/api/chat/list`
Get all chats for current user (requires authentication).

**Response:**
```json
{
  "chats": [
    {
      "id": 1,
      "title": "My first conversation",
      "created_at": "2024-01-01T00:00:00",
      "last_message_time": "2024-01-01T00:05:00"
    }
  ]
}
```

#### POST `/api/chat/create`
Create a new chat (requires authentication).

**Response:**
```json
{
  "chat_id": 1,
  "title": "New Chat",
  "created_at": "2024-01-01T00:00:00"
}
```

#### GET `/api/chat/<chat_id>/messages`
Get all messages in a chat (requires authentication).

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Hello!",
      "timestamp": "2024-01-01T00:00:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Hi! How can I help you?",
      "timestamp": "2024-01-01T00:00:05"
    }
  ]
}
```

## WebSocket Events

Connect to: `ws://localhost:5000/socket.io/`

### Client → Server Events

#### `send_message`
Send a chat message.

**Payload:**
```json
{
  "chat_id": 1,
  "message": "Hello, Amanda!"
}
```

### Server → Client Events

#### `message_token`
Streaming token from AI response.

**Payload:**
```json
{
  "text": "Hello"
}
```

#### `message_complete`
AI response completed.

**Payload:**
```json
{
  "message_id": 2,
  "full_text": "Hello! How can I help you today?"
}
```

#### `error`
Error occurred.

**Payload:**
```json
{
  "message": "Error description"
}
```

## Database Schema

### Users Table
| Column        | Type         | Description                |
|---------------|--------------|----------------------------|
| id            | INTEGER      | Primary key (auto-increment)|
| email         | STRING(255)  | Unique email address       |
| password_hash | STRING(255)  | Hashed password            |
| created_at    | DATETIME     | Account creation time      |

### Chats Table
| Column     | Type         | Description                    |
|------------|--------------|--------------------------------|
| id         | INTEGER      | Primary key (auto-increment)   |
| user_id    | INTEGER      | Foreign key → users.id         |
| title      | STRING(100)  | Chat title                     |
| created_at | DATETIME     | Chat creation time             |

### Messages Table
| Column    | Type         | Description                     |
|-----------|--------------|--------------------------------|
| id        | INTEGER      | Primary key (auto-increment)    |
| chat_id   | INTEGER      | Foreign key → chats.id          |
| role      | STRING(20)   | 'user' or 'assistant'           |
| content   | TEXT         | Message content                 |
| timestamp | DATETIME     | Message timestamp               |

## Development Guide

### Adding New Routes

1. Create a new blueprint in `routes/` directory
2. Define your routes using Flask decorators
3. Register the blueprint in `app.py`

Example:
```python
# routes/my_route.py
from flask import Blueprint, jsonify

my_bp = Blueprint('my_route', __name__, url_prefix='/api/my')

@my_bp.route('/endpoint', methods=['GET'])
def my_endpoint():
    return jsonify({'message': 'Hello!'})

# In app.py
from routes.my_route import my_bp
app.register_blueprint(my_bp)
```

### Adding New Models

1. Create a new model class in `models/` directory
2. Inherit from `db.Model`
3. Define table name and columns
4. Import in `database.py` for table creation

Example:
```python
from database import db

class MyModel(db.Model):
    __tablename__ = 'my_table'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
```

### Security Considerations

- **Passwords**: Always hashed using PBKDF2-SHA256
- **Sessions**: Secured with secret key and signed cookies
- **CORS**: Configured for specific origins only
- **SQL Injection**: Prevented by SQLAlchemy ORM
- **Authentication**: Required for all protected routes

### Testing

To test the API, you can use:
- **curl**: Command-line HTTP client
- **Postman**: GUI API testing tool
- **Python requests**: Programmatic testing

Example curl request:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Database errors
- Delete `amanda.db` and restart to reset database
- Check file permissions on the database file

### Connection refused to AI Backend
- Ensure AI Backend service is running on port 50051
- Check `GRPC_AI_BACKEND_HOST` and `GRPC_AI_BACKEND_PORT` in `.env`

### Session issues
- Clear browser cookies
- Check `SECRET_KEY` is set in `.env`
- Ensure `SESSION_TYPE` is set correctly

### WebSocket connection fails
- Check CORS settings in `.env`
- Ensure frontend is connecting to correct URL
- Verify authentication before connecting

## Future Enhancements

Students can extend this backend with:

- **JWT Authentication**: Replace sessions with token-based auth
- **PostgreSQL**: Migrate from SQLite to production database
- **Rate Limiting**: Prevent abuse with request throttling
- **Caching**: Add Redis for session and data caching
- **File Uploads**: Support image/file sharing in chats
- **Email Verification**: Verify user email addresses
- **Password Reset**: Email-based password recovery
- **Admin Panel**: Manage users and monitor activity
- **Analytics**: Track usage patterns and metrics
- **Testing**: Add unit and integration tests

## License

Educational project - feel free to modify and extend!

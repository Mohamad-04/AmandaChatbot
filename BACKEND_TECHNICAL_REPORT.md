# Backend Service - Technical Report

## Executive Summary

The Backend service is a Flask-based REST API and WebSocket server that provides user management, authentication, chat persistence, and real-time communication capabilities. It acts as the central orchestration layer between the Frontend and AI Backend, managing all business logic, database operations, and message streaming.

---

## 1. Service Overview

**Service Type:** REST API + WebSocket Server
**Primary Language:** Python 3.9+
**Framework:** Flask 3.0.0
**Port:** 5000 (configurable)
**Database:** SQLite (development), PostgreSQL-ready architecture
**Protocol:** HTTP/REST + WebSocket (Socket.IO)

---

## 2. Technologies & Dependencies

### Core Web Framework
- **Flask 3.0.0** - Lightweight, flexible Python web framework
- **Werkzeug 3.0.1** - WSGI utilities, development server, password hashing

### Real-time Communication
- **Flask-SocketIO 5.3.5** - WebSocket support for real-time bidirectional communication
- **python-socketio 5.10.0** - Socket.IO protocol implementation
- **Async Mode:** Threading (Python 3.12+ compatible)

### Database & ORM
- **Flask-SQLAlchemy 3.1.1** - SQL toolkit and ORM for database operations
- **SQLAlchemy** - Object-Relational Mapping with relationship management
- **Database:** SQLite (default: `amanda.db`)

### Session Management
- **Flask-Session 0.8.0** - Server-side session storage
- **cachelib 0.13.0** - Session caching support
- **Session Type:** Filesystem-based (production: consider Redis)

### Security
- **bcrypt 4.1.2** - Password hashing (PBKDF2-SHA256 via Werkzeug)
- **Flask-CORS 4.0.0** - Cross-Origin Resource Sharing middleware

### Inter-Service Communication
- **grpcio >= 1.60.0** - gRPC client for AI Backend communication
- **protobuf >= 3.20.3, < 5.0.0** - Protocol buffer message handling

### Configuration
- **python-dotenv 1.0.0** - Environment variable management from `.env` files

---

## 3. Architecture & Design Patterns

### 3.1 Application Factory Pattern

```python
# app.py
def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize extensions
    init_db(app)           # SQLAlchemy
    init_socketio(app)     # Socket.IO
    init_cors(app)         # CORS
    init_session(app)      # Session management

    # Register blueprints
    register_blueprints(app)

    return app
```

**Benefits:**
- Easy testing with different configurations
- Clean separation of concerns
- Modular component initialization
- Multiple app instances support

### 3.2 Blueprint Organization

**Modular Route Structure:**

```
routes/
├── auth.py     # Authentication endpoints (signup, login, logout)
├── user.py     # User profile management
└── chat.py     # Chat and message operations
```

Each blueprint handles a specific domain with clear responsibility boundaries.

### 3.3 Service Layer Pattern

```
services/
├── auth_service.py    # Password hashing/verification
└── grpc_client.py     # AI Backend communication
```

Business logic separated from route handlers for:
- Reusability across endpoints
- Easier testing
- Clear dependency management

### 3.4 Database Models with Relationships

```
User (1) ──────< Chats (M)
              │
              │
              └──────< Messages (M)
```

**Cascade Behavior:**
- Deleting a user → deletes all chats and messages
- Deleting a chat → deletes all messages
- Referential integrity enforced at database level

---

## 4. Features

### 4.1 User Authentication & Management

✅ **User Registration**
- Email validation (unique constraint)
- Password strength requirements
- Secure password hashing (PBKDF2-SHA256)
- Automatic timestamp tracking

✅ **User Login**
- Email/password authentication
- Session creation with secure cookies
- Password verification against hash
- Error handling for invalid credentials

✅ **Session Management**
- Server-side session storage (filesystem)
- HTTP-only cookies for security
- SameSite policy for CSRF protection
- Session signing with secret key
- Automatic session expiry

✅ **User Profile**
- Retrieve current user information
- Email and account creation date
- Authentication-protected endpoint

✅ **Logout**
- Session termination
- Cookie cleanup
- Graceful state reset

### 4.2 Chat Management

✅ **Chat Creation**
- Create new conversation sessions
- Default title: "New Chat"
- Automatic user association
- Unique chat ID generation

✅ **Chat Listing**
- Retrieve all user's chats
- Ordered by most recent activity
- Includes chat metadata (title, timestamps)
- User-specific isolation

✅ **Message History**
- Fetch all messages in a chat
- Ordered chronologically
- User/assistant role differentiation
- Chat ownership verification

✅ **Automatic Title Generation**
- Generates title from first user message
- 40-character limit with ellipsis
- Smart truncation at word boundaries
- Updates chat on first interaction

### 4.3 Real-time Communication

✅ **Text Chat Streaming**
- WebSocket-based message delivery
- Token-by-token AI response streaming
- Real-time status updates
- Message persistence during streaming

✅ **Voice Chat Support**
- Voice message upload and processing
- Automatic Speech Recognition (ASR)
- Text-to-Speech (TTS) synthesis
- Base64 audio encoding/decoding
- Multiple audio format support (WebM, MP3, WAV)

✅ **WebSocket Events**
- Connection management with authentication
- Disconnect handling
- Error propagation to client
- Concurrent user support

### 4.4 Database Persistence

✅ **Message Storage**
- All messages saved to database
- User and assistant messages
- Timestamps for all interactions
- Full conversation history

✅ **User Data Management**
- Secure password storage
- Email uniqueness enforcement
- Created timestamp tracking
- Cascade delete for data cleanup

✅ **Transaction Management**
- Automatic rollback on errors
- ACID compliance
- Database session management

---

## 5. API Endpoints

### 5.1 Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user account |
| POST | `/api/auth/login` | ❌ | Authenticate and create session |
| POST | `/api/auth/logout` | ❌ | Destroy current session |
| GET | `/api/auth/check` | ❌ | Verify authentication status |

#### Endpoint Details

**POST /api/auth/signup**
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (201):
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-11-23T10:30:00Z"
  }
}

Errors:
400 - Email/password missing
400 - User already exists
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (200):
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-11-23T10:30:00Z"
  }
}

Errors:
400 - Email/password missing
401 - Invalid credentials
```

**POST /api/auth/logout**
```json
Response (200):
{
  "message": "Logged out successfully"
}
```

**GET /api/auth/check**
```json
Response (200) - Authenticated:
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}

Response (200) - Not authenticated:
{
  "authenticated": false
}
```

### 5.2 User Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/user/profile` | ✅ | Get current user's profile |

**GET /api/user/profile**
```json
Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2025-11-23T10:30:00Z"
}

Errors:
401 - Not authenticated
```

### 5.3 Chat Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/chat/list` | ✅ | List all user's chats |
| POST | `/api/chat/create` | ✅ | Create new chat |
| GET | `/api/chat/<chat_id>/messages` | ✅ | Get messages in chat |

**GET /api/chat/list**
```json
Response (200):
{
  "chats": [
    {
      "id": 1,
      "title": "Relationship advice",
      "created_at": "2025-11-23T10:30:00Z",
      "message_count": 12,
      "last_message_time": "2025-11-23T11:45:00Z"
    }
  ]
}

Note: Ordered by most recent activity
```

**POST /api/chat/create**
```json
Response (201):
{
  "id": 2,
  "title": "New Chat",
  "created_at": "2025-11-23T12:00:00Z"
}
```

**GET /api/chat/<chat_id>/messages**
```json
Response (200):
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Hello Amanda",
      "timestamp": "2025-11-23T10:35:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Hello! How can I help you today?",
      "timestamp": "2025-11-23T10:35:02Z"
    }
  ]
}

Errors:
401 - Not authenticated
403 - Chat doesn't belong to user
404 - Chat not found
```

### 5.4 Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root health check |
| GET | `/health` | Service health status |

---

## 6. WebSocket Events

### 6.1 Chat Events (Text)

**Namespace:** Default (`/`)

#### Client → Server Events

**`connect`**
- **Trigger:** Client establishes WebSocket connection
- **Auth:** Requires active session
- **Response:** Emits confirmation or disconnects if not authenticated

**`send_message`**
- **Payload:**
  ```json
  {
    "chat_id": 1,
    "message": "I need relationship advice"
  }
  ```
- **Validation:**
  - chat_id required (integer)
  - message required (non-empty string)
  - Chat ownership verification
- **Process:**
  1. Save user message to database
  2. Update chat title if first message
  3. Stream AI response via gRPC
  4. Save assistant message
  5. Return message IDs

#### Server → Client Events

**`message_token`**
- **Payload:**
  ```json
  {
    "text": "I understand"
  }
  ```
- **Purpose:** Stream individual response tokens in real-time
- **Frequency:** Multiple emissions per response

**`message_complete`**
- **Payload:**
  ```json
  {
    "message_id": 42,
    "full_text": "Complete AI response text here..."
  }
  ```
- **Purpose:** Signal response completion and provide full text
- **Trigger:** After all tokens streamed

**`error`**
- **Payload:**
  ```json
  {
    "message": "Error description"
  }
  ```
- **Triggers:**
  - Missing required fields
  - Chat ownership violation
  - gRPC communication failure
  - Database errors

### 6.2 Voice Events

**Note:** Voice features require VoiceService integration from AI Backend

#### Client → Server Events

**`send_voice_message`**
- **Payload:**
  ```json
  {
    "chat_id": 1,
    "audio": "base64_encoded_audio_data",
    "format": "webm"
  }
  ```
- **Supported Formats:** webm, mp3, wav, ogg
- **Process:**
  1. Decode base64 audio
  2. Transcribe using ASR
  3. Save transcription as user message
  4. Generate AI response
  5. Synthesize speech using TTS
  6. Return audio response

**`text_to_speech`**
- **Payload:**
  ```json
  {
    "text": "Text to convert to speech",
    "voice": "nova",
    "speed": 1.0
  }
  ```
- **Purpose:** Convert existing text to speech (replay messages)

#### Server → Client Events

**`voice_processing`**
- **Payload:**
  ```json
  {
    "status": "transcribing"
  }
  ```
- **Status Values:**
  - `transcribing` - Converting speech to text
  - `thinking` - Generating AI response
  - `synthesizing` - Converting text to speech

**`voice_transcribed`**
- **Payload:**
  ```json
  {
    "text": "Transcribed user speech"
  }
  ```

**`voice_response`**
- **Payload:**
  ```json
  {
    "audio": "base64_encoded_audio",
    "format": "mp3"
  }
  ```

---

## 7. Database Schema

### 7.1 Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);
```

**Model Methods:**
- `set_password(password)` - Hash password using PBKDF2-SHA256
- `check_password(password)` - Verify password against stored hash
- `to_dict()` - Serialize to JSON-safe dictionary (excludes password_hash)

**Relationships:**
- `chats` (One-to-Many) - All chats owned by user

### 7.2 Chats Table

```sql
CREATE TABLE chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

**Model Methods:**
- `update_title_from_first_message()` - Auto-generate title from first user message
- `get_last_message_time()` - Get timestamp of most recent message
- `to_dict(include_messages=False)` - Serialize with optional message inclusion

**Relationships:**
- `user` (Many-to-One) - Owner of the chat
- `messages` (One-to-Many) - All messages in the chat

### 7.3 Messages Table

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    INDEX idx_chat_id (chat_id),
    INDEX idx_timestamp (timestamp)
);
```

**Model Constants:**
- `ROLE_USER = 'user'`
- `ROLE_ASSISTANT = 'assistant'`

**Model Methods:**
- `__init__(chat_id, role, content)` - Validates role on instantiation
- `to_dict()` - Serialize to JSON-safe dictionary

**Relationships:**
- `chat` (Many-to-One) - Parent chat conversation

### 7.4 Cascade Delete Behavior

```
User Deleted
    ↓
All User's Chats Deleted (CASCADE)
    ↓
All Messages in Those Chats Deleted (CASCADE)
```

**Data Integrity:**
- Foreign key constraints enforced
- Orphaned records prevented
- Automatic cleanup on deletions

---

## 8. gRPC Client Integration

### 8.1 GRPCClient Service

**Location:** `services/grpc_client.py`

```python
class GRPCClient:
    def __init__(self, host='localhost', port=50051):
        """Initialize gRPC client for AI Backend"""

    def stream_chat(self, user_id, chat_id, message):
        """
        Stream chat response from AI Backend

        Yields:
            str: Response text chunks
        """
```

### 8.2 Connection Details

**Protocol:** gRPC (insecure channel for development)
**Target:** `localhost:50051` (configurable via environment)
**Service:** `amanda.ai.AIService`
**Method:** `StreamChat` (unary → server streaming)

### 8.3 Message Flow

```
Backend                          AI Backend
   │                                 │
   │  ChatMessage                    │
   ├────────────────────────────────>│
   │  (user_id, chat_id, message)    │
   │                                 │
   │  Stream ChatChunk               │
   │<────────────────────────────────┤
   │  (text chunk 1)                 │
   │<────────────────────────────────┤
   │  (text chunk 2)                 │
   │<────────────────────────────────┤
   │  ...                            │
   │<────────────────────────────────┤
   │  (text chunk N, done=True)      │
   │                                 │
```

### 8.4 Error Handling

- Connection failures logged and re-raised
- Streaming errors caught and logged
- Context manager support for clean resource management
- Graceful degradation on AI Backend unavailability

---

## 9. Configuration

### 9.1 Environment Variables (`.env`)

```bash
# Flask Application
SECRET_KEY=your_secret_key_change_this_in_production
FLASK_ENV=development
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Database
DATABASE_URL=sqlite:///amanda.db

# AI Backend gRPC
GRPC_AI_BACKEND_HOST=localhost
GRPC_AI_BACKEND_PORT=50051

# Session Configuration
SESSION_TYPE=filesystem
SESSION_PERMANENT=False
SESSION_USE_SIGNER=True

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

### 9.2 Config Class (`config.py`)

**Flask Settings:**
- `SECRET_KEY` - Session encryption key (MUST change in production)
- `FLASK_ENV` - Environment mode (development/production)
- `FLASK_HOST` - Bind address (0.0.0.0 for external access)
- `FLASK_PORT` - Server port

**Database Settings:**
- `SQLALCHEMY_DATABASE_URI` - Database connection string
- `SQLALCHEMY_TRACK_MODIFICATIONS` - Disabled for performance

**Session Settings:**
- `SESSION_TYPE` - Storage backend (filesystem/redis)
- `SESSION_PERMANENT` - Persistent across restarts
- `SESSION_USE_SIGNER` - Sign cookies with SECRET_KEY
- `SESSION_COOKIE_HTTPONLY` - Prevent JavaScript access
- `SESSION_COOKIE_SAMESITE` - CSRF protection ('Lax')

**CORS Settings:**
- `CORS_ORIGINS` - Allowed origin domains
- `CORS_SUPPORTS_CREDENTIALS` - Allow credentials in CORS

### 9.3 SocketIO Configuration

```python
socketio = SocketIO(
    app,
    async_mode='threading',  # Python 3.12+ compatible
    manage_session=False,    # Manual session management
    cors_allowed_origins=config.CORS_ORIGINS,
    use_reloader=False,      # Prevent double initialization
    allow_unsafe_werkzeug=True  # Development only
)
```

---

## 10. Security Features

### 10.1 Password Security

🔒 **Hashing Algorithm:** PBKDF2-SHA256 via Werkzeug
🔒 **Salt:** Automatic random salt generation
🔒 **Storage:** Only hashed passwords stored, never plain text
🔒 **Verification:** Constant-time comparison to prevent timing attacks

### 10.2 Session Security

🔒 **Server-side Storage:** Session data not in cookies
🔒 **Signed Cookies:** HMAC signature with SECRET_KEY
🔒 **HTTP-only Flag:** Prevents XSS cookie theft
🔒 **SameSite Policy:** CSRF protection
🔒 **Secure Flag:** HTTPS-only in production (recommended)

### 10.3 Access Control

🔒 **Authentication Decorator:** `@require_auth` for protected routes
🔒 **Ownership Verification:** Users can only access their own chats
🔒 **WebSocket Auth:** Connection rejected if not authenticated
🔒 **Session Validation:** Every request validates active session

### 10.4 SQL Injection Prevention

🔒 **ORM Parameterization:** SQLAlchemy prevents SQL injection
🔒 **No Raw Queries:** All database access through ORM
🔒 **Input Sanitization:** Automatic parameter escaping

### 10.5 CORS Protection

🔒 **Origin Whitelist:** Only configured origins allowed
🔒 **Credentials Support:** Controlled via configuration
🔒 **Preflight Handling:** OPTIONS requests properly handled

### 10.6 Error Handling

🔒 **Generic Error Messages:** No sensitive information leakage
🔒 **Database Rollback:** Automatic on transaction errors
🔒 **Logging:** Errors logged server-side, not exposed to client

---

## 11. File Structure

```
services/backend/
├── app.py                      # Main Flask application factory
├── config.py                   # Configuration management
├── database.py                 # SQLAlchemy initialization
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
├── README.md                   # Service documentation
│
├── models/                     # Database models (ORM)
│   ├── __init__.py
│   ├── user.py                # User model with auth methods
│   ├── chat.py                # Chat model with utilities
│   └── message.py             # Message model with validation
│
├── routes/                     # REST API endpoints (Blueprints)
│   ├── __init__.py
│   ├── auth.py                # Authentication routes
│   ├── chat.py                # Chat management routes
│   └── user.py                # User profile routes
│
├── services/                   # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py        # Password hashing/verification
│   └── grpc_client.py         # AI Backend gRPC client
│
└── websocket/                  # Real-time event handlers
    ├── __init__.py
    ├── chat_handler.py        # Text chat streaming
    └── voice_handler.py       # Voice message handling
```

---

## 12. Deployment & Operations

### 12.1 Running the Service

**Development:**
```bash
cd services/backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python app.py
```

**Production (Gunicorn):**
```bash
pip install gunicorn eventlet
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app
```

**Note:** Socket.IO requires eventlet/gevent workers in production

### 12.2 Database Operations

**Initialize Database:**
```bash
# Database created automatically on first run
python app.py
```

**Reset Database:**
```bash
rm amanda.db
python app.py
```

**Migrate to PostgreSQL:**
```bash
# Update .env
DATABASE_URL=postgresql://user:password@host:port/database

# Install PostgreSQL driver
pip install psycopg2-binary

# Run app (tables auto-created)
python app.py
```

### 12.3 Performance Tuning

**Database:**
- Add indexes on frequently queried columns
- Use connection pooling for PostgreSQL
- Enable query caching

**Sessions:**
- Migrate to Redis for distributed deployments
- Configure session timeout appropriately
- Monitor session storage size

**WebSocket:**
- Use Redis adapter for Socket.IO scaling
- Load balance with sticky sessions
- Monitor concurrent connections

### 12.4 Monitoring

**Key Metrics:**
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Active WebSocket connections
- Database query performance
- Session count and memory usage

**Logging:**
- Flask application logs
- Database query logs
- gRPC client errors
- WebSocket connection events

---

## 13. Known Limitations

- **Single Instance:** Filesystem sessions don't scale horizontally
- **SQLite:** Not suitable for high-concurrency production use
- **gRPC Insecure:** No TLS encryption for AI Backend communication
- **No Rate Limiting:** Vulnerable to abuse without external protection
- **Limited WebSocket Scaling:** Threading mode limits concurrent connections

---

## 14. Production Recommendations

### Critical Changes for Production

1. **SECRET_KEY:** Generate strong random key (min 32 bytes)
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Session Storage:** Migrate to Redis
   ```python
   SESSION_TYPE = 'redis'
   SESSION_REDIS = redis.from_url('redis://localhost:6379')
   ```

3. **Database:** Use PostgreSQL
   ```bash
   DATABASE_URL=postgresql://user:pass@host/db
   ```

4. **gRPC Security:** Enable TLS
   ```python
   credentials = grpc.ssl_channel_credentials()
   channel = grpc.secure_channel(f'{host}:{port}', credentials)
   ```

5. **HTTPS Only:** Enable secure cookies
   ```python
   SESSION_COOKIE_SECURE = True
   ```

6. **CORS:** Restrict to production domain
   ```bash
   CORS_ORIGINS=https://yourdomain.com
   ```

7. **Rate Limiting:** Add Flask-Limiter
   ```python
   from flask_limiter import Limiter
   limiter = Limiter(app, key_func=get_remote_address)
   ```

8. **Error Handling:** Use Sentry or similar
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn="your-sentry-dsn")
   ```

---

## 15. Future Enhancements

- [ ] JWT authentication for stateless scaling
- [ ] PostgreSQL migration guide
- [ ] Redis session adapter
- [ ] Rate limiting middleware
- [ ] API versioning (/api/v1/...)
- [ ] Comprehensive logging with structured logs
- [ ] Prometheus metrics export
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline integration

---

## Conclusion

The Backend service provides a robust, production-ready foundation for the Amanda platform. Its modular architecture, comprehensive feature set, and clear separation of concerns make it an excellent educational example while remaining suitable for real-world deployment with appropriate production hardening.

**Key Strengths:**
- ✅ Clean architecture with blueprints and services
- ✅ Comprehensive authentication and authorization
- ✅ Real-time communication via WebSocket
- ✅ Database persistence with ORM
- ✅ Seamless gRPC integration with AI Backend
- ✅ Voice feature support

**Ideal For:**
- Full-stack learning projects
- Microservices architecture education
- Real-time chat applications
- AI-powered conversational platforms

---

*Report Generated: 2025-11-23*
*Service Version: 1.0*
*Technology Stack: Python 3.9+, Flask 3.0, SQLAlchemy, Socket.IO, gRPC*

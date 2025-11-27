# Amanda Platform - Microservices Integration & Architecture

## Executive Summary

The Amanda platform is a distributed microservices architecture consisting of three independent services working together to deliver an AI-powered relationship support chatbot. This document provides a comprehensive overview of how the Frontend, Backend, and AI Backend services integrate, communicate, and collaborate to provide a seamless user experience.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Frontend Service                       │   │
│  │  • HTML5/CSS3/JavaScript (Vanilla ES6+)                  │   │
│  │  • Socket.IO Client                                      │   │
│  │  • Web Audio API (Voice Features)                        │   │
│  │  • Served on Port 8000                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────┬────────────────────────┘
               │                          │
               │ HTTP/REST                │ WebSocket (Socket.IO)
               │ (API Calls)              │ (Real-time Chat)
               │                          │
               ↓                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Backend Service                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  • Flask 3.0 (REST API + WebSocket Server)                 │ │
│  │  • Flask-SocketIO (WebSocket Support)                      │ │
│  │  • SQLAlchemy ORM (Database)                               │ │
│  │  • SQLite/PostgreSQL (Data Persistence)                    │ │
│  │  • Session Management (Authentication)                     │ │
│  │  • Port 5000                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ gRPC Streaming
                             │ (AI Requests)
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    AI Backend Service                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  • gRPC Server (Python)                                     │ │
│  │  • Three-Agent Therapeutic System                          │ │
│  │  • Multi-Provider LLM Support (Claude/GPT/Gemini)          │ │
│  │  • Session Management & Transcripts                        │ │
│  │  • Voice Service (ASR/TTS)                                 │ │
│  │  • Port 50051 (gRPC), 8080 (WebSocket Voice)              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTP/API Calls
                             │
                             ↓
                    ┌─────────────────┐
                    │  LLM Providers  │
                    ├─────────────────┤
                    │ Anthropic Claude│
                    │   OpenAI GPT    │
                    │ Google Gemini   │
                    └─────────────────┘
```

### 1.2 Service Responsibilities

| Service | Primary Role | Technologies | Port(s) |
|---------|-------------|--------------|---------|
| **Frontend** | User Interface & Client-Side Logic | HTML5, CSS3, JavaScript ES6+, Socket.IO | 8000 |
| **Backend** | Business Logic, Auth, Data Persistence | Flask, SQLAlchemy, Socket.IO, gRPC Client | 5000 |
| **AI Backend** | AI Orchestration, LLM Integration, Voice | gRPC, Multi-Provider LLM, Whisper, TTS | 50051, 8080 |

---

## 2. Communication Protocols & Patterns

### 2.1 Frontend ↔ Backend Communication

#### **Protocol 1: HTTP/REST**

**Purpose:** Stateless operations (authentication, data fetching)

**Technology:** Fetch API with JSON payloads

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | User registration |
| `/api/auth/login` | POST | Authentication |
| `/api/auth/logout` | POST | Session termination |
| `/api/auth/check` | GET | Authentication status |
| `/api/user/profile` | GET | User profile data |
| `/api/chat/list` | GET | Retrieve user's chats |
| `/api/chat/create` | POST | Create new chat |
| `/api/chat/{id}/messages` | GET | Fetch chat history |

**Request Example:**
```javascript
// Frontend: api.js
const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    credentials: 'include',  // Include session cookies
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
    })
});

const data = await response.json();
```

**Backend Handler:**
```python
# Backend: routes/auth.py
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        return jsonify({'message': 'Login successful', 'user': user.to_dict()})
    return jsonify({'error': 'Invalid credentials'}), 401
```

**Session Management:**
- Backend sets HTTP-only session cookies
- Frontend includes `credentials: 'include'` in all requests
- CORS configured to allow credentials from frontend origin

---

#### **Protocol 2: WebSocket (Socket.IO)**

**Purpose:** Real-time bidirectional communication (chat streaming)

**Technology:** Socket.IO 4.5.4

**Events:**

| Direction | Event | Purpose | Payload |
|-----------|-------|---------|---------|
| Client → Server | `send_message` | Send text message | `{chat_id, message}` |
| Client → Server | `send_voice_message` | Send voice recording | `{chat_id, audio, format}` |
| Server → Client | `message_token` | Stream AI response chunks | `{text}` |
| Server → Client | `message_complete` | Signal completion | `{message_id, full_text}` |
| Server → Client | `voice_transcribed` | Voice-to-text result | `{text}` |
| Server → Client | `voice_response` | TTS audio response | `{audio, format}` |
| Server → Client | `error` | Error notification | `{message}` |

**Connection Flow:**
```javascript
// Frontend: websocket.js
const socket = io('http://localhost:5000', {
    withCredentials: true  // Include session cookies
});

socket.on('connect', () => {
    console.log('Connected to backend');
});

socket.emit('send_message', {
    chat_id: 1,
    message: 'Hello Amanda'
});

socket.on('message_token', (data) => {
    // Append token to message bubble
    appendToken(data.text);
});

socket.on('message_complete', (data) => {
    // Finalize message, re-enable input
    finalizeMessage(data.message_id, data.full_text);
});
```

**Backend Handler:**
```python
# Backend: websocket/chat_handler.py
@socketio.on('send_message')
def handle_send_message(data):
    chat_id = data['chat_id']
    message = data['message']
    user_id = session.get('user_id')

    # Save user message to database
    user_message = Message(chat_id, 'user', message)
    db.session.add(user_message)
    db.session.commit()

    # Stream AI response via gRPC
    with GRPCClient() as grpc_client:
        for token in grpc_client.stream_chat(user_id, chat_id, message):
            emit('message_token', {'text': token})

    # Save assistant message
    assistant_message = Message(chat_id, 'assistant', full_response)
    db.session.add(assistant_message)
    db.session.commit()

    emit('message_complete', {
        'message_id': assistant_message.id,
        'full_text': full_response
    })
```

---

### 2.2 Backend ↔ AI Backend Communication

#### **Protocol: gRPC Streaming**

**Purpose:** Efficient binary protocol for AI request/response streaming

**Technology:** gRPC with Protocol Buffers

**Service Definition:**
```protobuf
service amanda.ai.AIService {
  rpc StreamChat (ChatMessage) returns (stream ChatChunk);
}

message ChatMessage {
  string user_id = 1;
  string chat_id = 2;
  string message = 3;
}

message ChatChunk {
  string text = 1;
  bool done = 2;
}
```

**Backend Client:**
```python
# Backend: services/grpc_client.py
import grpc
from descriptors import create_service_descriptors

class GRPCClient:
    def __init__(self, host='localhost', port=50051):
        self.channel = grpc.insecure_channel(f'{host}:{port}')
        self.stub = create_stub(self.channel)

    def stream_chat(self, user_id, chat_id, message):
        """Stream chat response from AI Backend"""
        request = create_chat_message(user_id, chat_id, message)

        for chunk in self.stub.StreamChat(request):
            if not chunk.done:
                yield chunk.text
            else:
                break
```

**AI Backend Server:**
```python
# AI Backend: server.py
class AIServicer:
    def StreamChat(self, request, context):
        """Handle streaming chat requests"""
        user_id = request.user_id
        chat_id = request.chat_id
        message = request.message

        # Get or create therapeutic coordinator for user
        coordinator = get_coordinator(user_id, chat_id)

        # Process message through three-agent system
        for token in coordinator.process_message(message):
            yield ChatChunk(text=token, done=False)

        # Send completion signal
        yield ChatChunk(text='', done=True)
```

**Message Flow:**
```
Backend                          AI Backend
   │                                 │
   │  ChatMessage                    │
   │  {user_id, chat_id, message}    │
   ├────────────────────────────────>│
   │                                 │
   │                            ┌────┴────┐
   │                            │ Amanda  │ (Main Agent)
   │                            │ Agent   │
   │                            └────┬────┘
   │                                 │
   │  ChatChunk {text, done=false}   │
   │<────────────────────────────────┤
   │  "I understand..."              │
   │<────────────────────────────────┤
   │  "how you feel..."              │
   │<────────────────────────────────┤
   │  ...                            │
   │                                 │
   │                            ┌────┴────┐
   │                            │Supervisor│ (Risk Monitor)
   │                            │  Agent  │
   │                            └────┬────┘
   │                                 │
   │  ChatChunk {text, done=true}    │
   │<────────────────────────────────┤
   │                                 │
```

**Performance Characteristics:**
- **Latency:** 50-200ms per token (depends on LLM provider)
- **Throughput:** Supports multiple concurrent streams
- **Connection:** Persistent, multiplexed over single TCP connection
- **Efficiency:** Binary protocol, ~40% smaller than JSON

---

### 2.3 Frontend ↔ AI Backend (Voice Service)

#### **Protocol: WebSocket (Direct Connection)**

**Purpose:** Low-latency bidirectional voice streaming

**Technology:** WebSocket (not Socket.IO) with JSON messages

**Connection:**
```javascript
// Frontend: grpc-voice-client.js
const ws = new WebSocket(
    `ws://localhost:8080/voice-stream?user_id=${userId}&chat_id=${chatId}&session_id=${sessionId}`
);

ws.onopen = () => {
    console.log('Voice service connected');
};

// Send audio chunks
ws.send(JSON.stringify({
    type: 'audio',
    data: base64AudioChunk
}));

// Receive transcripts and responses
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'transcript') {
        displayTranscript(data.text);
    } else if (data.type === 'audio') {
        playAudioResponse(data.data);
    }
};
```

**AI Backend Voice Server:**
```python
# AI Backend: voice_server.py
async def voice_stream_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    user_id = request.query.get('user_id')
    chat_id = request.query.get('chat_id')

    async for msg in ws:
        if msg.type == WSMsgType.TEXT:
            data = json.loads(msg.data)

            if data['type'] == 'audio':
                # Transcribe audio
                transcript = await asr_provider.transcribe(data['data'])
                await ws.send_json({'type': 'transcript', 'text': transcript})

                # Generate AI response
                response = await generate_response(user_id, chat_id, transcript)
                await ws.send_json({'type': 'text', 'text': response})

                # Synthesize speech
                audio = await tts_provider.synthesize(response)
                await ws.send_json({'type': 'audio', 'data': audio})

    return ws
```

**Note:** This provides lower latency than routing through Backend service.

---

## 3. Data Flow Scenarios

### 3.1 User Signup & Login Flow

```
┌─────────┐           ┌─────────┐           ┌──────────┐
│ Frontend│           │ Backend │           │ Database │
└────┬────┘           └────┬────┘           └────┬─────┘
     │                     │                     │
     │ POST /api/auth/signup                    │
     │ {email, password}   │                     │
     ├────────────────────>│                     │
     │                     │                     │
     │                     │ Check if user exists│
     │                     ├────────────────────>│
     │                     │<────────────────────┤
     │                     │ User not found      │
     │                     │                     │
     │                     │ Hash password       │
     │                     │ (PBKDF2-SHA256)     │
     │                     │                     │
     │                     │ INSERT user record  │
     │                     ├────────────────────>│
     │                     │<────────────────────┤
     │                     │ User created        │
     │                     │                     │
     │ 201 Created         │                     │
     │ {user: {...}}       │                     │
     │<────────────────────┤                     │
     │                     │                     │
     │ Redirect to login   │                     │
     │                     │                     │
     │ POST /api/auth/login                     │
     │ {email, password}   │                     │
     ├────────────────────>│                     │
     │                     │                     │
     │                     │ SELECT user by email│
     │                     ├────────────────────>│
     │                     │<────────────────────┤
     │                     │ User found          │
     │                     │                     │
     │                     │ Verify password     │
     │                     │ (constant-time)     │
     │                     │                     │
     │                     │ Create session      │
     │                     │ Set session cookie  │
     │                     │                     │
     │ 200 OK              │                     │
     │ Set-Cookie: session │                     │
     │ {user: {...}}       │                     │
     │<────────────────────┤                     │
     │                     │                     │
     │ Store session cookie│                     │
     │ Redirect to dashboard                    │
     │                     │                     │
```

---

### 3.2 Text Chat Message Flow (Full Stack)

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│Frontend │    │Backend  │    │Database  │    │AI Backend│    │LLM API  │
└────┬────┘    └────┬────┘    └────┬─────┘    └────┬─────┘    └────┬────┘
     │              │              │              │              │
     │ User types   │              │              │              │
     │ "I need help"│              │              │              │
     │              │              │              │              │
     │ WebSocket:   │              │              │              │
     │ send_message │              │              │              │
     │ {chat_id: 1, │              │              │              │
     │  message: "I need help"}    │              │              │
     ├─────────────>│              │              │              │
     │              │              │              │              │
     │              │ Verify session              │              │
     │              │ Verify chat ownership       │              │
     │              │              │              │              │
     │              │ INSERT message              │              │
     │              │ (role: user) │              │              │
     │              ├─────────────>│              │              │
     │              │<─────────────┤              │              │
     │              │ Message saved│              │              │
     │              │              │              │              │
     │              │ gRPC StreamChat             │              │
     │              │ {user_id: 1, │              │              │
     │              │  chat_id: 1, │              │              │
     │              │  message: "I need help"}    │              │
     │              ├─────────────────────────────>│              │
     │              │              │              │              │
     │              │              │              │ Load session │
     │              │              │              │ memory       │
     │              │              │              │              │
     │              │              │              │ Amanda Agent │
     │              │              │              │ processes msg│
     │              │              │              │              │
     │              │              │              │ Claude API   │
     │              │              │              │ (streaming)  │
     │              │              │              ├─────────────>│
     │              │              │              │              │
     │              │              │              │ Token: "I'm" │
     │              │              │              │<─────────────┤
     │              │              │              │              │
     │              │ ChatChunk    │              │              │
     │              │ {text: "I'm"}│              │              │
     │              │<─────────────────────────────┤              │
     │ message_token│              │              │              │
     │ {text: "I'm"}│              │              │              │
     │<─────────────┤              │              │              │
     │              │              │              │              │
     │ Display "I'm"│              │              │ Token: "here"│
     │              │              │              │<─────────────┤
     │              │ ChatChunk    │              │              │
     │              │ {text: "here"}              │              │
     │              │<─────────────────────────────┤              │
     │ message_token│              │              │              │
     │ {text: "here"}              │              │              │
     │<─────────────┤              │              │              │
     │              │              │              │              │
     │ Display      │              │              │ ... (more    │
     │ "I'm here"   │              │              │  tokens)     │
     │              │              │              │              │
     │              │              │              │ Supervisor   │
     │              │              │              │ analyzes for │
     │              │              │              │ risks        │
     │              │              │              │              │
     │              │ ChatChunk    │              │              │
     │              │ {done: true} │              │              │
     │              │<─────────────────────────────┤              │
     │              │              │              │              │
     │              │ INSERT message              │              │
     │              │ (role: assistant)           │              │
     │              ├─────────────>│              │              │
     │              │<─────────────┤              │              │
     │              │              │              │ Save transcript
     │              │              │              │ to log file  │
     │              │              │              │              │
     │ message_complete            │              │              │
     │ {message_id: 42,            │              │              │
     │  full_text: "..."}          │              │              │
     │<─────────────┤              │              │              │
     │              │              │              │              │
     │ Re-enable    │              │              │              │
     │ input field  │              │              │              │
     │              │              │              │              │
```

---

### 3.3 Voice Chat Flow with VAD

```
┌─────────┐    ┌──────────┐    ┌─────────┐
│Frontend │    │AI Backend│    │LLM API  │
│(VAD)    │    │(Voice)   │    │         │
└────┬────┘    └────┬─────┘    └────┬────┘
     │              │              │
     │ User clicks  │              │
     │ voice button │              │
     │              │              │
     │ Start VAD    │              │
     │ Monitor mic  │              │
     │              │              │
     │ Speech detected             │
     │ (energy > threshold)        │
     │              │              │
     │ Connect WebSocket           │
     │ ws://localhost:8080         │
     ├─────────────>│              │
     │              │              │
     │ Connected    │              │
     │<─────────────┤              │
     │              │              │
     │ Stream audio │              │
     │ chunks (100ms)              │
     ├─────────────>│              │
     ├─────────────>│ Whisper ASR │
     ├─────────────>│ (real-time) │
     │              │              │
     │              │ Partial      │
     │              │ transcript:  │
     │ Transcript:  │ "I need..."  │
     │ "I need..."  │              │
     │<─────────────┤              │
     │              │              │
     │ Silence detected            │
     │ (2 seconds)  │              │
     │              │              │
     │ Stop streaming              │
     │ Final audio  │              │
     ├─────────────>│              │
     │              │              │
     │              │ Final ASR    │
     │              │              │
     │ Complete     │              │
     │ transcript:  │              │
     │ "I need help with my        │
     │  relationship"              │
     │<─────────────┤              │
     │              │              │
     │              │ Process with │
     │              │ LLM          │
     │              ├─────────────>│
     │              │              │
     │              │ Stream tokens│
     │ Text tokens  │<─────────────┤
     │ (real-time)  │              │
     │<─────────────┤              │
     │              │              │
     │ Display AI   │              │
     │ response text│              │
     │              │              │
     │              │ Complete     │
     │              │ response     │
     │              │              │
     │              │ TTS synthesis│
     │              │ (OpenAI)     │
     │              │              │
     │ Audio chunks │              │
     │ (streaming)  │              │
     │<─────────────┤              │
     │<─────────────┤              │
     │              │              │
     │ Play audio   │              │
     │ (VoicePlayer)│              │
     │              │              │
     │ Resume VAD   │              │
     │ listening    │              │
     │              │              │
```

**Estimated Latency:**
- VAD silence detection: 500-2000ms (configurable)
- ASR transcription: 100-300ms
- LLM first token: 200-500ms
- TTS synthesis: 200-400ms
- **Total user-perceived latency: 1-3 seconds**

---

## 4. Technology Integration Matrix

### 4.1 Technology Stack by Layer

| Layer | Frontend | Backend | AI Backend |
|-------|----------|---------|------------|
| **Presentation** | HTML5, CSS3 | - | - |
| **Client Logic** | JavaScript ES6+ | - | - |
| **Web Framework** | - | Flask 3.0 | - |
| **Real-time Comm** | Socket.IO Client | Flask-SocketIO | aiohttp WebSocket |
| **RPC** | - | gRPC Client | gRPC Server |
| **Database** | - | SQLAlchemy ORM | - |
| **Data Store** | - | SQLite/PostgreSQL | File-based sessions |
| **AI/ML** | - | - | Multi-Provider LLM |
| **Voice** | Web Audio API, MediaRecorder | - | Whisper (ASR), OpenAI/Google (TTS) |
| **Auth** | Cookie storage | Flask-Session | - |
| **Serialization** | JSON | JSON, Protobuf | Protobuf, JSON |

### 4.2 Shared Dependencies

**Protocol Buffers:**
- Backend: `protobuf >= 3.20.3` (gRPC client)
- AI Backend: `protobuf >= 3.20.3` (gRPC server)
- **Shared Schema:** ChatMessage, ChatChunk (dynamically generated)

**Socket.IO:**
- Frontend: Socket.IO 4.5.4 (CDN)
- Backend: Flask-SocketIO 5.3.5, python-socketio 5.10.0
- **Protocol:** Socket.IO 4.x (compatible across services)

### 4.3 Protocol Compatibility Matrix

| Communication | Protocol | Version | Encoding | Security |
|---------------|----------|---------|----------|----------|
| Frontend → Backend (REST) | HTTP/1.1 | - | JSON | HTTPS (prod) |
| Frontend → Backend (WebSocket) | Socket.IO | 4.x | JSON | WSS (prod) |
| Backend → AI Backend | gRPC | - | Protobuf | TLS (prod) |
| Frontend → AI Backend (Voice) | WebSocket | RFC 6455 | JSON | WSS (prod) |

---

## 5. State Management Across Services

### 5.1 Session State (Authentication)

**Managed By:** Backend
**Storage:** Filesystem (development), Redis (production recommended)
**Scope:** Shared across REST and WebSocket connections

```
┌─────────────────────────────────────────┐
│         Backend Session Store           │
│  ┌─────────────────────────────────┐   │
│  │ Session ID: abc123              │   │
│  │ ├─ user_id: 1                   │   │
│  │ ├─ email: user@example.com      │   │
│  │ ├─ created_at: 2025-11-23       │   │
│  │ └─ expires_at: 2025-11-24       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↑                   ↑
         │                   │
    HTTP Requests      WebSocket
    (Cookie)          (Cookie in handshake)
```

**Session Flow:**
1. User logs in → Backend creates session
2. Backend sets HTTP-only session cookie
3. Frontend stores cookie automatically
4. All HTTP requests include cookie via `credentials: 'include'`
5. WebSocket connection includes cookie in handshake
6. Backend validates session on every request/event

### 5.2 Conversation State (AI Context)

**Managed By:** AI Backend
**Storage:** File-based (`session_data/` directory)
**Scope:** Per user, persists across chats

```
AI Backend Session State:
┌─────────────────────────────────────────┐
│  User: user1@example.com                │
│  ┌──────────────────────────────────┐   │
│  │ Conversation History              │   │
│  │ ├─ Message 1 (user)               │   │
│  │ ├─ Message 2 (assistant)          │   │
│  │ ├─ ... (last 10 messages)         │   │
│  │                                   │   │
│  │ Summary from Previous Session:    │   │
│  │ "User discussed relationship      │   │
│  │  challenges with partner..."      │   │
│  │                                   │   │
│  │ Risk Queue: [suicidality]         │   │
│  │ Mode: ASSESSMENT                  │   │
│  │ Assessment Progress: 3/14 Qs      │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Conversation Flow:**
1. Backend sends user_id with each gRPC request
2. AI Backend loads/creates TherapeuticCoordinator for user
3. Coordinator maintains conversation history in memory
4. On session end, generates summary and saves to disk
5. Next session loads summary as context for Amanda

### 5.3 UI State (Client-Side)

**Managed By:** Frontend
**Storage:** JavaScript variables, SessionStorage
**Scope:** Current browser session only

```javascript
// Frontend State Management
const state = {
    currentUser: null,        // Loaded from /api/auth/check
    currentChatId: null,      // Stored in sessionStorage
    chats: [],               // Loaded from /api/chat/list
    messages: [],            // Loaded from /api/chat/{id}/messages
    isStreaming: false,      // During AI response
    isRecording: false,      // During voice recording
    isConnected: false       // WebSocket status
};
```

**State Synchronization:**
- Login → Fetch user profile → Load chat list → Select chat → Load messages
- WebSocket reconnect → Reload current chat messages
- Session expiry → Redirect to login → Clear all state

---

## 6. Error Handling & Resilience

### 6.1 Frontend Error Handling

**Network Errors:**
```javascript
try {
    const response = await fetch('/api/chat/list');
    if (!response.ok) throw new Error('Failed to load chats');
    const data = await response.json();
} catch (error) {
    displayError('Unable to load chats. Please try again.');
    console.error('API Error:', error);
}
```

**WebSocket Disconnection:**
```javascript
socket.on('disconnect', () => {
    displayStatus('Connection lost. Reconnecting...');
});

socket.on('connect', () => {
    displayStatus('Connected');
    reloadCurrentChat();
});
```

### 6.2 Backend Error Handling

**Database Errors:**
```python
try:
    user_message = Message(chat_id, 'user', message)
    db.session.add(user_message)
    db.session.commit()
except Exception as e:
    db.session.rollback()
    logger.error(f'Database error: {e}')
    emit('error', {'message': 'Failed to save message'})
    return
```

**gRPC Errors:**
```python
try:
    with GRPCClient() as grpc_client:
        for token in grpc_client.stream_chat(user_id, chat_id, message):
            emit('message_token', {'text': token})
except grpc.RpcError as e:
    logger.error(f'gRPC error: {e}')
    emit('error', {'message': 'AI service unavailable'})
    # Fallback: return canned response
```

### 6.3 AI Backend Error Handling

**LLM Provider Errors:**
```python
try:
    response = provider.stream(messages)
    for token in response:
        yield token
except Exception as e:
    logger.error(f'LLM provider error: {e}')
    # Try fallback provider
    fallback_provider = get_fallback_provider()
    for token in fallback_provider.stream(messages):
        yield token
```

### 6.4 Circuit Breaker Pattern (Recommended)

For production, implement circuit breakers for external dependencies:

```python
# Backend → AI Backend
class GRPCCircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half-open

    def call(self, func, *args, **kwargs):
        if self.state == 'open':
            if time.time() - self.last_failure_time > self.timeout:
                self.state = 'half-open'
            else:
                raise CircuitBreakerOpenError()

        try:
            result = func(*args, **kwargs)
            if self.state == 'half-open':
                self.state = 'closed'
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = 'open'
            raise
```

---

## 7. Deployment Architecture

### 7.1 Development (Local)

```
Localhost
├── Frontend:  http://localhost:8000  (Python http.server)
├── Backend:   http://localhost:5000  (Flask dev server)
└── AI Backend:
    ├── gRPC:     localhost:50051
    └── Voice WS: ws://localhost:8080
```

**Start All Services:**
```bash
# Terminal 1: AI Backend
cd services/ai_backend
python server.py

# Terminal 2: AI Backend Voice Server
cd services/ai_backend
python voice_server.py

# Terminal 3: Backend
cd services/backend
python app.py

# Terminal 4: Frontend
cd services/frontend
python -m http.server 8000
```

### 7.2 Production (Containerized)

**Docker Compose Architecture:**

```yaml
version: '3.8'

services:
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./services/frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

  backend:
    build: ./services/backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/amanda
      - GRPC_AI_BACKEND_HOST=ai_backend
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - ai_backend

  ai_backend:
    build: ./services/ai_backend
    ports:
      - "50051:50051"
      - "8080:8080"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./session_data:/app/session_data
      - ./monitoring_logs:/app/monitoring_logs

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=amanda
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 7.3 Kubernetes Deployment

**Service Mesh Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                  Ingress Controller                  │
│         (nginx-ingress / Traefik / Istio)           │
└────────────┬────────────────────────┬────────────────┘
             │                        │
             │                        │
    ┌────────▼─────────┐     ┌───────▼────────┐
    │   Frontend Pod   │     │  Backend Pod   │
    │   (Nginx)        │     │  (Gunicorn)    │
    │   Replicas: 3    │     │  Replicas: 3   │
    └──────────────────┘     └───────┬────────┘
                                     │
                                     │ gRPC
                                     │
                             ┌───────▼────────┐
                             │ AI Backend Pod │
                             │ (gRPC Server)  │
                             │ Replicas: 2    │
                             └───────┬────────┘
                                     │
                            ┌────────┴────────┐
                            │  PostgreSQL     │
                            │  (StatefulSet)  │
                            └─────────────────┘
```

**Key Considerations:**
- **Frontend:** Stateless, can scale horizontally
- **Backend:** Session affinity required for Socket.IO (sticky sessions)
- **AI Backend:** Stateful (session data), requires persistent volumes
- **Database:** StatefulSet with persistent volume claims

---

## 8. Security Architecture

### 8.1 Security Layers

```
┌─────────────────────────────────────────┐
│         Security Layer 1: TLS           │
│  • HTTPS for Frontend ↔ Backend         │
│  • WSS for WebSocket connections        │
│  • TLS for gRPC Backend ↔ AI Backend   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Security Layer 2: Authentication     │
│  • Session-based auth (Backend)         │
│  • HTTP-only cookies                    │
│  • CSRF protection (SameSite)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Security Layer 3: Authorization      │
│  • Chat ownership verification          │
│  • User isolation                       │
│  • WebSocket auth check                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Security Layer 4: Data Protection   │
│  • Password hashing (PBKDF2)            │
│  • SQL injection prevention (ORM)       │
│  • XSS prevention (input sanitization)  │
└─────────────────────────────────────────┘
```

### 8.2 Cross-Service Security

**API Key Protection:**
- AI Backend: LLM API keys in environment variables
- Backend: No direct access to LLM API keys
- Frontend: No access to any API keys

**Network Isolation (Production):**
```
Internet
   │
   ↓
[Frontend Pod] ← Public access allowed
   │
   ↓
[Backend Pod] ← Internal network only
   │
   ↓
[AI Backend Pod] ← Internal network only, no public access
   │
   ↓
[Database] ← Internal network only
```

---

## 9. Monitoring & Observability

### 9.1 Logging Strategy

**Frontend:**
```javascript
// Console logging (development)
console.log('[WebSocket] Connected');
console.error('[API] Failed to load chats:', error);

// Production: Send to logging service
window.addEventListener('error', (event) => {
    sendToLoggingService({
        level: 'error',
        message: event.message,
        stack: event.error.stack
    });
});
```

**Backend:**
```python
# Flask logging
import logging
logger = logging.getLogger(__name__)

logger.info(f'User {user_id} logged in')
logger.error(f'Failed to save message: {error}')
```

**AI Backend:**
```python
# Structured logging
logger.info('StreamChat request', extra={
    'user_id': user_id,
    'chat_id': chat_id,
    'provider': 'anthropic',
    'latency_ms': 250
})
```

### 9.2 Metrics Collection

**Key Metrics:**

| Service | Metrics |
|---------|---------|
| Frontend | Page load time, API call latency, WebSocket reconnects, errors |
| Backend | Request rate, response time (p50/p95/p99), error rate, DB query time, active sessions |
| AI Backend | Token generation rate, LLM provider latency, risk detection frequency, voice processing time |

**Prometheus Integration (Recommended):**
```python
# Backend metrics
from prometheus_client import Counter, Histogram

http_requests_total = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
http_request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    duration = time.time() - request.start_time
    http_requests_total.labels(request.method, request.path, response.status_code).inc()
    http_request_duration.observe(duration)
    return response
```

### 9.3 Distributed Tracing

**OpenTelemetry Integration:**
```python
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.grpc import GrpcInstrumentorClient

# Backend
FlaskInstrumentor().instrument_app(app)
GrpcInstrumentorClient().instrument()

# Trace ID propagated through:
# Frontend → Backend (HTTP headers) → AI Backend (gRPC metadata)
```

**Trace Example:**
```
Trace ID: abc123

├─ Frontend: fetch /api/chat/list [50ms]
├─ Backend: GET /api/chat/list [45ms]
│  ├─ Database: SELECT chats [10ms]
│  └─ Serialization: to_dict() [2ms]
```

---

## 10. Data Persistence Strategy

### 10.1 Backend Database (Relational)

**Data Stored:**
- User accounts (email, password_hash, created_at)
- Chat metadata (title, user_id, created_at)
- Messages (chat_id, role, content, timestamp)

**Schema:**
```sql
users (id, email, password_hash, created_at)
  ↓ 1:M
chats (id, user_id, title, created_at)
  ↓ 1:M
messages (id, chat_id, role, content, timestamp)
```

**Retention:**
- Indefinite (unless user requests deletion)
- Compliance: GDPR-ready (user data export/deletion)

### 10.2 AI Backend Session Data (File-based)

**Data Stored:**
- Session summaries per user
- Conversation history (temporary)
- Risk assessment state

**Storage Structure:**
```
session_data/
├── user1@example.com/
│   └── session_summary.json
├── user2@example.com/
│   └── session_summary.json
```

**Retention:**
- Session summaries: 90 days
- Conversation history: Cleared on session end
- Replaced with database or Redis in production

### 10.3 AI Backend Transcripts (File-based)

**Data Stored:**
- Full conversation transcripts
- Agent activations and reasoning
- Risk detections

**Storage Structure:**
```
monitoring_logs/
├── user1@example.com/
│   ├── chat_1/
│   │   └── transcript_2025-11-23.txt
│   └── chat_2/
│       └── transcript_2025-11-23.txt
```

**Retention:**
- Indefinite for audit/compliance
- Consider archival to S3/GCS after 30 days

---

## 11. Scaling Considerations

### 11.1 Horizontal Scaling

**Frontend:**
- ✅ Fully stateless
- ✅ Can scale to N replicas
- Load balancer: Round-robin

**Backend:**
- ⚠️ Stateful (sessions)
- Requires sticky sessions for WebSocket
- Load balancer: Consistent hashing or session affinity
- Session storage: Migrate to Redis for multi-instance

**AI Backend:**
- ⚠️ Stateful (conversation history)
- Requires persistent volume or shared storage
- Potential bottleneck: LLM API rate limits

### 11.2 Vertical Scaling

**Resource Requirements:**

| Service | CPU | Memory | Bottleneck |
|---------|-----|--------|------------|
| Frontend | Low | Low | Network bandwidth |
| Backend | Medium | Medium | Database connections, WebSocket count |
| AI Backend | Low-Medium | Medium-High | LLM API latency, TTS/ASR processing |

### 11.3 Caching Strategy

**Frontend:**
```javascript
// Cache chat list for 1 minute
const cachedChats = localStorage.getItem('chats');
if (cachedChats && Date.now() - cachedChats.timestamp < 60000) {
    return JSON.parse(cachedChats.data);
}
```

**Backend:**
```python
# Cache user profile in Redis
@cache.cached(timeout=300, key_prefix='user_profile')
def get_user_profile(user_id):
    return User.query.get(user_id).to_dict()
```

**AI Backend:**
```python
# Cache LLM provider responses (for repeated queries)
# Not recommended for conversational AI
```

---

## 12. Future Integration Enhancements

### 12.1 Planned Integrations

- [ ] **JWT Authentication:** Stateless tokens for Frontend ↔ Backend
- [ ] **Redis Session Store:** Distributed session management
- [ ] **PostgreSQL:** Production database migration
- [ ] **S3/GCS:** Transcript archival and voice file storage
- [ ] **Prometheus + Grafana:** Metrics visualization
- [ ] **OpenTelemetry:** Distributed tracing
- [ ] **Sentry:** Error tracking and alerting
- [ ] **WebRTC:** Peer-to-peer voice chat option

### 12.2 API Gateway Pattern

**Future Architecture:**
```
┌─────────┐
│ Frontend│
└────┬────┘
     │
     ↓
┌──────────────┐
│  API Gateway │ (Kong / Envoy / AWS API Gateway)
│  ├─ Rate limiting
│  ├─ Authentication
│  ├─ Load balancing
│  └─ Monitoring
└──────┬───────┘
       │
   ┌───┴───┬───────┐
   │       │       │
   ↓       ↓       ↓
Backend  AI     Voice
        Backend  Service
```

---

## Conclusion

The Amanda platform demonstrates a well-architected microservices system with clear separation of concerns, modern communication protocols, and production-ready patterns. The integration between Frontend (UI), Backend (business logic & persistence), and AI Backend (intelligence & voice) showcases best practices in distributed systems while remaining accessible for educational purposes.

**Key Integration Strengths:**
- ✅ Multiple communication protocols (REST, WebSocket, gRPC)
- ✅ Clear service boundaries and responsibilities
- ✅ Real-time streaming for optimal UX
- ✅ Scalable architecture with horizontal scaling paths
- ✅ Comprehensive error handling and resilience
- ✅ Security at multiple layers

**Production Readiness:**
- Current: ✅ Development environment
- Recommended: Database migration, session management, TLS/SSL, monitoring
- Future: API gateway, distributed tracing, advanced caching

This architecture provides a solid foundation for learning microservices development, AI integration, and real-time communication patterns while being extensible for production deployments.

---

*Report Generated: 2025-11-23*
*Platform Version: 1.0*
*Microservices: Frontend, Backend, AI Backend*

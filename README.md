# Amanda Project

Amanda is a relationship support chatbot platform designed as an educational project for students to learn about full-stack development with AI integration.

## Project Overview

This project consists of multiple services that work together to provide a conversational AI chatbot experience:

- **AI Backend**: gRPC service that handles AI model interactions (Claude API)
- **Backend**: Flask REST API for user management, chat history, and WebSocket streaming
- **Frontend**: Simple web interface for user authentication and chat interactions
- **Android**: Mobile application (to be implemented)

## Architecture

```
┌─────────────┐
│  Frontend   │ (HTML/JS)
│  (Browser)  │
└──────┬──────┘
       │ HTTP/REST + WebSocket
       ↓
┌─────────────┐
│   Backend   │ (Flask)
│   (Python)  │
└──────┬──────┘
       │ gRPC
       ↓
┌─────────────┐
│ AI Backend  │ (gRPC Server)
│   (Python)  │
└──────┬──────┘
       │ API Calls
       ↓
  Claude API
```

## Technology Stack

- **AI Backend**: Python, gRPC, Anthropic Claude API
- **Backend**: Python, Flask, Flask-SocketIO, SQLite
- **Frontend**: HTML, CSS, Vanilla JavaScript (ES6+)
- **Android**: To be implemented

## Getting Started

### 🚀 Option 1: Quick Demo with Google Colab (Recommended for First-Time Users)

**Perfect for demos, presentations, and quick testing!**

1. Open the notebook in Google Colab:
   [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akhavansafaei/amanda/blob/main/colab/Amanda_Colab_Demo.ipynb)

2. Follow the notebook instructions (takes ~5-10 minutes)
3. Get public URLs via ngrok to share with anyone
4. No local setup required!

**See detailed instructions**: [colab/COLAB_INSTRUCTIONS.md](colab/COLAB_INSTRUCTIONS.md)

### 💻 Option 2: Local Development Setup

**For development and customization:**

#### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Anthropic API key (for Claude integration)

#### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/akhavansafaei/amanda.git
   cd amanda
   ```

2. **Set up AI Backend**
   ```bash
   cd services/ai_backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   python server.py
   ```

3. **Set up Backend** (in a new terminal)
   ```bash
   cd services/backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python app.py
   ```

4. **Open Frontend**
   ```bash
   cd services/frontend
   # Open index.html in your browser or use a simple HTTP server:
   python -m http.server 8000
   ```

5. **Access the Application**
   - Open http://localhost:8000 in your browser
   - Create an account and start chatting!

4. **Set up app**
   ```bash
   1. git checkout app (currently)
   2. cd services/amanda_app/AmandaApp
   3. Open constants/config.ts and change the IP address to your own (run ipconfig on Windows / ifconfig on Mac to find it)
   4. npm install
   5. npx expo start
   6. Download Expo Go on your phone
   7. Scan the QR code that appears in the terminal
   ```


## Project Structure

```
amanda/
├── README.md
├── colab/                    # 🆕 Google Colab demo setup
│   ├── Amanda_Colab_Demo.ipynb
│   ├── COLAB_INSTRUCTIONS.md
│   └── README.md
├── services/
│   ├── ai_backend/          # gRPC AI service
│   ├── backend/             # Flask REST API + WebSocket
│   ├── frontend/            # Web UI (HTML/CSS/JS)
│   └── android/             # Mobile app (future)
└── .gitignore
```

## Development Roadmap

### Current Features (Phase 1)
- ✅ Basic gRPC AI backend with Claude integration
- ✅ Session-based authentication
- ✅ Text-based chat streaming
- ✅ Simple chat history
- ✅ User profile viewing

### Future Enhancements (For Students)
- [ ] JWT authentication migration
- [ ] Chat renaming and deletion
- [ ] Voice input/output (TTS/ASR)
- [ ] Multi-language support
- [ ] Advanced profile settings
- [ ] Android mobile app
- [ ] PostgreSQL migration
- [ ] Chat export functionality
- [ ] Message reactions/feedback
- [ ] Conversation analytics

## Contributing

This project is designed for educational purposes. Students are encouraged to:

1. **Understand** the existing codebase
2. **Extend** functionality with new features
3. **Refactor** and improve code quality
4. **Document** their changes

## Learning Objectives

By working on this project, students will learn:

- **Backend Development**: REST APIs, WebSocket, authentication, database design
- **Frontend Development**: Modern JavaScript, async operations, WebSocket clients
- **AI Integration**: Working with AI APIs, streaming responses, prompt engineering
- **System Design**: Microservices architecture, inter-service communication (gRPC)
- **Full-Stack Skills**: Connecting frontend, backend, and AI services

## License

[To be determined]

## Support

For questions or issues, please refer to the documentation:
- **Colab Demo**: [colab/COLAB_INSTRUCTIONS.md](colab/COLAB_INSTRUCTIONS.md)
- **AI Backend**: [services/ai_backend/README.md](services/ai_backend/README.md)
- **Backend API**: [services/backend/README.md](services/backend/README.md)
- **Frontend**: [services/frontend/README.md](services/frontend/README.md)
- **Android**: [services/android/README.md](services/android/README.md)

---

**Note**: This is an educational project. The initial implementation uses simple approaches (session-based auth, SQLite, vanilla JS) to help students understand fundamentals. Students are expected to enhance and modernize the codebase as part of their learning journey.

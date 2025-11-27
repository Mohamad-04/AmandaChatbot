# Amanda Android App

This module is reserved for future Android app development.

## Overview

The Amanda Android app will provide a native mobile experience for the relationship support chatbot, offering users a convenient way to access Amanda on their Android devices.

## Planned Features

### Core Features
- **Native Android Chat Interface**: Material Design UI for seamless chat experience
- **Real-time Messaging**: WebSocket integration for instant AI responses
- **User Authentication**: Secure login and session management
- **Chat History**: Access all previous conversations
- **Offline Queue**: Queue messages when offline, send when connected
- **Push Notifications**: Get notified of new messages (future feature)

### Advanced Features
- **Voice Input**: Speech-to-text for hands-free messaging
- **Voice Output**: Text-to-speech for AI responses
- **Dark Mode**: Support for system-wide dark theme
- **Widgets**: Home screen widget for quick access
- **Share Integration**: Share content to Amanda
- **Biometric Auth**: Fingerprint/Face unlock

## Development Status

⏳ **Not yet implemented** - This is an educational project for students to develop

## Technology Stack (Recommended)

### Language
- **Kotlin** (recommended) or Java
- Minimum SDK: API 24 (Android 7.0)
- Target SDK: Latest stable version

### Architecture
- **MVVM** (Model-View-ViewModel) pattern
- **Repository Pattern** for data management
- **Dependency Injection** with Hilt/Dagger

### Libraries (Suggested)

**Networking:**
- Retrofit 2 - REST API client
- OkHttp - HTTP client
- Socket.IO client - WebSocket communication

**UI:**
- Jetpack Compose (modern) or XML layouts (traditional)
- Material Design 3 components
- Navigation Component

**Database:**
- Room - Local database for chat history
- DataStore - User preferences

**Async:**
- Kotlin Coroutines
- Flow for reactive streams

**Other:**
- Coil/Glide - Image loading
- Timber - Logging
- LeakCanary - Memory leak detection

## Project Structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/amanda/
│   │   │   │   ├── ui/              # UI components
│   │   │   │   │   ├── auth/       # Login/Signup screens
│   │   │   │   │   ├── chat/       # Chat interface
│   │   │   │   │   └── profile/    # Profile screen
│   │   │   │   ├── data/            # Data layer
│   │   │   │   │   ├── repository/ # Data repositories
│   │   │   │   │   ├── api/        # API clients
│   │   │   │   │   ├── websocket/  # WebSocket handler
│   │   │   │   │   └── db/         # Room database
│   │   │   │   ├── domain/          # Business logic
│   │   │   │   │   ├── model/      # Domain models
│   │   │   │   │   └── usecase/    # Use cases
│   │   │   │   └── di/              # Dependency injection
│   │   │   ├── res/                 # Resources
│   │   │   └── AndroidManifest.xml
│   │   └── test/                    # Unit tests
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## Backend API Integration

The Android app will communicate with the Amanda Backend REST API and WebSocket server.

### API Base URL
- Development: `http://10.0.2.2:5000` (Android emulator)
- Production: `https://your-domain.com`

### Endpoints to Implement

**Authentication:**
```kotlin
// POST /api/auth/signup
data class SignupRequest(val email: String, val password: String)

// POST /api/auth/login  
data class LoginRequest(val email: String, val password: String)

// POST /api/auth/logout
// GET /api/auth/check
```

**User:**
```kotlin
// GET /api/user/profile
data class UserProfile(val id: Int, val email: String, val created_at: String)
```

**Chat:**
```kotlin
// GET /api/chat/list
data class Chat(val id: Int, val title: String, val created_at: String)

// POST /api/chat/create
// GET /api/chat/{id}/messages
data class Message(val id: Int, val role: String, val content: String, val timestamp: String)
```

### WebSocket Implementation

```kotlin
// Connect to ws://localhost:5000
// Emit: send_message { chat_id, message }
// Listen: message_token { text }
// Listen: message_complete { message_id, full_text }
// Listen: error { message }
```

## Getting Started for Students

### Prerequisites

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install required SDK components

2. **Learn the Basics**
   - Android development fundamentals
   - Kotlin programming language
   - Material Design guidelines

3. **Understand the Backend**
   - Review `services/backend/README.md`
   - Test API endpoints with Postman
   - Understand WebSocket communication

### Step-by-Step Development Guide

#### Phase 1: Setup
1. Create new Android project in Android Studio
2. Setup dependency injection (Hilt)
3. Configure Retrofit for API calls
4. Setup Room database for local storage

#### Phase 2: Authentication
1. Implement login screen
2. Implement signup screen
3. Create authentication repository
4. Implement session management
5. Add token/session persistence

#### Phase 3: Chat List
1. Design chat list UI
2. Implement chat repository
3. Fetch chats from API
4. Display chats in RecyclerView
5. Add pull-to-refresh

#### Phase 4: Chat Interface
1. Design chat UI (messages, input)
2. Implement message repository
3. Display messages in RecyclerView
4. Add send message functionality
5. Implement WebSocket for real-time updates

#### Phase 5: Advanced Features
1. Add voice input (Speech Recognition API)
2. Add voice output (Text-to-Speech API)
3. Implement push notifications
4. Add offline support
5. Implement dark mode

#### Phase 6: Polish
1. Add animations and transitions
2. Implement error handling
3. Add loading states
4. Write unit tests
5. Optimize performance

## Sample Code

### API Client (Retrofit)

```kotlin
interface AmandaApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
    
    @GET("api/chat/list")
    suspend fun getChats(): ChatsResponse
    
    @POST("api/chat/create")
    suspend fun createChat(): CreateChatResponse
    
    @GET("api/chat/{id}/messages")
    suspend fun getMessages(@Path("id") chatId: Int): MessagesResponse
}
```

### WebSocket Client

```kotlin
class ChatWebSocketClient(private val url: String) {
    private var socket: Socket? = null
    
    fun connect() {
        socket = IO.socket(url)
        socket?.connect()
        
        socket?.on("message_token") { args ->
            val data = args[0] as JSONObject
            val text = data.getString("text")
            // Handle token
        }
        
        socket?.on("message_complete") { args ->
            val data = args[0] as JSONObject
            // Handle completion
        }
    }
    
    fun sendMessage(chatId: Int, message: String) {
        val data = JSONObject().apply {
            put("chat_id", chatId)
            put("message", message)
        }
        socket?.emit("send_message", data)
    }
}
```

### Chat ViewModel

```kotlin
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val webSocketClient: ChatWebSocketClient
) : ViewModel() {
    
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages
    
    fun loadMessages(chatId: Int) {
        viewModelScope.launch {
            val result = chatRepository.getMessages(chatId)
            _messages.value = result
        }
    }
    
    fun sendMessage(chatId: Int, message: String) {
        webSocketClient.sendMessage(chatId, message)
    }
}
```

## Resources

### Official Documentation
- [Android Developer Guide](https://developer.android.com/docs)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Material Design](https://material.io/design)

### Tutorials
- [Android Basics with Compose](https://developer.android.com/courses/android-basics-compose/course)
- [Retrofit Tutorial](https://square.github.io/retrofit/)
- [Room Database Guide](https://developer.android.com/training/data-storage/room)

### Libraries
- [Socket.IO Android Client](https://github.com/socketio/socket.io-client-java)
- [Retrofit](https://square.github.io/retrofit/)
- [Room](https://developer.android.com/jetpack/androidx/releases/room)
- [Hilt](https://developer.android.com/training/dependency-injection/hilt-android)

## Testing

### Unit Tests
- Test ViewModels with JUnit
- Test Repositories with Mockito
- Test Use Cases

### UI Tests
- Espresso for UI testing
- Test authentication flow
- Test chat functionality

### Integration Tests
- Test API integration
- Test WebSocket communication
- Test database operations

## Deployment

### Debug Build
1. Build APK in Android Studio
2. Install on physical device or emulator
3. Test all features

### Release Build
1. Configure signing key
2. Enable ProGuard/R8
3. Build release APK/AAB
4. Test thoroughly
5. Publish to Google Play Store

## Performance Considerations

- **Memory**: Use pagination for chat history
- **Network**: Implement caching strategy
- **Battery**: Optimize WebSocket connection
- **Storage**: Clean up old messages
- **UI**: Use RecyclerView efficiently

## Security

- **API Keys**: Store securely in BuildConfig
- **Session Tokens**: Encrypt local storage
- **SSL Pinning**: Pin backend SSL certificate
- **ProGuard**: Obfuscate release builds
- **Input Validation**: Validate all user inputs

## Future Enhancements

- **Multi-account Support**: Switch between accounts
- **Backup/Restore**: Cloud backup of chat history
- **Widgets**: Home screen widgets
- **Wear OS**: Smartwatch companion app
- **Tablets**: Optimize for tablet UI
- **Landscape Mode**: Optimized landscape layouts

## Contributing

This is a student project - contributions and improvements are welcome!

## License

Educational project - free to use and modify

# Advanced Voice Chat - Amanda

Real-time bidirectional voice chat with automatic turn detection, streaming ASR, and streaming TTS.

## Features

### 🎙️ **Automatic Turn Detection**
- Voice Activity Detection (VAD) automatically detects when you start/stop speaking
- No need to manually click buttons
- Configurable sensitivity and pause duration

### 🔄 **Bidirectional Streaming**
- Real-time audio streaming in both directions
- Minimal latency (~200-500ms)
- WebSocket-based communication

### 🎨 **Beautiful Animated UI**
- Animated orb that responds to different states (idle, listening, processing, speaking)
- Real-time sound wave visualization
- Smooth state transitions

### 📝 **Live Transcription**
- See your speech transcribed in real-time
- View AI responses as they're generated
- Full conversation history sidebar

### ⚙️ **Customizable Settings**
- Adjust VAD sensitivity
- Configure pause detection duration
- Control TTS speech speed

## Usage

### Starting Voice Chat

1. **From Dashboard**: Click the "Voice Chat" button in the chat header
2. **Grant Microphone Access**: Allow browser to access your microphone
3. **Start Talking**: Click the microphone button and start speaking
4. **Automatic Detection**: The system will automatically detect when you stop speaking
5. **Listen to Response**: AI response will be spoken back to you

### Controls

- **Microphone Button**: Toggle voice chat on/off
- **Settings**: Configure VAD sensitivity, pause duration, and TTS speed
- **History**: View full conversation transcript
- **Back**: Return to text chat

## How It Works

```
User Speaks
    ↓
VAD Detects Speech Start → Start Recording
    ↓
User Pauses
    ↓
VAD Detects Silence → Stop Recording
    ↓
Send Audio to Server via WebSocket
    ↓
Server: ASR (Speech-to-Text)
    ↓
Server: AI Processing
    ↓
Server: TTS (Text-to-Speech)
    ↓
Stream Audio Back to Client
    ↓
Auto-Play Response
    ↓
Ready for Next Turn
```

## Technical Details

### Frontend Components

- **voice-chat.html**: Main UI with animated orb
- **vad-detector.js**: Voice Activity Detection using Web Audio API
- **grpc-voice-client.js**: WebSocket client for bidirectional streaming
- **voice-chat.js**: Main controller orchestrating all components
- **voice-chat.css**: Beautiful animated styles

### Backend Components

- **voice_server.py**: WebSocket server (runs on port 8080)
- **streaming_voice_service.py**: Session management and processing
- **voice_websocket_handler.py**: WebSocket message handling

### Communication Protocol

Messages are JSON-encoded and sent over WebSocket:

**Client → Server:**
```json
{
  "type": "audio_chunk",
  "session_id": "session_123",
  "data": "base64_audio_data",
  "format": "webm",
  "is_final": true
}
```

**Server → Client:**
```json
{
  "type": "transcript",
  "text": "Hello, how can I help?",
  "role": "assistant",
  "is_final": true
}
```

## Configuration

### VAD Settings

- **Sensitivity** (0.1-0.9): Lower = more sensitive, Higher = less sensitive
- **Pause Duration** (500-3000ms): How long to wait before considering speech ended
- **Min Speech Duration** (300ms): Minimum speech length to be considered valid

### TTS Settings

- **Speed** (0.5-2.0x): Speech playback speed
- **Voice**: Configured in server config.yaml
- **Format**: MP3, WAV, or other formats

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- Microphone access
- WebSocket support
- Web Audio API support

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS (required for mic access)
- Try different browser

### High Latency
- Check network connection
- Reduce VAD pause duration
- Use faster ASR provider (WhisperX)

### VAD Too Sensitive
- Increase threshold in settings
- Reduce background noise
- Use headphones

### VAD Not Detecting Speech
- Decrease threshold in settings
- Speak louder
- Check microphone levels

## Development

### Running the Voice Server

```bash
cd services/ai_backend
python voice_server.py
```

### Testing Locally

1. Start voice server: `python voice_server.py`
2. Start main backend: `python app.py`
3. Start frontend: `python -m http.server 8000`
4. Navigate to: `http://localhost:8000/voice-chat/`

## Performance

- **Latency**: ~200-500ms total (ASR + AI + TTS)
- **Audio Quality**: 16kHz sample rate, opus/webm codec
- **Bandwidth**: ~10-20 KB/s per direction
- **CPU**: Moderate (depends on ASR/TTS provider)

## Future Improvements

- [ ] Interrupt AI while speaking
- [ ] Multiple simultaneous conversations
- [ ] Voice activity animation based on actual audio levels
- [ ] Save and replay conversations
- [ ] Export transcripts

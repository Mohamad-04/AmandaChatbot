# Voice Integration Guide

Complete guide for adding voice chat (ASR + TTS) to Amanda.

## Overview

Amanda now supports **voice conversations** using:
- **ASR (Automatic Speech Recognition)**: Convert user speech to text
- **TTS (Text-to-Speech)**: Convert Amanda's responses to natural speech

## Architecture

```
┌─────────────────┐
│  User speaks    │
└────────┬────────┘
         │ Audio
         ▼
┌─────────────────────────────────────┐
│  ASR (Whisper API)                  │
│  Speech → Text                      │
└────────┬────────────────────────────┘
         │ Text
         ▼
┌─────────────────────────────────────┐
│  TherapeuticCoordinator             │
│  - Amanda (responds)                │
│  - Supervisor (detects risks)       │
│  - Risk Assessor (if needed)        │
└────────┬────────────────────────────┘
         │ Text (streaming)
         ▼
┌─────────────────────────────────────┐
│  TTS (OpenAI TTS)                   │
│  Text → Speech (streaming)          │
└────────┬────────────────────────────┘
         │ Audio
         ▼
┌─────────────────┐
│  User hears     │
└─────────────────┘
```

## Technology Stack

### ASR Provider: OpenAI Whisper
- **Quality**: State-of-the-art accuracy
- **Languages**: 99+ languages supported
- **Cost**: $0.006 per minute (~$0.36/hour)
- **Latency**: ~2-5 seconds for 10-second audio clip
- **Best for**: Accurate transcription of emotional/therapeutic conversations

### TTS Provider: OpenAI TTS
- **Quality**: Natural-sounding neural voices
- **Voices**: 6 options (nova, shimmer recommended for therapy)
- **Cost**: $0.015 per 1K characters (~$0.30 for 20K chars)
- **Streaming**: Supports chunked audio generation
- **Best for**: Natural, empathetic voice responses

## Setup

### 1. Install Dependencies

```bash
cd services/ai_backend
pip install openai
```

### 2. Configure API Key

Add your OpenAI API key to `config.yaml`:

```yaml
llm:
  api_keys:
    openai: "sk-your-api-key-here"  # Required for voice features
```

### 3. Enable Voice Features

Update `config.yaml`:

```yaml
voice:
  enabled: true

  asr:
    provider: "whisper"
    model: "whisper-1"
    language: "en"

  tts:
    provider: "openai"
    model: "tts-1"      # or tts-1-hd for higher quality
    voice: "nova"       # warm, empathetic female voice
    speed: 1.0
```

## Usage Examples

### Basic ASR (Speech to Text)

```python
from src.voice import WhisperASRProvider

# Initialize ASR
asr = WhisperASRProvider()

# Transcribe audio file
with open("user_audio.wav", "rb") as f:
    audio_data = f.read()

text = asr.transcribe(audio_data, language="en", audio_format="wav")
print(f"User said: {text}")
```

### Basic TTS (Text to Speech)

```python
from src.voice import OpenAITTSProvider

# Initialize TTS
tts = OpenAITTSProvider(default_voice="nova")

# Convert text to speech
text = "I understand that communication can be challenging."
audio_data = tts.synthesize(text)

# Save audio
with open("response.mp3", "wb") as f:
    f.write(audio_data)
```

### Complete Voice Conversation

```python
from src.voice.voice_service import create_voice_service
from src.providers import ProviderFactory
from src.orchestrator import TherapeuticCoordinator
from src.config import config

# Create voice service
voice_service = create_voice_service(
    openai_api_key="sk-your-key",
    voice="nova",
    language="en"
)

# Create Amanda coordinator
provider = ProviderFactory.create_from_config(config)
coordinator = TherapeuticCoordinator(provider=provider)

# 1. User speaks (transcribe audio)
with open("user_audio.wav", "rb") as f:
    user_text = voice_service.transcribe_audio(f.read(), "wav")
print(f"User: {user_text}")

# 2. Amanda responds (get text)
response_chunks = []
for chunk in coordinator.process_message(user_text):
    response_chunks.append(chunk)

full_response = ''.join(response_chunks)
print(f"Amanda: {full_response}")

# 3. Convert to speech
audio_data = voice_service.synthesize_response(full_response, voice="nova")

# 4. Play or save audio
with open("amanda_response.mp3", "wb") as f:
    f.write(audio_data)
```

### Streaming TTS (Low Latency)

For better user experience, convert text to speech as it streams:

```python
# Get streaming response from Amanda
text_chunks = coordinator.process_message("I'm feeling sad today")

# Convert to streaming audio (buffers at sentence boundaries)
audio_chunks = voice_service.synthesize_streaming_response(
    text_chunks,
    voice="nova",
    buffer_sentences=True  # Wait for sentence end before converting
)

# Play audio chunks as they arrive
for audio_chunk in audio_chunks:
    # Send to audio player
    play_audio(audio_chunk)
```

## Voice Selection Guide

OpenAI TTS offers 6 voices. For therapeutic contexts, we recommend:

| Voice | Gender | Tone | Best For |
|-------|--------|------|----------|
| **nova** ✅ | Female | Warm, empathetic | **Recommended**: Therapeutic conversations |
| **shimmer** ✅ | Female | Energetic, friendly | **Alternative**: Uplifting support |
| alloy | Neutral | Balanced | General use |
| echo | Male | Clear, professional | Male preference |
| fable | Male | British, warm | Formal support |
| onyx | Male | Deep, authoritative | Crisis intervention |

**Recommendation**: Start with **"nova"** for warm, empathetic therapy sessions.

## Performance Considerations

### Latency Breakdown

For a typical 10-second user audio clip:

```
User speaks                  → 10s
ASR processing (Whisper)     → 2-5s
Amanda processing            → 3-8s
TTS processing (OpenAI)      → 2-4s
─────────────────────────────────
Total latency                → 17-27s
```

### Optimization Strategies

1. **Streaming TTS**: Convert text to speech as Amanda generates it
   - Reduces perceived latency by ~5-10 seconds
   - User hears response while Amanda is still generating

2. **Sentence Buffering**: Wait for sentence boundaries
   - Better audio quality (complete thoughts)
   - More natural pacing

3. **Voice Activity Detection (VAD)**: Detect when user stops speaking
   - Start processing immediately (don't wait for timeout)
   - Reduces latency by 1-2 seconds

4. **Parallel Processing**: Run ASR while capturing audio
   - Process in chunks as they arrive
   - Can reduce latency by 2-3 seconds

## Cost Estimation

For a typical 30-minute therapy session:

```
ASR (Whisper):
- 30 minutes of user audio
- Cost: 30 min × $0.006/min = $0.18

TTS (OpenAI):
- ~5,000 characters (Amanda responses)
- Cost: 5K chars × $0.015/1K = $0.075

Total per 30-min session: ~$0.26
Monthly (40 sessions): ~$10.40
```

**Very affordable** for production use!

## Integration with Frontend

### Option 1: WebRTC + gRPC Streaming

Best for real-time, low-latency voice chat:

```javascript
// Frontend (React/Vue/Vanilla JS)

// 1. Capture microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);

// 2. Send audio chunks to backend via gRPC
mediaRecorder.ondataavailable = async (event) => {
  const audioBlob = event.data;

  // Send to backend
  const response = await grpcClient.transcribeAudio({
    audio: await audioBlob.arrayBuffer(),
    format: 'webm'
  });

  console.log('User said:', response.text);
};

// 3. Receive and play audio response
const audioChunks = grpcClient.streamVoiceResponse({ message: userText });

for await (const chunk of audioChunks) {
  // Play audio chunk
  const audioBlob = new Blob([chunk.audio], { type: 'audio/mp3' });
  playAudio(audioBlob);
}
```

### Option 2: Simple Upload/Download

Simpler but higher latency:

```javascript
// 1. Record audio
const audioBlob = await recordAudio();

// 2. Upload to backend
const formData = new FormData();
formData.append('audio', audioBlob, 'audio.wav');

const response = await fetch('/api/voice/chat', {
  method: 'POST',
  body: formData
});

// 3. Get audio response
const responseAudio = await response.blob();
playAudio(responseAudio);
```

## Testing

Run the example script:

```bash
cd services/ai_backend
python examples/voice_chat_example.py
```

This will:
1. Test ASR (if you provide a sample audio file)
2. Test TTS (generates amanda_response.mp3)
3. Test full conversation flow
4. Test streaming TTS

## Troubleshooting

### Error: "OpenAI package not installed"

```bash
pip install openai
```

### Error: "OPENAI_API_KEY not set"

```bash
export OPENAI_API_KEY='sk-your-key-here'
```

Or add to `config.yaml`:

```yaml
llm:
  api_keys:
    openai: "sk-your-key-here"
```

### Audio quality is poor

Use higher quality TTS model:

```yaml
voice:
  tts:
    model: "tts-1-hd"  # Higher quality, same cost
```

### Too much latency

1. Enable streaming TTS (see examples above)
2. Use sentence buffering
3. Reduce audio chunk size in config

### Wrong language detected

Specify language explicitly:

```python
text = asr.transcribe(audio_data, language="es")  # Spanish
```

Supported languages: en, es, fr, de, it, pt, nl, pl, ru, ar, zh, ja, ko, and 80+ more

## Next Steps

1. **Add to gRPC service**: Extend `server.py` with voice endpoints
2. **Frontend integration**: Add microphone capture and audio playback
3. **Voice Activity Detection**: Detect when user stops speaking
4. **Multi-language support**: Support conversations in other languages
5. **Custom voices**: Train custom voice models for Amanda

## API Reference

### WhisperASRProvider

```python
class WhisperASRProvider(ASRProvider):
    def __init__(self, api_key: str, model: str = "whisper-1")

    def transcribe(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        audio_format: str = "wav"
    ) -> str

    def transcribe_file(
        self,
        audio_file_path: str,
        language: Optional[str] = None
    ) -> str
```

### OpenAITTSProvider

```python
class OpenAITTSProvider(TTSProvider):
    VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

    def __init__(
        self,
        api_key: str,
        model: str = "tts-1",
        default_voice: str = "nova"
    )

    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> bytes

    def synthesize_stream(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> Iterator[bytes]
```

### VoiceService

```python
class VoiceService:
    def __init__(
        self,
        asr_provider: ASRProvider,
        tts_provider: TTSProvider,
        asr_language: str = "en"
    )

    def transcribe_audio(
        self,
        audio_data: bytes,
        audio_format: str = "wav"
    ) -> str

    def synthesize_response(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> bytes

    def synthesize_streaming_response(
        self,
        text_chunks: Iterator[str],
        voice: Optional[str] = None,
        speed: float = 1.0,
        buffer_sentences: bool = True
    ) -> Iterator[bytes]
```

## Resources

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI TTS API Docs](https://platform.openai.com/docs/guides/text-to-speech)
- [Voice samples](https://platform.openai.com/docs/guides/text-to-speech/voice-options)

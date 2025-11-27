#!/usr/bin/env python
"""
Voice Chat Example - Testing ASR + TTS Integration

Demonstrates how to use voice features with Amanda:
1. Record audio from microphone
2. Convert to text with Whisper ASR
3. Send to Amanda coordinator
4. Convert response to speech with OpenAI TTS
5. Play audio

Prerequisites:
- pip install openai pyaudio sounddevice
- Set OPENAI_API_KEY environment variable
"""
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.voice import WhisperASRProvider, OpenAITTSProvider, VoiceService
from src.providers import ProviderFactory
from src.orchestrator import TherapeuticCoordinator
from src.config import config


def test_asr_only():
    """Test ASR (Speech to Text) only."""
    print("=== Testing ASR (Speech to Text) ===\n")

    # Load a sample audio file (you need to provide this)
    audio_file = "sample_audio.wav"

    if not os.path.exists(audio_file):
        print(f"❌ Please provide a sample audio file: {audio_file}")
        print("You can record one using your phone or any audio recorder.")
        return

    # Create ASR provider
    asr = WhisperASRProvider()

    # Transcribe
    print(f"Transcribing {audio_file}...")
    text = asr.transcribe_file(audio_file)

    print(f"\n✅ Transcription result:")
    print(f"   '{text}'\n")


def test_tts_only():
    """Test TTS (Text to Speech) only."""
    print("=== Testing TTS (Text to Speech) ===\n")

    # Create TTS provider
    tts = OpenAITTSProvider(default_voice="nova")

    # Test text
    text = "Hello! I'm Amanda, your relationship support assistant. How are you feeling today?"

    print(f"Converting to speech: '{text}'")

    # Synthesize
    audio_data = tts.synthesize(text)

    # Save to file
    output_file = "test_output.mp3"
    with open(output_file, 'wb') as f:
        f.write(audio_data)

    print(f"\n✅ Audio saved to: {output_file}")
    print("   Play it with any audio player!")


def test_voice_service():
    """Test complete voice service."""
    print("=== Testing Voice Service (ASR + TTS) ===\n")

    # Create voice service
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not set!")
        return

    from src.voice.voice_service import create_voice_service
    voice_service = create_voice_service(
        openai_api_key=api_key,
        voice="nova",
        language="en"
    )

    print("✅ Voice service created")

    # Test ASR
    audio_file = "sample_audio.wav"
    if os.path.exists(audio_file):
        print(f"\n1. Transcribing {audio_file}...")
        text = voice_service.transcribe_audio(
            open(audio_file, 'rb').read(),
            audio_format="wav"
        )
        print(f"   Result: '{text}'")
    else:
        # Use sample text instead
        text = "I'm having trouble communicating with my partner"
        print(f"\n1. Using sample text: '{text}'")

    # Test TTS
    print("\n2. Converting Amanda's response to speech...")
    response = "I understand that communication difficulties can be really challenging. Can you tell me more about what's been happening?"

    audio_data = voice_service.synthesize_response(response, voice="nova")

    output_file = "amanda_response.mp3"
    with open(output_file, 'wb') as f:
        f.write(audio_data)

    print(f"   ✅ Audio saved to: {output_file}")


def test_full_voice_conversation():
    """Test complete voice conversation with Amanda."""
    print("=== Testing Full Voice Conversation ===\n")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not set!")
        return

    # Create voice service
    from src.voice.voice_service import create_voice_service
    voice_service = create_voice_service(
        openai_api_key=api_key,
        voice="nova"
    )

    # Create Amanda coordinator
    provider = ProviderFactory.create_from_config(config)
    coordinator = TherapeuticCoordinator(provider=provider)

    print("✅ Amanda voice chat ready!\n")

    # Simulate voice input (in real app, this would come from microphone)
    user_audio_file = "sample_audio.wav"

    if os.path.exists(user_audio_file):
        # Transcribe user's audio
        print("1. User speaks (transcribing audio)...")
        with open(user_audio_file, 'rb') as f:
            user_text = voice_service.transcribe_audio(f.read(), "wav")
        print(f"   User said: '{user_text}'\n")
    else:
        # Use text directly
        user_text = "I've been feeling disconnected from my partner lately"
        print(f"1. User input: '{user_text}'\n")

    # Get Amanda's response (streaming)
    print("2. Amanda is responding...")
    response_chunks = []

    for chunk in coordinator.process_message(user_text):
        response_chunks.append(chunk)
        print(chunk, end='', flush=True)

    print("\n")

    # Convert response to speech
    print("3. Converting to speech...")
    full_response = ''.join(response_chunks)

    audio_data = voice_service.synthesize_response(full_response, voice="nova")

    output_file = "amanda_full_response.mp3"
    with open(output_file, 'wb') as f:
        f.write(audio_data)

    print(f"   ✅ Audio saved to: {output_file}\n")
    print("In a real application, this audio would be played directly to the user!")


def test_streaming_tts():
    """Test streaming TTS with Amanda's streaming responses."""
    print("=== Testing Streaming TTS ===\n")
    print("This shows how to convert Amanda's streaming text to streaming audio\n")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not set!")
        return

    # Create voice service and coordinator
    from src.voice.voice_service import create_voice_service
    voice_service = create_voice_service(api_key, voice="nova")

    provider = ProviderFactory.create_from_config(config)
    coordinator = TherapeuticCoordinator(provider=provider)

    # Get streaming response from Amanda
    user_message = "I'm struggling with trust issues in my relationship"

    print(f"User: {user_message}\n")
    print("Amanda (streaming text): ", end='')

    # Get text chunks from Amanda
    text_chunks = coordinator.process_message(user_message)

    # Convert streaming text to streaming audio
    print("\nConverting to streaming audio...")

    audio_chunks = list(voice_service.synthesize_streaming_response(
        text_chunks,
        voice="nova",
        buffer_sentences=True  # Buffer until sentence boundaries
    ))

    print(f"\n✅ Generated {len(audio_chunks)} audio chunks")
    print("In a real application, these would be played as they arrive!")


if __name__ == '__main__':
    print("=" * 60)
    print("Amanda Voice Chat Examples")
    print("=" * 60)
    print()

    # Check API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set!")
        print()
        print("Set it with:")
        print("  export OPENAI_API_KEY='your-api-key-here'")
        print()
        sys.exit(1)

    # Run tests
    try:
        # Uncomment the test you want to run:

        # test_asr_only()
        # test_tts_only()
        # test_voice_service()
        test_full_voice_conversation()
        # test_streaming_tts()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

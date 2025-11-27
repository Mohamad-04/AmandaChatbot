"""
TTS (Text-to-Speech) Providers

Converts text to speech audio using various APIs.
"""
import os
from abc import ABC, abstractmethod
from typing import Optional, Iterator, BinaryIO
from pathlib import Path


class TTSProvider(ABC):
    """
    Base class for TTS (Text-to-Speech) providers.

    Subclasses implement specific TTS services (OpenAI, ElevenLabs, etc.)
    """

    @abstractmethod
    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> bytes:
        """
        Synthesize text to speech audio (complete).

        Args:
            text: Text to convert to speech
            voice: Voice ID/name to use
            speed: Speech speed (0.25 to 4.0)

        Returns:
            Audio data as bytes
        """
        pass

    @abstractmethod
    def synthesize_stream(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> Iterator[bytes]:
        """
        Synthesize text to speech audio (streaming).

        Args:
            text: Text to convert to speech
            voice: Voice ID/name to use
            speed: Speech speed (0.25 to 4.0)

        Yields:
            Audio chunks as bytes
        """
        pass


class OpenAITTSProvider(TTSProvider):
    """
    OpenAI TTS provider.

    Uses OpenAI's TTS API with natural-sounding voices.
    Supports streaming for low-latency playback.

    Cost: $0.015 per 1K characters (standard), $0.030 per 1K (HD)

    Available voices:
    - alloy: Neutral, balanced
    - echo: Male, clear
    - fable: British accent, warm
    - onyx: Deep male voice
    - nova: Female, warm (recommended for therapy)
    - shimmer: Female, energetic (recommended for therapy)
    """

    # Available voice options
    VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "tts-1",
        default_voice: str = "nova"
    ):
        """
        Initialize OpenAI TTS provider.

        Args:
            api_key: OpenAI API key (or from OPENAI_API_KEY env var)
            model: TTS model to use (tts-1 or tts-1-hd)
            default_voice: Default voice to use
        """
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )

        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required. Set OPENAI_API_KEY or pass api_key parameter.")

        self.client = OpenAI(api_key=self.api_key)
        self.model = model  # tts-1 (fast) or tts-1-hd (quality)
        self.default_voice = default_voice

        if default_voice not in self.VOICES:
            raise ValueError(f"Invalid voice '{default_voice}'. Choose from: {', '.join(self.VOICES)}")

    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> bytes:
        """
        Synthesize complete text to speech audio.

        Args:
            text: Text to convert to speech
            voice: Voice name (alloy, echo, fable, onyx, nova, shimmer)
            speed: Speech speed (0.25 to 4.0, default 1.0)

        Returns:
            Complete audio data as bytes (MP3 format)
        """
        voice = voice or self.default_voice

        if voice not in self.VOICES:
            raise ValueError(f"Invalid voice '{voice}'. Choose from: {', '.join(self.VOICES)}")

        if not (0.25 <= speed <= 4.0):
            raise ValueError(f"Speed must be between 0.25 and 4.0, got {speed}")

        try:
            response = self.client.audio.speech.create(
                model=self.model,
                voice=voice,
                input=text,
                speed=speed,
                response_format="mp3"
            )

            # Read all audio data
            return response.content

        except Exception as e:
            print(f"Error in OpenAI TTS synthesis: {e}")
            raise

    def synthesize_stream(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> Iterator[bytes]:
        """
        Synthesize text to speech audio with streaming.

        This allows audio playback to start before the entire audio is generated,
        reducing perceived latency. Perfect for Amanda's streaming responses!

        Args:
            text: Text to convert to speech
            voice: Voice name (alloy, echo, fable, onyx, nova, shimmer)
            speed: Speech speed (0.25 to 4.0, default 1.0)

        Yields:
            Audio chunks as bytes (MP3 format)
        """
        voice = voice or self.default_voice

        if voice not in self.VOICES:
            raise ValueError(f"Invalid voice '{voice}'. Choose from: {', '.join(self.VOICES)}")

        if not (0.25 <= speed <= 4.0):
            raise ValueError(f"Speed must be between 0.25 and 4.0, got {speed}")

        try:
            # Create streaming response
            response = self.client.audio.speech.create(
                model=self.model,
                voice=voice,
                input=text,
                speed=speed,
                response_format="mp3"
            )

            # Stream audio chunks
            # OpenAI returns the response object which can be iterated
            yield response.content

        except Exception as e:
            print(f"Error in OpenAI TTS streaming: {e}")
            raise

    def synthesize_to_file(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ):
        """
        Synthesize text to speech and save to file.

        Args:
            text: Text to convert to speech
            output_path: Path to save audio file (will be MP3)
            voice: Voice name
            speed: Speech speed
        """
        audio_data = self.synthesize(text, voice, speed)

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'wb') as f:
            f.write(audio_data)

        print(f"Audio saved to: {output_file}")


class GoogleTTSProvider(TTSProvider):
    """
    Google TTS provider (Gemini TTS from AI Studio).

    Uses Google's Gemini TTS models with natural-sounding voices.
    Available through Google AI Studio API.

    Requirements:
    - pip install google-generativeai
    - Google AI Studio API key (from https://aistudio.google.com/app/apikey)

    Available models:
    - text-to-speech-001: Standard quality, fast
    - text-to-speech-002: Higher quality (if available)

    Voices:
    - Journey (female, warm)
    - Puck (male, energetic)
    - Charon (male, deep)
    - Kore (female, clear)
    - Fenrir (male, authoritative)
    - Aoede (female, gentle)

    Cost: Check Google AI Studio pricing
    """

    # Available voice options (these may vary - check Google docs)
    VOICES = ["Journey", "Puck", "Charon", "Kore", "Fenrir", "Aoede"]

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "text-to-speech-001",
        default_voice: str = "Journey"
    ):
        """
        Initialize Google TTS provider.

        Args:
            api_key: Google AI Studio API key
            model: TTS model to use
            default_voice: Default voice name
        """
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError(
                "Google GenerativeAI package not installed. "
                "Install with: pip install google-generativeai"
            )

        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Google API key required. Get one from https://aistudio.google.com/app/apikey\n"
                "Set GOOGLE_API_KEY environment variable or pass api_key parameter."
            )

        # Configure Google AI
        genai.configure(api_key=self.api_key)

        self.model = model
        self.default_voice = default_voice

        if default_voice not in self.VOICES:
            print(f"Warning: Voice '{default_voice}' may not be available. "
                  f"Available: {', '.join(self.VOICES)}")

    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> bytes:
        """
        Synthesize text to speech using Google TTS.

        Args:
            text: Text to convert to speech
            voice: Voice name (Journey, Puck, Charon, Kore, Fenrir, Aoede)
            speed: Speech speed (0.25 to 4.0)

        Returns:
            Audio data as bytes (MP3 format)
        """
        voice = voice or self.default_voice

        if not (0.25 <= speed <= 4.0):
            raise ValueError(f"Speed must be between 0.25 and 4.0, got {speed}")

        try:
            import google.generativeai as genai

            # Note: Google's TTS API structure may differ
            # This is a placeholder - adjust based on actual Google TTS API

            # For now, use the Cloud Text-to-Speech API approach
            from google.cloud import texttospeech

            client = texttospeech.TextToSpeechClient()

            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Voice configuration
            voice_params = texttospeech.VoiceSelectionParams(
                name=f"en-US-{voice}",  # Adjust based on actual voice names
                language_code="en-US"
            )

            # Audio configuration
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speed
            )

            # Synthesize
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config
            )

            return response.audio_content

        except Exception as e:
            print(f"Error in Google TTS synthesis: {e}")
            print("Note: Google TTS integration is experimental. "
                  "Make sure you have the correct API access and credentials.")
            raise

    def synthesize_stream(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> Iterator[bytes]:
        """
        Synthesize text to speech with streaming (if supported).

        Note: Streaming may not be available in all Google TTS models.
        Falls back to returning complete audio.

        Args:
            text: Text to convert
            voice: Voice name
            speed: Speech speed

        Yields:
            Audio chunks as bytes
        """
        # Google TTS may not support streaming like OpenAI
        # Return complete audio for now
        audio_data = self.synthesize(text, voice, speed)
        yield audio_data

    def synthesize_to_file(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ):
        """
        Synthesize text to speech and save to file.

        Args:
            text: Text to convert
            output_path: Path to save audio file
            voice: Voice name
            speed: Speech speed
        """
        audio_data = self.synthesize(text, voice, speed)

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'wb') as f:
            f.write(audio_data)

        print(f"Audio saved to: {output_file}")

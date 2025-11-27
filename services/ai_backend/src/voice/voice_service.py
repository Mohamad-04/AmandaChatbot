"""
Voice Service - Integrates ASR and TTS with Amanda

Provides high-level voice chat functionality:
- Audio input → text (ASR)
- Text → audio output (TTS)
- Integrated with TherapeuticCoordinator streaming
"""
from typing import Iterator, Optional
from .asr_provider import ASRProvider, WhisperASRProvider
from .tts_provider import TTSProvider, OpenAITTSProvider


class VoiceService:
    """
    Voice service that integrates ASR and TTS for voice conversations.

    Workflow:
    1. User speaks → audio captured
    2. ASR converts audio → text
    3. Text sent to TherapeuticCoordinator
    4. Amanda responds with text chunks (streaming)
    5. TTS converts text chunks → audio chunks
    6. Audio played to user
    """

    def __init__(
        self,
        asr_provider: ASRProvider,
        tts_provider: TTSProvider,
        asr_language: str = "en"
    ):
        """
        Initialize voice service.

        Args:
            asr_provider: ASR provider instance (e.g., WhisperASRProvider)
            tts_provider: TTS provider instance (e.g., OpenAITTSProvider)
            asr_language: Language code for ASR (default: 'en')
        """
        self.asr = asr_provider
        self.tts = tts_provider
        self.asr_language = asr_language

    def transcribe_audio(
        self,
        audio_data: bytes,
        audio_format: str = "wav"
    ) -> str:
        """
        Transcribe audio to text.

        Args:
            audio_data: Raw audio bytes
            audio_format: Audio format (wav, mp3, webm)

        Returns:
            Transcribed text
        """
        return self.asr.transcribe(
            audio_data=audio_data,
            language=self.asr_language,
            audio_format=audio_format
        )

    def synthesize_response(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> bytes:
        """
        Convert text response to audio.

        Args:
            text: Response text
            voice: Voice to use
            speed: Speech speed

        Returns:
            Audio data as bytes
        """
        return self.tts.synthesize(
            text=text,
            voice=voice,
            speed=speed
        )

    def synthesize_streaming_response(
        self,
        text_chunks: Iterator[str],
        voice: Optional[str] = None,
        speed: float = 1.0,
        buffer_sentences: bool = True
    ) -> Iterator[bytes]:
        """
        Convert streaming text response to audio chunks.

        This is optimized for Amanda's streaming responses. Instead of
        converting each tiny chunk to audio (which would be inefficient),
        it buffers text until sentence boundaries and converts sentences.

        Args:
            text_chunks: Iterator of text chunks from Amanda
            voice: Voice to use
            speed: Speech speed
            buffer_sentences: Buffer text until sentence end (recommended)

        Yields:
            Audio chunks as bytes
        """
        if not buffer_sentences:
            # Simple mode: convert each chunk directly
            for chunk in text_chunks:
                if chunk.strip():
                    yield from self.tts.synthesize_stream(chunk, voice, speed)
        else:
            # Smart mode: buffer until sentence boundaries
            buffer = ""
            sentence_endings = {'.', '!', '?', '\n'}

            for chunk in text_chunks:
                buffer += chunk

                # Check if we hit a sentence boundary
                if any(buffer.rstrip().endswith(ending) for ending in sentence_endings):
                    # Convert buffered sentence to audio
                    if buffer.strip():
                        yield from self.tts.synthesize_stream(buffer, voice, speed)
                    buffer = ""

            # Convert any remaining text
            if buffer.strip():
                yield from self.tts.synthesize_stream(buffer, voice, speed)

    @classmethod
    def create_from_config(cls, config) -> 'VoiceService':
        """
        Create voice service from configuration.

        Supports multiple ASR and TTS providers based on config:
        - ASR: whisper (OpenAI API), local-whisper, whisperx
        - TTS: openai, google

        Args:
            config: Configuration object with voice settings

        Returns:
            Configured VoiceService instance
        """
        # Get voice config
        voice_config = getattr(config, 'voice', None)
        if not voice_config:
            raise ValueError("Voice configuration not found in config")

        # Create ASR provider
        asr_config = voice_config.get('asr', {})
        asr_provider_type = asr_config.get('provider', 'whisper')

        if asr_provider_type == 'whisper':
            # OpenAI Whisper API
            api_key = config.api_keys.get('openai')
            if not api_key:
                raise ValueError("OpenAI API key required for Whisper ASR")

            asr_provider = WhisperASRProvider(
                api_key=api_key,
                model=asr_config.get('model', 'whisper-1')
            )

        elif asr_provider_type == 'local-whisper':
            # Local Whisper (runs on your GPU)
            from .asr_provider import LocalWhisperProvider

            asr_provider = LocalWhisperProvider(
                model_size=asr_config.get('model', 'base'),
                device=asr_config.get('device')  # None = auto-detect
            )

        elif asr_provider_type == 'whisperx':
            # WhisperX (faster local inference)
            from .asr_provider import WhisperXProvider

            asr_provider = WhisperXProvider(
                model_size=asr_config.get('model', 'base'),
                device=asr_config.get('device'),
                compute_type=asr_config.get('compute_type', 'float16')
            )

        else:
            raise ValueError(
                f"Unknown ASR provider: {asr_provider_type}. "
                f"Supported: whisper, local-whisper, whisperx"
            )

        # Create TTS provider
        tts_config = voice_config.get('tts', {})
        tts_provider_type = tts_config.get('provider', 'openai')

        if tts_provider_type == 'openai':
            # OpenAI TTS API
            api_key = config.api_keys.get('openai')
            if not api_key:
                raise ValueError("OpenAI API key required for OpenAI TTS")

            tts_provider = OpenAITTSProvider(
                api_key=api_key,
                model=tts_config.get('model', 'tts-1'),
                default_voice=tts_config.get('voice', 'nova')
            )

        elif tts_provider_type == 'google':
            # Google TTS (Gemini TTS from AI Studio)
            from .tts_provider import GoogleTTSProvider

            api_key = config.api_keys.get('google')
            if not api_key:
                raise ValueError("Google API key required for Google TTS")

            tts_provider = GoogleTTSProvider(
                api_key=api_key,
                model=tts_config.get('model', 'text-to-speech-001'),
                default_voice=tts_config.get('voice', 'Journey')
            )

        else:
            raise ValueError(
                f"Unknown TTS provider: {tts_provider_type}. "
                f"Supported: openai, google"
            )

        # Get ASR language
        asr_language = asr_config.get('language', 'en')

        print(f"✓ Voice service created:")
        print(f"  ASR: {asr_provider_type} ({asr_language})")
        print(f"  TTS: {tts_provider_type} (voice: {tts_config.get('voice', 'default')})")

        return cls(
            asr_provider=asr_provider,
            tts_provider=tts_provider,
            asr_language=asr_language
        )


# Convenience function for quick setup
def create_voice_service(
    openai_api_key: str,
    voice: str = "nova",
    language: str = "en"
) -> VoiceService:
    """
    Quick setup for voice service with OpenAI providers.

    Args:
        openai_api_key: OpenAI API key
        voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
        language: Language code (en, es, fr, etc.)

    Returns:
        Configured VoiceService
    """
    asr = WhisperASRProvider(api_key=openai_api_key)
    tts = OpenAITTSProvider(api_key=openai_api_key, default_voice=voice)

    return VoiceService(
        asr_provider=asr,
        tts_provider=tts,
        asr_language=language
    )

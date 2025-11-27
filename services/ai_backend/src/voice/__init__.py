"""
Voice module for ASR (Speech-to-Text) and TTS (Text-to-Speech).

Provides providers for:
- ASR: OpenAI Whisper API, Local Whisper, WhisperX
- TTS: OpenAI TTS, Google TTS (Gemini)
"""
from .asr_provider import (
    ASRProvider,
    WhisperASRProvider,
    LocalWhisperProvider,
    WhisperXProvider
)
from .tts_provider import (
    TTSProvider,
    OpenAITTSProvider,
    GoogleTTSProvider
)

__all__ = [
    'ASRProvider',
    'WhisperASRProvider',
    'LocalWhisperProvider',
    'WhisperXProvider',
    'TTSProvider',
    'OpenAITTSProvider',
    'GoogleTTSProvider',
]

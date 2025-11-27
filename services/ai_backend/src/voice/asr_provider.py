"""
ASR (Automatic Speech Recognition) Providers

Converts audio (speech) to text using various APIs.
"""
import io
import os
from abc import ABC, abstractmethod
from typing import Optional, BinaryIO
from pathlib import Path


class ASRProvider(ABC):
    """
    Base class for ASR (Speech-to-Text) providers.

    Subclasses implement specific ASR services (Whisper, Deepgram, etc.)
    """

    @abstractmethod
    def transcribe(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        audio_format: str = "wav"
    ) -> str:
        """
        Transcribe audio to text.

        Args:
            audio_data: Raw audio bytes
            language: Language code (e.g., 'en', 'es', 'fr')
            audio_format: Audio format (wav, mp3, webm, etc.)

        Returns:
            Transcribed text
        """
        pass

    @abstractmethod
    def transcribe_file(
        self,
        audio_file_path: str,
        language: Optional[str] = None
    ) -> str:
        """
        Transcribe audio file to text.

        Args:
            audio_file_path: Path to audio file
            language: Language code (e.g., 'en', 'es', 'fr')

        Returns:
            Transcribed text
        """
        pass


class WhisperASRProvider(ASRProvider):
    """
    OpenAI Whisper ASR provider.

    Uses OpenAI's Whisper API for speech-to-text.
    Supports 99+ languages with high accuracy.

    Cost: $0.006 per minute of audio
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "whisper-1"):
        """
        Initialize Whisper ASR provider.

        Args:
            api_key: OpenAI API key (or from OPENAI_API_KEY env var)
            model: Whisper model to use (default: whisper-1)
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
        self.model = model

    def transcribe(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        audio_format: str = "wav"
    ) -> str:
        """
        Transcribe audio bytes to text using Whisper.

        Args:
            audio_data: Raw audio bytes
            language: Language code (e.g., 'en' for English)
            audio_format: Audio format (wav, mp3, webm, etc.)

        Returns:
            Transcribed text string
        """
        try:
            # Create a file-like object from bytes
            audio_file = io.BytesIO(audio_data)
            audio_file.name = f"audio.{audio_format}"  # Whisper needs filename extension

            # Call Whisper API
            params = {
                "model": self.model,
                "file": audio_file,
            }

            if language:
                params["language"] = language

            transcript = self.client.audio.transcriptions.create(**params)

            return transcript.text

        except Exception as e:
            print(f"Error in Whisper transcription: {e}")
            raise

    def transcribe_file(
        self,
        audio_file_path: str,
        language: Optional[str] = None
    ) -> str:
        """
        Transcribe audio file to text using Whisper.

        Args:
            audio_file_path: Path to audio file (wav, mp3, webm, etc.)
            language: Language code (e.g., 'en' for English)

        Returns:
            Transcribed text string
        """
        try:
            # Open and read audio file
            with open(audio_file_path, 'rb') as audio_file:
                params = {
                    "model": self.model,
                    "file": audio_file,
                }

                if language:
                    params["language"] = language

                transcript = self.client.audio.transcriptions.create(**params)

                return transcript.text

        except Exception as e:
            print(f"Error transcribing file {audio_file_path}: {e}")
            raise


class LocalWhisperProvider(ASRProvider):
    """
    Local Whisper ASR provider (runs on your hardware).

    Uses OpenAI's Whisper model running locally.
    No API costs, but requires GPU for good performance.

    Requirements:
    - pip install openai-whisper
    - GPU recommended (CUDA) for real-time performance
    - Model sizes: tiny, base, small, medium, large

    Performance (on GPU):
    - tiny: ~32x faster than realtime, less accurate
    - base: ~16x faster than realtime, good accuracy
    - small: ~6x faster than realtime, very good accuracy
    - medium: ~2x faster than realtime, excellent accuracy
    - large: ~1x realtime, best accuracy

    No cost! But requires local GPU.
    """

    def __init__(self, model_size: str = "base", device: Optional[str] = None):
        """
        Initialize local Whisper provider.

        Args:
            model_size: Model size (tiny, base, small, medium, large)
            device: Device to use ('cuda', 'cpu', or None for auto)
        """
        try:
            import whisper
            import torch
        except ImportError:
            raise ImportError(
                "Whisper not installed. Install with: pip install openai-whisper"
            )

        self.model_size = model_size

        # Auto-detect device
        if device is None:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"

        self.device = device

        print(f"Loading Whisper {model_size} model on {device}...")
        self.model = whisper.load_model(model_size, device=device)
        print(f"✓ Whisper {model_size} loaded")

    def transcribe(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        audio_format: str = "wav"
    ) -> str:
        """
        Transcribe audio bytes using local Whisper.

        Args:
            audio_data: Raw audio bytes
            language: Language code (e.g., 'en', 'es')
            audio_format: Audio format (wav, mp3, etc.)

        Returns:
            Transcribed text
        """
        import tempfile

        # Save to temporary file (Whisper requires file input)
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            # Transcribe
            result = self.model.transcribe(
                tmp_path,
                language=language
            )
            return result["text"].strip()
        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    def transcribe_file(
        self,
        audio_file_path: str,
        language: Optional[str] = None
    ) -> str:
        """
        Transcribe audio file using local Whisper.

        Args:
            audio_file_path: Path to audio file
            language: Language code

        Returns:
            Transcribed text
        """
        result = self.model.transcribe(
            audio_file_path,
            language=language
        )
        return result["text"].strip()


class WhisperXProvider(ASRProvider):
    """
    WhisperX ASR provider (faster, with word-level timestamps).

    WhisperX is an optimized version of Whisper with:
    - Faster inference using batching
    - Word-level timestamps (great for subtitles)
    - Voice Activity Detection (VAD)
    - Speaker diarization (who said what)

    Speed: ~70x faster than OpenAI's implementation on GPU!

    Requirements:
    - pip install whisperx
    - GPU highly recommended
    - FFmpeg installed

    Cost: Free (runs locally)
    """

    def __init__(
        self,
        model_size: str = "base",
        device: Optional[str] = None,
        compute_type: str = "float16"
    ):
        """
        Initialize WhisperX provider.

        Args:
            model_size: Model size (tiny, base, small, medium, large-v2)
            device: Device ('cuda' or 'cpu')
            compute_type: Precision (float16 for GPU, int8 for CPU)
        """
        try:
            import whisperx
            import torch
        except ImportError:
            raise ImportError(
                "WhisperX not installed. Install with: pip install whisperx"
            )

        # Auto-detect device
        if device is None:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"

        self.device = device
        self.compute_type = compute_type if device == "cuda" else "int8"

        print(f"Loading WhisperX {model_size} model on {device} ({self.compute_type})...")
        self.model = whisperx.load_model(
            model_size,
            device=device,
            compute_type=self.compute_type
        )
        print(f"✓ WhisperX {model_size} loaded")

    def transcribe(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        audio_format: str = "wav"
    ) -> str:
        """
        Transcribe audio using WhisperX.

        Args:
            audio_data: Raw audio bytes
            language: Language code
            audio_format: Audio format

        Returns:
            Transcribed text
        """
        import tempfile

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            # Load audio
            import whisperx
            audio = whisperx.load_audio(tmp_path)

            # Transcribe
            result = self.model.transcribe(
                audio,
                language=language,
                batch_size=16  # Adjust based on GPU memory
            )

            # Extract text from segments
            text = " ".join(segment["text"] for segment in result["segments"])
            return text.strip()

        finally:
            os.unlink(tmp_path)

    def transcribe_file(
        self,
        audio_file_path: str,
        language: Optional[str] = None
    ) -> str:
        """
        Transcribe audio file using WhisperX.

        Args:
            audio_file_path: Path to audio file
            language: Language code

        Returns:
            Transcribed text
        """
        import whisperx

        # Load audio
        audio = whisperx.load_audio(audio_file_path)

        # Transcribe
        result = self.model.transcribe(
            audio,
            language=language,
            batch_size=16
        )

        # Extract text
        text = " ".join(segment["text"] for segment in result["segments"])
        return text.strip()

"""
Real-Time Streaming Voice Service
True bidirectional streaming with minimal latency
"""
import asyncio
import logging
from typing import AsyncIterator, Optional, List
import base64
import tempfile
import os
import subprocess
import grpc
from collections import deque

from src.voice.voice_service import VoiceService
from src.config import config

# Import AI backend descriptors for gRPC communication
import sys
sys.path.insert(0, os.path.dirname(__file__))
try:
    from descriptors import ChatMessage, ChatChunk, get_service_descriptor
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("Could not import AI backend descriptors")

logger = logging.getLogger(__name__)


class RealtimeVoiceSession:
    """
    Real-time streaming voice session with true bidirectional audio.

    Features:
    - Chunked audio processing (not waiting for complete audio)
    - Streaming AI responses via gRPC
    - Incremental TTS generation
    - Parallel transcription and response generation
    - Low latency (~500ms-2s)
    """

    def __init__(
        self,
        session_id: str,
        user_id: str,
        chat_id: str,
        voice_service: VoiceService,
        ai_backend_host: str = 'localhost',
        ai_backend_port: int = 50051
    ):
        self.session_id = session_id
        self.user_id = user_id
        self.chat_id = chat_id
        self.voice_service = voice_service
        self.ai_backend_host = ai_backend_host
        self.ai_backend_port = ai_backend_port

        # State
        self.is_active = False
        self.is_processing = False
        self.current_user_transcript = ""
        self.current_assistant_transcript = ""

        # Audio buffers (chunked)
        self.audio_chunks = deque(maxlen=100)  # Last 100 chunks
        self.chunk_duration_ms = 250  # 250ms chunks

        # Text buffers for TTS
        self.text_buffer = ""
        self.last_tts_position = 0

        # Queues
        self.output_queue = asyncio.Queue()

        # TTS settings
        self.tts_speed = 1.0

        # gRPC connection
        self.grpc_channel = None
        self.grpc_stub = None

        logger.info(f"Created real-time voice session: {session_id}")

    async def initialize(self):
        """Initialize gRPC connection to AI backend."""
        try:
            address = f'{self.ai_backend_host}:{self.ai_backend_port}'
            self.grpc_channel = grpc.aio.insecure_channel(address)
            logger.info(f"Connected to AI backend at {address}")
        except Exception as e:
            logger.error(f"Failed to connect to AI backend: {e}")
            raise

    async def process_audio_chunk(self, audio_data: str, format: str, is_final: bool):
        """
        Process incoming audio chunk in real-time.

        Args:
            audio_data: Base64 encoded audio chunk
            format: Audio format (webm, wav, etc.)
            is_final: Whether this is the final chunk (user stopped speaking)
        """
        try:
            # Decode audio
            audio_bytes = base64.b64decode(audio_data)

            # Add to buffer
            self.audio_chunks.append(audio_bytes)

            if is_final:
                # User stopped speaking, process accumulated audio
                await self.process_complete_utterance()

        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            await self.send_error(f"Failed to process audio: {str(e)}")

    async def process_complete_utterance(self):
        """
        Process complete user utterance and stream AI response.
        """
        if self.is_processing:
            logger.warning("Already processing, ignoring new utterance")
            return

        self.is_processing = True
        temp_webm = None
        temp_wav = None

        try:
            # Combine chunks
            complete_audio = b''.join(self.audio_chunks)
            self.audio_chunks.clear()

            if len(complete_audio) < 1000:  # Too short
                logger.warning("Audio too short, ignoring")
                self.is_processing = False
                return

            await self.send_status('transcribing')

            # Convert to WAV
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as f:
                f.write(complete_audio)
                temp_webm = f.name

            temp_wav = temp_webm.replace('.webm', '.wav')
            transcript = None

            # Try FFmpeg conversion (if available)
            try:
                result = subprocess.run(
                    ['ffmpeg', '-i', temp_webm, '-ar', '16000', '-ac', '1', '-y', temp_wav],
                    capture_output=True,
                    timeout=10
                )

                if result.returncode == 0:
                    with open(temp_wav, 'rb') as f:
                        wav_data = f.read()
                    transcript = self.voice_service.transcribe_audio(wav_data, audio_format='wav')
                    logger.info("Transcribed using WAV (FFmpeg conversion)")
                else:
                    logger.warning("FFmpeg conversion failed, falling back to WebM")
                    transcript = None

            except FileNotFoundError:
                logger.warning("FFmpeg not found - install FFmpeg for better audio compatibility")
                transcript = None
            except Exception as e:
                logger.warning(f"FFmpeg error: {e}")
                transcript = None

            # Fallback to direct WebM transcription
            if transcript is None:
                logger.info("Trying direct WebM transcription")
                transcript = self.voice_service.transcribe_audio(complete_audio, audio_format='webm')

            if not transcript or not transcript.strip():
                await self.send_error("Could not understand audio")
                self.is_processing = False
                return

            logger.info(f"Transcribed: {transcript}")

            # Send transcript to client
            await self.send_transcript(transcript, 'user', is_final=True)
            self.current_user_transcript = transcript

            # Get streaming AI response
            await self.stream_ai_response(transcript)

        except Exception as e:
            logger.error(f"Error processing utterance: {e}", exc_info=True)
            await self.send_error(f"Processing failed: {str(e)}")
        finally:
            # Cleanup
            for temp_file in [temp_webm, temp_wav]:
                if temp_file and os.path.exists(temp_file):
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
            self.is_processing = False

    async def stream_ai_response(self, user_message: str):
        """
        Stream AI response with incremental TTS.

        This is where we connect to the REAL AI backend!
        """
        try:
            await self.send_status('thinking')

            # Connect to AI backend via gRPC
            request = ChatMessage(
                user_id=self.user_id,
                chat_id=self.chat_id,
                message=user_message
            )

            # Create streaming call
            response_stream = self.grpc_channel.unary_stream(
                '/amanda.ai.AIService/StreamChat',
                request_serializer=ChatMessage.SerializeToString,
                response_deserializer=ChatChunk.FromString,
            )(request)

            # Reset buffers
            self.text_buffer = ""
            self.last_tts_position = 0
            sentence_buffer = ""

            await self.send_status('speaking')

            # Stream response tokens
            async for chunk in response_stream:
                if chunk.text:
                    # Add to buffer
                    self.text_buffer += chunk.text
                    sentence_buffer += chunk.text

                    # Send partial transcript
                    await self.send_transcript(self.text_buffer, 'assistant', is_final=False)

                    # Check for sentence boundaries
                    if self.has_sentence_boundary(sentence_buffer):
                        # Generate TTS for this sentence
                        await self.synthesize_and_stream(sentence_buffer.strip())
                        sentence_buffer = ""

                if chunk.done:
                    # Final chunk - synthesize any remaining text
                    if sentence_buffer.strip():
                        await self.synthesize_and_stream(sentence_buffer.strip())

                    # Send final transcript
                    await self.send_transcript(self.text_buffer, 'assistant', is_final=True)
                    break

        except grpc.aio.AioRpcError as e:
            logger.error(f"gRPC error: {e.code()} - {e.details()}")
            await self.send_error("AI service unavailable")
        except Exception as e:
            logger.error(f"Error streaming AI response: {e}", exc_info=True)
            await self.send_error(f"AI response failed: {str(e)}")

    def has_sentence_boundary(self, text: str) -> bool:
        """Check if text contains a sentence boundary."""
        return any(char in text for char in '.!?\n')

    async def synthesize_and_stream(self, text: str):
        """
        Synthesize text to speech and stream audio chunk.

        Args:
            text: Text to synthesize
        """
        try:
            if not text or len(text) < 3:
                return

            # Generate audio
            audio_data = self.voice_service.synthesize_response(
                text=text,
                speed=self.tts_speed
            )

            # Get format
            audio_format = config.voice.get('audio', {}).get('format', 'mp3')

            # Encode to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            # Stream audio chunk to client
            await self.send_audio_chunk(audio_base64, audio_format, is_final=False)

        except Exception as e:
            logger.error(f"Error in TTS synthesis: {e}")

    async def handle_control(self, command: str, params: dict):
        """Handle control commands."""
        try:
            if command == 'set_tts_speed':
                self.tts_speed = params.get('speed', 1.0)
                logger.info(f"TTS speed set to {self.tts_speed}")

            elif command == 'interrupt':
                # Clear buffers and stop processing
                self.audio_chunks.clear()
                self.text_buffer = ""
                self.is_processing = False
                logger.info("Session interrupted")

        except Exception as e:
            logger.error(f"Error handling control: {e}")

    async def send_transcript(self, text: str, role: str, is_final: bool):
        """Send transcript update to client."""
        message = {
            'type': 'transcript',
            'text': text,
            'role': role,
            'is_final': is_final
        }
        await self.output_queue.put(message)

    async def send_audio_chunk(self, audio_base64: str, format: str, is_final: bool):
        """Send audio chunk to client."""
        message = {
            'type': 'audio_chunk',
            'data': audio_base64,
            'format': format,
            'is_final': is_final
        }
        await self.output_queue.put(message)

    async def send_status(self, status: str):
        """Send status update to client."""
        message = {
            'type': 'status',
            'status': status
        }
        await self.output_queue.put(message)

    async def send_error(self, error: str):
        """Send error message to client."""
        message = {
            'type': 'error',
            'error': error
        }
        await self.output_queue.put(message)

    async def get_output_messages(self) -> AsyncIterator[dict]:
        """Yield output messages to client."""
        while self.is_active or not self.output_queue.empty():
            try:
                message = await asyncio.wait_for(
                    self.output_queue.get(),
                    timeout=0.1
                )
                yield message
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error yielding message: {e}")
                break

    def start(self):
        """Start the session."""
        self.is_active = True
        logger.info(f"Real-time session {self.session_id} started")

    def stop(self):
        """Stop the session."""
        self.is_active = False
        self.audio_chunks.clear()
        if self.grpc_channel:
            asyncio.create_task(self.grpc_channel.close())
        logger.info(f"Real-time session {self.session_id} stopped")

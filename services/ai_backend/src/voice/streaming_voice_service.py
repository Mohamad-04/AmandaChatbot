"""
Streaming Voice Service for real-time bidirectional voice chat.
Handles streaming ASR (Speech-to-Text) and TTS (Text-to-Speech) with minimal latency.
"""
import asyncio
import logging
from typing import AsyncIterator, Optional
import json
import base64
import tempfile
import os
import subprocess

from src.voice.voice_service import VoiceService
from src.config import config

logger = logging.getLogger(__name__)


class StreamingVoiceSession:
    """
    Manages a streaming voice chat session with automatic turn-taking.
    Handles audio input → streaming ASR → AI processing → streaming TTS → audio output
    """

    def __init__(
        self,
        session_id: str,
        user_id: str,
        chat_id: str,
        voice_service: VoiceService
    ):
        self.session_id = session_id
        self.user_id = user_id
        self.chat_id = chat_id
        self.voice_service = voice_service

        # State
        self.is_active = False
        self.current_user_audio = []
        self.current_user_text = ""
        self.current_assistant_text = ""

        # Queues for async communication
        self.audio_input_queue = asyncio.Queue()
        self.transcript_output_queue = asyncio.Queue()
        self.audio_output_queue = asyncio.Queue()
        self.control_queue = asyncio.Queue()

        # TTS settings
        self.tts_speed = 1.0

        logger.info(f"Created streaming voice session: {session_id}")

    async def process_audio_chunk(self, audio_data: bytes, format: str, is_final: bool):
        """
        Process incoming audio chunk from user.

        Args:
            audio_data: Base64 encoded audio data
            format: Audio format (webm, wav, etc.)
            is_final: Whether this is the final chunk (user stopped speaking)
        """
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)

            # Accumulate audio chunks
            self.current_user_audio.append(audio_bytes)

            if is_final:
                # User finished speaking, transcribe complete audio
                await self.transcribe_and_respond()

        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            await self.send_error(f"Failed to process audio: {str(e)}")

    async def transcribe_and_respond(self):
        """
        Transcribe accumulated user audio and generate AI response.
        """
        temp_webm = None
        temp_wav = None

        try:
            # Combine all audio chunks
            complete_audio = b''.join(self.current_user_audio)

            # Send status update
            await self.send_status('transcribing')

            # Save webm to temp file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as f:
                f.write(complete_audio)
                temp_webm = f.name

            logger.info(f"Saved {len(complete_audio)} bytes to {temp_webm}")

            # Try to convert webm to wav using ffmpeg (if available)
            temp_wav = temp_webm.replace('.webm', '.wav')
            transcript = None

            try:
                ffmpeg_cmd = [
                    'ffmpeg',
                    '-i', temp_webm,
                    '-ar', '16000',  # 16kHz sample rate
                    '-ac', '1',       # Mono
                    '-y',             # Overwrite
                    temp_wav
                ]

                result = subprocess.run(
                    ffmpeg_cmd,
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                if result.returncode == 0:
                    logger.info(f"Converted to WAV: {temp_wav}")

                    # Read WAV file
                    with open(temp_wav, 'rb') as f:
                        wav_data = f.read()

                    # Transcribe WAV audio using ASR
                    transcript = self.voice_service.transcribe_audio(
                        audio_data=wav_data,
                        audio_format='wav'
                    )
                else:
                    logger.warning(f"FFmpeg conversion failed: {result.stderr}")
                    transcript = None

            except FileNotFoundError:
                logger.warning("FFmpeg not found - install FFmpeg for better audio compatibility")
                transcript = None
            except Exception as e:
                logger.warning(f"FFmpeg error: {e}")
                transcript = None

            # Fallback to direct WebM transcription if FFmpeg failed or not available
            if transcript is None:
                logger.info("Trying direct WebM transcription")
                transcript = self.voice_service.transcribe_audio(
                    audio_data=complete_audio,
                    audio_format='webm'
                )

            if not transcript or not transcript.strip():
                logger.warning("Empty transcription result")
                await self.send_error("Could not understand audio")
                self.reset_audio_buffer()
                return

            logger.info(f"Transcribed: {transcript}")

            # Send transcript to client
            await self.send_transcript(transcript, 'user', is_final=True)

            # Save user text
            self.current_user_text = transcript

            # Clear audio buffer
            self.reset_audio_buffer()

            # Get AI response
            await self.get_ai_response(transcript)

        except Exception as e:
            logger.error(f"Error in transcribe_and_respond: {e}", exc_info=True)
            await self.send_error(f"Transcription failed: {str(e)}")
            self.reset_audio_buffer()

        finally:
            # Clean up temp files
            for temp_file in [temp_webm, temp_wav]:
                if temp_file and os.path.exists(temp_file):
                    try:
                        os.unlink(temp_file)
                    except Exception as e:
                        logger.warning(f"Failed to delete temp file {temp_file}: {e}")

    async def get_ai_response(self, user_message: str):
        """
        Get AI response for user message and convert to speech.

        Args:
            user_message: Transcribed user message
        """
        try:
            # Send status update
            await self.send_status('processing')

            # TODO: Call AI service via gRPC to get response
            # For now, simulate AI response
            # In production, integrate with your AI orchestrator
            ai_response = await self.simulate_ai_response(user_message)

            if not ai_response:
                ai_response = "I'm sorry, I didn't catch that. Could you repeat?"

            # Send transcript to client
            await self.send_transcript(ai_response, 'assistant', is_final=False)

            # Convert to speech
            await self.synthesize_and_stream(ai_response)

        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            await self.send_error(f"AI processing failed: {str(e)}")

    async def simulate_ai_response(self, user_message: str) -> str:
        """
        Simulate AI response (placeholder).
        In production, this should call your AI orchestrator.
        """
        # TODO: Integrate with actual AI service
        # For now, return a simple response
        await asyncio.sleep(0.5)  # Simulate processing time

        responses = {
            "hello": "Hello! How can I help you today?",
            "how are you": "I'm doing well, thank you for asking! How are you feeling?",
            "goodbye": "Goodbye! Take care!",
        }

        # Simple keyword matching
        user_lower = user_message.lower()
        for keyword, response in responses.items():
            if keyword in user_lower:
                return response

        # Default response
        return "I understand. Could you tell me more about that?"

    async def synthesize_and_stream(self, text: str):
        """
        Convert text to speech and stream audio chunks to client.

        Args:
            text: Text to convert to speech
        """
        try:
            # Send status update
            await self.send_status('synthesizing')

            # Generate audio using TTS
            audio_data = self.voice_service.synthesize_response(
                text=text,
                speed=self.tts_speed
            )

            # Get audio format from config
            audio_format = config.voice.get('audio', {}).get('format', 'mp3')

            # Encode to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            # Send audio chunk to client
            await self.send_audio_chunk(audio_base64, audio_format, is_final=True)

            # Update status
            await self.send_status('speaking')

            # Send final transcript
            await self.send_transcript(text, 'assistant', is_final=True)

        except Exception as e:
            logger.error(f"Error in TTS synthesis: {e}")
            await self.send_error(f"Speech synthesis failed: {str(e)}")

    async def send_transcript(self, text: str, role: str, is_final: bool):
        """
        Send transcript update to client.

        Args:
            text: Transcript text
            role: 'user' or 'assistant'
            is_final: Whether this is the final transcript
        """
        message = {
            'type': 'transcript',
            'text': text,
            'role': role,
            'is_final': is_final
        }

        await self.transcript_output_queue.put(message)

    async def send_audio_chunk(self, audio_base64: str, format: str, is_final: bool):
        """
        Send audio chunk to client.

        Args:
            audio_base64: Base64 encoded audio
            format: Audio format
            is_final: Whether this is the final audio chunk
        """
        message = {
            'type': 'audio_chunk',
            'data': audio_base64,
            'format': format,
            'is_final': is_final
        }

        await self.audio_output_queue.put(message)

    async def send_status(self, status: str):
        """
        Send status update to client.

        Args:
            status: Status message (transcribing, processing, thinking, synthesizing, speaking)
        """
        message = {
            'type': 'status',
            'status': status
        }

        await self.transcript_output_queue.put(message)

    async def send_error(self, error: str):
        """
        Send error message to client.

        Args:
            error: Error message
        """
        message = {
            'type': 'error',
            'error': error
        }

        await self.transcript_output_queue.put(message)

    async def handle_control(self, command: str, params: dict):
        """
        Handle control command from client.

        Args:
            command: Control command
            params: Command parameters
        """
        try:
            if command == 'set_tts_speed':
                self.tts_speed = params.get('speed', 1.0)
                logger.info(f"TTS speed set to {self.tts_speed}")

            elif command == 'interrupt':
                # Interrupt current processing/speech
                self.reset_audio_buffer()
                logger.info("Session interrupted")

            else:
                logger.warning(f"Unknown control command: {command}")

        except Exception as e:
            logger.error(f"Error handling control command: {e}")

    def reset_audio_buffer(self):
        """Reset accumulated audio buffer."""
        self.current_user_audio = []

    async def get_output_messages(self) -> AsyncIterator[dict]:
        """
        Yield output messages (transcripts, audio, status) to client.
        """
        while self.is_active or not self.transcript_output_queue.empty() or not self.audio_output_queue.empty():
            try:
                # Try to get message from transcript queue (prioritize transcripts)
                try:
                    message = self.transcript_output_queue.get_nowait()
                    yield message
                    continue
                except asyncio.QueueEmpty:
                    pass

                # Try to get message from audio queue
                try:
                    message = self.audio_output_queue.get_nowait()
                    yield message
                    continue
                except asyncio.QueueEmpty:
                    pass

                # Wait a bit before checking again
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error yielding output message: {e}")
                break

    def start(self):
        """Start the session."""
        self.is_active = True
        logger.info(f"Session {self.session_id} started")

    def stop(self):
        """Stop the session."""
        self.is_active = False
        self.reset_audio_buffer()
        logger.info(f"Session {self.session_id} stopped")

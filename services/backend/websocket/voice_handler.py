"""
WebSocket voice chat handler for real-time voice conversations.
Handles voice message transcription (ASR) and text-to-speech (TTS) streaming.
"""
import sys
import os
import base64
import io
from flask_socketio import emit, disconnect
from flask import session
from database import db
from models.chat import Chat
from models.message import Message
from services.grpc_client import GRPCClient
from config import get_config

# Add ai_backend to path to import voice service
ai_backend_path = os.path.join(os.path.dirname(__file__), '../../ai_backend')
sys.path.insert(0, ai_backend_path)

try:
    from src.voice.voice_service import VoiceService
    from src.config import config as ai_config
except ImportError as e:
    print(f"Warning: Voice service not available: {e}")
    VoiceService = None


def require_auth(f):
    """
    Decorator to require authentication for WebSocket events.
    Checks if user_id exists in session.
    """
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            emit('error', {'message': 'Authentication required'})
            disconnect()
            return
        return f(*args, **kwargs)
    return decorated_function


def register_voice_handlers(socketio):
    """
    Register all voice-related WebSocket event handlers.

    Args:
        socketio: Flask-SocketIO instance
    """

    # Initialize voice service if enabled
    voice_service = None
    if VoiceService and ai_config.voice.get('enabled', False):
        try:
            voice_service = VoiceService.create_from_config(ai_config)
            print("Voice service initialized successfully")
        except Exception as e:
            print(f"Failed to initialize voice service: {e}")

    @socketio.on('send_voice_message')
    @require_auth
    def handle_send_voice_message(data):
        """
        Handle incoming voice message from client.

        This function:
        1. Receives audio data from client
        2. Transcribes audio to text using ASR
        3. Processes message through AI (same as text)
        4. Converts AI response to speech using TTS
        5. Streams audio response back to client

        Args:
            data (dict): {
                'chat_id': int,
                'audio': str (base64 encoded audio),
                'format': str (audio format: 'wav', 'webm', etc.)
            }

        Emits:
            'voice_transcribed': {text: str} - Transcribed text
            'message_token': {text: str} - AI response chunks
            'voice_chunk': {audio: base64_str} - Audio response chunks
            'message_complete': {message_id: int, full_text: str} - When done
            'error': {message: str} - On any error
        """
        if not voice_service:
            emit('error', {
                'message': 'Voice features are not enabled. Please configure voice in config.yaml'
            })
            return

        try:
            user_id = session['user_id']

            # Validate input
            if not data or 'chat_id' not in data or 'audio' not in data:
                emit('error', {'message': 'Invalid voice data'})
                return

            chat_id = data['chat_id']
            audio_base64 = data['audio']
            audio_format = data.get('format', 'webm')

            # Verify chat exists and belongs to user
            chat = Chat.query.get(chat_id)
            if not chat:
                emit('error', {'message': 'Chat not found'})
                return

            if chat.user_id != user_id:
                emit('error', {'message': 'Access denied'})
                return

            # Decode base64 audio data
            try:
                audio_bytes = base64.b64decode(audio_base64)
            except Exception as e:
                emit('error', {'message': f'Invalid audio data: {e}'})
                return

            # Transcribe audio to text using ASR
            try:
                emit('voice_processing', {'status': 'transcribing'})
                message_text = voice_service.transcribe_audio(
                    audio_data=audio_bytes,
                    audio_format=audio_format
                )

                if not message_text or not message_text.strip():
                    emit('error', {'message': 'Could not transcribe audio. Please try again.'})
                    return

                # Send transcribed text back to client
                emit('voice_transcribed', {'text': message_text})

            except Exception as e:
                print(f"ASR error: {e}")
                emit('error', {'message': f'Transcription failed: {str(e)}'})
                return

            # Save user message to database
            user_message = Message(
                chat_id=chat_id,
                role=Message.ROLE_USER,
                content=message_text
            )
            db.session.add(user_message)
            db.session.commit()

            # Update chat title if this is the first message
            message_count = Message.query.filter_by(chat_id=chat_id).count()
            if message_count == 1:
                chat.update_title_from_first_message()
                db.session.commit()

            # Stream AI response via gRPC
            config = get_config()
            grpc_client = GRPCClient(
                host=config.GRPC_AI_BACKEND_HOST,
                port=config.GRPC_AI_BACKEND_PORT
            )

            full_response = ""

            try:
                emit('voice_processing', {'status': 'thinking'})

                # Collect text chunks from AI
                text_chunks = []
                for chunk in grpc_client.stream_chat(
                    user_id=str(user_id),
                    chat_id=str(chat_id),
                    message=message_text
                ):
                    emit('message_token', {'text': chunk})
                    text_chunks.append(chunk)
                    full_response += chunk

                # Save assistant message to database
                assistant_message = Message(
                    chat_id=chat_id,
                    role=Message.ROLE_ASSISTANT,
                    content=full_response
                )
                db.session.add(assistant_message)
                db.session.commit()

                # Emit text completion
                emit('message_complete', {
                    'message_id': assistant_message.id,
                    'full_text': full_response
                })

                # Convert response to speech using TTS
                try:
                    emit('voice_processing', {'status': 'synthesizing'})

                    # Get TTS format from config
                    tts_format = ai_config.voice.get('audio', {}).get('format', 'mp3')

                    # Generate audio from text
                    audio_response = voice_service.synthesize_response(full_response)

                    # Encode audio as base64
                    audio_base64 = base64.b64encode(audio_response).decode('utf-8')

                    # Send complete audio to client
                    emit('voice_response', {
                        'audio': audio_base64,
                        'format': tts_format
                    })

                except Exception as tts_error:
                    print(f"TTS error: {tts_error}")
                    emit('error', {
                        'message': 'Text-to-speech failed. Response text is available.'
                    })

            except Exception as grpc_error:
                print(f"gRPC streaming error: {grpc_error}")
                emit('error', {
                    'message': 'AI service unavailable. Please try again later.'
                })

            finally:
                grpc_client.close()

        except Exception as e:
            print(f"WebSocket voice error: {e}")
            db.session.rollback()
            emit('error', {
                'message': f'An error occurred processing your voice message: {str(e)}'
            })

    @socketio.on('text_to_speech')
    @require_auth
    def handle_text_to_speech(data):
        """
        Convert text to speech and stream back to client.
        Useful for replaying previous messages.

        Args:
            data (dict): {
                'text': str - Text to convert to speech
                'voice': str (optional) - Voice to use
                'speed': float (optional) - Speech speed
            }

        Emits:
            'voice_response': {audio: base64_str, format: str}
            'error': {message: str}
        """
        if not voice_service:
            emit('error', {
                'message': 'Voice features are not enabled'
            })
            return

        try:
            text = data.get('text', '').strip()
            if not text:
                emit('error', {'message': 'No text provided'})
                return

            voice = data.get('voice')
            speed = data.get('speed', 1.0)

            # Generate audio
            audio_response = voice_service.synthesize_response(
                text=text,
                voice=voice,
                speed=speed
            )

            # Get format from config
            tts_format = ai_config.voice.get('audio', {}).get('format', 'mp3')

            # Encode and send
            audio_base64 = base64.b64encode(audio_response).decode('utf-8')
            emit('voice_response', {
                'audio': audio_base64,
                'format': tts_format
            })

        except Exception as e:
            print(f"TTS error: {e}")
            emit('error', {'message': f'Text-to-speech failed: {str(e)}'})

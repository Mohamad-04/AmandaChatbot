"""
WebSocket handler for real-time streaming voice chat.
Provides bidirectional audio streaming with minimal latency.
"""
import asyncio
import logging
import json
from typing import Dict
from aiohttp import web, WSMsgType

from src.voice.realtime_voice_service import RealtimeVoiceSession
from src.voice.voice_service import VoiceService
from src.config import config

logger = logging.getLogger(__name__)

# Active sessions
active_sessions: Dict[str, RealtimeVoiceSession] = {}


async def voice_stream_handler(request: web.Request) -> web.WebSocketResponse:
    """
    WebSocket handler for bidirectional voice streaming.

    Query params:
        user_id: User ID
        chat_id: Chat ID
        session_id: Unique session ID
    """
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    # Get parameters
    user_id = request.query.get('user_id')
    chat_id = request.query.get('chat_id')
    session_id = request.query.get('session_id')

    if not all([user_id, chat_id, session_id]):
        logger.error("Missing required parameters")
        await ws.close(code=4000, message=b'Missing required parameters')
        return ws

    session = None

    try:
        # Create voice service
        voice_service = VoiceService.create_from_config(config)

        # Create real-time streaming session
        session = RealtimeVoiceSession(
            session_id=session_id,
            user_id=user_id,
            chat_id=chat_id,
            voice_service=voice_service,
            ai_backend_host='localhost',
            ai_backend_port=50051
        )

        # Initialize gRPC connection
        await session.initialize()

        # Store session
        active_sessions[session_id] = session

        # Start session
        session.start()

        logger.info(f"Real-time voice stream started: {session_id}")

        # Create tasks for bidirectional communication
        receive_task = asyncio.create_task(handle_incoming_messages(ws, session))
        send_task = asyncio.create_task(handle_outgoing_messages(ws, session))

        # Wait for either task to complete
        done, pending = await asyncio.wait(
            [receive_task, send_task],
            return_when=asyncio.FIRST_COMPLETED
        )

        # Cancel pending tasks
        for task in pending:
            task.cancel()

    except Exception as e:
        logger.error(f"Error in voice stream: {e}")

    finally:
        # Cleanup
        if session:
            session.stop()

        if session_id in active_sessions:
            del active_sessions[session_id]

        await ws.close()
        logger.info(f"Voice stream closed: {session_id}")

    return ws


async def handle_incoming_messages(ws: web.WebSocketResponse, session: RealtimeVoiceSession):
    """
    Handle incoming messages from client.

    Args:
        ws: WebSocket response
        session: Real-time voice session
    """
    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)

                    msg_type = data.get('type')

                    if msg_type == 'audio_chunk':
                        # Audio chunk from client
                        audio_data = data.get('data')
                        format = data.get('format', 'webm')
                        is_final = data.get('is_final', False)

                        await session.process_audio_chunk(audio_data, format, is_final)

                    elif msg_type == 'control':
                        # Control command
                        command = data.get('command')
                        params = data.get('params', {})

                        await session.handle_control(command, params)

                    else:
                        logger.warning(f"Unknown message type: {msg_type}")

                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON: {e}")

            elif msg.type == WSMsgType.ERROR:
                logger.error(f"WebSocket error: {ws.exception()}")
                break

            elif msg.type == WSMsgType.CLOSE:
                logger.info("Client closed connection")
                break

    except Exception as e:
        logger.error(f"Error handling incoming messages: {e}")


async def handle_outgoing_messages(ws: web.WebSocketResponse, session: RealtimeVoiceSession):
    """
    Handle outgoing messages to client.

    Args:
        ws: WebSocket response
        session: Real-time voice session
    """
    try:
        async for message in session.get_output_messages():
            # Send message to client
            await ws.send_json(message)

    except Exception as e:
        logger.error(f"Error handling outgoing messages: {e}")


def setup_voice_websocket_routes(app: web.Application):
    """
    Setup voice WebSocket routes.

    Args:
        app: aiohttp Application
    """
    app.router.add_get('/voice-stream', voice_stream_handler)
    logger.info("Voice WebSocket routes configured")

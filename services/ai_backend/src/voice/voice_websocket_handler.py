"""
WebSocket handler for real-time streaming voice chat.

Provides bidirectional audio streaming with minimal latency.
Supports two ways to provide session identifiers:
1) Query parameters (legacy): ?user_id=...&chat_id=...&session_id=...
2) WebSocket start message (recommended): {"type":"start", ...}
"""

import asyncio
import json
import logging
import uuid
from typing import Dict, Optional, Tuple

from aiohttp import web, WSMsgType

from src.config import config
from src.voice.realtime_voice_service import RealtimeVoiceSession
from src.voice.voice_service import VoiceService

logger = logging.getLogger(__name__)

# Active sessions (by session_id)
active_sessions: Dict[str, RealtimeVoiceSession] = {}


# ----------------------------
# Helpers
# ----------------------------

async def _send_error(ws: web.WebSocketResponse, message: str, code: int = 4000) -> None:
    """Send a structured error and close the socket."""
    try:
        await ws.send_json({"type": "error", "message": message})
    finally:
        await ws.close(code=code, message=message.encode("utf-8", errors="ignore"))


def _get_query_params(request: web.Request) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract optional session identifiers from query params."""
    return (
        request.query.get("user_id"),
        request.query.get("chat_id"),
        request.query.get("session_id"),
    )


async def _await_start_message(ws: web.WebSocketResponse) -> Tuple[str, str, str]:
    """
    Wait for the first WebSocket message to be a JSON start message.

    Expected:
      {"type":"start", "user_id":"...", "chat_id":"...", "session_id":"...optional..."}

    Returns:
      (user_id, chat_id, session_id)
    """
    first = await ws.receive()

    if first.type != WSMsgType.TEXT:
        raise ValueError("Expected JSON start message as the first WebSocket message.")

    try:
        data = json.loads(first.data)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON in start message.")

    if data.get("type") != "start":
        raise ValueError("First WebSocket message must be of type 'start'.")

    user_id = data.get("user_id") or "test_user"
    chat_id = data.get("chat_id") or "test_chat"
    session_id = data.get("session_id") or str(uuid.uuid4())

    return user_id, chat_id, session_id


# ----------------------------
# WebSocket handler
# ----------------------------

async def voice_stream_handler(request: web.Request) -> web.WebSocketResponse:
    """
    WebSocket handler for bidirectional voice streaming.

    Query params (optional):
        user_id: User ID
        chat_id: Chat ID
        session_id: Unique session ID

    If not provided via query params, the client must send a start message immediately:
        {"type":"start","user_id":"...","chat_id":"...","session_id":"...optional..."}
    """
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    session: Optional[RealtimeVoiceSession] = None
    session_id: Optional[str] = None

    try:
        # 1) Try query params first
        user_id, chat_id, session_id = _get_query_params(request)

        # 2) If missing, use start message
        if not all([user_id, chat_id, session_id]):
            logger.info("Missing query params; waiting for start message over WebSocket...")
            user_id, chat_id, session_id = await _await_start_message(ws)

        # Acknowledge start
        await ws.send_json(
            {"type": "started", "session_id": session_id, "user_id": user_id, "chat_id": chat_id}
        )

        # Create voice service
        voice_service = VoiceService.create_from_config(config)

        # Create real-time streaming session
        session = RealtimeVoiceSession(
            session_id=session_id,
            user_id=user_id,
            chat_id=chat_id,
            voice_service=voice_service,
            ai_backend_host="localhost",
            ai_backend_port=50051,
        )

        # Initialize gRPC connection
        await session.initialize()

        # Store + start
        active_sessions[session_id] = session
        session.start()

        logger.info(f"Real-time voice stream started: {session_id}")

        # Bidirectional tasks
        receive_task = asyncio.create_task(handle_incoming_messages(ws, session))
        send_task = asyncio.create_task(handle_outgoing_messages(ws, session))

        done, pending = await asyncio.wait(
            [receive_task, send_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        # If a task failed, log it
        for t in done:
            exc = t.exception()
            if exc:
                logger.error(f"Voice stream task error: {exc}")

        # Cancel the other task
        for t in pending:
            t.cancel()

    except ValueError as ve:
        logger.warning(f"Voice stream validation error: {ve}")
        await _send_error(ws, str(ve), code=4000)

    except Exception as e:
        logger.error(f"Error in voice stream: {e}", exc_info=True)
        await _send_error(ws, "Internal server error in voice stream.", code=1011)

    finally:
        # Cleanup session
        try:
            if session:
                session.stop()
        except Exception:
            logger.warning("Error stopping voice session during cleanup.", exc_info=True)

        if session_id and session_id in active_sessions:
            del active_sessions[session_id]

        if not ws.closed:
            await ws.close()

        if session_id:
            logger.info(f"Voice stream closed: {session_id}")

    return ws


# ----------------------------
# Incoming / outgoing handlers
# ----------------------------

async def handle_incoming_messages(ws: web.WebSocketResponse, session: RealtimeVoiceSession) -> None:
    """
    Handle incoming messages from client.

    Supported:
      - audio_chunk: {"type":"audio_chunk","data":"...","format":"webm","is_final":false}
      - control:     {"type":"control","command":"...","params":{...}}
    """
    async for msg in ws:
        if msg.type == WSMsgType.TEXT:
            try:
                data = json.loads(msg.data)
            except json.JSONDecodeError:
                logger.warning("Received invalid JSON from client.")
                continue

            msg_type = data.get("type")

            if msg_type == "audio_chunk":
                audio_data = data.get("data")
                audio_format = data.get("format", "webm")
                is_final = bool(data.get("is_final", False))

                if audio_data is None:
                    logger.warning("audio_chunk missing 'data'.")
                    continue

                await session.process_audio_chunk(audio_data, audio_format, is_final)

            elif msg_type == "control":
                command = data.get("command")
                params = data.get("params", {}) or {}

                if not command:
                    logger.warning("control message missing 'command'.")
                    continue

                await session.handle_control(command, params)

            elif msg_type == "start":
                # If client sends start again, ignore (session already established)
                logger.info("Received duplicate start message; ignoring.")
                continue

            else:
                logger.warning(f"Unknown message type: {msg_type}")

        elif msg.type == WSMsgType.ERROR:
            logger.error(f"WebSocket error: {ws.exception()}")
            break

        elif msg.type in (WSMsgType.CLOSE, WSMsgType.CLOSED):
            logger.info("Client closed connection")
            break


async def handle_outgoing_messages(ws: web.WebSocketResponse, session: RealtimeVoiceSession) -> None:
    """
    Stream outgoing messages from the voice session to the client.

    session.get_output_messages() should yield dict messages that are JSON serialisable.
    """
    async for message in session.get_output_messages():
        if ws.closed:
            break
        await ws.send_json(message)


def setup_voice_websocket_routes(app: web.Application) -> None:
    """Register WebSocket routes."""
    app.router.add_get("/voice-stream", voice_stream_handler)
    logger.info("Voice WebSocket routes configured")

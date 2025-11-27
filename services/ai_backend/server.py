#!/usr/bin/env python
"""
Amanda AI Backend - gRPC Server

Production gRPC server that integrates with the Flask backend.
Uses the three-agent therapeutic system with session management.

Note: The simple echo version has been saved as server_simple.py
"""
import grpc
from concurrent import futures
import time
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from descriptors import ChatMessage, ChatChunk
from src.config import config
from src.providers import ProviderFactory
from src.orchestrator import TherapeuticCoordinator
from src.session import SessionManager
from src.monitoring.chat_transcript import ChatTranscriptWriter


class AIServicer:
    """
    AI Service implementation using the three-agent therapeutic system.

    Integrates TherapeuticCoordinator (Amanda, Supervisor, Risk Assessor)
    with session management and conversation memory.
    """

    def __init__(self):
        """Initialize the AI servicer with configured provider and session manager."""
        try:
            # Create provider from configuration
            self.provider = ProviderFactory.create_from_config(config)

            # Create session manager for conversation memory
            self.session_manager = SessionManager(provider=self.provider)

            # Store active conversations (user_id -> coordinator instance)
            self.coordinators = {}

            print(f"✓ AI Servicer initialized with {config.llm_provider}/{config.llm_model}")
            print("✓ Three-agent therapeutic system ready (Amanda, Supervisor, Risk Assessor)")
            print("✓ Session management enabled")
            print("✓ Real-time chat transcripts enabled (logs stored in monitoring_logs/)")

        except Exception as e:
            print(f"❌ Failed to initialize AI Servicer: {e}")
            raise

    def _get_or_create_coordinator(self, user_id: str, chat_id: str, user_email: str = None) -> TherapeuticCoordinator:
        """
        Get or create a therapeutic coordinator for a specific user chat.

        Each chat gets its own coordinator instance and transcript.

        Args:
            user_id: User identifier
            chat_id: Chat identifier
            user_email: User's email address (for transcript storage)

        Returns:
            TherapeuticCoordinator instance for the chat
        """
        # Use combination of user_id and chat_id as key
        coordinator_key = f"{user_id}_{chat_id}"

        if coordinator_key not in self.coordinators:
            # Use email if provided, otherwise fallback to user_id
            email = user_email or f"user_{user_id}"

            # Create real-time transcript writer for this specific chat
            transcript = ChatTranscriptWriter(
                user_email=email,
                chat_id=chat_id,
                chat_title=f"Chat {chat_id}"
            )

            print(f"Created transcript: {transcript.get_transcript_path()}")

            self.coordinators[coordinator_key] = TherapeuticCoordinator(
                provider=self.provider,
                session_manager=self.session_manager,
                user_id=user_id,
                transcript=transcript
            )

        return self.coordinators[coordinator_key]

    def StreamChat(self, request, context):
        """
        Handle streaming chat requests from the backend.

        Uses the three-agent therapeutic system with risk detection,
        assessment protocols, and session management.

        Args:
            request: ChatMessage with user_id, chat_id, and message
            context: gRPC context

        Yields:
            ChatChunk: Streaming response chunks
        """
        try:
            user_id = request.user_id
            chat_id = request.chat_id
            user_message = request.message

            # TODO: Get user email from database
            # For now, we'll use user_id
            user_email = f"user_{user_id}@amanda.local"

            # Get coordinator for this specific chat
            coordinator = self._get_or_create_coordinator(user_id, chat_id, user_email)

            # Stream response from coordinator (handles mode switching internally)
            for chunk_text in coordinator.process_message(user_message):
                chunk = ChatChunk(text=chunk_text, done=False)
                yield chunk

            # Send final chunk with done=True
            final_chunk = ChatChunk(text="", done=True)
            yield final_chunk

        except Exception as e:
            # Log error and send error message
            print(f"❌ Error in StreamChat: {e}")
            import traceback
            traceback.print_exc()

            # Send error message to client
            error_chunk = ChatChunk(
                text=f"I apologize, but I encountered an error: {str(e)}",
                done=False
            )
            yield error_chunk

            final_chunk = ChatChunk(text="", done=True)
            yield final_chunk


def serve(port=None):
    """
    Start the gRPC server.

    Args:
        port: Port number to listen on (default: from config)
    """
    if port is None:
        port = config.server_port

    max_workers = config.server_max_workers

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=max_workers))

    # Register the service
    try:
        servicer = AIServicer()
    except Exception as e:
        print(f"\n❌ Failed to initialize AI service: {e}")
        print("\nPlease check your config.yaml and ensure:")
        print("  1. API key is set for the configured provider")
        print("  2. Required packages are installed (pip install -r requirements.txt)")
        print("  3. Provider name is valid (openai, anthropic, or google)")
        sys.exit(1)

    # Create a generic RPC handler using the proper API
    generic_handler = grpc.method_handlers_generic_handler(
        'amanda.ai.AIService',
        {
            'StreamChat': grpc.unary_stream_rpc_method_handler(
                servicer.StreamChat,
                request_deserializer=ChatMessage.FromString,
                response_serializer=ChatChunk.SerializeToString,
            )
        }
    )

    # Add the handler to the server
    server.add_generic_rpc_handlers((generic_handler,))

    # Start the server
    server.add_insecure_port(f'[::]:{port}')
    server.start()

    print("=" * 60)
    print("Amanda AI Backend Server")
    print("=" * 60)
    print(f"Provider: {config.llm_provider}")
    print(f"Model: {config.llm_model}")
    print(f"Port: {port}")
    print(f"Max Workers: {max_workers}")
    print("=" * 60)
    print("Server is running...")
    print("Press Ctrl+C to stop")
    print("=" * 60)

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        server.stop(0)


if __name__ == '__main__':
    try:
        serve()
    except Exception as e:
        print(f"\n❌ Server failed to start: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

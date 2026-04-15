#!/usr/bin/env python
"""
Amanda AI Backend - gRPC Server

Production gRPC server that integrates with the Flask backend.
Uses the three-agent therapeutic system with session management.

This version adds support for:
- externalized project prompts
- session-specific prompting
- user-specific prompt assignment (MVP)
"""

import grpc
from concurrent import futures
import sys
from pathlib import Path
import inspect

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from descriptors import ChatMessage, ChatChunk
from src.config import config
from src.providers import ProviderFactory
from src.orchestrator import TherapeuticCoordinator
from src.session import SessionManager
from src.monitoring.chat_transcript import ChatTranscriptWriter
from src.prompting.project_prompt_resolver import ProjectPromptResolver


class AIServicer:
    """
    AI Service implementation using the three-agent therapeutic system.

    Integrates TherapeuticCoordinator (Amanda, Supervisor, Risk Assessor)
    with session management and optional project/session-specific prompting.
    """

    # MVP test mapping until the backend passes real user email into ai_backend.
    # Adjust this to match your own local test account user_id if needed.
    TEST_EMAIL_BY_USER_ID = {
        "1": "hasen6422@gmail.com",
    }

    def __init__(self):
        """Initialize the AI servicer with configured provider and session manager."""
        try:
            self.provider = ProviderFactory.create_from_config(config)
            self.session_manager = SessionManager(provider=self.provider)

            # Store active conversations (user_id + chat_id -> coordinator instance)
            self.coordinators = {}

            # Prompt resolver for project-specific/session-specific Amanda variants
            self.prompt_resolver = ProjectPromptResolver()

            print(f"✓ AI Servicer initialized with {config.llm_provider}/{config.llm_model}")
            print("✓ Three-agent therapeutic system ready (Amanda, Supervisor, Risk Assessor)")
            print("✓ Session management enabled")
            print("✓ Real-time chat transcripts enabled (logs stored in monitoring_logs/)")
            print("✓ Project/session-specific prompting enabled")

        except Exception as e:
            print(f"❌ Failed to initialize AI Servicer: {e}")
            raise

    def _resolve_user_email(self, user_id: str) -> str:
        """
        Resolve the effective user email.

        Current MVP:
        - Use explicit test mapping if available
        - Otherwise fall back to synthetic local email

        Later improvement:
        - backend should pass real user email through gRPC
        """
        return self.TEST_EMAIL_BY_USER_ID.get(str(user_id), f"user_{user_id}@amanda.local")

    def _build_project_context(self, user_email: str):
        """
        Resolve project/session-specific prompt context for this user.
        Returns None for users with no special assignment.
        """
        try:
            resolved = self.prompt_resolver.resolve_for_user(user_email)
            if not resolved:
                return None

            print(
                f"✓ Project prompt resolved for {user_email}: "
                f"{resolved['project_key']} / session {resolved['session_number']} "
                f"({resolved['session_title']})"
            )

            return {
                "project_key": resolved["project_key"],
                "session_number": resolved["session_number"],
                "session_title": resolved["session_title"],
                "project_prompt": resolved["combined_prompt"],
            }
        except Exception as e:
            print(f"⚠ Failed to resolve project prompt for {user_email}: {e}")
            return None

    def _get_or_create_coordinator(
        self,
        user_id: str,
        chat_id: str,
        user_email: str = None,
    ) -> TherapeuticCoordinator:
        """
        Get or create a therapeutic coordinator for a specific user chat.

        Each chat gets its own coordinator instance and transcript.
        """
        coordinator_key = f"{user_id}_{chat_id}"

        if coordinator_key not in self.coordinators:
            email = user_email or f"user_{user_id}@amanda.local"

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

    def _stream_from_coordinator(self, coordinator, user_message: str, context_dict=None):
        """
        Call coordinator.process_message() safely whether or not it supports context=...
        """
        try:
            sig = inspect.signature(coordinator.process_message)
            if "context" in sig.parameters:
                return coordinator.process_message(user_message, context=context_dict)
            return coordinator.process_message(user_message)
        except Exception:
            # Fallback if signature inspection fails for any reason
            return coordinator.process_message(user_message)

    def StreamChat(self, request, context):
        """
        Handle streaming chat requests from the backend.

        Uses the three-agent therapeutic system with risk detection,
        assessment protocols, session management, and optional project/session prompts.
        """
        try:
            user_id = request.user_id
            chat_id = request.chat_id
            user_message = request.message
            first_name = request.first_name or None

            # Resolve effective user identity (MVP)
            user_email = self._resolve_user_email(user_id)

            # Get coordinator for this specific chat
            coordinator = self._get_or_create_coordinator(user_id, chat_id, user_email)

            # Build optional project/session prompt context
            project_context = self._build_project_context(user_email) or {}

            # Pass user's first name so Amanda can address them by name
            if first_name:
                project_context["user_first_name"] = first_name

            # Stream response from coordinator
            for chunk_text in self._stream_from_coordinator(
                coordinator=coordinator,
                user_message=user_message,
                context_dict=project_context,
            ):
                yield ChatChunk(text=chunk_text, done=False)

            yield ChatChunk(text="", done=True)

        except Exception as e:
            print(f"❌ Error in StreamChat: {e}")
            import traceback
            traceback.print_exc()

            yield ChatChunk(
                text=f"I apologize, but I encountered an error: {str(e)}",
                done=False
            )
            yield ChatChunk(text="", done=True)


def serve(port=None):
    """
    Start the gRPC server.
    """
    if port is None:
        port = config.server_port

    max_workers = config.server_max_workers
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=max_workers))

    try:
        servicer = AIServicer()
    except Exception as e:
        print(f"\n❌ Failed to initialize AI service: {e}")
        print("\nPlease check your config.yaml and ensure:")
        print("  1. API key is set for the configured provider")
        print("  2. Required packages are installed (pip install -r requirements.txt)")
        print("  3. Provider name is valid and supported")
        sys.exit(1)

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

    server.add_generic_rpc_handlers((generic_handler,))
    server.add_insecure_port(f'0.0.0.0:{port}')
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
#!/usr/bin/env python
"""
Amanda AI Backend - CLI Testing Interface

Use this script to test the AI backend without running the gRPC server.
Provides an interactive chat interface for testing agents and LLM providers.
"""
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.config import config
from src.providers import ProviderFactory
from src.orchestrator import TherapeuticCoordinator
from src.session import SessionManager
from src.prompts import PromptManager


def print_header():
    """Print a nice header for the CLI."""
    print("=" * 60)
    print("Amanda AI Backend - CLI Testing Interface")
    print("=" * 60)
    print(f"Provider: {config.llm_provider}")
    print(f"Model: {config.llm_model}")
    print(f"Temperature: {config.llm_temperature}")
    print("=" * 60)
    print()


def chat_loop(coordinator: TherapeuticCoordinator):
    """
    Run an interactive chat loop with the three-agent system.

    Args:
        coordinator: TherapeuticCoordinator instance
    """
    print(coordinator.amanda.get_greeting())
    print()
    print("Type 'quit', 'exit', or 'bye' to end the conversation.")
    print("Type 'clear' to start a new session.")
    print("Type 'history' to see conversation history.")
    print("Type 'status' to see current system status.")
    print("-" * 60)
    print()

    while True:
        try:
            # Check if session is still active
            if not coordinator.session_active:
                print("\n[Session ended due to safety concerns]")
                print("Type 'clear' to start a new session, or 'quit' to exit.")
                user_input = input("You: ").strip()

                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print("\nGoodbye! Take care.")
                    break
                elif user_input.lower() == 'clear':
                    coordinator.reset_session()
                    print("\n✓ New session started.\n")
                    print(coordinator.amanda.get_greeting())
                    print()
                continue

            # Get user input
            user_input = input("You: ").strip()

            if not user_input:
                continue

            # Handle commands
            if user_input.lower() in ['quit', 'exit', 'bye']:
                # Save session before exiting
                if coordinator.session_manager and coordinator.user_id:
                    print("\nSaving session...")
                    coordinator.save_session()
                    print("✓ Session saved")
                print("\nGoodbye! Take care.")
                break

            if user_input.lower() == 'clear':
                # Save current session before resetting
                if coordinator.session_manager and coordinator.user_id:
                    print("\nSaving current session...")
                    coordinator.save_session()
                    print("✓ Session saved")

                coordinator.reset_session()
                print("\n✓ Session cleared. Starting fresh.\n")
                print(coordinator.amanda.get_greeting())
                print()
                continue

            if user_input.lower() == 'history':
                history = coordinator.amanda.get_conversation_history()
                print("\n--- Conversation History ---")
                for i, msg in enumerate(history, 1):
                    role = msg['role'].capitalize()
                    content = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
                    print(f"{i}. {role}: {content}")
                print("--- End of History ---\n")
                continue

            if user_input.lower() == 'status':
                state = coordinator.get_state()
                print("\n--- System Status ---")
                print(f"Mode: {state['mode']}")
                print(f"Session Active: {state['session_active']}")
                print(f"Interaction Count: {state['interaction_count']}")
                print(f"Risk Queue: {state['risk_queue']}")
                if state['assessment_progress']:
                    progress = state['assessment_progress']
                    print(f"Assessment Progress: {progress['current_question']}/{progress['total_questions']} ({progress['progress_percent']}%)")
                print("--- End of Status ---\n")
                continue

            # Process user input through the coordinator
            print("\nAmanda: ", end="", flush=True)

            # Stream the response
            for chunk in coordinator.process_message(user_input):
                print(chunk, end="", flush=True)
            print("\n")

        except KeyboardInterrupt:
            print("\n\nInterrupted. Type 'quit' to exit properly.")
            continue
        except Exception as e:
            print(f"\n❌ Error: {e}\n")
            import traceback
            traceback.print_exc()
            continue


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Amanda AI Backend CLI Testing Interface"
    )
    parser.add_argument(
        '--no-stream',
        action='store_true',
        help="Disable streaming responses"
    )
    parser.add_argument(
        '--provider',
        type=str,
        help="Override LLM provider (openai, anthropic, google)"
    )
    parser.add_argument(
        '--model',
        type=str,
        help="Override model name"
    )
    parser.add_argument(
        '--temperature',
        type=float,
        help="Override temperature (0.0-1.0)"
    )
    parser.add_argument(
        '--config',
        type=str,
        help="Path to config file (default: config.yaml)"
    )
    parser.add_argument(
        '--user-id',
        type=str,
        default='test_user',
        help="User ID for session management (default: test_user)"
    )
    parser.add_argument(
        '--no-memory',
        action='store_true',
        help="Disable session memory and summarization"
    )

    args = parser.parse_args()

    try:
        # Load configuration
        if args.config:
            config.load(args.config)

        # Print header
        print_header()

        # Create provider
        provider_name = args.provider or config.llm_provider
        model = args.model or config.llm_model

        print(f"Initializing {provider_name} provider with model {model}...")

        provider = ProviderFactory.create(
            provider_name=provider_name,
            api_key=config.llm_api_key,
            model=model
        )

        print("✓ Provider initialized\n")

        # Create session manager (unless disabled)
        session_manager = None
        user_id = args.user_id
        if not args.no_memory:
            print("Initializing session manager...")
            session_manager = SessionManager(provider=provider)

            # Check for previous sessions
            session_count = session_manager.get_session_count(user_id)
            if session_count > 0:
                print(f"✓ Found {session_count} previous session(s) for user '{user_id}'")
                print("✓ Previous session summary will be loaded for continuity")
            else:
                print(f"✓ Starting first session for user '{user_id}'")
            print()

        # Note: Monitoring/transcripts are handled by ChatTranscriptWriter in server.py
        # The CLI testing interface (main.py) runs without transcripts for simplicity
        # For production web sessions, server.py creates ChatTranscriptWriter instances

        # Create therapeutic coordinator (three-agent system)
        print("Initializing three-agent therapeutic system...")

        # For CLI, we use transcript=None since the monitoring system
        # was changed to use ChatTranscriptWriter for real-time logging
        # The CLI doesn't need this (server.py uses ChatTranscriptWriter for web sessions)
        coordinator = TherapeuticCoordinator(
            provider=provider,
            session_manager=session_manager,
            user_id=user_id,
            transcript=None
        )
        print("✓ Coordinator initialized (Amanda, Supervisor, Risk Assessor)\n")

        # Run chat loop
        chat_loop(coordinator)

    except FileNotFoundError as e:
        print(f"\n❌ Configuration Error: {e}")
        print("\nPlease create config.yaml from config.example.yaml and set your API keys.")
        sys.exit(1)
    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
        sys.exit(1)
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("\nMake sure you have installed the required packages:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
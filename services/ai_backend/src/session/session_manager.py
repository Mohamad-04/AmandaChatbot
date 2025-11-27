"""
Session Manager - Conversation Memory & Summarization

Handles session lifecycle, summarization, and context loading.
"""
import json
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
from ..providers.base import BaseLLMProvider
from ..prompts import PromptManager


class SessionManager:
    """
    Manages session state, summarization, and conversation memory.

    Responsibilities:
    - Generate session summaries at end of conversation
    - Store summaries (file-based storage)
    - Load previous session summaries for context
    - Track session metadata (start time, interaction count, etc.)
    """

    def __init__(
        self,
        provider: BaseLLMProvider,
        storage_path: Optional[Path] = None
    ):
        """
        Initialize Session Manager.

        Args:
            provider: LLM provider for generating summaries
            storage_path: Directory for storing session data (default: ./session_data)
        """
        self.provider = provider

        # Default storage path
        if storage_path is None:
            storage_path = Path(__file__).parent.parent.parent / "session_data"

        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def generate_summary(
        self,
        conversation_history: List[Dict[str, str]],
        session_metadata: Optional[Dict] = None
    ) -> str:
        """
        Generate a session summary from conversation history.

        Uses GPT-4o to create a 2-3 paragraph summary including:
        - Main topics discussed
        - Relationship challenges mentioned
        - User's emotional state
        - Progress made during session

        Args:
            conversation_history: Full conversation history
            session_metadata: Optional metadata about the session

        Returns:
            Summary text (2-3 paragraphs)
        """
        # Build conversation text
        conversation_text = self._format_conversation_for_summary(conversation_history)

        # Create summary prompt
        summary_prompt = f"""You are a clinical psychologist reviewing a therapy session transcript.

Generate a professional session summary (2-3 paragraphs) that includes:

1. **Main Topics**: What relationship issues were discussed?
2. **Emotional State**: How was the client feeling? (anxious, sad, angry, hopeful, etc.)
3. **Key Challenges**: What specific difficulties did they share?
4. **Progress/Insights**: Any realizations, progress, or therapeutic movement?

The summary will be used to provide continuity in future sessions.

SESSION TRANSCRIPT:
{conversation_text}

Write a concise, professional summary (2-3 paragraphs):"""

        messages = [
            PromptManager.create_system_message(
                "You are an expert clinical psychologist creating session summaries."
            ),
            PromptManager.create_user_message(summary_prompt)
        ]

        # Generate summary with temperature 0.3 for consistency
        summary = self.provider.generate(
            messages=messages,
            temperature=0.3,
            max_tokens=500
        )

        return summary.strip()

    def _format_conversation_for_summary(
        self,
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """
        Format conversation history into readable text for summarization.

        Args:
            conversation_history: List of message dicts

        Returns:
            Formatted conversation text
        """
        formatted = []

        for msg in conversation_history:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')

            if role == 'user':
                formatted.append(f"Client: {content}")
            elif role == 'assistant':
                formatted.append(f"Therapist: {content}")
            # Skip system messages

        return "\n".join(formatted)

    def save_session(
        self,
        user_id: str,
        conversation_history: List[Dict[str, str]],
        session_metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Save session with summary.

        Args:
            user_id: Unique user identifier
            conversation_history: Full conversation history
            session_metadata: Optional session metadata

        Returns:
            Session data dict with summary
        """
        # Generate summary
        summary = self.generate_summary(conversation_history, session_metadata)

        # Create session data
        session_data = {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'summary': summary,
            'interaction_count': len([m for m in conversation_history if m['role'] == 'user']),
            'metadata': session_metadata or {}
        }

        # Save to file
        session_file = self._get_user_session_file(user_id)

        # Load existing sessions or create new list
        if session_file.exists():
            with open(session_file, 'r') as f:
                sessions = json.load(f)
        else:
            sessions = []

        # Append new session
        sessions.append(session_data)

        # Save
        with open(session_file, 'w') as f:
            json.dump(sessions, f, indent=2)

        return session_data

    def load_recent_summary(self, user_id: str, count: int = 1) -> Optional[str]:
        """
        Load the most recent session summary for a user.

        Args:
            user_id: Unique user identifier
            count: Number of recent sessions to include (default: 1)

        Returns:
            Combined summary text or None if no previous sessions
        """
        session_file = self._get_user_session_file(user_id)

        if not session_file.exists():
            return None

        with open(session_file, 'r') as f:
            sessions = json.load(f)

        if not sessions:
            return None

        # Get most recent session(s)
        recent_sessions = sessions[-count:]

        if count == 1:
            return recent_sessions[0]['summary']
        else:
            # Combine multiple summaries
            summaries = []
            for i, session in enumerate(recent_sessions, 1):
                timestamp = session.get('timestamp', 'Unknown')
                summary = session.get('summary', '')
                summaries.append(f"Session {i} ({timestamp}):\n{summary}")

            return "\n\n".join(summaries)

    def get_session_count(self, user_id: str) -> int:
        """
        Get the total number of sessions for a user.

        Args:
            user_id: Unique user identifier

        Returns:
            Number of sessions
        """
        session_file = self._get_user_session_file(user_id)

        if not session_file.exists():
            return 0

        with open(session_file, 'r') as f:
            sessions = json.load(f)

        return len(sessions)

    def get_all_sessions(self, user_id: str) -> List[Dict]:
        """
        Get all session data for a user.

        Args:
            user_id: Unique user identifier

        Returns:
            List of session data dicts
        """
        session_file = self._get_user_session_file(user_id)

        if not session_file.exists():
            return []

        with open(session_file, 'r') as f:
            sessions = json.load(f)

        return sessions

    def _get_user_session_file(self, user_id: str) -> Path:
        """
        Get the path to a user's session file.

        Args:
            user_id: Unique user identifier

        Returns:
            Path to session JSON file
        """
        # Sanitize user_id for filename
        safe_user_id = "".join(c for c in user_id if c.isalnum() or c in "._-")
        return self.storage_path / f"{safe_user_id}_sessions.json"

    def create_context_from_summary(self, user_id: str) -> Optional[Dict]:
        """
        Create context dict from previous session summary.

        This is passed to Amanda to provide continuity.

        Args:
            user_id: Unique user identifier

        Returns:
            Context dict with session_summary, or None
        """
        summary = self.load_recent_summary(user_id)

        if not summary:
            return None

        session_count = self.get_session_count(user_id)

        return {
            'session_summary': summary,
            'previous_sessions': session_count,
            'returning_user': True
        }

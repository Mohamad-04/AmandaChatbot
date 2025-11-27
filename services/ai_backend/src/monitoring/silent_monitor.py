"""
Silent monitoring system with persistent storage.

Stores all events to files for admin review without cluttering user conversation.
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
from enum import Enum
from .transcript_writer import TranscriptWriter


class EventType(Enum):
    """Types of monitorable events."""
    COORDINATOR_START = "coordinator_start"
    AGENT_START = "agent_start"
    AGENT_END = "agent_end"
    SUPERVISOR_ANALYSIS = "supervisor_analysis"
    RISK_DETECTED = "risk_detected"
    MODE_SWITCH = "mode_switch"
    ASSESSMENT_START = "assessment_start"
    ASSESSMENT_QUESTION = "assessment_question"
    ASSESSMENT_COMPLETE = "assessment_complete"
    SEVERITY_ANALYSIS = "severity_analysis"
    CRISIS_INTERVENTION = "crisis_intervention"
    SESSION_SAVE = "session_save"
    ERROR = "error"


class SilentMonitor:
    """
    Silent monitoring system for production use.

    Logs all events to files without console output.
    Admins can review logs via dashboard or file access.
    """

    def __init__(
        self,
        user_id: str,
        storage_path: Optional[Path] = None,
        enable_console: bool = False  # Disabled by default for production
    ):
        """
        Initialize silent monitor.

        Args:
            user_id: User identifier for log organization
            storage_path: Directory for storing logs (default: ./monitoring_logs)
            enable_console: Enable console output (only for debugging)
        """
        self.user_id = user_id
        self.enable_console = enable_console
        self.events: List[Dict] = []

        # Setup storage
        if storage_path is None:
            storage_path = Path(__file__).parent.parent.parent / "monitoring_logs"

        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Create user-specific log directory
        self.user_log_dir = self.storage_path / self._sanitize_user_id(user_id)
        self.user_log_dir.mkdir(parents=True, exist_ok=True)

        # Session log file (current session)
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_log_file = self.user_log_dir / f"session_{self.session_id}.jsonl"

        # Transcript writer for human-readable logs
        self.transcript = TranscriptWriter(user_id, self.session_id, storage_path)

        # Initialize session log
        self._write_session_start()

    def _sanitize_user_id(self, user_id: str) -> str:
        """Sanitize user ID for use in filenames."""
        return "".join(c for c in user_id if c.isalnum() or c in "._-")

    def _write_session_start(self):
        """Write session start marker."""
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': 'session_start',
            'data': {
                'user_id': self.user_id,
                'session_id': self.session_id
            },
            'message': 'Session started'
        }
        self._append_to_log(event)

    def log_event(
        self,
        event_type: EventType,
        data: Optional[Dict] = None,
        message: Optional[str] = None
    ):
        """
        Log an event silently to file.

        Args:
            event_type: Type of event
            data: Event data
            message: Human-readable message
        """
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type.value,
            'data': data or {},
            'message': message or ''
        }

        # Store in memory
        self.events.append(event)

        # Write to log file
        self._append_to_log(event)

        # Write to transcript
        self.transcript.write_event(event_type.value, data or {})

        # Optional console output (only if enabled)
        if self.enable_console:
            self._print_event_simple(event)

    def _append_to_log(self, event: Dict):
        """Append event to JSONL log file."""
        with open(self.session_log_file, 'a') as f:
            f.write(json.dumps(event) + '\n')

    def _print_event_simple(self, event: Dict):
        """Simple console output for debugging (not for production)."""
        timestamp = event['timestamp'].split('T')[1].split('.')[0]
        event_type = event['type']
        print(f"[{timestamp}] {event_type}", flush=True)

    def get_summary(self) -> Dict:
        """
        Get summary of all events.

        Returns:
            Summary statistics
        """
        event_counts = {}
        for event in self.events:
            event_type = event['type']
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'total_events': len(self.events),
            'event_counts': event_counts,
            'first_event': self.events[0]['timestamp'] if self.events else None,
            'last_event': self.events[-1]['timestamp'] if self.events else None,
            'log_file': str(self.session_log_file)
        }

    def get_events(self, event_type: Optional[EventType] = None) -> List[Dict]:
        """
        Get events, optionally filtered by type.

        Args:
            event_type: Filter by this event type (optional)

        Returns:
            List of events
        """
        if event_type:
            return [e for e in self.events if e['type'] == event_type.value]
        return self.events.copy()

    def log_user_message(self, message: str):
        """
        Log user message to transcript.

        Args:
            message: User's message
        """
        self.transcript.write_user_message(message)

    def log_amanda_response(self, response: str):
        """
        Log Amanda's response to transcript.

        Args:
            response: Amanda's complete response
        """
        self.transcript.write_amanda_response(response)

    def finalize_session(self, interaction_count: int = 0):
        """
        Write session end marker and create summary.

        Args:
            interaction_count: Number of user interactions
        """
        # Session end event
        end_event = {
            'timestamp': datetime.now().isoformat(),
            'type': 'session_end',
            'data': {
                'user_id': self.user_id,
                'session_id': self.session_id,
                'total_events': len(self.events)
            },
            'message': 'Session ended'
        }
        self._append_to_log(end_event)

        # Write to transcript
        self.transcript.write_session_end(interaction_count)

        # Write summary file
        summary = self.get_summary()
        summary_file = self.user_log_dir / f"session_{self.session_id}_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)

    @staticmethod
    def load_session_log(log_file: Path) -> List[Dict]:
        """
        Load events from a session log file.

        Args:
            log_file: Path to JSONL log file

        Returns:
            List of events
        """
        events = []
        with open(log_file, 'r') as f:
            for line in f:
                if line.strip():
                    events.append(json.loads(line))
        return events

    @staticmethod
    def get_user_sessions(user_id: str, storage_path: Optional[Path] = None) -> List[Dict]:
        """
        Get all sessions for a user.

        Args:
            user_id: User identifier
            storage_path: Monitoring logs directory

        Returns:
            List of session summaries
        """
        if storage_path is None:
            storage_path = Path(__file__).parent.parent.parent / "monitoring_logs"

        safe_user_id = "".join(c for c in user_id if c.isalnum() or c in "._-")
        user_log_dir = Path(storage_path) / safe_user_id

        if not user_log_dir.exists():
            return []

        sessions = []
        for summary_file in sorted(user_log_dir.glob("*_summary.json")):
            with open(summary_file, 'r') as f:
                sessions.append(json.load(f))

        return sessions

    @staticmethod
    def get_all_users(storage_path: Optional[Path] = None) -> List[str]:
        """
        Get list of all monitored users.

        Args:
            storage_path: Monitoring logs directory

        Returns:
            List of user IDs
        """
        if storage_path is None:
            storage_path = Path(__file__).parent.parent.parent / "monitoring_logs"

        storage_path = Path(storage_path)
        if not storage_path.exists():
            return []

        return [d.name for d in storage_path.iterdir() if d.is_dir()]

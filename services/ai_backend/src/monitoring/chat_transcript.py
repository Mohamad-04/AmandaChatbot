"""
Real-time chat transcript writer - writes immediately as events happen.

Each user (by email) has their own folder.
Each chat has its own subfolder with transcript.
Everything is written in real-time, not at session end.
"""
from datetime import datetime
from pathlib import Path
from typing import Optional


class ChatTranscriptWriter:
    """
    Real-time transcript writer for individual chats.

    Writes everything as it happens:
    - User messages (immediately)
    - Agent thinking/reasoning (immediately)
    - AI responses (immediately)
    - All monitoring events (immediately)
    """

    def __init__(
        self,
        user_email: str,
        chat_id: str,
        chat_title: str = "Untitled Chat",
        storage_path: Optional[Path] = None
    ):
        """
        Initialize chat transcript writer.

        Args:
            user_email: User's email address
            chat_id: Unique chat identifier
            chat_title: Title/name of the chat
            storage_path: Base directory for transcripts
        """
        self.user_email = user_email
        self.chat_id = str(chat_id)
        self.chat_title = chat_title

        # Setup storage
        if storage_path is None:
            storage_path = Path(__file__).parent.parent.parent / "monitoring_logs"

        self.storage_path = Path(storage_path)

        # Create user folder (by email)
        safe_email = self._sanitize_filename(user_email)
        self.user_dir = self.storage_path / safe_email
        self.user_dir.mkdir(parents=True, exist_ok=True)

        # Create chat folder (chat_id + date)
        chat_date = datetime.now().strftime("%Y%m%d")
        safe_title = self._sanitize_filename(chat_title[:30])  # Limit title length
        chat_folder_name = f"chat_{chat_id}_{safe_title}_{chat_date}"
        self.chat_dir = self.user_dir / chat_folder_name
        self.chat_dir.mkdir(parents=True, exist_ok=True)

        # Transcript file
        self.transcript_file = self.chat_dir / "transcript.txt"

        # Initialize if new
        if not self.transcript_file.exists():
            self._initialize_transcript()

    def _sanitize_filename(self, name: str) -> str:
        """Sanitize string for use in filenames."""
        # Replace @ and . in email with underscores
        name = name.replace('@', '_at_').replace('.', '_')
        # Keep only alphanumeric and basic punctuation
        return "".join(c for c in name if c.isalnum() or c in "._-")

    def _initialize_transcript(self):
        """Initialize transcript file with header."""
        with open(self.transcript_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("AMANDA CHAT TRANSCRIPT\n")
            f.write("=" * 80 + "\n")
            f.write(f"User: {self.user_email}\n")
            f.write(f"Chat ID: {self.chat_id}\n")
            f.write(f"Chat Title: {self.chat_title}\n")
            f.write(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 80 + "\n\n")

    def _append(self, text: str):
        """Append text to transcript immediately."""
        with open(self.transcript_file, 'a', encoding='utf-8') as f:
            f.write(text)
            f.flush()  # Force write to disk immediately

    def _timestamp(self) -> str:
        """Get current timestamp."""
        return datetime.now().strftime("%H:%M:%S")

    def write_user_message(self, message: str):
        """Write user message immediately."""
        self._append(f"[{self._timestamp()}] USER: {message}\n\n")

    def write_amanda_response_start(self):
        """Write Amanda response header."""
        self._append(f"[{self._timestamp()}] AMANDA: ")

    def write_amanda_chunk(self, chunk: str):
        """Write Amanda response chunk as it streams."""
        self._append(chunk)

    def write_amanda_response_end(self):
        """End Amanda response."""
        self._append("\n\n")

    def write_agent_activation(self, agent: str, temperature: float, role: str):
        """Write agent activation."""
        self._append(f"\n{'─' * 80}\n")
        self._append(f"[{self._timestamp()}] 🤖 AGENT: {agent.upper()}\n")
        self._append(f"    Role: {role}\n")
        self._append(f"    Temperature: {temperature}\n")
        self._append(f"{'─' * 80}\n\n")

    def write_supervisor_check(self):
        """Write supervisor analysis start."""
        self._append(f"\n{'─' * 80}\n")
        self._append(f"[{self._timestamp()}] 👁  SUPERVISOR ANALYZING...\n")
        self._append(f"    Checking last 5 messages for safety risks\n")

    def write_supervisor_result(self, risk_detected: bool, risk_types: list = None, confidence: str = "none"):
        """Write supervisor result."""
        if risk_detected:
            self._append(f"    ⚠️  RISK DETECTED: {', '.join(risk_types or [])}\n")
            self._append(f"    Confidence: {confidence}\n")
        else:
            self._append(f"    ✓ No risks detected\n")
        self._append(f"{'─' * 80}\n\n")

    def write_risk_alert(self, risk_types: list, confidence: str):
        """Write risk detection alert."""
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 🚨 RISK ALERT\n")
        self._append(f"    Detected: {', '.join(risk_types)}\n")
        self._append(f"    Confidence: {confidence}\n")
        self._append(f"    Switching to assessment mode\n")
        self._append(f"{'=' * 80}\n\n")

    def write_mode_switch(self, old_mode: str, new_mode: str):
        """Write mode switch."""
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 🔄 MODE SWITCH\n")
        self._append(f"    {old_mode.upper()} → {new_mode.upper()}\n")
        self._append(f"{'=' * 80}\n\n")

    def write_assessment_start(self, risk_type: str, total_questions: int):
        """Write assessment start."""
        self._append(f"\n{'─' * 80}\n")
        self._append(f"[{self._timestamp()}] 📋 ASSESSMENT: {risk_type}\n")
        self._append(f"    Total Questions: {total_questions}\n")
        self._append(f"{'─' * 80}\n\n")

    def write_question(self, number: int, total: int):
        """Write question marker."""
        self._append(f"[{self._timestamp()}] 📝 Question {number}/{total}\n")

    def write_severity_analysis(self, risk_type: str, severity: str, analysis: str):
        """Write severity analysis."""
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 📊 SEVERITY ANALYSIS\n")
        self._append(f"    Risk: {risk_type}\n")
        self._append(f"    Severity: {severity.upper()}\n")
        self._append(f"    Analysis: {analysis}\n")
        self._append(f"{'=' * 80}\n\n")

    def write_crisis_intervention(self, risk_type: str):
        """Write crisis intervention."""
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 🆘 CRISIS INTERVENTION\n")
        self._append(f"    Risk: {risk_type}\n")
        self._append(f"    Displaying crisis resources to user\n")
        self._append(f"    Session ending for safety\n")
        self._append(f"{'=' * 80}\n\n")

    def write_separator(self):
        """Write a visual separator."""
        self._append(f"\n{'-' * 80}\n\n")

    def get_transcript_path(self) -> str:
        """Get the full path to the transcript file."""
        return str(self.transcript_file)

"""
Transcript Writer - Human-readable session transcripts

Creates and maintains readable text transcripts of sessions including
conversation and all monitoring events.
"""
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict


class TranscriptWriter:
    """
    Writes human-readable transcripts of sessions.

    Each session gets a transcript file that includes:
    - User messages
    - Amanda responses
    - Agent activations
    - Risk detections
    - Mode switches
    - Assessment questions and answers
    - Severity analysis
    - All monitoring events
    """

    def __init__(self, user_id: str, session_id: str, storage_path: Optional[Path] = None):
        """
        Initialize transcript writer.

        Args:
            user_id: User identifier
            session_id: Session identifier (timestamp format)
            storage_path: Base directory for transcripts
        """
        self.user_id = user_id
        self.session_id = session_id  # Store session_id as instance variable

        # Setup storage
        if storage_path is None:
            storage_path = Path(__file__).parent.parent.parent / "monitoring_logs"

        self.storage_path = Path(storage_path)
        self.user_dir = self.storage_path / self._sanitize_user_id(user_id)
        self.user_dir.mkdir(parents=True, exist_ok=True)

        # Transcript file
        self.transcript_file = self.user_dir / f"session_{session_id}_transcript.txt"

        # Initialize transcript
        self._initialize_transcript()

    def _sanitize_user_id(self, user_id: str) -> str:
        """Sanitize user ID for filesystem."""
        return "".join(c for c in user_id if c.isalnum() or c in "._-")

    def _initialize_transcript(self):
        """Initialize transcript file with header."""
        if not self.transcript_file.exists():
            with open(self.transcript_file, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("AMANDA SESSION TRANSCRIPT\n")
                f.write("=" * 80 + "\n")
                f.write(f"User ID: {self.user_id}\n")
                f.write(f"Session ID: {self.session_id}\n")  # Fixed: use self.session_id
                f.write(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")

    def _append(self, text: str):
        """Append text to transcript."""
        with open(self.transcript_file, 'a', encoding='utf-8') as f:
            f.write(text)

    def _timestamp(self) -> str:
        """Get current timestamp for entries."""
        return datetime.now().strftime("%H:%M:%S")

    def write_user_message(self, message: str):
        """
        Write user message to transcript.

        Args:
            message: User's message
        """
        self._append(f"[{self._timestamp()}] USER: {message}\n")

    def write_amanda_response(self, response: str):
        """
        Write Amanda's response to transcript.

        Args:
            response: Amanda's response
        """
        self._append(f"[{self._timestamp()}] AMANDA: {response}\n\n")

    def write_agent_start(self, agent: str, temperature: float, role: str):
        """
        Write agent activation to transcript.

        Args:
            agent: Agent name
            temperature: Agent temperature
            role: Agent role
        """
        self._append(f"\n{'─' * 80}\n")
        self._append(f"[{self._timestamp()}] 🤖 AGENT ACTIVATED: {agent.upper()}\n")
        self._append(f"    Role: {role}\n")
        self._append(f"    Temperature: {temperature}\n")
        self._append(f"{'─' * 80}\n\n")

    def write_supervisor_analysis(self, risk_detected: bool, risk_types: list = None, confidence: str = "none"):
        """
        Write supervisor analysis to transcript.

        Args:
            risk_detected: Whether risk was detected
            risk_types: List of detected risk types
            confidence: Confidence level
        """
        self._append(f"\n{'─' * 80}\n")
        self._append(f"[{self._timestamp()}] 👁  SUPERVISOR ANALYSIS\n")
        self._append(f"    Analyzing last 5 messages for safety risks...\n")

        if risk_detected:
            self._append(f"    ⚠️  RISK DETECTED!\n")
            self._append(f"    Types: {', '.join(risk_types or [])}\n")
            self._append(f"    Confidence: {confidence}\n")
        else:
            self._append(f"    ✓ No risks detected\n")

        self._append(f"{'─' * 80}\n\n")

    def write_risk_detected(self, risk_types: list, confidence: str):
        """
        Write risk detection alert to transcript.

        Args:
            risk_types: List of risk types
            confidence: Confidence level
        """
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 🚨 RISK ALERT\n")
        self._append(f"    Detected: {', '.join(risk_types)}\n")
        self._append(f"    Confidence: {confidence}\n")
        self._append(f"    Adding to risk queue for assessment\n")
        self._append(f"{'=' * 80}\n\n")

    def write_mode_switch(self, old_mode: str, new_mode: str, trigger: str = ""):
        """
        Write mode switch to transcript.

        Args:
            old_mode: Previous mode
            new_mode: New mode
            trigger: What triggered the switch
        """
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 🔄 MODE SWITCH\n")
        self._append(f"    {old_mode.upper()} → {new_mode.upper()}\n")
        if trigger:
            self._append(f"    Trigger: {trigger}\n")
        self._append(f"{'=' * 80}\n\n")

    def write_assessment_start(self, risk_type: str, total_questions: int):
        """
        Write assessment start to transcript.

        Args:
            risk_type: Type of risk being assessed
            total_questions: Total number of questions
        """
        self._append(f"\n{'─' * 80}\n")
        self._append(f"[{self._timestamp()}] 📋 ASSESSMENT STARTED\n")
        self._append(f"    Type: {risk_type}\n")
        self._append(f"    Total Questions: {total_questions}\n")
        self._append(f"{'─' * 80}\n\n")

    def write_assessment_question(self, question_number: int, total_questions: int, question: str):
        """
        Write assessment question to transcript.

        Args:
            question_number: Current question number
            total_questions: Total questions
            question: Question text
        """
        self._append(f"[{self._timestamp()}] 📝 Question {question_number}/{total_questions}\n")
        self._append(f"AMANDA: {question}\n")

    def write_assessment_answer(self, answer: str):
        """
        Write user's answer to assessment question.

        Args:
            answer: User's answer
        """
        self._append(f"USER: {answer}\n\n")

    def write_severity_analysis(self, risk_type: str, severity: str, analysis: str,
                                immediate_action: bool, actions: list = None):
        """
        Write severity analysis to transcript.

        Args:
            risk_type: Type of risk
            severity: Severity level
            analysis: Analysis text
            immediate_action: Whether immediate action required
            actions: Recommended actions
        """
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 📊 SEVERITY ANALYSIS\n")
        self._append(f"    Risk Type: {risk_type}\n")
        self._append(f"    Severity: {severity.upper()}\n")
        self._append(f"    Analysis: {analysis}\n")

        if immediate_action:
            self._append(f"    ⚠️  IMMEDIATE ACTION REQUIRED\n")
            if actions:
                self._append(f"    Recommended Actions:\n")
                for action in actions:
                    self._append(f"      • {action}\n")

        self._append(f"{'=' * 80}\n\n")

    def write_crisis_intervention(self, risk_type: str, severity: str):
        """
        Write crisis intervention to transcript.

        Args:
            risk_type: Type of risk
            severity: Severity level
        """
        self._append(f"\n{'=' * 80}\n")
        self._append(f"[{self._timestamp()}] 🆘 CRISIS INTERVENTION ACTIVATED\n")
        self._append(f"    Risk Type: {risk_type}\n")
        self._append(f"    Severity: {severity}\n")
        self._append(f"    Crisis resources displayed to user\n")
        self._append(f"    Session ending for user safety\n")
        self._append(f"{'=' * 80}\n\n")

    def write_session_end(self, interaction_count: int):
        """
        Write session end marker.

        Args:
            interaction_count: Number of interactions
        """
        self._append(f"\n{'=' * 80}\n")
        self._append(f"SESSION ENDED\n")
        self._append(f"Ended: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self._append(f"Total Interactions: {interaction_count}\n")
        self._append(f"{'=' * 80}\n")

    def write_event(self, event_type: str, data: Dict):
        """
        Generic event writer for any event type.

        Args:
            event_type: Type of event
            data: Event data
        """
        # Map event types to specific writers
        if event_type == "agent_start":
            self.write_agent_start(
                data.get('agent', 'Unknown'),
                data.get('temperature', 0),
                data.get('role', 'Unknown')
            )
        elif event_type == "supervisor_analysis":
            self.write_supervisor_analysis(
                data.get('risk_detected', False),
                data.get('risk_types', []),
                data.get('confidence', 'none')
            )
        elif event_type == "risk_detected":
            self.write_risk_detected(
                data.get('risk_types', []),
                data.get('confidence', 'unknown')
            )
        elif event_type == "mode_switch":
            self.write_mode_switch(
                data.get('old_mode', '?'),
                data.get('new_mode', '?'),
                data.get('trigger', '')
            )
        elif event_type == "assessment_start":
            self.write_assessment_start(
                data.get('risk_type', 'unknown'),
                data.get('total_questions', 0)
            )
        elif event_type == "severity_analysis":
            self.write_severity_analysis(
                data.get('risk_type', 'unknown'),
                data.get('severity', 'medium'),
                data.get('analysis', ''),
                data.get('immediate_action_required', False),
                data.get('recommended_actions', [])
            )
        elif event_type == "crisis_intervention":
            self.write_crisis_intervention(
                data.get('risk_type', 'unknown'),
                data.get('severity', 'high')
            )

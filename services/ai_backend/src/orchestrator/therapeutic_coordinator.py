"""
Therapeutic Coordinator - Three-Agent Orchestrator

Coordinates Amanda, Supervisor, and Risk Assessor agents.
Manages conversation state, risk queue, and mode switching.
"""
import json
from pathlib import Path
from typing import List, Dict, Iterator, Optional
from enum import Enum

from ..agents.amanda_agent import AmandaAgent
from ..agents.supervisor_agent import SupervisorAgent
from ..agents.risk_assessor_agent import RiskAssessorAgent
from ..providers.base import BaseLLMProvider
from ..session.session_manager import SessionManager
from ..monitoring import Monitor, EventType


class ConversationMode(Enum):
    """Conversation mode states."""
    NORMAL = "normal"           # Normal therapeutic conversation
    ASSESSMENT = "assessment"   # Conducting risk assessment


class TherapeuticCoordinator:
    """
    Coordinates the three-agent system for Amanda.

    Manages:
    - Conversation state (normal vs assessment mode)
    - Risk queue (detected risks awaiting assessment)
    - Agent coordination (which agent to use when)
    - Mode transitions
    - Crisis intervention
    """

    def __init__(
        self,
        provider: BaseLLMProvider,
        session_manager: Optional[SessionManager] = None,
        user_id: Optional[str] = None,
        transcript = None  # ChatTranscriptWriter
    ):
        """
        Initialize the coordinator with all three agents.

        Args:
            provider: LLM provider instance (used by all agents)
            session_manager: Optional SessionManager for conversation memory
            user_id: Optional user ID for session management
            transcript: Optional ChatTranscriptWriter for real-time logging
        """
        # Initialize the three agents
        self.amanda = AmandaAgent(provider)
        self.supervisor = SupervisorAgent(provider)
        self.risk_assessor = RiskAssessorAgent(provider)

        # State management
        self.mode = ConversationMode.NORMAL
        self.risk_queue: List[str] = []  # Queue of detected risk types

        # Load crisis resources
        self.crisis_resources = self._load_crisis_resources()

        # Session tracking
        self.session_active = True
        self.session_manager = session_manager
        self.user_id = user_id

        # Real-time transcript writer
        self.transcript = transcript

        # Load session context (previous summary) if available
        self.session_context = None
        if session_manager and user_id:
            self.session_context = session_manager.create_context_from_summary(user_id)

    def _load_crisis_resources(self) -> Dict:
        """
        Load crisis resources from JSON file.

        Returns:
            Crisis resources dict
        """
        resources_path = Path(__file__).parent.parent.parent / "protocols" / "crisis_resources.json"
        if resources_path.exists():
            with open(resources_path, 'r') as f:
                return json.load(f)
        return {}

    def process_message(
        self,
        user_message: str,
        context: Optional[Dict] = None
    ) -> Iterator[str]:
        """
        Process a user message through the appropriate workflow.

        Main entry point for message processing. Determines which agent
        to use based on current mode and state.

        Args:
            user_message: User's input message
            context: Optional context (session summaries, etc.)

        Yields:
            Response chunks (for streaming)
        """
        if not self.session_active:
            yield "This session has ended. Please start a new conversation."
            return

        # Write user message to transcript IMMEDIATELY
        if self.transcript:
            self.transcript.write_user_message(user_message)

        # Route to appropriate workflow based on mode
        if self.mode == ConversationMode.NORMAL:
            yield from self._handle_normal_mode(user_message, context)
        elif self.mode == ConversationMode.ASSESSMENT:
            yield from self._handle_assessment_mode(user_message)

    def _handle_normal_mode(
        self,
        user_message: str,
        context: Optional[Dict] = None
    ) -> Iterator[str]:
        """
        Handle message in normal conversation mode.

        Workflow:
        1. Amanda responds to user
        2. Supervisor checks for risks
        3. If risk detected → switch to assessment mode
        4. If no risk → continue normal conversation

        Args:
            user_message: User's message
            context: Optional context

        Yields:
            Response chunks
        """
        # Merge session context with provided context
        merged_context = self._merge_context(context)

        # Step 1: Amanda responds
        if self.transcript:
            self.transcript.write_agent_activation('Amanda', 0.7, 'Main Therapist')
            self.transcript.write_amanda_response_start()

        full_response = ""
        for chunk in self.amanda.stream_process(user_message, merged_context):
            full_response += chunk
            # Write each chunk IMMEDIATELY to transcript
            if self.transcript:
                self.transcript.write_amanda_chunk(chunk)
            yield chunk

        # End Amanda's response in transcript
        if self.transcript:
            self.transcript.write_amanda_response_end()

        # Step 2: Supervisor analyzes conversation after Amanda's response
        if self.transcript:
            self.transcript.write_supervisor_check()

        risk_analysis = self.supervisor.analyze_conversation(
            self.amanda.get_conversation_history()
        )

        if self.transcript:
            self.transcript.write_supervisor_result(
                risk_analysis.get('risk_detected', False),
                risk_analysis.get('risk_types', []),
                risk_analysis.get('confidence', 'none')
            )

        # Step 3: Check if risk detected
        if self.supervisor.should_trigger_assessment(risk_analysis):
            # Add detected risks to queue
            for risk_type in risk_analysis.get('risk_types', []):
                if risk_type not in self.risk_queue:
                    self.risk_queue.append(risk_type)

            if self.transcript:
                self.transcript.write_risk_alert(
                    risk_analysis.get('risk_types', []),
                    risk_analysis.get('confidence', 'unknown')
                )

            # Switch to assessment mode
            if self.risk_queue:
                old_mode = self.mode.value
                self.mode = ConversationMode.ASSESSMENT

                if self.transcript:
                    self.transcript.write_mode_switch(old_mode, self.mode.value)
                # Note: Next message will start assessment

    def _handle_assessment_mode(self, user_message: str) -> Iterator[str]:
        """
        Handle message in assessment mode.

        Workflow:
        1. Check if we're starting a new assessment or continuing one
        2. If starting → load protocol and ask first question
        3. If continuing → record answer and ask next question
        4. If complete → analyze severity and take action

        Args:
            user_message: User's message (answer to assessment question)

        Yields:
            Response chunks
        """
        # Check if we need to start a new assessment
        if not self.risk_assessor.current_protocol and self.risk_queue:
            # Start assessment for first risk in queue
            risk_type = self.risk_queue[0]
            self.risk_assessor.start_assessment(risk_type)

            if self.transcript:
                protocol = self.risk_assessor.current_protocol
                total_q = len(protocol.get('questions', [])) if protocol else 0
                self.transcript.write_assessment_start(risk_type, total_q)

            # Ask first question
            question = self.risk_assessor.get_next_question()
            if question:
                if self.transcript:
                    protocol = self.risk_assessor.current_protocol
                    total_q = len(protocol.get('questions', [])) if protocol else 0
                    self.transcript.write_question(1, total_q)
                    self.transcript.write_amanda_response_start()
                    self.transcript.write_amanda_chunk(question)
                    self.transcript.write_amanda_response_end()
                yield question
                return

        # If we have an active assessment, record the answer
        if self.risk_assessor.current_protocol:
            # Record the user's answer to previous question
            self.risk_assessor.record_answer(user_message)

            # Check if assessment is complete
            if self.risk_assessor.assessment_complete:
                # Analyze severity
                analysis = self.risk_assessor.analyze_severity()

                if self.transcript:
                    self.transcript.write_severity_analysis(
                        self.risk_assessor.current_protocol.get('assessment_type'),
                        analysis.get('severity'),
                        analysis.get('analysis', '')
                    )

                yield from self._handle_assessment_complete(analysis)
            else:
                # Ask next question
                question = self.risk_assessor.get_next_question()
                if question:
                    if self.transcript:
                        progress = self.risk_assessor.get_progress()
                        if progress:
                            self.transcript.write_question(
                                progress['current_question'],
                                progress['total_questions']
                            )
                            self.transcript.write_amanda_response_start()
                            self.transcript.write_amanda_chunk(question)
                            self.transcript.write_amanda_response_end()
                    yield question
                else:
                    # Shouldn't happen, but handle gracefully
                    self.risk_assessor.assessment_complete = True
                    analysis = self.risk_assessor.analyze_severity()
                    yield from self._handle_assessment_complete(analysis)

    def _handle_assessment_complete(self, analysis: Dict) -> Iterator[str]:
        """
        Handle completion of a risk assessment.

        Based on severity:
        - IMMINENT/HIGH: Show crisis resources, end session
        - MEDIUM/LOW: Remove from queue, continue or assess next risk

        Args:
            analysis: Assessment analysis result

        Yields:
            Response chunks
        """
        severity = analysis.get('severity', 'medium').lower()
        assessment_type = analysis.get('assessment_type', 'unknown')

        # Remove current risk from queue
        if self.risk_queue and self.risk_queue[0] == assessment_type:
            self.risk_queue.pop(0)

        # Reset assessor for next assessment
        self.risk_assessor.reset()

        # Handle based on severity
        if severity in ['imminent', 'high']:
            if self.transcript:
                self.transcript.write_crisis_intervention(assessment_type)

            # CRITICAL: Show crisis resources and end session
            yield "\n\n"
            yield self._format_analysis_message(analysis)
            yield "\n\n"
            yield self._get_crisis_resources(assessment_type)
            yield "\n\nI care deeply about your safety. Please reach out to one of these resources right away. "
            yield "When you're ready, we can continue our conversation in a new session."

            # End session
            self.session_active = False

        else:
            # MEDIUM/LOW: Acknowledge and continue
            yield "\n\nThank you for sharing that with me. "

            if severity == 'medium':
                yield "I want to make sure you have support. "
                yield self._get_resource_summary(assessment_type)
                yield "\n\n"

            # Check if more risks in queue
            if self.risk_queue:
                yield "Before we continue, I'd like to ask you about something else. "
                # Stay in assessment mode for next risk
            else:
                # Return to normal conversation
                old_mode = self.mode.value
                self.mode = ConversationMode.NORMAL

                if self.transcript:
                    self.transcript.write_mode_switch(old_mode, self.mode.value)

                yield "Let's continue our conversation. What else is on your mind?"

    def _format_analysis_message(self, analysis: Dict) -> str:
        """
        Format the analysis message for the user.

        Args:
            analysis: Assessment analysis

        Returns:
            Formatted message
        """
        severity = analysis.get('severity', 'unknown')
        concerns = analysis.get('key_concerns', [])

        message = f"Based on what you've shared, I'm concerned about your wellbeing. "

        if severity == 'imminent':
            message += "This situation requires immediate professional support. "
        elif severity == 'high':
            message += "I strongly encourage you to reach out for professional help right away. "

        return message

    def _get_crisis_resources(self, risk_type: str) -> str:
        """
        Get crisis resources for a specific risk type.

        Args:
            risk_type: Type of risk

        Returns:
            Formatted crisis resources text
        """
        if risk_type not in self.crisis_resources:
            risk_type = 'general'

        resources = self.crisis_resources.get(risk_type, {})
        title = resources.get('title', 'Crisis Resources')
        resource_list = resources.get('resources', [])
        immediate_action = resources.get('immediate_action', '')

        # Format resources
        formatted = f"\n{'='*60}\n{title}\n{'='*60}\n\n"

        if immediate_action:
            formatted += f"⚠️  {immediate_action}\n\n"

        formatted += "Available Resources:\n\n"
        for resource in resource_list:
            name = resource.get('name', '')
            phone = resource.get('phone', '')
            contact = resource.get('contact', '')
            description = resource.get('description', '')
            availability = resource.get('availability', '')

            formatted += f"📞 {name}\n"
            if phone:
                formatted += f"   Phone: {phone}\n"
            if contact:
                formatted += f"   Contact: {contact}\n"
            if description:
                formatted += f"   {description}\n"
            if availability:
                formatted += f"   Available: {availability}\n"
            formatted += "\n"

        formatted += "="*60

        return formatted

    def _get_resource_summary(self, risk_type: str) -> str:
        """
        Get a brief resource summary (not full crisis display).

        Args:
            risk_type: Type of risk

        Returns:
            Brief resource info
        """
        if risk_type not in self.crisis_resources:
            return ""

        resources = self.crisis_resources.get(risk_type, {})
        resource_list = resources.get('resources', [])

        if resource_list:
            first_resource = resource_list[0]
            name = first_resource.get('name', '')
            phone = first_resource.get('phone', '')

            if phone:
                return f"If you'd like to talk to someone, {name} is available 24/7 at {phone}."

        return ""

    def _merge_context(self, provided_context: Optional[Dict] = None) -> Optional[Dict]:
        """
        Merge session context with provided context.

        Args:
            provided_context: Context provided in process_message call

        Returns:
            Merged context dict
        """
        if self.session_context and provided_context:
            # Merge both contexts
            merged = self.session_context.copy()
            merged.update(provided_context)
            return merged
        elif self.session_context:
            return self.session_context
        elif provided_context:
            return provided_context
        else:
            return None

    def save_session(self, metadata: Optional[Dict] = None) -> Optional[Dict]:
        """
        Save the current session with summary.

        Should be called at session end (normal end or crisis intervention).

        Args:
            metadata: Optional metadata to include in session record

        Returns:
            Session data dict or None if no session manager
        """
        if not self.session_manager or not self.user_id:
            return None

        # Get conversation history
        conversation_history = self.amanda.get_conversation_history()

        if not conversation_history:
            return None

        # Add coordinator state to metadata
        if metadata is None:
            metadata = {}

        metadata.update({
            'final_mode': self.mode.value,
            'risk_queue': self.risk_queue,
            'session_ended_safely': self.session_active,
            'interaction_count': self.amanda.get_interaction_count()
        })

        # Save session
        session_data = self.session_manager.save_session(
            user_id=self.user_id,
            conversation_history=conversation_history,
            session_metadata=metadata
        )

        return session_data

    def get_state(self) -> Dict:
        """
        Get current coordinator state.

        Returns:
            State information dict
        """
        return {
            'mode': self.mode.value,
            'risk_queue': self.risk_queue.copy(),
            'session_active': self.session_active,
            'interaction_count': self.amanda.get_interaction_count(),
            'assessment_progress': self.risk_assessor.get_progress() if self.mode == ConversationMode.ASSESSMENT else None
        }

    def reset_session(self):
        """
        Reset for a new session.

        Note: This does NOT save the current session. Call save_session() first if needed.
        """
        self.amanda.reset_conversation()
        self.risk_assessor.reset()
        self.mode = ConversationMode.NORMAL
        self.risk_queue = []
        self.session_active = True

        # Reload session context for new session
        if self.session_manager and self.user_id:
            self.session_context = self.session_manager.create_context_from_summary(self.user_id)

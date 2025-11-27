"""
Risk Assessor Agent - Questionnaire Administrator

Conducts structured clinical assessments when risks are detected.
Uses GPT-4o with temperature 0.2 for precise, clinical questioning.
"""
import json
from pathlib import Path
from typing import List, Dict, Optional
from ..providers.base import BaseLLMProvider
from ..prompts import PromptManager


class RiskAssessorAgent:
    """
    Clinical assessment agent that administers structured questionnaires.

    When risk is detected, this agent:
    1. Loads the appropriate protocol (suicidality, IPV, substance misuse)
    2. Asks questions one at a time in a therapeutic manner
    3. Collects and stores answers
    4. Analyzes responses to determine severity
    5. Provides recommendations
    """

    def __init__(self, provider: BaseLLMProvider):
        """
        Initialize Risk Assessor agent.

        Args:
            provider: LLM provider instance
        """
        self.provider = provider
        self.system_prompt = PromptManager.get_system_prompt("risk_assessor")
        self.temperature = PromptManager.get_agent_temperature("risk_assessor")  # 0.2

        # Load protocols
        self.protocols = self._load_protocols()

        # Current assessment state
        self.current_protocol = None
        self.current_question_index = 0
        self.answers = []
        self.assessment_complete = False

    def _load_protocols(self) -> Dict:
        """
        Load assessment protocols from JSON files.

        Returns:
            Dict mapping risk type to protocol data
        """
        protocols_dir = Path(__file__).parent.parent.parent / "protocols"
        protocols = {}

        protocol_files = {
            'suicidality': 'suicidality_protocol.json',
            'ipv': 'ipv_protocol.json',
            'substance_misuse': 'substance_misuse_protocol.json'
        }

        for risk_type, filename in protocol_files.items():
            filepath = protocols_dir / filename
            if filepath.exists():
                with open(filepath, 'r') as f:
                    protocols[risk_type] = json.load(f)

        return protocols

    def start_assessment(self, risk_type: str):
        """
        Start a new assessment for a specific risk type.

        Args:
            risk_type: Type of risk (suicidality, ipv, substance_misuse)
        """
        if risk_type not in self.protocols:
            raise ValueError(f"Unknown risk type: {risk_type}")

        self.current_protocol = self.protocols[risk_type]
        self.current_question_index = 0
        self.answers = []
        self.assessment_complete = False

    def get_next_question(self) -> Optional[str]:
        """
        Get the next question in the assessment.

        Handles conditional logic - some questions depend on previous answers.

        Returns:
            Question text formatted in a therapeutic manner, or None if assessment complete
        """
        if not self.current_protocol:
            return None

        questions = self.current_protocol['questions']

        # Find next question to ask (considering conditional logic)
        while self.current_question_index < len(questions):
            question = questions[self.current_question_index]

            # Check if question has dependencies
            if 'depends_on' in question:
                dep = question['depends_on']
                dep_question_id = dep['question_id']
                required_answer = dep['answer']

                # Find the answer to the dependency question
                dep_answer = self._get_answer_by_question_id(dep_question_id)

                # Skip this question if dependency not met
                if not dep_answer or dep_answer.lower() != required_answer.lower():
                    self.current_question_index += 1
                    continue

            # This question should be asked
            return self._format_question_therapeutically(question)

        # No more questions
        self.assessment_complete = True
        return None

    def _format_question_therapeutically(self, question: Dict) -> str:
        """
        Format a clinical question in a warm, therapeutic manner.

        Args:
            question: Question dict from protocol

        Returns:
            Therapeutically formatted question
        """
        # Use LLM to make the question sound natural and caring
        messages = [
            PromptManager.create_system_message(
                "You are Amanda, a caring therapist. Rephrase this clinical question "
                "in a warm, natural way while keeping the same meaning. Be brief (1-2 sentences)."
            ),
            PromptManager.create_user_message(
                f"Rephrase this question warmly: {question['text']}"
            )
        ]

        formatted = self.provider.generate(
            messages=messages,
            temperature=0.3,  # Slightly higher for natural language
            max_tokens=150
        )

        return formatted.strip()

    def record_answer(self, answer: str):
        """
        Record the user's answer to the current question.

        Args:
            answer: User's response
        """
        if not self.current_protocol:
            return

        question = self.current_protocol['questions'][self.current_question_index]

        self.answers.append({
            'question_id': question['id'],
            'question_text': question['text'],
            'answer': answer,
            'question_type': question.get('type', 'open')
        })

        self.current_question_index += 1

    def _get_answer_by_question_id(self, question_id: int) -> Optional[str]:
        """
        Get the answer to a specific question by its ID.

        Args:
            question_id: Question ID to find

        Returns:
            Answer string or None if not found
        """
        for answer_record in self.answers:
            if answer_record['question_id'] == question_id:
                return answer_record['answer']
        return None

    def analyze_severity(self) -> Dict:
        """
        Analyze all collected answers to determine severity level.

        Returns:
            Analysis result with severity, recommendations, etc.
        """
        if not self.assessment_complete or not self.current_protocol:
            return {
                'assessment_complete': False,
                'message': 'Assessment not yet complete'
            }

        # Prepare analysis prompt
        assessment_type = self.current_protocol['assessment_type']
        severity_criteria = self.current_protocol['severity_criteria']

        # Format answers for analysis
        answers_text = self._format_answers_for_analysis()
        criteria_text = json.dumps(severity_criteria, indent=2)

        analysis_prompt = f"""Analyze the following {assessment_type} assessment responses and determine the severity level.

Answers collected:
{answers_text}

Severity criteria:
{criteria_text}

Based on the answers, determine:
1. Severity level (imminent, high, medium, or low)
2. Brief analysis explaining your determination
3. Whether immediate action is required
4. Recommended next steps

Return ONLY valid JSON in this format:
{{
  "severity": "imminent/high/medium/low",
  "analysis": "brief explanation",
  "immediate_action_required": true/false,
  "key_concerns": ["list", "of", "concerns"],
  "recommended_actions": ["list", "of", "actions"]
}}"""

        messages = [
            PromptManager.create_system_message(self.system_prompt),
            PromptManager.create_user_message(analysis_prompt)
        ]

        try:
            response = self.provider.generate(
                messages=messages,
                temperature=self.temperature,
                max_tokens=1000
            )

            analysis = json.loads(response.strip())
            analysis['assessment_complete'] = True
            analysis['assessment_type'] = assessment_type
            analysis['total_questions_asked'] = len(self.answers)

            return analysis

        except json.JSONDecodeError:
            print(f"Warning: Risk Assessor returned invalid JSON: {response}")
            return {
                'assessment_complete': True,
                'severity': 'medium',  # Default to caution
                'analysis': 'Unable to complete automated analysis',
                'immediate_action_required': True,
                'recommended_actions': ['Consult with professional']
            }

    def _format_answers_for_analysis(self) -> str:
        """
        Format collected answers for analysis.

        Returns:
            Formatted answer text
        """
        formatted = []
        for i, answer_record in enumerate(self.answers, 1):
            formatted.append(
                f"Q{answer_record['question_id']}: {answer_record['question_text']}\n"
                f"A: {answer_record['answer']}\n"
            )
        return "\n".join(formatted)

    def reset(self):
        """Reset the assessor for a new assessment."""
        self.current_protocol = None
        self.current_question_index = 0
        self.answers = []
        self.assessment_complete = False

    def get_progress(self) -> Dict:
        """
        Get current assessment progress.

        Returns:
            Progress information
        """
        if not self.current_protocol:
            return {
                'active': False,
                'current_question': 0,
                'total_questions': 0,
                'progress_percent': 0
            }

        total_questions = len(self.current_protocol['questions'])
        progress = (self.current_question_index / total_questions) * 100 if total_questions > 0 else 0

        return {
            'active': True,
            'assessment_type': self.current_protocol['assessment_type'],
            'current_question': self.current_question_index + 1,
            'total_questions': total_questions,
            'progress_percent': round(progress, 1),
            'questions_answered': len(self.answers)
        }

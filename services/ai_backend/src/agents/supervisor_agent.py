"""
Supervisor Agent - Risk Detector

Monitors conversations for safety risks (suicidality, IPV, substance misuse).
Uses GPT-4o with temperature 0.3 for consistent, reliable detection.
"""
import json
from typing import List, Dict, Optional
from ..providers.base import BaseLLMProvider
from ..prompts import PromptManager


class SupervisorAgent:
    """
    Risk detection agent that monitors conversations for safety concerns.

    Analyzes the last 5 messages of conversation and detects three risk types:
    1. Suicidality / Self-harm
    2. Intimate Partner Violence (IPV)
    3. Substance Misuse
    """

    def __init__(self, provider: BaseLLMProvider):
        """
        Initialize Supervisor agent.

        Args:
            provider: LLM provider instance
        """
        self.provider = provider
        self.system_prompt = PromptManager.get_system_prompt("supervisor")
        self.temperature = PromptManager.get_agent_temperature("supervisor")  # 0.3

    def analyze_conversation(
        self,
        conversation_history: List[Dict[str, str]]
    ) -> Dict:
        """
        Analyze conversation for risk indicators.

        Args:
            conversation_history: Full conversation history

        Returns:
            Risk analysis result as dict with keys:
            - risk_detected: bool
            - risk_types: List[str]
            - confidence: str
            - triggering_content: str
            - reasoning: str
        """
        # Take only last 5 messages for analysis
        recent_messages = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history

        # Build analysis prompt
        messages = [
            PromptManager.create_system_message(self.system_prompt)
        ]

        # Add recent conversation context
        conversation_text = self._format_messages_for_analysis(recent_messages)
        analysis_request = f"""Analyze the following conversation for safety risks:

{conversation_text}

Return ONLY valid JSON with the risk analysis. No other text."""

        messages.append(PromptManager.create_user_message(analysis_request))

        # Get analysis from LLM
        try:
            response = self.provider.generate(
                messages=messages,
                temperature=self.temperature,
                max_tokens=500
            )

            # Parse JSON response
            risk_analysis = json.loads(response.strip())

            # Validate response structure
            required_keys = ['risk_detected', 'risk_types', 'confidence']
            if not all(key in risk_analysis for key in required_keys):
                return self._no_risk_result()

            return risk_analysis

        except json.JSONDecodeError:
            # If JSON parsing fails, assume no risk
            print(f"Warning: Supervisor returned invalid JSON: {response}")
            return self._no_risk_result()
        except Exception as e:
            print(f"Error in risk analysis: {e}")
            return self._no_risk_result()

    def _format_messages_for_analysis(self, messages: List[Dict[str, str]]) -> str:
        """
        Format messages into readable text for analysis.

        Args:
            messages: List of message dicts

        Returns:
            Formatted conversation text
        """
        formatted = []
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')

            if role == 'user':
                formatted.append(f"User: {content}")
            elif role == 'assistant':
                formatted.append(f"Amanda: {content}")
            # Skip system messages

        return "\n".join(formatted)

    def _no_risk_result(self) -> Dict:
        """
        Return a default 'no risk' result.

        Returns:
            Dict indicating no risk detected
        """
        return {
            "risk_detected": False,
            "risk_types": [],
            "confidence": "none",
            "triggering_content": "",
            "reasoning": ""
        }

    def should_trigger_assessment(self, risk_analysis: Dict) -> bool:
        """
        Determine if risk analysis should trigger formal assessment.

        Args:
            risk_analysis: Risk analysis result

        Returns:
            True if assessment should be triggered
        """
        if not risk_analysis.get('risk_detected', False):
            return False

        # Trigger on medium or high confidence
        confidence = risk_analysis.get('confidence', 'none').lower()
        return confidence in ['medium', 'high']

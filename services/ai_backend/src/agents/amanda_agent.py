"""
Amanda Agent - Main Therapist

The primary therapeutic agent for relationship support conversations.
Uses GPT-4o with temperature 0.7 for warm, empathetic responses.
"""
from typing import List, Dict, Iterator, Optional
from .base_agent import BaseAgent
from ..providers.base import BaseLLMProvider
from ..prompts import PromptManager


class AmandaAgent(BaseAgent):
    """
    Main therapeutic agent for relationship support.

    Conducts empathetic conversations with users about their relationships.
    Maintains full conversation history and provides warm, supportive responses.
    """

    def __init__(
        self,
        provider: BaseLLMProvider,
        name: str = "Amanda",
        role: str = "therapist",
        max_history: int = 100  # Keep full conversation history
    ):
        """
        Initialize Amanda agent.

        Args:
            provider: LLM provider instance
            name: Name of the agent (default: Amanda)
            role: Role of the agent (default: therapist)
            max_history: Maximum conversation history (default: 100 for full context)
        """
        system_prompt = PromptManager.get_system_prompt("amanda")
        super().__init__(name, role, provider, system_prompt)
        self.max_history = max_history
        self.interaction_count = 0

    def _build_messages(
        self,
        user_input: str,
        context: Optional[Dict] = None
    ) -> List[Dict[str, str]]:
        """
        Build the messages list for the LLM.

        Amanda must see the FULL conversation history every time.

        Args:
            user_input: Current user input
            context: Additional context (e.g., session summaries)

        Returns:
            List of message dicts
        """
        messages = []

        # Add system prompt
        if self.system_prompt:
            messages.append(
                PromptManager.create_system_message(self.system_prompt)
            )

        # Add session context if available
        if context and 'session_summary' in context:
            summary_msg = f"Previous session summary: {context['session_summary']}"
            messages.append(PromptManager.create_system_message(summary_msg))

        # Add FULL conversation history (not limited to max_history yet)
        messages.extend(self.conversation_history)

        # Add current user input
        messages.append(PromptManager.create_user_message(user_input))

        return messages

    def process(
        self,
        user_input: str,
        context: Optional[Dict] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """
        Process user input and generate a complete response.

        Args:
            user_input: User's input message
            context: Additional context for processing
            temperature: Override default temperature (default: 0.7)
            max_tokens: Override default max tokens
            **kwargs: Additional LLM parameters

        Returns:
            Amanda's complete response
        """
        # Build messages with full history
        messages = self._build_messages(user_input, context)

        # Use Amanda's temperature (0.7) unless overridden
        temp = temperature if temperature is not None else PromptManager.get_agent_temperature("amanda")
        max_tok = max_tokens if max_tokens is not None else 2048

        # Generate response
        response = self.provider.generate(
            messages=messages,
            temperature=temp,
            max_tokens=max_tok,
            **kwargs
        )

        # Update conversation history
        self.add_to_history('user', user_input)
        self.add_to_history('assistant', response)
        self.interaction_count += 1

        return response

    def stream_process(
        self,
        user_input: str,
        context: Optional[Dict] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Iterator[str]:
        """
        Process user input and stream the response.

        Args:
            user_input: User's input message
            context: Additional context for processing
            temperature: Override default temperature (default: 0.7)
            max_tokens: Override default max tokens
            **kwargs: Additional LLM parameters

        Yields:
            Response chunks as they are generated
        """
        # Build messages with full history
        messages = self._build_messages(user_input, context)

        # Use Amanda's temperature (0.7) unless overridden
        temp = temperature if temperature is not None else PromptManager.get_agent_temperature("amanda")
        max_tok = max_tokens if max_tokens is not None else 2048

        # Stream response
        full_response = ""
        for chunk in self.provider.stream(
            messages=messages,
            temperature=temp,
            max_tokens=max_tok,
            **kwargs
        ):
            full_response += chunk
            yield chunk

        # Update conversation history after streaming is complete
        self.add_to_history('user', user_input)
        self.add_to_history('assistant', full_response)
        self.interaction_count += 1

    def get_greeting(self) -> str:
        """
        Get Amanda's greeting message.

        Returns:
            Greeting message
        """
        return PromptManager.get_template('greeting')

    def get_interaction_count(self) -> int:
        """
        Get the number of interactions in this conversation.

        Returns:
            Number of user-assistant exchanges
        """
        return self.interaction_count

    def is_early_stage(self) -> bool:
        """
        Check if conversation is in early stage (first 10 interactions).

        Returns:
            True if early stage, False otherwise
        """
        return self.interaction_count < 10

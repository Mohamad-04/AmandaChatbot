"""
Chat Agent for Amanda.

Main conversational agent for relationship support.
"""
from typing import List, Dict, Iterator, Optional
from .base_agent import BaseAgent
from ..providers.base import BaseLLMProvider
from ..prompts import PromptManager
from ..config import config


class ChatAgent(BaseAgent):
    """
    Main chat agent for Amanda relationship support.

    This agent handles one-on-one conversations with users about
    their relationships, providing empathetic support and guidance.
    """

    def __init__(
        self,
        provider: BaseLLMProvider,
        name: str = "Amanda",
        role: str = "relationship_support",
        system_prompt: Optional[str] = None,
        max_history: int = 20
    ):
        """
        Initialize the chat agent.

        Args:
            provider: LLM provider instance
            name: Name of the agent (default: Amanda)
            role: Role of the agent (default: relationship_support)
            system_prompt: Custom system prompt (uses default if None)
            max_history: Maximum conversation history to maintain
        """
        # Use default Amanda system prompt if none provided
        if system_prompt is None:
            system_prompt = PromptManager.get_system_prompt("amanda")

        super().__init__(name, role, provider, system_prompt)
        self.max_history = max_history

    def _build_messages(
        self,
        user_input: str,
        context: Optional[Dict] = None
    ) -> List[Dict[str, str]]:
        """
        Build the messages list for the LLM.

        Args:
            user_input: Current user input
            context: Additional context

        Returns:
            List of message dicts
        """
        messages = []

        # Add system prompt
        if self.system_prompt:
            messages.append(
                PromptManager.create_system_message(self.system_prompt)
            )

        # Add conversation history (limited to max_history)
        recent_history = self.conversation_history[-self.max_history:]
        messages.extend(recent_history)

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
            temperature: Override default temperature
            max_tokens: Override default max tokens
            **kwargs: Additional LLM parameters

        Returns:
            Agent's complete response
        """
        # Build messages
        messages = self._build_messages(user_input, context)

        # Get generation parameters
        temp = temperature if temperature is not None else config.llm_temperature
        max_tok = max_tokens if max_tokens is not None else config.llm_max_tokens

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
            temperature: Override default temperature
            max_tokens: Override default max tokens
            **kwargs: Additional LLM parameters

        Yields:
            Response chunks as they are generated
        """
        # Build messages
        messages = self._build_messages(user_input, context)

        # Get generation parameters
        temp = temperature if temperature is not None else config.llm_temperature
        max_tok = max_tokens if max_tokens is not None else config.llm_max_tokens

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

    def get_greeting(self) -> str:
        """
        Get a greeting message.

        Returns:
            Greeting message
        """
        return PromptManager.get_template('greeting')

    def start_new_conversation(self):
        """Start a new conversation by resetting history."""
        self.reset_conversation()

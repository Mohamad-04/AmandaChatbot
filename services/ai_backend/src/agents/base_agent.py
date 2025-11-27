"""
Base Agent class for multi-agent orchestration.

Defines the interface for all agents in the system.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Iterator, Optional
from ..providers.base import BaseLLMProvider


class BaseAgent(ABC):
    """Abstract base class for all agents."""

    def __init__(
        self,
        name: str,
        role: str,
        provider: BaseLLMProvider,
        system_prompt: Optional[str] = None
    ):
        """
        Initialize the agent.

        Args:
            name: Name of the agent
            role: Role/purpose of the agent
            provider: LLM provider instance
            system_prompt: System prompt for the agent
        """
        self.name = name
        self.role = role
        self.provider = provider
        self.system_prompt = system_prompt
        self.conversation_history: List[Dict[str, str]] = []

    @abstractmethod
    def process(
        self,
        user_input: str,
        context: Optional[Dict] = None,
        **kwargs
    ) -> str:
        """
        Process user input and generate a response.

        Args:
            user_input: User's input message
            context: Additional context for processing
            **kwargs: Additional parameters

        Returns:
            Agent's response
        """
        pass

    @abstractmethod
    def stream_process(
        self,
        user_input: str,
        context: Optional[Dict] = None,
        **kwargs
    ) -> Iterator[str]:
        """
        Process user input and stream the response.

        Args:
            user_input: User's input message
            context: Additional context for processing
            **kwargs: Additional parameters

        Yields:
            Response chunks as they are generated
        """
        pass

    def reset_conversation(self):
        """Clear the conversation history."""
        self.conversation_history = []

    def get_conversation_history(self) -> List[Dict[str, str]]:
        """
        Get the conversation history.

        Returns:
            List of message dicts
        """
        return self.conversation_history.copy()

    def add_to_history(self, role: str, content: str):
        """
        Add a message to conversation history.

        Args:
            role: Message role (user/assistant/system)
            content: Message content
        """
        self.conversation_history.append({
            'role': role,
            'content': content
        })

    def __repr__(self) -> str:
        """String representation of the agent."""
        return f"{self.__class__.__name__}(name={self.name}, role={self.role})"

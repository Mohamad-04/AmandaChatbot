"""
Base LLM Provider abstract class.

Defines the interface that all LLM providers must implement.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Iterator, Optional


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, api_key: str, model: str, **kwargs):
        """
        Initialize the LLM provider.

        Args:
            api_key: API key for the provider
            model: Model name to use
            **kwargs: Additional provider-specific parameters
        """
        self.api_key = api_key
        self.model = model
        self.kwargs = kwargs

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """
        Generate a non-streaming response.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional generation parameters

        Returns:
            Generated text response
        """
        pass

    @abstractmethod
    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> Iterator[str]:
        """
        Generate a streaming response.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional generation parameters

        Yields:
            Text chunks as they are generated
        """
        pass

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text (approximate).

        Args:
            text: Text to count tokens for

        Returns:
            Approximate token count
        """
        pass

    def validate_messages(self, messages: List[Dict[str, str]]) -> bool:
        """
        Validate message format.

        Args:
            messages: List of message dicts

        Returns:
            True if valid, raises ValueError if invalid
        """
        if not messages:
            raise ValueError("Messages list cannot be empty")

        for msg in messages:
            if 'role' not in msg or 'content' not in msg:
                raise ValueError(
                    "Each message must have 'role' and 'content' fields"
                )
            if msg['role'] not in ['system', 'user', 'assistant']:
                raise ValueError(
                    f"Invalid role: {msg['role']}. "
                    f"Must be 'system', 'user', or 'assistant'"
                )

        return True

    def __repr__(self) -> str:
        """String representation of the provider."""
        return f"{self.__class__.__name__}(model={self.model})"

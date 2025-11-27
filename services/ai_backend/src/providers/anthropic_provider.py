"""
Anthropic LLM Provider implementation.

Supports Claude 3 models (Opus, Sonnet, Haiku).
"""
from typing import List, Dict, Iterator
from .base import BaseLLMProvider

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class AnthropicProvider(BaseLLMProvider):
    """Anthropic (Claude) LLM provider implementation."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022", **kwargs):
        """
        Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key
            model: Model name (e.g., claude-3-opus-20240229, claude-3-sonnet-20240229)
            **kwargs: Additional parameters
        """
        super().__init__(api_key, model, **kwargs)

        if not ANTHROPIC_AVAILABLE:
            raise ImportError(
                "Anthropic package not installed. Install with: pip install anthropic"
            )

        self.client = Anthropic(api_key=api_key)

    def _prepare_messages(self, messages: List[Dict[str, str]]) -> tuple[str, List[Dict[str, str]]]:
        """
        Prepare messages for Anthropic API.

        Anthropic requires system message to be separate from conversation messages.

        Args:
            messages: List of message dicts

        Returns:
            Tuple of (system_prompt, conversation_messages)
        """
        system_prompt = ""
        conversation_messages = []

        for msg in messages:
            if msg['role'] == 'system':
                system_prompt = msg['content']
            else:
                conversation_messages.append(msg)

        return system_prompt, conversation_messages

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """
        Generate a non-streaming response from Anthropic.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Anthropic parameters

        Returns:
            Generated text response
        """
        self.validate_messages(messages)

        system_prompt, conversation_messages = self._prepare_messages(messages)

        # Build API call parameters
        params = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": conversation_messages,
            **kwargs
        }

        # Add system prompt if present
        if system_prompt:
            params["system"] = system_prompt

        response = self.client.messages.create(**params)

        return response.content[0].text

    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> Iterator[str]:
        """
        Generate a streaming response from Anthropic.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Anthropic parameters

        Yields:
            Text chunks as they are generated
        """
        self.validate_messages(messages)

        system_prompt, conversation_messages = self._prepare_messages(messages)

        # Build API call parameters
        params = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": conversation_messages,
            **kwargs
        }

        # Add system prompt if present
        if system_prompt:
            params["system"] = system_prompt

        with self.client.messages.stream(**params) as stream:
            for text in stream.text_stream:
                yield text

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text (approximate).

        Anthropic uses their own tokenizer. This is a simple approximation.

        Args:
            text: Text to count tokens for

        Returns:
            Approximate token count
        """
        # Simple approximation: 1 token ≈ 4 characters
        # For production, use Anthropic's count_tokens API
        return len(text) // 4

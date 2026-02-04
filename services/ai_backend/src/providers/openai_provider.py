"""
OpenAI LLM Provider implementation.

STRICT MODE:
- Supports ONLY GPT-5.1
- Uses OpenAI Responses API exclusively
- No legacy models
- No other providers
"""

import os
from typing import List, Dict, Iterator
from .base import BaseLLMProvider

try:
    from openai import OpenAI
except ImportError as e:
    raise ImportError(
        "OpenAI SDK not installed. Install with: pip install --upgrade openai"
    ) from e


class OpenAIProvider(BaseLLMProvider):
    """OpenAI provider locked to GPT-5.1."""

    ALLOWED_MODEL = "gpt-5.1"

    def __init__(self, api_key: str = None, model: str = ALLOWED_MODEL, **kwargs):
        """
        Initialize OpenAI provider.

        Rules:
        - API key MUST come from OPENAI_API_KEY
        - ONLY GPT-5.1 is allowed
        """

        super().__init__(api_key, model, **kwargs)

        # 🔐 Load API key ONLY from environment
        env_key = os.getenv("OPENAI_API_KEY")

        if not env_key or env_key.startswith("${"):
            raise ValueError(
                "OPENAI_API_KEY not loaded correctly.\n"
                "Ensure .env exists and OPENAI_API_KEY=sk-... is set."
            )

        # 🔒 Enforce model lock
        if self.model != self.ALLOWED_MODEL:
            raise ValueError(
                f"Unsupported model '{self.model}'. "
                f"This system only supports '{self.ALLOWED_MODEL}'."
            )

        self.client = OpenAI(api_key=env_key)

        # 🔍 Ensure Responses API exists
        if not hasattr(self.client, "responses"):
            raise ImportError(
                "OpenAI SDK too old. GPT-5.1 requires Responses API.\n"
                "Upgrade using: pip install --upgrade openai"
            )

    # ------------------------------------------------------------------
    # Message formatting (Responses API input)
    # ------------------------------------------------------------------

    def _messages_to_input(self, messages: List[Dict[str, str]]) -> str:
        """
        Convert chat-style messages into a single text input
        suitable for the Responses API.
        """
        parts = []
        for msg in messages:
            role = msg["role"].capitalize()
            content = msg["content"]
            parts.append(f"{role}: {content}")

        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Non-streaming generation
    # ------------------------------------------------------------------

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,  # kept for interface compatibility
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        self.validate_messages(messages)

        response = self.client.responses.create(
            model=self.ALLOWED_MODEL,
            input=self._messages_to_input(messages),
            reasoning={"effort": "none"},
            text={"verbosity": "medium"},
            max_output_tokens=max_tokens,
        )

        return response.output_text

    # ------------------------------------------------------------------
    # Streaming generation
    # ------------------------------------------------------------------

    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs,
    ) -> Iterator[str]:
        self.validate_messages(messages)

        stream = self.client.responses.create(
            model=self.ALLOWED_MODEL,
            input=self._messages_to_input(messages),
            reasoning={"effort": "none"},
            text={"verbosity": "medium"},
            max_output_tokens=max_tokens,
            stream=True,
        )

        for event in stream:
            if hasattr(event, "delta") and event.delta:
                yield event.delta
            elif hasattr(event, "output_text") and event.output_text:
                yield event.output_text

    # ------------------------------------------------------------------
    # Token counting (approximate)
    # ------------------------------------------------------------------

    def count_tokens(self, text: str) -> int:
        return len(text) // 4

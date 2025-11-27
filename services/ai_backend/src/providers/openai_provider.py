"""
OpenAI LLM Provider implementation.

Supports GPT-4, GPT-3.5, and other OpenAI models.
"""
from typing import List, Dict, Iterator
from .base import BaseLLMProvider

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class OpenAIProvider(BaseLLMProvider):
    """OpenAI LLM provider implementation."""

    def __init__(self, api_key: str, model: str = "gpt-4", **kwargs):
        """
        Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key
            model: Model name (e.g., gpt-4, gpt-3.5-turbo)
            **kwargs: Additional parameters
        """
        super().__init__(api_key, model, **kwargs)

        if not OPENAI_AVAILABLE:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )

        self.client = OpenAI(api_key=api_key)

        # Check if Responses API is available (required for GPT-5)
        model_lower = self.model.lower()
        is_gpt5 = any(pattern in model_lower for pattern in ['gpt-5', 'gpt-5.1', 'gpt-5-mini', 'gpt-5-nano'])
        if is_gpt5 and not hasattr(self.client, 'responses'):
            raise ImportError(
                f"GPT-5 models require OpenAI Python library >= 1.60.0 with Responses API support.\n"
                f"Your model '{model}' uses the new Responses API which is not available.\n"
                f"Please upgrade: pip install --upgrade openai"
            )

    def _is_gpt5_model(self) -> bool:
        """
        Check if the model is from the GPT-5 family (uses Responses API).

        GPT-5 models use a completely different API: responses.create() instead of chat.completions.create()

        Returns:
            True if model is GPT-5 family
        """
        model_lower = self.model.lower()
        gpt5_patterns = ['gpt-5', 'gpt-5.1', 'gpt-5-mini', 'gpt-5-nano']
        return any(pattern in model_lower for pattern in gpt5_patterns)

    def _get_gpt5_reasoning_effort(self) -> str:
        """
        Get the appropriate reasoning effort for GPT-5 models.

        GPT-5.1 supports "none" for fast responses.
        GPT-5 (original) does NOT support "none", only 'minimal', 'low', 'medium', 'high'.

        Returns:
            Reasoning effort string
        """
        model_lower = self.model.lower()
        # GPT-5.1 and newer variants support "none"
        if any(pattern in model_lower for pattern in ['gpt-5.1', 'gpt-5-mini', 'gpt-5-nano']):
            return "none"
        # Original GPT-5 uses "minimal" (closest to "none")
        else:
            return "minimal"

    def _uses_max_completion_tokens(self) -> bool:
        """
        Check if the model uses max_completion_tokens instead of max_tokens.

        Newer Chat Completions models (GPT-4o, o1) use max_completion_tokens.
        Older models (GPT-4, GPT-3.5) use max_tokens.
        GPT-5 models use max_output_tokens in Responses API.

        Returns:
            True if model uses max_completion_tokens
        """
        model_lower = self.model.lower()
        # Newer Chat Completions models that require max_completion_tokens
        new_model_patterns = ['gpt-4o', 'o1-preview', 'o1-mini']
        return any(pattern in model_lower for pattern in new_model_patterns)

    def _messages_to_input(self, messages: List[Dict[str, str]]) -> str:
        """
        Convert Chat Completions messages format to Responses API input format.

        For GPT-5 models, we need to convert:
        - messages (list of dicts) → input (single string)

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            Single input string for Responses API
        """
        # Combine all messages into a single input string
        # Format: "System: ...\nUser: ...\nAssistant: ..."
        parts = []
        for msg in messages:
            role = msg['role'].capitalize()
            content = msg['content']
            if role == 'System':
                # System messages become part of the input context
                parts.append(f"Instructions: {content}")
            elif role == 'User':
                parts.append(f"User: {content}")
            elif role == 'Assistant':
                parts.append(f"Assistant: {content}")

        return "\n\n".join(parts)

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """
        Generate a non-streaming response from OpenAI.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0) - ignored for GPT-5
            max_tokens: Maximum tokens to generate
            **kwargs: Additional OpenAI parameters

        Returns:
            Generated text response
        """
        self.validate_messages(messages)

        # GPT-5 models use Responses API
        if self._is_gpt5_model():
            input_text = self._messages_to_input(messages)
            reasoning_effort = self._get_gpt5_reasoning_effort()
            response = self.client.responses.create(
                model=self.model,
                input=input_text,
                reasoning={"effort": reasoning_effort},  # "none" for 5.1, "minimal" for 5
                text={"verbosity": "medium"},
                max_output_tokens=max_tokens,
                **kwargs
            )
            return response.output_text

        # Chat Completions API for older models
        elif self._uses_max_completion_tokens():
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_completion_tokens=max_tokens,
                **kwargs
            )
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )

        return response.choices[0].message.content

    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> Iterator[str]:
        """
        Generate a streaming response from OpenAI.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0) - ignored for GPT-5
            max_tokens: Maximum tokens to generate
            **kwargs: Additional OpenAI parameters

        Yields:
            Text chunks as they are generated
        """
        self.validate_messages(messages)

        # GPT-5 models use Responses API
        if self._is_gpt5_model():
            input_text = self._messages_to_input(messages)
            reasoning_effort = self._get_gpt5_reasoning_effort()
            stream = self.client.responses.create(
                model=self.model,
                input=input_text,
                reasoning={"effort": reasoning_effort},  # "none" for 5.1, "minimal" for 5
                text={"verbosity": "medium"},
                max_output_tokens=max_tokens,
                stream=True,
                **kwargs
            )

            # Responses API uses event stream format with typed events
            # Events have a 'type' attribute indicating the event kind
            for event in stream:
                text_chunk = None

                # Check event type for text delta events
                # The Responses API uses semantic event types like 'response.output_text.delta'
                if hasattr(event, 'type') and 'text.delta' in str(event.type):
                    # For ResponseTextDeltaEvent, the delta is a string directly
                    if hasattr(event, 'delta') and event.delta is not None:
                        text_chunk = event.delta

                # Fallback: check if event.delta.text exists (alternative format)
                if text_chunk is None and hasattr(event, 'delta'):
                    if hasattr(event.delta, 'text') and event.delta.text is not None:
                        text_chunk = event.delta.text

                # Fallback: check if event.text exists
                if text_chunk is None and hasattr(event, 'text') and event.text is not None:
                    text_chunk = event.text

                # Fallback: check if event.content exists
                if text_chunk is None and hasattr(event, 'content') and event.content is not None:
                    text_chunk = event.content

                # Fallback: check if event.output_text exists (full output)
                if text_chunk is None and hasattr(event, 'output_text') and event.output_text is not None:
                    text_chunk = event.output_text

                # Yield any text we found
                if text_chunk:
                    yield text_chunk

        # Chat Completions API for older models
        elif self._uses_max_completion_tokens():
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_completion_tokens=max_tokens,
                stream=True,
                **kwargs
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        else:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                **kwargs
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text (approximate).

        OpenAI uses tiktoken for accurate counting, but we use a simple
        approximation here: ~4 characters per token for English text.

        Args:
            text: Text to count tokens for

        Returns:
            Approximate token count
        """
        # Simple approximation: 1 token ≈ 4 characters
        # For production, use tiktoken library for accurate counting
        return len(text) // 4
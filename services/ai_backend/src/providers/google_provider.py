"""
Google (Gemini) LLM Provider implementation.

Supports Gemini Pro and other Google AI models.
"""
from typing import List, Dict, Iterator
from .base import BaseLLMProvider

try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


class GoogleProvider(BaseLLMProvider):
    """Google (Gemini) LLM provider implementation."""

    def __init__(self, api_key: str, model: str = "gemini-pro", **kwargs):
        """
        Initialize Google provider.

        Args:
            api_key: Google API key
            model: Model name (e.g., gemini-pro, gemini-pro-vision)
            **kwargs: Additional parameters
        """
        super().__init__(api_key, model, **kwargs)

        if not GOOGLE_AVAILABLE:
            raise ImportError(
                "Google Generative AI package not installed. "
                "Install with: pip install google-generativeai"
            )

        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model)

    def _convert_messages_to_gemini_format(
        self,
        messages: List[Dict[str, str]]
    ) -> tuple[str, List[Dict[str, str]]]:
        """
        Convert standard messages to Gemini format.

        Gemini uses a different conversation format with 'parts' and 'role' (user/model).

        Args:
            messages: Standard message format

        Returns:
            Tuple of (system_instruction, gemini_messages)
        """
        system_instruction = ""
        gemini_messages = []

        for msg in messages:
            if msg['role'] == 'system':
                system_instruction = msg['content']
            elif msg['role'] == 'user':
                gemini_messages.append({
                    'role': 'user',
                    'parts': [msg['content']]
                })
            elif msg['role'] == 'assistant':
                gemini_messages.append({
                    'role': 'model',
                    'parts': [msg['content']]
                })

        return system_instruction, gemini_messages

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """
        Generate a non-streaming response from Google.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Google parameters

        Returns:
            Generated text response
        """
        self.validate_messages(messages)

        system_instruction, gemini_messages = self._convert_messages_to_gemini_format(messages)

        # Configure generation settings
        generation_config = genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            **kwargs
        )

        # If there's a system instruction, we need to recreate the model with it
        if system_instruction:
            model = genai.GenerativeModel(
                self.model,
                system_instruction=system_instruction
            )
        else:
            model = self.client

        # Generate response
        if gemini_messages:
            # Start chat with history
            chat = model.start_chat(history=gemini_messages[:-1] if len(gemini_messages) > 1 else [])
            response = chat.send_message(
                gemini_messages[-1]['parts'][0],
                generation_config=generation_config
            )
        else:
            # No messages, just generate
            response = model.generate_content(
                "",
                generation_config=generation_config
            )

        return response.text

    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> Iterator[str]:
        """
        Generate a streaming response from Google.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Google parameters

        Yields:
            Text chunks as they are generated
        """
        self.validate_messages(messages)

        system_instruction, gemini_messages = self._convert_messages_to_gemini_format(messages)

        # Configure generation settings
        generation_config = genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            **kwargs
        )

        # If there's a system instruction, we need to recreate the model with it
        if system_instruction:
            model = genai.GenerativeModel(
                self.model,
                system_instruction=system_instruction
            )
        else:
            model = self.client

        # Generate streaming response
        if gemini_messages:
            # Start chat with history
            chat = model.start_chat(history=gemini_messages[:-1] if len(gemini_messages) > 1 else [])
            response = chat.send_message(
                gemini_messages[-1]['parts'][0],
                generation_config=generation_config,
                stream=True
            )
        else:
            # No messages, just generate
            response = model.generate_content(
                "",
                generation_config=generation_config,
                stream=True
            )

        for chunk in response:
            if chunk.text:
                yield chunk.text

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text using Google's tokenizer.

        Args:
            text: Text to count tokens for

        Returns:
            Token count
        """
        # Google provides a count_tokens method
        result = self.client.count_tokens(text)
        return result.total_tokens

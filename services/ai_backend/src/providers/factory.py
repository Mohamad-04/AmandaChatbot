"""
Provider Factory for creating LLM provider instances.

Handles provider selection and instantiation based on configuration.
"""
from typing import Optional
from .base import BaseLLMProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .google_provider import GoogleProvider


class ProviderFactory:
    """Factory for creating LLM provider instances."""

    _providers = {
        'openai': OpenAIProvider,
        'anthropic': AnthropicProvider,
        'google': GoogleProvider
    }

    @classmethod
    def create(
        cls,
        provider_name: str,
        api_key: str,
        model: Optional[str] = None,
        **kwargs
    ) -> BaseLLMProvider:
        """
        Create an LLM provider instance.

        Args:
            provider_name: Name of the provider (openai, anthropic, google)
            api_key: API key for the provider
            model: Model name (optional, uses provider default if not specified)
            **kwargs: Additional provider-specific parameters

        Returns:
            Instance of the requested provider

        Raises:
            ValueError: If provider_name is not supported
        """
        provider_name = provider_name.lower()

        if provider_name not in cls._providers:
            available = ', '.join(cls._providers.keys())
            raise ValueError(
                f"Unknown provider: {provider_name}. "
                f"Available providers: {available}"
            )

        provider_class = cls._providers[provider_name]

        # Create instance with or without model specification
        if model:
            return provider_class(api_key=api_key, model=model, **kwargs)
        else:
            return provider_class(api_key=api_key, **kwargs)

    @classmethod
    def create_from_config(cls, config) -> BaseLLMProvider:
        """
        Create an LLM provider from a Config object.

        Args:
            config: Config instance with LLM settings

        Returns:
            Instance of the configured provider
        """
        return cls.create(
            provider_name=config.llm_provider,
            api_key=config.llm_api_key,
            model=config.llm_model
        )

    @classmethod
    def list_providers(cls) -> list[str]:
        """
        List all available providers.

        Returns:
            List of provider names
        """
        return list(cls._providers.keys())

    @classmethod
    def is_available(cls, provider_name: str) -> bool:
        """
        Check if a provider is available.

        Args:
            provider_name: Name of the provider

        Returns:
            True if provider is available
        """
        return provider_name.lower() in cls._providers

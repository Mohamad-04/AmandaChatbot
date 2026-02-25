"""
Provider Factory for creating LLM provider instances.
"""

from typing import Optional
from .base import BaseLLMProvider
from .openai_provider import OpenAIProvider


class ProviderFactory:
    """Factory for creating OpenAI provider instances only."""

    _providers = {
        "openai": OpenAIProvider,
    }

    @classmethod
    def create(
        cls,
        provider_name: str,
        api_key: str,
        model: Optional[str] = None,
        **kwargs,
    ) -> BaseLLMProvider:
        provider_name = (provider_name or "").lower().strip()

        if provider_name != "openai":
            raise ValueError(
                f"Unsupported provider '{provider_name}'. "
                f"This project is configured for OpenAI only."
            )

        provider_class = cls._providers["openai"]
        if model:
            return provider_class(api_key=api_key, model=model, **kwargs)
        return provider_class(api_key=api_key, **kwargs)

    @classmethod
    def create_from_config(cls, config) -> BaseLLMProvider:
        return cls.create(
            provider_name=config.llm_provider,
            api_key=config.llm_api_key,
            model=config.llm_model,
        )

    @classmethod
    def list_providers(cls) -> list[str]:
        return list(cls._providers.keys())

    @classmethod
    def is_available(cls, provider_name: str) -> bool:
        return (provider_name or "").lower().strip() == "openai"
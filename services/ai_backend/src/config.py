"""
Configuration loader for Amanda AI Backend.

Loads and validates configuration from config.yaml file.
Supports environment variable interpolation like: ${OPENAI_API_KEY}
"""
import os
import re
import yaml
from pathlib import Path
from typing import Dict, Any, Optional


class Config:
    """Configuration manager for the AI backend."""

    _instance: Optional["Config"] = None
    _config: Dict[str, Any] = {}

    def __new__(cls):
        """Singleton pattern to ensure single config instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize configuration."""
        if not self._config:
            self.load()

    def load(self, config_path: Optional[str] = None):
        """
        Load configuration from YAML file.

        Args:
            config_path: Path to config file (default: config.yaml in project root)
        """
        if config_path is None:
            base_dir = Path(__file__).parent.parent
            config_path = base_dir / "config.yaml"

        if not os.path.exists(config_path):
            raise FileNotFoundError(
                f"Configuration file not found: {config_path}\n"
                f"Please copy config.example.yaml to config.yaml and configure it."
            )

        with open(config_path, "r", encoding="utf-8") as f:
            loaded = yaml.safe_load(f) or {}

        # Resolve ${ENV_VAR} references anywhere in the config
        self._config = self._resolve_env_vars(loaded)

        self._validate()

    def _resolve_env_vars(self, value: Any) -> Any:
        """
        Recursively resolve strings of the form ${ENV_VAR} using os.environ.

        Only resolves when the entire string matches the pattern.
        """
        if isinstance(value, str):
            m = re.fullmatch(r"\$\{([A-Z0-9_]+)\}", value.strip())
            if m:
                return os.getenv(m.group(1), "")
            return value

        if isinstance(value, dict):
            return {k: self._resolve_env_vars(v) for k, v in value.items()}

        if isinstance(value, list):
            return [self._resolve_env_vars(v) for v in value]

        return value

    def _validate(self):
        """Validate configuration structure and required fields."""
        required_sections = ["llm", "agents", "server"]
        for section in required_sections:
            if section not in self._config:
                raise ValueError(f"Missing required configuration section: {section}")

        # Validate LLM provider
        provider = self.llm_provider
        if provider not in ["openai", "anthropic", "google"]:
            raise ValueError(
                f"Invalid LLM provider: {provider}. Must be one of: openai, anthropic, google"
            )

        # Validate API key for selected provider
        api_key = self.llm_api_key

        # Fallbacks (especially useful if user forgot ${...} interpolation)
        if not api_key and provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY", "")
        elif not api_key and provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
        elif not api_key and provider == "google":
            api_key = os.getenv("GOOGLE_API_KEY", "")

        if not api_key:
            raise ValueError(
                f"API key for provider '{provider}' not found.\n"
                f"Set llm.api_keys.{provider} in config.yaml (you can use ${{...}}), "
                f"or set the environment variable "
                f"{'OPENAI_API_KEY' if provider == 'openai' else ('ANTHROPIC_API_KEY' if provider == 'anthropic' else 'GOOGLE_API_KEY')}."
            )

        # Store resolved key back so the rest of the app uses the real one
        self._config.setdefault("llm", {}).setdefault("api_keys", {})[provider] = api_key

        # Validate model presence for selected provider
        providers_cfg = self._config["llm"].get("providers", {})
        if provider not in providers_cfg or not providers_cfg[provider].get("model"):
            raise ValueError(
                f"Model not found for provider '{provider}'. "
                f"Please set llm.providers.{provider}.model in config.yaml"
            )

    @property
    def llm_provider(self) -> str:
        """Get the configured LLM provider."""
        return self._config["llm"]["provider"]

    @property
    def llm_api_key(self) -> str:
        """Get the API key for the configured provider."""
        provider = self.llm_provider
        return self._config["llm"].get("api_keys", {}).get(provider, "")

    @property
    def llm_model(self) -> str:
        """Get the model for the configured provider."""
        provider = self.llm_provider
        return self._config["llm"]["providers"][provider]["model"]

    @property
    def llm_temperature(self) -> float:
        """Get the LLM temperature setting."""
        return float(self._config["llm"].get("temperature", 0.7))

    @property
    def llm_max_tokens(self) -> int:
        """Get the LLM max tokens setting."""
        return int(self._config["llm"].get("max_tokens", 2048))

    @property
    def llm_top_p(self) -> float:
        """Get the LLM top_p setting."""
        return float(self._config["llm"].get("top_p", 1.0))

    @property
    def server_host(self) -> str:
        """Get the server host."""
        return self._config["server"].get("host", "localhost")

    @property
    def server_port(self) -> int:
        """Get the server port."""
        return int(self._config["server"].get("port", 50051))

    @property
    def server_max_workers(self) -> int:
        """Get the server max workers."""
        return int(self._config["server"].get("max_workers", 10))

    @property
    def logging_level(self) -> str:
        """Get the logging level."""
        return self._config.get("logging", {}).get("level", "INFO")

    @property
    def logging_format(self) -> str:
        """Get the logging format."""
        return self._config.get("logging", {}).get(
            "format",
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )

    @property
    def logging_file(self) -> str:
        """Get the logging file path."""
        return self._config.get("logging", {}).get("file", "ai_backend.log")

    @property
    def api_keys(self) -> Dict[str, str]:
        """Get all API keys."""
        return self._config["llm"].get("api_keys", {})

    @property
    def voice(self) -> Dict[str, Any]:
        """Get voice configuration."""
        return self._config.get("voice", {})

    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value by dot-notation key."""
        keys = key.split(".")
        value: Any = self._config

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default

        return value


# Global config instance
config = Config()

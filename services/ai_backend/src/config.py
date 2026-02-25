"""
Configuration loader for Amanda AI Backend.

Loads and validates configuration from config.yaml file.
Supports environment variable interpolation like: ${OPENAI_API_KEY}

Project constraint:
- OpenAI is the ONLY supported provider.
"""

import os
import re
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from dotenv import load_dotenv

# Load environment variables from services/ai_backend/.env
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")


class Config:
    """Configuration manager for the AI backend (OpenAI only)."""

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
            config_path: Path to config file (default: config.yaml in ai_backend root)
        """
        if config_path is None:
            base_dir = Path(__file__).parent.parent  # services/ai_backend
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
        """Validate configuration structure and required fields (OpenAI only)."""
        required_sections = ["llm", "agents", "server"]
        for section in required_sections:
            if section not in self._config:
                raise ValueError(f"Missing required configuration section: {section}")

        # Provider must be openai
        provider = (self._config.get("llm", {}).get("provider") or "").strip().lower()
        if provider != "openai":
            raise ValueError(
                f"Invalid LLM provider: '{provider}'. This project supports OpenAI only.\n"
                f"Set llm.provider = openai in config.yaml."
            )

        # API key must exist either from config interpolation or env
        api_key = self._config.get("llm", {}).get("api_keys", {}).get("openai", "")
        if not api_key:
            api_key = os.getenv("OPENAI_API_KEY", "")

        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not found.\n"
                "Set llm.api_keys.openai in config.yaml (you can use ${OPENAI_API_KEY}), "
                "or set the environment variable OPENAI_API_KEY."
            )

        # Store resolved key back so the rest of the app uses the real one
        self._config.setdefault("llm", {}).setdefault("api_keys", {})["openai"] = api_key

        # Validate model presence
        providers_cfg = self._config.get("llm", {}).get("providers", {})
        openai_cfg = providers_cfg.get("openai", {})
        if not openai_cfg.get("model"):
            raise ValueError(
                "OpenAI model not found.\n"
                "Please set llm.providers.openai.model in config.yaml"
            )

    # --------------------------
    # Properties
    # --------------------------

    @property
    def llm_provider(self) -> str:
        """Get the configured LLM provider (always 'openai')."""
        return "openai"

    @property
    def llm_api_key(self) -> str:
        """Get the OpenAI API key."""
        return self._config["llm"].get("api_keys", {}).get("openai", "")

    @property
    def llm_model(self) -> str:
        """Get the configured OpenAI model."""
        return self._config["llm"]["providers"]["openai"]["model"]

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
        """Get all API keys (OpenAI only)."""
        return {"openai": self.llm_api_key}

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
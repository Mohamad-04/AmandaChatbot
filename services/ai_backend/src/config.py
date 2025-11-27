"""
Configuration loader for Amanda AI Backend.

Loads and validates configuration from config.yaml file.
"""
import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional


class Config:
    """Configuration manager for the AI backend."""

    _instance: Optional['Config'] = None
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
            # Default to config.yaml in the same directory as this file's parent
            base_dir = Path(__file__).parent.parent
            config_path = base_dir / "config.yaml"

        if not os.path.exists(config_path):
            raise FileNotFoundError(
                f"Configuration file not found: {config_path}\n"
                f"Please copy config.example.yaml to config.yaml and configure it."
            )

        with open(config_path, 'r', encoding='utf-8') as f:
            self._config = yaml.safe_load(f)

        self._validate()

    def _validate(self):
        """Validate configuration structure and required fields."""
        required_sections = ['llm', 'agents', 'server']
        for section in required_sections:
            if section not in self._config:
                raise ValueError(f"Missing required configuration section: {section}")

        # Validate LLM provider
        provider = self.llm_provider
        if provider not in ['openai', 'anthropic', 'google']:
            raise ValueError(
                f"Invalid LLM provider: {provider}. "
                f"Must be one of: openai, anthropic, google"
            )

        # Validate API key for selected provider
        api_key = self.llm_api_key
        if not api_key:
            raise ValueError(
                f"API key for provider '{provider}' not found in configuration. "
                f"Please set llm.api_keys.{provider} in config.yaml"
            )

    @property
    def llm_provider(self) -> str:
        """Get the configured LLM provider."""
        return self._config['llm']['provider']

    @property
    def llm_api_key(self) -> str:
        """Get the API key for the configured provider."""
        provider = self.llm_provider
        return self._config['llm']['api_keys'].get(provider, '')

    @property
    def llm_model(self) -> str:
        """
        Get the model for the configured provider.

        Returns the model from llm.providers[provider].model
        """
        provider = self.llm_provider
        return self._config['llm']['providers'][provider]['model']

    @property
    def llm_temperature(self) -> float:
        """Get the LLM temperature setting."""
        return self._config['llm'].get('temperature', 0.7)

    @property
    def llm_max_tokens(self) -> int:
        """Get the LLM max tokens setting."""
        return self._config['llm'].get('max_tokens', 2048)

    @property
    def llm_top_p(self) -> float:
        """Get the LLM top_p setting."""
        return self._config['llm'].get('top_p', 1.0)

    @property
    def server_host(self) -> str:
        """Get the server host."""
        return self._config['server'].get('host', 'localhost')

    @property
    def server_port(self) -> int:
        """Get the server port."""
        return self._config['server'].get('port', 50051)

    @property
    def server_max_workers(self) -> int:
        """Get the server max workers."""
        return self._config['server'].get('max_workers', 10)

    @property
    def logging_level(self) -> str:
        """Get the logging level."""
        return self._config.get('logging', {}).get('level', 'INFO')

    @property
    def logging_format(self) -> str:
        """Get the logging format."""
        return self._config.get('logging', {}).get(
            'format',
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    @property
    def logging_file(self) -> str:
        """Get the logging file path."""
        return self._config.get('logging', {}).get('file', 'ai_backend.log')

    @property
    def api_keys(self) -> Dict[str, str]:
        """Get all API keys."""
        return self._config['llm'].get('api_keys', {})

    @property
    def voice(self) -> Dict[str, Any]:
        """Get voice configuration."""
        return self._config.get('voice', {})

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value by dot-notation key.

        Args:
            key: Dot-notation key (e.g., 'llm.provider')
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        keys = key.split('.')
        value = self._config

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

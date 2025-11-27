"""
Amanda AI Backend - Source Package

Professional AI backend with multi-provider support and agent orchestration.
"""
from .config import config, Config
from .prompts import PromptManager
from .providers import ProviderFactory, BaseLLMProvider
from .agents import ChatAgent, BaseAgent
from .orchestrator import Orchestrator

__all__ = [
    'config',
    'Config',
    'PromptManager',
    'ProviderFactory',
    'BaseLLMProvider',
    'ChatAgent',
    'BaseAgent',
    'Orchestrator'
]

__version__ = '1.0.0'

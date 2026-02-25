"""
Amanda AI Backend package.

Keep this module lightweight to avoid import-time side effects.
"""

from .config import config, Config

__all__ = ["config", "Config"]
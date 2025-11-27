"""
Orchestrator for multi-agent coordination.

The TherapeuticCoordinator manages the three-agent system for Amanda.
"""
from .therapeutic_coordinator import TherapeuticCoordinator
from .orchestrator import Orchestrator  # Keep for backwards compatibility

__all__ = ['TherapeuticCoordinator', 'Orchestrator']

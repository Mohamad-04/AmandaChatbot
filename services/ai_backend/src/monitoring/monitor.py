"""
Monitoring and Explainability for Three-Agent System

Provides transparency into the workflow, agent activities,
and decision-making process.
"""
import json
from datetime import datetime
from typing import Dict, Optional, List
from enum import Enum


class EventType(Enum):
    """Types of monitorable events."""
    COORDINATOR_START = "coordinator_start"
    AGENT_START = "agent_start"
    AGENT_END = "agent_end"
    SUPERVISOR_ANALYSIS = "supervisor_analysis"
    RISK_DETECTED = "risk_detected"
    MODE_SWITCH = "mode_switch"
    ASSESSMENT_START = "assessment_start"
    ASSESSMENT_QUESTION = "assessment_question"
    ASSESSMENT_COMPLETE = "assessment_complete"
    SEVERITY_ANALYSIS = "severity_analysis"
    CRISIS_INTERVENTION = "crisis_intervention"
    SESSION_SAVE = "session_save"
    ERROR = "error"


class Monitor:
    """
    Monitors and logs three-agent system activities.

    Provides real-time visibility into:
    - Which agent is active
    - Supervisor risk analysis
    - Mode transitions
    - Assessment progress
    - Decision rationale
    """

    def __init__(self, verbose: bool = True, log_to_console: bool = True):
        """
        Initialize monitor.

        Args:
            verbose: Show detailed information
            log_to_console: Print to console in real-time
        """
        self.verbose = verbose
        self.log_to_console = log_to_console
        self.events: List[Dict] = []

    def log_event(
        self,
        event_type: EventType,
        data: Optional[Dict] = None,
        message: Optional[str] = None
    ):
        """
        Log an event.

        Args:
            event_type: Type of event
            data: Event data
            message: Human-readable message
        """
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type.value,
            'data': data or {},
            'message': message or ''
        }

        self.events.append(event)

        if self.log_to_console:
            self._print_event(event)

    def _print_event(self, event: Dict):
        """Print event to console with formatting."""
        event_type = event['type']
        message = event['message']
        data = event['data']

        # Color codes (ANSI)
        BLUE = '\033[94m'
        GREEN = '\033[92m'
        YELLOW = '\033[93m'
        RED = '\033[91m'
        MAGENTA = '\033[95m'
        CYAN = '\033[96m'
        RESET = '\033[0m'
        BOLD = '\033[1m'

        # Event-specific formatting
        if event_type == 'agent_start':
            agent = data.get('agent', 'Unknown')
            temp = data.get('temperature', '?')
            print(f"\n{CYAN}{'='*60}{RESET}")
            print(f"{BOLD}{CYAN}🤖 AGENT ACTIVE: {agent.upper()}{RESET}")
            print(f"{CYAN}Temperature: {temp} | Role: {data.get('role', 'N/A')}{RESET}")
            print(f"{CYAN}{'='*60}{RESET}\n")

        elif event_type == 'agent_end':
            agent = data.get('agent', 'Unknown')
            print(f"\n{CYAN}✓ {agent} response complete{RESET}\n")

        elif event_type == 'supervisor_analysis':
            print(f"\n{YELLOW}{'─'*60}{RESET}")
            print(f"{BOLD}{YELLOW}👁  SUPERVISOR ANALYZING...{RESET}")
            print(f"{YELLOW}Checking last 5 messages for safety risks{RESET}")

            # Show analysis results
            risk_detected = data.get('risk_detected', False)
            if risk_detected:
                risk_types = data.get('risk_types', [])
                confidence = data.get('confidence', 'unknown')
                print(f"{RED}⚠️  RISK DETECTED!{RESET}")
                print(f"{RED}Types: {', '.join(risk_types)}{RESET}")
                print(f"{RED}Confidence: {confidence}{RESET}")
            else:
                print(f"{GREEN}✓ No risks detected{RESET}")

            print(f"{YELLOW}{'─'*60}{RESET}\n")

        elif event_type == 'risk_detected':
            risk_types = data.get('risk_types', [])
            print(f"\n{RED}{BOLD}🚨 RISK ALERT{RESET}")
            print(f"{RED}Detected: {', '.join(risk_types)}{RESET}")
            print(f"{RED}Adding to risk queue for assessment{RESET}\n")

        elif event_type == 'mode_switch':
            old_mode = data.get('old_mode', '?')
            new_mode = data.get('new_mode', '?')
            print(f"\n{MAGENTA}{'='*60}{RESET}")
            print(f"{BOLD}{MAGENTA}🔄 MODE SWITCH{RESET}")
            print(f"{MAGENTA}{old_mode.upper()} → {new_mode.upper()}{RESET}")
            if new_mode == 'assessment':
                print(f"{MAGENTA}Starting structured clinical assessment{RESET}")
            else:
                print(f"{MAGENTA}Returning to normal conversation{RESET}")
            print(f"{MAGENTA}{'='*60}{RESET}\n")

        elif event_type == 'assessment_start':
            risk_type = data.get('risk_type', 'unknown')
            total_questions = data.get('total_questions', '?')
            print(f"\n{BLUE}{'─'*60}{RESET}")
            print(f"{BOLD}{BLUE}📋 ASSESSMENT STARTED{RESET}")
            print(f"{BLUE}Type: {risk_type}{RESET}")
            print(f"{BLUE}Questions: {total_questions}{RESET}")
            print(f"{BLUE}{'─'*60}{RESET}\n")

        elif event_type == 'assessment_question':
            question_num = data.get('question_number', '?')
            total = data.get('total_questions', '?')
            print(f"\n{BLUE}📝 Question {question_num}/{total}{RESET}")

        elif event_type == 'assessment_complete':
            risk_type = data.get('risk_type', 'unknown')
            print(f"\n{BLUE}{'─'*60}{RESET}")
            print(f"{BOLD}{BLUE}✓ ASSESSMENT COMPLETE: {risk_type}{RESET}")
            print(f"{BLUE}Analyzing responses for severity...{RESET}")
            print(f"{BLUE}{'─'*60}{RESET}\n")

        elif event_type == 'severity_analysis':
            severity = data.get('severity', 'unknown').upper()
            risk_type = data.get('risk_type', 'unknown')

            # Color based on severity
            if severity in ['IMMINENT', 'HIGH']:
                color = RED
                emoji = '🚨'
            elif severity == 'MEDIUM':
                color = YELLOW
                emoji = '⚠️'
            else:
                color = GREEN
                emoji = 'ℹ️'

            print(f"\n{color}{'='*60}{RESET}")
            print(f"{BOLD}{color}{emoji} SEVERITY ANALYSIS{RESET}")
            print(f"{color}Risk Type: {risk_type}{RESET}")
            print(f"{color}Severity: {severity}{RESET}")
            print(f"{color}Analysis: {data.get('analysis', 'N/A')}{RESET}")

            if data.get('immediate_action_required'):
                print(f"{RED}{BOLD}⚠️  IMMEDIATE ACTION REQUIRED{RESET}")
                actions = data.get('recommended_actions', [])
                for action in actions:
                    print(f"{RED}  • {action}{RESET}")

            print(f"{color}{'='*60}{RESET}\n")

        elif event_type == 'crisis_intervention':
            risk_type = data.get('risk_type', 'unknown')
            print(f"\n{RED}{BOLD}{'='*60}{RESET}")
            print(f"{RED}{BOLD}🆘 CRISIS INTERVENTION ACTIVATED{RESET}")
            print(f"{RED}Risk: {risk_type}{RESET}")
            print(f"{RED}Displaying crisis resources{RESET}")
            print(f"{RED}Session will end for user safety{RESET}")
            print(f"{RED}{BOLD}{'='*60}{RESET}\n")

        elif event_type == 'session_save':
            user_id = data.get('user_id', 'unknown')
            interaction_count = data.get('interaction_count', 0)
            print(f"\n{GREEN}💾 Session saved for user '{user_id}' ({interaction_count} interactions){RESET}\n")

        elif event_type == 'error':
            print(f"\n{RED}❌ ERROR: {message}{RESET}")
            if self.verbose and data:
                print(f"{RED}{json.dumps(data, indent=2)}{RESET}\n")

    def get_summary(self) -> Dict:
        """
        Get summary of all events.

        Returns:
            Summary statistics
        """
        event_counts = {}
        for event in self.events:
            event_type = event['type']
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        return {
            'total_events': len(self.events),
            'event_counts': event_counts,
            'first_event': self.events[0]['timestamp'] if self.events else None,
            'last_event': self.events[-1]['timestamp'] if self.events else None
        }

    def get_events(self, event_type: Optional[EventType] = None) -> List[Dict]:
        """
        Get events, optionally filtered by type.

        Args:
            event_type: Filter by this event type (optional)

        Returns:
            List of events
        """
        if event_type:
            return [e for e in self.events if e['type'] == event_type.value]
        return self.events.copy()

    def clear(self):
        """Clear all events."""
        self.events = []

    def export_to_file(self, filepath: str):
        """
        Export events to JSON file.

        Args:
            filepath: Path to save events
        """
        with open(filepath, 'w') as f:
            json.dump({
                'summary': self.get_summary(),
                'events': self.events
            }, f, indent=2)


# Global monitor instance (can be replaced with per-coordinator instances)
_global_monitor: Optional[Monitor] = None


def init_monitor(verbose: bool = True, log_to_console: bool = True) -> Monitor:
    """
    Initialize global monitor.

    Args:
        verbose: Show detailed information
        log_to_console: Print to console

    Returns:
        Monitor instance
    """
    global _global_monitor
    _global_monitor = Monitor(verbose=verbose, log_to_console=log_to_console)
    return _global_monitor


def get_monitor() -> Optional[Monitor]:
    """Get global monitor instance."""
    return _global_monitor


def log_event(event_type: EventType, data: Optional[Dict] = None, message: Optional[str] = None):
    """
    Log event to global monitor (if initialized).

    Args:
        event_type: Type of event
        data: Event data
        message: Human-readable message
    """
    if _global_monitor:
        _global_monitor.log_event(event_type, data, message)

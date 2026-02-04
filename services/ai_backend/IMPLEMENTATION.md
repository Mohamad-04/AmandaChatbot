# Amanda AI Backend - Three-Agent Therapeutic System

## Overview

The Amanda AI Backend implements a sophisticated three-agent system for relationship support therapy. The system coordinates three specialized LLM agents working together to provide empathetic conversation, risk detection, and clinical assessment.

## Architecture

### Three-Agent System

```
┌─────────────────────────────────────────────────────────┐
│          TherapeuticCoordinator                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Agent 1: Amanda (Main Therapist)                │  │
│  │  - Model: GPT-5.1                                │  │
│  │  - Temperature: 0.7 (warm, empathetic)           │  │
│  │  - Role: Therapeutic conversation                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Agent 2: Supervisor (Risk Detector)             │  │
│  │  - Model: GPT-4o                                 │  │
│  │  - Temperature: 0.3 (consistent detection)       │  │
│  │  - Role: Monitor for safety risks                │  │
│  │  - Detects: Suicidality, IPV, Substance Misuse   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Agent 3: Risk Assessor (Clinical Assessment)    │  │
│  │  - Model: GPT-4o                                 │  │
│  │  - Temperature: 0.2 (precise, clinical)          │  │
│  │  - Role: Administer structured protocols         │  │
│  │  - Protocols: 14Q suicide, 10Q IPV, 13Q substance│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  State Management:                                       │
│  - Conversation Mode (NORMAL / ASSESSMENT)               │
│  - Risk Queue (detected risks awaiting assessment)       │
│  - Session Context (previous session summaries)          │
│  - Crisis Resources                                      │
└─────────────────────────────────────────────────────────┘
```

## Conversation Workflow

### Normal Mode

1. **User sends message** → Coordinator receives it
2. **Amanda responds** (therapeutic conversation, temp 0.7)
3. **Supervisor analyzes** last 5 messages for risks (temp 0.3)
4. **If risk detected** with medium/high confidence:
   - Add to risk queue
   - Switch to ASSESSMENT mode
5. **If no risk** → Continue normal conversation

### Assessment Mode

1. **Load protocol** for first risk in queue (suicidality/IPV/substance)
2. **Ask questions** one at a time therapeutically (temp 0.2)
3. **Record answers** and handle conditional logic
4. **When complete** → Analyze severity using LLM
5. **Based on severity**:
   - **IMMINENT/HIGH**: Show crisis resources, end session
   - **MEDIUM**: Show brief resources, continue
   - **LOW**: Acknowledge, continue
6. **Return to NORMAL** mode or assess next risk in queue

## Risk Protocols

### Suicidality Protocol (14 Questions)

- Active ideation
- Specific plan
- Access to means
- Timeline/urgency
- Previous attempts
- Support system
- Safety planning

**Severity Criteria:**
- **IMMINENT**: Active plan + means + high urgency (8-10)
- **HIGH**: Active ideation + some planning
- **MEDIUM**: Passive ideation, protective factors present
- **LOW**: Fleeting thoughts, strong protective factors

### IPV Protocol (10 Questions)

- Current safety
- Types of abuse (physical, emotional, financial)
- Frequency and escalation
- Children involved
- Attempted to leave
- Support system
- Safety planning needs

### Substance Misuse Protocol (13 Questions)

- Substances used
- Frequency and quantity
- Impact on life domains
- Withdrawal symptoms
- Previous treatment
- Readiness to change

## Session Management

### Session Lifecycle

```
New User
   ↓
First Session → Conversation → Session End → Generate Summary
   ↓
Save to session_data/
   ↓
Returning User → Load Previous Summary → Pass to Amanda as Context
   ↓
New Session with Continuity
```

### Summarization

At session end, GPT-4o (temp 0.3) generates a 2-3 paragraph summary:

- **Main Topics**: Relationship issues discussed
- **Emotional State**: User's mood and feelings
- **Key Challenges**: Specific difficulties mentioned
- **Progress/Insights**: Therapeutic movement

Summaries are stored in `session_data/<user_id>_sessions.json`

## Project Structure

```
services/ai_backend/
├── src/
│   ├── agents/
│   │   ├── amanda_agent.py          # Main therapist (temp 0.7)
│   │   ├── supervisor_agent.py      # Risk detector (temp 0.3)
│   │   └── risk_assessor_agent.py   # Protocol admin (temp 0.2)
│   ├── orchestrator/
│   │   └── therapeutic_coordinator.py  # Three-agent coordinator
│   ├── session/
│   │   └── session_manager.py       # Session & summarization
│   ├── providers/
│   │   ├── openai_provider.py
│   │   ├── anthropic_provider.py
│   │   └── google_provider.py
│   ├── prompts.py                    # System prompts & templates
│   └── config.py                     # Configuration management
├── protocols/
│   ├── suicidality_protocol.json
│   ├── ipv_protocol.json
│   ├── substance_misuse_protocol.json
│   └── crisis_resources.json
├── session_data/                     # User session storage
├── main.py                           # CLI testing tool
├── server.py                         # gRPC production server
└── config.yaml                       # Configuration file
```

## Testing with CLI

### Basic Usage

```bash
# Using Anthropic (Claude)
python main.py --provider anthropic

# Using OpenAI (GPT-4)
python main.py --provider openai

# Specific user ID for session tracking
python main.py --user-id alice

# Disable session memory
python main.py --no-memory
```

### CLI Commands

- `quit/exit/bye` - Save session and exit
- `clear` - Save current session and start new one
- `history` - View conversation history
- `status` - View coordinator state (mode, risk queue, progress)

### Testing Risk Detection

Test the supervisor by mentioning risk indicators:

**Suicidality triggers:**
- "I don't want to be here anymore"
- "I've been thinking about ending it all"
- "What's the point of going on"

**IPV triggers:**
- "My partner gets violent when angry"
- "I'm afraid to go home"
- "They control all the money"

**Substance triggers:**
- "I've been drinking every day"
- "I can't stop using"
- "My drug use is ruining my life"

### Testing Assessment Mode

Once a risk is detected, the system will:
1. Switch to assessment mode
2. Start asking protocol questions
3. Record your answers
4. Determine severity
5. Take appropriate action

## Configuration

### config.yaml

```yaml
llm:
  provider: "anthropic"  # or "openai", "google"

  api_keys:
    anthropic: "your-key-here"
    openai: "your-key-here"
    google: "your-key-here"

  providers:
    anthropic:
      model: "claude-3-5-sonnet-20241022"
    openai:
      model: "gpt-4"
    google:
      model: "gemini-pro"

server:
  port: 50051
  max_workers: 10
```

## Integration with Flask Backend

The gRPC server (`server.py`) integrates with the Flask backend:

```python
# Flask backend calls via gRPC
stub.StreamChat(ChatMessage(
    user_id="user123",
    chat_id="chat456",
    message="I'm feeling really down"
))

# Receives streaming response from three-agent system
for chunk in response:
    print(chunk.text)
```

The server:
- Creates one coordinator per user
- Manages session state across requests
- Persists conversation history
- Handles crisis intervention
- Auto-saves sessions

## Agent Temperatures Explained

### Amanda: 0.7 (Warm & Empathetic)

High temperature for natural, varied therapeutic responses. Makes conversations feel human and empathetic.

### Supervisor: 0.3 (Consistent Detection)

Lower temperature for reliable risk pattern matching. Reduces false positives while maintaining sensitivity.

### Risk Assessor: 0.2 (Clinical Precision)

Very low temperature for precise clinical assessment. Ensures consistent application of diagnostic criteria.

## Crisis Resources

When imminent/high risk is detected:

```
============================================================
CRISIS RESOURCES - Suicidality
============================================================

⚠️  If you're in immediate danger, call 911

Available Resources:

📞 National Suicide Prevention Lifeline
   Phone: 988
   Available: 24/7

📞 Crisis Text Line
   Text: HOME to 741741
   Available: 24/7
============================================================
```

Session ends to prioritize immediate safety.

## Session Data Format

```json
{
  "user_id": "alice",
  "timestamp": "2024-01-15T10:30:00",
  "summary": "Alice discussed ongoing conflict with her partner...",
  "interaction_count": 12,
  "metadata": {
    "final_mode": "normal",
    "risk_queue": [],
    "session_ended_safely": true,
    "interaction_count": 12
  }
}
```

## Development Notes

### Adding New Risk Types

1. Create protocol JSON in `protocols/`
2. Add to `risk_assessor_agent.py` protocol_files dict
3. Update `supervisor_agent.py` risk types
4. Add crisis resources to `crisis_resources.json`

### Customizing Prompts

Edit `src/prompts.py`:
- `AMANDA_SYSTEM_PROMPT` - Main therapist behavior
- `SUPERVISOR_SYSTEM_PROMPT` - Risk detection criteria
- `RISK_ASSESSOR_SYSTEM_PROMPT` - Assessment tone

### Database Integration

Currently uses file-based storage. To migrate to database:
1. Implement `SessionManager` with DB backend
2. Replace file operations with DB queries
3. Keep same interface for compatibility

## Performance Considerations

- **Streaming**: All responses stream for real-time UX
- **Caching**: Provider responses not cached (therapeutic context changes)
- **Memory**: Each user gets dedicated coordinator (scales with concurrent users)
- **Persistence**: Sessions persist across server restarts

## Security Notes

- API keys stored in `config.yaml` (add to .gitignore)
- Session data includes conversation history
- User IDs should be anonymized
- Crisis resources must be kept up-to-date
- Consider encryption for session storage in production

## Future Enhancements

- [ ] Database backend for session storage
- [ ] Multi-language support
- [ ] Voice input/output integration
- [ ] Therapist dashboard for monitoring
- [ ] Advanced analytics and insights
- [ ] Integration with external crisis services
- [ ] Automated risk escalation workflows

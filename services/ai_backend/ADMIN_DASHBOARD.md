# Amanda Admin Dashboard - Monitoring Guide

## Overview

The Admin Dashboard provides a web interface for viewing monitoring logs without cluttering user conversations. All agent workflows, decisions, and transitions are silently logged to files and can be reviewed by admins through a clean dashboard.

## Key Features

✅ **Silent Logging** - Monitoring data captured without affecting user experience
✅ **Real-time Dashboard** - Web interface showing agent workflow
✅ **Event Filtering** - Filter by agent starts, risks, mode switches, etc.
✅ **Session Replay** - Review past sessions to understand AI decisions
✅ **Statistics** - Quick overview of risks, mode switches, assessments

## Architecture

### Production Setup (Default)

```
User Conversation (Clean)          Admin Dashboard (Monitoring)
─────────────────────────          ───────────────────────────
User: "I'm feeling sad"             🔍 Viewing logs silently...

Amanda: "I'm sorry to              Agent: Amanda (temp 0.7)
hear that..."                      Supervisor: No risks detected
                                   Mode: NORMAL
```

**User sees:** Only Amanda's responses (clean conversation)
**Admin sees:** Full workflow via dashboard (agents, decisions, risks)

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    User Conversation                     │
│                                                          │
│  User Message → TherapeuticCoordinator → Amanda Response│
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Silent logging (no console output)
                       ↓
┌─────────────────────────────────────────────────────────┐
│              monitoring_logs/ Directory                  │
│                                                          │
│  user_123/                                              │
│    ├── session_20240115_103000.jsonl  (event log)      │
│    ├── session_20240115_103000_summary.json            │
│    ├── session_20240115_150000.jsonl                   │
│    └── session_20240115_150000_summary.json            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Admin reviews via dashboard
                       ↓
┌─────────────────────────────────────────────────────────┐
│                   Admin Dashboard                        │
│                  http://localhost:5001                   │
│                                                          │
│  Select User → Select Session → View Events             │
│  Filter: All | Agent Start | Risks | Mode Switch        │
│  Auto-refresh every 5 seconds                           │
└─────────────────────────────────────────────────────────┘
```

## Starting the Dashboard

### Basic Usage

```bash
cd services/ai_backend
python admin_dashboard.py
```

Dashboard will be available at: **http://localhost:5001**

### Custom Port

```bash
python admin_dashboard.py --port 8080
```

## Using the Dashboard

### 1. Select a User

The dashboard shows all users who have had conversations:

```
Select a user: [dropdown showing all user_ids]
```

### 2. Select a Session

Once a user is selected, you'll see all their sessions:

```
Select a session: [dropdown showing session timestamps]
Example: 20240115_103000 (47 events)
```

### 3. View Events

Events are displayed in chronological order with:
- **Event type** (color-coded badge)
- **Timestamp** (exact time)
- **Data** (full event details in JSON)

### 4. Filter Events

Click filter buttons to focus on specific event types:

- **All Events** - Show everything
- **Agent Start** - When Amanda, Supervisor, or Risk Assessor activates
- **Supervisor** - Risk analysis results
- **Risks** - Detected risks (suicidality, IPV, substance)
- **Mode Switch** - Transitions between normal and assessment modes
- **Severity** - Risk severity analysis

### 5. Auto-Refresh

Click "⚡ Auto-refresh (5s)" to monitor ongoing conversations in real-time.

## Event Types & Colors

### 🔵 Blue Events - Agent Activity
- `agent_start` - Agent becomes active
- `agent_end` - Agent finishes response
- `assessment_start` - Clinical assessment begins
- `assessment_question` - Question asked

### 🟡 Yellow Events - Supervisor
- `supervisor_analysis` - Risk detection analysis

### 🔴 Red Events - Risks & Crisis
- `risk_detected` - Safety risk identified
- `crisis_intervention` - High-risk crisis response

### 🟣 Purple Events - Mode Changes
- `mode_switch` - Transition between normal and assessment

### 🟢 Green Events - Completion
- `severity_analysis` - Risk severity determined
- `session_end` - Session completed

## Example Dashboard View

### Statistics Panel

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│Total Events │Risks Detected│Mode Switches│ Assessments │
│     47      │      1      │      2      │      1      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Event Timeline

```
┌─────────────────────────────────────────────────────────┐
│ [agent_start]                            10:30:15 AM    │
│ Agent: Amanda                                           │
│ Temperature: 0.7                                        │
│ Role: Main Therapist                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [supervisor_analysis]                    10:30:18 AM    │
│ ✓ No risks detected                                     │
│ Analyzed: Last 5 messages                               │
│ Confidence: none                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [risk_detected]                          10:32:45 AM    │
│ ⚠️ RISK ALERT                                           │
│ Types: ["suicidality"]                                  │
│ Confidence: high                                        │
│ Risk Queue: ["suicidality"]                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [mode_switch]                            10:32:45 AM    │
│ NORMAL → ASSESSMENT                                     │
│ Trigger: risk_detected                                  │
└─────────────────────────────────────────────────────────┘
```

## Log File Format

### Event Log (.jsonl)

Each line is a JSON event:

```json
{"timestamp": "2024-01-15T10:30:15", "type": "agent_start", "data": {"agent": "Amanda", "temperature": 0.7}}
{"timestamp": "2024-01-15T10:30:18", "type": "supervisor_analysis", "data": {"risk_detected": false}}
{"timestamp": "2024-01-15T10:32:45", "type": "risk_detected", "data": {"risk_types": ["suicidality"]}}
```

### Summary File (.json)

Session summary:

```json
{
  "user_id": "alice",
  "session_id": "20240115_103000",
  "total_events": 47,
  "event_counts": {
    "agent_start": 12,
    "supervisor_analysis": 10,
    "risk_detected": 1,
    "mode_switch": 2
  },
  "first_event": "2024-01-15T10:30:00",
  "last_event": "2024-01-15T10:45:30"
}
```

## Integration with Production

### gRPC Server (server.py)

Automatically uses silent monitoring:

```python
# In server.py - automatic for all users
monitor = SilentMonitor(user_id=user_id, enable_console=False)
```

**User experience:** Clean conversation, no monitoring output
**Admin experience:** Full logs available via dashboard

### CLI (main.py)

Default behavior (silent monitoring):

```bash
python main.py --user-id alice
# ✓ Silent monitoring enabled - logs stored in monitoring_logs/
# ✓ View logs via admin dashboard: python admin_dashboard.py
```

Debug mode (verbose console output):

```bash
python main.py --user-id alice --monitor
# Shows all events in console (like before)
```

## Common Use Cases

### 1. Understanding Risk Detection

**Question:** "Why did the system switch to assessment mode?"

**Solution:**
1. Open dashboard
2. Select user and session
3. Filter by "Supervisor" events
4. See exact risk analysis that triggered the switch

### 2. Reviewing Assessment Flow

**Question:** "What questions were asked during the assessment?"

**Solution:**
1. Filter by "Agent Start" events
2. Look for Risk Assessor activations
3. See each question and user's response
4. View severity analysis

### 3. Quality Assurance

**Question:** "Is the system correctly identifying risks?"

**Solution:**
1. Review multiple sessions
2. Check supervisor_analysis events
3. Verify risk detection accuracy
4. Review false positives/negatives

### 4. Training & Education

**Question:** "How does the three-agent system work?"

**Solution:**
1. Have a test conversation
2. Open dashboard
3. Walk through the event timeline
4. See each agent activation and decision

## Performance

### Storage

- Each event: ~200-500 bytes
- Typical session: 50-100 events
- Storage per session: ~10-50 KB

### Dashboard

- Minimal resource usage
- Reads files on-demand
- No database required
- Scales to thousands of sessions

## Security Considerations

### Access Control

⚠️ **IMPORTANT:** The dashboard shows all user conversations and system decisions.

**Recommendations:**
- Run dashboard on internal network only
- Use authentication (add to Flask app)
- Restrict access to admins only
- Consider HTTPS for production

### Data Privacy

Monitoring logs contain:
- User messages
- Amanda responses
- Risk assessments
- Severity analysis

**Recommendations:**
- Store logs on secure server
- Implement log rotation
- Anonymize user IDs if possible
- Follow HIPAA/GDPR requirements

### Sample Authentication

Add to admin_dashboard.py:

```python
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()

@auth.verify_password
def verify_password(username, password):
    # Replace with secure authentication
    return username == 'admin' and password == 'secure_password'

@app.route('/')
@auth.login_required
def index():
    return render_template_string(DASHBOARD_TEMPLATE)
```

## Troubleshooting

### No users showing up

**Cause:** No conversations have occurred yet
**Solution:** Have a test conversation first

```bash
python main.py --user-id test_user
# Have a conversation...
# Then check dashboard
```

### Events not updating

**Cause:** Dashboard showing cached data
**Solution:** Click "🔄 Refresh" button

### Port already in use

**Cause:** Another service on port 5001
**Solution:**

```bash
python admin_dashboard.py --port 8080
```

### Dashboard not accessible

**Cause:** Firewall or network restrictions
**Solution:** Access via http://localhost:5001 on same machine

## Advanced Usage

### Log Rotation

For production, implement log rotation:

```python
# Add to silent_monitor.py
import logging.handlers

handler = logging.handlers.RotatingFileHandler(
    log_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
```

### Export Events

Export session to CSV for analysis:

```python
from src.monitoring import SilentMonitor
import csv

events = SilentMonitor.load_session_log('path/to/session.jsonl')

with open('events.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['timestamp', 'type', 'data'])
    writer.writeheader()
    for event in events:
        writer.writerow(event)
```

### API Integration

Dashboard provides JSON API:

```bash
# Get all users
curl http://localhost:5001/api/users

# Get sessions for user
curl http://localhost:5001/api/sessions/alice

# Get events for session
curl http://localhost:5001/api/events/alice/20240115_103000
```

## Next Steps

- [ ] Add real-time WebSocket updates
- [ ] Implement search across all sessions
- [ ] Add event export (CSV, PDF)
- [ ] Create analytics dashboard
- [ ] Add alerts for concerning patterns
- [ ] Implement user authentication
- [ ] Add HTTPS support

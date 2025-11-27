# Session Transcripts - Complete Guide

## Overview

Every conversation is now saved as a **human-readable transcript** in addition to structured JSON logs. This gives you a complete, readable record of:
- All user messages
- All Amanda responses
- All agent activities (with details)
- Risk detections
- Mode switches
- Assessments
- Everything that happens behind the scenes

## What You Get

### For Every Session

When a user has a conversation, the system creates **3 files**:

```
monitoring_logs/
└── user_123/
    ├── session_20240115_103000.jsonl         # JSON events (for filtering)
    ├── session_20240115_103000_summary.json  # Session summary
    └── session_20240115_103000_transcript.txt # HUMAN-READABLE TRANSCRIPT ✨
```

## Transcript Format

### Example Transcript

```
================================================================================
AMANDA SESSION TRANSCRIPT
================================================================================
User ID: alice
Session ID: 20240115_103000
Started: 2024-01-15 10:30:00
================================================================================

[10:30:05] USER: hi who are you

────────────────────────────────────────────────────────────────────────────────
[10:30:05] 🤖 AGENT ACTIVATED: AMANDA
    Role: Main Therapist
    Temperature: 0.7
────────────────────────────────────────────────────────────────────────────────

[10:30:07] AMANDA: Hi there! I'm Amanda, and I'm here to listen and support
you with any relationship difficulties you're experiencing. What's been on your
mind lately?

────────────────────────────────────────────────────────────────────────────────
[10:30:08] 👁  SUPERVISOR ANALYSIS
    Analyzing last 5 messages for safety risks...
    ✓ No risks detected
────────────────────────────────────────────────────────────────────────────────

[10:30:15] USER: i am feeling sad

────────────────────────────────────────────────────────────────────────────────
[10:30:15] 🤖 AGENT ACTIVATED: AMANDA
    Role: Main Therapist
    Temperature: 0.7
────────────────────────────────────────────────────────────────────────────────

[10:30:17] AMANDA: I'm really sorry to hear that you're feeling sad. It sounds
like something is weighing on you. Would you like to share what's been causing
those feelings?

────────────────────────────────────────────────────────────────────────────────
[10:30:18] 👁  SUPERVISOR ANALYSIS
    Analyzing last 5 messages for safety risks...
    ✓ No risks detected
────────────────────────────────────────────────────────────────────────────────

[10:30:25] USER: yes, my husband can not understand me

────────────────────────────────────────────────────────────────────────────────
[10:30:25] 🤖 AGENT ACTIVATED: AMANDA
    Role: Main Therapist
    Temperature: 0.7
────────────────────────────────────────────────────────────────────────────────

[10:30:27] AMANDA: That sounds really frustrating - feeling like your partner
doesn't understand you can be so isolating. Can you tell me more about what's
happening between you two?

────────────────────────────────────────────────────────────────────────────────
[10:30:28] 👁  SUPERVISOR ANALYSIS
    Analyzing last 5 messages for safety risks...
    ✓ No risks detected
────────────────────────────────────────────────────────────────────────────────

================================================================================
SESSION ENDED
Ended: 2024-01-15 10:35:30
Total Interactions: 3
================================================================================
```

## With Risk Detection

When a risk is detected, the transcript shows everything:

```
[10:32:40] USER: I don't want to be here anymore

────────────────────────────────────────────────────────────────────────────────
[10:32:40] 🤖 AGENT ACTIVATED: AMANDA
    Role: Main Therapist
    Temperature: 0.7
────────────────────────────────────────────────────────────────────────────────

[10:32:42] AMANDA: I'm concerned about what you're sharing. It sounds like
you're in a lot of pain right now. Are you thinking about ending your life?

────────────────────────────────────────────────────────────────────────────────
[10:32:43] 👁  SUPERVISOR ANALYSIS
    Analyzing last 5 messages for safety risks...
    ⚠️  RISK DETECTED!
    Types: suicidality
    Confidence: high
────────────────────────────────────────────────────────────────────────────────

================================================================================
[10:32:43] 🚨 RISK ALERT
    Detected: suicidality
    Confidence: high
    Adding to risk queue for assessment
================================================================================

================================================================================
[10:32:43] 🔄 MODE SWITCH
    NORMAL → ASSESSMENT
    Trigger: risk_detected
================================================================================

────────────────────────────────────────────────────────────────────────────────
[10:32:44] 📋 ASSESSMENT STARTED
    Type: suicidality
    Total Questions: 14
────────────────────────────────────────────────────────────────────────────────

[10:32:44] 📝 Question 1/14
AMANDA: I want to make sure - have you been having thoughts about harming
yourself or ending your life?
USER: yes

[10:32:50] 📝 Question 2/14
AMANDA: I appreciate you being honest with me. Do you have a specific plan for
how you would do it?
USER: no, not really

... (continues through all questions) ...

================================================================================
[10:35:20] 📊 SEVERITY ANALYSIS
    Risk Type: suicidality
    Severity: MEDIUM
    Analysis: Client has ideation but no specific plan. Protective factors
    present including family support. Willing to engage in safety planning.
================================================================================

================================================================================
[10:35:20] 🔄 MODE SWITCH
    ASSESSMENT → NORMAL
    Trigger: assessment_complete
================================================================================
```

## How to View Transcripts

### Option 1: Admin Dashboard (Easiest)

1. Start the dashboard:
   ```bash
   cd services/ai_backend
   python admin_dashboard.py
   ```

2. Open http://localhost:5001

3. Select user and session

4. Click **"📝 View Transcript"**

5. See the full transcript in a modal popup

### Option 2: Direct File Access

Transcripts are plain text files:

```bash
cd monitoring_logs

# List all users
ls

# List sessions for a user
ls alice/

# View a transcript
cat alice/session_20240115_103000_transcript.txt

# Or use any text editor
nano alice/session_20240115_103000_transcript.txt
```

### Option 3: Command Line

```bash
# Find most recent transcript for a user
find monitoring_logs/alice -name "*_transcript.txt" | sort -r | head -1 | xargs cat

# View with pager
find monitoring_logs/alice -name "*_transcript.txt" | sort -r | head -1 | xargs less
```

## File Organization

### Directory Structure

```
monitoring_logs/
├── alice/                                      # User folder
│   ├── session_20240115_103000.jsonl          # JSON events
│   ├── session_20240115_103000_summary.json   # Summary
│   ├── session_20240115_103000_transcript.txt # TRANSCRIPT
│   ├── session_20240115_150000.jsonl
│   ├── session_20240115_150000_summary.json
│   └── session_20240115_150000_transcript.txt
├── bob/
│   └── session_20240115_140000_transcript.txt
└── test_user/
    └── session_20240116_090000_transcript.txt
```

### File Naming

- Format: `session_YYYYMMDD_HHMMSS_transcript.txt`
- Example: `session_20240115_103000_transcript.txt`
- Sorted chronologically by filename

## What's Included

### 1. Session Header
- User ID
- Session ID (timestamp)
- Start time

### 2. Conversation
- **Every user message** with timestamp
- **Every Amanda response** with timestamp
- Clean, readable format

### 3. Agent Activations
- Which agent is active (Amanda, Supervisor, Risk Assessor)
- Agent role
- Temperature setting

### 4. Supervisor Analysis
- When supervisor checks for risks
- Results (risk detected or not)
- Risk types and confidence if detected

### 5. Risk Alerts
- Clear alert when risk detected
- Risk types listed
- Confidence level
- Risk queue status

### 6. Mode Switches
- Clear indication when mode changes
- Old mode → New mode
- What triggered the switch

### 7. Assessments
- Assessment start (type, total questions)
- Each question asked (numbered)
- User's answers
- Assessment completion

### 8. Severity Analysis
- Risk type
- Severity level (imminent, high, medium, low)
- AI's analysis reasoning
- Whether immediate action required
- Recommended actions

### 9. Crisis Interventions
- When activated
- Risk type and severity
- Indication that resources were shown
- Session ending notice

### 10. Session End
- End time
- Total interaction count

## Continuous Updates

Transcripts are **appendable** - they grow as the conversation continues:

- Each user message → immediately written
- Each Amanda response → immediately written
- Each monitoring event → immediately written

**You can view a transcript DURING a conversation** and see it update!

## Use Cases

### 1. Quality Assurance

```bash
# Review a specific session
cat monitoring_logs/alice/session_20240115_103000_transcript.txt

# Check if risks were properly detected
grep "RISK" monitoring_logs/alice/session_20240115_103000_transcript.txt

# See all mode switches
grep "MODE SWITCH" monitoring_logs/alice/session_20240115_103000_transcript.txt
```

### 2. Training & Education

Show the transcript to:
- Understand how the three-agent system works
- See real examples of risk detection
- Review assessment protocols in action
- Learn about therapeutic conversation flow

### 3. Auditing & Compliance

- Full record of every conversation
- Timestamped entries
- Shows all AI decisions and reasoning
- Demonstrates proper safety protocols

### 4. Debugging

- See exactly what happened in a session
- Identify where things went wrong
- Verify agent temperatures and roles
- Check mode transitions

## Searching Transcripts

### Find Specific Events

```bash
# Find all risk detections for a user
grep -r "RISK DETECTED" monitoring_logs/alice/

# Find crisis interventions
grep -r "CRISIS INTERVENTION" monitoring_logs/alice/

# Find severity analyses
grep -r "SEVERITY ANALYSIS" monitoring_logs/alice/

# Find specific words in conversations
grep -i "suicide" monitoring_logs/alice/*_transcript.txt
```

### Count Events

```bash
# Count sessions for a user
ls monitoring_logs/alice/*_transcript.txt | wc -l

# Count risks detected
grep -c "RISK DETECTED" monitoring_logs/alice/session_*.txt

# Count mode switches
grep -c "MODE SWITCH" monitoring_logs/alice/session_*.txt
```

## Storage Considerations

### File Sizes

- Typical conversation: 5-10 KB
- With risk assessment: 15-25 KB
- Crisis intervention: 20-30 KB

### Retention

Transcripts are permanent unless you delete them:

```bash
# Delete old sessions (older than 90 days)
find monitoring_logs -name "*_transcript.txt" -mtime +90 -delete

# Archive old sessions
tar -czf archive_$(date +%Y%m%d).tar.gz monitoring_logs/*/session_2024*

# Delete sessions for specific user
rm -r monitoring_logs/test_user/
```

## Privacy & Security

### Important Considerations

⚠️ **Transcripts contain sensitive information:**
- User messages (may include personal details)
- Mental health disclosures
- Crisis information
- Risk assessments

### Recommendations

1. **Secure Storage**
   - Store on encrypted filesystem
   - Restrict file permissions
   - Regular backups

2. **Access Control**
   - Only authorized personnel
   - Audit who accesses transcripts
   - Log access attempts

3. **Compliance**
   - Follow HIPAA/GDPR requirements
   - Implement data retention policies
   - Allow user data deletion requests

4. **File Permissions**
   ```bash
   # Restrict transcript access
   chmod 600 monitoring_logs/*/*.txt

   # Only owner can read/write
   chown amanda-admin:amanda-admin monitoring_logs -R
   ```

## API Access

Transcripts are accessible via the admin dashboard API:

```bash
# Get transcript for a session
curl http://localhost:5001/api/transcript/alice/20240115_103000

# Returns JSON with transcript text
{
  "transcript": "================================================================================\nAMANDA SESSION TRANSCRIPT\n..."
}
```

## Comparison: JSON vs Transcript

### JSON Events (`.jsonl`)

**Pros:**
- Machine readable
- Easy to filter/query
- Structured data
- Good for analysis

**Cons:**
- Not human friendly
- Needs parsing
- Hard to scan quickly

### Transcripts (`.txt`)

**Pros:**
- Human readable
- Easy to scan
- No parsing needed
- Great for review/audit
- Shareable

**Cons:**
- Not structured
- Harder to query programmatically

**Best Practice:** Use both!
- JSON for automated analysis
- Transcripts for human review

## Troubleshooting

### Transcript not created

**Cause:** Conversation didn't start properly
**Solution:** Check that monitor is enabled (default in production)

### Transcript is empty

**Cause:** No conversation happened yet
**Solution:** Have at least one exchange with Amanda

### Can't find user folder

**Cause:** User never had a conversation
**Solution:** Wait for first conversation or check user_id spelling

### Dashboard shows "No transcript available"

**Cause:** Transcript file doesn't exist
**Solution:** Ensure monitor is enabled, check file permissions

## Summary

✅ **Automatic** - Created for every session
✅ **Complete** - Full conversation + all monitoring
✅ **Readable** - Human-friendly format
✅ **Timestamped** - Every entry has timestamp
✅ **Appendable** - Grows with conversation
✅ **Persistent** - Saved to disk
✅ **Searchable** - Plain text, easy to grep
✅ **Viewable** - Dashboard or text editor

You now have a **complete audit trail** of every conversation and every decision the AI makes! 🎉

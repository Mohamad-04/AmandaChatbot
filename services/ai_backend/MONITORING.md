# Amanda AI Backend - Monitoring & Explainability Guide

## Overview

The monitoring system provides real-time visibility into the three-agent workflow, showing you exactly what's happening behind the scenes.

## Enabling Monitoring

### CLI (main.py)

```bash
# Enable monitoring with the --monitor flag
python main.py --monitor

# Combine with other flags
python main.py --monitor --user-id alice
python main.py --monitor --provider openai
```

### What You'll See

When monitoring is enabled, you'll see color-coded output showing:

## Event Types

### 1. Agent Activation (Blue)

```
============================================================
🤖 AGENT ACTIVE: AMANDA
Temperature: 0.7 | Role: Main Therapist
============================================================
```

Shows when Amanda (therapist), Supervisor (risk detector), or Risk Assessor (clinical assessment) becomes active.

### 2. Supervisor Analysis (Yellow)

```
────────────────────────────────────────────────────────────
👁  SUPERVISOR ANALYZING...
Checking last 5 messages for safety risks
✓ No risks detected
────────────────────────────────────────────────────────────
```

Or if a risk is found:

```
────────────────────────────────────────────────────────────
👁  SUPERVISOR ANALYZING...
Checking last 5 messages for safety risks
⚠️  RISK DETECTED!
Types: suicidality
Confidence: high
────────────────────────────────────────────────────────────
```

### 3. Risk Detection (Red)

```
🚨 RISK ALERT
Detected: suicidality
Adding to risk queue for assessment
```

### 4. Mode Switch (Magenta)

```
============================================================
🔄 MODE SWITCH
NORMAL → ASSESSMENT
Starting structured clinical assessment
============================================================
```

Or when returning to normal:

```
============================================================
🔄 MODE SWITCH
ASSESSMENT → NORMAL
Returning to normal conversation
============================================================
```

### 5. Assessment Start (Blue)

```
────────────────────────────────────────────────────────────
📋 ASSESSMENT STARTED
Type: suicidality
Questions: 14
────────────────────────────────────────────────────────────
```

### 6. Assessment Questions (Blue)

```
📝 Question 1/14
📝 Question 2/14
📝 Question 3/14
...
```

### 7. Assessment Complete (Blue)

```
────────────────────────────────────────────────────────────
✓ ASSESSMENT COMPLETE: suicidality
Analyzing responses for severity...
────────────────────────────────────────────────────────────
```

### 8. Severity Analysis (Color varies by severity)

**Low Severity (Green):**
```
============================================================
ℹ️ SEVERITY ANALYSIS
Risk Type: suicidality
Severity: LOW
Analysis: Client reports fleeting thoughts with no plan...
============================================================
```

**Medium Severity (Yellow):**
```
============================================================
⚠️ SEVERITY ANALYSIS
Risk Type: suicidality
Severity: MEDIUM
Analysis: Passive ideation present, but client has protective factors...
============================================================
```

**High Severity (Red):**
```
============================================================
🚨 SEVERITY ANALYSIS
Risk Type: suicidality
Severity: HIGH
Analysis: Active ideation with some planning...
⚠️  IMMEDIATE ACTION REQUIRED
  • Contact crisis services
  • Safety planning needed
============================================================
```

### 9. Crisis Intervention (Red)

```
============================================================
🆘 CRISIS INTERVENTION ACTIVATED
Risk: suicidality
Displaying crisis resources
Session will end for user safety
============================================================
```

### 10. Session Save (Green)

```
💾 Session saved for user 'alice' (12 interactions)
```

## Example Workflow

Here's what you'll see during a typical conversation with risk detection:

### Normal Conversation

```bash
You: I'm feeling sad

============================================================
🤖 AGENT ACTIVE: AMANDA
Temperature: 0.7 | Role: Main Therapist
============================================================

Amanda: I'm really sorry to hear that you're feeling sad. It sounds like something is weighing on you. Would you like to share what's been causing those feelings?

✓ Amanda response complete

────────────────────────────────────────────────────────────
👁  SUPERVISOR ANALYZING...
Checking last 5 messages for safety risks
✓ No risks detected
────────────────────────────────────────────────────────────

✓ Supervisor response complete
```

### Risk Detection & Mode Switch

```bash
You: I don't want to be here anymore

============================================================
🤖 AGENT ACTIVE: AMANDA
Temperature: 0.7 | Role: Main Therapist
============================================================

Amanda: I'm concerned about what you're sharing. It sounds like you're in a lot of pain right now. Are you thinking about ending your life?

✓ Amanda response complete

────────────────────────────────────────────────────────────
👁  SUPERVISOR ANALYZING...
Checking last 5 messages for safety risks
⚠️  RISK DETECTED!
Types: suicidality
Confidence: high
────────────────────────────────────────────────────────────

✓ Supervisor response complete

🚨 RISK ALERT
Detected: suicidality
Adding to risk queue for assessment

============================================================
🔄 MODE SWITCH
NORMAL → ASSESSMENT
Starting structured clinical assessment
============================================================
```

### Assessment Mode

```bash
────────────────────────────────────────────────────────────
📋 ASSESSMENT STARTED
Type: suicidality
Questions: 14
────────────────────────────────────────────────────────────

📝 Question 1/14

Amanda: I want to make sure - have you been having thoughts about harming yourself or ending your life?

You: yes

📝 Question 2/14

Amanda: I appreciate you being honest with me. Do you have a specific plan for how you would do it?

You: no, not really

📝 Question 3/14
...
```

### Severity Analysis

```bash
────────────────────────────────────────────────────────────
✓ ASSESSMENT COMPLETE: suicidality
Analyzing responses for severity...
────────────────────────────────────────────────────────────

============================================================
⚠️ SEVERITY ANALYSIS
Risk Type: suicidality
Severity: MEDIUM
Analysis: Client has ideation but no specific plan. Protective factors present including family support. Willing to engage in safety planning.
============================================================
```

## Understanding the Workflow

### Three-Agent System

1. **Amanda (Temperature: 0.7)**
   - Main therapist
   - Empathetic, warm responses
   - Conducts therapeutic conversation

2. **Supervisor (Temperature: 0.3)**
   - Risk detector
   - Analyzes last 5 messages
   - Consistent, reliable detection

3. **Risk Assessor (Temperature: 0.2)**
   - Clinical assessment
   - Precise, structured questioning
   - Analyzes severity against clinical criteria

### Decision Points You'll See

1. **After every Amanda response** → Supervisor checks for risks
2. **When risk detected** → Mode switches to assessment
3. **During assessment** → Progress shown (Question X/Y)
4. **Assessment complete** → Severity analyzed
5. **Based on severity**:
   - **Low**: Return to normal conversation
   - **Medium**: Show resources, continue conversation
   - **High/Imminent**: Crisis intervention, end session

## Monitoring Data

### Event Log

All events are stored in memory and can be exported:

```python
# From Python code
monitor.export_to_file('session_log.json')
```

This creates a JSON file with:
- All events with timestamps
- Structured data for each event
- Summary statistics

### Event Structure

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "type": "risk_detected",
  "data": {
    "risk_types": ["suicidality"],
    "confidence": "high",
    "risk_queue": ["suicidality"]
  },
  "message": ""
}
```

## Performance Impact

- **With monitoring enabled**: Adds ~0.1ms per event (negligible)
- **Without monitoring**: Zero overhead (monitoring checks are `if self.monitor:`)
- **Color output**: No performance impact on modern terminals

## Customization

### Disable Console Output (Log Only)

```python
monitor = Monitor(verbose=True, log_to_console=False)
```

### Silent Mode (No Monitoring)

Just don't pass a monitor to the coordinator:

```python
coordinator = TherapeuticCoordinator(
    provider=provider,
    # No monitor parameter
)
```

## Troubleshooting

### Colors Not Showing

If colors don't appear in your terminal:
- Windows: Use Windows Terminal or enable ANSI colors
- Linux/Mac: Should work by default
- SSH: May need to set `TERM=xterm-256color`

### Too Much Output

The monitoring system is verbose by design for explainability. If it's overwhelming:
- Run without `--monitor` for normal operation
- Pipe output: `python main.py --monitor 2>/dev/null` (hides monitoring, keeps Amanda)
- Use session logs instead of real-time monitoring

## Use Cases

### Development & Debugging

```bash
python main.py --monitor --user-id test_user
```

Perfect for:
- Understanding the workflow
- Debugging risk detection
- Testing mode switches
- Validating severity analysis

### Demo & Training

```bash
python main.py --monitor --user-id demo
```

Great for:
- Showing how the system works
- Training therapists on the workflow
- Demonstrating safety features
- Explaining AI decision-making

### Production Testing

```bash
python main.py --monitor --user-id qa_test > test_log.txt 2>&1
```

Use for:
- QA testing
- Regression testing
- Performance validation
- Audit trails

## Production Deployment

**Do NOT enable monitoring in production web servers** - it's designed for CLI testing and debugging. For production:

1. Use structured logging instead
2. Log to files, not console
3. Use log aggregation (e.g., ELK stack)
4. Monitor via application metrics

## Future Enhancements

Planned improvements:
- [ ] Web dashboard for real-time monitoring
- [ ] Historical event analysis
- [ ] Risk detection accuracy metrics
- [ ] Performance profiling integration
- [ ] Alert system for concerning patterns
- [ ] Export to various formats (CSV, Excel)

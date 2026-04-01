#!/usr/bin/env python
"""
Amanda Admin Dashboard - Real-time Chat Monitoring + Study Session Management

Features:
- View real-time chat transcripts organized by user email and chat ID
- Update study users' session number
- Update last_session_date for automation
- See current study assignments
- Works both as a standalone app and as a Flask blueprint
"""

from pathlib import Path
from datetime import datetime
import re
import yaml

from flask import Flask, Blueprint, render_template_string, jsonify, request

# Blueprint for use inside the main backend
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Standalone app (for running independently)
app = Flask(__name__)

# Paths
MONITORING_LOGS = Path(__file__).parent / "monitoring_logs"
PROJECT_ASSIGNMENTS_PATH = Path(__file__).parent / "config" / "project_assignments.yaml"


# ============================================================
# HELPERS
# ============================================================

def load_project_assignments():
    """Load study assignments YAML."""
    if not PROJECT_ASSIGNMENTS_PATH.exists():
        return {"users": {}}

    with open(PROJECT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {"users": {}}


def save_project_assignments(data):
    """Save study assignments YAML."""
    PROJECT_ASSIGNMENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PROJECT_ASSIGNMENTS_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)


def list_monitoring_users():
    """List all monitoring-log user folders."""
    if not MONITORING_LOGS.exists():
        return []

    users = [d.name for d in MONITORING_LOGS.iterdir() if d.is_dir()]
    return sorted(users)


def list_user_chats(user_email):
    """Get all chats for a user from monitoring logs."""
    user_dir = MONITORING_LOGS / user_email

    if not user_dir.exists():
        return []

    chats = []
    for chat_dir in user_dir.iterdir():
        if chat_dir.is_dir() and chat_dir.name.startswith('chat_'):
            # Parse folder name: chat_{id}_{title}_{date}
            parts = chat_dir.name.split('_', 3)
            chat_id = parts[1] if len(parts) > 1 else 'unknown'

            if len(parts) > 3:
                rest = parts[3]
                date_match = re.search(r'(\d{8})$', rest)
                if date_match:
                    date_str = date_match.group(1)
                    title = rest[:date_match.start()].strip('_')
                else:
                    date_str = 'unknown'
                    title = rest
            else:
                title = parts[2] if len(parts) > 2 else 'Untitled'
                date_str = parts[3] if len(parts) > 3 else 'unknown'

            try:
                if len(date_str) == 8:
                    formatted_date = f"{date_str[0:4]}-{date_str[4:6]}-{date_str[6:8]}"
                else:
                    formatted_date = date_str
            except Exception:
                formatted_date = date_str

            chats.append({
                "path": chat_dir.name,
                "chat_id": chat_id,
                "title": title,
                "date": formatted_date
            })

    chats.sort(key=lambda x: x["date"], reverse=True)
    return chats


def load_transcript_text(user_email, chat_path):
    """Load a transcript text file."""
    transcript_file = MONITORING_LOGS / user_email / chat_path / "transcript.txt"

    if not transcript_file.exists():
        return None

    with open(transcript_file, "r", encoding="utf-8") as f:
        return f.read()


# ============================================================
# DASHBOARD HTML
# ============================================================

DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amanda Admin Dashboard - Chat Monitoring</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { opacity: 0.9; }

        .controls, .study-panel {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .controls select,
        .controls button,
        .study-panel input,
        .study-panel select,
        .study-panel button {
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid #ddd;
            font-size: 14px;
            margin-right: 10px;
            margin-bottom: 10px;
        }

        .controls select {
            min-width: 250px;
        }

        .controls button,
        .study-panel button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
        }
        .controls button:hover,
        .study-panel button:hover {
            background: #5568d3;
        }

        .study-panel h2 {
            margin-bottom: 12px;
            color: #333;
        }

        .study-panel .subtext {
            margin-bottom: 15px;
            color: #666;
            font-size: 14px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .stat-card .label { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .stat-card .value { font-size: 24px; font-weight: bold; color: #333; }

        .transcript-container, .assignment-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            overflow: hidden;
            margin-bottom: 20px;
        }
        .transcript-header, .assignment-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e0e0e0;
            font-weight: 600;
        }
        .transcript-content {
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.8;
            white-space: pre-wrap;
        }

        .assignment-content {
            padding: 20px;
            overflow-x: auto;
        }

        .assignment-table {
            width: 100%;
            border-collapse: collapse;
        }
        .assignment-table th,
        .assignment-table td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .assignment-table th {
            background: #fafafa;
            font-weight: 600;
        }

        .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }

        .highlight-user {
            background: #fff3cd;
            padding: 2px 4px;
            border-radius: 3px;
        }

        .highlight-amanda {
            background: #d1ecf1;
            padding: 2px 4px;
            border-radius: 3px;
        }

        .highlight-system {
            background: #e2e3e5;
            padding: 2px 4px;
            border-radius: 3px;
            color: #666;
        }

        .success-message {
            color: #155724;
            background: #d4edda;
            padding: 10px 12px;
            border-radius: 6px;
            margin-top: 10px;
            display: none;
        }

        .error-message {
            color: #721c24;
            background: #f8d7da;
            padding: 10px 12px;
            border-radius: 6px;
            margin-top: 10px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Amanda Admin Dashboard</h1>
        <p>Real-time chat transcript monitoring + study session management</p>
    </div>

    <div class="study-panel">
        <h2>Study User Management</h2>
        <p class="subtext">
            Update a user's session assignment and session start date without touching the database.
        </p>

        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">User Email</label>
            <input id="studyEmail" type="email" placeholder="user@example.com" style="width:100%; max-width:400px;">
        </div>

        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">Session Number</label>
            <select id="studySession" style="width:100%; max-width:220px;">
                <option value="1">Session 1</option>
                <option value="2">Session 2</option>
                <option value="3">Session 3</option>
                <option value="4">Session 4</option>
                <option value="5">Session 5</option>
                <option value="6">Session 6</option>
            </select>
        </div>

        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">Last Session Date</label>
            <input id="lastSessionDate" type="date" style="width:100%; max-width:220px;">
        </div>

        <button onclick="updateStudyUser()">💾 Update Study User</button>
        <button onclick="loadAssignments()">🔄 Refresh Assignments</button>

        <div id="studySuccess" class="success-message"></div>
        <div id="studyError" class="error-message"></div>
    </div>

    <div class="assignment-container">
        <div class="assignment-header">Current Study Assignments</div>
        <div class="assignment-content">
            <table class="assignment-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Project</th>
                        <th>Session</th>
                        <th>Last Session Date</th>
                    </tr>
                </thead>
                <tbody id="assignmentsTableBody">
                    <tr><td colspan="4">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="controls">
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Select User:</label>
            <select id="userSelect" style="width: 100%; max-width: 400px;">
                <option value="">Select a user email...</option>
            </select>
        </div>

        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Select Chat:</label>
            <select id="chatSelect" style="width: 100%; max-width: 400px;">
                <option value="">Select a chat...</option>
            </select>
        </div>

        <button onclick="refreshTranscript()">🔄 Refresh Transcript</button>
        <button onclick="toggleAutoRefresh()" id="autoRefreshBtn">⚡ Auto-refresh (5s)</button>
        <button onclick="downloadTranscript()">💾 Download</button>
    </div>

    <div class="stats" id="stats" style="display: none;">
        <div class="stat-card">
            <div class="label">Total Chats</div>
            <div class="value" id="totalChats">0</div>
        </div>
        <div class="stat-card">
            <div class="label">Selected User</div>
            <div class="value" id="selectedUser" style="font-size: 16px;">-</div>
        </div>
        <div class="stat-card">
            <div class="label">Chat ID</div>
            <div class="value" id="selectedChat" style="font-size: 16px;">-</div>
        </div>
        <div class="stat-card">
            <div class="label">Last Update</div>
            <div class="value" id="lastUpdate" style="font-size: 16px;">-</div>
        </div>
    </div>

    <div class="transcript-container">
        <div class="transcript-header">
            <span id="transcriptTitle">Chat Transcript</span>
        </div>
        <div class="transcript-content" id="transcriptContent">
            <div class="no-data">
                <h3>📋 Select a user and chat to view real-time transcripts</h3>
                <p style="margin-top: 10px;">Transcripts are organized by user email and chat ID</p>
                <p style="margin-top: 5px; font-size: 12px; color: #999;">Updates in real-time as users chat with Amanda</p>
            </div>
        </div>
    </div>

    <script>
        let autoRefreshInterval = null;
        let currentUser = '';
        let currentChat = '';

        function showSuccess(message) {
            const successEl = document.getElementById('studySuccess');
            const errorEl = document.getElementById('studyError');
            errorEl.style.display = 'none';
            successEl.textContent = message;
            successEl.style.display = 'block';
        }

        function showError(message) {
            const successEl = document.getElementById('studySuccess');
            const errorEl = document.getElementById('studyError');
            successEl.style.display = 'none';
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }

        async function loadAssignments() {
            try {
                const response = await fetch('api/study-assignments');
                const data = await response.json();
                const tbody = document.getElementById('assignmentsTableBody');
                tbody.innerHTML = '';

                const users = data.users || {};

                if (Object.keys(users).length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4">No study users configured</td></tr>';
                    return;
                }

                Object.entries(users).forEach(([email, config]) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${email}</td>
                        <td>${config.project_key || '-'}</td>
                        <td>${config.session_number || '-'}</td>
                        <td>${config.last_session_date || '-'}</td>
                    `;
                    tbody.appendChild(row);
                });
            } catch (error) {
                console.error('Error loading assignments:', error);
                showError('Failed to load study assignments');
            }
        }

        async function updateStudyUser() {
            const email = document.getElementById('studyEmail').value.trim();
            const sessionNumber = parseInt(document.getElementById('studySession').value, 10);
            const lastSessionDate = document.getElementById('lastSessionDate').value;

            if (!email) {
                showError('Please enter a user email');
                return;
            }

            if (!sessionNumber || sessionNumber < 1 || sessionNumber > 6) {
                showError('Session number must be between 1 and 6');
                return;
            }

            try {
                const response = await fetch('api/study-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        session_number: sessionNumber,
                        last_session_date: lastSessionDate
                    })
                });

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    const raw = await response.text();
                    throw new Error('Non-JSON response received: ' + raw.slice(0, 120));
                }

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to update user');
                }

                showSuccess(`Updated ${email} to session ${sessionNumber}`);
                loadAssignments();
            } catch (error) {
                console.error('Error updating study user:', error);
                showError(error.message || 'Failed to update study user');
            }
        }

        async function loadUsers() {
            try {
                const response = await fetch('api/users');
                const users = await response.json();
                const select = document.getElementById('userSelect');
                select.innerHTML = '<option value="">Select a user email...</option>';
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user;
                    option.textContent = user;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }

        async function loadChats(userEmail) {
            try {
                const response = await fetch(`api/chats/${encodeURIComponent(userEmail)}`);
                const chats = await response.json();
                const select = document.getElementById('chatSelect');
                select.innerHTML = '<option value="">Select a chat...</option>';

                document.getElementById('totalChats').textContent = chats.length;

                chats.forEach(chat => {
                    const option = document.createElement('option');
                    option.value = chat.path;
                    option.textContent = `${chat.chat_id} - ${chat.title} (${chat.date})`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        }

        async function loadTranscript(userEmail, chatPath) {
            try {
                const response = await fetch(`api/transcript/${encodeURIComponent(userEmail)}/${encodeURIComponent(chatPath)}`);
                const data = await response.json();

                const contentDiv = document.getElementById('transcriptContent');

                if (data.transcript) {
                    let highlightedText = data.transcript
                        .replace(/\\[([^\\]]+)\\] USER:/g, '<span class="highlight-user">[$1] USER:</span>')
                        .replace(/\\[([^\\]]+)\\] AMANDA:/g, '<span class="highlight-amanda">[$1] AMANDA:</span>')
                        .replace(/\\[([^\\]]+)\\] (AGENT|SUPERVISOR|RISK|MODE|ASSESSMENT):/g, '<span class="highlight-system">[$1] $2:</span>');

                    contentDiv.innerHTML = highlightedText;
                    contentDiv.scrollTop = contentDiv.scrollHeight;

                    document.getElementById('selectedUser').textContent = userEmail.split('@')[0];
                    document.getElementById('selectedChat').textContent = chatPath.split('_')[1] || '-';
                    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
                    document.getElementById('stats').style.display = 'grid';

                    document.getElementById('transcriptTitle').textContent = `Chat Transcript: ${chatPath}`;
                } else {
                    contentDiv.innerHTML = '<div class="no-data"><h3>No transcript available yet</h3><p>Transcript will appear here as the conversation progresses</p></div>';
                }
            } catch (error) {
                console.error('Error loading transcript:', error);
                document.getElementById('transcriptContent').innerHTML =
                    '<div class="no-data"><h3>Error loading transcript</h3><p>' + error.message + '</p></div>';
            }
        }

        function refreshTranscript() {
            if (currentUser && currentChat) {
                loadTranscript(currentUser, currentChat);
            }
        }

        function toggleAutoRefresh() {
            const btn = document.getElementById('autoRefreshBtn');
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
                btn.textContent = '⚡ Auto-refresh (5s)';
                btn.style.background = '#667eea';
            } else {
                autoRefreshInterval = setInterval(refreshTranscript, 5000);
                btn.textContent = '⏸ Stop Auto-refresh';
                btn.style.background = '#dc3545';
            }
        }

        function downloadTranscript() {
            if (!currentUser || !currentChat) {
                alert('Please select a user and chat first');
                return;
            }

            const content = document.getElementById('transcriptContent').textContent;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transcript_${currentUser}_${currentChat}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        document.getElementById('userSelect').addEventListener('change', (e) => {
            currentUser = e.target.value;
            if (currentUser) {
                loadChats(currentUser);
            } else {
                document.getElementById('chatSelect').innerHTML = '<option value="">Select a chat...</option>';
            }
        });

        document.getElementById('chatSelect').addEventListener('change', (e) => {
            currentChat = e.target.value;
            if (currentUser && currentChat) {
                loadTranscript(currentUser, currentChat);
            }
        });

        loadUsers();
        loadAssignments();
    </script>
</body>
</html>
"""


# ============================================================
# CORE VIEW FUNCTIONS
# ============================================================

def dashboard_index():
    return render_template_string(DASHBOARD_TEMPLATE)


def dashboard_get_users():
    return jsonify(list_monitoring_users())


def dashboard_get_chats(user_email):
    return jsonify(list_user_chats(user_email))


def dashboard_get_transcript(user_email, chat_path):
    try:
        transcript = load_transcript_text(user_email, chat_path)
        return jsonify({'transcript': transcript})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def dashboard_get_study_assignments():
    try:
        data = load_project_assignments()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


def dashboard_update_study_user():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip()
        session_number = int(data.get("session_number", 1))
        last_session_date = (data.get("last_session_date") or "").strip()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        if session_number < 1 or session_number > 6:
            return jsonify({
                "success": False,
                "message": "Session number must be between 1 and 6"
            }), 400

        config = load_project_assignments()
        config.setdefault("users", {})
        config["users"].setdefault(email, {})

        config["users"][email]["project_key"] = config["users"][email].get("project_key", "romanian_adhd_parents")
        config["users"][email]["session_number"] = session_number

        if last_session_date:
            config["users"][email]["last_session_date"] = last_session_date
        else:
            config["users"][email]["last_session_date"] = datetime.now().strftime("%Y-%m-%d")

        save_project_assignments(config)

        return jsonify({
            "success": True,
            "message": f"Updated {email}",
            "user": config["users"][email]
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ============================================================
# BLUEPRINT ROUTES
# These become /admin/... because of url_prefix='/admin'
# ============================================================

@admin_bp.route('/')
@admin_bp.route('')
def admin_index():
    return dashboard_index()


@admin_bp.route('/api/users')
def admin_get_users():
    return dashboard_get_users()


@admin_bp.route('/api/chats/<path:user_email>')
def admin_get_chats(user_email):
    return dashboard_get_chats(user_email)


@admin_bp.route('/api/transcript/<path:user_email>/<path:chat_path>')
def admin_get_transcript(user_email, chat_path):
    return dashboard_get_transcript(user_email, chat_path)


@admin_bp.route('/api/study-assignments', methods=['GET'])
def admin_get_study_assignments():
    return dashboard_get_study_assignments()


@admin_bp.route('/api/study-user', methods=['POST'])
def admin_update_study_user():
    return dashboard_update_study_user()


# ============================================================
# STANDALONE APP ROUTES
# These stay /api/... for localhost:5001
# ============================================================

@app.route('/')
def index():
    return dashboard_index()


@app.route('/api/users')
def get_users():
    return dashboard_get_users()


@app.route('/api/chats/<path:user_email>')
def get_chats(user_email):
    return dashboard_get_chats(user_email)


@app.route('/api/transcript/<path:user_email>/<path:chat_path>')
def get_transcript(user_email, chat_path):
    return dashboard_get_transcript(user_email, chat_path)


@app.route('/api/study-assignments', methods=['GET'])
def get_study_assignments():
    return dashboard_get_study_assignments()


@app.route('/api/study-user', methods=['POST'])
def update_study_user():
    return dashboard_update_study_user()


# ============================================================
# MAIN
# ============================================================

def main(port=5001):
    """Start the admin dashboard."""
    print("=" * 60)
    print("Amanda Admin Dashboard - Real-time Chat Monitoring")
    print("=" * 60)
    print(f"Dashboard URL: http://localhost:{port}")
    print("=" * 60)
    print(f"Monitoring logs: {MONITORING_LOGS}")
    print(f"Project assignments: {PROJECT_ASSIGNMENTS_PATH}")
    print("Dashboard shows real-time chat transcripts and study session controls")
    print("Press Ctrl+C to stop")
    print("=" * 60)

    app.run(host='0.0.0.0', port=port, debug=False)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="Amanda Admin Dashboard")
    parser.add_argument('--port', type=int, default=5001, help="Port to run dashboard on")
    args = parser.parse_args()

    main(port=args.port)
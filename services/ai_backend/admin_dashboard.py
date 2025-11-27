#!/usr/bin/env python
"""
Amanda Admin Dashboard - Real-time Chat Monitoring

View real-time chat transcripts organized by user email and chat ID.
"""
import json
import sys
from pathlib import Path
from datetime import datetime
from flask import Flask, render_template_string, jsonify, request

app = Flask(__name__)

# Get monitoring logs path
MONITORING_LOGS = Path(__file__).parent / "monitoring_logs"

# Dashboard HTML template
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

        .controls {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .controls select, .controls button {
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
        .controls button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
        }
        .controls button:hover { background: #5568d3; }

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

        .transcript-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .transcript-header {
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

        .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }

        .chat-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .chat-item {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background 0.2s;
        }

        .chat-item:hover {
            background: #f8f9fa;
        }

        .chat-item.selected {
            background: #e3f2fd;
            border-left: 3px solid #667eea;
        }

        .chat-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }

        .chat-meta {
            font-size: 12px;
            color: #666;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Amanda Admin Dashboard</h1>
        <p>Real-time chat transcript monitoring - organized by user and chat</p>
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

        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
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
                const response = await fetch(`/api/chats/${encodeURIComponent(userEmail)}`);
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
                const response = await fetch(`/api/transcript/${encodeURIComponent(userEmail)}/${encodeURIComponent(chatPath)}`);
                const data = await response.json();

                const contentDiv = document.getElementById('transcriptContent');

                if (data.transcript) {
                    // Apply syntax highlighting
                    let highlightedText = data.transcript
                        .replace(/\[([^\]]+)\] USER:/g, '<span class="highlight-user">[$1] USER:</span>')
                        .replace(/\[([^\]]+)\] AMANDA:/g, '<span class="highlight-amanda">[$1] AMANDA:</span>')
                        .replace(/\[([^\]]+)\] (AGENT|SUPERVISOR|RISK|MODE|ASSESSMENT):/g, '<span class="highlight-system">[$1] $2:</span>');

                    contentDiv.innerHTML = highlightedText;

                    // Auto-scroll to bottom
                    contentDiv.scrollTop = contentDiv.scrollHeight;

                    // Update stats
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
                document.getElementById('transcriptContent').innerHTML = '<div class="no-data"><h3>Error loading transcript</h3><p>' + error.message + '</p></div>';
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

        // Load users on page load
        loadUsers();
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    """Dashboard homepage."""
    return render_template_string(DASHBOARD_TEMPLATE)


@app.route('/api/users')
def get_users():
    """Get list of all users (email-based folders)."""
    if not MONITORING_LOGS.exists():
        return jsonify([])

    users = []
    for user_dir in MONITORING_LOGS.iterdir():
        if user_dir.is_dir():
            users.append(user_dir.name)

    return jsonify(sorted(users))


@app.route('/api/chats/<path:user_email>')
def get_chats(user_email):
    """Get all chats for a user."""
    user_dir = MONITORING_LOGS / user_email

    if not user_dir.exists():
        return jsonify([])

    chats = []
    for chat_dir in user_dir.iterdir():
        if chat_dir.is_dir() and chat_dir.name.startswith('chat_'):
            # Parse chat folder name: chat_{id}_{title}_{date}
            parts = chat_dir.name.split('_', 3)
            chat_id = parts[1] if len(parts) > 1 else 'unknown'

            # Extract title and date
            if len(parts) > 3:
                rest = parts[3]
                # Try to find date pattern at the end
                import re
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

            # Format date
            try:
                if len(date_str) == 8:
                    formatted_date = f"{date_str[0:4]}-{date_str[4:6]}-{date_str[6:8]}"
                else:
                    formatted_date = date_str
            except:
                formatted_date = date_str

            chats.append({
                'path': chat_dir.name,
                'chat_id': chat_id,
                'title': title,
                'date': formatted_date
            })

    # Sort by date (newest first)
    chats.sort(key=lambda x: x['date'], reverse=True)

    return jsonify(chats)


@app.route('/api/transcript/<path:user_email>/<path:chat_path>')
def get_transcript(user_email, chat_path):
    """Get transcript for a specific chat."""
    transcript_file = MONITORING_LOGS / user_email / chat_path / "transcript.txt"

    if not transcript_file.exists():
        return jsonify({'transcript': None})

    try:
        with open(transcript_file, 'r', encoding='utf-8') as f:
            transcript = f.read()

        return jsonify({'transcript': transcript})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def main(port=5001):
    """Start the admin dashboard."""
    print("=" * 60)
    print("Amanda Admin Dashboard - Real-time Chat Monitoring")
    print("=" * 60)
    print(f"Dashboard URL: http://localhost:{port}")
    print("=" * 60)
    print(f"\nMonitoring logs: {MONITORING_LOGS}")
    print("Folder structure: monitoring_logs/{email}/chat_{id}_{title}_{date}/")
    print("\nDashboard shows real-time chat transcripts as they happen")
    print("\nPress Ctrl+C to stop")
    print("=" * 60)

    app.run(host='0.0.0.0', port=port, debug=False)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Amanda Admin Dashboard")
    parser.add_argument('--port', type=int, default=5001, help="Port to run dashboard on")
    args = parser.parse_args()

    main(port=args.port)

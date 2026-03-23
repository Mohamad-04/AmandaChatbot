import re
from pathlib import Path
from flask import Blueprint, render_template_string, jsonify

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

MONITORING_LOGS = Path(__file__).parent.parent.parent / "ai_backend" / "monitoring_logs"

DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amanda Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .controls { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .controls select, .controls button { padding: 10px 15px; border-radius: 5px; border: 1px solid #ddd; font-size: 14px; margin-right: 10px; margin-bottom: 10px; }
        .controls select { min-width: 250px; }
        .controls button { background: #667eea; color: white; border: none; cursor: pointer; }
        .controls button:hover { background: #5568d3; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .stat-card .label { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .stat-card .value { font-size: 24px; font-weight: bold; color: #333; }
        .transcript-container { background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
        .transcript-header { background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #e0e0e0; font-weight: 600; }
        .transcript-content { padding: 20px; max-height: 600px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.8; white-space: pre-wrap; }
        .no-data { text-align: center; padding: 60px 20px; color: #999; }
        .highlight-user { background: #fff3cd; padding: 2px 4px; border-radius: 3px; }
        .highlight-amanda { background: #d1ecf1; padding: 2px 4px; border-radius: 3px; }
        .highlight-system { background: #e2e3e5; padding: 2px 4px; border-radius: 3px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Amanda Admin Dashboard</h1>
        <p>Real-time chat transcript monitoring</p>
    </div>
    <div class="controls">
        <div style="margin-bottom: 15px;">
            <label style="display:block;margin-bottom:5px;font-weight:600;">Select User:</label>
            <select id="userSelect" style="width:100%;max-width:400px;">
                <option value="">Select a user email...</option>
            </select>
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display:block;margin-bottom:5px;font-weight:600;">Select Chat:</label>
            <select id="chatSelect" style="width:100%;max-width:400px;">
                <option value="">Select a chat...</option>
            </select>
        </div>
        <button onclick="refreshTranscript()">Refresh</button>
        <button onclick="toggleAutoRefresh()" id="autoRefreshBtn">Auto-refresh (5s)</button>
        <button onclick="downloadTranscript()">Download</button>
    </div>
    <div class="stats" id="stats" style="display:none;">
        <div class="stat-card"><div class="label">Total Chats</div><div class="value" id="totalChats">0</div></div>
        <div class="stat-card"><div class="label">Selected User</div><div class="value" id="selectedUser" style="font-size:16px;">-</div></div>
        <div class="stat-card"><div class="label">Last Update</div><div class="value" id="lastUpdate" style="font-size:16px;">-</div></div>
    </div>
    <div class="transcript-container">
        <div class="transcript-header"><span id="transcriptTitle">Chat Transcript</span></div>
        <div class="transcript-content" id="transcriptContent">
            <div class="no-data"><h3>Select a user and chat to view transcripts</h3></div>
        </div>
    </div>
    <script>
        let autoRefreshInterval = null, currentUser = '', currentChat = '';

        async function loadUsers() {
            const r = await fetch('/admin/api/users');
            const users = await r.json();
            const sel = document.getElementById('userSelect');
            sel.innerHTML = '<option value="">Select a user email...</option>';
            users.forEach(u => { const o = document.createElement('option'); o.value = o.textContent = u; sel.appendChild(o); });
        }

        async function loadChats(email) {
            const r = await fetch('/admin/api/chats/' + encodeURIComponent(email));
            const chats = await r.json();
            const sel = document.getElementById('chatSelect');
            sel.innerHTML = '<option value="">Select a chat...</option>';
            document.getElementById('totalChats').textContent = chats.length;
            chats.forEach(c => { const o = document.createElement('option'); o.value = c.path; o.textContent = c.chat_id + ' - ' + c.title + ' (' + c.date + ')'; sel.appendChild(o); });
        }

        async function loadTranscript(email, chatPath) {
            const r = await fetch('/admin/api/transcript/' + encodeURIComponent(email) + '/' + encodeURIComponent(chatPath));
            const data = await r.json();
            const div = document.getElementById('transcriptContent');
            if (data.transcript) {
                div.innerHTML = data.transcript
                    .replace(/\\[([^\\]]+)\\] USER:/g, '<span class="highlight-user">[$1] USER:</span>')
                    .replace(/\\[([^\\]]+)\\] AMANDA:/g, '<span class="highlight-amanda">[$1] AMANDA:</span>')
                    .replace(/\\[([^\\]]+)\\] (AGENT|SUPERVISOR|RISK|MODE|ASSESSMENT):/g, '<span class="highlight-system">[$1] $2:</span>');
                div.scrollTop = div.scrollHeight;
                document.getElementById('selectedUser').textContent = email.split('@')[0];
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
                document.getElementById('stats').style.display = 'grid';
                document.getElementById('transcriptTitle').textContent = 'Transcript: ' + chatPath;
            } else {
                div.innerHTML = '<div class="no-data"><h3>No transcript available yet</h3></div>';
            }
        }

        function refreshTranscript() { if (currentUser && currentChat) loadTranscript(currentUser, currentChat); }

        function toggleAutoRefresh() {
            const btn = document.getElementById('autoRefreshBtn');
            if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; btn.textContent = 'Auto-refresh (5s)'; btn.style.background = '#667eea'; }
            else { autoRefreshInterval = setInterval(refreshTranscript, 5000); btn.textContent = 'Stop Auto-refresh'; btn.style.background = '#dc3545'; }
        }

        function downloadTranscript() {
            if (!currentUser || !currentChat) { alert('Select a user and chat first'); return; }
            const blob = new Blob([document.getElementById('transcriptContent').textContent], { type: 'text/plain' });
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'transcript_' + currentUser + '_' + currentChat + '.txt' });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }

        document.getElementById('userSelect').addEventListener('change', e => { currentUser = e.target.value; if (currentUser) loadChats(currentUser); else document.getElementById('chatSelect').innerHTML = '<option value="">Select a chat...</option>'; });
        document.getElementById('chatSelect').addEventListener('change', e => { currentChat = e.target.value; if (currentUser && currentChat) loadTranscript(currentUser, currentChat); });

        loadUsers();
    </script>
</body>
</html>
"""


@admin_bp.route('/')
@admin_bp.route('')
def index():
    return render_template_string(DASHBOARD_TEMPLATE)


@admin_bp.route('/api/users')
def get_users():
    if not MONITORING_LOGS.exists():
        return jsonify([])
    return jsonify(sorted(d.name for d in MONITORING_LOGS.iterdir() if d.is_dir()))


@admin_bp.route('/api/chats/<path:user_email>')
def get_chats(user_email):
    user_dir = MONITORING_LOGS / user_email
    if not user_dir.exists():
        return jsonify([])
    chats = []
    for chat_dir in user_dir.iterdir():
        if chat_dir.is_dir() and chat_dir.name.startswith('chat_'):
            parts = chat_dir.name.split('_', 3)
            chat_id = parts[1] if len(parts) > 1 else 'unknown'
            if len(parts) > 3:
                rest = parts[3]
                m = re.search(r'(\d{8})$', rest)
                date_str = m.group(1) if m else 'unknown'
                title = rest[:m.start()].strip('_') if m else rest
            else:
                title = parts[2] if len(parts) > 2 else 'Untitled'
                date_str = 'unknown'
            try:
                formatted = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}" if len(date_str) == 8 else date_str
            except Exception:
                formatted = date_str
            chats.append({'path': chat_dir.name, 'chat_id': chat_id, 'title': title, 'date': formatted})
    chats.sort(key=lambda x: x['date'], reverse=True)
    return jsonify(chats)


@admin_bp.route('/api/transcript/<path:user_email>/<path:chat_path>')
def get_transcript(user_email, chat_path):
    f = MONITORING_LOGS / user_email / chat_path / "transcript.txt"
    if not f.exists():
        return jsonify({'transcript': None})
    try:
        return jsonify({'transcript': f.read_text(encoding='utf-8')})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

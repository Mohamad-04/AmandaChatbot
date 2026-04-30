"""
Admin API routes for the React admin dashboard.

All endpoints are admin-only and return real data from the database.

GET /api/admin/overview              — stats + chart data
GET /api/admin/users                 — user list with chat counts
GET /api/admin/conversations         — conversation list (optional ?user_id filter)
GET /api/admin/conversations/<id>/messages — messages for a single conversation
GET /api/admin/study-assignments     — all entries from project_assignments.yaml
POST /api/admin/study-user           — set a user's session assignment in the YAML
"""
from pathlib import Path
import yaml

from flask import Blueprint, jsonify, session, request
from database import db
from models.user import User
from models.chat import Chat
from models.message import Message
from datetime import datetime, timedelta
from sqlalchemy import func

ASSIGNMENTS_PATH = Path(__file__).resolve().parents[2] / "ai_backend" / "config" / "project_assignments.yaml"

admin_api_bp = Blueprint('admin_api', __name__, url_prefix='/api/admin')


def require_admin():
    """
    Check if the current session belongs to an admin user.
    Returns (user, error_response) — if error_response is not None, return it immediately.
    """
    user_id = session.get('user_id')
    if not user_id:
        return None, (jsonify({'success': False, 'message': 'Authentication required'}), 401)
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return None, (jsonify({'success': False, 'message': 'Admin access required'}), 403)
    return user, None


@admin_api_bp.route('/me', methods=['GET'])
def me():
    """
    Returns the currently logged-in admin's email and initials.

    Response JSON: { "email": str, "initials": str }
    """
    user, err = require_admin()
    if err:
        return err
    initials = user.email[:2].upper()
    return jsonify({'email': user.email, 'initials': initials}), 200


@admin_api_bp.route('/recent-activity', methods=['GET'])
def recent_activity():
    """
    Returns the most recent conversations that had a message in the last 24 hours.
    Up to 15 entries, sorted newest first.

    Response JSON: [{ "id": int, "user": str, "title": str, "timestamp": str, "preview": str }, ...]
    """
    _, err = require_admin()
    if err:
        return err

    try:
        since = datetime.utcnow() - timedelta(hours=24)

        # Latest message per chat in the last 24h
        latest_msg_subq = (
            db.session.query(
                Message.chat_id,
                func.max(Message.timestamp).label('latest')
            )
            .filter(Message.timestamp >= since)
            .group_by(Message.chat_id)
            .subquery()
        )

        rows = (
            db.session.query(Chat, Message)
            .join(latest_msg_subq, Chat.id == latest_msg_subq.c.chat_id)
            .join(Message, (Message.chat_id == Chat.id) & (Message.timestamp == latest_msg_subq.c.latest))
            .order_by(latest_msg_subq.c.latest.desc())
            .limit(15)
            .all()
        )

        result = []
        for chat, msg in rows:
            result.append({
                'id': chat.id,
                'user': chat.user.email if chat.user else 'Unknown',
                'title': chat.title,
                'timestamp': msg.timestamp.isoformat(),
                'preview': msg.content[:120],
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"Admin recent activity error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/overview', methods=['GET'])
def overview():
    """
    Returns stats and chart data for the OverviewPage.

    Response JSON:
    {
      "stats": {
        "total_users": int,
        "active_today": int,
        "total_conversations": int,
        "risk_alerts": int
      },
      "new_users_over_time": [{"date": "Mar 1", "users": 3}, ...],
      "message_breakdown": {"user_messages": int, "amanda_messages": int},
      "daily_conversations": [{"day": "Mon", "conversations": 12}, ...]
    }
    """
    _, err = require_admin()
    if err:
        return err

    try:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        total_users = User.query.count()
        active_today = User.query.filter(User.last_active_at >= today).count()
        total_conversations = Chat.query.count()

        # New users per day — last 30 days
        new_users_over_time = []
        for i in range(29, -1, -1):
            day_start = today - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            count = User.query.filter(
                User.created_at >= day_start,
                User.created_at < day_end
            ).count()
            new_users_over_time.append({
                'date': day_start.strftime('%b %d').replace(' 0', ' '),
                'users': count
            })

        # Message breakdown
        user_messages = Message.query.filter_by(role='user').count()
        amanda_messages = Message.query.filter_by(role='assistant').count()

        # Daily conversations — last 14 days
        daily_conversations = []
        for i in range(13, -1, -1):
            day_start = today - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            count = Chat.query.filter(
                Chat.created_at >= day_start,
                Chat.created_at < day_end
            ).count()
            daily_conversations.append({
                'day': day_start.strftime('%a'),
                'conversations': count
            })

        return jsonify({
            'stats': {
                'total_users': total_users,
                'active_today': active_today,
                'total_conversations': total_conversations,
                'risk_alerts': 0
            },
            'new_users_over_time': new_users_over_time,
            'message_breakdown': {
                'user_messages': user_messages,
                'amanda_messages': amanda_messages
            },
            'daily_conversations': daily_conversations
        }), 200

    except Exception as e:
        print(f"Admin overview error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/users', methods=['GET'])
def users():
    """
    Returns all users with chat counts and last active time.
    Supports optional query params:
      ?search=<email substring>
      ?filter=all|admin|verified

    Response JSON: array of user objects
    """
    _, err = require_admin()
    if err:
        return err

    try:
        search = request.args.get('search', '').strip()
        filter_type = request.args.get('filter', 'all')

        query = User.query

        if search:
            query = query.filter(User.email.ilike(f'%{search}%'))

        if filter_type == 'admin':
            query = query.filter_by(is_admin=True)
        elif filter_type == 'verified':
            query = query.filter_by(is_verified=True)

        all_users = query.order_by(User.created_at.desc()).all()

        result = []
        for user in all_users:
            total_chats = Chat.query.filter_by(user_id=user.id).count()
            result.append({
                'id': user.id,
                'email': user.email,
                'join_date': user.created_at.isoformat(),
                'total_chats': total_chats,
                'last_active': user.last_active_at.isoformat() if user.last_active_at else None,
                'is_admin': user.is_admin
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"Admin users error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/conversations', methods=['GET'])
def conversations():
    """
    Returns all conversations, optionally filtered by user_id.
    Supports optional query param: ?user_id=<int>

    Response JSON: array of conversation objects
    """
    _, err = require_admin()
    if err:
        return err

    try:
        user_id = request.args.get('user_id', type=int)

        query = Chat.query
        if user_id:
            query = query.filter_by(user_id=user_id)

        chats = query.order_by(Chat.created_at.desc()).all()

        result = []
        for chat in chats:
            message_count = Message.query.filter_by(chat_id=chat.id).count()
            result.append({
                'id': chat.id,
                'user': chat.user.email if chat.user else 'Unknown',
                'title': chat.title,
                'date': chat.created_at.isoformat(),
                'message_count': message_count
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"Admin conversations error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/conversations/<int:chat_id>/messages', methods=['GET'])
def conversation_messages(chat_id):
    """
    Returns all messages for a specific conversation.
    Maps role 'assistant' -> sender 'amanda', 'user' -> sender 'user'.

    Response JSON: array of message objects
    """
    _, err = require_admin()
    if err:
        return err

    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'success': False, 'message': 'Conversation not found'}), 404

        messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp).all()

        result = []
        for msg in messages:
            result.append({
                'id': msg.id,
                'content': msg.content,
                'sender': 'amanda' if msg.role == 'assistant' else 'user',
                'timestamp': msg.timestamp.isoformat()
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"Admin conversation messages error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/study-assignments', methods=['GET'])
def study_assignments():
    """
    Returns all entries from project_assignments.yaml as a flat list.

    Response JSON: [{ "email": str, "project_key": str, "session_number": int }, ...]
    """
    _, err = require_admin()
    if err:
        return err

    try:
        if not ASSIGNMENTS_PATH.exists():
            return jsonify([]), 200
        with open(ASSIGNMENTS_PATH, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f) or {}
        users = data.get('users') or {}
        result = [
            {
                'email': email,
                'project_key': cfg.get('project_key', ''),
                'session_number': cfg.get('session_number', 1),
            }
            for email, cfg in users.items()
        ]
        return jsonify(result), 200
    except Exception as e:
        print(f"Admin study assignments error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/study-user', methods=['POST'])
def study_user():
    """
    Create or update a participant's session assignment.

    Request JSON: { "email": str, "session_number": int }
    The project_key is always "romanian_adhd_parents".

    Response JSON: { "success": true }
    """
    _, err = require_admin()
    if err:
        return err

    try:
        body = request.get_json(force=True) or {}
        email = (body.get('email') or '').strip().lower()
        session_number = int(body.get('session_number', 1))

        if not email:
            return jsonify({'success': False, 'message': 'email is required'}), 400
        if session_number not in range(1, 7):
            return jsonify({'success': False, 'message': 'session_number must be 1–6'}), 400

        if ASSIGNMENTS_PATH.exists():
            with open(ASSIGNMENTS_PATH, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f) or {}
        else:
            data = {}

        if 'users' not in data or data['users'] is None:
            data['users'] = {}

        data['users'][email] = {
            'project_key': 'romanian_adhd_parents',
            'session_number': session_number,
        }

        ASSIGNMENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(ASSIGNMENTS_PATH, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True)

        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Admin study user error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@admin_api_bp.route('/study-user', methods=['DELETE'])
def delete_study_users():
    """
    Remove one or more participants from project_assignments.yaml.

    Request JSON: { "emails": [str, ...] }
    Response JSON: { "success": true, "removed": int }
    """
    _, err = require_admin()
    if err:
        return err

    try:
        body = request.get_json(force=True) or {}
        emails = [e.strip().lower() for e in (body.get('emails') or []) if e]

        if not emails:
            return jsonify({'success': False, 'message': 'emails list is required'}), 400

        if not ASSIGNMENTS_PATH.exists():
            return jsonify({'success': True, 'removed': 0}), 200

        with open(ASSIGNMENTS_PATH, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f) or {}

        users = data.get('users') or {}
        removed = sum(1 for e in emails if e in users)
        for e in emails:
            users.pop(e, None)
        data['users'] = users

        with open(ASSIGNMENTS_PATH, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True)

        return jsonify({'success': True, 'removed': removed}), 200
    except Exception as e:
        print(f"Admin delete study users error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'}), 500

"""
Admin API routes for the React admin dashboard.

All endpoints are admin-only and return real data from the database.

GET /api/admin/overview              — stats + chart data
GET /api/admin/users                 — user list with chat counts
GET /api/admin/conversations         — conversation list (optional ?user_id filter)
GET /api/admin/conversations/<id>/messages — messages for a single conversation
"""
from flask import Blueprint, jsonify, session, request
from database import db
from models.user import User
from models.chat import Chat
from models.message import Message
from datetime import datetime, timedelta
from sqlalchemy import func

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

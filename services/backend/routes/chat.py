"""
Chat management routes for Amanda.

Now supports:
- Romanian ADHD study ONLY for assigned users (via YAML)
- Normal Amanda for everyone else
"""

from pathlib import Path
import yaml

from flask import Blueprint, jsonify, session, request

from utils.auth import require_auth
from database import db
from models.chat import Chat
from models.message import Message
from models.user import User


chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


# ============================================================
# STUDY CONFIG
# ============================================================

STUDY_SESSIONS = {
    1: {
        "title": "Sesiunea 1 - Relația părinte-copil",
        "opening_message": "Bună, mă bucur că ești aici. 💛\n\nCum se simte perioada aceasta pentru tine ca părinte?"
    },
    2: {
        "title": "Sesiunea 2 - Laudă și comunicare",
        "opening_message": "Bine ai revenit. 💛\n\nCum a fost comunicarea cu copilul tău recent?"
    },
    3: {
        "title": "Sesiunea 3 - Rutine și conflict",
        "opening_message": "Mă bucur că ai revenit. 💛\n\nCând apar cel mai des conflictele acasă?"
    },
    4: {
        "title": "Sesiunea 4 - Stres parental",
        "opening_message": "Bun venit. 💛\n\nCe te stresează cel mai mult în rolul de părinte?"
    },
    5: {
        "title": "Sesiunea 5 - Presiune și vinovăție",
        "opening_message": "Bine ai revenit. 💛\n\nCând simți cel mai mult presiune sau vinovăție?"
    },
    6: {
        "title": "Sesiunea 6 - Reflecție finală",
        "opening_message": "Ultima sesiune 💛\n\nCe simți că s-a schimbat cel mai mult?"
    }
}


# ============================================================
# HELPERS
# ============================================================

def _get_current_user():
    user_id = session["user_id"]
    return db.session.get(User, user_id)


def _get_current_user_email():
    user = _get_current_user()
    return getattr(user, "email", None) if user else None


def _get_assignments():
    path = Path(__file__).resolve().parents[2] / "ai_backend" / "config" / "project_assignments.yaml"
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _get_user_study_config(email):
    """
    Returns:
        None → normal user
        dict → { project_key, session_number }
    """
    data = _get_assignments()
    return (data.get("users") or {}).get(email)


# ============================================================
# LIST CHATS
# ============================================================

@chat_bp.route('/list', methods=['GET'])
@require_auth
def list_chats():
    try:
        user_id = session["user_id"]
        chats = Chat.query.filter_by(user_id=user_id).all()

        chat_list = [chat.to_dict() for chat in chats]
        chat_list.sort(key=lambda x: x["last_message_time"], reverse=True)

        return jsonify({"success": True, "chats": chat_list}), 200

    except Exception as e:
        print(f"List chats error: {e}")
        return jsonify({"success": False}), 500


# ============================================================
# CREATE CHAT
# ============================================================

@chat_bp.route('/create', methods=['POST'])
@require_auth
def create_chat():
    try:
        user_id = session["user_id"]
        email = _get_current_user_email()

        study_cfg = _get_user_study_config(email)

        # ====================================================
        # 🔹 CASE 1: NORMAL USER
        # ====================================================
        if not study_cfg:
            chat = Chat(user_id=user_id, title="New Chat")
            db.session.add(chat)
            db.session.commit()

            return jsonify({
                "success": True,
                "chat_id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at.isoformat()
            }), 201

        # ====================================================
        # 🔹 CASE 2: STUDY USER
        # ====================================================
        session_number = int(study_cfg.get("session_number", 1))
        session_cfg = STUDY_SESSIONS.get(session_number, STUDY_SESSIONS[1])

        chat = Chat(
            user_id=user_id,
            title=session_cfg["title"]
        )

        db.session.add(chat)
        db.session.commit()

        # Amanda starts conversation
        opening_message = Message(
            chat_id=chat.id,
            role="assistant",
            content=session_cfg["opening_message"]
        )

        db.session.add(opening_message)
        db.session.commit()

        return jsonify({
            "success": True,
            "chat_id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "study_mode": True,
            "session_number": session_number
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Create chat error: {e}")
        return jsonify({"success": False}), 500


# ============================================================
# GET MESSAGES
# ============================================================

@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
@require_auth
def get_messages(chat_id):
    try:
        user_id = session["user_id"]
        chat = db.session.get(Chat, chat_id)

        if not chat:
            return jsonify({"success": False}), 404

        if chat.user_id != user_id:
            return jsonify({"success": False}), 403

        messages = (
            Message.query
            .filter_by(chat_id=chat_id)
            .order_by(Message.timestamp)
            .all()
        )

        return jsonify({
            "success": True,
            "messages": [msg.to_dict() for msg in messages]
        }), 200

    except Exception as e:
        print(f"Get messages error: {e}")
        return jsonify({"success": False}), 500


# ============================================================
# RENAME
# ============================================================

@chat_bp.route('/<int:chat_id>/rename', methods=['PUT'])
@require_auth
def rename_chat(chat_id):
    try:
        user_id = session["user_id"]
        chat = db.session.get(Chat, chat_id)

        if not chat or chat.user_id != user_id:
            return jsonify({"success": False}), 403

        data = request.get_json() or {}
        title = (data.get("title") or "").strip()

        if not title:
            return jsonify({"success": False}), 400

        chat.title = title
        db.session.commit()

        return jsonify({"success": True, "title": title}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Rename error: {e}")
        return jsonify({"success": False}), 500


# ============================================================
# DELETE
# ============================================================

@chat_bp.route('/<int:chat_id>', methods=['DELETE'])
@require_auth
def delete_chat(chat_id):
    try:
        user_id = session["user_id"]
        chat = db.session.get(Chat, chat_id)

        if not chat or chat.user_id != user_id:
            return jsonify({"success": False}), 403

        Message.query.filter_by(chat_id=chat_id).delete()
        db.session.delete(chat)
        db.session.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Delete error: {e}")
        return jsonify({"success": False}), 500
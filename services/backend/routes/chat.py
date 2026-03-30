"""
Chat management routes for Amanda.

Supports:
- Romanian ADHD study for assigned users via YAML
- Normal Amanda for everyone else
- Automatic weekly session progression for study users
"""

from pathlib import Path
from datetime import datetime
import yaml

from flask import Blueprint, jsonify, session, request

from utils.auth import require_auth
from database import db
from models.chat import Chat
from models.message import Message
from models.user import User


chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


# ============================================================
# STUDY SESSIONS
# ============================================================

STUDY_SESSIONS = {
    1: {
        "title": "Sesiunea 1 - Relația părinte-copil",
        "opening_message": (
            "Bună, mă bucur că ești aici. 💛\n\n"
            "Aceasta este prima noastră sesiune și vom începe prin a explora "
            "relația dintre tine și copilul tău.\n\n"
            "Aș vrea să începem simplu: cum se simte perioada aceasta pentru tine ca părinte?"
        )
    },
    2: {
        "title": "Sesiunea 2 - Laudă și comunicare",
        "opening_message": (
            "Bine ai revenit. 💛\n\n"
            "În sesiunea de azi ne vom concentra pe felul în care comunicarea, "
            "atenția pozitivă și lauda pot susține relația cu copilul tău.\n\n"
            "Care a fost un moment recent în care ți-a fost greu să comunici cu el?"
        )
    },
    3: {
        "title": "Sesiunea 3 - Rutine și conflict",
        "opening_message": (
            "Mă bucur că ai revenit. 💛\n\n"
            "În această sesiune ne uităm la conflicte, tranziții dificile și la felul în care "
            "rutinele pot reduce tensiunea de zi cu zi.\n\n"
            "În ce momente apar cel mai des conflictele acasă?"
        )
    },
    4: {
        "title": "Sesiunea 4 - Stres parental",
        "opening_message": (
            "Bun venit. 💛\n\n"
            "De această dată ne concentrăm mai mult pe tine și pe stresul pe care îl duci ca părinte.\n\n"
            "Care este partea cea mai obositoare sau copleșitoare pentru tine în perioada aceasta?"
        )
    },
    5: {
        "title": "Sesiunea 5 - Presiune și vinovăție",
        "opening_message": (
            "Bine ai revenit. 💛\n\n"
            "Astăzi ne uităm la presiune, vinovăție, așteptări și la cum poți avea mai multă grijă de tine.\n\n"
            "În ce situații simți cel mai mult că ești prea dură sau prea dur cu tine?"
        )
    },
    6: {
        "title": "Sesiunea 6 - Reflecție finală",
        "opening_message": (
            "Ultima sesiune 💛\n\n"
            "Azi aș vrea să reflectăm împreună la ce s-a schimbat, ce a fost util și ce ai vrea să păstrezi mai departe.\n\n"
            "Ce simți că s-a schimbat cel mai mult?"
        )
    }
}


# ============================================================
# HELPERS
# ============================================================

def _get_current_user():
    """Return current authenticated user model."""
    return db.session.get(User, session["user_id"])


def _get_current_user_email():
    """Return current authenticated user's email."""
    user = _get_current_user()
    return getattr(user, "email", None) if user else None


def _get_assignments_path() -> Path:
    """
    Path to:
    services/ai_backend/config/project_assignments.yaml
    """
    return Path(__file__).resolve().parents[2] / "ai_backend" / "config" / "project_assignments.yaml"


def _load_assignments():
    """Load study user assignments YAML."""
    path = _get_assignments_path()
    if not path.exists():
        return {"users": {}}

    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {"users": {}}


def _save_assignments(data):
    """Save study user assignments YAML."""
    path = _get_assignments_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)


def _get_user_study_config(email):
    """
    Returns:
        None -> normal user
        dict -> study config for that user
    """
    if not email:
        return None

    data = _load_assignments()
    return (data.get("users") or {}).get(email)


def _auto_progress_user_config(user_cfg: dict) -> dict:
    """
    Auto-progress session based on last_session_date.

    Logic:
    - session 1 starts at assigned last_session_date
    - every 7 days -> next session
    - capped at 6
    """
    if not user_cfg:
        return user_cfg

    session_number = int(user_cfg.get("session_number", 1))
    last_session_date = user_cfg.get("last_session_date")

    if not last_session_date:
        return user_cfg

    try:
        last_dt = datetime.strptime(last_session_date, "%Y-%m-%d")
        now_dt = datetime.now()
        days_elapsed = (now_dt - last_dt).days

        progressed_session = min(6, max(session_number, 1 + (days_elapsed // 7)))
        user_cfg["session_number"] = progressed_session
        return user_cfg
    except Exception as e:
        print(f"Auto progression error: {e}")
        return user_cfg


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

        return jsonify({
            "success": True,
            "chats": chat_list
        }), 200

    except Exception as e:
        print(f"List chats error: {e}")
        return jsonify({
            "success": False,
            "message": "An error occurred fetching chats"
        }), 500


# ============================================================
# CREATE CHAT
# ============================================================

@chat_bp.route('/create', methods=['POST'])
@require_auth
def create_chat():
    """
    Create a new chat.

    Behavior:
    - Normal users -> normal chat
    - Study users -> study session chat with Amanda opening message
    """
    try:
        user_id = session["user_id"]
        email = _get_current_user_email()

        study_cfg = _get_user_study_config(email)

        # ----------------------------------------------------
        # NORMAL USER
        # ----------------------------------------------------
        if not study_cfg:
            chat = Chat(user_id=user_id, title="New Chat")
            db.session.add(chat)
            db.session.commit()

            return jsonify({
                "success": True,
                "chat_id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at.isoformat(),
                "study_mode": False
            }), 201

        # ----------------------------------------------------
        # STUDY USER
        # ----------------------------------------------------
        study_cfg = _auto_progress_user_config(study_cfg)
        session_number = int(study_cfg.get("session_number", 1))
        session_cfg = STUDY_SESSIONS.get(session_number, STUDY_SESSIONS[1])

        chat = Chat(
            user_id=user_id,
            title=session_cfg["title"]
        )
        db.session.add(chat)
        db.session.commit()

        opening_message = Message(
            chat_id=chat.id,
            role="assistant",
            content=session_cfg["opening_message"]
        )
        db.session.add(opening_message)
        db.session.commit()

        # Save progressed session back if needed
        assignments = _load_assignments()
        if email in assignments.get("users", {}):
            assignments["users"][email].update(study_cfg)
            _save_assignments(assignments)

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
        return jsonify({
            "success": False,
            "message": "An error occurred creating chat"
        }), 500


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
            return jsonify({
                "success": False,
                "message": "Chat not found"
            }), 404

        if chat.user_id != user_id:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

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
        return jsonify({
            "success": False,
            "message": "An error occurred fetching messages"
        }), 500


# ============================================================
# RENAME CHAT
# ============================================================

@chat_bp.route('/<int:chat_id>/rename', methods=['PUT'])
@require_auth
def rename_chat(chat_id):
    try:
        user_id = session["user_id"]
        chat = db.session.get(Chat, chat_id)

        if not chat or chat.user_id != user_id:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        data = request.get_json() or {}
        title = (data.get("title") or "").strip()

        if not title:
            return jsonify({
                "success": False,
                "message": "Title cannot be empty"
            }), 400

        chat.title = title
        db.session.commit()

        return jsonify({
            "success": True,
            "title": title
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Rename error: {e}")
        return jsonify({
            "success": False,
            "message": "An error occurred renaming chat"
        }), 500


# ============================================================
# DELETE CHAT
# ============================================================

@chat_bp.route('/<int:chat_id>', methods=['DELETE'])
@require_auth
def delete_chat(chat_id):
    try:
        user_id = session["user_id"]
        chat = db.session.get(Chat, chat_id)

        if not chat or chat.user_id != user_id:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        Message.query.filter_by(chat_id=chat_id).delete()
        db.session.delete(chat)
        db.session.commit()

        return jsonify({
            "success": True
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Delete error: {e}")
        return jsonify({
            "success": False,
            "message": "An error occurred deleting chat"
        }), 500
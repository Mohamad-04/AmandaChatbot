"""
Temporary script to grant/revoke admin role.
Usage:
    python make_admin.py user@email.com        # grant admin
    python make_admin.py user@email.com revoke # revoke admin
"""
import sys
from app import create_app
from database import db
from sqlalchemy import text

if len(sys.argv) < 2:
    print('Usage: python make_admin.py user@email.com [revoke]')
    sys.exit(1)

email = sys.argv[1]
revoke = len(sys.argv) > 2 and sys.argv[2] == 'revoke'
value = 0 if revoke else 1

app, _ = create_app()
with app.app_context():
    try:
        db.session.execute(text('ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0'))
    except Exception:
        pass  # column already exists

    result = db.session.execute(text(f"UPDATE users SET is_admin = {value} WHERE email = '{email}'"))
    db.session.commit()

    if result.rowcount == 0:
        print(f'No user found with email: {email}')
    else:
        action = 'revoked' if revoke else 'granted'
        print(f'Admin {action} for {email}')

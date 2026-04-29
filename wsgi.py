"""
WSGI entry point for production deployment.
Used by gunicorn: gunicorn "wsgi:app" --worker-class gevent -w 1
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services', 'backend'))
# Set working directory to backend so relative paths (DB, sessions) resolve correctly
os.chdir(os.path.join(os.path.dirname(__file__), 'services', 'backend'))

from app import create_app  # noqa: E402

app, socketio = create_app()

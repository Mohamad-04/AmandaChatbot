web: gunicorn "wsgi:app" --worker-class gevent -w 1 --bind 0.0.0.0:$PORT --timeout 120
worker: python services/ai_backend/server.py

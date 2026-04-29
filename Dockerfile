FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2 and gevent
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY services/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY services/backend/ ./services/backend/

# Copy frontend source (served by Flask)
COPY services/frontend/ ./services/frontend/

# Copy admin dashboard build output (run `npm run build` in services/admin-dashboard first)
COPY services/admin-dashboard/dist/ ./services/admin-dashboard/dist/

# Copy WSGI entry point
COPY wsgi.py ./wsgi.py

EXPOSE 5000

CMD ["gunicorn", "wsgi:app", "--worker-class", "gevent", "-w", "1", "--bind", "0.0.0.0:5000", "--timeout", "120"]

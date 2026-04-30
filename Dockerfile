# Stage 1 — build the React admin dashboard
FROM node:20-slim AS admin-builder
WORKDIR /admin
COPY services/admin-dashboard/package.json services/admin-dashboard/package-lock.json ./
RUN npm ci
COPY services/admin-dashboard/ ./
RUN npm run build

# Stage 2 — Python runtime
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/backend/ ./services/backend/
COPY services/frontend/ ./services/frontend/
COPY --from=admin-builder /admin/dist/ ./services/admin-dashboard/dist/
COPY wsgi.py ./wsgi.py

EXPOSE 5000

CMD ["gunicorn", "wsgi:app", "--worker-class", "gevent", "-w", "1", "--bind", "0.0.0.0:5000", "--timeout", "120"]

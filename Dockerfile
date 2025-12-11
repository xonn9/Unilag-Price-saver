############################
# Backend service
# - Serves FastAPI at /api (port 8000)
# - Expects DATABASE_URL env (Postgres recommended)
############################

FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PATH="/app/.venv/bin:${PATH}"

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN python -m venv .venv && .venv/bin/pip install --upgrade pip && .venv/bin/pip install -r requirements.txt

# Copy app
COPY app app
COPY api api
# COPY vercel.json vercel.json

# Expose API port
EXPOSE 8000

# Start FastAPI (served at /api when fronted by a proxy)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


############################
# Frontend static build container (optional)
# If you want to serve static files from this image, uncomment the nginx stage below
############################
# FROM nginx:stable-alpine AS frontend
# COPY frontend /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

# To build only backend:
#   docker build -t price-saver-backend .
# To run:
#   docker run -p 8000:8000 -e DATABASE_URL=postgresql://user:pass@host:5432/db price-saver-backend


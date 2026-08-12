# Production image for the CyberSentinel backend.
#
# Two stages: build wheels with a compiler present, then copy them into a slim
# runtime that never ships build-essential. Keeps the final image small and
# removes the compiler from the attack surface.

# ── Stage 1: build dependency wheels ────────────────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt


# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=cybersentinel_backend.settings

# libgomp1 is required by scikit-learn's OpenMP runtime; curl backs the
# container healthcheck below.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-index --find-links=/wheels /wheels/* && rm -rf /wheels

# Run as an unprivileged user — a container process compromise should not have
# root inside the container.
RUN useradd --create-home --shell /usr/sbin/nologin --uid 1000 appuser

WORKDIR /app
COPY --chown=appuser:appuser . /app/

# Writable paths the app needs at runtime.
RUN mkdir -p /app/staticfiles /app/media /app/ml_models \
    && chown -R appuser:appuser /app/staticfiles /app/media /app/ml_models

USER appuser

# Static files are baked into the image so the container starts serving
# immediately. A dummy SECRET_KEY is fine here: collectstatic touches no
# secrets, and the real key arrives from the environment at runtime.
RUN SECRET_KEY=build-time-only DEBUG=False ALLOWED_HOSTS=localhost \
    python manage.py collectstatic --no-input

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/health/ || exit 1

# Daphne, not gunicorn: this app serves WebSockets through Django Channels, and
# a WSGI server would silently drop every one of them. Migrations are NOT run
# here — that belongs in a deploy step, so N replicas do not race each other.
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "cybersentinel_backend.asgi:application"]

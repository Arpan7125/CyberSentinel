# CyberSentinel

An AI-assisted cybersecurity platform: scan suspicious URLs, files, emails, SMS,
screenshots and phone numbers for threats, track live vulnerability intelligence,
and manage it all from a single dashboard.

A design principle runs through the whole codebase: **nothing fails silently, and
nothing is fabricated.** Every unconfigured integration produces a visible "not
configured" state rather than a fake success, and every verdict the platform shows
is either computed from real analysis or sourced from a named, linkable authority.
When an external feed can't be reached, the page says so instead of inventing data.

---

## Features

**Scanners** — each returns an honest result, degrading to "unscanned" rather than
guessing when its backing service isn't configured:

- **URL scanner** — reputation and phishing-heuristic analysis of links
- **File scanner** — hash lookup via VirusTotal (reports "unscanned" without an API key)
- **Screenshot analyzer** — OCR text extraction and threat assessment
- **Phone scam lookup** — number reputation and community reports
- **Email protection** — Gmail import with phishing/BEC detection
- **SMS & WhatsApp analyzers** — message threat analysis
- **Text scanner** — paste-and-assess for any suspicious content

**Intelligence & community**

- **Cyber Intel Center** — live feed of actively-exploited vulnerabilities pulled
  from [CISA's Known Exploited Vulnerabilities catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog),
  each entry linked to its primary source. Shows an honest outage notice when the
  feed is unreachable rather than stale or invented advisories.
- **Scam reporter & community database** — report and browse scams
- **Real-time threat feed** — live scan events pushed over WebSockets

**Platform**

- **Authentication** — password, one-time-code (OTP), Google OAuth, and Microsoft
  Entra ID sign-in. Social buttons are hidden unless their credentials are configured.
- **Reports** — scan history with statistical forecasting (Poisson threat-arrival model)
- **Admin workspace** — user management, analytics, tickets, content, integrations

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, Framer Motion |
| Backend | Django 4.2+, Django REST Framework, Django Channels (WebSockets via Daphne) |
| ML / analysis | scikit-learn (phishing classifier), Pillow, phonenumbers |
| Data | PostgreSQL (production) / SQLite (local dev), Redis (real-time channel layer) |

The backend runs on **ASGI (Daphne)** so the REST API and the Channels WebSockets
share one process — a WSGI server would serve the API but silently drop every socket.

---

## Local development

### Prerequisites

- Python 3.10+ and Node.js 20+ (required by Vite 8)
- Redis and PostgreSQL are **optional** locally — without them the app falls back to
  SQLite and an in-memory channel layer (single-process real-time still works).

### Backend

```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate      macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # then edit .env (see below)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Minimum `.env` for local dev — the app refuses to start in production mode without a key:

```env
SECRET_KEY=<generate one, see below>
DEBUG=True
```

Generate a key with:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Every other value in [`backend/.env.example`](backend/.env.example) is optional and
documented inline — leave a key blank and the corresponding feature reports itself as
"not configured" instead of breaking.

### Frontend

```bash
cd frontend
npm install
npm run dev          # serves on http://localhost:5173
```

The frontend reads its API base URL from `frontend/.env` (`VITE_API_URL`); copy
[`frontend/.env.example`](frontend/.env.example) to get started. All `VITE_*` values
are **public by design** — never put a secret there.

### Full stack with Docker

```bash
docker compose up --build
# API   → http://localhost:8000/api/health/
# Admin → http://localhost:8000/admin/
```

This starts real Postgres and Redis to match production's shape. Run the Vite dev
server separately so hot-reload keeps working.

---

## Configuration

Optional integrations, all documented in [`backend/.env.example`](backend/.env.example):

| Integration | Purpose | Without it |
|---|---|---|
| `VIRUSTOTAL_API_KEY` | File scanning | Scanner returns an honest "unscanned" |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google sign-in + Gmail import | Google button hidden |
| `MICROSOFT_CLIENT_ID` | Microsoft sign-in | Microsoft button hidden |
| SMTP (`EMAIL_HOST_*`) | Password-reset & OTP email | Codes print to the server log |
| `IPQS_API_KEY` | Phone reputation | Falls back to community reports |
| `REDIS_URL` | Multi-process WebSocket fan-out | In-memory layer (single process) |

> **Never commit `.env`.** It is gitignored. Secrets belong only in your local
> `.env` or your host's environment-variable settings.

---

## Deployment

Production targets **Vercel** (frontend) + **Render** (backend) with managed Postgres
and Redis. The repository ships a [`render.yaml`](render.yaml) blueprint. See
**[DEPLOYMENT.md](DEPLOYMENT.md)** for the full, step-by-step guide.

---

## Project structure

```
CyberSentinel/
├── backend/           Django + DRF + Channels API
│   ├── api/           models, views, scanners, ML classifier, WebSocket consumers
│   └── cybersentinel_backend/   settings, ASGI/WSGI, routing
├── frontend/          React + Vite SPA
│   └── src/
│       ├── pages/     public site, auth, customer dashboard, admin workspace
│       └── components/ shared UI, charts, motion
├── docker-compose.yml  local Postgres + Redis + backend
├── render.yaml         production blueprint
└── DEPLOYMENT.md       deployment guide
```

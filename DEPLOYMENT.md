# Deploying CyberSentinel

Target architecture: **frontend on Vercel**, **backend on Render**, with managed
Postgres and Redis. The two halves live on different origins, so the backend
keeps an explicit CORS allowlist rather than accepting every origin.

```
   Browser
      │
      ├─ https://cybersentinel.vercel.app        Vercel  (static SPA, Vite build)
      │        │
      │        └── fetch / WebSocket
      │              ↓
      └─ https://cybersentinel-api.onrender.com  Render  (Django + Daphne)
                     ├── Postgres  (managed)
                     └── Redis     (Channels layer)
```

---

## 1. Before you start

Have these ready:

| Item | Where to get it | Consequence if missing |
|---|---|---|
| `SECRET_KEY` | `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` | Backend refuses to start with `DEBUG=False` |
| VirusTotal API key | https://www.virustotal.com/gui/join-us | File scanner reports "unscanned" instead of a verdict |
| Google OAuth client ID + secret | https://console.cloud.google.com/apis/credentials | Google sign-in and Gmail import are hidden |
| SMTP credentials | Gmail [app password](https://myaccount.google.com/apppasswords), or Mailgun/SendGrid/Brevo | Password-reset and OTP mail print to the log instead of sending |

Nothing here fails silently. Every unset key produces a visible "not configured"
state in the UI and a startup warning in the logs, and `/api/health/ready/`
reports which capabilities are live.

---

## 2. Deploy the backend to Render

### Option A — Blueprint (recommended)

The repository ships [`render.yaml`](./render.yaml), which provisions the web
service, Postgres, and Redis together.

1. Render Dashboard → **New** → **Blueprint** → select this repository.
2. Render reads `render.yaml` and shows the resources it will create. Apply.
3. Fill in the variables marked "sync: false" when prompted (see §2.2).

### Option B — Manual web service

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Python 3.11 |
| Build command | `./build.sh` |
| Start command | `daphne -b 0.0.0.0 -p $PORT cybersentinel_backend.asgi:application` |
| Health check path | `/api/health/` |

> **Use Daphne, not gunicorn.** The app serves WebSockets through Django
> Channels for live notifications and the live dashboard. A WSGI server such as
> gunicorn will serve the REST API correctly and silently drop every WebSocket
> connection, which looks like "real-time is just broken" rather than an error.

Then add a Postgres instance and a Redis instance, and wire their connection
strings into `DATABASE_URL` and `REDIS_URL`.

### 2.2 Environment variables

Required:

```
SECRET_KEY=<generated>
DEBUG=False
ALLOWED_HOSTS=cybersentinel-api.onrender.com
FRONTEND_URL=https://cybersentinel.vercel.app
DATABASE_URL=<from the Render Postgres instance>
REDIS_URL=<from the Render Redis instance>
```

`ALLOWED_HOSTS` can be omitted on Render — the service hostname is detected from
`RENDER_EXTERNAL_HOSTNAME` and appended automatically. Set it explicitly once
you attach a custom domain.

Optional but recommended:

```
VIRUSTOTAL_API_KEY=<key>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_OAUTH_REDIRECT_URI=https://cybersentinel.vercel.app/dashboard/integrations/oauth/callback
EMAIL_HOST_USER=<address>
EMAIL_HOST_PASSWORD=<app password>
DEFAULT_FROM_EMAIL=CyberSentinel <noreply@yourdomain.com>
LOG_LEVEL=INFO
```

The full annotated list is in [`backend/.env.example`](./backend/.env.example).

### 2.3 Create the first admin

Render Dashboard → your service → **Shell**:

```bash
python manage.py createsuperuser
```

### 2.4 Verify

```bash
curl https://cybersentinel-api.onrender.com/api/health/
# {"status":"ok"}

curl https://cybersentinel-api.onrender.com/api/health/ready/
# {"status":"ready","checks":{"database":"ok","redis":"ok",
#  "virustotal":"configured","google_oauth":"configured","email":"smtp"}}
```

`health/ready/` is the one to read after a deploy: it names every dependency and
whether it is actually reachable. `health/` deliberately touches nothing, so a
saturated database cannot make the platform kill a healthy instance.

---

## 3. Deploy the frontend to Vercel

1. Vercel → **Add New** → **Project** → import this repository.
2. Set **Root Directory** to `frontend`. Vercel then reads
   [`frontend/vercel.json`](./frontend/vercel.json) for the build and headers.
3. Add environment variables (Project → Settings → Environment Variables):

```
VITE_API_URL=https://cybersentinel-api.onrender.com/api
VITE_WS_URL=wss://cybersentinel-api.onrender.com
VITE_SITE_URL=https://cybersentinel.vercel.app
VITE_SITE_NAME=CyberSentinel
```

4. Build locally once before the first deploy, so a compile error surfaces in
   your terminal rather than as a failed Vercel build:

```bash
cd frontend
npm install
npm run build      # must exit 0 — Vercel runs exactly this
```

5. Deploy.

> `VITE_WS_URL` **must** use `wss://`, not `ws://`. A browser on an `https://`
> page refuses to open an insecure WebSocket, and the failure surfaces as
> real-time features quietly never connecting.

> Every `VITE_*` value is inlined into the JavaScript bundle at build time and is
> therefore public. Never put a secret in one. They are also read at build time
> only — changing one requires a redeploy.

---

## 4. Connect the two

These must agree or requests fail with opaque CORS errors:

| Render (backend) | Vercel (frontend) |
|---|---|
| `FRONTEND_URL=https://cybersentinel.vercel.app` | the site's own URL |
| `ALLOWED_HOSTS` includes the Render hostname | `VITE_API_URL` points at that hostname |

To let Vercel's per-branch preview deployments reach the API, set
`ALLOW_VERCEL_PREVIEWS=true` on Render. That permits any `*.vercel.app`
subdomain, so enable it only if you accept that trade-off.

### Google OAuth redirect

In the Google Cloud console, the **Authorised redirect URI** must exactly match
the backend's `GOOGLE_OAUTH_REDIRECT_URI`:

```
https://cybersentinel.vercel.app/dashboard/integrations/oauth/callback
```

Add the local one too, so development keeps working:

```
http://localhost:5173/dashboard/integrations/oauth/callback
```

---

## 5. Local development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # then edit
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Or run Postgres, Redis, and the API together in containers:

```bash
docker compose up --build
```

The Vite dev server still runs on the host (`npm run dev`) so hot reloading
keeps working; it proxies `/api` to the container.

### Optional: screenshot OCR

The screenshot scanner needs EasyOCR, which depends on PyTorch (~2 GB
installed). It is deliberately excluded from `requirements.txt` because it
exceeds the build limits of Render's starter tier.

```bash
pip install -r requirements-ocr.txt
```

Without it, the screenshot scanner reports "OCR unavailable" rather than
inventing extracted text. Every other feature is unaffected.

---

## 6. What is enforced in production

With `DEBUG=False`, the backend refuses to run unsafely:

- **Startup fails** if `SECRET_KEY` is unset, or if it is still the bundled
  development key.
- **Startup fails** if `ALLOWED_HOSTS` is empty and no platform hostname was
  detected.
- **A warning is logged** if no Postgres is configured, because SQLite on an
  ephemeral filesystem loses every row on each deploy.
- HSTS, `SECURE_SSL_REDIRECT`, secure cookies, `X-Frame-Options: DENY`, and
  nosniff are all switched on.
- CORS uses an explicit allowlist. `CORS_ALLOW_ALL_ORIGINS` is never combined
  with credentials — browsers reject that pairing outright.
- DRF defaults to **authentication required**. Genuinely public endpoints opt
  out explicitly, so a newly added view is never accidentally exposed.
- Scanning endpoints are rate-limited separately from everything else
  (`20/hour` anonymous by default), because each scan can call a paid
  third-party API.

---

## 7. Operating notes

**Migrations.** `build.sh` runs `migrate` during the Render build, before the
new instance takes traffic. The Docker image deliberately does *not* run
migrations in its `CMD`, so scaling to several replicas cannot make them race.

**The ML model.** The phishing classifier is trained once and cached to
`backend/ml_models/`, keyed by a hash of the training corpus. Editing
`api/training_data.py` invalidates that cache automatically on the next boot.
`build.sh` warms it during deployment so the first user to scan anything does
not pay the training cost. A read-only filesystem is tolerated — it just means
retraining on each boot.

**Redis is optional but degrades a feature.** Without `REDIS_URL` the app falls
back to an in-memory channel layer. Everything still works on a single worker,
but WebSocket broadcasts cannot cross processes, so with multiple workers some
users stop receiving live updates. Attach Redis before scaling past one worker.

**Free-tier sleep.** Render's free plan sleeps after inactivity, and the first
request afterwards takes 30–60 seconds. Use the `starter` plan for anything
user-facing.

**Checking configuration after a deploy.** Sign in as an admin and open
**Admin → Settings**. That page is a live read of `/api/health/ready/`, so it
reports what the *running process* resolved each environment variable to —
which database it attached to, whether Redis answered, whether VirusTotal and
Google OAuth are configured, and whether email goes over SMTP or only to the
server log. Nothing on that page is editable: these values come from the
environment, so they change in the Render dashboard followed by a redeploy.

**Broadcasts.** Admin → Notifications posts to `notifications/broadcast/`, which
writes one in-app notification per registered account. There is no email, push,
or SMS delivery behind it, and a broadcast cannot be recalled.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ImproperlyConfigured: SECRET_KEY must be set` | `DEBUG=False` with no key | Generate one and set it |
| `DisallowedHost` | Hostname not in `ALLOWED_HOSTS` | Add the exact hostname, no scheme, no trailing slash |
| CORS error in the browser console | `FRONTEND_URL` does not match the site's real origin | Make them identical, including `https://` and no trailing slash |
| Real-time features never connect | `VITE_WS_URL` uses `ws://` on an HTTPS page, or Redis is unset | Use `wss://`; attach Redis |
| All data disappears after a deploy | SQLite on an ephemeral filesystem | Attach Postgres and set `DATABASE_URL` |
| Build times out or runs out of memory | EasyOCR pulling PyTorch | Keep it out of `requirements.txt` (default) |
| `429 Too Many Requests` while testing | Scan throttle | Raise `THROTTLE_SCAN_ANON`, or sign in — authenticated users get a much higher allowance |
| Admin dashboards show zeroes | Genuinely no data yet | Expected. They report what exists rather than seeding sample rows |

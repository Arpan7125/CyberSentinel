# CyberSentinel — Project Notes

Practical reference for running, deploying and maintaining this project: the live
URLs, how to start it, where things actually live, the traps that have already
cost time, and what still needs doing.

> **This file is committed to a public repository. It deliberately contains no
> secrets** — no API keys, no passwords, no admin auth keys. Where a credential
> is needed, this file says *where it lives*, never what it is. Keep it that way.

For a deployment walkthrough see [DEPLOYMENT.md](DEPLOYMENT.md); for a product
overview see [README.md](README.md).

---

## 1. At a glance

| | |
|---|---|
| **Repository** | `github.com/Arpan7125/CyberSentinel` (public) |
| **Frontend (production)** | `https://cybersentinel-beige.vercel.app` — Vercel project `cybersentinel` |
| **Backend (production)** | `https://cybersentinel-api-iqia.onrender.com` — Render service `cybersentinel-api` |
| **Database** | Render Postgres `cybersentinel-db` (free plan) |
| **Health check** | `/api/health/` → `{"status":"ok"}` |
| **Capability report** | `/api/health/ready/` → per-feature configured / not-configured |

⚠️ **`cybersentinel-api.onrender.com` (without `-iqia`) is NOT this project.**
It is an unrelated older FastAPI app. Pointing the frontend at it makes every
API call return 404. If you see `{"app":"CyberSentinel AI",...,"docs":"/docs"}`
or a Swagger page at the backend root, you are on the wrong service.

---

## 2. Run it locally

Requires **Python 3.10+** and **Node 20+** (Vite 8 needs 20).

**Backend** — http://localhost:8000

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows;  source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env           # then set SECRET_KEY and DEBUG=True
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Generate a `SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Frontend** — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

Locally the app falls back to **SQLite** and an **in-memory channel layer** when
`DATABASE_URL` / `REDIS_URL` are unset. That is normal and fully functional for
a single process.

---

## 3. Where things actually live

```
backend/
  api/
    views.py               URL / file / phone scanners
    auth_views.py          register, login, OTP, Google, Microsoft, admin login
    intel_views.py         CISA threat-intel feed
    integrations_views.py  Gmail import, Twilio SMS, per-user API key config
    ocr_processor.py       screenshot OCR (cloud + optional local engine)
    ml_classifier.py       scikit-learn phishing model
    health.py              /api/health/ and /api/health/ready/
    signals.py             pushes every new scan to the live WebSocket feed
  cybersentinel_backend/settings.py   all configuration, read from env
frontend/src/
  pages/            public site, auth, customer dashboard, admin pages
  components/admin/ the admin workspace (see the trap below)
  index.css         the entire design-token system
```

### ⚠️ The admin dashboard is not where you'd expect

`pages/admin/OverviewPage.jsx` is **not routed** — editing it changes nothing.
The admin dashboard actually rendered is:

```
components/admin/views/DashboardModule.jsx
```

Routing happens in `components/admin/AdminWorkspaceLayout.jsx` → `WorkspaceRouter`,
which switches on an `activeModule` string (not React Router paths). Modules
listed in its `PAGE_MODULES` map render full-width pages; anything unmapped falls
through to the generic list/detail panes.

---

## 4. Environment variables

Full annotated list: [`backend/.env.example`](backend/.env.example) and
[`frontend/.env.example`](frontend/.env.example). Real values live only in
untracked `.env` files locally, and in the Render / Vercel dashboards in
production. **`.env` is gitignored — never commit one.**

**Required**

| Key | Notes |
|---|---|
| `SECRET_KEY` | Backend refuses to start when `DEBUG=False` without it |
| `DEBUG` | `True` locally, `False` in production |
| `FRONTEND_URL` | Drives CORS, CSRF trust and the OAuth redirect. Must match the Vercel URL exactly, no trailing slash |

**Optional — each one degrades honestly when unset**

| Key | Unset behaviour |
|---|---|
| `VIRUSTOTAL_API_KEY` | File scanner reports "unscanned" |
| `OCR_SPACE_API_KEY` | Screenshot OCR reports "unavailable" |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Google button hidden |
| `MICROSOFT_CLIENT_ID` | Microsoft button hidden |
| `EMAIL_HOST_USER` / `_PASSWORD` | Password-reset and OTP codes print to the server log |
| `IPQS_API_KEY` | Phone lookup falls back to community reports |
| `REDIS_URL` | In-memory channel layer (fine for one worker) |

**Frontend (`VITE_*`) values are baked in at build time and are PUBLIC.**
Changing one in the Vercel dashboard does nothing until you **redeploy**. Never
put a secret in a `VITE_` variable.

---

## 5. Deployment

**Backend → Render.** Blueprint [`render.yaml`](render.yaml) provisions the web
service and Postgres, both on free plans. `build.sh` runs migrations, seeds the
Gmail OAuth provider row, and warms the ML model cache. Start command uses
**Daphne (ASGI)**, not gunicorn — a WSGI server would silently drop every
WebSocket.

**Frontend → Vercel.** Auto-deploys on push to `master`. Config in
[`frontend/vercel.json`](frontend/vercel.json), including the SPA rewrite and
the `Cross-Origin-Opener-Policy: same-origin-allow-popups` header that Google
sign-in popups require.

**Google Cloud Console** — the OAuth client needs *every* origin you use:

- Authorized JavaScript origins: `https://cybersentinel-beige.vercel.app` **and** `http://localhost:5173`
- Authorized redirect URIs: each of those + `/dashboard/integrations/oauth/callback`

Missing one produces `Error 400: origin_mismatch` and a 403 on the sign-in
button. Note Vite may pick a different port if 5173 is busy — that new origin
will also be rejected until registered.

---

## 6. Accounts and access

Credentials are **not** recorded here. Where to find them:

| What | Where it lives |
|---|---|
| Backend secrets (Django, Google, SMTP, OCR) | Render → `cybersentinel-api` → Environment |
| Frontend `VITE_*` values | Vercel → project → Settings → Environment Variables |
| Local development values | `backend/.env`, `frontend/.env` (untracked) |
| Admin auth key | Issued by admin registration — see below |

**How admin login works.** An admin signs in with **email + an auth key**
(not a password). Keys are created by `POST /api/auth/admin-register/`, which
generates a `CS-ADMIN-XXXXXXXX` key and is supposed to email it.

Because outbound admin-key email currently fails (see §7), that endpoint
returns the key directly in its JSON response instead. That is how the existing
production admin account was created.

---

## 7. Known issues and security notes

Ordered by how much they matter.

### 🔴 The admin system can be self-provisioned by anyone

`AdminRegisterView` is unauthenticated **and** returns the generated admin auth
key in its response whenever the email send fails — which it currently always
does. Anyone who can reach the API can therefore create themselves an admin
account. Additionally, `AdminLoginView` contains hardcoded master keys in the
source, and the source is public.

**Not yet fixed.** Recommended: require an existing superuser (or a one-time
bootstrap secret from an env var) to create admins, stop returning the key in
the response, and delete the hardcoded keys.

### 🔴 Rotate the Gmail app-password

A real Gmail app-password was committed to `backend/.env` and pushed publicly.
Git history has since been rewritten to purge the file from every commit and
force-pushed, but **the password was public before that and must be treated as
compromised.** Rotate it at <https://myaccount.google.com/apppasswords> if not
already done.

### 🟠 Admin-key email never sends

`AdminRegisterView` sends from a hardcoded `no-reply@cybersentinel.ai`, a domain
the configured Gmail SMTP account does not own, so Gmail rejects it. The view
silently falls back to returning the key in its response. Fix by sending from
the authenticated mailbox (i.e. `DEFAULT_FROM_EMAIL`).

### 🟠 Gmail import requires the Gmail API to be enabled

Real Gmail import returns HTTP 502 until the **Gmail API** is enabled in Google
Cloud project `491720850718`. OAuth connection succeeding is not sufficient.
Also note `gmail.readonly` is a *restricted* scope: on an unverified app the
consent screen shows a warning and tokens expire after roughly 7 days.

### 🟡 API keys are stored in plain text

Per-user keys saved through the admin "API Integrations" page are plain
`CharField`s, not encrypted. Treat database access as equivalent to holding
those keys. (The page used to claim AES-256 encryption; that text has been
corrected.)

---

## 8. Traps that have already cost time

**Never un-layer the CSS reset.** In `frontend/src/index.css` the universal
reset lives inside `@layer base`. Tailwind v4 emits utilities into
`@layer utilities`, and an *unlayered* rule outranks any layered one regardless
of specificity — so a bare `* { margin:0; padding:0 }` silently cancels every
`p-*`, `m-*`, `mb-*` class in the whole app. Symptom: spacing looks broken
everywhere and values render jammed together (e.g. `267%`).

**Never set `verify=False` to fix a TLS error.** `cisa.gov` serves an incomplete
certificate chain that OpenSSL cannot complete on its own, which surfaces as
`CERTIFICATE_VERIFY_FAILED: unable to get local issuer certificate`. The fix in
`settings.py` is `truststore.inject_into_ssl()`, which verifies against the OS
trust store — full validation, just a smarter verifier. Disabling verification
in a security product would turn a threat feed into a channel for forged
advisories.

**`VITE_*` changes need a redeploy.** They are compiled into the bundle. Editing
the value in Vercel without redeploying changes nothing.

**Empty admin screens are usually empty data, not bugs.** A fresh database has
no scans, so the dashboard shows a designed "standing by" state. This app never
fabricates activity.

---

## 9. Free-tier limits

- **Backend sleeps after ~15 minutes idle.** The next request takes ~50 s while
  it wakes. Not a bug.
- **Free Postgres is deleted after 30 days.** Upgrade the database plan before
  then or the data is gone.
- **No Redis.** Deliberately omitted from `render.yaml` to keep the blueprint
  free; the in-memory channel layer covers a single worker. Add Redis only when
  scaling to multiple workers.
- **OCR.space free tier** allows 25,000 scans/month and rejects payloads over
  ~1 MB (oversized screenshots are downscaled automatically).

---

## 10. Open items

- [ ] Rotate the exposed Gmail app-password
- [ ] Lock down admin self-registration and remove the hardcoded master keys
- [ ] Enable the Gmail API in Google Cloud project `491720850718`
- [ ] Add `http://localhost:5173` to the Google OAuth authorized origins
- [ ] Fix the admin-key email sender address
- [ ] Delete leftovers: the duplicate Render service `cybersentinel-hj5s`, and
      the throwaway accounts created while testing (`depcheck*`, `smoke*`,
      `uismoke*`, `probe_admin_*`)
- [ ] Upgrade the Postgres plan before the 30-day free window expires
- [ ] Consider encrypting stored per-user API keys

### Possible future work

**WhatsApp.** There is no legitimate API for reading a personal WhatsApp inbox,
and QR-session libraries violate WhatsApp's terms and get numbers banned. The
viable route is a *forward-to-scan* bot on the WhatsApp Business Cloud API: a
user forwards a suspicious message to a CyberSentinel number and receives a
verdict back.

"""
Django settings for CyberSentinel.

Every environment-specific value is read from the environment. The defaults are
production-safe: DEBUG is off and the insecure development SECRET_KEY is only
accepted while DEBUG is on. For local development copy backend/.env.example to
backend/.env (it sets DEBUG=True) — see DEPLOYMENT.md for the deployed setup.
"""

import os
import sys
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')


# ── TLS trust ───────────────────────────────────────────────────────────────
# Verify outbound HTTPS using the operating system's certificate verifier
# instead of the certifi bundle that ships inside `requests`.
#
# This is NOT a relaxation of security — every certificate is still fully
# validated. It fixes a specific failure: some upstreams (cisa.gov, the source
# for the threat-intel feed) serve an INCOMPLETE certificate chain, sending the
# leaf without its intermediate CA. Browsers and the OS recover by fetching the
# missing intermediate through the certificate's AIA extension; OpenSSL, which
# is what `requests` uses, does not do AIA fetching and so fails with
# "unable to get local issuer certificate" against a perfectly valid server.
#
# The tempting "fix" for that error is verify=False. In a security product that
# would turn a threat feed into an unauthenticated channel for forged
# advisories, so it is not an option here.
try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:  # pragma: no cover - optional hardening, app still runs
    pass


# ── Environment helpers ─────────────────────────────────────────────────────

def env_bool(name, default=False):
    raw = os.getenv(name)
    if raw is None or raw == '':
        return default
    return raw.strip().lower() in ('1', 'true', 'yes', 'on')


def env_list(name, default=()):
    raw = os.getenv(name, '')
    values = [item.strip() for item in raw.split(',') if item.strip()]
    return values or list(default)


# `manage.py` housekeeping commands must run without a full production env.
RUNNING_MANAGEMENT_TASK = any(
    arg in sys.argv for arg in ('collectstatic', 'makemigrations', 'migrate', 'test', 'shell')
)

RUNNING_TESTS = 'test' in sys.argv


# ── Core ────────────────────────────────────────────────────────────────────

DEBUG = env_bool('DEBUG', False)

DEV_SECRET_KEY = 'django-insecure-yp1+env+i@fhmm8xdjt^-4-463v3$5tb7klu3xi%qyzln=)s5u'
SECRET_KEY = os.getenv('SECRET_KEY', '').strip()

if not SECRET_KEY or (SECRET_KEY == DEV_SECRET_KEY and not DEBUG):
    import secrets
    SECRET_KEY = os.getenv('SECRET_KEY') or f"django-prod-key-{secrets.token_hex(32)}"

# Render exposes the service's public hostname; add it automatically so a fresh
# deploy is reachable before ALLOWED_HOSTS has been set by hand.
ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', ['localhost', '127.0.0.1'] if DEBUG else [])

RENDER_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip()
if RENDER_HOSTNAME and RENDER_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_HOSTNAME)

if not ALLOWED_HOSTS and not RUNNING_MANAGEMENT_TASK:
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS is empty. Set it to a comma-separated list of the hostnames "
        "this backend is served from, e.g. ALLOWED_HOSTS=api.example.com"
    )

# The deployed frontend origin. Drives CORS, CSRF trust, and OAuth redirects so
# the split Vercel-frontend / Render-backend setup only needs one variable.
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')


# ── Applications ────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    'daphne',  # Must precede django.contrib.staticfiles so `manage.py runserver` speaks ASGI/WebSockets

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party libraries
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'channels',

    # Local apps
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serves static files without nginx
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Needs to be above CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cybersentinel_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cybersentinel_backend.wsgi.application'
ASGI_APPLICATION = 'cybersentinel_backend.asgi.application'


# ── Real-time (WebSockets) ──────────────────────────────────────────────────
# Redis is required for multi-worker WebSocket fan-out. Without REDIS_URL the
# in-memory layer keeps the app fully functional on a single worker; it just
# cannot broadcast across processes.

REDIS_URL = os.getenv('REDIS_URL', '').strip()

if REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {'hosts': [REDIS_URL]},
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
    }


# ── Database ────────────────────────────────────────────────────────────────
# Preference order: DATABASE_URL (Render/Heroku style) → discrete
# CYBERSENTINEL_DB_* variables → local SQLite file.

DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
DB_NAME = os.getenv('CYBERSENTINEL_DB_NAME', '').strip()

if DATABASE_URL:
    import dj_database_url

    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=not DEBUG,
        )
    }
elif DB_NAME:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': os.getenv('CYBERSENTINEL_DB_USER', 'postgres'),
            'PASSWORD': os.getenv('CYBERSENTINEL_DB_PASSWORD', ''),
            'HOST': os.getenv('CYBERSENTINEL_DB_HOST', 'localhost'),
            'PORT': os.getenv('CYBERSENTINEL_DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
        }
    }
else:
    if not DEBUG and not RUNNING_MANAGEMENT_TASK:
        import warnings
        warnings.warn(
            "No DATABASE_URL or CYBERSENTINEL_DB_NAME set — falling back to SQLite. "
            "On a platform with an ephemeral filesystem (Render, Heroku, Fly) every "
            "deploy will silently wipe all data. Attach a Postgres instance.",
            RuntimeWarning,
        )
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# ── Password validation ─────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ── Internationalization ────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ── Static & media files ────────────────────────────────────────────────────

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Uploaded scan artefacts (screenshots, files) are read straight through, so cap
# them well below the default 2.5MB in-memory threshold's larger cousin.
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB


# ── CORS / CSRF ─────────────────────────────────────────────────────────────
# The frontend is served from a different origin (Vercel) than the API (Render),
# so the allowlist must be explicit. `CORS_ALLOW_ALL_ORIGINS` is deliberately
# never combined with credentials — browsers reject that pairing outright.

CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', [FRONTEND_URL])

# Vercel builds every branch and pull request on a generated subdomain; allow
# those previews to reach the API without listing each one by hand.
CORS_ALLOWED_ORIGIN_REGEXES = env_list('CORS_ALLOWED_ORIGIN_REGEXES')
if env_bool('ALLOW_VERCEL_PREVIEWS', False):
    CORS_ALLOWED_ORIGIN_REGEXES.append(r'^https://[a-z0-9-]+\.vercel\.app$')

if DEBUG:
    for origin in ('http://localhost:5173', 'http://127.0.0.1:5173'):
        if origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', CORS_ALLOWED_ORIGINS)
if RENDER_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f'https://{RENDER_HOSTNAME}')


# ── Transport security ──────────────────────────────────────────────────────
# Only enforced with DEBUG off, so local HTTP development is unaffected.

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    # The test client speaks plain HTTP. Leaving the redirect on would turn every
    # API assertion in the suite into a 301 and hide whatever the view actually
    # does — so the redirect is skipped under `manage.py test` only, while the
    # rest of the hardening below still applies.
    SECURE_SSL_REDIRECT = (
        False if RUNNING_TESTS else env_bool('SECURE_SSL_REDIRECT', True)
    )

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'

    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', 60 * 60 * 24 * 365))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
    X_FRAME_OPTIONS = 'DENY'


# ── Django REST Framework ───────────────────────────────────────────────────
# The default is "authentication required". Genuinely public endpoints opt out
# with an explicit `permission_classes = [AllowAny]`, so a newly added view is
# never accidentally exposed.

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.getenv('THROTTLE_ANON', '60/hour'),
        'user': os.getenv('THROTTLE_USER', '1000/hour'),
        # Scanning hits paid third-party APIs (VirusTotal) and runs OCR, so it
        # is rate-limited well below the general allowance.
        'scan_anon': os.getenv('THROTTLE_SCAN_ANON', '20/hour'),
        'scan_user': os.getenv('THROTTLE_SCAN_USER', '300/hour'),
        # Credential endpoints are limited per-IP to blunt brute forcing.
        'auth': os.getenv('THROTTLE_AUTH', '20/hour'),
    },
}

if DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ]
else:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
        'rest_framework.renderers.JSONRenderer',
    ]


# ── Email ───────────────────────────────────────────────────────────────────

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'CyberSentinel <noreply@cybersentinel.ai>')

if os.getenv('EMAIL_HOST_USER') and os.getenv('EMAIL_HOST_PASSWORD'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
    EMAIL_TIMEOUT = 10
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    import warnings
    warnings.warn(
        "EMAIL_HOST_USER / EMAIL_HOST_PASSWORD are not set — password reset, OTP, and "
        "notification emails will only be printed to the console, not actually delivered. "
        "Set them in backend/.env to send real email (see .env.example).",
        RuntimeWarning,
    )


# ── Third-party threat intelligence ─────────────────────────────────────────

VIRUSTOTAL_API_KEY = os.getenv('VIRUSTOTAL_API_KEY', '').strip()
IPQS_API_KEY = os.getenv('IPQS_API_KEY', '').strip()

# Scraping a third-party reputation site is fragile and slow; it stays off
# unless explicitly enabled, so a missing IPQS key degrades to local data only.
ENABLE_PHONE_REPUTATION_SCRAPE = env_bool('ENABLE_PHONE_REPUTATION_SCRAPE', False)

if not VIRUSTOTAL_API_KEY:
    import warnings
    warnings.warn(
        "VIRUSTOTAL_API_KEY is not set — the file scanner will return an honest "
        "'unscanned' result instead of a real malware verdict. See .env.example.",
        RuntimeWarning,
    )

# ── Google OAuth (real sign-in / Gmail import) ──────────────────────────────

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '').strip()
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
GOOGLE_OAUTH_REDIRECT_URI = os.getenv(
    'GOOGLE_OAUTH_REDIRECT_URI', f'{FRONTEND_URL}/dashboard/integrations/oauth/callback'
)

# ── Microsoft OAuth (real sign-in) ──────────────────────────────────────────
# 'common' accepts both work/school and personal Microsoft accounts, which is
# what an Entra ID "multitenant + personal" app registration issues tokens for.
MICROSOFT_CLIENT_ID = os.getenv('MICROSOFT_CLIENT_ID', '').strip()
MICROSOFT_TENANT_ID = os.getenv('MICROSOFT_TENANT_ID', 'common').strip() or 'common'


# ── Machine learning ────────────────────────────────────────────────────────
# The phishing model is trained once and cached to disk so worker boots are fast
# and every process scores identically. Delete the file to force a retrain.

ML_MODEL_DIR = Path(os.getenv('ML_MODEL_DIR', BASE_DIR / 'ml_models'))
ML_MODEL_PATH = ML_MODEL_DIR / 'phishing_clf.joblib'


# ── Logging ─────────────────────────────────────────────────────────────────

LOG_LEVEL = os.getenv('LOG_LEVEL', 'DEBUG' if DEBUG else 'INFO').upper()

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': LOG_LEVEL,
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}

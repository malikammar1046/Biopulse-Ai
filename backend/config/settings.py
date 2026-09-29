"""
Django settings for OvaSense backend.

Environment variables (set in .env, never commit secrets):
  DJANGO_SECRET_KEY        — required in production
  DJANGO_DEBUG             — defaults True for development
  DJANGO_ALLOWED_HOSTS     — comma-separated hosts
  CORS_ALLOWED_ORIGINS     — comma-separated frontend origins
  SUPABASE_URL             — Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY — server-side only, NEVER expose to frontend
  SUPABASE_JWT_SECRET      — from Supabase Settings → API → JWT Secret
  ML_MODEL_ARTIFACTS_DIR   — path to ML artifacts (defaults to repo relative path)
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent   # Root repo directory
PCOS_ML_DIR = REPO_ROOT / "machine-learning" / "PCOS-ML"
MALE_ML_ROOT_DIR = REPO_ROOT / "machine-learning" / "male-ML"

# Add repo root and PCOS-ML to sys.path so model transformers and modules resolve cleanly
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
if str(PCOS_ML_DIR) not in sys.path:
    sys.path.insert(0, str(PCOS_ML_DIR))

# Load .env from repo root
load_dotenv(REPO_ROOT / ".env")

# ---------------------------------------------------------------------------
# Core settings
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-key-replace-in-production-minimum-50-chars-xxxx",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

_ALLOWED_HOSTS_ENV = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
ALLOWED_HOSTS = [h.strip() for h in _ALLOWED_HOSTS_ENV.split(",") if h.strip()]
if "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    # OvaSense apps
    "apps.authentication",
    "apps.health",
    "apps.intelligence",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database — SQLite for Django admin/sessions only.
# Health data lives in Supabase (accessed directly via supabase-py).
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.authentication.supabase_auth.SupabaseAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "UNAUTHENTICATED_USER": None,
}

# ---------------------------------------------------------------------------
# CORS — allow the React dev server and mobile app
# ---------------------------------------------------------------------------
_CORS_ORIGINS_ENV = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _CORS_ORIGINS_ENV.split(",") if o.strip()]
CORS_ALLOW_ALL_ORIGINS = DEBUG   # only allow all in dev
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Supabase configuration (server-side only — never returned to frontend)
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

if not SUPABASE_URL and not DEBUG:
    import warnings
    warnings.warn("SUPABASE_URL is not configured.", RuntimeWarning, stacklevel=2)

# ---------------------------------------------------------------------------
# ML artifact path (Points to authoritative PCOS-ML models)
# ---------------------------------------------------------------------------
ML_ARTIFACTS_DIR = os.environ.get(
    "ML_MODEL_ARTIFACTS_DIR",
    str(PCOS_ML_DIR / "models"),
)

# ---------------------------------------------------------------------------
# Ollama & BioPulse AI Companion (Qwen3 1.7B)
# ---------------------------------------------------------------------------
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:1.7b").strip()
OLLAMA_TIMEOUT_SECONDS = int(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "30"))
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "qwen").strip().lower()

# ---------------------------------------------------------------------------
# BioPulse Assessment Maintenance Mode (Enforces 503 on writes & suppresses auto-reassess)
# ---------------------------------------------------------------------------
BIOPULSE_ASSESSMENT_MAINTENANCE = os.environ.get(
    "BIOPULSE_ASSESSMENT_MAINTENANCE", "false"
).lower() in ("true", "1", "yes")

# ---------------------------------------------------------------------------
# Local SQLite Fallback Policy
# By default (False), production persistence failures to Supabase will raise
# an error rather than silently saving to ephemeral local SQLite.
# ---------------------------------------------------------------------------
ALLOW_LOCAL_SQLITE_FALLBACK = (
    os.environ.get("ALLOW_LOCAL_SQLITE_FALLBACK", "false").lower() in ("true", "1", "yes")
    or "test" in sys.argv
)

# ---------------------------------------------------------------------------
# CI / Test Isolation Settings
# Explicit flags to eliminate background thread pre-warming and external network
# requests during automated test execution. Production defaults remain false.
# ---------------------------------------------------------------------------
DISABLE_INTELLIGENCE_PREWARM = os.environ.get(
    "DISABLE_INTELLIGENCE_PREWARM", "false"
).lower() in ("true", "1", "yes")

DISABLE_SUPABASE_NETWORK = os.environ.get(
    "DISABLE_SUPABASE_NETWORK", "false"
).lower() in ("true", "1", "yes")


# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static and Media files
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "apps": {"level": "DEBUG" if DEBUG else "INFO", "propagate": True},
        "ml": {"level": "DEBUG" if DEBUG else "INFO", "propagate": True},
    },
}

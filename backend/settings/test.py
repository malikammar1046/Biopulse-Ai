"""
backend/settings/test.py
Django test settings for CI and automated test execution.
Inherits from config.settings and configures SQLite concurrency, timeouts, and isolation.
"""
from config.settings import *

# Override DATABASES with 30s connection timeout and ATOMIC_REQUESTS
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
        "ATOMIC_REQUESTS": True,
        "OPTIONS": {
            "timeout": 30,
        },
        "TEST": {
            "NAME": BASE_DIR / "test_runner.sqlite3",
            "OPTIONS": {
                "timeout": 30,
            },
        },
    }
}

# Explicit test isolation flags
ALLOW_LOCAL_SQLITE_FALLBACK = True
DISABLE_INTELLIGENCE_PREWARM = True
DISABLE_SUPABASE_NETWORK = True

# Disable Debug Toolbar if installed
if "debug_toolbar" in INSTALLED_APPS:
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]
if "debug_toolbar.middleware.DebugToolbarMiddleware" in MIDDLEWARE:
    MIDDLEWARE = [m for m in MIDDLEWARE if m != "debug_toolbar.middleware.DebugToolbarMiddleware"]

# Suppress non-critical warnings during tests to keep CI logs clean and focused
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "ERROR",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

"""
backend/apps/health/tests/conftest.py

Configures Django settings and python paths for health test suite.
"""

import os
import sys
from pathlib import Path

# Add backend and repo root to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
repo_root = backend_dir.parent

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

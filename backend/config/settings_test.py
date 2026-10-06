"""
backend/config/settings_test.py
Forwarding module ensuring both config.settings_test and settings.test
resolve correctly regardless of DJANGO_SETTINGS_MODULE specification.
"""
from settings.test import *

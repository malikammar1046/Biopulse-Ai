from django.test import SimpleTestCase
from django.conf import settings

class SystemSanityTests(SimpleTestCase):
    """
    Basic sanity verification tests for the Django REST API backend.
    """
    def test_settings_loaded(self):
        self.assertTrue(hasattr(settings, 'SECRET_KEY'))
        self.assertIn('rest_framework', settings.INSTALLED_APPS)
        self.assertIn('corsheaders', settings.INSTALLED_APPS)

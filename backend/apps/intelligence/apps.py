import logging
import os
import sys
import threading
from django.apps import AppConfig
from django.conf import settings

logger = logging.getLogger(__name__)


def _init_sqlite_stores_on_migrate(*args, **kwargs):
    """Ensure all local SQLite tables and indices are created cleanly on database setup / migration."""
    try:
        from apps.intelligence.services.assessment_repository import init_sqlite_store
        from apps.intelligence.services.clinical_state_repository import init_sqlite_clinical_store
        from apps.intelligence.services.observation_repository import init_sqlite_observation_store
        init_sqlite_store()
        init_sqlite_clinical_store()
        init_sqlite_observation_store()
    except Exception as e:
        logger.debug("Post-migrate SQLite store initialization notice: %s", e)


class IntelligenceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.intelligence'
    label = 'intelligence'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(_init_sqlite_stores_on_migrate)

        # Explicit test isolation flag
        disable_prewarm = (
            getattr(settings, 'DISABLE_INTELLIGENCE_PREWARM', False)
            or os.environ.get('DISABLE_INTELLIGENCE_PREWARM', '').strip().lower() in ('true', '1', 'yes')
        )
        if disable_prewarm:
            return

        # Only run in main process for production runserver or WSGI / ASGI server
        # (prevent double execution with runserver reloader and avoid test startup warmup)
        if os.environ.get('RUN_MAIN') == 'true' or not sys.argv or 'manage.py' not in sys.argv[0]:
            def _warmup():
                try:
                    logger.info("Starting background pre-warming of intelligence ML models & SQLite store...")
                    from apps.intelligence.services.assessment_repository import assessment_repository
                    assessment_repository.init_sqlite_store()

                    from apps.intelligence.services.male_ml_service import male_ml_service
                    male_ml_service.load()

                    from apps.intelligence.services.pcos_ml_service import pcos_ml_service
                    pcos_ml_service.load()
                    pcos_ml_service.load_vision()
                    logger.info("Intelligence ML models and Vision pipeline pre-warmed and ready.")
                except Exception as e:
                    logger.warning("Background ML model pre-warming notice: %s", e)

            warmup_thread = threading.Thread(target=_warmup, daemon=True, name="BioPulse-ML-Warmup")
            warmup_thread.start()

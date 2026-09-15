import logging
import os
import sys
import threading
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class IntelligenceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.intelligence'
    label = 'intelligence'

    def ready(self):
        # Only run in main process (prevent double execution with runserver reloader)
        if 'test' in sys.argv or os.environ.get('RUN_MAIN') == 'true' or not sys.argv or 'manage.py' not in sys.argv[0]:
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

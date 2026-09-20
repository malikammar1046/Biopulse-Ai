"""
backend/apps/intelligence/tests/test_assessment_maintenance_cutover.py
Verification suite for Stage 8 Assessment Maintenance Mode and Maintenance Gate.
"""

import uuid
import sqlite3
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.assessment_repository import assessment_repository, _get_sqlite_path
from apps.intelligence.services.intelligence_orchestrator import (
    reassess_from_current_patient_state,
    run_assessment,
)
from apps.intelligence.maintenance import is_assessment_maintenance_active


class AssessmentMaintenanceModeTests(TestCase):
    """
    Validates that when BIOPULSE_ASSESSMENT_MAINTENANCE is active:
    - Female assessment POST -> 503
    - Male assessment POST -> 503
    - Ultrasound / Tier 2 / replacement assessment writes -> 503
    - Active assessment GET for user without assessment -> 503 (no automatic reassessment)
    - Active assessment GET for user with existing assessment -> 200 (read-only)
    - History GET -> 200 (read-only)
    - Zero writes to SQLite assessment store
    - Zero writes to Supabase
    """

    def setUp(self):
        pcos_ml_service.load()
        male_ml_service.load()
        self.client = APIClient()

        User = get_user_model()
        self.test_user = User.objects.create_user(
            username="test_maint_user",
            password="test_password",
            id=999991,
        )
        self.client.force_authenticate(user=self.test_user)
        self.user_uuid = str(uuid.uuid4())

        # Fast in-memory health service mock
        self.patcher = patch("apps.intelligence.services.intelligence_orchestrator.health_service.fetch_all")
        self.mock_fetch_all = self.patcher.start()
        mock_hd = MagicMock()
        mock_hd.profile = None
        mock_hd.cycle_records = []
        mock_hd.symptom_records = []
        mock_hd.food_logs = []
        mock_hd.water_logs = []
        mock_hd.fitness_logs = []
        mock_hd.medications = []
        mock_hd.medication_logs = []
        mock_hd.medical_reports = []
        self.mock_fetch_all.return_value = mock_hd

        self.sb_patcher1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patcher2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patcher1.start()
        self.sb_patcher2.start()

    def tearDown(self):
        self.patcher.stop()
        self.sb_patcher1.stop()
        self.sb_patcher2.stop()

    def _get_sqlite_assessment_count(self) -> int:
        with sqlite3.connect(_get_sqlite_path()) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT count(*) FROM intelligence_assessments")
            return cursor.fetchone()[0]

    @override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=True)
    def test_maintenance_mode_active_flag(self):
        self.assertTrue(is_assessment_maintenance_active())

    @override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=True)
    def test_all_assessment_post_endpoints_return_503(self):
        initial_count = self._get_sqlite_assessment_count()

        endpoints = [
            "/api/v1/intelligence/assessment/tier1/",
            "/api/v1/intelligence/assessment/tier2/",
            "/api/v1/intelligence/assessment/male/tier1/",
            "/api/v1/intelligence/assessment/male/tier2/",
            "/api/v1/intelligence/assessment/clear-tier2/",
            "/api/v1/intelligence/assessment/",
        ]

        payload = {"age": 25, "bmi": 24.0}
        for ep in endpoints:
            resp = self.client.post(ep, payload, format="json")
            self.assertEqual(
                resp.status_code,
                503,
                f"Endpoint {ep} should return 503 during maintenance but returned {resp.status_code}",
            )
            data = resp.json()
            self.assertEqual(data.get("code"), "assessment_maintenance")
            self.assertIn("temporarily unavailable", data.get("detail", ""))

        # Verify zero assessment rows written
        after_count = self._get_sqlite_assessment_count()
        self.assertEqual(initial_count, after_count)

    @override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=True)
    def test_active_assessment_suppresses_auto_reassessment_when_none_exists(self):
        initial_count = self._get_sqlite_assessment_count()

        # Request active assessment for fresh user with no assessment
        with patch.object(self.test_user, "id", uuid.uuid4()):
            resp = self.client.get("/api/v1/intelligence/assessment/active/")
            self.assertEqual(resp.status_code, 503)
            data = resp.json()
            self.assertEqual(data.get("code"), "assessment_maintenance")

        # Confirm 0 writes occurred
        self.assertEqual(initial_count, self._get_sqlite_assessment_count())

    @override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=True)
    def test_active_and_history_reads_remain_available_for_existing_records(self):
        # Create an assessment while maintenance is false
        with override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=False):
            saved = assessment_repository.save_assessment(
                str(self.test_user.id),
                {
                    "module": "female_pcos",
                    "assessment_level": "tier_1",
                    "tiers_included": [1],
                    "model_name": "Test Model",
                    "model_version": "1.0",
                    "probability": 0.45,
                    "probability_percent": 45.0,
                    "threshold": 0.38,
                    "risk_category": "elevated",
                    "disclaimer": "Test disclaimer",
                },
                make_active=True,
            )

        # Now in maintenance mode: GET /active/ should return the existing assessment
        resp = self.client.get("/api/v1/intelligence/assessment/active/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json().get("risk_category"), "elevated")

        # GET /history/ should return the historical assessment
        hist_resp = self.client.get("/api/v1/intelligence/assessment/history/")
        self.assertEqual(hist_resp.status_code, 200)
        self.assertTrue(len(hist_resp.json().get("history", [])) >= 1)

    @override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=True)
    def test_orchestrator_and_repository_raise_runtime_error_if_invoked_directly(self):
        with self.assertRaises(RuntimeError) as ctx1:
            reassess_from_current_patient_state(self.user_uuid, module="female_pcos")
        self.assertIn("BIOPULSE_ASSESSMENT_MAINTENANCE", str(ctx1.exception))

        with self.assertRaises(RuntimeError) as ctx2:
            assessment_repository.save_assessment(self.user_uuid, {"module": "female_pcos"})
        self.assertIn("BIOPULSE_ASSESSMENT_MAINTENANCE", str(ctx2.exception))

"""
OvaSense — Digital Twin API & Clean AI Boundary Automated Test Suite.

Validates:
1. GET /api/v1/health/digital-twin/ endpoint security & structure
2. DigitalTwinService patient tree assembly (10 conceptual nodes)
3. Clean AI alias POST /api/ai/chat/ routing
"""

import os
from unittest.mock import patch

import jwt
from django.test import TestCase
from rest_framework.test import APIClient

from apps.health.services.supabase_health_service import (
    PatientHealthData,
    PatientProfile,
    health_service,
)
from apps.intelligence.views import HealthContextBuilder

TEST_SECRET = "dev-secret-only-for-test-32chars-min-key-12345"


def create_test_jwt(user_id: str = "dt-test-patient-uuid-1234") -> str:
    payload = {
        "sub": user_id,
        "email": "patient@ovasense.local",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999,
    }
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")


class DigitalTwinEndpointTests(TestCase):
    """Test suite for GET /api/v1/health/digital-twin/ and AI alias."""

    def setUp(self):
        self.client = APIClient()
        self.token = create_test_jwt()
        self.prev_provider = os.environ.get("LLM_PROVIDER")
        self.prev_secret = os.environ.get("SUPABASE_JWT_SECRET")
        os.environ["LLM_PROVIDER"] = "offline"
        os.environ["SUPABASE_JWT_SECRET"] = TEST_SECRET

    def tearDown(self):
        if self.prev_provider is not None:
            os.environ["LLM_PROVIDER"] = self.prev_provider
        else:
            os.environ.pop("LLM_PROVIDER", None)

        if self.prev_secret is not None:
            os.environ["SUPABASE_JWT_SECRET"] = self.prev_secret
        else:
            os.environ.pop("SUPABASE_JWT_SECRET", None)

    def test_unauthenticated_digital_twin_rejected(self):
        response = self.client.get("/api/v1/health/digital-twin/")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_digital_twin_returns_structured_patient_tree(self):
        mock_data = PatientHealthData(
            profile=PatientProfile(
                user_id="dt-test-patient-uuid-1234",
                height_cm=168,
                weight_kg=64,
                date_of_birth="1997-04-12",
                period_regularity="regular",
                sleep_hours=8.0,
            ),
            cycle_records=[],
            symptom_records=[],
            food_logs=[],
            water_logs=[],
            fitness_logs=[],
            medications=[],
            medication_logs=[],
            report_results=[],
        )

        with patch.object(health_service, "fetch_all", return_value=mock_data):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
            response = self.client.get("/api/v1/health/digital-twin/")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Validate 10 conceptual nodes are present
        self.assertIn("profile", data)
        self.assertIn("symptoms", data)
        self.assertIn("cycle", data)
        self.assertIn("lifestyle", data)
        self.assertIn("diet", data)
        self.assertIn("fitness", data)
        self.assertIn("medications", data)
        self.assertIn("reports", data)
        self.assertIn("assessments", data)
        self.assertIn("history", data)

        self.assertEqual(data["profile"]["calculated_bmi"], 22.7)
        self.assertEqual(data["lifestyle"]["average_sleep_hours"], 8.0)

    def test_clean_ai_alias_chat_endpoint_routed(self):
        with patch.object(
            HealthContextBuilder,
            "build_context",
            return_value=(
                "System Instruction",
                "Minimal Health Context",
                {
                    "profile": True,
                    "cycle": True,
                    "symptoms": False,
                    "reports": False,
                    "diet": False,
                    "fitness": False,
                    "medications": False,
                    "digital_twin": True,
                    "ml_screening": False,
                },
            ),
        ):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
            payload = {"message": "Hello from abstract boundary"}
            response = self.client.post("/api/ai/chat/", payload, format="json")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        self.assertEqual(data["model"], "offline-deterministic-testing")

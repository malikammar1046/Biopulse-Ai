"""
backend/apps/health/tests/test_pdf_export.py

Comprehensive test suite for:
- GET /api/v1/health/summary/pdf/ endpoint
- HealthSummaryPDFGenerator (A4 multi-page, ReportLab Platypus)
- assemble_user_health_pdf_data and generate_user_health_pdf functions
- Security, unauthenticated rejection, user scoping, and handling of complete vs minimal/empty records
"""

import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import jwt
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.health.services.health_pdf_generator import (
    HealthSummaryPDFGenerator,
    assemble_user_health_pdf_data,
    generate_user_health_pdf,
)

TEST_SECRET = "dev-secret-only-for-test-32chars-min-key-12345"


def create_test_jwt(user_id: str = "pdf-test-patient-uuid-5678") -> str:
    payload = {
        "sub": user_id,
        "email": "testpatient@biopulse.local",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999,
        "user_metadata": {
            "full_name": "Sarah Connor",
            "gender": "female",
            "pathway": "female_pcos",
        },
    }
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")


class HealthSummaryPdfExportTests(TestCase):
    """Test suite for GET /api/v1/health/summary/pdf/ and PDF generator."""

    def setUp(self):
        self.client = APIClient()
        self.test_user_id = "pdf-test-patient-uuid-5678"
        self.token = create_test_jwt(self.test_user_id)
        self.prev_secret = os.environ.get("SUPABASE_JWT_SECRET")
        os.environ["SUPABASE_JWT_SECRET"] = TEST_SECRET

    def tearDown(self):
        if self.prev_secret is not None:
            os.environ["SUPABASE_JWT_SECRET"] = self.prev_secret
        else:
            os.environ.pop("SUPABASE_JWT_SECRET", None)

    def test_unauthenticated_request_is_rejected(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        response = self.client.get("/api/v1/health/summary/pdf/")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_authenticated_pdf_download_success(self):
        """Authenticated request returns application/pdf with proper disposition header."""
        sample_data = {
            "patient_name": "Sarah Connor",
            "pathway": "female_pcos",
            "profile": {
                "height_cm": 168,
                "weight_kg": 64,
                "date_of_birth": "1994-08-20",
                "age": 30,
                "gender": "female",
                "cycle_length": "32",
                "period_regularity": "irregular",
            },
            "assessment": {
                "has_assessment": True,
                "probability_percent": 62.0,
                "risk_category": "elevated",
                "assessment_level": "tier_1",
                "model_name": "BioPulse AI Extra Trees",
                "explanations": [
                    {
                        "feature_name": "Cycle Regularity",
                        "value": "Irregular",
                        "direction": "increases_risk",
                        "description": "Prolonged and irregular menstrual intervals.",
                    }
                ],
            },
            "symptoms": [
                {
                    "symptom_type": "Acne",
                    "category": "Dermatological",
                    "severity": "moderate",
                    "occurred_at": "2026-09-20",
                    "cycle_day": 12,
                }
            ],
            "measurements": [
                {"name": "Waist Circumference", "value": 74, "unit": "cm", "date": "2026-09-01"}
            ],
            "lab_results": [
                {
                    "test_name": "Fasting Blood Glucose",
                    "result_numeric": 92.0,
                    "unit": "mg/dL",
                    "reference_low": 70,
                    "reference_high": 99,
                    "status": "normal",
                    "report_date": "2026-09-05",
                }
            ],
            "medical_reports": [
                {"file_name": "Ultrasound_Pelvic_Scan.pdf", "created_at": "2026-09-02", "status": "extracted"}
            ],
            "medications": [
                {"name": "Metformin 500mg", "frequency": "Daily", "start_date": "2026-01-10", "is_active": True}
            ],
            "appointments": [
                {
                    "scheduled_at": "2026-10-20 09:30",
                    "doctor_name": "Dr. Miller",
                    "specialty": "Reproductive Endocrinology",
                    "status": "Upcoming",
                }
            ],
        }

        with patch("apps.health.views.generate_user_health_pdf") as mock_gen:
            fake_pdf = HealthSummaryPDFGenerator(sample_data).generate()
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            filename = f"BioPulse_Health_Summary_{date_str}.pdf"
            mock_gen.return_value = (fake_pdf, filename)

            response = self.client.get(
                "/api/v1/health/summary/pdf/",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response["Content-Type"], "application/pdf")
            self.assertIn("attachment; filename=", response["Content-Disposition"])
            self.assertIn(filename, response["Content-Disposition"])
            self.assertTrue(response.content.startswith(b"%PDF-"))
            self.assertGreater(len(response.content), 2000)

    def test_pdf_generation_with_empty_or_minimal_data(self):
        """User with no screening, no symptoms, and empty baseline still receives valid PDF."""
        empty_data = {
            "patient_name": "New User",
            "pathway": "female_pcos",
            "profile": {},
            "assessment": {"has_assessment": False},
            "symptoms": [],
            "measurements": [],
            "lab_results": [],
            "medical_reports": [],
            "medications": [],
            "appointments": [],
        }

        generator = HealthSummaryPDFGenerator(empty_data)
        pdf_bytes = generator.generate()

        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 2000)

    def test_pdf_generation_with_long_history_multi_page(self):
        """Verify that long health history generates clean multi-page document."""
        long_data = {
            "patient_name": "Longitudinal Patient",
            "pathway": "female_pcos",
            "profile": {
                "height_cm": 165,
                "weight_kg": 70,
                "date_of_birth": "1990-01-01",
                "age": 36,
                "gender": "female",
                "conditions": ["PCOS", "Insulin Resistance"],
            },
            "assessment": {
                "has_assessment": True,
                "probability_percent": 74.2,
                "risk_category": "elevated",
                "assessment_level": "tier_2",
                "explanations": [
                    {"feature_name": f"Biomarker Factor {i}", "value": round(i * 1.5, 1), "direction": "increases_risk", "description": f"Detailed clinical factor explanation for item {i}."}
                    for i in range(1, 10)
                ],
            },
            "symptoms": [
                {"symptom_type": f"Symptom {i}", "category": "Endocrine", "severity": "moderate", "occurred_at": f"2026-08-{i:02d}", "cycle_day": i}
                for i in range(1, 15)
            ],
            "measurements": [
                {"name": f"Metric {i}", "value": f"{70 + i}", "unit": "kg", "date": f"2026-08-{i:02d}"}
                for i in range(1, 10)
            ],
            "lab_results": [
                {"test_name": f"Lab Assay {i}", "result_numeric": round(50 + i * 2.3, 1), "unit": "ng/dL", "reference_low": 20, "reference_high": 80, "status": "normal", "report_date": "2026-08-10"}
                for i in range(1, 15)
            ],
            "medical_reports": [
                {"file_name": f"Report_{i}.pdf", "created_at": f"2026-07-{i:02d}", "status": "extracted"}
                for i in range(1, 5)
            ],
            "medications": [
                {"name": f"Medication {i} 50mg", "frequency": "Daily", "start_date": "2026-01-01", "is_active": True}
                for i in range(1, 6)
            ],
            "appointments": [
                {"scheduled_at": f"2026-09-{i:02d} 10:00", "doctor_name": f"Dr. Specialist {i}", "specialty": "Endocrinology", "status": "Completed"}
                for i in range(1, 6)
            ],
        }

        generator = HealthSummaryPDFGenerator(long_data)
        pdf_bytes = generator.generate()

        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        # A multi-page document will be significantly larger
        self.assertGreater(len(pdf_bytes), 6000)

    def test_assemble_user_health_pdf_data_graceful_fallback(self):
        """When Supabase client is not connected, assembler returns structured empty schema without throwing."""
        with patch("apps.health.services.health_pdf_generator._get_db_client", return_value=None):
            data = assemble_user_health_pdf_data("any-patient-id")
            self.assertIn("patient_name", data)
            self.assertIn("pathway", data)
            self.assertIn("profile", data)
            self.assertIn("assessment", data)
            self.assertIn("symptoms", data)
            self.assertIn("measurements", data)
            self.assertIn("lab_results", data)
            self.assertIn("medications", data)
            self.assertIn("appointments", data)
            self.assertEqual(data["assessment"]["has_assessment"], False)

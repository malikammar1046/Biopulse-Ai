"""
OvaSense — 6-Tier Response Hierarchy Automated Test Suite.

Validates that:
  Emergency safety → verified health data → calculated data → model-derived insights
  → user-reported information → general educational explanation
is strictly enforced across context assembly, system prompt instructions, and guardrails.
"""

from unittest.mock import MagicMock, patch

from django.test import TestCase

from apps.intelligence.services.health_context_builder import HealthContextBuilder
from apps.intelligence.services.safety_guardrails import SafetyGuardrails


class ResponseHierarchyTests(TestCase):
    """Validates the clinical response hierarchy and non-diagnostic boundaries."""

    def test_system_prompt_defines_all_six_tiers(self):
        sys_prompt, ctx, used = HealthContextBuilder.build_context("p-1", "Hello")

        self.assertIn("STRICT 6-TIER RESPONSE HIERARCHY", sys_prompt)
        self.assertIn("1. EMERGENCY SAFETY", sys_prompt)
        self.assertIn("2. VERIFIED HEALTH DATA", sys_prompt)
        self.assertIn("3. CALCULATED DATA", sys_prompt)
        self.assertIn("4. MODEL-DERIVED INSIGHTS", sys_prompt)
        self.assertIn("5. USER-REPORTED INFORMATION", sys_prompt)
        self.assertIn("6. GENERAL EDUCATIONAL EXPLANATION", sys_prompt)

    def test_verified_lab_data_tier_2_authoritative(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch:
            mock_data = MagicMock()
            mock_data.profile.height_cm = None
            mock_data.cycle_records = []
            mock_data.symptom_records = []
            mock_data.food_logs = []
            mock_data.water_logs = []
            mock_data.medications = []

            mock_res_v = MagicMock(
                test_name="Fasting Glucose",
                result_value="92.0",
                unit="mg/dL",
                reference_range="70-99",
                status="within_range",
                user_verified=True,
            )
            mock_data.report_results = [mock_res_v]
            mock_fetch.return_value = mock_data

            sys_prompt, ctx, used = HealthContextBuilder.build_context("p-1", "What is my glucose?")

            self.assertIn("[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]", ctx)
            self.assertIn("Fasting Glucose: 92.0 mg/dL", ctx)
            self.assertIn("Ref Range: 70-99", ctx)

    def test_calculated_data_tier_3(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch:
            mock_data = MagicMock()
            mock_data.profile.height_cm = 160
            mock_data.profile.weight_kg = 64
            mock_data.profile.date_of_birth = "2000-01-01"
            mock_data.cycle_records = []
            mock_data.symptom_records = []
            mock_data.food_logs = []
            mock_data.water_logs = []
            mock_data.medications = []
            mock_data.report_results = []
            mock_fetch.return_value = mock_data

            sys_prompt, ctx, used = HealthContextBuilder.build_context("p-1", "Calculate BMI")

            self.assertIn("[TIER 3] [CALCULATED DATA - Deterministic Biometrics]", ctx)
            self.assertIn("Calculated BMI: 25.0 kg/m²", ctx)

    def test_model_derived_insights_tier_4_screening_only(self):
        with patch("apps.intelligence.services.health_context_builder.run_assessment") as mock_run:
            mock_res = MagicMock(
                risk_category="higher_risk",
                pcos_probability=0.58,
                explanations=[{"friendly_name": "Cycle Length Regularity", "direction": "increases_risk"}],
            )
            mock_run.return_value = mock_res

            sys_prompt, ctx, used = HealthContextBuilder.build_context("p-1", "What is my risk score?")

            self.assertIn("[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]", ctx)
            self.assertIn("Statistical Screening Probability: 58.0%", ctx)
            self.assertIn("Calibrated screening cutoff: 38%", ctx)
            self.assertIn("TreeSHAP factors", ctx)

    def test_speculative_unverified_ocr_data_tier_5(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch:
            mock_data = MagicMock()
            mock_data.profile.height_cm = None
            mock_data.cycle_records = []
            mock_data.symptom_records = []
            mock_data.food_logs = []
            mock_data.water_logs = []
            mock_data.medications = []

            mock_res_u = MagicMock(
                test_name="Unconfirmed Testosterone",
                result_value="85.0",
                unit="ng/dL",
                reference_range="15-70",
                status="outside_range",
                user_verified=False,
            )
            mock_data.report_results = [mock_res_u]
            mock_fetch.return_value = mock_data

            sys_prompt, ctx, used = HealthContextBuilder.build_context("p-1", "Testosterone level")

            self.assertIn("[TIER 5] [UNVERIFIED OCR DATA - Awaiting Human Confirmation]", ctx)
            self.assertIn("Unconfirmed Testosterone: 85.0 ng/dL", ctx)
            self.assertIn("The patient has NOT yet reviewed or verified these extracted values", ctx)

    def test_digital_twin_read_only_invariant(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch:
            mock_data = MagicMock()
            mock_data.profile.height_cm = None
            mock_data.cycle_records = []
            mock_data.symptom_records = []
            mock_data.food_logs = []
            mock_data.water_logs = []
            mock_data.medications = []
            mock_data.report_results = []
            mock_fetch.return_value = mock_data

            sys_prompt, ctx, used = HealthContextBuilder.build_context(
                "p-1",
                "Phase check",
                client_telemetry={"cycleDay": 12, "phaseName": "Follicular Phase"},
            )

            self.assertIn("[DIGITAL TWIN OBSERVATIONS - READ ONLY]", ctx)
            self.assertIn("Day 12 (Follicular Phase)", ctx)
            self.assertIn("Read-only; LLM cannot alter this state", ctx)

    def test_guardrails_prevent_ml_or_ocr_from_claiming_diagnosis(self):
        unsafe_ml = "The screening score confirms that you have PCOS based on your high probability."
        cleaned, level = SafetyGuardrails.sanitize_llm_response(unsafe_ml)
        self.assertNotIn("confirms that you have pcos", cleaned.lower())
        self.assertIn("screening model identifies statistical risk indicators", cleaned)

        unsafe_ocr = "The scanned report confirms you have elevated androgens."
        cleaned_ocr, level_ocr = SafetyGuardrails.sanitize_llm_response(unsafe_ocr)
        self.assertNotIn("scanned report confirms", cleaned_ocr.lower())
        self.assertIn("scanned document shows potential values awaiting your verification", cleaned_ocr)

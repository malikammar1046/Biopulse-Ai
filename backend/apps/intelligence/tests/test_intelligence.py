"""
OvaSense Intelligence Layer — Automated Tests.

Tests the real Ovasense-ML Joblib model integration:
  1. Model loading & metadata verification (ExtraTreesClassifier, 16 features, threshold 0.38)
  2. Feature construction (exact 16-feature DataFrame, missing-data NaN handling)
  3. Prediction (probabilities, thresholding at 0.38, risk categories)
  4. TreeSHAP explainability (attributions, directions, magnitudes)
  5. Authentication (JWT enforcement, 401 on invalid/missing tokens)
  6. Patient isolation & API endpoints (/status/, /health/, /assessment/)
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

# Ensure repo root and Ovasense-ML are on Python path
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
_ML_ROOT = _REPO_ROOT / "Ovasense-ML"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))

from apps.authentication.supabase_auth import SupabaseUser
from apps.health.services.supabase_health_service import (
    PatientHealthData,
    PatientProfile,
    CycleRecordData,
    SymptomRecordData,
    FitnessLogData,
    FoodLogData,
    MedicationData,
    ReportResultData,
)
from apps.intelligence.services.ovasense_ml_bridge import (
    ovasense_ml_bridge,
    RAW_FEATURE_NAMES,
    SCREENING_THRESHOLD,
    LOWER_RISK_CUTOFF,
)


def _build_test_health_data(
    dob="1998-05-15",
    weight=62.0,
    height=165.0,
    period_regularity="very_regular",
    cycle_length="28",
    symptoms=None,
    cycle_records=None,
):
    profile = PatientProfile(
        user_id="test-patient-uuid-1234",
        date_of_birth=dob,
        height_cm=height,
        weight_kg=weight,
        cycle_length=cycle_length,
        period_regularity=period_regularity,
        common_symptoms=symptoms or [],
        activity_level="moderate",
        sleep_hours=7.5,
        daily_water_glasses=8,
    )
    return PatientHealthData(
        profile=profile,
        cycle_records=cycle_records or [],
        symptom_records=[],
        fitness_logs=[],
        food_logs=[],
        medications=[],
        medication_logs=[],
        report_results=[],
    )


class TestModelLoading(TestCase):
    """Test Joblib model loading and metadata."""

    def test_model_loads_successfully(self):
        ovasense_ml_bridge.load()
        self.assertTrue(ovasense_ml_bridge.is_ready)

    def test_metadata_structure(self):
        meta = ovasense_ml_bridge.metadata
        self.assertEqual(meta["feature_count"], 16)
        self.assertEqual(meta["screening_threshold"], 0.38)
        self.assertEqual(meta["classifier"], "ExtraTreesClassifier")
        self.assertEqual(meta["framework"], "scikit-learn")


class TestFeatureExtraction(TestCase):
    """Test 16-feature DataFrame construction and missing-data behavior."""

    def test_exact_16_features_extracted(self):
        health_data = _build_test_health_data()
        df, dq = ovasense_ml_bridge.extract_features(health_data)

        self.assertEqual(list(df.columns), RAW_FEATURE_NAMES)
        self.assertEqual(len(df), 1)
        self.assertFalse(np.isnan(df.at[0, " Age (yrs)"]))
        self.assertEqual(df.at[0, "Weight (Kg)"], 62.0)
        self.assertEqual(df.at[0, "Height(Cm) "], 165.0)
        self.assertEqual(df.at[0, "BMI"], 22.8)
        self.assertEqual(df.at[0, "Cycle(R/I)"], 2.0)

    def test_irregular_cycle_mapping(self):
        health_data = _build_test_health_data(period_regularity="irregular")
        df, _ = ovasense_ml_bridge.extract_features(health_data)
        self.assertEqual(df.at[0, "Cycle(R/I)"], 4.0)

    def test_missing_data_stays_nan(self):
        """Ensure uncollected fields remain NaN so the pipeline's imputer handles them."""
        empty_profile = PatientProfile(user_id="empty-user")
        health_data = PatientHealthData(profile=empty_profile)

        df, dq = ovasense_ml_bridge.extract_features(health_data)
        self.assertTrue(np.isnan(df.at[0, "Marraige Status (Yrs)"]))
        self.assertTrue(np.isnan(df.at[0, "Pregnant(Y/N)"]))
        self.assertTrue(np.isnan(df.at[0, "No. of aborptions"]))
        self.assertEqual(dq.quality_level, "insufficient_data")

    def test_symptom_mapping_to_binary_flags(self):
        health_data = _build_test_health_data(symptoms=["hirsutism", "cystic_acne", "hair_thinning"])
        df, _ = ovasense_ml_bridge.extract_features(health_data)

        self.assertEqual(df.at[0, "hair growth(Y/N)"], 1.0)
        self.assertEqual(df.at[0, "Pimples(Y/N)"], 1.0)
        self.assertEqual(df.at[0, "Hair loss(Y/N)"], 1.0)


class TestPrediction(TestCase):
    """Test model prediction, probability output, and screening threshold logic."""

    def setUp(self):
        ovasense_ml_bridge.load()

    def test_prediction_output_bounds(self):
        health_data = _build_test_health_data()
        df, _ = ovasense_ml_bridge.extract_features(health_data)
        pred = ovasense_ml_bridge.predict(df)

        self.assertIn("pcos_probability", pred)
        self.assertIn("non_pcos_probability", pred)
        self.assertIn("risk_category", pred)
        self.assertIn("screening_threshold", pred)
        self.assertIn("is_higher_risk", pred)

        pcos_p = pred["pcos_probability"]
        non_p = pred["non_pcos_probability"]
        self.assertGreaterEqual(pcos_p, 0.0)
        self.assertLessEqual(pcos_p, 1.0)
        self.assertAlmostEqual(pcos_p + non_p, 1.0, places=4)
        self.assertEqual(pred["screening_threshold"], 0.38)

    def test_threshold_classification(self):
        test_cases = [
            (0.15, "lower_risk", False),
            (0.30, "intermediate_risk", False),
            (0.38, "higher_risk", True),
            (0.75, "higher_risk", True),
        ]
        for prob, expected_cat, expected_high in test_cases:
            if prob < LOWER_RISK_CUTOFF:
                cat = "lower_risk"
            elif prob < SCREENING_THRESHOLD:
                cat = "intermediate_risk"
            else:
                cat = "higher_risk"
            self.assertEqual(cat, expected_cat)
            self.assertEqual(prob >= SCREENING_THRESHOLD, expected_high)


class TestTreeSHAPExplainability(TestCase):
    """Test TreeSHAP feature attributions on the ExtraTreesClassifier."""

    def setUp(self):
        ovasense_ml_bridge.load()

    def test_explain_returns_top_factors(self):
        health_data = _build_test_health_data(
            period_regularity="irregular",
            symptoms=["hirsutism", "skin_darkening", "acne"],
        )
        df, _ = ovasense_ml_bridge.extract_features(health_data)
        explanations = ovasense_ml_bridge.explain(df, top_n=5)

        self.assertIsInstance(explanations, list)
        self.assertGreater(len(explanations), 0)
        self.assertLessEqual(len(explanations), 5)

        first = explanations[0]
        self.assertIn("feature", first)
        self.assertIn("human_label", first)
        self.assertIn("direction", first)
        self.assertIn(first["direction"], ["increases_risk", "decreases_risk"])
        self.assertIn("magnitude", first)
        self.assertGreaterEqual(first["magnitude"], 0.0)
        self.assertIn("patient_explanation", first)


class TestAuthenticationAndSecurity(TestCase):
    """Test JWT authentication and endpoint permissions."""

    def setUp(self):
        self.client = APIClient()

    def test_status_endpoint_is_public(self):
        url = reverse("intelligence-status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["model"]["feature_count"], 16)
        self.assertEqual(data["model"]["screening_threshold"], 0.38)

    def test_health_endpoint_requires_auth(self):
        url = reverse("intelligence-health")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)

    def test_assessment_endpoint_requires_auth(self):
        url = reverse("intelligence-assessment")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, 401)


class TestEndToEndAssessmentPipeline(TestCase):
    """Test end-to-end assessment execution with mocked Supabase health service."""

    def setUp(self):
        self.client = APIClient()
        self.test_user = SupabaseUser(
            id="auth-test-uuid-9999",
            email="patient@example.com",
            role="authenticated",
            raw_token="fake-jwt-token",
        )
        self.client.force_authenticate(user=self.test_user)

    @patch("apps.intelligence.services.intelligence_orchestrator.health_service")
    def test_assessment_endpoint_success(self, mock_health_service):
        mock_health_data = _build_test_health_data(
            period_regularity="irregular",
            symptoms=["hirsutism", "acne"],
        )
        mock_health_service.fetch_all.return_value = mock_health_data

        url = reverse("intelligence-assessment")
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Verify patient isolation: fetch_all called with authenticated user UUID and token
        mock_health_service.fetch_all.assert_called_once_with("auth-test-uuid-9999", auth_token="fake-jwt-token")

        # Verify output payload fields
        self.assertIn("risk_category", data)
        self.assertIn("pcos_probability", data)
        self.assertIn("screening_threshold", data)
        self.assertEqual(data["screening_threshold"], 0.38)
        self.assertIn("is_higher_risk", data)
        self.assertIn("data_quality", data)
        self.assertIn("explanations", data)
        self.assertIn("disclaimer", data)
        self.assertTrue(data["shap_enabled"])
        self.assertEqual(data["backend_mode"], "ml")

    @patch("apps.intelligence.services.intelligence_orchestrator.health_service")
    def test_insufficient_data_handling(self, mock_health_service):
        empty_profile = PatientProfile(user_id="empty-patient-id")
        empty_data = PatientHealthData(profile=empty_profile)
        mock_health_service.fetch_all.return_value = empty_data

        url = reverse("intelligence-assessment")
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["risk_category"], "insufficient_data")
        self.assertIsNone(data["pcos_probability"])
        self.assertEqual(data["data_quality"]["quality_level"], "insufficient_data")
        self.assertFalse(data["shap_enabled"])

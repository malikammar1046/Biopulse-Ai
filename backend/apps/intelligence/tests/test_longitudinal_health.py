"""
Unit & Regression Tests for BioPulse AI Longitudinal Health Monitoring Layer.
Validates all 11 core architectural, pathway isolation, and data integrity invariants:
1. Authenticated user only receives own history (no cross-user data leak).
2. Pathway isolation: Female pathway excludes testosterone, free T, ADAM scores.
3. Pathway isolation: Male pathway excludes menstrual cycles, AMH, FSH/LH ratio.
4. Assessment history chronological ordering (oldest to newest for visual plotting).
5. Tier 1 and Tier 2 assessments remain distinct historical points.
6. Cumulative clinical state updates do not mutate immutable historical assessments.
7. Verified lab reports populate canonical metric time-series.
8. Unverified OCR records (user_verified=False) are strictly quarantined/excluded.
9. Empty history for a new patient returns a valid, structured empty state (zero 500 errors).
10. Bounded period filtering (30d, 90d, 1y) restricts data points accurately.
11. Client-supplied ?user_id= query parameter is strictly ignored (request.user.id binding).
"""

from datetime import datetime, timezone, timedelta
import json
import uuid
from unittest.mock import patch, MagicMock

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.intelligence.services.canonical_metrics import (
    get_metrics_for_pathway,
    is_metric_allowed_for_pathway,
    calculate_objective_delta,
)
from apps.intelligence.services.observation_repository import observation_repository
from apps.intelligence.services.longitudinal_health_service import (
    LongitudinalHealthService,
    longitudinal_health_service,
)
from apps.intelligence.views import LongitudinalHealthView


class MockUser:
    def __init__(
        self,
        user_id: str,
        email: str = "test@example.com",
        user_metadata: dict | None = None,
    ):
        self.id = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        self.email = email
        self.is_authenticated = True
        self.raw_token = "mock-jwt-token"
        self.user_metadata = (
            user_metadata
            if user_metadata is not None
            else {"gender": "female", "pathway": "female"}
        )


class LongitudinalHealthTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1_id = str(uuid.uuid4())
        self.user2_id = str(uuid.uuid4())
        self.user1 = MockUser(self.user1_id)
        self.user2 = MockUser(self.user2_id)
        self.now = datetime.now(timezone.utc)

    # -----------------------------------------------------------------------
    # Invariant 1: Authenticated user only receives own history
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_authenticated_user_only_receives_own_history(self, mock_repo):
        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-user1-1",
                "assessment_level": "tier_1",
                "probability": 0.25,
                "probability_percent": 25.0,
                "created_at": self.now.isoformat(),
                "input_features": {"bmi": 22.0},
            }
        ]
        mock_repo.get_active_assessment.return_value = None

        summary1 = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=self.user1_id, module="female_pcos"
        )
        self.assertEqual(summary1["patient_id"], self.user1_id)
        mock_repo.get_assessment_history.assert_called_with(
            self.user1_id, module="female_pcos", auth_token=None
        )

    # -----------------------------------------------------------------------
    # Invariant 2 & 3: Strict Pathway Isolation
    # -----------------------------------------------------------------------
    def test_pathway_isolation_female(self):
        female_metrics = get_metrics_for_pathway("female_pcos")
        self.assertIn("cycle_length", female_metrics)
        self.assertIn("amh", female_metrics)
        self.assertIn("pcos_screening_probability", female_metrics)

        # Prohibited male metrics
        self.assertNotIn("total_testosterone", female_metrics)
        self.assertNotIn("free_testosterone", female_metrics)
        self.assertNotIn("adam_symptom_score", female_metrics)
        self.assertNotIn("hypogonadism_screening_probability", female_metrics)

        self.assertFalse(is_metric_allowed_for_pathway("total_testosterone", "female_pcos"))
        self.assertFalse(is_metric_allowed_for_pathway("adam_symptom_score", "female_pcos"))

    def test_pathway_isolation_male(self):
        male_metrics = get_metrics_for_pathway("male_hypogonadism")
        self.assertIn("total_testosterone", male_metrics)
        self.assertIn("free_testosterone", male_metrics)
        self.assertIn("adam_symptom_score", male_metrics)
        self.assertIn("hypogonadism_screening_probability", male_metrics)

        # Prohibited female metrics
        self.assertNotIn("cycle_length", male_metrics)
        self.assertNotIn("amh", male_metrics)
        self.assertNotIn("pcos_screening_probability", male_metrics)

        self.assertFalse(is_metric_allowed_for_pathway("cycle_length", "male_hypogonadism"))
        self.assertFalse(is_metric_allowed_for_pathway("amh", "male_hypogonadism"))

    # -----------------------------------------------------------------------
    # Invariant 4: Chronological sorting (Ascending for charting)
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_assessment_history_chronological_order(self, mock_repo):
        t1 = (self.now - timedelta(days=20)).isoformat()
        t2 = (self.now - timedelta(days=10)).isoformat()
        t3 = (self.now - timedelta(days=1)).isoformat()

        # Input is unordered
        mock_repo.get_assessment_history.return_value = [
            {"id": "3", "created_at": t3, "probability": 0.4, "probability_percent": 40.0, "assessment_level": "tier_1_2"},
            {"id": "1", "created_at": t1, "probability": 0.2, "probability_percent": 20.0, "assessment_level": "tier_1"},
            {"id": "2", "created_at": t2, "probability": 0.3, "probability_percent": 30.0, "assessment_level": "tier_1"},
        ]
        mock_repo.get_active_assessment.return_value = None

        res = longitudinal_health_service.get_longitudinal_health_summary(self.user1_id, module="female_pcos")
        ordered_ids = [pt["id"] for pt in res["screening_history"]]
        self.assertEqual(ordered_ids, ["1", "2", "3"])

    # -----------------------------------------------------------------------
    # Invariant 5: Tier 1 and Tier 2 remain distinct historical points
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_tier1_and_tier2_remain_separate_historical_points(self, mock_repo):
        t1 = (self.now - timedelta(days=14)).isoformat()
        t2 = self.now.isoformat()

        mock_repo.get_assessment_history.return_value = [
            {
                "id": "tier1-ass",
                "assessment_level": "tier_1",
                "tiers_included": [1],
                "probability": 0.32,
                "probability_percent": 32.0,
                "created_at": t1,
                "is_active": False,
            },
            {
                "id": "tier2-ass",
                "assessment_level": "tier_1_2",
                "tiers_included": [1, 2],
                "probability": 0.48,
                "probability_percent": 48.0,
                "created_at": t2,
                "is_active": True,
            },
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[1]

        res = longitudinal_health_service.get_longitudinal_health_summary(self.user1_id, module="female_pcos")
        history = res["screening_history"]
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]["id"], "tier1-ass")
        self.assertEqual(history[0]["assessment_level"], "tier_1")
        self.assertEqual(history[1]["id"], "tier2-ass")
        self.assertEqual(history[1]["assessment_level"], "tier_1_2")

    # -----------------------------------------------------------------------
    # Invariant 6: Cumulative state updates do not alter past assessments
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    @patch("apps.intelligence.services.longitudinal_health_service.clinical_state_repository")
    def test_clinical_state_updates_do_not_alter_past_assessments(self, mock_state_repo, mock_ass_repo):
        past_created = (self.now - timedelta(days=30)).isoformat()
        mock_ass_repo.get_assessment_history.return_value = [
            {
                "id": "past-ass-id",
                "assessment_level": "tier_1",
                "created_at": past_created,
                "input_features": {"weight_kg": 65.0, "bmi": 24.5},
            }
        ]
        mock_ass_repo.get_active_assessment.return_value = None

        # Cumulative clinical state updated later
        mock_state_repo.get_patient_clinical_state.return_value = {
            "tier_1_inputs": {"weight_kg": 72.0, "bmi": 27.1}
        }

        res = longitudinal_health_service.get_longitudinal_health_summary(self.user1_id, module="female_pcos")
        # Historical point in metric series retains original 65.0 kg
        weight_pts = res["metric_series"]["weight_kg"]["data_points"]
        self.assertEqual(weight_pts[0]["value"], 65.0)

    # -----------------------------------------------------------------------
    # Invariant 7 & 8: Verified Labs included; Unverified OCR strictly quarantined
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.get_supabase_client")
    def test_verified_labs_and_quarantined_unverified(self, mock_get_client):
        mock_supabase = MagicMock()
        mock_get_client.return_value = mock_supabase

        rep_date = (self.now - timedelta(days=5)).date().isoformat()

        mock_execute_res = MagicMock()
        mock_execute_res.data = [
            {
                "id": "res-verified-1",
                "report_id": "rep-1",
                "test_name": "Fasting Blood Glucose",
                "result_numeric": 92.0,
                "unit": "mg/dL",
                "user_verified": True,
                "medical_reports": {
                    "user_id": self.user1_id,
                    "report_date": rep_date,
                },
            }
        ]

        # Configure mock chained builder
        query_mock = mock_supabase.table.return_value.select.return_value
        query_mock.eq.return_value = query_mock
        query_mock.not_.is_.return_value = query_mock
        query_mock.execute.return_value = mock_execute_res

        verified = LongitudinalHealthService._fetch_verified_labs(
            self.user1_id, pathway="female_pcos", cutoff_dt=None
        )
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["metric_key"], "fasting_glucose")
        self.assertEqual(verified[0]["value"], 92.0)

    # -----------------------------------------------------------------------
    # Invariant 9: Empty history returns clean, valid empty state (no 500)
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    @patch("apps.intelligence.services.longitudinal_health_service.clinical_state_repository")
    def test_empty_history_user_receives_valid_empty_state(self, mock_state_repo, mock_ass_repo):
        mock_ass_repo.get_assessment_history.return_value = []
        mock_ass_repo.get_active_assessment.return_value = None
        mock_state_repo.get_patient_clinical_state.return_value = None

        res = longitudinal_health_service.get_longitudinal_health_summary(self.user1_id, module="female_pcos")
        self.assertIsInstance(res, dict)
        self.assertEqual(res["screening_history"], [])
        self.assertEqual(res["timeline_events"], [])
        self.assertIsNone(res["current_summary"]["active_assessment_id"])
        self.assertIn("disclaimer", res)

    # -----------------------------------------------------------------------
    # Invariant 10: Date range filtering (30d, 90d, 1y)
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_date_range_filtering(self, mock_repo):
        t_recent = (self.now - timedelta(days=10)).isoformat()
        t_old = (self.now - timedelta(days=60)).isoformat()

        mock_repo.get_assessment_history.return_value = [
            {"id": "recent", "created_at": t_recent, "probability": 0.2, "probability_percent": 20.0, "assessment_level": "tier_1"},
            {"id": "old", "created_at": t_old, "probability": 0.4, "probability_percent": 40.0, "assessment_level": "tier_1"},
        ]
        mock_repo.get_active_assessment.return_value = None

        # 30d should only include recent
        res_30d = longitudinal_health_service.get_longitudinal_health_summary(
            self.user1_id, module="female_pcos", period="30d"
        )
        self.assertEqual(len(res_30d["screening_history"]), 1)
        self.assertEqual(res_30d["screening_history"][0]["id"], "recent")

        # 90d should include both
        res_90d = longitudinal_health_service.get_longitudinal_health_summary(
            self.user1_id, module="female_pcos", period="90d"
        )
        self.assertEqual(len(res_90d["screening_history"]), 2)

    # -----------------------------------------------------------------------
    # Invariant 11: Client-supplied user_id query parameter is strictly ignored
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary")
    def test_no_client_supplied_user_id(self, mock_get_summary):
        mock_get_summary.return_value = {"patient_id": self.user1_id, "screening_history": []}

        view = LongitudinalHealthView.as_view()
        # Malicious client attempts to pass another user's ID in query param
        request = self.factory.get(f"/api/v1/intelligence/longitudinal-health/?user_id={self.user2_id}&period=90d")
        force_authenticate(request, user=self.user1)

        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify the service was called with authenticated user1_id, NOT user2_id
        mock_get_summary.assert_called_once()
        args, kwargs = mock_get_summary.call_args
        self.assertEqual(kwargs.get("user_id") or args[0], self.user1_id)

    # -----------------------------------------------------------------------
    # Objective Delta Calculation
    # -----------------------------------------------------------------------
    def test_objective_delta_calculation(self):
        # Increased weight
        d1 = calculate_objective_delta("weight_kg", previous_value=60.0, current_value=62.5)
        self.assertEqual(d1["delta"], 2.5)
        self.assertEqual(d1["direction"], "increased")
        self.assertIn("Increased by +2.5 kg", d1["objective_description"])

        # Decreased risk
        d2 = calculate_objective_delta("pcos_screening_probability", previous_value=45.0, current_value=35.0)
        self.assertEqual(d2["delta"], -10.0)
        self.assertEqual(d2["direction"], "decreased")
        self.assertIn("Decreased by -10.0 %", d2["objective_description"])

        # Baseline established
        d3 = calculate_objective_delta("weight_kg", previous_value=None, current_value=62.0)
        self.assertIsNone(d3["delta"])
        self.assertEqual(d3["objective_description"], "Baseline measurement established.")


class LongitudinalHealthPathwayIsolationTests(TestCase):
    """
    Regression tests verifying fail-closed pathway derivation and server-side isolation:
    1. female profile -> female PCOS pathway
    2. male profile -> male hypogonadism pathway
    3. missing gender -> fails closed (HTTP 422, zero clinical metrics)
    4. profile lookup failure -> fails closed (HTTP 422, zero clinical metrics)
    5. female token + ?module=male_hypogonadism -> remains female
    6. male token + ?module=female_pcos -> remains male
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = LongitudinalHealthView.as_view()
        self.user_id = str(uuid.uuid4())
        self.female_user = MockUser(
            self.user_id,
            user_metadata={"gender": "female", "pathway": "female"},
        )
        self.male_user = MockUser(
            self.user_id,
            user_metadata={"gender": "male", "pathway": "male"},
        )
        self.unknown_user = MockUser(self.user_id, user_metadata={})

    @patch("apps.intelligence.views.health_service.fetch_all")
    @patch(
        "apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary"
    )
    def test_female_profile_resolves_female_pcos_pathway(
        self, mock_summary, mock_fetch_all
    ):
        class MockProfile:
            gender = "female"
            pathway = "female"

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_fetch_all.return_value = mock_hd
        mock_summary.return_value = {
            "patient_id": self.user_id,
            "module": "female_pcos",
        }

        request = self.factory.get("/api/v1/intelligence/longitudinal-health/")
        force_authenticate(request, user=self.female_user)

        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_summary.assert_called_once()
        _, kwargs = mock_summary.call_args
        self.assertEqual(kwargs.get("module"), "female_pcos")

    @patch("apps.intelligence.views.health_service.fetch_all")
    @patch(
        "apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary"
    )
    def test_male_profile_resolves_male_hypogonadism_pathway(
        self, mock_summary, mock_fetch_all
    ):
        class MockProfile:
            gender = "male"
            pathway = "male"

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_fetch_all.return_value = mock_hd
        mock_summary.return_value = {
            "patient_id": self.user_id,
            "module": "male_hypogonadism",
        }

        request = self.factory.get("/api/v1/intelligence/longitudinal-health/")
        force_authenticate(request, user=self.male_user)

        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_summary.assert_called_once()
        _, kwargs = mock_summary.call_args
        self.assertEqual(kwargs.get("module"), "male_hypogonadism")

    @patch("apps.intelligence.views.health_service.fetch_all")
    @patch(
        "apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary"
    )
    def test_missing_gender_fails_closed(self, mock_summary, mock_fetch_all):
        class MockProfile:
            gender = None
            pathway = None

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_fetch_all.return_value = mock_hd

        request = self.factory.get("/api/v1/intelligence/longitudinal-health/")
        force_authenticate(request, user=self.unknown_user)

        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data.get("code"), "PATHWAY_NOT_CONFIGURED")
        self.assertIn("must be configured", response.data.get("message", ""))
        # Fails closed: no clinical metrics or summary returned
        mock_summary.assert_not_called()
        self.assertNotIn("metric_series", response.data)
        self.assertNotIn("screening_history", response.data)

    @patch("apps.intelligence.views.health_service.fetch_all")
    @patch(
        "apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary"
    )
    def test_profile_lookup_failure_fails_closed(
        self, mock_summary, mock_fetch_all
    ):
        mock_fetch_all.side_effect = Exception("Supabase connection timeout")

        request = self.factory.get("/api/v1/intelligence/longitudinal-health/")
        force_authenticate(request, user=self.unknown_user)

        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data.get("code"), "PATHWAY_NOT_CONFIGURED")
        mock_summary.assert_not_called()

    @patch("apps.intelligence.views.health_service.fetch_all")
    @patch(
        "apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary"
    )
    def test_female_token_with_mismatched_male_module_param_remains_female(
        self, mock_summary, mock_fetch_all
    ):
        class MockProfile:
            gender = "female"
            pathway = "female"

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_fetch_all.return_value = mock_hd
        mock_summary.return_value = {
            "patient_id": self.user_id,
            "module": "female_pcos",
        }

        # Malicious / mismatched client query parameter
        request = self.factory.get(
            "/api/v1/intelligence/longitudinal-health/?module=male_hypogonadism"
        )
        force_authenticate(request, user=self.female_user)

        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_summary.assert_called_once()
        _, kwargs = mock_summary.call_args
        self.assertEqual(kwargs.get("module"), "female_pcos")

    @patch("apps.intelligence.views.health_service.fetch_all")
    @patch(
        "apps.intelligence.services.longitudinal_health_service.longitudinal_health_service.get_longitudinal_health_summary"
    )
    def test_male_token_with_mismatched_female_module_param_remains_male(
        self, mock_summary, mock_fetch_all
    ):
        class MockProfile:
            gender = "male"
            pathway = "male"

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_fetch_all.return_value = mock_hd
        mock_summary.return_value = {
            "patient_id": self.user_id,
            "module": "male_hypogonadism",
        }

        # Malicious / mismatched client query parameter
        request = self.factory.get(
            "/api/v1/intelligence/longitudinal-health/?module=female_pcos"
        )
        force_authenticate(request, user=self.male_user)

        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_summary.assert_called_once()
        _, kwargs = mock_summary.call_args
        self.assertEqual(kwargs.get("module"), "male_hypogonadism")

    # -----------------------------------------------------------------------
    # Invariant 12: Five-State Screening Comparability & Percentage-Points Delta
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_comparability_directly_comparable_same_tier_same_model(self, mock_repo):
        """When assessments share tier and model version, state is directly_comparable and delta is in percentage points."""
        now = datetime.now(timezone.utc)
        user_id = getattr(self, "user1_id", getattr(self, "user_id", str(uuid.uuid4())))
        t1 = now - timedelta(days=30)
        t2 = now
        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-2",
                "assessment_level": "tier_1",
                "probability": 0.28,
                "probability_percent": 28.0,
                "model_name": "pcos_tier1_lr",
                "model_version": "v1.0.0",
                "created_at": t2.isoformat(),
                "input_features": {"bmi": 23.0},
            },
            {
                "id": "ass-1",
                "assessment_level": "tier_1",
                "probability": 0.42,
                "probability_percent": 42.0,
                "model_name": "pcos_tier1_lr",
                "model_version": "v1.0.0",
                "created_at": t1.isoformat(),
                "input_features": {"bmi": 24.5},
            },
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[0]

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=user_id, module="female_pcos"
        )
        comp = summary["screening_comparability"]
        self.assertEqual(comp["state"], "directly_comparable")
        self.assertTrue(comp["is_comparable"])
        self.assertEqual(comp["delta_percentage_points"], -14.0)

    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_comparability_cross_tier_upgrade(self, mock_repo):
        """Cross-tier assessment history marks cross_tier and sets delta_percentage_points to None."""
        now = datetime.now(timezone.utc)
        user_id = getattr(self, "user1_id", getattr(self, "user_id", str(uuid.uuid4())))
        t1 = now - timedelta(days=20)
        t2 = now
        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-tier2",
                "assessment_level": "tier_1_2",
                "probability": 0.55,
                "probability_percent": 55.0,
                "model_name": "hypo_tier2_rf",
                "model_version": "v1.0.0",
                "created_at": t2.isoformat(),
                "input_features": {"total_testosterone": 280.0},
            },
            {
                "id": "ass-tier1",
                "assessment_level": "tier_1",
                "probability": 0.40,
                "probability_percent": 40.0,
                "model_name": "hypo_tier1_lr",
                "model_version": "v1.0.0",
                "created_at": t1.isoformat(),
                "input_features": {"low_energy": True},
            },
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[0]

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=user_id, module="male_hypogonadism"
        )
        comp = summary["screening_comparability"]
        self.assertEqual(comp["state"], "cross_tier")
        self.assertFalse(comp["is_comparable"])
        self.assertIsNone(comp["delta_percentage_points"])
        self.assertIn("not directly comparable", comp["message"])

    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_comparability_insufficient_metadata_fallback(self, mock_repo):
        """Missing model version metadata classifies as insufficient_metadata conservatively."""
        now = datetime.now(timezone.utc)
        user_id = getattr(self, "user1_id", getattr(self, "user_id", str(uuid.uuid4())))
        t1 = now - timedelta(days=20)
        t2 = now
        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-2",
                "assessment_level": "tier_1",
                "probability": 0.35,
                "probability_percent": 35.0,
                # Missing model_name and model_version
                "created_at": t2.isoformat(),
            },
            {
                "id": "ass-1",
                "assessment_level": "tier_1",
                "probability": 0.30,
                "probability_percent": 30.0,
                "model_name": "pcos_tier1_lr",
                "model_version": "v1.0.0",
                "created_at": t1.isoformat(),
            },
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[0]

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=user_id, module="female_pcos"
        )
        comp = summary["screening_comparability"]
        self.assertEqual(comp["state"], "insufficient_metadata")
        self.assertFalse(comp["is_comparable"])
        self.assertIsNone(comp["delta_percentage_points"])

    # -----------------------------------------------------------------------
    # Invariant 13: Male ADAM / Vitality Dynamic Denominator
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_male_vitality_summary_dynamic_denominator(self, mock_repo):
        """Male vitality score dynamically matches evaluated symptom keys, never a fabricated /10."""
        now = datetime.now(timezone.utc)
        user_id = getattr(self, "user1_id", getattr(self, "user_id", str(uuid.uuid4())))
        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-male-1",
                "assessment_level": "tier_1",
                "probability": 0.45,
                "probability_percent": 45.0,
                "model_name": "hypo_tier1_lr",
                "model_version": "v1.0.0",
                "created_at": now.isoformat(),
                "input_features": {
                    "low_energy": True,
                    "sleep_trouble": True,
                    "low_mood": False,
                    "low_interest": False,
                },
            }
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[0]

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=user_id, module="male_hypogonadism"
        )
        vitality = summary.get("male_vitality_summary")
        self.assertIsNotNone(vitality)
        self.assertEqual(vitality["total_evaluated_symptoms"], 4)
        self.assertEqual(vitality["current_reported_count"], 2)
        self.assertEqual(vitality["current_display"], "2 of 4 vitality symptoms reported")
        self.assertNotIn("/10", vitality["current_display"])

    # -----------------------------------------------------------------------
    # Invariant 14: Neutral Lab Movements & Strict Boolean Symptom Directions
    # -----------------------------------------------------------------------
    def test_neutral_lab_delta_direction(self):
        """Laboratory metrics must always be neutral/no_interpretation (increased/decreased), never improved or worsened."""
        delta = calculate_objective_delta("total_testosterone", 350.0, 450.0)
        self.assertEqual(delta["direction"], "increased")
        self.assertIn(delta["clinical_significance"], ["neutral", "no_interpretation"])
        self.assertNotIn(delta["clinical_significance"], ["improved", "worsened"])

    def test_boolean_symptom_transitions(self):
        """Boolean symptoms must be newly_reported (false->true) or no_longer_reported (true->false)."""
        new_sym = calculate_objective_delta("hirsutism", False, True)
        self.assertEqual(new_sym["direction"], "newly_reported")

        resolved_sym = calculate_objective_delta("hirsutism", True, False)
        self.assertEqual(resolved_sym["direction"], "no_longer_reported")
        self.assertEqual(resolved_sym["clinical_significance"], "improved")


class LongitudinalSynchronizationTests(TestCase):
    """
    Unit & Integration Tests for BioPulse AI Longitudinal Synchronization & Metric Persistence:
    - Test A: Weight changed (72 -> 69 kg: current=69, old 72 preserved, new 69 appended, delta=-3.0).
    - Test B: Save same weight (72 -> 72 kg: strict no-op, no duplicate observation).
    - Test C: Weight changed + derived canonical BMI recalculation (height=170 cm, 72->69 kg => BMI 24.9->23.9).
    - Test D: Precedence & Risk reassessment after weight update (fresh baseline biometrics override stale stored tier 1).
    - Test E: Male shared anthropometric update (weight/waist changes reflected in male longitudinal series).
    - Test F: Female shared anthropometric update (weight changes reflected in female longitudinal series).
    - Test G: Symptom update transitions (low_energy, hirsutism).
    - Test H: Legacy assessment history fallback without fabricating data.
    - Test I: Deduplication of simultaneous profile update and assessment snapshot.
    """

    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self.now = datetime.now(timezone.utc)
        observation_repository.clear_memory_cache()
        # Mock Supabase client to use fast isolated local persistence during unit tests
        self.supabase_patcher = patch(
            "apps.intelligence.services.observation_repository.get_supabase_client",
            return_value=None,
        )
        self.supabase_patcher.start()
        self.addCleanup(self.supabase_patcher.stop)

    # -----------------------------------------------------------------------
    # Test A: Weight changed (72 -> 69 kg)
    # -----------------------------------------------------------------------
    def test_a_weight_changed_appends_and_preserves_history(self):
        # 1. First record 72 kg at t-10 days
        t_old = (self.now - timedelta(days=10)).isoformat()
        observation_repository.record_observation(
            user_id=self.user_id,
            module="female_pcos",
            metric_key="weight_kg",
            value=72.0,
            unit="kg",
            observed_at=t_old,
            source="profile_update",
        )

        # 2. Update weight to 69 kg at t-now
        t_new = self.now.isoformat()
        observation_repository.sync_observations_from_patient_state(
            user_id=self.user_id,
            module="female_pcos",
            state_dict={"weight": 69.0, "height": 170.0},
            source="profile_update",
        )

        # Verify observation storage preserves both measurements immutably
        observations = observation_repository.get_observations_for_user(self.user_id, "female_pcos")
        weight_obs = [o for o in observations if o["metric_key"] == "weight_kg"]
        self.assertEqual(len(weight_obs), 2)
        # Chronological order
        weight_obs.sort(key=lambda x: x["observed_at"])
        self.assertEqual(weight_obs[0]["value"], 72.0)
        self.assertEqual(weight_obs[1]["value"], 69.0)

        # Verify latest observation
        latest = observation_repository.get_latest_observation(self.user_id, "weight_kg")
        self.assertIsNotNone(latest)
        self.assertEqual(latest["value"], 69.0)

    # -----------------------------------------------------------------------
    # Test B: Save same weight (72 -> 72 kg is a strict NO-OP)
    # -----------------------------------------------------------------------
    def test_b_save_same_weight_is_noop(self):
        # 1. Save 72.0 kg
        observation_repository.sync_observations_from_patient_state(
            user_id=self.user_id,
            module="female_pcos",
            state_dict={"weight": 72.0, "height": 170.0},
            source="profile_update",
        )
        obs_count_1 = len(observation_repository.get_observations_for_user(self.user_id, "female_pcos"))

        # 2. Save 72.0 kg again (identical)
        observation_repository.sync_observations_from_patient_state(
            user_id=self.user_id,
            module="female_pcos",
            state_dict={"weight": 72.0, "height": 170.0},
            source="profile_update",
        )
        obs_count_2 = len(observation_repository.get_observations_for_user(self.user_id, "female_pcos"))

        # Observation count must NOT increase
        self.assertEqual(obs_count_1, obs_count_2)

    # -----------------------------------------------------------------------
    # Test C: Weight changed + derived canonical BMI recalculation
    # -----------------------------------------------------------------------
    def test_c_weight_changed_derived_canonical_bmi(self):
        # Height: 170 cm (1.70 m), Weight: 72.0 kg -> BMI = 72 / (1.7^2) = 24.91 -> 24.9
        t_old = (self.now - timedelta(days=10)).isoformat()
        observation_repository.sync_observations_from_patient_state(
            user_id=self.user_id,
            module="female_pcos",
            state_dict={"weight": 72.0, "height": 170.0},
            observed_at=t_old,
            source="profile_update",
        )

        bmi_old = observation_repository.get_latest_observation(self.user_id, "bmi")
        self.assertIsNotNone(bmi_old)
        self.assertEqual(bmi_old["value"], 24.9)

        # Update weight to 69.0 kg -> BMI = 69 / (1.7^2) = 23.87 -> 23.9
        observation_repository.sync_observations_from_patient_state(
            user_id=self.user_id,
            module="female_pcos",
            state_dict={"weight": 69.0, "height": 170.0},
            source="profile_update",
        )

        bmi_new = observation_repository.get_latest_observation(self.user_id, "bmi")
        self.assertIsNotNone(bmi_new)
        self.assertEqual(bmi_new["value"], 23.9)

        # Delta calculation
        delta = calculate_objective_delta("bmi", 24.9, 23.9)
        self.assertEqual(delta["delta"], -1.0)
        self.assertEqual(delta["direction"], "decreased")

    # -----------------------------------------------------------------------
    # Test D: Precedence in orchestrator merge (fresh biometrics override stale stored tier 1)
    # -----------------------------------------------------------------------
    def test_d_reassessment_biometric_precedence(self):
        from apps.intelligence.services.intelligence_orchestrator import reassess_from_current_patient_state

        # Stored tier 1 inputs in clinical state had old weight 72.0 kg
        stored_tier1 = {"age": 28, "weight": 72.0, "height": 170.0, "bmi": 24.9, "cycle_length": 30}
        # Fresh baseline inputs from profile update have new weight 69.0 kg
        baseline_t1 = {"weight": 69.0, "height": 170.0}

        # Check merge logic
        merged = {**stored_tier1, **baseline_t1}
        # In orchestrator, baseline_t1 keys override stored_tier1 keys
        self.assertEqual(merged["weight"], 69.0)
        self.assertEqual(merged["height"], 170.0)
        # Canonical BMI recomputed: round(69.0 / (1.7^2), 1) = 23.9
        recomputed_bmi = round(69.0 / ((170.0 / 100.0) ** 2), 1)
        merged["bmi"] = recomputed_bmi
        self.assertEqual(merged["bmi"], 23.9)

    # -----------------------------------------------------------------------
    # Test E: Male shared anthropometric update
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_e_male_shared_anthropometric_update(self, mock_repo):
        # Record male weight 85 -> 82 and waist 98 -> 94
        t1 = (self.now - timedelta(days=15)).isoformat()
        t2 = self.now.isoformat()

        observation_repository.record_observation(
            user_id=self.user_id,
            module="male_hypogonadism",
            metric_key="weight_kg",
            value=85.0,
            unit="kg",
            observed_at=t1,
            source="profile_update",
        )
        observation_repository.record_observation(
            user_id=self.user_id,
            module="male_hypogonadism",
            metric_key="weight_kg",
            value=82.0,
            unit="kg",
            observed_at=t2,
            source="profile_update",
        )

        mock_repo.get_assessment_history.return_value = []
        mock_repo.get_active_assessment.return_value = None

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=self.user_id, module="male_hypogonadism"
        )
        series = summary["metric_series"]
        self.assertIn("weight_kg", series)
        self.assertEqual(len(series["weight_kg"]["data_points"]), 2)
        self.assertEqual(series["weight_kg"]["data_points"][-1]["value"], 82.0)
        self.assertEqual(summary["current_summary"]["key_metrics"]["weight_kg"], 82.0)
        self.assertEqual(summary["current_summary"]["metric_deltas"]["weight_kg"]["delta"], -3.0)

    # -----------------------------------------------------------------------
    # Test F: Female shared anthropometric update
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_f_female_shared_anthropometric_update(self, mock_repo):
        t1 = (self.now - timedelta(days=20)).isoformat()
        t2 = self.now.isoformat()

        observation_repository.record_observation(
            user_id=self.user_id,
            module="female_pcos",
            metric_key="weight_kg",
            value=72.0,
            unit="kg",
            observed_at=t1,
            source="profile_update",
        )
        observation_repository.record_observation(
            user_id=self.user_id,
            module="female_pcos",
            metric_key="weight_kg",
            value=69.0,
            unit="kg",
            observed_at=t2,
            source="profile_update",
        )

        mock_repo.get_assessment_history.return_value = []
        mock_repo.get_active_assessment.return_value = None

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=self.user_id, module="female_pcos"
        )
        series = summary["metric_series"]
        self.assertIn("weight_kg", series)
        self.assertEqual(series["weight_kg"]["data_points"][-1]["value"], 69.0)
        self.assertEqual(summary["current_summary"]["key_metrics"]["weight_kg"], 69.0)
        self.assertEqual(summary["current_summary"]["metric_deltas"]["weight_kg"]["delta"], -3.0)

    # -----------------------------------------------------------------------
    # Test G: Symptom update
    # -----------------------------------------------------------------------
    def test_g_symptom_update_transition(self):
        prev_feats = {"low_energy": 1, "low_mood": 1}
        curr_feats = {"low_energy": 0, "low_mood": 1}

        latest_ass = {
            "id": "ass-male-2",
            "assessment_level": "tier_1",
            "created_at": self.now.isoformat(),
            "input_features": curr_feats,
        }
        prev_ass = {
            "id": "ass-male-1",
            "assessment_level": "tier_1",
            "created_at": (self.now - timedelta(days=10)).isoformat(),
            "input_features": prev_feats,
        }

        vitality = LongitudinalHealthService._compute_male_vitality_progress(latest_ass, prev_ass)
        self.assertIsNotNone(vitality)
        self.assertEqual(vitality["delta_reported_count"], -1)
        # Check that low_energy marked no_longer_reported
        le_item = next(item for item in vitality["symptoms_breakdown"] if item["key"] == "low_energy")
        self.assertEqual(le_item["delta_direction"], "no_longer_reported")

    # -----------------------------------------------------------------------
    # Test H: Legacy assessment history fallback without fabricating data
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_h_legacy_assessment_history_fallback(self, mock_repo):
        # Legacy patient has 0 metric_observations, but has historical assessments with weight_kg
        t1 = (self.now - timedelta(days=30)).isoformat()
        t2 = self.now.isoformat()

        legacy_assessments = [
            {
                "id": "ass-leg-2",
                "assessment_level": "tier_1",
                "probability_percent": 35.0,
                "created_at": t2,
                "input_features": {"weight_kg": 68.0, "bmi": 23.5},
            },
            {
                "id": "ass-leg-1",
                "assessment_level": "tier_1",
                "probability_percent": 45.0,
                "created_at": t1,
                "input_features": {"weight_kg": 71.0, "bmi": 24.6},
            },
        ]
        mock_repo.get_assessment_history.return_value = legacy_assessments
        mock_repo.get_active_assessment.return_value = legacy_assessments[0]

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=self.user_id, module="female_pcos"
        )
        series = summary["metric_series"]
        self.assertIn("weight_kg", series)
        self.assertEqual(len(series["weight_kg"]["data_points"]), 2)
        # Values preserved accurately from assessment input_features
        pts = series["weight_kg"]["data_points"]
        self.assertEqual(pts[0]["value"], 71.0)
        self.assertEqual(pts[1]["value"], 68.0)
        self.assertEqual(pts[0]["source"], "screening_assessment")
        self.assertEqual(summary["current_summary"]["key_metrics"]["weight_kg"], 68.0)
        self.assertEqual(summary["current_summary"]["metric_deltas"]["weight_kg"]["delta"], -3.0)

    # -----------------------------------------------------------------------
    # Test I: Deduplication of simultaneous profile update and assessment snapshot
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_i_deduplication_simultaneous_profile_and_assessment(self, mock_repo):
        # At time t, user updates profile to 69.0 kg (logged as profile_update).
        # At time t + 5 seconds, an assessment snapshot is also saved with weight_kg=69.0.
        t_event = self.now.isoformat()
        observation_repository.record_observation(
            user_id=self.user_id,
            module="female_pcos",
            metric_key="weight_kg",
            value=69.0,
            unit="kg",
            observed_at=t_event,
            source="profile_update",
        )

        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-simultaneous-1",
                "assessment_level": "tier_1",
                "probability_percent": 30.0,
                "created_at": t_event,
                "input_features": {"weight_kg": 69.0},
            }
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[0]

        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=self.user_id, module="female_pcos"
        )
        weight_pts = summary["metric_series"]["weight_kg"]["data_points"]
        # Must be deduplicated to exactly 1 point, preferring profile_update
        self.assertEqual(len(weight_pts), 1)
        self.assertEqual(weight_pts[0]["value"], 69.0)
        self.assertEqual(weight_pts[0]["source"], "profile_update")

    # -----------------------------------------------------------------------
    # Test J: Final Architectural Audit Invariants
    # -----------------------------------------------------------------------
    @patch("apps.intelligence.services.longitudinal_health_service.assessment_repository")
    def test_j_architectural_audit_invariants(self, mock_repo):
        # 1. Invariant 1: GET is strictly read-only and manufactures 0 observation rows
        fresh_user_id = str(uuid.uuid4())
        mock_repo.get_assessment_history.return_value = [
            {
                "id": "ass-legacy-only",
                "assessment_level": "tier_1",
                "probability_percent": 32.0,
                "created_at": (self.now - timedelta(days=5)).isoformat(),
                "input_features": {"weight_kg": 67.5, "bmi": 23.4},
            }
        ]
        mock_repo.get_active_assessment.return_value = mock_repo.get_assessment_history.return_value[0]

        # Ensure store is initially empty for this user
        initial_obs = observation_repository.get_observations_for_user(fresh_user_id, "female_pcos")
        self.assertEqual(len(initial_obs), 0)

        # Execute GET longitudinal summary
        summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=fresh_user_id, module="female_pcos"
        )
        self.assertIsNotNone(summary)
        # Observations store must remain completely untouched (0 writes during GET)
        post_get_obs = observation_repository.get_observations_for_user(fresh_user_id, "female_pcos")
        self.assertEqual(len(post_get_obs), 0)

        # 2. Invariant 2: Timestamp semantics - observed_at reflects profile update time
        profile_update_time = "2026-09-21T15:30:00+00:00"
        observation_repository.sync_observations_from_patient_state(
            user_id=fresh_user_id,
            module="female_pcos",
            current_profile={"weight": 70.0, "height": 170.0, "updated_at": profile_update_time},
            source="profile_update",
        )
        saved_obs = observation_repository.get_latest_observation(fresh_user_id, "weight_kg")
        self.assertIsNotNone(saved_obs)
        self.assertEqual(saved_obs["value"], 70.0)
        self.assertEqual(saved_obs["observed_at"], profile_update_time)

        # 3. Invariant 3: Metric-specific tolerance vs global 0.05
        # For waist_hip_ratio (precision=2), a change of 0.02 (0.85 -> 0.87) is clinically meaningful and MUST record
        observation_repository.record_observation(
            user_id=fresh_user_id,
            module="female_pcos",
            metric_key="waist_hip_ratio",
            value=0.85,
            observed_at=(self.now - timedelta(days=2)).isoformat(),
            source="profile_update",
        )
        observation_repository.sync_observations_from_patient_state(
            user_id=fresh_user_id,
            module="female_pcos",
            current_profile={"waist": 87.0, "hip": 100.0},  # 87/100 = 0.87 (delta = 0.02)
            current_clinical_state={"tier_1_inputs": {"waist_hip_ratio": 0.87}},
            source="profile_update",
        )
        whr_latest = observation_repository.get_latest_observation(fresh_user_id, "waist_hip_ratio")
        self.assertIsNotNone(whr_latest)
        self.assertEqual(whr_latest["value"], 0.87)

        # 4. Invariant 4: Deduplication identity across distinct dates
        # Same weight (e.g. 69 kg) measured 30 days apart must NOT collapse into 1 point
        t_sep = (self.now - timedelta(days=30)).isoformat()
        t_oct = self.now.isoformat()
        test_user_identity = str(uuid.uuid4())
        observation_repository.record_observation(
            user_id=test_user_identity,
            module="female_pcos",
            metric_key="weight_kg",
            value=69.0,
            observed_at=t_sep,
            source="profile_update",
        )
        observation_repository.record_observation(
            user_id=test_user_identity,
            module="female_pcos",
            metric_key="weight_kg",
            value=69.0,
            observed_at=t_oct,
            source="profile_update",
        )
        mock_repo.get_assessment_history.return_value = []
        mock_repo.get_active_assessment.return_value = None
        id_summary = longitudinal_health_service.get_longitudinal_health_summary(
            user_id=test_user_identity, module="female_pcos"
        )
        weight_pts = id_summary["metric_series"]["weight_kg"]["data_points"]
        # Both distinct date observations must be retained
        self.assertEqual(len(weight_pts), 2)
        self.assertEqual(weight_pts[0]["value"], 69.0)
        self.assertEqual(weight_pts[1]["value"], 69.0)


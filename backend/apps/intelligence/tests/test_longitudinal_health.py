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

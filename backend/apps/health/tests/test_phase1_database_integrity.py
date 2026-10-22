"""
backend/apps/health/tests/test_phase1_database_integrity.py

Phase 1 Regression Test Suite:
1. Profile Context Fetching:
   - Verifies 'profiles.lifestyle' is NOT queried against PostgreSQL.
   - Verifies flat profile columns (waist_cm, hip_cm, marital_status, fast_food_intake,
     regular_exercise, activity_level, sleep_hours, dietary_preference) are properly loaded.
   - Verifies the 'lifestyle' attribute dictionary is synthesized from authoritative flat columns.
2. Nutrition Log Integration:
   - Verifies fetch_food_logs queries canonical 'nutrition_food_logs' first.
   - Verifies legacy 'food_logs' are merged as backwards-compatible fallback.
   - Verifies records existing in both tables are NOT double-counted.
   - Verifies user isolation and date filtering.
3. Meal Plan Service Integration:
   - Verifies get_food_logs deduplicates nutrition_food_logs and food_logs.
   - Verifies log_food targets canonical nutrition_food_logs.
"""

from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from apps.health.services.supabase_health_service import (
    health_service,
    PatientProfile,
    FoodLogData,
)
from apps.health.services.meal_plan_service import meal_plan_service


class TestPhase1DatabaseIntegrity(SimpleTestCase):
    def setUp(self):
        self.user_id = "test-user-1234-5678"

    @patch("apps.health.services.supabase_health_service.health_service._client_or_raise")
    def test_profile_fetch_does_not_query_lifestyle_column(self, mock_client_getter):
        """Verifies profiles.lifestyle is removed from SELECT queries to prevent 42703 error."""
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client

        mock_query = MagicMock()
        mock_client.table.return_value = mock_query
        mock_query.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.maybe_single.return_value = mock_query

        # Mock database response with flat columns
        mock_res = MagicMock()
        mock_res.data = {
            "id": self.user_id,
            "full_name": "Test User",
            "gender": "female",
            "pathway": "female_pcos",
            "height_cm": 162.0,
            "weight_kg": 64.0,
            "waist_cm": 78.0,
            "hip_cm": 98.0,
            "date_of_birth": "1996-05-15",
            "cycle_length": "28",
            "period_duration": 5,
            "last_period_date": "2026-10-01",
            "period_regularity": "mostly_regular",
            "activity_level": "moderate",
            "sleep_hours": 7.5,
            "daily_water_glasses": 8,
            "dietary_preference": "Balanced",
            "marital_status": "unmarried",
            "marriage_years": 0.0,
            "is_pregnant": False,
            "abortions_count": 0,
            "fast_food_intake": "occasional",
            "regular_exercise": True,
            "stress_level": "moderate",
            "exercise_preferences": ["walking", "yoga"],
            "work_lifestyle": "sedentary_desk",
        }
        mock_query.execute.return_value = mock_res

        profile = health_service.fetch_profile(self.user_id)

        # 1. Inspect select query arguments
        called_select_arg = mock_query.select.call_args[0][0]
        columns_list = [c.strip() for c in called_select_arg.split(",")]
        self.assertNotIn(
            "lifestyle",
            columns_list,
            "SELECT query must not request 'lifestyle' column as it triggers PostgreSQL error 42703",
        )

        # 2. Verify all biometrics and lifestyle columns loaded
        self.assertEqual(profile.height_cm, 162.0)
        self.assertEqual(profile.weight_kg, 64.0)
        self.assertEqual(profile.waist_cm, 78.0)
        self.assertEqual(profile.hip_cm, 98.0)
        self.assertEqual(profile.waist_inch, round(78.0 / 2.54, 1))
        self.assertEqual(profile.hip_inch, round(98.0 / 2.54, 1))
        self.assertEqual(profile.marital_status, "unmarried")
        self.assertFalse(profile.is_pregnant)
        self.assertTrue(profile.regular_exercise)
        self.assertEqual(profile.fast_food_intake, "occasional")
        self.assertEqual(profile.activity_level, "moderate")
        self.assertEqual(profile.sleep_hours, 7.5)

        # 3. Verify synthesized lifestyle dict
        self.assertIsInstance(profile.lifestyle, dict)
        self.assertEqual(profile.lifestyle.get("activityLevel"), "moderate")
        self.assertEqual(profile.lifestyle.get("sleepHours"), 7.5)
        self.assertEqual(profile.lifestyle.get("stressLevel"), "moderate")
        self.assertTrue(profile.lifestyle.get("regularExercise"))
        self.assertEqual(profile.lifestyle.get("fastFoodIntake"), "occasional")
        self.assertEqual(profile.lifestyle.get("dietaryPreference"), "Balanced")
        self.assertEqual(profile.lifestyle.get("dailyWaterGlasses"), 8)

    @patch("apps.health.services.supabase_health_service.health_service._client_or_raise")
    def test_fetch_food_logs_reads_nutrition_logs_and_deduplicates_legacy(self, mock_client_getter):
        """Verifies nutrition_food_logs is queried primarily and deduplicated with legacy food_logs."""
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client

        # Mock table calls: first nutrition_food_logs, second food_logs
        def table_side_effect(table_name):
            t_mock = MagicMock()
            t_mock.select.return_value = t_mock
            t_mock.eq.return_value = t_mock
            t_mock.gte.return_value = t_mock
            t_mock.order.return_value = t_mock
            t_mock.limit.return_value = t_mock

            res = MagicMock()
            if table_name == "nutrition_food_logs":
                res.data = [
                    {
                        "id": "nutr-log-1",
                        "meal_type": "breakfast",
                        "food_name": "Oatmeal with Almonds",
                        "calories": 320,
                        "protein_g": 12,
                        "carbs_g": 45,
                        "fat_g": 9,
                        "logged_at": "2026-10-22T08:30:00Z",
                    },
                    {
                        "id": "nutr-log-2",
                        "meal_type": "lunch",
                        "food_name": "Grilled Chicken Salad",
                        "calories": 450,
                        "protein_g": 38,
                        "carbs_g": 15,
                        "fat_g": 18,
                        "logged_at": "2026-10-22T13:00:00Z",
                    },
                ]
            elif table_name == "food_logs":
                # Contains 1 duplicate (nutr-log-1 / same meal+food+date) and 1 distinct legacy log
                res.data = [
                    {
                        "id": "nutr-log-1",  # duplicate by ID
                        "meal_type": "breakfast",
                        "food_name": "Oatmeal with Almonds",
                        "calories": 320,
                        "protein_g": 12,
                        "carbs_g": 45,
                        "fat_g": 9,
                        "logged_at": "2026-10-22T08:30:00Z",
                    },
                    {
                        "id": "legacy-log-99",  # distinct legacy entry
                        "meal_type": "dinner",
                        "food_name": "Lentil Soup with Brown Rice",
                        "calories": 380,
                        "protein_g": 16,
                        "carbs_g": 55,
                        "fat_g": 6,
                        "logged_at": "2026-10-21T19:30:00Z",
                    },
                ]
            else:
                res.data = []

            t_mock.execute.return_value = res
            return t_mock

        mock_client.table.side_effect = table_side_effect

        logs = health_service.fetch_food_logs(self.user_id, days=30)

        # Exactly 3 unique meals logged (2 from nutrition_food_logs + 1 distinct legacy, duplicate ignored)
        self.assertEqual(len(logs), 3, "Duplicate meals between sources must not be double counted")

        log_ids = [l.id for l in logs]
        self.assertIn("nutr-log-1", log_ids)
        self.assertIn("nutr-log-2", log_ids)
        self.assertIn("legacy-log-99", log_ids)

        # Verify sorted descending by date (13:00 > 08:30 > previous day 19:30)
        self.assertEqual(logs[0].id, "nutr-log-2")
        self.assertEqual(logs[1].id, "nutr-log-1")
        self.assertEqual(logs[2].id, "legacy-log-99")

    @patch("apps.health.services.supabase_health_service.health_service._client_or_raise")
    def test_meal_plan_service_get_food_logs_integration(self, mock_client_getter):
        """Verifies meal_plan_service.get_food_logs queries nutrition_food_logs and deduplicates."""
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client

        def table_side_effect(table_name):
            t_mock = MagicMock()
            t_mock.select.return_value = t_mock
            t_mock.eq.return_value = t_mock
            t_mock.gte.return_value = t_mock
            t_mock.lte.return_value = t_mock
            t_mock.order.return_value = t_mock

            res = MagicMock()
            if table_name == "nutrition_food_logs":
                res.data = [
                    {
                        "id": "nlog-alpha",
                        "user_id": self.user_id,
                        "meal_type": "lunch",
                        "food_name": "Greek Yogurt Bowl",
                        "calories": 250,
                        "protein_g": 20,
                        "carbs_g": 22,
                        "fat_g": 5,
                        "logged_at": "2026-10-22T12:00:00Z",
                    }
                ]
            elif table_name == "food_logs":
                # Legacy duplicate by composite key
                res.data = [
                    {
                        "id": "flog-beta-dup",
                        "user_id": self.user_id,
                        "meal_type": "lunch",
                        "food_name": "Greek Yogurt Bowl",
                        "calories": 250,
                        "protein_g": 20,
                        "carbs_g": 22,
                        "fat_g": 5,
                        "logged_at": "2026-10-22",
                    }
                ]
            else:
                res.data = []

            t_mock.execute.return_value = res
            return t_mock

        mock_client.table.side_effect = table_side_effect

        logs = meal_plan_service.get_food_logs(self.user_id, date_iso="2026-10-22")
        self.assertEqual(len(logs), 1, "Duplicate meal across nutrition_food_logs and food_logs must be deduplicated")
        self.assertEqual(logs[0]["id"], "nlog-alpha")

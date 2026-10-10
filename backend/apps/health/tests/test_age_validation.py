"""
Tests for Date of Birth and Dynamic Age (>= 13) Backend Validation.
"""

import datetime
from django.test import SimpleTestCase, TestCase
from rest_framework import serializers
from rest_framework.test import APIClient

from apps.health.serializers import (
    validate_age_and_dob,
    validate_male_screening_age,
    ProfileValidationSerializer,
    OnboardingValidationSerializer,
)


class AgeValidationUnitTest(SimpleTestCase):
    """Unit tests for Python age calculation and boundary rules."""

    def test_future_date_rejected(self):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_age_and_dob(tomorrow.isoformat())
        self.assertIn("Date of birth cannot be in the future.", str(ctx.exception))

    def test_twelve_year_old_rejected(self):
        today = datetime.date.today()
        # Exactly 12 years ago today
        dob_12 = datetime.date(today.year - 12, today.month, today.day)
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_age_and_dob(dob_12.isoformat())
        self.assertIn("You must be at least 13 years old to use PMOSense.", str(ctx.exception))

    def test_one_day_before_thirteenth_birthday_rejected(self):
        today = datetime.date.today()
        # Born 13 years ago tomorrow (i.e. currently 12 years and 364 days old)
        # To avoid month boundary issues, calculate date:
        dob_13_years_ago = datetime.date(today.year - 13, today.month, today.day)
        dob_one_day_later = dob_13_years_ago + datetime.timedelta(days=1)
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_age_and_dob(dob_one_day_later.isoformat())
        self.assertIn("You must be at least 13 years old to use PMOSense.", str(ctx.exception))

    def test_on_thirteenth_birthday_accepted(self):
        today = datetime.date.today()
        # Exactly 13 years ago today
        dob_13 = datetime.date(today.year - 13, today.month, today.day)
        age = validate_age_and_dob(dob_13.isoformat())
        self.assertEqual(age, 13)

    def test_older_user_accepted(self):
        today = datetime.date.today()
        # 25 years ago
        dob_25 = datetime.date(today.year - 25, today.month, today.day)
        age = validate_age_and_dob(dob_25.isoformat())
        self.assertEqual(age, 25)

    def test_empty_or_invalid_date_rejected(self):
        with self.assertRaises(serializers.ValidationError):
            validate_age_and_dob("")
        with self.assertRaises(serializers.ValidationError):
            validate_age_and_dob("invalid-date-string")

    def test_male_screening_age_under_19_rejected(self):
        today = datetime.date.today()
        dob_18 = (datetime.date(today.year - 18, today.month, today.day)).isoformat()
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_male_screening_age(dob_18)
        self.assertIn("at least 19 years old", str(ctx.exception))

    def test_male_screening_age_19_accepted(self):
        today = datetime.date.today()
        dob_19 = (datetime.date(today.year - 19, today.month, today.day)).isoformat()
        age = validate_male_screening_age(dob_19)
        self.assertEqual(age, 19)

    def test_male_screening_age_60_accepted(self):
        today = datetime.date.today()
        dob_60 = (datetime.date(today.year - 60, today.month, today.day)).isoformat()
        age = validate_male_screening_age(dob_60)
        self.assertEqual(age, 60)

    def test_male_screening_age_over_60_rejected(self):
        today = datetime.date.today()
        dob_61 = (datetime.date(today.year - 61, today.month, today.day)).isoformat()
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_male_screening_age(dob_61)
        self.assertIn("older than 60", str(ctx.exception))

    def test_male_screening_birthday_boundaries(self):
        today = datetime.date.today()
        # 1 day before 19th birthday (age 18)
        dob_18_364 = datetime.date(today.year - 19, today.month, today.day) + datetime.timedelta(days=1)
        with self.assertRaises(serializers.ValidationError):
            validate_male_screening_age(dob_18_364.isoformat())

        # 1 day before 61st birthday (age 60)
        dob_60_364 = datetime.date(today.year - 61, today.month, today.day) + datetime.timedelta(days=1)
        age = validate_male_screening_age(dob_60_364.isoformat())
        self.assertEqual(age, 60)


class AgeValidationSerializerTest(SimpleTestCase):
    """Tests for Profile and Onboarding validation serializers."""

    def test_serializer_accepts_valid_thirteen_year_old(self):
        today = datetime.date.today()
        dob_13 = (datetime.date(today.year - 13, today.month, today.day)).isoformat()
        serializer = OnboardingValidationSerializer(data={
            "full_name": "Fatima Noor",
            "email": "fatima@example.com",
            "date_of_birth": dob_13,
            "gender": "female",
            "pathway": "female",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_rejects_underage_user(self):
        today = datetime.date.today()
        dob_12 = (datetime.date(today.year - 12, today.month, today.day)).isoformat()
        serializer = OnboardingValidationSerializer(data={
            "full_name": "Young User",
            "date_of_birth": dob_12,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("date_of_birth", serializer.errors)
        self.assertIn("You must be at least 13 years old to use PMOSense.", str(serializer.errors["date_of_birth"]))

    def test_serializer_rejects_future_date(self):
        future = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
        serializer = ProfileValidationSerializer(data={
            "date_of_birth": future,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("date_of_birth", serializer.errors)
        self.assertIn("Date of birth cannot be in the future.", str(serializer.errors["date_of_birth"]))


class AgeValidationEndpointApiTest(TestCase):
    """API endpoint tests for onboarding and profile validation endpoints."""

    def setUp(self):
        self.client = APIClient()

    def test_onboarding_validate_endpoint_success_thirteen(self):
        today = datetime.date.today()
        dob_13 = (datetime.date(today.year - 13, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/onboarding/validate/",
            {"date_of_birth": dob_13, "full_name": "Ayesha Khan"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("valid"))
        self.assertEqual(response.data.get("age"), 13)

    def test_onboarding_validate_endpoint_rejects_twelve_year_old(self):
        today = datetime.date.today()
        dob_12 = (datetime.date(today.year - 12, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/onboarding/validate/",
            {"date_of_birth": dob_12, "full_name": "Underage User"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("details", response.data)
        self.assertIn("date_of_birth", response.data["details"])
        self.assertIn("You must be at least 13 years old to use PMOSense.", str(response.data["details"]["date_of_birth"]))

    def test_profile_validate_endpoint_same_restriction(self):
        today = datetime.date.today()
        dob_12 = (datetime.date(today.year - 12, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/profile/validate/",
            {"date_of_birth": dob_12},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("You must be at least 13 years old to use PMOSense.", str(response.data["details"]["date_of_birth"]))

    def test_male_onboarding_validate_endpoint_rejects_age_18(self):
        today = datetime.date.today()
        dob_18 = (datetime.date(today.year - 18, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/onboarding/validate/",
            {"date_of_birth": dob_18, "gender": "male", "pathway": "male"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("at least 19 years old", str(response.data["details"]["date_of_birth"]))

    def test_male_onboarding_validate_endpoint_accepts_age_19(self):
        today = datetime.date.today()
        dob_19 = (datetime.date(today.year - 19, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/onboarding/validate/",
            {"date_of_birth": dob_19, "gender": "male", "pathway": "male"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("valid"))
        self.assertEqual(response.data.get("age"), 19)

    def test_male_onboarding_validate_endpoint_accepts_age_60(self):
        today = datetime.date.today()
        dob_60 = (datetime.date(today.year - 60, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/onboarding/validate/",
            {"date_of_birth": dob_60, "gender": "male", "pathway": "male"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("valid"))
        self.assertEqual(response.data.get("age"), 60)

    def test_male_onboarding_validate_endpoint_rejects_age_61(self):
        today = datetime.date.today()
        dob_61 = (datetime.date(today.year - 61, today.month, today.day)).isoformat()
        response = self.client.post(
            "/api/v1/health/onboarding/validate/",
            {"date_of_birth": dob_61, "gender": "male", "pathway": "male"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("older than 60", str(response.data["details"]["date_of_birth"]))

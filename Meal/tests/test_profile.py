"""
Phase 5A Test Suite — Profile Validation & Age/Safety Routing

Covers:
- Age group routing (ADOLESCENT vs ADULT)
- Adolescent BMI returns NOT_INTERPRETED_FOR_ADOLESCENT
- Adult BMI categories (underweight / normal / overweight / obese)
- Safety flags for automated planning
- Boundary ages (19.0 exactly = ADULT)
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from Meal.engine.schemas import UserNutritionProfile, Goal, PALCategory, AgeGroup, SafetyStatus
from Meal.engine.profile import validate_and_route_profile


def _profile(**kwargs) -> UserNutritionProfile:
    defaults = dict(
        age=30.0,
        sex_for_reference_equation="male",
        height_cm=175.0,
        weight_kg=75.0,
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
        meals_per_day=3,
        dietary_class="omnivore",
        food_allergies=[],
        disliked_foods=[],
    )
    defaults.update(kwargs)
    return UserNutritionProfile(**defaults)


class TestAgeGroupRouting:
    def test_age_12_is_adolescent(self):
        p = _profile(age=12, height_cm=150, weight_kg=44)
        _, age_group, *_ = validate_and_route_profile(p)
        assert age_group == AgeGroup.ADOLESCENT

    def test_age_18_is_adolescent(self):
        p = _profile(age=18, height_cm=172, weight_kg=65)
        _, age_group, *_ = validate_and_route_profile(p)
        assert age_group == AgeGroup.ADOLESCENT

    def test_age_19_is_adult(self):
        p = _profile(age=19, height_cm=175, weight_kg=70)
        _, age_group, *_ = validate_and_route_profile(p)
        assert age_group == AgeGroup.ADULT

    def test_age_30_is_adult(self):
        p = _profile(age=30)
        _, age_group, *_ = validate_and_route_profile(p)
        assert age_group == AgeGroup.ADULT


class TestBMIInterpretation:
    def test_adolescent_bmi_not_interpreted(self):
        p = _profile(age=14, height_cm=165, weight_kg=55)
        _, _, _, bmi_value, bmi_interp, *_ = validate_and_route_profile(p)
        assert bmi_interp == "NOT_INTERPRETED_FOR_ADOLESCENT"

    def test_adult_underweight_bmi(self):
        p = _profile(age=25, height_cm=175, weight_kg=50)
        _, _, _, bmi_value, bmi_interp, *_ = validate_and_route_profile(p)
        bmi_expected = 50 / (1.75 ** 2)
        assert abs(bmi_value - bmi_expected) < 0.1
        assert bmi_interp == "UNDERWEIGHT"
        assert bmi_value < 18.5

    def test_adult_normal_bmi(self):
        p = _profile(age=30, height_cm=175, weight_kg=75)
        _, _, _, bmi_value, bmi_interp, *_ = validate_and_route_profile(p)
        assert 18.5 <= bmi_value < 25.0

    def test_adult_overweight_bmi(self):
        p = _profile(age=35, height_cm=170, weight_kg=85)
        _, _, _, bmi_value, bmi_interp, *_ = validate_and_route_profile(p)
        assert 25.0 <= bmi_value < 30.0

    def test_adult_obese_bmi(self):
        p = _profile(age=40, height_cm=165, weight_kg=95)
        _, _, _, bmi_value, bmi_interp, *_ = validate_and_route_profile(p)
        assert bmi_value >= 30.0


class TestSafetyFlags:
    def test_valid_adult_profile_allows_planning(self):
        p = _profile(age=30)
        *_, automated_planning_allowed, safety_flags = validate_and_route_profile(p)
        assert automated_planning_allowed is True
        assert safety_flags == []

    def test_valid_adolescent_profile_allows_planning(self):
        p = _profile(age=15, height_cm=168, weight_kg=58)
        *_, automated_planning_allowed, safety_flags = validate_and_route_profile(p)
        assert automated_planning_allowed is True

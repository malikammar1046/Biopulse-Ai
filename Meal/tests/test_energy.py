"""
Phase 5A Test Suite — Energy Requirement (2023 NASEM EER equations)

Independent Golden Fixture Verification against NASEM 2023 Tables S-2 and S-3.

Architecture:
- Adults 19+: Exactly 8 adult PAL-specific linear equations from Table S-3 (4 male + 4 female).
- Adolescents (12.00–18.99y):
  8 adolescent PAL coefficient equations (4 male + 4 female)
  +
  age-specific energy-cost-of-growth rules (NASEM Table S-2 footnotes b & c):
    * Boys 12.00–13.99y: base + 25 kcal/d
    * Boys 14.00–18.99y: base + 20 kcal/d
    * Girls 12.00–13.99y: base + 30 kcal/d
    * Girls 14.00–18.99y: base + 20 kcal/d
  Supported routing includes 12.00–13.99 and 14.00–18.99 with exact growth additions,
  yielding 16 distinct adolescent equation-growth combinations (2 age sub-bands × 2 sexes × 4 PALs).

All primary test assertions compare production results against independent golden fixtures
stored in Meal/tests/fixtures/nasem_2023_eer_golden.json, calculated independently
from the published equations.
"""

import json
import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from Meal.engine.schemas import UserNutritionProfile, Goal, PALCategory
from Meal.engine.energy import calculate_energy_requirement

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "nasem_2023_eer_golden.json")


def _load_golden_fixtures():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


GOLDEN_FIXTURES = _load_golden_fixtures()


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


# ---------------------------------------------------------------------------
# Independent Golden Fixture Verification
# ---------------------------------------------------------------------------

class TestGoldenEERFixtures:
    @pytest.mark.parametrize("fixture", GOLDEN_FIXTURES, ids=[f["description"] for f in GOLDEN_FIXTURES])
    def test_fixture_eer_accuracy(self, fixture):
        p = _profile(
            age=fixture["age_years_decimal"],
            sex_for_reference_equation=fixture["sex_for_reference_equation"],
            height_cm=fixture["height_cm"],
            weight_kg=fixture["weight_kg"],
            pal_category=PALCategory(fixture["pal_category"]),
        )
        result = calculate_energy_requirement(p)

        expected_eer = fixture["expected_eer_kcal"]
        expected_growth = fixture["growth_allowance_kcal"]

        assert abs(result.eer_kcal - expected_eer) < 0.5, (
            f"{fixture['description']}: result {result.eer_kcal} != expected {expected_eer}"
        )
        assert abs(result.growth_allowance_kcal - expected_growth) < 0.01, (
            f"{fixture['description']}: growth {result.growth_allowance_kcal} != expected {expected_growth}"
        )
        if "12" in fixture["source_age_band"] and "13" in fixture["source_age_band"]:
            assert result.eer_age_band.value == "EER_12_TO_13_99"
        elif "14" in fixture["source_age_band"] and "18" in fixture["source_age_band"]:
            assert result.eer_age_band.value == "EER_14_TO_18_99"
        elif "19" in fixture["source_age_band"]:
            assert result.eer_age_band.value == "EER_19_PLUS"


# ---------------------------------------------------------------------------
# Unit / edge cases
# ---------------------------------------------------------------------------

class TestEEREdgeCases:
    def test_eer_is_positive(self):
        p = _profile(age=30, weight_kg=70, height_cm=175, pal_category=PALCategory.LOW_ACTIVE)
        r = calculate_energy_requirement(p)
        assert r.eer_kcal > 0

    def test_growth_allowance_zero_for_adults(self):
        p = _profile(age=25, pal_category=PALCategory.ACTIVE)
        r = calculate_energy_requirement(p)
        assert r.growth_allowance_kcal == 0.0

    def test_very_active_higher_than_inactive(self):
        p_i = _profile(age=30, pal_category=PALCategory.INACTIVE)
        p_va = _profile(age=30, pal_category=PALCategory.VERY_ACTIVE)
        assert calculate_energy_requirement(p_va).eer_kcal > calculate_energy_requirement(p_i).eer_kcal

    def test_growth_rule_boundary_13_99_vs_14_00(self):
        # Male 13.99 gets 25 kcal growth; Male 14.00 gets 20 kcal growth
        p_13 = _profile(age=13.99, sex_for_reference_equation="male", height_cm=160, weight_kg=50)
        p_14 = _profile(age=14.00, sex_for_reference_equation="male", height_cm=160, weight_kg=50)
        r_13 = calculate_energy_requirement(p_13)
        r_14 = calculate_energy_requirement(p_14)
        assert r_13.growth_allowance_kcal == 25.0
        assert r_14.growth_allowance_kcal == 20.0

    def test_growth_rule_boundary_female_13_99_vs_14_00(self):
        # Female 13.99 gets 30 kcal growth; Female 14.00 gets 20 kcal growth
        p_13 = _profile(age=13.99, sex_for_reference_equation="female", height_cm=158, weight_kg=48)
        p_14 = _profile(age=14.00, sex_for_reference_equation="female", height_cm=158, weight_kg=48)
        r_13 = calculate_energy_requirement(p_13)
        r_14 = calculate_energy_requirement(p_14)
        assert r_13.growth_allowance_kcal == 30.0
        assert r_14.growth_allowance_kcal == 20.0

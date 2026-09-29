"""
Phase 5A Test Suite — Nutrient Target Ranges

Covers:
- Carbohydrate: target_min = max(RDA=130, AMDR_min); conflict ONLY when RDA > AMDR_max
- Protein: RDA floor by age (0.95/0.85/0.80 g/kg); conflict only when floor > AMDR_max
- Fat: AMDR 25-35% adolescent, 20-35% adult
- Fiber: official AI values by age/sex, NOT 14g/1000kcal
- Energy-density fiber reference produced separately
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from Meal.engine.schemas import UserNutritionProfile, Goal, PALCategory
from Meal.engine.energy import calculate_energy_requirement
from Meal.engine.nutrient_targets import calculate_nutrient_targets, _get_fiber_ai


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


def _compute(profile, pal=None):
    if pal:
        profile.pal_category = pal
    eer = calculate_energy_requirement(profile)
    targets = calculate_nutrient_targets(profile, eer)
    return eer, targets


class TestCarbohydrateTargets:
    def test_rda_is_130g(self):
        p = _profile()
        _, t = _compute(p)
        assert t["carbohydrate_rda_g"] == 130.0

    def test_target_min_is_max_of_rda_and_amdr_min(self):
        p = _profile(age=30, height_cm=175, weight_kg=75, pal_category=PALCategory.LOW_ACTIVE)
        eer, t = _compute(p)
        amdr_min = round((0.45 * eer.eer_kcal) / 4.0, 1)
        expected_min = round(max(130.0, amdr_min), 1)
        assert t["carbohydrate_target_min_g"] == expected_min

    def test_no_conflict_when_rda_within_amdr(self):
        """RDA=130g should be within AMDR for any reasonable adult EER."""
        p = _profile(age=30, weight_kg=75, height_cm=175, pal_category=PALCategory.LOW_ACTIVE)
        _, t = _compute(p)
        assert t["carbohydrate_conflict"] is None
        assert t["carbohydrate_target_min_g"] <= t["carbohydrate_target_max_g"]

    def test_target_min_le_target_max(self):
        """Invariant: target_min ≤ target_max for all valid profiles."""
        for pal in PALCategory:
            p = _profile(pal_category=pal)
            _, t = _compute(p)
            assert t["carbohydrate_target_min_g"] <= t["carbohydrate_target_max_g"], \
                f"Violated for PAL {pal}"

    def test_conflict_triggered_only_when_rda_exceeds_amdr_max(self):
        """
        Verify that at very low energy (hypothetically tiny EER), if AMDR_max < 130g,
        then conflict is raised.  We inject a tiny EER by monkey-patching.
        """
        p = _profile()
        eer = calculate_energy_requirement(p)

        class TinyEER:
            eer_kcal = 300.0  # AMDR_max = 0.65*300/4 ≈ 48.75g < 130g RDA → CONFLICT

        t = calculate_nutrient_targets(p, TinyEER())
        assert t["carbohydrate_conflict"] == "TARGET_REFERENCE_CONFLICT"
        assert len(t["warnings"]) > 0


class TestProteinTargets:
    def test_protein_rda_factor_adult(self):
        p = _profile(age=25, weight_kg=70)
        _, t = _compute(p)
        assert t["protein_rda_factor"] == 0.80
        assert abs(t["protein_rda_floor_g"] - 56.0) < 0.2

    def test_protein_rda_factor_age_14_18(self):
        p = _profile(age=16, weight_kg=60, height_cm=170)
        _, t = _compute(p)
        assert t["protein_rda_factor"] == 0.85
        assert abs(t["protein_rda_floor_g"] - 51.0) < 0.2

    def test_protein_rda_factor_age_12_13(self):
        p = _profile(age=12, weight_kg=45, height_cm=152)
        _, t = _compute(p)
        assert t["protein_rda_factor"] == 0.95
        assert abs(t["protein_rda_floor_g"] - 42.75) < 0.2

    def test_protein_target_min_ge_rda_floor(self):
        for age in [12, 15, 25, 50]:
            p = _profile(age=age, weight_kg=65, height_cm=170)
            _, t = _compute(p)
            assert t["protein_target_min_g"] >= t["protein_rda_floor_g"] - 0.01, \
                f"Violated at age {age}"

    def test_protein_target_min_le_target_max(self):
        for age in [12, 16, 25, 65]:
            for pal in PALCategory:
                p = _profile(age=age, weight_kg=70, height_cm=170, pal_category=pal)
                _, t = _compute(p)
                assert t["protein_target_min_g"] <= t["protein_target_max_g"], \
                    f"Violated at age={age}, pal={pal}"

    def test_no_conflict_normal_adult(self):
        p = _profile(age=30, weight_kg=75, height_cm=175, pal_category=PALCategory.LOW_ACTIVE)
        _, t = _compute(p)
        assert t["protein_conflict"] is None


class TestFatTargets:
    def test_adult_fat_amdr_20_35(self):
        p = _profile(age=30, pal_category=PALCategory.LOW_ACTIVE)
        eer, t = _compute(p)
        expected_min = round((0.20 * eer.eer_kcal) / 9.0, 1)
        expected_max = round((0.35 * eer.eer_kcal) / 9.0, 1)
        assert abs(t["fat_amdr_min_g"] - expected_min) < 0.2
        assert abs(t["fat_amdr_max_g"] - expected_max) < 0.2

    def test_adolescent_fat_amdr_25_35(self):
        p = _profile(age=15, height_cm=168, weight_kg=58, pal_category=PALCategory.ACTIVE)
        eer, t = _compute(p)
        expected_min = round((0.25 * eer.eer_kcal) / 9.0, 1)
        expected_max = round((0.35 * eer.eer_kcal) / 9.0, 1)
        assert abs(t["fat_amdr_min_g"] - expected_min) < 0.2
        assert abs(t["fat_amdr_max_g"] - expected_max) < 0.2


class TestFiberTargets:
    """Official DRI AI values — NOT 14g/1000kcal formula."""

    def test_male_19_50_fiber_38g(self):
        p = _profile(age=30, sex_for_reference_equation="male")
        _, t = _compute(p)
        assert t["fiber_ai_g"] == 38.0

    def test_male_12_13_fiber_31g(self):
        p = _profile(age=12, sex_for_reference_equation="male", height_cm=152, weight_kg=44)
        _, t = _compute(p)
        assert t["fiber_ai_g"] == 31.0

    def test_male_14_18_fiber_38g(self):
        p = _profile(age=16, sex_for_reference_equation="male", height_cm=170, weight_kg=60)
        _, t = _compute(p)
        assert t["fiber_ai_g"] == 38.0

    def test_male_51plus_fiber_30g(self):
        fiber, _ = _get_fiber_ai("male", 60)
        assert fiber == 30.0

    def test_female_12_13_fiber_26g(self):
        fiber, _ = _get_fiber_ai("female", 12)
        assert fiber == 26.0

    def test_female_14_18_fiber_26g(self):
        fiber, _ = _get_fiber_ai("female", 16)
        assert fiber == 26.0

    def test_female_19_50_fiber_25g(self):
        p = _profile(age=30, sex_for_reference_equation="female", height_cm=163, weight_kg=58)
        _, t = _compute(p)
        assert t["fiber_ai_g"] == 25.0

    def test_female_51plus_fiber_21g(self):
        fiber, _ = _get_fiber_ai("female", 55)
        assert fiber == 21.0

    def test_fiber_ai_reference_type_is_AI(self):
        p = _profile()
        _, t = _compute(p)
        assert t["fiber_ai_reference_type"] == "AI"

    def test_energy_density_reference_separate(self):
        """14g/1000kcal reference must exist separately from AI."""
        p = _profile(pal_category=PALCategory.LOW_ACTIVE)
        eer, t = _compute(p)
        expected_energy_density = round(14.0 * eer.eer_kcal / 1000.0, 1)
        assert abs(t["fiber_energy_density_reference_g"] - expected_energy_density) < 0.2
        assert t["fiber_energy_density_reference_type"] == "DERIVED_14G_PER_1000KCAL"

    def test_fiber_ai_different_from_energy_density(self):
        """For most users the AI and energy-density values differ."""
        p = _profile(age=30, sex_for_reference_equation="female",
                     height_cm=163, weight_kg=58, pal_category=PALCategory.LOW_ACTIVE)
        eer, t = _compute(p)
        # AI=25g; 14g/1000kcal would be a different number
        assert t["fiber_ai_g"] == 25.0
        assert t["fiber_energy_density_reference_g"] == round(14.0 * eer.eer_kcal / 1000.0, 1)
        assert t["fiber_ai_g"] != t["fiber_energy_density_reference_g"]
        assert "fiber_energy_density_reference_g" in t
        assert "fiber_ai_g" in t

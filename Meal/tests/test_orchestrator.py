"""
Phase 5A End-to-End Orchestrator Integration Tests
Tests build_nutrition_target_profile() covering:
- Valid adolescent -> complete NutritionTargetProfile
- Valid adult -> complete NutritionTargetProfile
- Special medical-state profile -> automated_personalized_planning_allowed = false
- Gradual weight management -> maintenance EER retained -> DEFERRED_TO_EVIDENCE_BASED_GOAL_LAYER
- 13.99 -> younger adolescent growth rule
- 14.00 -> older adolescent growth rule
- 18.99 -> adolescent equation
- 19.00 -> adult equation
- All calculation provenance present
- Strict absence of PCOS / hypogonadism fields
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from Meal.engine.schemas import (
    UserNutritionProfile,
    NutritionTargetProfile,
    AgeGroup,
    EERAgeBand,
    Goal,
    PALCategory,
    SafetyStatus,
)
from Meal.engine.orchestrator import build_nutrition_target_profile


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


class TestOrchestratorAdolescent:
    def test_valid_adolescent_complete_profile(self):
        p = _profile(
            age=15.0,
            sex_for_reference_equation="male",
            height_cm=165.0,
            weight_kg=55.0,
            pal_category=PALCategory.ACTIVE,
        )
        target = build_nutrition_target_profile(p)

        assert isinstance(target, NutritionTargetProfile)
        assert target.age_years_decimal == 15.0
        assert target.age == 15.0
        assert target.age_group == AgeGroup.ADOLESCENT
        assert target.eer_age_band == EERAgeBand.EER_14_TO_18_99
        assert target.bmi_interpretation == "NOT_INTERPRETED_FOR_ADOLESCENT"
        assert target.safety_status == SafetyStatus.SAFE_FOR_AUTOMATED_PLANNING
        assert target.automated_personalized_planning_allowed is True

        # Check energy & PAL
        assert target.eer_kcal > 0
        assert target.energy_target_kcal == target.eer_kcal
        assert target.pal_category == PALCategory.ACTIVE

        # Check macro target invariants
        assert target.carbohydrate_target_min_g <= target.carbohydrate_target_max_g
        assert target.protein_target_min_g <= target.protein_target_max_g
        assert target.fat_amdr_min_g <= target.fat_amdr_max_g
        assert target.fiber_ai_g == 38.0  # Male 14-18y AI = 38g
        assert target.fiber_energy_density_reference_g > 0


class TestOrchestratorAdult:
    def test_valid_adult_complete_profile(self):
        p = _profile(
            age=32.0,
            sex_for_reference_equation="female",
            height_cm=162.0,
            weight_kg=60.0,
            pal_category=PALCategory.LOW_ACTIVE,
        )
        target = build_nutrition_target_profile(p)

        assert isinstance(target, NutritionTargetProfile)
        assert target.age_years_decimal == 32.0
        assert target.age_group == AgeGroup.ADULT
        assert target.eer_age_band == EERAgeBand.EER_19_PLUS
        assert target.bmi_interpretation == "NORMAL_WEIGHT"
        assert target.safety_status == SafetyStatus.SAFE_FOR_AUTOMATED_PLANNING
        assert target.automated_personalized_planning_allowed is True

        assert target.carbohydrate_target_min_g <= target.carbohydrate_target_max_g
        assert target.protein_target_min_g <= target.protein_target_max_g
        assert target.fat_amdr_min_g <= target.fat_amdr_max_g
        assert target.fiber_ai_g == 25.0  # Female 19-50y AI = 25g


class TestOrchestratorSpecialMedicalState:
    def test_special_medical_condition_blocks_automated_planning(self):
        p = _profile(
            age=28.0,
            relevant_medical_nutrition_flags=["diabetes"],
        )
        target = build_nutrition_target_profile(p)

        assert target.automated_personalized_planning_allowed is False
        assert target.safety_status == SafetyStatus.REQUIRES_CLINICIAN_GUIDED_NUTRITION
        assert "MEDICALLY_MANAGED_DIABETES" in target.safety_flags
        assert any("Safety warning" in w for w in target.warnings)

    def test_pregnancy_blocks_automated_planning(self):
        p = _profile(
            age=26.0,
            sex_for_reference_equation="female",
            pregnant=True,
        )
        target = build_nutrition_target_profile(p)

        assert target.automated_personalized_planning_allowed is False
        assert target.safety_status == SafetyStatus.REQUIRES_CLINICIAN_GUIDED_NUTRITION
        assert "PREGNANCY" in target.safety_flags


class TestOrchestratorWeightManagement:
    def test_gradual_weight_management_retains_maintenance_eer(self):
        p = _profile(
            age=30.0,
            weight_kg=85.0,
            height_cm=175.0,
            goal=Goal.GRADUAL_WEIGHT_MANAGEMENT,
        )
        target = build_nutrition_target_profile(p)

        assert target.goal == Goal.GRADUAL_WEIGHT_MANAGEMENT
        # Maintenance EER is retained with zero arbitrary adult deficit
        assert target.energy_target_kcal == target.eer_kcal
        assert target.weight_management_policy_status == "DEFERRED_TO_EVIDENCE_BASED_GOAL_LAYER"
        assert target.automatic_weight_loss_deficit is False
        assert target.weight_management_adjustment_applied is False


class TestOrchestratorGrowthRulesAndEquations:
    def test_age_13_99_younger_adolescent_growth_rule(self):
        # Male 13.99 -> younger adolescent growth rule (+25 kcal/d)
        p_m = _profile(age=13.99, sex_for_reference_equation="male", height_cm=160.0, weight_kg=50.0)
        target_m = build_nutrition_target_profile(p_m)
        assert target_m.eer_age_band == EERAgeBand.EER_12_TO_13_99
        assert "12_13" in target_m.eer_equation_id
        assert target_m.fiber_ai_g == 31.0  # Male 12-13y AI = 31g

        # Female 13.99 -> younger adolescent growth rule (+30 kcal/d)
        p_f = _profile(age=13.99, sex_for_reference_equation="female", height_cm=158.0, weight_kg=48.0)
        target_f = build_nutrition_target_profile(p_f)
        assert target_f.eer_age_band == EERAgeBand.EER_12_TO_13_99
        assert "12_13" in target_f.eer_equation_id
        assert target_f.fiber_ai_g == 26.0  # Female 12-18y AI = 26g

    def test_age_14_00_older_adolescent_growth_rule(self):
        # Male 14.00 -> older adolescent growth rule (+20 kcal/d)
        p_m = _profile(age=14.00, sex_for_reference_equation="male", height_cm=163.0, weight_kg=52.0)
        target_m = build_nutrition_target_profile(p_m)
        assert target_m.eer_age_band == EERAgeBand.EER_14_TO_18_99
        assert "14_18" in target_m.eer_equation_id
        assert target_m.fiber_ai_g == 38.0  # Male 14-18y AI = 38g

        # Female 14.00 -> older adolescent growth rule (+20 kcal/d)
        p_f = _profile(age=14.00, sex_for_reference_equation="female", height_cm=160.0, weight_kg=50.0)
        target_f = build_nutrition_target_profile(p_f)
        assert target_f.eer_age_band == EERAgeBand.EER_14_TO_18_99
        assert "14_18" in target_f.eer_equation_id
        assert target_f.fiber_ai_g == 26.0

    def test_age_18_99_adolescent_equation(self):
        p = _profile(age=18.99, sex_for_reference_equation="male", height_cm=175.0, weight_kg=68.0)
        target = build_nutrition_target_profile(p)
        assert target.age_group == AgeGroup.ADOLESCENT
        assert target.eer_age_band == EERAgeBand.EER_14_TO_18_99
        assert "TABLE_S2" in target.eer_equation_id
        assert target.bmi_interpretation == "NOT_INTERPRETED_FOR_ADOLESCENT"

    def test_age_19_00_adult_equation(self):
        p = _profile(age=19.00, sex_for_reference_equation="male", height_cm=176.0, weight_kg=70.0)
        target = build_nutrition_target_profile(p)
        assert target.age_group == AgeGroup.ADULT
        assert target.eer_age_band == EERAgeBand.EER_19_PLUS
        assert "TABLE_S3" in target.eer_equation_id
        assert target.bmi_interpretation == "NORMAL_WEIGHT"


class TestOrchestratorProvenanceAndAbsenceOfDiseaseFields:
    def test_provenance_and_trace_complete(self):
        p = _profile(age=25.0)
        target = build_nutrition_target_profile(p)

        # Provenance sources
        assert "eer" in target.target_sources
        assert "carbohydrate_rda" in target.target_sources
        assert "carbohydrate_amdr" in target.target_sources
        assert "protein_rda" in target.target_sources
        assert "protein_amdr" in target.target_sources
        assert "fat_amdr" in target.target_sources
        assert "fiber_ai" in target.target_sources
        assert "fiber_energy_density_reference" in target.target_sources

        # Calculation trace
        assert len(target.calculation_trace) >= 6
        trace_str = " ".join(target.calculation_trace)
        assert "validate_user_profile" in trace_str
        assert "calculate_energy_requirement" in trace_str
        assert "calculate_nutrient_targets" in trace_str

    def test_no_pcos_or_hypogonadism_fields(self):
        p = _profile()
        target = build_nutrition_target_profile(p)

        # Strictly check that no disease-specific fields exist on target or profile
        for forbidden in [
            "pcos_phenotype",
            "pcos_subtype",
            "has_pcos",
            "hypogonadism_subtype",
            "hypogonadism_type",
            "has_hypogonadism",
        ]:
            assert not hasattr(target, forbidden), f"Forbidden field found: {forbidden}"
            assert not hasattr(p, forbidden), f"Forbidden field found on profile: {forbidden}"

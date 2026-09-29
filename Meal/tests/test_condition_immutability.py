"""Meal/tests/test_condition_immutability.py - Immutability tests for Phase 5B.

Verifies deep structural equality, exact numerical preservation across all 24 NASEM fixtures,
nested alias isolation, and inability of condition profiles to override Phase 5A safety or target conflicts.
"""

import copy
from dataclasses import asdict
import json
from pathlib import Path
import pytest

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import (
    Goal,
    PALCategory,
    SafetyStatus,
    TargetResolutionStatus,
    UserNutritionProfile,
)
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)

GOLDEN_EER_PATH = Path(__file__).parent / "fixtures" / "nasem_2023_eer_golden.json"


@pytest.fixture
def golden_fixtures() -> list:
    with open(GOLDEN_EER_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class TestGoldenFixturesImmutability:
    """Verifies that applying condition layers to all 24 NASEM golden fixtures changes ZERO values."""

    def test_all_24_nasem_fixtures_structural_immutability(self, golden_fixtures):
        pal_map = {
            "INACTIVE": PALCategory.INACTIVE,
            "LOW_ACTIVE": PALCategory.LOW_ACTIVE,
            "ACTIVE": PALCategory.ACTIVE,
            "VERY_ACTIVE": PALCategory.VERY_ACTIVE,
        }

        for fixture in golden_fixtures:
            user = UserNutritionProfile(
                age=int(fixture["age_years_decimal"]),
                age_years_decimal=fixture["age_years_decimal"],
                sex_for_reference_equation=fixture["sex_for_reference_equation"].lower(),
                height_cm=fixture["height_cm"],
                weight_kg=fixture["weight_kg"],
                pal_category=pal_map[fixture["pal_category"]],
                goal=Goal.MAINTAIN,
            )
            neutral = build_nutrition_target_profile(user)

            # Record baseline snapshot
            before_dict = copy.deepcopy(asdict(neutral))

            # Apply PCOS
            ctx_pcos = ConditionEvidenceContext(
                condition_pathway=ConditionPathway.PCOS,
                evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
            )
            res_pcos = build_condition_nutrition_profile(neutral, ctx_pcos)

            assert asdict(neutral) == before_dict
            assert asdict(res_pcos.neutral_profile) == before_dict

            # Apply Hypogonadism
            ctx_hypo = ConditionEvidenceContext(
                condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
                evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
            )
            res_hypo = build_condition_nutrition_profile(neutral, ctx_hypo)

            assert asdict(neutral) == before_dict
            assert asdict(res_hypo.neutral_profile) == before_dict


class TestAliasIsolation:
    """Verifies that mutating returned condition snapshots does not affect original Phase 5A profiles."""

    def test_nested_collection_mutation_does_not_mutate_original(self):
        user = UserNutritionProfile(
            age=25,
            sex_for_reference_equation="female",
            height_cm=165.0,
            weight_kg=60.0,
            pal_category=PALCategory.ACTIVE,
            goal=Goal.MAINTAIN,
        )
        neutral = build_nutrition_target_profile(user)
        original_trace_len = len(neutral.calculation_trace)
        original_warnings_len = len(neutral.warnings)

        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(neutral, ctx)

        # Mutate collections on returned snapshot
        res.neutral_profile.calculation_trace.append("MUTATION_ATTEMPT")
        res.neutral_profile.warnings.append("MUTATION_WARNING")

        # Original must be untouched
        assert len(neutral.calculation_trace) == original_trace_len
        assert "MUTATION_ATTEMPT" not in neutral.calculation_trace
        assert len(neutral.warnings) == original_warnings_len
        assert "MUTATION_WARNING" not in neutral.warnings


class TestPreservePhase5ARestrictionsAndConflicts:
    """Verifies that Phase 5B cannot override Phase 5A safety blocks or reference conflicts."""

    def test_special_medical_restriction_preserved(self):
        user = UserNutritionProfile(
            age=28,
            sex_for_reference_equation="female",
            height_cm=160.0,
            weight_kg=55.0,
            pal_category=PALCategory.ACTIVE,
            goal=Goal.MAINTAIN,
            pregnant=True,
        )
        neutral = build_nutrition_target_profile(user)
        assert neutral.safety_status == SafetyStatus.REQUIRES_CLINICIAN_GUIDED_NUTRITION
        assert neutral.automated_personalized_planning_allowed is False

        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
        )
        res = build_condition_nutrition_profile(neutral, ctx)

        # Planning must remain blocked
        assert res.neutral_profile.safety_status == SafetyStatus.REQUIRES_CLINICIAN_GUIDED_NUTRITION
        assert res.neutral_profile.automated_personalized_planning_allowed is False
        assert any("cannot override clinician-guided nutrition requirement" in w for w in res.warnings)

    def test_extreme_reference_conflict_preserved(self):
        # 300 kcal synthetic conflict profile
        user = UserNutritionProfile(
            age=100,
            sex_for_reference_equation="female",
            height_cm=100.0,
            weight_kg=20.0,
            pal_category=PALCategory.INACTIVE,
            goal=Goal.MAINTAIN,
        )
        neutral = build_nutrition_target_profile(user)
        assert neutral.target_resolution_status == TargetResolutionStatus.REFERENCE_CONFLICT
        assert neutral.carbohydrate_target_min_g is None
        assert neutral.carbohydrate_conflict == "TARGET_REFERENCE_CONFLICT"
        assert neutral.nutrition_targets_optimization_ready is False

        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(neutral, ctx)

        # Condition profile preserves unresolved conflict
        assert res.neutral_profile.target_resolution_status == TargetResolutionStatus.REFERENCE_CONFLICT
        assert res.neutral_profile.carbohydrate_target_min_g is None
        assert res.neutral_profile.carbohydrate_conflict == "TARGET_REFERENCE_CONFLICT"
        assert res.neutral_profile.nutrition_targets_optimization_ready is False

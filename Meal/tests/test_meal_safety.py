"""Meal/tests/test_meal_safety.py - Safety exclusion and quarantine inheritance tests.

Verifies:
- Complete inheritance of Phase 6A allergen and dietary safety gates.
- Quarantined foods (Paneer PK_COMP_004, incomplete macros) never enter combinations.
- Allergen-excluded foods requested as required fail with REQUIRED_ENTITY_EXPLICITLY_EXCLUDED.
- Allergen-excluded foods requested as preferred are classified as EXPLICITLY_EXCLUDED and excluded.
"""

import pytest

from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
    PreferredEntityClassification,
    RequiredEntityFailureReason,
    SingleMealGenerationContext,
    SingleMealGenerationStatus,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.schemas import PortionConstraint, PortionOptimizationTarget
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def base_user():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition = build_condition_nutrition_profile(neutral, ctx)
    return neutral, condition


class TestMealSafetyInheritance:
    """Tests Phase 6A safety gating inheritance in Phase 6C meal composition."""

    def test_allergen_exclusion_inherited(self, base_user):
        """Foods excluded by allergy in Phase 6A never enter any Phase 6C combination."""
        neutral, condition = base_user
        # Dairy allergy excludes Curd/Dahi (PK_COMP_001)
        planner_ctx = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=["dairy"],
        )
        cand_result = rank_meal_candidates(neutral, condition, planner_ctx)

        # Verify PK_COMP_001 is hard excluded in Phase 6A
        excluded_ids = {c.entity_id for c in cand_result.excluded_candidates}
        assert "PK_COMP_001" in excluded_ids

        target = PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=8.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=60.0,
            fat_min_g=4.0,
            fat_max_g=20.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0),
            PortionConstraint(entity_id="PK_COMP_010", minimum_grams=20.0, maximum_grams=100.0),  # Dried Dates
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=["PK_COMP_001"],  # Requested preferred entity has allergy!
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=10,
        )

        result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=constraints,
            context=meal_ctx,
            policy=policy,
        )

        assert result.is_successful is True
        # Safety wins over preference: PK_COMP_001 is marked EXPLICITLY_EXCLUDED and NOT admitted
        rec = next(r for r in result.preferred_validation_records if r.entity_id == "PK_COMP_001")
        assert rec.classification == PreferredEntityClassification.EXPLICITLY_EXCLUDED
        assert "PK_COMP_001" not in result.best_meal.entity_ids
        for alt in result.alternative_meals:
            assert "PK_COMP_001" not in alt.entity_ids

    def test_quarantined_paneer_never_enters_meals(self, base_user):
        """Paneer PK_COMP_004 (quarantined in Phase 6A) never enters any meal."""
        neutral, condition = base_user
        planner_ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_result = rank_meal_candidates(neutral, condition, planner_ctx)

        # Verify PK_COMP_004 is in display_only_candidates (nutrition review required)
        display_only_ids = {c.entity_id for c in cand_result.display_only_candidates}
        assert "PK_COMP_004" in display_only_ids

        # Attempt to require PK_COMP_004
        target = PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=10.0,
            protein_max_g=25.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=60.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_COMP_004", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_COMP_004"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
        )

        result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=constraints,
            context=meal_ctx,
            policy=policy,
        )

        assert result.is_successful is False
        assert result.status == SingleMealGenerationStatus.INVALID_REQUIRED_ENTITY
        assert result.required_entity_failure_reason == RequiredEntityFailureReason.REQUIRED_ENTITY_NOT_PHASE6A_ELIGIBLE

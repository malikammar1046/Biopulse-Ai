"""Meal/tests/test_meal_constraints.py - Validation tests for required/preferred entities and policies.

Verifies:
- Requirement 4: Classification of preferred entity IDs and safety over preference.
- Requirement 5: Distinct machine-readable required-entity failure reasons.
- Requirement 6: Validation of search policies and required-entity counts.
"""

import pytest

from Meal.composition.combinations import (
    classify_preferred_entities,
    validate_required_entities,
    validate_search_policy,
)
from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
    PreferredEntityClassification,
    PreferredEntityStatus,
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
from Meal.planner.catalog import load_master_planner_catalog
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def base_setup():
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
    planner_ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
    cand_result = rank_meal_candidates(neutral, condition, planner_ctx)
    catalog = load_master_planner_catalog()
    return neutral, condition, cand_result, catalog


class TestMealConstraintsAndPolicies:
    """Tests failure reasons for required entities, preferred classifications, and policies."""

    def test_search_policy_validation(self):
        """Verifies policy rejection on invalid bounds."""
        # minimum_items < 1
        with pytest.raises(ValueError, match="minimum_items must be >= 1"):
            MealCombinationPolicy(minimum_items=0)

        # maximum_items < minimum_items
        with pytest.raises(ValueError, match="maximum_items .* must be >= minimum_items"):
            MealCombinationPolicy(minimum_items=3, maximum_items=2)

        # maximum_combinations_evaluated < 1
        with pytest.raises(ValueError, match="maximum_combinations_evaluated must be >= 1"):
            MealCombinationPolicy(maximum_combinations_evaluated=0)

        # maximum_alternatives < 0
        with pytest.raises(ValueError, match="maximum_alternatives must be >= 0"):
            MealCombinationPolicy(maximum_alternatives=-1)

    def test_required_entity_count_exceeds_max_items(self, base_setup):
        """Requirement 5 & 6: Fails explicitly when required count > maximum_items."""
        _, _, cand_result, _ = base_setup
        policy = MealCombinationPolicy(minimum_items=1, maximum_items=2)
        ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001", "PK_COMP_001", "PK_COMP_015"],
        )
        constraints = {
            "PK_PORTION_001": PortionConstraint("PK_PORTION_001", 40.0, 120.0),
            "PK_COMP_001": PortionConstraint("PK_COMP_001", 50.0, 150.0),
            "PK_COMP_015": PortionConstraint("PK_COMP_015", 50.0, 200.0),
        }

        is_valid, reason, details, _ = validate_required_entities(
            context=ctx,
            candidate_result=cand_result,
            constraints_by_id=constraints,
            policy=policy,
        )

        assert is_valid is False
        assert reason == RequiredEntityFailureReason.REQUIRED_ENTITY_COUNT_EXCEEDS_MAX_ITEMS
        assert any("exceeds maximum_items" in d for d in details)

    def test_required_entity_not_phase6a_eligible(self, base_setup):
        """Requirement 5: Distinguishes role-ineligible / non-Phase-6A required food."""
        _, _, cand_result, _ = base_setup
        policy = MealCombinationPolicy()
        # PK_DISH_009 is Chicken Curry (Lunch/Dinner only, not breakfast)
        ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_DISH_009"],
        )
        constraints = {"PK_DISH_009": PortionConstraint("PK_DISH_009", 50.0, 150.0)}

        is_valid, reason, details, _ = validate_required_entities(
            context=ctx,
            candidate_result=cand_result,
            constraints_by_id=constraints,
            policy=policy,
        )

        assert is_valid is False
        assert reason == RequiredEntityFailureReason.REQUIRED_ENTITY_NOT_PHASE6A_ELIGIBLE
        assert any("not in the Phase 6A optimization-eligible pool" in d for d in details)

    def test_required_entity_explicitly_excluded(self, base_setup):
        """Requirement 5: Distinguishes caller-excluded required food."""
        _, _, cand_result, _ = base_setup
        policy = MealCombinationPolicy()
        ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001"],
            explicitly_excluded_ids=["PK_PORTION_001"],
        )
        constraints = {"PK_PORTION_001": PortionConstraint("PK_PORTION_001", 40.0, 120.0)}

        is_valid, reason, details, _ = validate_required_entities(
            context=ctx,
            candidate_result=cand_result,
            constraints_by_id=constraints,
            policy=policy,
        )

        assert is_valid is False
        assert reason == RequiredEntityFailureReason.REQUIRED_ENTITY_EXPLICITLY_EXCLUDED
        assert any("explicitly excluded" in d for d in details)

    def test_required_entity_missing_portion_constraint(self, base_setup):
        """Requirement 5: Distinguishes required food missing portion constraint."""
        _, _, cand_result, _ = base_setup
        policy = MealCombinationPolicy()
        ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001"],
        )
        constraints = {}  # Missing constraint for PK_PORTION_001

        is_valid, reason, details, _ = validate_required_entities(
            context=ctx,
            candidate_result=cand_result,
            constraints_by_id=constraints,
            policy=policy,
        )

        assert is_valid is False
        assert reason == RequiredEntityFailureReason.REQUIRED_ENTITY_MISSING_PORTION_CONSTRAINT
        assert any("no caller-supplied portion constraint" in d for d in details)

    def test_preferred_entities_full_classification(self, base_setup):
        """Requirement 4: Validates all 5 preferred entity classifications."""
        _, _, cand_result, catalog = base_setup
        constraints = {
            "PK_PORTION_001": PortionConstraint("PK_PORTION_001", 40.0, 120.0),
            # PK_COMP_001 deliberately omitted to test missing constraint
        }
        ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=[
                "PK_PORTION_001",  # VALID_PREFERRED_ENTITY
                "PK_COMP_001",     # NOT_IN_PHASE6A_POOL (missing constraint)
                "PK_PORTION_001",  # DUPLICATE
                "UNKNOWN_12345",   # UNKNOWN_ENTITY
                "PK_COMP_015",     # EXPLICITLY_EXCLUDED
                "PK_DISH_009",     # NOT_IN_PHASE6A_POOL (lunch only)
            ],
            explicitly_excluded_ids=["PK_COMP_015"],
        )

        valid_ids, records, status, warnings = classify_preferred_entities(
            context=ctx,
            candidate_result=cand_result,
            constraints_by_id=constraints,
            master_catalog=catalog,
        )

        assert records[0].classification == PreferredEntityClassification.VALID_PREFERRED_ENTITY
        assert records[1].classification == PreferredEntityClassification.NOT_IN_PHASE6A_POOL
        assert records[2].classification == PreferredEntityClassification.DUPLICATE
        assert records[3].classification == PreferredEntityClassification.UNKNOWN_ENTITY
        assert records[4].classification == PreferredEntityClassification.EXPLICITLY_EXCLUDED
        assert records[5].classification == PreferredEntityClassification.NOT_IN_PHASE6A_POOL
        assert status == PreferredEntityStatus.PARTIALLY_AVAILABLE
        assert valid_ids == ["PK_PORTION_001"]
        assert any("PREFERRED_ENTITY_UNAVAILABLE" in w for w in warnings)

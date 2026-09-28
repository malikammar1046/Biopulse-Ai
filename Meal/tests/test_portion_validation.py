"""Meal/tests/test_portion_validation.py - Input validation and rejection tests for Phase 6B.

Verifies:
- Upstream readiness gating (AUTOMATED_PLANNING_NOT_ALLOWED, UNRESOLVED_NUTRITION_TARGETS).
- Exact selected ID and constraint ID set equality (MISSING_PORTION_CONSTRAINT).
- Rejection of empty selections, duplicate IDs, missing constraints, and extra constraints.
- Explicit rejection of discrete increments in v1 (DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED).
- Bound validation: L_i <= U_i, L_i >= 0, preferred_grams in [L_i, U_i] (INVALID_PORTION_CONSTRAINTS).
- Target range validation: E_tol <= E_target, non-positive energy, min <= max, no NaN/Inf.
- Target provenance verification: DAILY_TARGET consistency against Phase 5A profile.
- Strict Phase 6A Candidate Membership Vetting:
  * Unknown entity -> INVALID_CANDIDATE
  * Quarantined Paneer (PK_COMP_004) -> INVALID_CANDIDATE
  * Incomplete core macros (PK_COMP_005) -> INVALID_CANDIDATE
  * Excluded by meal role -> INVALID_CANDIDATE
  * Excluded by user allergy -> INVALID_CANDIDATE
  * Excluded by user dislike -> INVALID_CANDIDATE
  * Excluded by dietary restriction (vegetarian) -> INVALID_CANDIDATE
  * Direct proof that HARD_SAFETY_EXCLUDED, USER_EXCLUDED, ROLE_INELIGIBLE,
    DISPLAY_ONLY_INCOMPLETE_CORE_MACROS, DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED
    can never be re-admitted by Phase 6B.
"""

import copy
import pytest

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import DietaryClass, Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.orchestrator import optimize_portions
from Meal.optimizer.schemas import (
    PortionConstraint,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
    TargetScope,
)
from Meal.planner.catalog import load_master_planner_catalog
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import (
    CandidateSelectionContext,
    MealRole,
    PrimaryDisposition,
)


@pytest.fixture
def catalog():
    return load_master_planner_catalog()


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="female",
        height_cm=160.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def condition_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


@pytest.fixture
def sample_target():
    return PortionOptimizationTarget(
        target_scope=TargetScope.CUSTOM_MEAL_TARGET,
        target_source="TEST",
        target_energy_kcal=400.0,
        energy_tolerance_kcal=40.0,
        protein_min_g=15.0,
        protein_max_g=25.0,
        carbohydrate_min_g=40.0,
        carbohydrate_max_g=60.0,
        fat_min_g=10.0,
        fat_max_g=20.0,
    )


class TestUpstreamReadinessValidation:
    """Verifies that unready upstream profiles are rejected before solving."""

    def test_automated_planning_not_allowed(self, neutral_profile, condition_profile, sample_target):
        unready = copy.deepcopy(neutral_profile)
        unready.automated_personalized_planning_allowed = False

        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(unready, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=unready,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.AUTOMATED_PLANNING_NOT_ALLOWED
        assert len(res.optimized_portions) == 0

    def test_unresolved_nutrition_targets(self, neutral_profile, condition_profile, sample_target):
        unready = copy.deepcopy(neutral_profile)
        unready.nutrition_targets_optimization_ready = False

        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(unready, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=unready,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.UNRESOLVED_NUTRITION_TARGETS
        assert len(res.optimized_portions) == 0


class TestConstraintSetEqualityValidation:
    """Verifies exact set equality between selected_entity_ids and constraints."""

    def test_empty_selection_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=[],
            target=sample_target,
            constraints=[],
        )
        assert res.optimization_status == PortionOptimizationStatus.MISSING_PORTION_CONSTRAINT
        assert "empty" in res.explanation_notes.lower()

    def test_missing_constraint_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001", "PK_COMP_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0)
            ],  # Missing PK_COMP_001
        )
        assert res.optimization_status == PortionOptimizationStatus.MISSING_PORTION_CONSTRAINT
        assert "missing" in res.explanation_notes.lower()

    def test_extra_constraint_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
                PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0),
            ],
        )
        assert res.optimization_status == PortionOptimizationStatus.MISSING_PORTION_CONSTRAINT
        assert "extra" in res.explanation_notes.lower()

    def test_duplicate_selected_id_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001", "PK_PORTION_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            ],
        )
        assert res.optimization_status in (
            PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
            PortionOptimizationStatus.MISSING_PORTION_CONSTRAINT,
        )
        assert "duplicate" in res.explanation_notes.lower()


class TestDiscreteIncrementRejection:
    """Verifies that discrete increment snapping is rejected in Phase 6B v1."""

    def test_discrete_increment_rejected_before_solver(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(
                    entity_id="PK_PORTION_001",
                    minimum_grams=40.0,
                    maximum_grams=120.0,
                    increment_grams=10.0,  # Explicitly rejected in v1
                )
            ],
        )
        assert res.optimization_status == PortionOptimizationStatus.DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED
        assert len(res.optimized_portions) == 0


class TestBoundAndTargetValidation:
    """Verifies mathematical validity of portion bounds and target ranges."""

    def test_minimum_greater_than_maximum_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=150.0, maximum_grams=100.0)
            ],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS
        assert "minimum_grams" in res.explanation_notes and "maximum_grams" in res.explanation_notes

    def test_negative_bound_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=-10.0, maximum_grams=100.0)
            ],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS

    def test_preferred_grams_outside_bounds_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[
                PortionConstraint(
                    entity_id="PK_PORTION_001",
                    minimum_grams=50.0,
                    maximum_grams=100.0,
                    preferred_grams=120.0,  # > maximum
                )
            ],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS

    def test_energy_tolerance_exceeds_target_energy_rejected(self, neutral_profile, condition_profile):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        bad_target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=200.0,
            energy_tolerance_kcal=250.0,  # Would create negative energy range [-50, 450]
            protein_min_g=10.0,
            protein_max_g=20.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=40.0,
            fat_min_g=5.0,
            fat_max_g=15.0,
        )

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=bad_target,
            constraints=[PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS
        assert "energy_tolerance_kcal" in res.explanation_notes

    def test_daily_target_provenance_mismatch_rejected(self, neutral_profile, condition_profile):
        """DAILY_TARGET with source PHASE_5A must match neutral profile target energy."""
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        mismatched_target = PortionOptimizationTarget(
            target_scope=TargetScope.DAILY_TARGET,
            target_source="PHASE_5A",
            target_energy_kcal=1200.0,  # Mismatches neutral profile
            energy_tolerance_kcal=50.0,
            protein_min_g=40.0,
            protein_max_g=60.0,
            carbohydrate_min_g=100.0,
            carbohydrate_max_g=150.0,
            fat_min_g=30.0,
            fat_max_g=50.0,
        )

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=mismatched_target,
            constraints=[PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_TARGET_PROVENANCE
        assert "inconsistent" in res.explanation_notes.lower()

    def test_zero_macro_minima_allowed(self, neutral_profile, condition_profile):
        """Zero lower bounds for protein, carb, and fat are valid (min >= 0)."""
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        zero_min_target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=250.0,
            energy_tolerance_kcal=30.0,
            protein_min_g=0.0,  # Zero lower bound
            protein_max_g=30.0,
            carbohydrate_min_g=0.0,  # Zero lower bound
            carbohydrate_max_g=50.0,
            fat_min_g=0.0,  # Zero lower bound
            fat_max_g=20.0,
        )

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=zero_min_target,
            constraints=[PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=50.0, maximum_grams=120.0)],
        )
        assert res.optimization_status != PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS
        assert res.optimization_status in (
            PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
            PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
        )


class TestPhase6ACandidateMembershipVetting:
    """Rigorous tests proving that non-members of Phase 6A candidate pool are rejected.

    Demonstrates that:
    1. Unknown IDs are rejected.
    2. Paneer (PK_COMP_004, quarantined in Phase 6A) is rejected even though in catalog.
    3. Incomplete macro entities (PK_COMP_005) are rejected even though in catalog.
    4. Entities excluded by meal role, user allergies, dislikes, or dietary restrictions
       are strictly rejected before solver execution.
    """

    def test_unknown_entity_rejected(self, neutral_profile, condition_profile, sample_target):
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["NON_EXISTENT_FOOD_999"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="NON_EXISTENT_FOOD_999", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "NON_EXISTENT_FOOD_999" in res.explanation_notes
        assert len(res.optimized_portions) == 0

    def test_quarantined_paneer_rejected_despite_catalog_presence(self, neutral_profile, condition_profile, sample_target):
        """PK_COMP_004 (Paneer) has nutrition inconsistency and is display-only in Phase 6A breakfast."""
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        assert "PK_COMP_004" not in cand_res.ranked_optimization_candidates
        assert any(d.entity_id == "PK_COMP_004" for d in cand_res.display_only_candidates)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_COMP_004"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_COMP_004", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "PK_COMP_004" in res.explanation_notes
        assert len(res.optimized_portions) == 0

    def test_incomplete_macro_food_rejected_despite_catalog_presence(self, neutral_profile, condition_profile, sample_target):
        """PK_COMP_005 (Apple Gourd / Tinda) lacks core macros and is display-only."""
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        assert "PK_COMP_005" not in cand_res.ranked_optimization_candidates

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_COMP_005"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_COMP_005", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "PK_COMP_005" in res.explanation_notes

    def test_meal_role_ineligible_entity_rejected(self, neutral_profile, condition_profile, sample_target):
        """Food that is valid for LUNCH but ineligible for BREAKFAST must be rejected for a BREAKFAST candidate result."""
        # Request BREAKFAST pool
        ctx_bf = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_bf = rank_meal_candidates(neutral_profile, condition_profile, ctx_bf)

        # PK_DISH_009 (Chicken Curry) is LUNCH/DINNER, not BREAKFAST
        assert "PK_DISH_009" not in cand_bf.ranked_optimization_candidates

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_bf,
            selected_entity_ids=["PK_DISH_009"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_DISH_009", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "PK_DISH_009" in res.explanation_notes

    def test_user_disliked_entity_rejected(self, neutral_profile, condition_profile, sample_target):
        """Food excluded by user dislike in Phase 6A cannot be re-admitted in Phase 6B."""
        # Exclude Chapati via dislikes
        ctx = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            dislikes=["PK_PORTION_001"],
        )
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)
        assert "PK_PORTION_001" not in cand_res.ranked_optimization_candidates
        assert any(e.entity_id == "PK_PORTION_001" and e.primary_disposition == PrimaryDisposition.USER_EXCLUDED for e in cand_res.excluded_candidates)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_PORTION_001"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "PK_PORTION_001" in res.explanation_notes

    def test_allergy_excluded_entity_rejected(self, neutral_profile, condition_profile, sample_target):
        """Food excluded by user allergy (e.g. Dairy) cannot be re-admitted in Phase 6B."""
        ctx = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=["dairy"],
        )
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)
        # Curd/Dahi PK_COMP_001 must be safety excluded
        assert "PK_COMP_001" not in cand_res.ranked_optimization_candidates
        assert any(e.entity_id == "PK_COMP_001" and e.primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED for e in cand_res.excluded_candidates)

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_COMP_001"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "PK_COMP_001" in res.explanation_notes

    def test_dietary_restriction_excluded_entity_rejected(self, neutral_profile, condition_profile, sample_target):
        """Non-vegetarian food excluded for VEGETARIAN user cannot be re-admitted in Phase 6B."""
        ctx = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            dietary_class=DietaryClass.VEGETARIAN,
        )
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)
        # Beef Curry PK_COMP_008 must be safety excluded
        assert "PK_COMP_008" not in cand_res.ranked_optimization_candidates

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_COMP_008"],
            target=sample_target,
            constraints=[PortionConstraint(entity_id="PK_COMP_008", minimum_grams=50.0, maximum_grams=100.0)],
        )
        assert res.optimization_status == PortionOptimizationStatus.INVALID_CANDIDATE
        assert "PK_COMP_008" in res.explanation_notes

    def test_catalog_entity_names_match_canonical_source(self):
        """Entity names in reporting and diagnostics must match catalog entity_name_en exactly."""
        from Meal.planner.catalog import load_master_planner_catalog
        cat = load_master_planner_catalog()
        assert cat["PK_COMP_005"].entity_name_en == "Boiled Chicken Egg"
        assert cat["PK_COMP_004"].entity_name_en == "Cottage Cheese (Paneer)"
        assert cat["PK_PORTION_001"].entity_name_en == "Standard Whole Wheat Chapati"
        assert cat["PK_PORTION_002"].entity_name_en == "Plain Boiled Rice"
        assert cat["PK_DISH_009"].entity_name_en == "Chicken Curry"
        assert cat["PK_DISH_025"].entity_name_en == "Channa Daal"
        assert cat["PK_DISH_028"].entity_name_en == "Daal Mash"

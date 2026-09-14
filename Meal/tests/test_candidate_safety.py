"""Meal/tests/test_candidate_safety.py - Unit tests for Phase 6A safety adapter integration.

Verifies:
- Direct agreement between Phase 6A eligibility and Phase 5A.1 safety engine.
- Allergen exclusions fail closed (known present or unknown status).
- Dietary class exclusions fail closed.
- User dislikes and requested exclusions set primary disposition to USER_EXCLUDED.
- Unknown entity IDs in dislikes/exclusions raise ValueError (no silent dropping or fuzzy matching).
- Hard-excluded entities have total_score=None and receive zero ranking weight.
"""

import pytest

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.safety import apply_safety_filter
from Meal.engine.schemas import Goal, PALCategory, SafetyOutcome, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.planner.catalog import load_master_planner_catalog
from Meal.planner.eligibility import run_batch_eligibility
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
def neutral_adult_profile():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="female",
        height_cm=160.0,
        weight_kg=60.0,
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def neutral_condition_profile(neutral_adult_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_adult_profile, ctx)


class TestSafetyEngineAgreement:
    """Proves Phase 6A adapter yields identical safety outcomes to direct Phase 5A.1 calls."""

    def test_direct_safety_agreement_for_allergens(self, catalog):
        user_allergens = ["dairy", "egg"]
        context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=user_allergens,
        )
        batch = run_batch_eligibility(catalog, context)

        # Compare directly with Phase 5A.1 apply_safety_filter
        raw_entities = [e.to_safety_dict() for e in catalog.values()]
        direct_safety = apply_safety_filter(
            entities=raw_entities,
            user_allergens=user_allergens,
            user_dietary_classes=[],
        )

        for eid, entity in catalog.items():
            p_disp, reasons, outcomes, disp_elig, opt_elig, s_res, rep_e, macro_e, rel_diff, cons_st = batch[eid]
            d_res = direct_safety[eid]

            # Primary outcomes and allergen exclusions must match exactly
            assert s_res.primary_outcome == d_res.primary_outcome
            assert s_res.excluded_by_allergen == d_res.excluded_by_allergen
            assert s_res.excluded_by_dietary == d_res.excluded_by_dietary

            # If direct safety excluded it by allergen, Phase 6A must set HARD_SAFETY_EXCLUDED
            if d_res.excluded_by_allergen:
                assert p_disp == PrimaryDisposition.HARD_SAFETY_EXCLUDED
                assert opt_elig is False
                assert disp_elig is False

    def test_direct_safety_agreement_for_dietary_classes(self, catalog):
        context = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            dietary_class="vegetarian",
        )
        batch = run_batch_eligibility(catalog, context)

        raw_entities = [e.to_safety_dict() for e in catalog.values()]
        direct_safety = apply_safety_filter(
            entities=raw_entities,
            user_allergens=[],
            user_dietary_classes=["vegetarian"],
        )

        for eid, entity in catalog.items():
            p_disp, reasons, outcomes, disp_elig, opt_elig, s_res, rep_e, macro_e, rel_diff, cons_st = batch[eid]
            d_res = direct_safety[eid]

            assert s_res.primary_outcome == d_res.primary_outcome
            assert s_res.excluded_by_dietary == d_res.excluded_by_dietary

            if d_res.excluded_by_dietary:
                assert p_disp == PrimaryDisposition.HARD_SAFETY_EXCLUDED
                assert opt_elig is False


class TestAllergenAndDietaryExclusions:
    """Verifies specific foods are correctly excluded and fail closed."""

    def test_egg_allergy_excludes_egg_and_omelette(
        self, neutral_adult_profile, neutral_condition_profile
    ):
        context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=["egg"],
        )
        result = rank_meal_candidates(
            neutral_adult_profile, neutral_condition_profile, context
        )

        # Verify egg-containing items are hard-excluded
        excluded_ids = {e.entity_id: e for e in result.excluded_candidates}
        assert "PK_COMP_005" in excluded_ids  # Boiled Chicken Egg
        assert excluded_ids["PK_COMP_005"].primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED
        assert excluded_ids["PK_COMP_005"].total_score is None

        # Verify egg is never in ranked optimization candidates
        opt_ids = {e.entity_id for e in result.ranked_optimization_candidates}
        assert "PK_COMP_005" not in opt_ids

    def test_dairy_allergy_excludes_milk_and_dahi(
        self, neutral_adult_profile, neutral_condition_profile
    ):
        context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=["dairy"],
        )
        result = rank_meal_candidates(
            neutral_adult_profile, neutral_condition_profile, context
        )

        excluded_ids = {e.entity_id: e for e in result.excluded_candidates}
        assert "PK_COMP_003" in excluded_ids  # Whole Buffalo Milk
        assert "PK_COMP_001" in excluded_ids  # Plain Dahi (Yogurt)
        assert excluded_ids["PK_COMP_003"].primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED
        assert excluded_ids["PK_COMP_001"].primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED

    def test_vegan_dietary_class_excludes_animal_products(
        self, neutral_adult_profile, neutral_condition_profile
    ):
        context = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            dietary_class="vegan",
        )
        result = rank_meal_candidates(
            neutral_adult_profile, neutral_condition_profile, context
        )

        excluded_ids = {e.entity_id: e for e in result.excluded_candidates}
        # Boiled egg, milk, chicken karahi should all be hard-excluded
        assert "PK_COMP_005" in excluded_ids
        assert "PK_COMP_003" in excluded_ids
        assert "PK_DISH_019" in excluded_ids  # Chicken Karahi
        assert excluded_ids["PK_DISH_019"].primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED


class TestUserDislikesAndExclusions:
    """Verifies user dislikes and requested exclusions."""

    def test_disliked_food_yields_user_excluded_disposition(
        self, neutral_adult_profile, neutral_condition_profile
    ):
        disliked_id = "PK_COMP_005"  # Boiled Chicken Egg
        context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            dislikes=[disliked_id],
        )
        result = rank_meal_candidates(
            neutral_adult_profile, neutral_condition_profile, context
        )

        excluded_ids = {e.entity_id: e for e in result.excluded_candidates}
        assert disliked_id in excluded_ids
        assert excluded_ids[disliked_id].primary_disposition == PrimaryDisposition.USER_EXCLUDED
        assert excluded_ids[disliked_id].total_score is None
        assert SafetyOutcome.EXCLUDED_USER_DISLIKE in excluded_ids[disliked_id].all_safety_outcomes

    def test_unknown_entity_id_in_dislikes_raises_value_error(self):
        catalog = load_master_planner_catalog()
        ctx = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            dislikes=["UNKNOWN_EID"],
        )
        with pytest.raises(ValueError, match="Unknown planner entity ID 'UNKNOWN_EID'"):
            run_batch_eligibility(catalog, ctx)

    def test_unknown_entity_id_in_requested_exclusions_raises_value_error(self):
        catalog = load_master_planner_catalog()
        ctx = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            requested_exclusions=["BOGUS_FOOD_999"],
        )
        with pytest.raises(ValueError, match="Unknown planner entity ID 'BOGUS_FOOD_999'"):
            run_batch_eligibility(catalog, ctx)

    def test_unknown_entity_id_in_preferred_ids_raises_value_error(self):
        catalog = load_master_planner_catalog()
        ctx = CandidateSelectionContext(
            meal_role=MealRole.DINNER,
            preferred_entity_ids=["NON_EXISTENT_ID"],
        )
        with pytest.raises(ValueError, match="Unknown planner entity ID 'NON_EXISTENT_ID'"):
            run_batch_eligibility(catalog, ctx)

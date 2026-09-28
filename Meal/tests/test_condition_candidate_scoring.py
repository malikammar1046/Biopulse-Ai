"""Meal/tests/test_condition_candidate_scoring.py - Unit tests for condition evidence annotation and non-bias.

Verifies:
- PCOS and Male Hypogonadism do NOT create different food-specific medical boosts
  from otherwise identical neutral inputs (condition_score_status = NOT_USED_FOR_NUMERICAL_RANKING).
- PCOS never penalizes carbohydrates or staples (roti, daal, rice retain identical scores).
- Male Hypogonadism generates zero hormone-boosting or androgen claims/scores.
- Condition evidence context provides safe explanation tokens and evidence IDs only.
- CandidateSelectionContext structurally rejects unsupported inputs (risk scores, SHAP, ADAM, ML probabilities).
"""

import pytest

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import (
    CandidateSelectionContext,
    MealRole,
    ScoreStatus,
)


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=65.0,
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def pcos_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.PCOS,
        evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


@pytest.fixture
def hypogonadism_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
        evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


@pytest.fixture
def general_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


class TestNoDiseaseSpecificFoodScoring:
    """Proves PCOS and Hypogonadism produce identical food ranking to neutral/general profiles."""

    def test_pcos_and_hypogonadism_produce_identical_scores_and_rankings(
        self, neutral_profile, pcos_profile, hypogonadism_profile, general_profile
    ):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)

        res_pcos = rank_meal_candidates(neutral_profile, pcos_profile, context)
        res_hypo = rank_meal_candidates(neutral_profile, hypogonadism_profile, context)
        res_gen = rank_meal_candidates(neutral_profile, general_profile, context)

        # 1. Total counts must be identical
        assert res_pcos.optimization_eligible_count == res_hypo.optimization_eligible_count == res_gen.optimization_eligible_count
        assert res_pcos.display_only_incomplete_count == res_hypo.display_only_incomplete_count == res_gen.display_only_incomplete_count
        assert res_pcos.role_ineligible_count == res_hypo.role_ineligible_count == res_gen.role_ineligible_count

        # 2. Candidate lists must be identically ordered
        pcos_ids = [c.entity_id for c in res_pcos.ranked_optimization_candidates]
        hypo_ids = [c.entity_id for c in res_hypo.ranked_optimization_candidates]
        gen_ids = [c.entity_id for c in res_gen.ranked_optimization_candidates]
        assert pcos_ids == hypo_ids == gen_ids

        # 3. Individual candidate numerical scores must be 100% identical
        for cp, ch, cg in zip(
            res_pcos.ranked_optimization_candidates,
            res_hypo.ranked_optimization_candidates,
            res_gen.ranked_optimization_candidates,
        ):
            assert cp.entity_id == ch.entity_id == cg.entity_id
            assert cp.total_score == ch.total_score == cg.total_score
            assert cp.score_breakdown.condition_context_score is None
            assert ch.score_breakdown.condition_context_score is None
            assert cg.score_breakdown.condition_context_score is None
            assert (
                cp.score_breakdown.condition_context_status
                == ScoreStatus.NOT_USED_FOR_NUMERICAL_RANKING
            )

    def test_pcos_never_penalizes_carbohydrates_or_staples(
        self, neutral_profile, pcos_profile, general_profile
    ):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        res_pcos = rank_meal_candidates(neutral_profile, pcos_profile, context)
        res_gen = rank_meal_candidates(neutral_profile, general_profile, context)

        # Find staple or pulse dishes (e.g. PK_DISH_001 Kalool / Lobia, PK_DISH_006 Daal)
        pcos_cands = {c.entity_id: c for c in res_pcos.ranked_optimization_candidates}
        gen_cands = {c.entity_id: c for c in res_gen.ranked_optimization_candidates}

        for eid in pcos_cands:
            if "daal" in pcos_cands[eid].display_name.lower() or "lobia" in pcos_cands[eid].display_name.lower():
                assert pcos_cands[eid].total_score == gen_cands[eid].total_score
                # Ensure no penalty explanation
                assert not any("LOW_CARB_PENALTY" in t for t in pcos_cands[eid].explanation_tokens)


class TestConditionExplanationTokens:
    """Verifies condition evidence context appears only as safe tokens and evidence IDs."""

    def test_safe_condition_explanation_tokens_and_evidence_ids(
        self, neutral_profile, pcos_profile
    ):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        res = rank_meal_candidates(neutral_profile, pcos_profile, context)

        cands = res.ranked_optimization_candidates
        assert len(cands) > 0
        first = cands[0]

        # Safe alignment tokens
        assert "MATCHES_REQUESTED_MEAL_ROLE" in first.explanation_tokens
        assert "CORE_MACROS_COMPLETE" in first.explanation_tokens
        assert "GENERAL_HEALTHY_EATING_CONTEXT_ALIGNED" in first.explanation_tokens
        assert "NO_SPECIFIC_DIET_SUPERIORITY_ALIGNED" in first.explanation_tokens

        # Evidence IDs must be present
        assert len(first.evidence_ids_used) > 0
        assert any("PCOS" in eid for eid in first.evidence_ids_used)


class TestStructuralInputRejection:
    """Verifies CandidateSelectionContext strictly rejects non-planner / ML fields."""

    def test_dataclass_constructor_rejects_ml_fields(self):
        with pytest.raises(TypeError, match="unexpected keyword argument 'screening_probability'"):
            CandidateSelectionContext(
                meal_role=MealRole.BREAKFAST,
                screening_probability=0.85,  # type: ignore
            )

        with pytest.raises(TypeError, match="unexpected keyword argument 'shap_values'"):
            CandidateSelectionContext(
                meal_role=MealRole.BREAKFAST,
                shap_values={"age": 0.4},  # type: ignore
            )

        with pytest.raises(TypeError, match="unexpected keyword argument 'risk_score'"):
            CandidateSelectionContext(
                meal_role=MealRole.BREAKFAST,
                risk_score=72.5,  # type: ignore
            )

        with pytest.raises(TypeError, match="unexpected keyword argument 'adam_score'"):
            CandidateSelectionContext(
                meal_role=MealRole.BREAKFAST,
                adam_score=4,  # type: ignore
            )

    def test_from_dict_strictly_rejects_unknown_fields(self):
        with pytest.raises(ValueError, match="Unknown or prohibited fields in CandidateSelectionContext"):
            CandidateSelectionContext.from_dict({
                "meal_role": "breakfast",
                "risk_score": 0.9,
                "model_features": ["f1", "f2"],
            })

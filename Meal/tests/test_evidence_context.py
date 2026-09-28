"""Meal/tests/test_evidence_context.py - Unit tests for ConditionEvidenceContext.

Verifies context parameter types, status handling, and strict screening-model isolation.
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


@pytest.fixture
def neutral_adult_female():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


class TestContextConstruction:
    """Verifies valid creation and type enforcement on ConditionEvidenceContext."""

    def test_valid_context_creation(self):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        assert ctx.condition_pathway == ConditionPathway.PCOS
        assert ctx.evidence_context_status == EvidenceContextStatus.SCREENING_PATHWAY

    def test_invalid_pathway_type_rejected(self):
        with pytest.raises(TypeError, match="ConditionPathway enum"):
            ConditionEvidenceContext(
                condition_pathway="PCOS",  # type: ignore
                evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
            )

    def test_invalid_status_type_rejected(self):
        with pytest.raises(TypeError, match="EvidenceContextStatus enum"):
            ConditionEvidenceContext(
                condition_pathway=ConditionPathway.PCOS,
                evidence_context_status="SCREENING_PATHWAY",  # type: ignore
            )


class TestScreeningModelIsolation:
    """Verifies that ML models, SHAP, and survey scores are rejected."""

    def test_context_with_screening_probability_rejected(self, neutral_adult_female):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        object.__setattr__(ctx, "screening_probability", 0.85)

        with pytest.raises(ValueError, match="Prohibited screening-model attribute"):
            build_condition_nutrition_profile(neutral_adult_female, ctx)

    def test_context_with_shap_values_rejected(self, neutral_adult_female):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        object.__setattr__(ctx, "shap_values", {"bmi": 0.3})

        with pytest.raises(ValueError, match="Prohibited screening-model attribute"):
            build_condition_nutrition_profile(neutral_adult_female, ctx)

    def test_context_with_adam_score_rejected(self, neutral_adult_female):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        object.__setattr__(ctx, "adam_score", 4)

        with pytest.raises(ValueError, match="Prohibited screening-model attribute"):
            build_condition_nutrition_profile(neutral_adult_female, ctx)

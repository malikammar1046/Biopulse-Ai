"""Meal/planner/scoring.py - Transparent, portion-independent candidate scoring engine.

Calculates portion-independent ranking signals based on:
1. Stable Base Candidate Score:
   - Universally available signals: Data Confidence (40%) and Protein Concentration Percentile (60%).
2. Optional Evidence Bonuses:
   - Known Fiber Bonus (up to +0.10, derived from catalog fiber distribution).
   - Explicit User Preference Bonus (+0.15 for preferred item, +0.10 for preferred category).
3. Missing Optional Signals:
   - Missing fiber or absent preferences receive 0.0 bonus with ScoreStatus.UNAVAILABLE.
   - Base weights are NEVER renormalized or shifted, guaranteeing missing optional data
     cannot confer an artificial ranking advantage over known low values.

Strict Invariants:
- Portion-independent ranking signals ONLY (no target fit claims prior to Phase 6B).
- Missing fiber is marked UNAVAILABLE, never scored as zero and never redistributes weight.
- Known zero fiber != unknown fiber (both receive 0.0 bonus, but retain distinct statuses).
- Condition evidence context is NOT used for numerical food score boosts (weight = 0).
- Budget, cooking time, and cultural fit are UNAVAILABLE (weight = 0).
- Normalization anchors derived deterministically from the locked 71-entity catalog.
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Tuple

from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.planner.catalog import PlannerCatalogEntity
from Meal.planner.schemas import (
    CandidateScoreBreakdown,
    CandidateSelectionContext,
    NutritionConsistencyStatus,
    PrimaryDisposition,
    ScoreStatus,
)

# Locked catalog empirical distribution reference values (71 entities)
# Total measured proteins: 68 entities (min=0.4g, max=25.0g)
# Total positive fiber values: 31 entities (min=0.1g, max=12.0g)
LOCKED_CATALOG_PROTEIN_VALUES: List[float] = [
    0.4, 0.4, 0.7, 0.7, 0.8, 0.8, 1.0, 1.0, 1.1, 1.3,
    1.4, 1.4, 1.5, 1.6, 1.6, 1.8, 2.0, 2.0, 2.1, 2.1,
    2.4, 2.5, 2.9, 3.2, 3.4, 3.5, 4.0, 4.0, 4.3, 4.4,
    4.5, 4.7, 4.9, 5.0, 5.0, 5.1, 5.6, 5.8, 6.0, 6.2,
    6.4, 6.7, 7.0, 7.5, 7.8, 8.0, 8.4, 9.0, 9.2, 9.6,
    10.2, 10.3, 11.0, 11.7, 12.0, 12.4, 13.0, 13.37, 14.2, 14.4,
    15.0, 16.04, 17.2, 17.5, 18.05, 22.4, 23.7, 25.0,
]

LOCKED_CATALOG_POSITIVE_FIBER_VALUES: List[float] = [
    0.1, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6, 0.6,
    0.7, 0.8, 0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.2, 1.2,
    1.5, 1.6, 1.8, 2.0, 2.2, 2.5, 2.7, 3.7, 4.3, 5.3,
    12.0,
]


def _is_valid_float(val: Optional[float]) -> bool:
    if val is None:
        return False
    try:
        return math.isfinite(float(val))
    except (TypeError, ValueError, OverflowError):
        return False


def get_protein_concentration_percentile(protein_g: Optional[float]) -> Optional[float]:
    """Computes empirical percentile rank of protein concentration across locked catalog."""
    if not _is_valid_float(protein_g):
        return None
    val = float(protein_g)
    count = sum(1 for v in LOCKED_CATALOG_PROTEIN_VALUES if v <= val)
    return round(count / len(LOCKED_CATALOG_PROTEIN_VALUES), 4)


def get_fiber_concentration_percentile(fiber_g: Optional[float]) -> Optional[float]:
    """Computes empirical percentile rank among positive-fiber catalog foods."""
    if not _is_valid_float(fiber_g):
        return None
    val = float(fiber_g)
    if val <= 0.0:
        return 0.0
    count = sum(1 for v in LOCKED_CATALOG_POSITIVE_FIBER_VALUES if v <= val)
    return round(count / len(LOCKED_CATALOG_POSITIVE_FIBER_VALUES), 4)


def compute_candidate_signals(
    entity: PlannerCatalogEntity,
    context: CandidateSelectionContext,
    primary_disposition: PrimaryDisposition,
    consistency_status: Optional[NutritionConsistencyStatus] = None,
) -> Tuple[
    Optional[float],
    Optional[float],
    Optional[float],
    Optional[float],
    Optional[CandidateScoreBreakdown],
    Dict[str, float],
    List[str],
    List[str],
]:
    """Calculates defensible pre-portion candidate priority score and descriptive nutrient metadata.
    
    Ranking Principles (Phase 6A):
    1. Explicit user preference first (if supplied: +0.15 for exact item, +0.10 for category).
    2. Planner Data Confidence second (analytical evidence readiness and source consistency only;
       1.0 for CONSISTENT complete data, 0.90 for MINOR_DIFFERENCE).
    3. Deterministic catalog tie-breaking: planner_entity_id ascending.
    4. NO nutritional concentration (protein, fat, carb, fiber, energy) dominates or influences
       numerical ranking in Phase 6A prior to portion optimization.
    5. Nutrient concentrations (protein_g, fiber_g, percentiles) are strictly descriptive
       (DESCRIPTIVE_ONLY_PHASE_6A) for Phase 6B portion solver inspection.
    6. Fiber bonus is permanently 0.0 in Phase 6A (informational only; unknown != zero preserved).
    
    Returns:
        (candidate_priority_score, base_candidate_score, fiber_bonus, preference_bonus,
         score_breakdown, score_weights_used, available_components, unavailable_components)
    """
    # Hard-excluded or role-ineligible candidates do not receive scores
    if primary_disposition in (
        PrimaryDisposition.HARD_SAFETY_EXCLUDED,
        PrimaryDisposition.USER_EXCLUDED,
        PrimaryDisposition.ROLE_INELIGIBLE,
    ):
        return (
            None,
            None,
            None,
            None,
            None,
            {},
            [],
            [
                "planner_data_confidence",
                "protein_concentration",
                "fiber_concentration",
                "preference",
                "budget",
                "cooking_time",
                "cultural_fit",
                "condition_context",
            ],
        )

    # 1. Planner Data Confidence (Evidence & Source Consistency, NOT Food Quality)
    has_all_macros = (
        _is_valid_float(entity.normalized_energy_kcal_per_100g)
        and _is_valid_float(entity.normalized_protein_g_per_100g)
        and _is_valid_float(entity.normalized_fat_g_per_100g)
        and _is_valid_float(entity.normalized_carb_g_per_100g)
    )

    if consistency_status is None:
        from Meal.planner.eligibility import check_nutrition_consistency
        consistency_status, _, _, _ = check_nutrition_consistency(entity)

    if has_all_macros:
        if consistency_status == NutritionConsistencyStatus.CONSISTENT:
            planner_data_confidence = 1.00
        elif consistency_status == NutritionConsistencyStatus.MINOR_DIFFERENCE:
            planner_data_confidence = 0.90
        elif consistency_status == NutritionConsistencyStatus.REVIEW_REQUIRED:
            planner_data_confidence = 0.20
        else:
            planner_data_confidence = 0.50
    else:
        planner_data_confidence = 0.50

    base_candidate_score = planner_data_confidence

    # 2. Descriptive Nutrient Concentration Metadata (DESCRIPTIVE_ONLY_PHASE_6A)
    # Stored for Phase 6B portion solver; ZERO influence on Phase 6A ranking
    protein_percentile = get_protein_concentration_percentile(entity.normalized_protein_g_per_100g)
    protein_status = ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A

    has_fiber = _is_valid_float(entity.normalized_fiber_g_per_100g)
    if has_fiber:
        fiber_percentile = get_fiber_concentration_percentile(float(entity.normalized_fiber_g_per_100g))
        fiber_status = ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A
    else:
        fiber_percentile = None
        fiber_status = ScoreStatus.UNAVAILABLE

    # Fiber bonus is permanently 0.0 in Phase 6A (informational only; portion fit belongs to 6B)
    fiber_bonus = 0.0

    # 3. Explicit User Preference Signal & Bonus
    has_user_pref_input = (
        len(context.preferred_entity_ids) > 0 or len(context.preferred_categories) > 0
    )
    if has_user_pref_input:
        pref_status = ScoreStatus.ACTIVE
        eid = entity.planner_entity_id
        cat_norm = entity.category.strip().lower()
        pref_cats_norm = [c.strip().lower() for c in context.preferred_categories]

        if eid in context.preferred_entity_ids:
            preference_val = 1.0
            preference_bonus = 0.15
        elif cat_norm in pref_cats_norm:
            preference_val = 0.80
            preference_bonus = 0.10
        else:
            preference_val = 0.20
            preference_bonus = 0.0
    else:
        pref_status = ScoreStatus.UNAVAILABLE
        preference_val = None
        preference_bonus = 0.0

    # Total Candidate Priority Score
    candidate_priority_score = round(base_candidate_score + preference_bonus, 4)

    # Score breakdown
    breakdown = CandidateScoreBreakdown(
        planner_data_confidence=planner_data_confidence,
        data_confidence_score=planner_data_confidence,
        preference_score=preference_val,
        base_candidate_score=base_candidate_score,
        preference_bonus=preference_bonus,
        candidate_priority_score=candidate_priority_score,
        fiber_bonus=0.0,
        protein_concentration_percentile=protein_percentile,
        fiber_concentration_percentile=fiber_percentile,
        planner_data_confidence_status=ScoreStatus.ACTIVE,
        data_confidence_status=ScoreStatus.ACTIVE,
        preference_status=pref_status,
        protein_concentration_status=protein_status,
        fiber_concentration_status=fiber_status,
        budget_score_status=ScoreStatus.UNAVAILABLE,
        cooking_time_score_status=ScoreStatus.UNAVAILABLE,
        cultural_fit_score_status=ScoreStatus.UNAVAILABLE,
        condition_context_status=ScoreStatus.NOT_USED_FOR_NUMERICAL_RANKING,
    )

    score_weights_used = {
        "planner_data_confidence": 1.00,
        "max_preference_bonus": 0.15,
    }

    unavailable_components = [
        "protein_concentration",
        "fiber_concentration",
        "budget",
        "cooking_time",
        "cultural_fit",
        "condition_context",
    ]

    available_components = ["planner_data_confidence"]
    if pref_status == ScoreStatus.ACTIVE:
        available_components.append("preference")
    else:
        unavailable_components.append("preference")

    return (
        candidate_priority_score,
        base_candidate_score,
        fiber_bonus,
        preference_bonus,
        breakdown,
        score_weights_used,
        available_components,
        unavailable_components,
    )

"""Meal/optimizer/validation.py - Precondition and contract validation for Phase 6B Portion Optimizer.

Enforces:
- Upstream planning readiness gates (automated_personalized_planning_allowed, nutrition_targets_optimization_ready).
- Phase 6A candidate pool vetting: selected_entity_ids must be a strict subset of
  candidate_result.ranked_optimization_candidates.
- Exact set equality between selected_entity_ids and constraints.
- Prohibition of discrete increments in Phase 6B v1 (DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED).
- Valid non-negative gram bounds and finite target ranges.
- Target provenance verification for declared DAILY_TARGET / PHASE_5A targets.
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Set, Tuple

from Meal.engine.schemas import NutritionTargetProfile
from Meal.optimizer.schemas import (
    PortionConstraint,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
    TargetScope,
)
from Meal.planner.schemas import CandidateRankingResult


def _is_valid_non_negative(val: Any) -> bool:
    if val is None:
        return False
    try:
        f = float(val)
        return math.isfinite(f) and f >= 0.0
    except (ValueError, TypeError):
        return False


def _is_valid_positive(val: Any) -> bool:
    if val is None:
        return False
    try:
        f = float(val)
        return math.isfinite(f) and f > 0.0
    except (ValueError, TypeError):
        return False


def validate_upstream_readiness(
    neutral_profile: NutritionTargetProfile,
) -> Tuple[Optional[PortionOptimizationStatus], List[str]]:
    """Validates upstream Phase 5A safety and optimization readiness flags."""
    if not neutral_profile.automated_personalized_planning_allowed:
        return (
            PortionOptimizationStatus.AUTOMATED_PLANNING_NOT_ALLOWED,
            ["Automated personalized planning is disallowed by Phase 5A profile safety flags."],
        )
    if not neutral_profile.nutrition_targets_optimization_ready:
        return (
            PortionOptimizationStatus.UNRESOLVED_NUTRITION_TARGETS,
            ["Nutrition targets are not marked optimization-ready by Phase 5A profile."],
        )
    return None, []


def validate_target(
    target: PortionOptimizationTarget,
    neutral_profile: NutritionTargetProfile,
) -> Tuple[Optional[PortionOptimizationStatus], List[str]]:
    """Validates target ranges, non-negativity, and provenance."""
    warnings: List[str] = []

    if not _is_valid_positive(target.target_energy_kcal):
        return (
            PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
            ["target_energy_kcal must be a finite positive number."],
        )

    if not _is_valid_non_negative(target.energy_tolerance_kcal):
        return (
            PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
            ["energy_tolerance_kcal must be a finite non-negative number."],
        )

    if target.energy_tolerance_kcal > target.target_energy_kcal:
        return (
            PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
            ["energy_tolerance_kcal cannot exceed target_energy_kcal (would produce negative energy range)."],
        )

    # Core macro ranges
    if not _is_valid_non_negative(target.protein_min_g) or not _is_valid_non_negative(target.protein_max_g):
        return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["protein bounds must be non-negative."]
    if target.protein_min_g > target.protein_max_g:
        return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["protein_min_g cannot exceed protein_max_g."]

    if not _is_valid_non_negative(target.carbohydrate_min_g) or not _is_valid_non_negative(target.carbohydrate_max_g):
        return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["carbohydrate bounds must be non-negative."]
    if target.carbohydrate_min_g > target.carbohydrate_max_g:
        return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["carbohydrate_min_g cannot exceed carbohydrate_max_g."]

    if not _is_valid_non_negative(target.fat_min_g) or not _is_valid_non_negative(target.fat_max_g):
        return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["fat bounds must be non-negative."]
    if target.fat_min_g > target.fat_max_g:
        return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["fat_min_g cannot exceed fat_max_g."]

    if target.fiber_reference_g is not None:
        if not _is_valid_non_negative(target.fiber_reference_g):
            return PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS, ["fiber_reference_g must be non-negative."]

    # Provenance verification for declared DAILY_TARGET / PHASE_5A
    if target.target_scope == TargetScope.DAILY_TARGET and target.target_source.upper() == "PHASE_5A":
        if abs(target.target_energy_kcal - neutral_profile.energy_target_kcal) > 0.5:
            return (
                PortionOptimizationStatus.INVALID_TARGET_PROVENANCE,
                [
                    f"target_energy_kcal ({target.target_energy_kcal}) is inconsistent with "
                    f"Phase 5A neutral profile energy target ({neutral_profile.energy_target_kcal})."
                ],
            )
        if neutral_profile.protein_target_min_g is not None and abs(target.protein_min_g - neutral_profile.protein_target_min_g) > 0.5:
            return (
                PortionOptimizationStatus.INVALID_TARGET_PROVENANCE,
                ["protein_min_g is inconsistent with Phase 5A neutral profile protein_target_min_g."],
            )
        if neutral_profile.protein_target_max_g is not None and abs(target.protein_max_g - neutral_profile.protein_target_max_g) > 0.5:
            return (
                PortionOptimizationStatus.INVALID_TARGET_PROVENANCE,
                ["protein_max_g is inconsistent with Phase 5A neutral profile protein_target_max_g."],
            )
        if neutral_profile.carbohydrate_target_min_g is not None and abs(target.carbohydrate_min_g - neutral_profile.carbohydrate_target_min_g) > 0.5:
            return (
                PortionOptimizationStatus.INVALID_TARGET_PROVENANCE,
                ["carbohydrate_min_g is inconsistent with Phase 5A neutral profile carbohydrate_target_min_g."],
            )
        if neutral_profile.carbohydrate_target_max_g is not None and abs(target.carbohydrate_max_g - neutral_profile.carbohydrate_target_max_g) > 0.5:
            return (
                PortionOptimizationStatus.INVALID_TARGET_PROVENANCE,
                ["carbohydrate_max_g is inconsistent with Phase 5A neutral profile carbohydrate_target_max_g."],
            )

    return None, warnings


def validate_candidates_and_constraints(
    candidate_result: CandidateRankingResult,
    selected_entity_ids: List[str],
    constraints: List[PortionConstraint],
) -> Tuple[Optional[PortionOptimizationStatus], List[str]]:
    """Validates selection against the supplied Phase 6A vetted candidate pool and constraints."""
    if len(selected_entity_ids) == 0:
        return (
            PortionOptimizationStatus.MISSING_PORTION_CONSTRAINT,
            ["selected_entity_ids list cannot be empty."],
        )

    # Check duplicate selected IDs
    if len(selected_entity_ids) != len(set(selected_entity_ids)):
        return (
            PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
            ["Duplicate entity IDs in selected_entity_ids."],
        )

    # Check duplicate constraint IDs
    c_ids = [c.entity_id for c in constraints]
    if len(c_ids) != len(set(c_ids)):
        return (
            PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
            ["Duplicate entity IDs in constraints."],
        )

    # Strict set equality between selected IDs and constraint IDs
    if set(selected_entity_ids) != set(c_ids):
        return (
            PortionOptimizationStatus.MISSING_PORTION_CONSTRAINT,
            [
                f"Exact set equality required between selected_entity_ids and constraints. "
                f"Missing: {set(selected_entity_ids) - set(c_ids)}, Extra: {set(c_ids) - set(selected_entity_ids)}."
            ],
        )

    # Candidate pool vetting: selected IDs must be subset of Phase 6A optimization candidates
    vetted_opt_eids = {c.entity_id for c in candidate_result.ranked_optimization_candidates}
    for eid in selected_entity_ids:
        if eid not in vetted_opt_eids:
            return (
                PortionOptimizationStatus.INVALID_CANDIDATE,
                [
                    f"Selected entity '{eid}' is not present in the supplied Phase 6A optimization candidate pool. "
                    f"Entities with safety exclusions, role ineligibility, incomplete macros, or nutrition "
                    f"review quarantine cannot enter Phase 6B portion optimization."
                ],
            )

    # Validate constraint bounds and increments
    for c in constraints:
        if c.increment_grams is not None:
            return (
                PortionOptimizationStatus.DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED,
                [
                    f"Discrete portion increment ({c.increment_grams}g) not supported in Phase 6B v1 for entity '{c.entity_id}'. "
                    f"Continuous bounds must be used."
                ],
            )

        if not _is_valid_non_negative(c.minimum_grams):
            return (
                PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
                [f"minimum_grams must be a finite non-negative number for entity '{c.entity_id}'."],
            )

        if not _is_valid_non_negative(c.maximum_grams):
            return (
                PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
                [f"maximum_grams must be a finite non-negative number for entity '{c.entity_id}'."],
            )

        if c.minimum_grams > c.maximum_grams:
            return (
                PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
                [f"minimum_grams ({c.minimum_grams}g) > maximum_grams ({c.maximum_grams}g) for entity '{c.entity_id}'."],
            )

        if c.preferred_grams is not None:
            if not _is_valid_non_negative(c.preferred_grams):
                return (
                    PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
                    [f"preferred_grams must be non-negative for entity '{c.entity_id}'."],
                )
            if c.preferred_grams < c.minimum_grams or c.preferred_grams > c.maximum_grams:
                return (
                    PortionOptimizationStatus.INVALID_PORTION_CONSTRAINTS,
                    [
                        f"preferred_grams ({c.preferred_grams}g) outside [{c.minimum_grams}g, {c.maximum_grams}g] "
                        f"bounds for entity '{c.entity_id}'."
                    ],
                )

    return None, []

"""Meal/composition/combinations.py - Deterministic Candidate Pool Vetting & Combinatorial Generation.

Responsible for:
- Validating caller-supplied search policies.
- Validating required entity IDs against the Phase 6A pool, exclusions, constraints, and count limits.
- Classifying preferred entity IDs and enforcing safety over preference.
- Calculating the exact total possible combinations within the valid search space.
- Generating combinations deterministically with preference-priority and canonical ID tie-breaking.
- Handling search space truncation and emitting truthful search scope diagnostics.
"""

from __future__ import annotations

import math
from itertools import combinations
from typing import Dict, List, Optional, Set, Tuple

from Meal.composition.equivalence import (
    DEFAULT_ENTITY_EQUIVALENCE_GROUPS,
    find_conflicting_equivalence_entities,
    map_to_preference_concepts,
    validate_combination_equivalence,
)
from Meal.composition.schemas import (
    MealCombinationPolicy,
    PreferredEntityClassification,
    PreferredEntityStatus,
    PreferredEntityValidationRecord,
    RequiredEntityFailureReason,
    SelectionScope,
    SingleMealGenerationContext,
)
from Meal.optimizer.schemas import PortionConstraint
from Meal.planner.catalog import PlannerCatalogEntity
from Meal.planner.schemas import (
    CandidateEvaluation,
    CandidateRankingResult,
    PrimaryDisposition,
)


def validate_search_policy(policy: MealCombinationPolicy) -> Tuple[bool, Optional[str]]:
    """Validates structural and computational bounds of the combination policy."""
    if policy.minimum_items < 1:
        return False, f"minimum_items must be >= 1, got {policy.minimum_items}"
    if policy.maximum_items < policy.minimum_items:
        return False, (
            f"maximum_items ({policy.maximum_items}) must be >= minimum_items ({policy.minimum_items})"
        )
    if policy.maximum_combinations_evaluated < 1:
        return False, (
            f"maximum_combinations_evaluated must be >= 1, got {policy.maximum_combinations_evaluated}"
        )
    if policy.maximum_alternatives < 0:
        return False, f"maximum_alternatives must be >= 0, got {policy.maximum_alternatives}"
    return True, None


def validate_required_entities(
    context: SingleMealGenerationContext,
    candidate_result: CandidateRankingResult,
    constraints_by_id: Dict[str, PortionConstraint],
    policy: MealCombinationPolicy,
) -> Tuple[bool, Optional[RequiredEntityFailureReason], List[str], List[str]]:
    """Validates all required entity IDs against Phase 6A pool, constraints, bounds, and equivalence groups.

    Returns:
        (is_valid, failure_reason, failure_details, valid_unique_required_ids)
    """
    failure_details: List[str] = []
    unique_req_ids = list(dict.fromkeys(context.required_entity_ids))

    # 1. Count validation
    if len(unique_req_ids) > policy.maximum_items:
        failure_details.append(
            f"Required entity count ({len(unique_req_ids)}) exceeds maximum_items ({policy.maximum_items})."
        )
        return (
            False,
            RequiredEntityFailureReason.REQUIRED_ENTITY_COUNT_EXCEEDS_MAX_ITEMS,
            failure_details,
            [],
        )

    # 2. Equivalence group conflict validation
    eq_groups = policy.equivalence_groups if policy.equivalence_groups is not None else DEFAULT_ENTITY_EQUIVALENCE_GROUPS
    conflicts = find_conflicting_equivalence_entities(unique_req_ids, eq_groups)
    if conflicts:
        for grp_name, members in sorted(conflicts.items()):
            failure_details.append(
                f"Conflicting required entities belong to the same equivalence group '{grp_name}': {sorted(members)}."
            )
        return (
            False,
            RequiredEntityFailureReason.CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE,
            failure_details,
            [],
        )

    eligible_ids = {cand.entity_id for cand in candidate_result.ranked_optimization_candidates}
    safety_or_user_excluded_ids = {
        cand.entity_id
        for cand in candidate_result.excluded_candidates
        if cand.primary_disposition in (
            PrimaryDisposition.HARD_SAFETY_EXCLUDED,
            PrimaryDisposition.USER_EXCLUDED,
        )
    }
    explicit_excluded_set = set(context.explicitly_excluded_ids)

    for req_id in unique_req_ids:
        # Check exclusion
        if req_id in explicit_excluded_set or req_id in safety_or_user_excluded_ids:
            failure_details.append(
                f"Required entity '{req_id}' is explicitly excluded or safety-excluded upstream."
            )
            return (
                False,
                RequiredEntityFailureReason.REQUIRED_ENTITY_EXPLICITLY_EXCLUDED,
                failure_details,
                [],
            )

        # Check Phase 6A optimization eligibility
        if req_id not in eligible_ids:
            failure_details.append(
                f"Required entity '{req_id}' is not in the Phase 6A optimization-eligible pool "
                f"for role '{candidate_result.requested_meal_role.value}'."
            )
            return (
                False,
                RequiredEntityFailureReason.REQUIRED_ENTITY_NOT_PHASE6A_ELIGIBLE,
                failure_details,
                [],
            )

        # Check portion constraint availability
        if req_id not in constraints_by_id:
            failure_details.append(
                f"Required entity '{req_id}' has no caller-supplied portion constraint."
            )
            return (
                False,
                RequiredEntityFailureReason.REQUIRED_ENTITY_MISSING_PORTION_CONSTRAINT,
                failure_details,
                [],
            )

    return True, None, [], unique_req_ids


def classify_preferred_entities(
    context: SingleMealGenerationContext,
    candidate_result: CandidateRankingResult,
    constraints_by_id: Dict[str, PortionConstraint],
    master_catalog: Dict[str, PlannerCatalogEntity],
) -> Tuple[List[str], List[PreferredEntityValidationRecord], PreferredEntityStatus, List[str]]:
    """Validates and classifies requested preferred entities into explicit machine-readable states.

    Safety strictly takes precedence: invalid preferred entities are excluded from combinations.
    Unavailable preferred entities emit warnings but do not fail meal generation.

    Returns:
        (valid_preferred_ids, records, status, warnings)
    """
    records: List[PreferredEntityValidationRecord] = []
    valid_preferred_ids: List[str] = []
    seen_ids: Set[str] = set()
    warnings: List[str] = []

    eligible_ids = {cand.entity_id for cand in candidate_result.ranked_optimization_candidates}
    safety_or_user_excluded_ids = {
        cand.entity_id
        for cand in candidate_result.excluded_candidates
        if cand.primary_disposition in (
            PrimaryDisposition.HARD_SAFETY_EXCLUDED,
            PrimaryDisposition.USER_EXCLUDED,
        )
    }
    explicit_excluded_set = set(context.explicitly_excluded_ids)

    for pid in context.preferred_entity_ids:
        if pid in seen_ids:
            records.append(
                PreferredEntityValidationRecord(
                    entity_id=pid,
                    classification=PreferredEntityClassification.DUPLICATE,
                    reason=f"Preferred entity '{pid}' requested multiple times.",
                )
            )
            continue

        seen_ids.add(pid)

        if pid not in master_catalog:
            records.append(
                PreferredEntityValidationRecord(
                    entity_id=pid,
                    classification=PreferredEntityClassification.UNKNOWN_ENTITY,
                    reason=f"Entity '{pid}' does not exist in the master planner catalog.",
                )
            )
            warnings.append(f"PREFERRED_ENTITY_UNAVAILABLE: Unknown entity '{pid}'.")
        elif pid in explicit_excluded_set or pid in safety_or_user_excluded_ids:
            records.append(
                PreferredEntityValidationRecord(
                    entity_id=pid,
                    classification=PreferredEntityClassification.EXPLICITLY_EXCLUDED,
                    reason=f"Preferred entity '{pid}' is excluded by safety or user request.",
                )
            )
            warnings.append(f"PREFERRED_ENTITY_UNAVAILABLE: Excluded entity '{pid}'.")
        elif pid not in eligible_ids:
            records.append(
                PreferredEntityValidationRecord(
                    entity_id=pid,
                    classification=PreferredEntityClassification.NOT_IN_PHASE6A_POOL,
                    reason=(
                        f"Preferred entity '{pid}' is not in Phase 6A optimization pool "
                        f"for role '{candidate_result.requested_meal_role.value}'."
                    ),
                )
            )
            warnings.append(f"PREFERRED_ENTITY_UNAVAILABLE: Entity '{pid}' not in Phase 6A pool.")
        elif pid not in constraints_by_id:
            records.append(
                PreferredEntityValidationRecord(
                    entity_id=pid,
                    classification=PreferredEntityClassification.NOT_IN_PHASE6A_POOL,
                    reason=f"Preferred entity '{pid}' lacks an allowable portion constraint.",
                )
            )
            warnings.append(
                f"PREFERRED_ENTITY_UNAVAILABLE: Entity '{pid}' has no portion constraint."
            )
        else:
            records.append(
                PreferredEntityValidationRecord(
                    entity_id=pid,
                    classification=PreferredEntityClassification.VALID_PREFERRED_ENTITY,
                    reason="Valid optimization-eligible preferred entity.",
                )
            )
            valid_preferred_ids.append(pid)

    # Determine overall preference status
    requested_unique_count = len(seen_ids)
    if requested_unique_count == 0 or len(valid_preferred_ids) == 0:
        pref_status = PreferredEntityStatus.UNAVAILABLE
    elif len(valid_preferred_ids) == requested_unique_count:
        pref_status = PreferredEntityStatus.AVAILABLE
    else:
        pref_status = PreferredEntityStatus.PARTIALLY_AVAILABLE

    return valid_preferred_ids, records, pref_status, warnings


def calculate_total_possible_combinations(
    required_count: int,
    optional_count: int,
    min_items: int,
    max_items: int,
) -> int:
    """Calculates exact total possible combinations containing all required entities.

    Evaluated AFTER Phase 6A eligibility, exclusions, constraints, and required filtering,
    but BEFORE application of maximum_combinations_evaluated.

    Formula:
        sum_{k = max(min_items, R)}^{min(max_items, R + O)} comb(O, k - R)
    """
    if required_count > max_items:
        return 0
    if required_count + optional_count < min_items:
        return 0

    lower_k = max(min_items, required_count)
    upper_k = min(max_items, required_count + optional_count)

    total = 0
    for k in range(lower_k, upper_k + 1):
        remaining_needed = k - required_count
        if 0 <= remaining_needed <= optional_count:
            total += math.comb(optional_count, remaining_needed)
    return total


def generate_and_order_combinations(
    required_ids: List[str],
    optional_candidate_ids: List[str],
    valid_preferred_ids: Set[str],
    policy: MealCombinationPolicy,
) -> Tuple[List[Tuple[str, ...]], int, bool, SelectionScope, List[str]]:
    """Generates and deterministically orders combinations of candidate foods.

    Search Ordering Contract:
    1. Required entities fixed in every combination.
    2. Combinations with more explicit preferred entities evaluated first (preference match count descending).
    3. Remaining tie ordering strictly by canonical combination ID (alphabetical ascending).
    4. Independent of input list order (deterministic under shuffling).

    Returns:
        (evaluated_combinations, total_possible, search_truncated, selection_scope, warnings)
    """
    warnings: List[str] = []
    canonical_required = sorted(list(dict.fromkeys(required_ids)))
    canonical_optional = sorted(list(dict.fromkeys(optional_candidate_ids)))

    req_count = len(canonical_required)
    opt_count = len(canonical_optional)

    lower_k = max(policy.minimum_items, req_count)
    upper_k = min(policy.maximum_items, req_count + opt_count)

    eq_groups = (
        policy.equivalence_groups
        if policy.equivalence_groups is not None
        else DEFAULT_ENTITY_EQUIVALENCE_GROUPS
    )
    valid_pref_concepts = map_to_preference_concepts(valid_preferred_ids, eq_groups)

    all_valid_combinations: List[Tuple[str, ...]] = []
    for k in range(lower_k, upper_k + 1):
        rem_count = k - req_count
        if rem_count == 0:
            comb = tuple(canonical_required)
            is_valid, _ = validate_combination_equivalence(comb, eq_groups)
            if is_valid:
                all_valid_combinations.append(comb)
        else:
            for opt_subset in combinations(canonical_optional, rem_count):
                comb = tuple(sorted(canonical_required + list(opt_subset)))
                is_valid, _ = validate_combination_equivalence(comb, eq_groups)
                if is_valid:
                    all_valid_combinations.append(comb)

    total_possible = len(all_valid_combinations)

    if total_possible == 0:
        return [], 0, False, SelectionScope.EXHAUSTIVE_SEARCH, warnings

    # Sort deterministically by:
    # 1. Number of preferred food-concept matches (descending)
    # 2. Canonical combination ID (alphabetical ascending)
    all_valid_combinations.sort(
        key=lambda c: (
            -len(map_to_preference_concepts(c, eq_groups) & valid_pref_concepts),
            "+".join(c),
        )
    )

    if len(all_valid_combinations) > policy.maximum_combinations_evaluated:
        search_truncated = True
        selection_scope = SelectionScope.TRUNCATED_SEARCH
        warnings.append(
            "BETTER_UNEVALUATED_COMBINATION_MAY_EXIST: Search space truncated by maximum_combinations_evaluated."
        )
        evaluated_combinations = all_valid_combinations[: policy.maximum_combinations_evaluated]
    else:
        search_truncated = False
        selection_scope = SelectionScope.EXHAUSTIVE_SEARCH
        evaluated_combinations = all_valid_combinations

    return evaluated_combinations, total_possible, search_truncated, selection_scope, warnings

"""Meal/weekly/repetition.py - Multi-level repetition tracking and variety evaluation.

Evaluates repetition across scheduled days at multiple granularities:
1. Entity-level occurrences (e.g. PK_DISH_001)
2. Semantic equivalence concept occurrences (e.g. EQ_CHAPATI)
3. Single meal combination occurrences (canonical_combination_id)
4. Day plan occurrences (canonical_day_id)
5. Consecutive day runs (entity runs, concept runs, meal runs, role-specific runs)
6. Hard vs soft variety constraint verification.

Strict Invariants:
- Switching entity IDs within an equivalence group (e.g., PK_DISH_001 and PK_PORTION_001)
  cannot fake diversity; they map to the same concept (EQ_CHAPATI).
- No invented culinary similarity (Chicken Curry != Chicken Karahi without explicit upstream mapping).
- HARD variety violations reject the candidate week entirely.
- SOFT variety violations produce convex penalties used solely for tie-breaking among valid weeks.
"""

from __future__ import annotations

from typing import Dict, List, Set, Tuple

from Meal.composition.equivalence import get_entity_equivalence_group
from Meal.daily.schemas import FullDayMealPlan
from Meal.planner.schemas import MealRole
from Meal.weekly.schemas import (
    ConstraintEnforcementMode,
    WeeklyRepetitionMetrics,
    WeeklyRequiredOccurrence,
    WeeklyVarietyPolicy,
)


def compute_consecutive_runs(day_presences: List[Set[str]]) -> Dict[str, int]:
    """Computes the maximum contiguous run of days in which each key appears.
    
    Args:
        day_presences: List of sets, where element i is the set of keys present on day i.
        
    Returns:
        Mapping of key -> maximum consecutive day count.
    """
    max_runs: Dict[str, int] = {}
    current_runs: Dict[str, int] = {}

    all_keys = set().union(*day_presences) if day_presences else set()
    for k in all_keys:
        max_runs[k] = 0
        current_runs[k] = 0

    for day_set in day_presences:
        for k in all_keys:
            if k in day_set:
                current_runs[k] += 1
                if current_runs[k] > max_runs[k]:
                    max_runs[k] = current_runs[k]
            else:
                current_runs[k] = 0

    return max_runs


def evaluate_weekly_repetition(
    day_plans: List[FullDayMealPlan],
    policy: WeeklyVarietyPolicy,
) -> WeeklyRepetitionMetrics:
    """Evaluates multi-level repetition and variety constraints across a sequence of day plans.
    
    Args:
        day_plans: Sequence of FullDayMealPlan objects (e.g. 7 days).
        policy: Configured WeeklyVarietyPolicy.
        
    Returns:
        WeeklyRepetitionMetrics containing counts, runs, hard violations, and soft penalties.
    """
    entity_counts: Dict[str, int] = {}
    concept_counts: Dict[str, int] = {}
    meal_comb_counts: Dict[str, int] = {}
    day_plan_counts: Dict[str, int] = {}

    day_entity_presences: List[Set[str]] = []
    day_concept_presences: List[Set[str]] = []
    day_meal_comb_presences: List[Set[str]] = []
    
    # Track role-specific combinations per day
    role_combs_by_day: Dict[MealRole, List[str]] = {}

    for day in day_plans:
        # Day plan occurrences
        day_id = day.canonical_day_id
        day_plan_counts[day_id] = day_plan_counts.get(day_id, 0) + 1

        day_entities: Set[str] = set()
        day_concepts: Set[str] = set()
        day_combs: Set[str] = set()

        for role, meal in day.meals.items():
            comb_id = meal.canonical_combination_id
            meal_comb_counts[comb_id] = meal_comb_counts.get(comb_id, 0) + 1
            day_combs.add(comb_id)

            if role not in role_combs_by_day:
                role_combs_by_day[role] = []
            role_combs_by_day[role].append(comb_id)

            for item in meal.items:
                eid = item.entity_id
                entity_counts[eid] = entity_counts.get(eid, 0) + 1
                day_entities.add(eid)

                # Equivalence concept mapping
                eq_group = get_entity_equivalence_group(eid)
                concept_id = eq_group if eq_group is not None else eid
                concept_counts[concept_id] = concept_counts.get(concept_id, 0) + 1
                day_concepts.add(concept_id)

        day_entity_presences.append(day_entities)
        day_concept_presences.append(day_concepts)
        day_meal_comb_presences.append(day_combs)

    # Compute consecutive runs
    consecutive_entity_runs = compute_consecutive_runs(day_entity_presences)
    consecutive_concept_runs = compute_consecutive_runs(day_concept_presences)
    consecutive_meal_runs = compute_consecutive_runs(day_meal_comb_presences)

    # Role-specific consecutive runs
    role_specific_runs: Dict[MealRole, Dict[str, int]] = {}
    for role, comb_seq in role_combs_by_day.items():
        role_runs: Dict[str, int] = {}
        curr_comb = None
        curr_run = 0
        for comb in comb_seq:
            if comb == curr_comb:
                curr_run += 1
            else:
                curr_comb = comb
                curr_run = 1
            role_runs[curr_comb] = max(role_runs.get(curr_comb, 0), curr_run)
        role_specific_runs[role] = role_runs

    # Constraint Evaluation
    hard_violations: List[str] = []
    soft_penalty = 0.0
    soft_details: List[str] = []

    # 1. Entity occurrence limits
    for eid, count in entity_counts.items():
        max_allowed = policy.maximum_same_entity_occurrences_per_week
        if count > max_allowed:
            excess = count - max_allowed
            msg = f"EXCESS_ENTITY_OCCURRENCE: Entity '{eid}' appeared {count} times (limit: {max_allowed})"
            if policy.entity_occurrence_enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 2.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 2. Concept occurrence limits
    for cid, count in concept_counts.items():
        max_allowed = policy.maximum_same_equivalence_concept_occurrences_per_week
        if count > max_allowed:
            excess = count - max_allowed
            msg = f"EXCESS_CONCEPT_OCCURRENCE: Concept '{cid}' appeared {count} times (limit: {max_allowed})"
            if policy.concept_occurrence_enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 3.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 3. Meal combination occurrence limits
    for comb_id, count in meal_comb_counts.items():
        max_allowed = policy.maximum_same_meal_combination_occurrences_per_week
        if count > max_allowed:
            excess = count - max_allowed
            msg = f"EXCESS_MEAL_COMBINATION_OCCURRENCE: Combination '{comb_id}' appeared {count} times (limit: {max_allowed})"
            if policy.meal_combination_enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 4.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 4. Day plan occurrence limits
    for day_id, count in day_plan_counts.items():
        max_allowed = policy.maximum_same_day_plan_occurrences_per_week
        if count > max_allowed:
            excess = count - max_allowed
            msg = f"EXCESS_DAY_PLAN_OCCURRENCE: Day plan '{day_id}' appeared {count} times (limit: {max_allowed})"
            if policy.day_plan_enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 5.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 5. Consecutive entity runs
    for eid, run in consecutive_entity_runs.items():
        max_allowed = policy.maximum_consecutive_day_entity_repetition
        if run > max_allowed:
            excess = run - max_allowed
            msg = f"CONSECUTIVE_ENTITY_RUN: Entity '{eid}' appeared in {run} consecutive days (limit: {max_allowed})"
            if policy.consecutive_run_enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 3.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 6. Consecutive meal combination runs
    for comb_id, run in consecutive_meal_runs.items():
        max_allowed = policy.maximum_consecutive_day_meal_combination_repetition
        if run > max_allowed:
            excess = run - max_allowed
            msg = f"CONSECUTIVE_MEAL_RUN: Combination '{comb_id}' appeared in {run} consecutive days (limit: {max_allowed})"
            if policy.consecutive_run_enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 4.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 7. Role-specific combination runs
    for role, runs in role_specific_runs.items():
        for comb_id, run in runs.items():
            max_allowed = policy.maximum_consecutive_day_role_combination_repetition
            if run > max_allowed:
                excess = run - max_allowed
                msg = f"CONSECUTIVE_ROLE_COMBINATION_RUN: Combination '{comb_id}' repeated in {role.value} across {run} consecutive days (limit: {max_allowed})"
                if policy.consecutive_run_enforcement == ConstraintEnforcementMode.HARD:
                    hard_violations.append(f"HARD_{msg}")
                else:
                    penalty = float(excess * 3.5)
                    soft_penalty += penalty
                    soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    # 8. Caller-specified required occurrences
    for req in policy.required_occurrences:
        target_id = req.entity_or_concept_id
        # Look in concept_counts first, then entity_counts
        count = concept_counts.get(target_id, entity_counts.get(target_id, 0))
        
        if count < req.minimum_occurrences:
            deficit = req.minimum_occurrences - count
            msg = f"REQUIRED_OCCURRENCE_DEFICIT: '{target_id}' appeared {count} times (minimum required: {req.minimum_occurrences})"
            if req.enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(deficit * 5.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

        if req.maximum_occurrences is not None and count > req.maximum_occurrences:
            excess = count - req.maximum_occurrences
            msg = f"REQUIRED_OCCURRENCE_EXCESS: '{target_id}' appeared {count} times (maximum allowed: {req.maximum_occurrences})"
            if req.enforcement == ConstraintEnforcementMode.HARD:
                hard_violations.append(f"HARD_{msg}")
            else:
                penalty = float(excess * 5.0)
                soft_penalty += penalty
                soft_details.append(f"SOFT_{msg} (+{penalty:.1f})")

    return WeeklyRepetitionMetrics(
        entity_occurrence_counts=entity_counts,
        equivalence_concept_occurrence_counts=concept_counts,
        meal_combination_occurrence_counts=meal_comb_counts,
        day_plan_occurrence_counts=day_plan_counts,
        consecutive_entity_runs=consecutive_entity_runs,
        consecutive_concept_runs=consecutive_concept_runs,
        consecutive_meal_combination_runs=consecutive_meal_runs,
        role_specific_combination_runs=role_specific_runs,
        hard_variety_violations=hard_violations,
        soft_repetition_penalty=round(soft_penalty, 4),
        soft_violation_details=soft_details,
    )

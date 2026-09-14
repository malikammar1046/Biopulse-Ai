"""Meal/daily/aggregation.py - Aggregates nutrients and evaluates daily feasibility for Phase 6D.

Provides:
- Exact unrounded floating-point summation of daily macro nutrients.
- Preservation of Phase 5 / Phase 6B fiber semantics (COMPLETE, PARTIAL, UNAVAILABLE).
- Aggregation of recipe coverage across scheduled meals.
- Cross-meal repetition and equivalence concept occurrence tracking for Phase 6E.
- Daily target deviation evaluation against Phase 5A targets.
- Assembly of complete FullDayMealPlan objects.

Strict Architectural Invariants:
1. No Intermediate Rounding:
   - All nutrient summations maintain IEEE 754 double-precision float accuracy.
   - Rounding is for presentation only.
2. Strict Fiber Integrity:
   - Missing fiber is NEVER converted to 0.0.
   - If any food has unknown fiber, daily status cannot be COMPLETE.
3. Meal Feasibility vs Day Feasibility:
   - Day-level evaluation is independent of meal-level J*=0.
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Tuple

from Meal.composition.equivalence import (
    DEFAULT_ENTITY_EQUIVALENCE_GROUPS,
    get_entity_equivalence_group,
)
from Meal.composition.schemas import RecipeCoverageStatus, SingleMealPlan
from Meal.daily.schemas import (
    DailyFeasibilityClass,
    DailyFiberResult,
    FullDayMealPlan,
)
from Meal.engine.schemas import NutritionTargetProfile
from Meal.optimizer.nutrients import compute_deviation
from Meal.optimizer.schemas import (
    FiberCoverageStatus,
    NutrientDeviation,
    NutrientTargetStatus,
)
from Meal.planner.schemas import MealRole


def aggregate_daily_nutrients(
    meals: Dict[MealRole, SingleMealPlan],
    daily_ai_reference_g: Optional[float] = None,
) -> Tuple[float, float, float, float, DailyFiberResult, RecipeCoverageStatus, Dict[str, int], Dict[str, int], Dict[str, int], int, int, float]:
    """Aggregates nutritional totals, fiber coverage, recipe coverage, and occurrences across meals.
    
    Returns:
        (
            daily_energy_kcal,
            daily_protein_g,
            daily_carbohydrate_g,
            daily_fat_g,
            fiber_result,
            recipe_status,
            entity_occurrences,
            equivalence_occurrences,
            dish_repetitions,
            matched_prefs,
            total_prefs,
            pref_coverage,
        )
    """
    plans = list(meals.values())

    # 1. Exact unrounded summation
    daily_energy = sum(m.total_energy_kcal for m in plans)
    daily_protein = sum(m.total_protein_g for m in plans)
    daily_carb = sum(m.total_carbohydrate_g for m in plans)
    daily_fat = sum(m.total_fat_g for m in plans)

    # 2. Fiber aggregation across all meal items
    all_items = [item for m in plans for item in m.items]
    total_entities = len(all_items)
    missing_fiber_ids: List[str] = []
    known_fiber_sum = 0.0
    known_fiber_count = 0

    for item in all_items:
        if item.fiber_g is not None:
            known_fiber_sum += item.fiber_g
            known_fiber_count += 1
        else:
            if item.entity_id not in missing_fiber_ids:
                missing_fiber_ids.append(item.entity_id)

    if not missing_fiber_ids and total_entities > 0:
        coverage_status = FiberCoverageStatus.COMPLETE
        known_fiber_total = known_fiber_sum
    elif known_fiber_count > 0:
        coverage_status = FiberCoverageStatus.PARTIAL
        known_fiber_total = known_fiber_sum
    else:
        coverage_status = FiberCoverageStatus.UNAVAILABLE
        known_fiber_total = None

    fiber_result = DailyFiberResult(
        known_fiber_total_g=known_fiber_total,
        fiber_coverage_status=coverage_status,
        missing_fiber_entity_ids=missing_fiber_ids,
        total_entities_evaluated=total_entities,
        entities_with_known_fiber=known_fiber_count,
        daily_ai_reference_g=daily_ai_reference_g,
    )

    # 3. Recipe coverage aggregation
    recipe_statuses = [m.recipe_instruction_coverage_status for m in plans]
    if all(s == RecipeCoverageStatus.FULL for s in recipe_statuses):
        day_recipe_status = RecipeCoverageStatus.FULL
    elif all(s == RecipeCoverageStatus.NONE for s in recipe_statuses):
        day_recipe_status = RecipeCoverageStatus.NONE
    else:
        day_recipe_status = RecipeCoverageStatus.PARTIAL

    # 4. Occurrence and repetition tracking
    entity_occurrences: Dict[str, int] = {}
    equivalence_occurrences: Dict[str, int] = {}
    dish_repetitions: Dict[str, int] = {}

    for item in all_items:
        eid = item.entity_id
        entity_occurrences[eid] = entity_occurrences.get(eid, 0) + 1

        # Equivalence concept tracking
        eq_group = get_entity_equivalence_group(eid)
        concept_key = eq_group if eq_group is not None else eid
        equivalence_occurrences[concept_key] = equivalence_occurrences.get(concept_key, 0) + 1

        # Track dish repetition
        if eid.startswith("PK_DISH_"):
            dish_repetitions[eid] = dish_repetitions.get(eid, 0) + 1

    # Filter dish_repetitions to items appearing more than once
    multi_dishes = {k: v for k, v in dish_repetitions.items() if v > 1}

    # 5. User preference aggregation
    matched_prefs = sum(m.matched_preferred_entity_count for m in plans)
    total_prefs = sum(m.total_valid_preferred_entity_count for m in plans)
    pref_coverage = (matched_prefs / max(total_prefs, 1)) if total_prefs > 0 else 0.0

    return (
        daily_energy,
        daily_protein,
        daily_carb,
        daily_fat,
        fiber_result,
        day_recipe_status,
        entity_occurrences,
        equivalence_occurrences,
        multi_dishes,
        matched_prefs,
        total_prefs,
        pref_coverage,
    )


def evaluate_daily_nutrient_deviations(
    daily_energy_kcal: float,
    daily_protein_g: float,
    daily_carbohydrate_g: float,
    daily_fat_g: float,
    daily_target: NutritionTargetProfile,
    energy_tolerance_kcal: float = 100.0,
) -> Tuple[Dict[str, NutrientDeviation], float, bool, DailyFeasibilityClass]:
    """Evaluates aggregate daily nutrients against the Phase 5A neutral daily target profile.
    
    Returns:
        (deviations_dict, J_day, all_targets_within_range, feasibility_class)
    """
    # 1. Energy
    energy_min = max(0.0, daily_target.energy_target_kcal - energy_tolerance_kcal)
    energy_max = daily_target.energy_target_kcal + energy_tolerance_kcal
    energy_scale = max(daily_target.energy_target_kcal, 1.0)
    dev_energy = compute_deviation(
        nutrient_name="energy",
        achieved=daily_energy_kcal,
        target_min=energy_min,
        target_max=energy_max,
        normalization_scale=energy_scale,
    )

    # 2. Protein
    prot_min = (
        daily_target.protein_target_min_g
        if daily_target.protein_target_min_g is not None
        else daily_target.protein_amdr_min_g
    )
    prot_max = (
        daily_target.protein_target_max_g
        if daily_target.protein_target_max_g is not None
        else daily_target.protein_amdr_max_g
    )
    prot_scale = max((prot_min + prot_max) / 2.0, 1.0)
    dev_prot = compute_deviation(
        nutrient_name="protein",
        achieved=daily_protein_g,
        target_min=prot_min,
        target_max=prot_max,
        normalization_scale=prot_scale,
    )

    # 3. Carbohydrate
    carb_min = (
        daily_target.carbohydrate_target_min_g
        if daily_target.carbohydrate_target_min_g is not None
        else daily_target.carbohydrate_amdr_min_g
    )
    carb_max = (
        daily_target.carbohydrate_target_max_g
        if daily_target.carbohydrate_target_max_g is not None
        else daily_target.carbohydrate_amdr_max_g
    )
    carb_scale = max((carb_min + carb_max) / 2.0, 1.0)
    dev_carb = compute_deviation(
        nutrient_name="carb",
        achieved=daily_carbohydrate_g,
        target_min=carb_min,
        target_max=carb_max,
        normalization_scale=carb_scale,
    )

    # 4. Fat
    fat_min = daily_target.fat_amdr_min_g
    fat_max = daily_target.fat_amdr_max_g
    fat_scale = max((fat_min + fat_max) / 2.0, 1.0)
    dev_fat = compute_deviation(
        nutrient_name="fat",
        achieved=daily_fat_g,
        target_min=fat_min,
        target_max=fat_max,
        normalization_scale=fat_scale,
    )

    deviations = {
        "energy": dev_energy,
        "protein": dev_prot,
        "carb": dev_carb,
        "fat": dev_fat,
    }

    # Primary daily objective J_day
    j_day = sum(dev.normalized_deviation for dev in deviations.values())

    all_within_range = all(dev.status == NutrientTargetStatus.WITHIN_RANGE for dev in deviations.values())
    feasibility = (
        DailyFeasibilityClass.FEASIBLE
        if all_within_range
        else DailyFeasibilityClass.OPTIMAL_WITH_DAILY_DEVIATIONS
    )

    return deviations, j_day, all_within_range, feasibility


def assemble_full_day_meal_plan(
    meals: Dict[MealRole, SingleMealPlan],
    daily_target: NutritionTargetProfile,
    plan_day_index: int = 1,
    date: Optional[str] = None,
    energy_tolerance_kcal: float = 100.0,
    warnings: Optional[List[str]] = None,
    trace: Optional[List[str]] = None,
) -> FullDayMealPlan:
    """Assembles and evaluates a complete FullDayMealPlan from constituent SingleMealPlans."""
    (
        daily_energy,
        daily_protein,
        daily_carb,
        daily_fat,
        fiber_res,
        recipe_status,
        entity_occ,
        eq_occ,
        dish_rep,
        matched_prefs,
        total_prefs,
        pref_cov,
    ) = aggregate_daily_nutrients(meals, daily_ai_reference_g=daily_target.fiber_ai_g)

    deviations, j_day, all_within_range, feasibility = evaluate_daily_nutrient_deviations(
        daily_energy_kcal=daily_energy,
        daily_protein_g=daily_protein,
        daily_carbohydrate_g=daily_carb,
        daily_fat_g=daily_fat,
        daily_target=daily_target,
        energy_tolerance_kcal=energy_tolerance_kcal,
    )

    # Canonical Day ID
    # Sort roles deterministically by their standard enum definition order or value
    sorted_items = sorted(meals.items(), key=lambda pair: pair[0].value)
    comb_parts = [f"{role.value}:{plan.canonical_combination_id}" for role, plan in sorted_items]
    canonical_id = f"DAY__{'__'.join(comb_parts)}"

    warns = list(warnings or [])
    trc = list(trace or [])

    return FullDayMealPlan(
        canonical_day_id=canonical_id,
        plan_day_index=plan_day_index,
        date=date,
        meals=meals,
        daily_energy_kcal=daily_energy,
        daily_protein_g=daily_protein,
        daily_carbohydrate_g=daily_carb,
        daily_fat_g=daily_fat,
        fiber_result=fiber_res,
        feasibility_class=feasibility,
        daily_primary_objective=j_day,
        daily_target_deviations=deviations,
        all_daily_core_targets_within_range=all_within_range,
        recipe_instruction_coverage_status=recipe_status,
        matched_preferred_entity_count=matched_prefs,
        total_valid_preferred_entity_count=total_prefs,
        preference_coverage=pref_cov,
        entity_occurrence_counts=entity_occ,
        equivalence_concept_occurrence_counts=eq_occ,
        dish_repetition_counts=dish_rep,
        warnings=warns,
        trace=trc,
    )

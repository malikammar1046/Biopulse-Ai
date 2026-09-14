"""Meal/composition/ranking.py - Single-Meal Assembly, Recipe Evaluation & Lexicographic Ranking.

Strict Invariant Enforcements:
1. Secondary Objective Non-Interference:
   Phase 6B secondary objective represents within-combination portion deviation
   or total grams tie-breaking. It MUST NEVER be used for cross-combination meal ranking.
2. Revised Ranking Contract:
   ranking_key = (feasibility_rank, primary_objective, -preference_coverage, canonical_combination_id)
3. Direct components and standard portions are recognized as not requiring
   fabricated recipes (NO_RECIPE_REQUIRED_DIRECT_COMPONENT).
"""

from __future__ import annotations

from typing import Dict, List, Optional, Set, Tuple

from Meal.composition.equivalence import (
    DEFAULT_ENTITY_EQUIVALENCE_GROUPS,
    map_to_preference_concepts,
)
from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealFeasibilityClass,
    MealItem,
    RecipeCoverageStatus,
    SingleMealPlan,
)
from Meal.optimizer.schemas import (
    NutrientDeviation,
    PortionOptimizationResult,
    PortionOptimizationStatus,
)
from Meal.planner.catalog import PlannerCatalogEntity
from Meal.planner.schemas import CandidateEvaluation


def classify_item_recipe_status(
    catalog_entity: Optional[PlannerCatalogEntity],
    cand_eval: Optional[CandidateEvaluation],
) -> ItemRecipeStatus:
    """Classifies preparation instruction availability for an individual meal component.

    Distinguishes source-backed composite recipes from direct meal components /
    standard portions (which do not require a cooking recipe) and composite dishes
    lacking source formulation. Never fabricates instructions.
    """
    # 1. Source recipe eligible
    if cand_eval is not None and cand_eval.recipe_instruction_available:
        return ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE
    if catalog_entity is not None and catalog_entity.recipe_instruction_eligible:
        return ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE

    # 2. Direct components or standard portions
    if catalog_entity is not None:
        entity_type_upper = str(catalog_entity.entity_type).upper()
        if entity_type_upper in ("DIRECT_COMPONENT", "STANDARD_PORTION"):
            return ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT

    # 3. Composite dish with missing source recipe
    return ItemRecipeStatus.NO_SOURCE_RECIPE_AVAILABLE


def compute_meal_recipe_coverage(items: List[MealItem]) -> RecipeCoverageStatus:
    """Determines meal-level recipe preparation coverage without penalizing direct components."""
    if not items:
        return RecipeCoverageStatus.NONE

    statuses = [item.recipe_availability for item in items]

    all_covered = all(
        s in (
            ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE,
            ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        )
        for s in statuses
    )
    if all_covered:
        return RecipeCoverageStatus.FULL

    any_source_recipe = any(s == ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE for s in statuses)
    if any_source_recipe:
        return RecipeCoverageStatus.PARTIAL

    return RecipeCoverageStatus.NONE


def assemble_single_meal_plan(
    optimization_result: PortionOptimizationResult,
    candidate_evaluations_by_id: Dict[str, CandidateEvaluation],
    master_catalog: Dict[str, PlannerCatalogEntity],
    valid_preferred_ids: Set[str],
    condition_annotations: Optional[List[str]] = None,
    equivalence_groups: Optional[Dict[str, Set[str]]] = None,
) -> SingleMealPlan:
    """Assembles an optimized Phase 6B result into a structured SingleMealPlan."""
    # Build canonical combination ID (alphabetical sorted entity IDs joined by +)
    canonical_id = "+".join(sorted(optimization_result.selected_entity_ids))

    # Assemble MealItems
    meal_items: List[MealItem] = []
    item_recipe_map: Dict[str, ItemRecipeStatus] = {}

    for portion in optimization_result.optimized_portions:
        eid = portion.entity_id
        cat_ent = master_catalog.get(eid)
        cand_eval = candidate_evaluations_by_id.get(eid)

        rec_status = classify_item_recipe_status(cat_ent, cand_eval)
        item_recipe_map[eid] = rec_status

        item = MealItem(
            entity_id=eid,
            display_name=portion.display_name,
            optimized_grams=portion.optimized_grams,
            standard_portion_grams=portion.standard_portion_grams,
            equivalent_standard_portions_display=portion.equivalent_standard_portions_display,
            standard_portion_label=portion.standard_portion_label,
            energy_kcal=portion.energy_kcal,
            protein_g=portion.protein_g,
            fat_g=portion.fat_g,
            carbohydrate_g=portion.carbohydrate_g,
            fiber_g=portion.fiber_g,
            fiber_status=portion.fiber_status,
            recipe_availability=rec_status,
            recipe_instruction_available=(rec_status == ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE),
        )
        meal_items.append(item)

    recipe_coverage = compute_meal_recipe_coverage(meal_items)

    # Feasibility classification
    if optimization_result.status == PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES:
        feas_class = MealFeasibilityClass.FEASIBLE
    elif optimization_result.status == PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS:
        feas_class = MealFeasibilityClass.OPTIMAL_WITH_TARGET_DEVIATIONS
    else:
        feas_class = MealFeasibilityClass.INFEASIBLE_UPSTREAM

    # Target deviations map
    deviations: Dict[str, NutrientDeviation] = {}
    if optimization_result.energy_target_deviation:
        deviations["energy"] = optimization_result.energy_target_deviation
    if optimization_result.protein_target_deviation:
        deviations["protein"] = optimization_result.protein_target_deviation
    if optimization_result.carbohydrate_target_deviation:
        deviations["carbohydrate"] = optimization_result.carbohydrate_target_deviation
    if optimization_result.fat_target_deviation:
        deviations["fat"] = optimization_result.fat_target_deviation

    # Preference coverage calculation via preference concepts
    eq_groups = (
        equivalence_groups
        if equivalence_groups is not None
        else DEFAULT_ENTITY_EQUIVALENCE_GROUPS
    )
    valid_pref_concepts = map_to_preference_concepts(valid_preferred_ids, eq_groups)
    selected_pref_concepts = map_to_preference_concepts(optimization_result.selected_entity_ids, eq_groups)

    matched_concepts = selected_pref_concepts & valid_pref_concepts
    matched_pref_count = len(matched_concepts)
    total_valid_pref_count = len(valid_pref_concepts)
    pref_coverage = (
        (matched_pref_count / total_valid_pref_count)
        if total_valid_pref_count > 0
        else 0.0
    )

    # Phase 6B objectives
    primary_obj = (
        optimization_result.objective_value
        if optimization_result.objective_value is not None
        else 0.0
    )
    secondary_obj = (
        optimization_result.secondary_objective_value
        if optimization_result.secondary_objective_value is not None
        else 0.0
    )
    sec_mode_str = (
        optimization_result.secondary_objective_mode.value
        if optimization_result.secondary_objective_mode
        else None
    )

    fiber_total = (
        optimization_result.fiber_result.known_fiber_total_g
        if optimization_result.fiber_result
        else None
    )
    fiber_status = (
        optimization_result.fiber_result.coverage_status.value
        if optimization_result.fiber_result
        else "UNKNOWN"
    )

    return SingleMealPlan(
        canonical_combination_id=canonical_id,
        items=meal_items,
        total_energy_kcal=optimization_result.achieved_energy_kcal or 0.0,
        total_protein_g=optimization_result.achieved_protein_g or 0.0,
        total_fat_g=optimization_result.achieved_fat_g or 0.0,
        total_carbohydrate_g=optimization_result.achieved_carbohydrate_g or 0.0,
        total_fiber_g=fiber_total,
        fiber_coverage_status=fiber_status,
        feasibility_class=feas_class,
        primary_objective=primary_obj,
        secondary_objective=secondary_obj,  # Preserved as diagnostic metadata only
        secondary_objective_mode=sec_mode_str,
        target_deviations=deviations,
        recipe_instruction_coverage_status=recipe_coverage,
        item_recipe_availability=item_recipe_map,
        matched_preferred_entity_count=matched_pref_count,
        total_valid_preferred_entity_count=total_valid_pref_count,
        preference_coverage=pref_coverage,
        optimization_status=optimization_result.status,
        condition_annotations=list(condition_annotations or []),
    )


def compute_meal_ranking_key(plan: SingleMealPlan) -> Tuple[int, float, float, str]:
    """Computes deterministic lexicographic ranking key for cross-combination comparison.

    Contract:
    1. feasibility_rank (FEASIBLE=0, OPTIMAL_WITH_TARGET_DEVIATIONS=1, INFEASIBLE=2)
    2. Phase 6B primary objective J* (lower is better; 0.0 for fully feasible)
    3. -preference_coverage (higher preference coverage ranks earlier)
    4. canonical_combination_id (alphabetical ascending deterministic tie-breaker)

    CRITICAL INVARIANT:
    `plan.secondary_objective` is NEVER used in this key.
    Secondary objective has different units across modes and is local to an individual combination.
    """
    feas_rank = {
        MealFeasibilityClass.FEASIBLE: 0,
        MealFeasibilityClass.OPTIMAL_WITH_TARGET_DEVIATIONS: 1,
        MealFeasibilityClass.INFEASIBLE_UPSTREAM: 2,
    }.get(plan.feasibility_class, 99)

    return (
        feas_rank,
        round(plan.primary_objective, 6),
        -round(plan.preference_coverage, 6),
        plan.canonical_combination_id,
    )

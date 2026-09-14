"""Meal/optimizer/orchestrator.py - Public entry point for Phase 6B Portion Optimization.

Coordinates:
- Upstream readiness verification (Phase 5A safety gates).
- Target ranges and provenance validation.
- Strict Phase 6A vetted candidate pool membership check.
- Exact set equality between selected_entity_ids and constraints.
- Deterministic candidate ordering (entity_id ascending).
- Two-pass linear programming execution via solve_portion_lp.
- Nutrient scaling with full precision and standard-portion conversions.
- Unknown-preserving fiber aggregation and transparent deviation reporting.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.optimizer.nutrients import (
    aggregate_fiber,
    compute_deviation,
    compute_standard_portion_equivalence,
    scale_nutrients,
)
from Meal.optimizer.schemas import (
    NutrientTargetStatus,
    OptimizedPortion,
    PortionConstraint,
    PortionOptimizationResult,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
)
from Meal.optimizer.solver import solve_portion_lp
from Meal.optimizer.validation import (
    validate_candidates_and_constraints,
    validate_target,
    validate_upstream_readiness,
)
from Meal.planner.catalog import PlannerCatalogEntity, load_master_planner_catalog
from Meal.planner.schemas import CandidateRankingResult


def optimize_portions(
    neutral_profile: NutritionTargetProfile,
    condition_profile: ConditionNutritionProfile,
    candidate_result: CandidateRankingResult,
    selected_entity_ids: List[str],
    target: PortionOptimizationTarget,
    constraints: List[PortionConstraint],
) -> PortionOptimizationResult:
    """Public Phase 6B entry point for deterministic portion optimization.
    
    Solves continuous gram portions for an explicitly supplied set of Phase 6A
    vetted candidates against an explicit nutrition target and explicit bounds.
    """
    trace: List[str] = []
    warnings: List[str] = []

    # 1. Validate upstream Phase 5A planning readiness
    readiness_status, readiness_warnings = validate_upstream_readiness(neutral_profile)
    warnings.extend(readiness_warnings)
    if readiness_status is not None:
        trace.append(f"REJECTED_UPSTREAM: {readiness_status.value}")
        return PortionOptimizationResult(
            status=readiness_status,
            selected_entity_ids=list(selected_entity_ids),
            optimized_portions=[],
            target=target,
            achieved_energy_kcal=None,
            achieved_protein_g=None,
            achieved_carbohydrate_g=None,
            achieved_fat_g=None,
            fiber_result=None,
            energy_target_deviation=None,
            protein_target_deviation=None,
            carbohydrate_target_deviation=None,
            fat_target_deviation=None,
            all_core_targets_within_range=False,
            objective_value=None,
            objective_components={},
            objective_weights_used={},
            objective_normalization_scales={},
            source_meal_role=candidate_result.requested_meal_role if candidate_result else None,
            source_candidate_scoring_version=candidate_result.scoring_version if candidate_result else None,
            source_catalog_version=candidate_result.catalog_version if candidate_result else None,
            solver_name="scipy.optimize.linprog(highs)",
            solver_version="1.17.0",
            solver_status="NOT_RUN",
            solver_message="Upstream planning readiness checks failed.",
            warnings=warnings,
            trace=trace,
        )

    # 2. Validate Target ranges and provenance
    target_status, target_warnings = validate_target(target, neutral_profile)
    warnings.extend(target_warnings)
    if target_status is not None:
        trace.append(f"REJECTED_TARGET: {target_status.value}")
        return PortionOptimizationResult(
            status=target_status,
            selected_entity_ids=list(selected_entity_ids),
            optimized_portions=[],
            target=target,
            achieved_energy_kcal=None,
            achieved_protein_g=None,
            achieved_carbohydrate_g=None,
            achieved_fat_g=None,
            fiber_result=None,
            energy_target_deviation=None,
            protein_target_deviation=None,
            carbohydrate_target_deviation=None,
            fat_target_deviation=None,
            all_core_targets_within_range=False,
            objective_value=None,
            objective_components={},
            objective_weights_used={},
            objective_normalization_scales={},
            source_meal_role=candidate_result.requested_meal_role if candidate_result else None,
            source_candidate_scoring_version=candidate_result.scoring_version if candidate_result else None,
            source_catalog_version=candidate_result.catalog_version if candidate_result else None,
            solver_name="scipy.optimize.linprog(highs)",
            solver_version="1.17.0",
            solver_status="NOT_RUN",
            solver_message="Target validation checks failed.",
            warnings=warnings,
            trace=trace,
        )

    # 3. Validate Candidate Pool and Constraints
    cand_status, cand_warnings = validate_candidates_and_constraints(
        candidate_result, selected_entity_ids, constraints
    )
    warnings.extend(cand_warnings)
    if cand_status is not None:
        trace.append(f"REJECTED_CANDIDATES: {cand_status.value}")
        return PortionOptimizationResult(
            status=cand_status,
            selected_entity_ids=list(selected_entity_ids),
            optimized_portions=[],
            target=target,
            achieved_energy_kcal=None,
            achieved_protein_g=None,
            achieved_carbohydrate_g=None,
            achieved_fat_g=None,
            fiber_result=None,
            energy_target_deviation=None,
            protein_target_deviation=None,
            carbohydrate_target_deviation=None,
            fat_target_deviation=None,
            all_core_targets_within_range=False,
            objective_value=None,
            objective_components={},
            objective_weights_used={},
            objective_normalization_scales={},
            source_meal_role=candidate_result.requested_meal_role if candidate_result else None,
            source_candidate_scoring_version=candidate_result.scoring_version if candidate_result else None,
            source_catalog_version=candidate_result.catalog_version if candidate_result else None,
            solver_name="scipy.optimize.linprog(highs)",
            solver_version="1.17.0",
            solver_status="NOT_RUN",
            solver_message="Candidate or constraint validation checks failed.",
            warnings=warnings,
            trace=trace,
        )

    # 4. Load locked master catalog
    catalog = load_master_planner_catalog()

    # 5. Deterministic entity sorting (entity_id ascending)
    sorted_eids = sorted(selected_entity_ids)
    constraint_map = {c.entity_id: c for c in constraints}

    trace.append(f"PHASE_6A_ROLE_POOL: {candidate_result.requested_meal_role.value.upper()}")
    trace.append(f"SELECTED_ENTITIES_ORDERED: {sorted_eids}")

    # 6. Construct per-gram coefficient arrays and bounds
    energy_coeffs: List[float] = []
    protein_coeffs: List[float] = []
    carb_coeffs: List[float] = []
    fat_coeffs: List[float] = []
    gram_bounds: List[Tuple[float, float]] = []
    preferred_grams: List[Optional[float]] = []

    for eid in sorted_eids:
        ent = catalog[eid]
        c = constraint_map[eid]

        energy_coeffs.append(float(ent.normalized_energy_kcal_per_100g) / 100.0)
        protein_coeffs.append(float(ent.normalized_protein_g_per_100g) / 100.0)
        carb_coeffs.append(float(ent.normalized_carb_g_per_100g) / 100.0)
        fat_coeffs.append(float(ent.normalized_fat_g_per_100g) / 100.0)

        gram_bounds.append((float(c.minimum_grams), float(c.maximum_grams)))
        preferred_grams.append(float(c.preferred_grams) if c.preferred_grams is not None else None)

    nutrient_coeffs = {
        "energy": energy_coeffs,
        "protein": protein_coeffs,
        "carb": carb_coeffs,
        "fat": fat_coeffs,
    }

    target_ranges = {
        "energy": (float(target.energy_min_kcal), float(target.energy_max_kcal)),
        "protein": (float(target.protein_min_g), float(target.protein_max_g)),
        "carb": (float(target.carbohydrate_min_g), float(target.carbohydrate_max_g)),
        "fat": (float(target.fat_min_g), float(target.fat_max_g)),
    }

    # 7. Execute deterministic Two-Pass LP Solver
    solution = solve_portion_lp(
        nutrient_coefficients=nutrient_coeffs,
        target_ranges=target_ranges,
        gram_bounds=gram_bounds,
        preferred_grams=preferred_grams,
    )

    if not solution.success:
        failure_status = (
            PortionOptimizationStatus.SECONDARY_SOLVER_FAILURE
            if solution.solver_status == "SECONDARY_SOLVER_FAILURE"
            else PortionOptimizationStatus.SOLVER_FAILURE
        )
        trace.append(f"{failure_status.value}: {solution.solver_message}")
        return PortionOptimizationResult(
            status=failure_status,
            selected_entity_ids=sorted_eids,
            optimized_portions=[],
            target=target,
            achieved_energy_kcal=None,
            achieved_protein_g=None,
            achieved_carbohydrate_g=None,
            achieved_fat_g=None,
            fiber_result=None,
            energy_target_deviation=None,
            protein_target_deviation=None,
            carbohydrate_target_deviation=None,
            fat_target_deviation=None,
            all_core_targets_within_range=False,
            objective_value=None,
            objective_components={},
            objective_weights_used=solution.objective_weights_used,
            objective_normalization_scales=solution.normalization_scales_used,
            source_meal_role=candidate_result.requested_meal_role,
            source_candidate_scoring_version=candidate_result.scoring_version,
            source_catalog_version=candidate_result.catalog_version,
            solver_name=solution.solver_name,
            solver_version=solution.solver_version,
            solver_status=solution.solver_status,
            solver_message=solution.solver_message,
            secondary_objective_mode=solution.secondary_objective_mode,
            warnings=warnings,
            trace=trace,
        )

    # 8. Scale achieved nutrients with full precision and build OptimizedPortions
    optimized_portions: List[OptimizedPortion] = []
    portion_fibers: List[Tuple[str, Optional[float]]] = []

    total_achieved_energy = 0.0
    total_achieved_protein = 0.0
    total_achieved_carb = 0.0
    total_achieved_fat = 0.0

    for idx, eid in enumerate(sorted_eids):
        ent = catalog[eid]
        c = constraint_map[eid]
        grams = solution.optimized_grams[idx]

        e_kcal, p_g, f_g, c_g, fib_g, fib_stat = scale_nutrients(ent, grams)
        std_g, eq_exact, eq_disp, std_label = compute_standard_portion_equivalence(ent, grams)

        portion_fibers.append((eid, fib_g))

        total_achieved_energy += e_kcal
        total_achieved_protein += p_g
        total_achieved_carb += c_g
        total_achieved_fat += f_g

        opt_portion = OptimizedPortion(
            entity_id=eid,
            display_name=ent.entity_name_en,
            optimized_grams=grams,
            standard_portion_grams=std_g,
            equivalent_standard_portions_exact=eq_exact,
            equivalent_standard_portions_display=eq_disp,
            standard_portion_label=std_label,
            minimum_grams=c.minimum_grams,
            maximum_grams=c.maximum_grams,
            preferred_grams=c.preferred_grams,
            energy_kcal=e_kcal,
            protein_g=p_g,
            fat_g=f_g,
            carbohydrate_g=c_g,
            fiber_g=fib_g,
            fiber_status=fib_stat,
            constraint_source=c.constraint_source,
            nutrition_source=ent.native_nutrition_basis,
            traceability=ent.canonical_or_component_source_id,
        )
        optimized_portions.append(opt_portion)

    # 9. Compute exact nutrient deviations against target ranges
    dev_energy = compute_deviation(
        "energy",
        total_achieved_energy,
        target.energy_min_kcal,
        target.energy_max_kcal,
        solution.normalization_scales_used["energy"],
    )
    dev_protein = compute_deviation(
        "protein",
        total_achieved_protein,
        target.protein_min_g,
        target.protein_max_g,
        solution.normalization_scales_used["protein"],
    )
    dev_carb = compute_deviation(
        "carbohydrate",
        total_achieved_carb,
        target.carbohydrate_min_g,
        target.carbohydrate_max_g,
        solution.normalization_scales_used["carb"],
    )
    dev_fat = compute_deviation(
        "fat",
        total_achieved_fat,
        target.fat_min_g,
        target.fat_max_g,
        solution.normalization_scales_used["fat"],
    )

    all_targets_within_range = (
        dev_energy.status == NutrientTargetStatus.WITHIN_RANGE
        and dev_protein.status == NutrientTargetStatus.WITHIN_RANGE
        and dev_carb.status == NutrientTargetStatus.WITHIN_RANGE
        and dev_fat.status == NutrientTargetStatus.WITHIN_RANGE
    )

    if all_targets_within_range:
        opt_status = PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES
    else:
        opt_status = PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS

    # 10. Aggregate fiber preserving missingness
    fiber_res = aggregate_fiber(portion_fibers, target.fiber_reference_g)

    trace.append(f"OPTIMIZATION_STATUS: {opt_status.value}")
    trace.append(f"ALL_CORE_TARGETS_WITHIN_RANGE: {all_targets_within_range}")
    trace.append(f"PRIMARY_OBJECTIVE_VALUE: {solution.primary_objective_value:.6f}")
    trace.append(f"ACHIEVED_ENERGY_KCAL: {total_achieved_energy:.2f} (target [{target.energy_min_kcal:.1f}, {target.energy_max_kcal:.1f}])")
    trace.append(f"ACHIEVED_PROTEIN_G: {total_achieved_protein:.2f} (target [{target.protein_min_g:.1f}, {target.protein_max_g:.1f}])")
    trace.append(f"ACHIEVED_CARB_G: {total_achieved_carb:.2f} (target [{target.carbohydrate_min_g:.1f}, {target.carbohydrate_max_g:.1f}])")
    trace.append(f"ACHIEVED_FAT_G: {total_achieved_fat:.2f} (target [{target.fat_min_g:.1f}, {target.fat_max_g:.1f}])")
    trace.append(f"FIBER_COVERAGE: {fiber_res.coverage_status.value}, KNOWN_TOTAL: {fiber_res.known_fiber_total_g}")
    trace.append(f"CONDITION_PATHWAY_ISOLATED: {condition_profile.condition_pathway.value} (0.0 numerical influence)")

    scales_exposed = dict(solution.normalization_scales_used)
    if "carb" in scales_exposed and "carbohydrate" not in scales_exposed:
        scales_exposed["carbohydrate"] = scales_exposed["carb"]
    if "carbohydrate" in scales_exposed and "carb" not in scales_exposed:
        scales_exposed["carb"] = scales_exposed["carbohydrate"]

    return PortionOptimizationResult(
        status=opt_status,
        selected_entity_ids=sorted_eids,
        optimized_portions=optimized_portions,
        target=target,
        achieved_energy_kcal=total_achieved_energy,
        achieved_protein_g=total_achieved_protein,
        achieved_carbohydrate_g=total_achieved_carb,
        achieved_fat_g=total_achieved_fat,
        fiber_result=fiber_res,
        energy_target_deviation=dev_energy,
        protein_target_deviation=dev_protein,
        carbohydrate_target_deviation=dev_carb,
        fat_target_deviation=dev_fat,
        all_core_targets_within_range=all_targets_within_range,
        objective_value=solution.primary_objective_value,
        objective_components=solution.objective_components,
        objective_weights_used=solution.objective_weights_used,
        objective_normalization_scales=scales_exposed,
        source_meal_role=candidate_result.requested_meal_role,
        source_candidate_scoring_version=candidate_result.scoring_version,
        source_catalog_version=candidate_result.catalog_version,
        solver_name=solution.solver_name,
        solver_version=solution.solver_version,
        solver_status=solution.solver_status,
        solver_message=solution.solver_message,
        secondary_objective_mode=solution.secondary_objective_mode,
        warnings=warnings,
        trace=trace,
    )

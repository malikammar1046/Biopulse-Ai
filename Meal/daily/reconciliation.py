"""Meal/daily/reconciliation.py - Schedule target reconciliation and non-clinical helpers for Phase 6D.

Validates the arithmetic alignment between the caller's explicit meal target allocations
and the Phase 5A neutral daily nutrition target profile.

Strict Architectural Invariants:
1. No Invented Clinical Splits:
   - BioPulse does NOT assert that 25% Breakfast / 35% Lunch / 30% Dinner / 10% Snack
     is a clinical rule or gold standard.
   - The default engineering helper is explicitly flagged as a non-clinical computational convenience.
2. Immutability of Phase 5A Targets:
   - Reconciliation detects conflicts (`DAILY_ALLOCATION_TARGET_CONFLICT`) and records warnings.
   - It NEVER silently modifies the Phase 5A daily target.
"""

from __future__ import annotations

from typing import List, Optional

from Meal.daily.schemas import (
    DailyAllocationReconciliation,
    DailyMealSchedule,
    DailyReconciliationStatus,
    MealAllocation,
)
from Meal.engine.schemas import NutritionTargetProfile
from Meal.optimizer.schemas import PortionOptimizationTarget, TargetScope
from Meal.planner.schemas import MealRole


def reconcile_daily_schedule(
    schedule: DailyMealSchedule,
    daily_target: NutritionTargetProfile,
    tolerance_kcal: float = 50.0,
) -> DailyAllocationReconciliation:
    """Compares the sum of meal targets against Phase 5A neutral daily targets.
    
    Verifies:
    1. Total scheduled target energy vs daily target energy (within tolerance_kcal).
    2. Overlap/compatibility of scheduled macro minimums and maximums with daily AMDR/targets.
    
    Returns DailyAllocationReconciliation with machine-readable status and warnings.
    """
    if not isinstance(schedule, DailyMealSchedule):
        raise TypeError(f"schedule must be DailyMealSchedule, got {type(schedule)}")
    if not isinstance(daily_target, NutritionTargetProfile):
        raise TypeError(f"daily_target must be NutritionTargetProfile, got {type(daily_target)}")

    warnings: List[str] = []

    # 1. Energy reconciliation
    scheduled_energy = sum(alloc.target.target_energy_kcal for alloc in schedule.allocations)
    daily_energy = daily_target.energy_target_kcal
    energy_diff = scheduled_energy - daily_energy
    energy_within_tol = abs(energy_diff) <= (tolerance_kcal + 1e-4)

    if not energy_within_tol:
        warnings.append(
            f"Scheduled energy sum ({scheduled_energy:.1f} kcal) deviates from daily target "
            f"({daily_energy:.1f} kcal) by {energy_diff:+.1f} kcal, exceeding tolerance {tolerance_kcal:.1f} kcal."
        )

    # 2. Protein reconciliation
    sched_prot_min = sum(alloc.target.protein_min_g for alloc in schedule.allocations)
    sched_prot_max = sum(alloc.target.protein_max_g for alloc in schedule.allocations)
    daily_prot_min = (
        daily_target.protein_target_min_g
        if daily_target.protein_target_min_g is not None
        else daily_target.protein_amdr_min_g
    )
    daily_prot_max = (
        daily_target.protein_target_max_g
        if daily_target.protein_target_max_g is not None
        else daily_target.protein_amdr_max_g
    )
    # Check if scheduled range overlaps or contradicts daily target range
    prot_compatible = not (sched_prot_min > daily_prot_max + 1.0 or sched_prot_max < daily_prot_min - 1.0)
    if not prot_compatible:
        warnings.append(
            f"Scheduled protein range sum [{sched_prot_min:.1f}, {sched_prot_max:.1f}]g contradicts "
            f"daily target range [{daily_prot_min:.1f}, {daily_prot_max:.1f}]g."
        )

    # 3. Carbohydrate reconciliation
    sched_carb_min = sum(alloc.target.carbohydrate_min_g for alloc in schedule.allocations)
    sched_carb_max = sum(alloc.target.carbohydrate_max_g for alloc in schedule.allocations)
    daily_carb_min = (
        daily_target.carbohydrate_target_min_g
        if daily_target.carbohydrate_target_min_g is not None
        else daily_target.carbohydrate_amdr_min_g
    )
    daily_carb_max = (
        daily_target.carbohydrate_target_max_g
        if daily_target.carbohydrate_target_max_g is not None
        else daily_target.carbohydrate_amdr_max_g
    )
    carb_compatible = not (sched_carb_min > daily_carb_max + 1.0 or sched_carb_max < daily_carb_min - 1.0)
    if not carb_compatible:
        warnings.append(
            f"Scheduled carbohydrate range sum [{sched_carb_min:.1f}, {sched_carb_max:.1f}]g contradicts "
            f"daily target range [{daily_carb_min:.1f}, {daily_carb_max:.1f}]g."
        )

    # 4. Fat reconciliation
    sched_fat_min = sum(alloc.target.fat_min_g for alloc in schedule.allocations)
    sched_fat_max = sum(alloc.target.fat_max_g for alloc in schedule.allocations)
    daily_fat_min = daily_target.fat_amdr_min_g
    daily_fat_max = daily_target.fat_amdr_max_g
    fat_compatible = not (sched_fat_min > daily_fat_max + 1.0 or sched_fat_max < daily_fat_min - 1.0)
    if not fat_compatible:
        warnings.append(
            f"Scheduled fat range sum [{sched_fat_min:.1f}, {sched_fat_max:.1f}]g contradicts "
            f"daily target range [{daily_fat_min:.1f}, {daily_fat_max:.1f}]g."
        )

    # 5. Overall status determination
    all_macros_compatible = prot_compatible and carb_compatible and fat_compatible
    if abs(energy_diff) <= 1e-4 and all_macros_compatible:
        status = DailyReconciliationStatus.RECONCILED_EXACT
    elif energy_within_tol and all_macros_compatible:
        status = DailyReconciliationStatus.RECONCILED_WITHIN_TOLERANCE
    else:
        status = DailyReconciliationStatus.DAILY_ALLOCATION_TARGET_CONFLICT

    return DailyAllocationReconciliation(
        status=status,
        scheduled_energy_target_sum=scheduled_energy,
        daily_energy_target_kcal=daily_energy,
        energy_difference_kcal=energy_diff,
        energy_within_tolerance=energy_within_tol,
        scheduled_protein_min_sum=sched_prot_min,
        scheduled_protein_max_sum=sched_prot_max,
        daily_protein_min_g=daily_prot_min,
        daily_protein_max_g=daily_prot_max,
        protein_ranges_compatible=prot_compatible,
        scheduled_carbohydrate_min_sum=sched_carb_min,
        scheduled_carbohydrate_max_sum=sched_carb_max,
        daily_carbohydrate_min_g=daily_carb_min,
        daily_carbohydrate_max_g=daily_carb_max,
        carbohydrate_ranges_compatible=carb_compatible,
        scheduled_fat_min_sum=sched_fat_min,
        scheduled_fat_max_sum=sched_fat_max,
        daily_fat_min_g=daily_fat_min,
        daily_fat_max_g=daily_fat_max,
        fat_ranges_compatible=fat_compatible,
        tolerance_kcal=tolerance_kcal,
        warnings=warnings,
    )


def create_engineering_default_schedule(
    daily_target: NutritionTargetProfile,
    energy_tolerance_kcal: float = 50.0,
    roles: Optional[List[MealRole]] = None,
) -> DailyMealSchedule:
    """Creates a non-clinical engineering default schedule for testing and automated runs.
    
    CRITICAL DISCLAIMER:
    This function implements a pure engineering split across meals.
    It is NOT medical, dietary, or clinical advice, and does not represent
    a clinical gold standard. Meal proportions are fully configurable.
    
    Default non-clinical 4-meal proportions:
    - Breakfast: 25%
    - Lunch: 35%
    - Dinner: 30%
    - Snack: 10%
    
    Default non-clinical 3-meal proportions:
    - Breakfast: 30%
    - Lunch: 40%
    - Dinner: 30%
    """
    if roles is None:
        roles = [MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER, MealRole.SNACK]

    # Assign non-clinical engineering proportions
    if roles == [MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER, MealRole.SNACK]:
        proportions = {
            MealRole.BREAKFAST: 0.25,
            MealRole.LUNCH: 0.35,
            MealRole.DINNER: 0.30,
            MealRole.SNACK: 0.10,
        }
    elif roles == [MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER]:
        proportions = {
            MealRole.BREAKFAST: 0.30,
            MealRole.LUNCH: 0.40,
            MealRole.DINNER: 0.30,
        }
    else:
        # Equal distribution across arbitrary roles
        p = 1.0 / len(roles)
        proportions = {role: p for role in roles}

    daily_energy = daily_target.energy_target_kcal
    daily_prot_min = (
        daily_target.protein_target_min_g
        if daily_target.protein_target_min_g is not None
        else daily_target.protein_amdr_min_g
    )
    daily_prot_max = (
        daily_target.protein_target_max_g
        if daily_target.protein_target_max_g is not None
        else daily_target.protein_amdr_max_g
    )
    daily_carb_min = (
        daily_target.carbohydrate_target_min_g
        if daily_target.carbohydrate_target_min_g is not None
        else daily_target.carbohydrate_amdr_min_g
    )
    daily_carb_max = (
        daily_target.carbohydrate_target_max_g
        if daily_target.carbohydrate_target_max_g is not None
        else daily_target.carbohydrate_amdr_max_g
    )
    daily_fat_min = daily_target.fat_amdr_min_g
    daily_fat_max = daily_target.fat_amdr_max_g

    allocations: List[MealAllocation] = []
    for role in roles:
        prop = proportions[role]
        meal_target = PortionOptimizationTarget(
            target_energy_kcal=daily_energy * prop,
            energy_tolerance_kcal=energy_tolerance_kcal * prop,
            protein_min_g=daily_prot_min * prop,
            protein_max_g=daily_prot_max * prop,
            carbohydrate_min_g=daily_carb_min * prop,
            carbohydrate_max_g=daily_carb_max * prop,
            fat_min_g=daily_fat_min * prop,
            fat_max_g=daily_fat_max * prop,
            fiber_reference_g=daily_target.fiber_ai_g * prop,
            target_scope=TargetScope.FUTURE_PHASE6C_ALLOCATED_TARGET,
            target_source="ENGINEERING_DEFAULT_NON_CLINICAL",
        )
        allocations.append(
            MealAllocation(
                role=role,
                target=meal_target,
                target_source="ENGINEERING_DEFAULT_NON_CLINICAL",
                target_scope="MEAL_ALLOCATION",
            )
        )

    return DailyMealSchedule(
        allocations=allocations,
        schedule_name="Engineering Default Schedule (Non-Clinical)",
        schedule_source="ENGINEERING_DEFAULT_NON_CLINICAL",
        is_engineering_default=True,
        notes="Non-clinical engineering proportion helper. Proportions are fully configurable.",
    )

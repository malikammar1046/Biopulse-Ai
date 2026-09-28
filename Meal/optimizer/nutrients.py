"""Meal/optimizer/nutrients.py - Nutrient scaling, standard portions, and deviation math for Phase 6B.

Enforces:
- Exact linear scaling: portion_factor = grams / 100.0.
- Full floating-point precision internally (no intermediate rounding).
- Standard portion calculations derived strictly from locked catalog metadata
  (PK_PORTION_001 = 80g, PK_PORTION_002 = 75g).
- Missing fiber preserved as None without zero substitution (unknown != zero).
- Deterministic normalized nutrient deviations against target ranges.
"""

from __future__ import annotations

from typing import List, Optional, Tuple

from Meal.optimizer.schemas import (
    FiberCoverageStatus,
    MealFiberResult,
    NutrientDeviation,
    NutrientTargetStatus,
)
from Meal.planner.catalog import PlannerCatalogEntity


def scale_nutrients(
    entity: PlannerCatalogEntity,
    grams: float,
) -> Tuple[float, float, float, float, Optional[float], str]:
    """Scales entity nutrients linearly to the specified gram portion.
    
    Returns:
        (energy_kcal, protein_g, fat_g, carb_g, fiber_g, fiber_status)
    """
    portion_factor = grams / 100.0

    energy_kcal = float(entity.normalized_energy_kcal_per_100g) * portion_factor
    protein_g = float(entity.normalized_protein_g_per_100g) * portion_factor
    fat_g = float(entity.normalized_fat_g_per_100g) * portion_factor
    carb_g = float(entity.normalized_carb_g_per_100g) * portion_factor

    if entity.normalized_fiber_g_per_100g is not None:
        fiber_g = float(entity.normalized_fiber_g_per_100g) * portion_factor
        fiber_status = "AVAILABLE"
    else:
        fiber_g = None
        fiber_status = "UNAVAILABLE"

    return energy_kcal, protein_g, fat_g, carb_g, fiber_g, fiber_status


def compute_standard_portion_equivalence(
    entity: PlannerCatalogEntity,
    grams: float,
) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[str]]:
    """Calculates standard portion equivalences from locked source catalog metadata.
    
    Standard portions cannot be caller-overridden.
    Returns:
        (standard_portion_grams, equivalent_standard_portions_exact,
         equivalent_standard_portions_display, standard_portion_label)
    """
    eid = entity.planner_entity_id
    if eid == "PK_PORTION_001":
        std_g = 80.0
        label = "chapati"
        exact = grams / std_g
        disp = round(exact, 2)
        return std_g, exact, disp, label
    elif eid == "PK_PORTION_002":
        std_g = 75.0
        label = "cooked rice"
        exact = grams / std_g
        disp = round(exact, 2)
        return std_g, exact, disp, label
    else:
        return None, None, None, None


def compute_deviation(
    nutrient_name: str,
    achieved: Optional[float] = None,
    target_min: float = 0.0,
    target_max: float = 0.0,
    normalization_scale: float = 1.0,
    *,
    actual_value: Optional[float] = None,
) -> NutrientDeviation:
    """Computes exact absolute and normalized deviations against a target range."""
    ach = actual_value if actual_value is not None else (achieved if achieved is not None else 0.0)
    if normalization_scale <= 0.0:
        scale = 1.0
    else:
        scale = normalization_scale

    eps = 1e-4
    if ach < target_min - eps:
        abs_dev = ach - target_min  # negative
        norm_dev = abs(abs_dev) / scale
        status = NutrientTargetStatus.BELOW_RANGE
    elif ach > target_max + eps:
        abs_dev = ach - target_max  # positive
        norm_dev = abs_dev / scale
        status = NutrientTargetStatus.ABOVE_RANGE
    else:
        abs_dev = 0.0
        norm_dev = 0.0
        status = NutrientTargetStatus.WITHIN_RANGE

    return NutrientDeviation(
        nutrient=nutrient_name,
        achieved=ach,
        target_min=target_min,
        target_max=target_max,
        status=status,
        absolute_deviation=abs_dev,
        normalized_deviation=norm_dev,
        normalization_scale=scale,
    )


def aggregate_fiber(
    portion_fibers: List[Tuple[str, Optional[float]]],
    target_reference_g: Optional[float] = None,
) -> MealFiberResult:
    """Aggregates fiber contributions while strictly preserving missingness."""
    total_count = len(portion_fibers)
    missing_eids = [eid for eid, f in portion_fibers if f is None]
    present_fibers = [f for _, f in portion_fibers if f is not None]
    covered_count = len(present_fibers)

    if covered_count == total_count:
        coverage = FiberCoverageStatus.COMPLETE
        known_total: Optional[float] = sum(present_fibers)
    elif covered_count == 0:
        coverage = FiberCoverageStatus.UNAVAILABLE
        known_total = None
    else:
        coverage = FiberCoverageStatus.PARTIAL
        known_total = sum(present_fibers)

    return MealFiberResult(
        coverage_status=coverage,
        known_fiber_total_g=known_total,
        total_entity_count=total_count,
        fiber_coverage_entity_count=covered_count,
        fiber_missing_entity_ids=missing_eids,
        target_reference_g=target_reference_g,
    )

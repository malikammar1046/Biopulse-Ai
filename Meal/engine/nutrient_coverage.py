"""
BioPulse Personalized Nutrition Engine — Nutrient Coverage Audit
Computes per-entity macro completeness, per-entity `core_macro_optimization_eligible` flag,
and the session joint eligibility flag.

Key Policies:
- core_macro_optimization_eligible is computed per-entity: True iff all 4 core macros
  (energy, protein, carbohydrate, fat) are present with non-null, non-NaN values.
- Never substitute missing macros with zero.
- Catalog audit reports: 63 eligible entities, 8 ineligible entities.
- Incomplete entity IDs are explicitly exposed in coverage summaries.
"""

from dataclasses import dataclass, field
import os
import math
from pathlib import Path
from .schemas import NutrientClassification
from typing import Dict, List, Optional, Set, Tuple

_CORE_MACROS = ("energy_kcal", "protein_g", "carbohydrate_g", "fat_g")


_NUTRIENT_CLASSIFICATIONS = {
    **{name: NutrientClassification.CORE_OPTIMIZATION_READY for name in _CORE_MACROS},
    "fiber_g": NutrientClassification.SOFT_TARGET_ONLY,
    "calcium_mg": NutrientClassification.INSUFFICIENT_COVERAGE,
    "iron_mg": NutrientClassification.INSUFFICIENT_COVERAGE,
    "vit_c_mg": NutrientClassification.INSUFFICIENT_COVERAGE,
}


def nutrient_classifications():
    """Nutrient policy, independent of any entity's actual measured values."""
    return dict(_NUTRIENT_CLASSIFICATIONS)


def _has_value(value):
    if value is None or isinstance(value, bool):
        return False
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError, OverflowError):
        return False


@dataclass
class EntityCoverageResult:
    entity_id: str
    entity_name: str
    has_energy_kcal: bool
    has_protein_g: bool
    has_carbohydrate_g: bool
    has_fat_g: bool
    has_fiber_g: bool
    core_macro_complete: bool
    missing_macros: List[str] = field(default_factory=list)
    core_macro_optimization_eligible: bool = False

    nutrient_classifications: Dict[str, NutrientClassification] = field(default_factory=nutrient_classifications)
    planner_catalog_availability: Dict[str, bool] = field(default_factory=dict)

    def __post_init__(self):
        # Synchronize core_macro_optimization_eligible with core_macro_complete
        self.core_macro_optimization_eligible = self.core_macro_complete


def audit_entity_coverage(entity: dict) -> EntityCoverageResult:
    """
    Audit a single catalog entity for core macro presence.

    At runtime every planner entity receives:
        core_macro_optimization_eligible = true/false
    based on availability of all four:
        energy, protein, fat, carbohydrate.

    Never substitute missing macros with zero.

    Supports both standard dict keys ('energy_kcal', 'protein_g', etc.)
    and raw master planner catalog column names.
    """
    def _has_any(*field_names: str) -> bool:
        return any(_has_value(entity.get(name)) for name in field_names)

    has_energy = _has_any(
        "energy_kcal",
        "normalized_energy_kcal_per_100g",
        "energy_kcal_per_100g",
        "nutrition_per_portion",
        "derived_fct_energy_kcal",
    )
    has_protein = _has_any(
        "protein_g",
        "normalized_protein_g_per_100g",
        "protein_g_per_100g",
        "derived_fct_protein_g",
    )
    has_carb = _has_any(
        "carbohydrate_g",
        "carb_g",
        "normalized_carb_g_per_100g",
        "carb_g_per_100g",
        "derived_fct_carb_g",
    )
    has_fat = _has_any(
        "fat_g",
        "normalized_fat_g_per_100g",
        "fat_g_per_100g",
        "derived_fct_fat_g",
    )
    has_fiber = _has_any(
        "fiber_g",
        "normalized_fiber_g_per_100g",
        "fiber_g_per_100g",
    )

    missing = []
    if not has_energy:
        missing.append("energy_kcal")
    if not has_protein:
        missing.append("protein_g")
    if not has_carb:
        missing.append("carbohydrate_g")
    if not has_fat:
        missing.append("fat_g")

    core_complete = (len(missing) == 0)

    eid = entity.get("entity_id") or entity.get("planner_entity_id", "UNKNOWN")
    ename = entity.get("entity_name") or entity.get("entity_name_en", "Unnamed")

    return EntityCoverageResult(
        entity_id=eid,
        entity_name=ename,
        has_energy_kcal=has_energy,
        has_protein_g=has_protein,
        has_carbohydrate_g=has_carb,
        has_fat_g=has_fat,
        has_fiber_g=has_fiber,
        core_macro_complete=core_complete,
        missing_macros=missing,
        core_macro_optimization_eligible=core_complete,
        planner_catalog_availability={
            "energy_kcal": has_energy, "protein_g": has_protein,
            "carbohydrate_g": has_carb, "fat_g": has_fat, "fiber_g": has_fiber,
            **{name: _has_any(name, name + "_per_100g", "normalized_" + name + "_per_100g")
               for name in ("calcium_mg", "iron_mg", "vit_c_mg")},
        },
    )


def audit_coverage_set(entities: List[dict]) -> Dict[str, EntityCoverageResult]:
    """Audit all catalog entities and return a map of entity_id → EntityCoverageResult."""
    return {
        entity.get("entity_id") or entity.get("planner_entity_id", f"_idx_{i}"): audit_entity_coverage(entity)
        for i, entity in enumerate(entities)
    }


def compute_joint_macro_eligibility(
    safe_entity_ids: Set[str],
    coverage_results: Dict[str, EntityCoverageResult],
) -> Tuple[bool, int, int, List[str]]:
    """
    Determine joint core_macro_optimization_eligible flag for a planning session.

    A planning session is `core_macro_optimization_eligible = True` only when
    ALL entities in the safe (post-safety-filter) set have
    `core_macro_optimization_eligible = True`.
    """
    safe_complete = 0
    safe_incomplete = 0
    incomplete_ids: List[str] = []

    for eid in safe_entity_ids:
        cov = coverage_results.get(eid)
        if cov is None:
            safe_incomplete += 1
            incomplete_ids.append(eid)
            continue
        if cov.core_macro_optimization_eligible:
            safe_complete += 1
        else:
            safe_incomplete += 1
            incomplete_ids.append(eid)

    eligible = safe_incomplete == 0 and safe_complete > 0
    return eligible, safe_complete, safe_incomplete, incomplete_ids


def coverage_summary(results: Dict[str, EntityCoverageResult]) -> dict:
    """Return aggregate statistics for a coverage audit pass, exposing incomplete entity IDs."""
    total = len(results)
    complete = sum(1 for r in results.values() if r.core_macro_optimization_eligible)
    ineligible = total - complete
    has_fiber = sum(1 for r in results.values() if r.has_fiber_g)
    missing_counts: Dict[str, int] = {}
    incomplete_ids: List[str] = []
    for r in results.values():
        if not r.core_macro_optimization_eligible:
            incomplete_ids.append(r.entity_id)
        for m in r.missing_macros:
            missing_counts[m] = missing_counts.get(m, 0) + 1

    return {
        "nutrient_classifications": nutrient_classifications(),
        "planner_catalog_coverage": {
            name: {
                "count": sum(r.planner_catalog_availability.get(name, False) for r in results.values()),
                "total_entities": total,
            } for name in _NUTRIENT_CLASSIFICATIONS
        },
        # Unknown until upstream provenance is explicitly audited; never false zero.
        "upstream_source_coverage": None,
        "total_entities": total,
        "core_macro_complete": complete,
        "core_macro_incomplete": ineligible,
        "core_macro_optimization_eligible": complete,
        "core_macro_optimization_ineligible": ineligible,
        "entities_with_fiber_g": has_fiber,
        "missing_field_counts": missing_counts,
        "incomplete_entity_ids": incomplete_ids,
    }


def audit_master_catalog(csv_path: Optional[str] = None, *, upstream_data_dir: Optional[str] = None) -> Tuple[Dict[str, EntityCoverageResult], dict]:
    """
    Load and audit the canonical Pakistan Master Planner Catalog CSV.
    Returns (results_by_id, summary_dict).
    """
    import csv

    use_packaged_sources = csv_path is None
    if csv_path is None:
        csv_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "processed",
            "pakistan_master_planner_catalog.csv",
        )

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        entities = list(reader)

    results = audit_coverage_set(entities)
    summary = coverage_summary(results)
    if use_packaged_sources or upstream_data_dir is not None:
        data_dir = Path(upstream_data_dir) if upstream_data_dir else Path(__file__).parent.parent / "data" / "processed"
        summary["upstream_source_coverage"] = _audit_upstream_coverage(entities, data_dir)
    return results, summary


def _audit_upstream_coverage(entities, data_dir):
    """Availability in traceable sources, not interchangeable planner values.

    Dish counts use selected default observations, never averaged observations.
    Components use their FCT food record. Portions retain raw-food reference
    availability with its distinct basis; no cooked micronutrients are derived.
    """
    import csv

    def indexed(filename, key):
        with (data_dir / filename).open(encoding="utf-8-sig", newline="") as f:
            return {row[key]: row for row in csv.DictReader(f)}

    defaults = indexed("pakistan_planner_nutrition_profiles.csv", "canonical_dish_id")
    observations = indexed("pakistan_nutrition_observations.csv", "observation_id")
    components = indexed("pakistan_meal_components.csv", "component_id")
    foods = indexed("pakistan_food_composition.csv", "food_id")
    portions = indexed("pakistan_portion_references.csv", "portion_id")
    report = {name: {"count": 0, "total_entities": len(entities), "source_records": []}
              for name in _NUTRIENT_CLASSIFICATIONS}
    for entity in entities:
        eid = entity["planner_entity_id"]
        kind = entity["entity_type"]
        source_id, row, basis = None, {}, "UNKNOWN"
        if kind == "COMPOSITE_DISH":
            source_id = defaults.get(eid, {}).get("default_observation_id")
            row = observations.get(source_id, {})
            basis = "per_100g_cooked"
        elif kind == "DIRECT_COMPONENT":
            source_id = components.get(eid, {}).get("food_id")
            row = foods.get(source_id, {})
            basis = "per_100g_source_food_state"
        elif kind == "STANDARD_PORTION":
            source_id = portions.get(eid, {}).get("fct_raw_food_id")
            row = foods.get(source_id, {})
            basis = "RAW_INGREDIENT_REFERENCE_ONLY_NOT_PORTION_NUTRITION"
        for nutrient, stats in report.items():
            column = "carb_g" if nutrient == "carbohydrate_g" else nutrient
            if kind == "COMPOSITE_DISH":
                column += "_per_100g"
            if _has_value(row.get(column)):
                stats["count"] += 1
                stats["source_records"].append({
                    "entity_id": eid, "source_record_id": source_id,
                    "source_column": column, "nutrition_basis": basis,
                })
    return report

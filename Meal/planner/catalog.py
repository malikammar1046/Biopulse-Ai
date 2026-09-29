"""Meal/planner/catalog.py - Master planner catalog reader and typed entity model.

Loads the locked 71-entity Pakistani master planner catalog
(`Meal/data/processed/pakistan_master_planner_catalog.csv`) into structured,
typed `PlannerCatalogEntity` records.

Invariants:
- Exactly 71 entities loaded.
- Never substitute missing nutrients with zero.
- Standard portion metadata (PK_PORTION_001, PK_PORTION_002) is preserved.
- Recipe instruction availability (17 composite dishes) is strictly maintained.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
import math
from pathlib import Path
from typing import Dict, List, Optional, Set

DEFAULT_CATALOG_PATH = (
    Path(__file__).parent.parent / "data" / "processed" / "pakistan_master_planner_catalog.csv"
)


def _parse_float(val: Any) -> Optional[float]:
    if val is None or val == "":
        return None
    try:
        f = float(val)
        return f if math.isfinite(f) else None
    except (ValueError, TypeError):
        return None


def _parse_bool(val: Any) -> Optional[bool]:
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        v = val.strip().lower()
        if v == "true":
            return True
        if v == "false":
            return False
    return None


@dataclass(frozen=True)
class PlannerCatalogEntity:
    """Represents an immutable, typed record from the 71-entity master planner catalog."""
    planner_entity_id: str
    entity_type: str
    canonical_or_component_source_id: str
    entity_name_en: str
    entity_name_local: str
    category: str
    meal_roles: List[str]
    native_nutrition_basis: str
    source_preparation_state: str
    supports_dynamic_portioning: bool

    # Portion-based references (e.g. PK_PORTION_001 / PK_PORTION_002)
    portion_weight_g: Optional[float]
    nutrition_per_portion: Optional[float]
    guideline_exchange_energy_kcal: Optional[float]
    guideline_exchange_carb_g: Optional[float]
    guideline_exchange_protein_g: Optional[float]
    guideline_exchange_fat_min_g: Optional[float]
    guideline_exchange_fat_max_g: Optional[float]
    derived_fct_energy_kcal: Optional[float]
    derived_fct_carb_g: Optional[float]
    derived_fct_protein_g: Optional[float]
    derived_fct_fat_g: Optional[float]

    # Raw per-100g values
    energy_kcal_per_100g: Optional[float]
    protein_g_per_100g: Optional[float]
    fat_g_per_100g: Optional[float]
    carb_g_per_100g: Optional[float]
    fiber_g_per_100g: Optional[float]

    # Normalized per-100g values (used for ranking signals)
    normalized_per_100g_available: bool
    normalized_energy_kcal_per_100g: Optional[float]
    normalized_protein_g_per_100g: Optional[float]
    normalized_fat_g_per_100g: Optional[float]
    normalized_carb_g_per_100g: Optional[float]
    normalized_fiber_g_per_100g: Optional[float]

    # Safety & Dietary Metadata
    dietary_class: str
    known_contains_dairy: Optional[bool]
    known_contains_egg: Optional[bool]
    known_contains_fish: Optional[bool]
    known_contains_meat: Optional[bool]
    known_contains_wheat: Optional[bool]
    known_contains_nuts: Optional[bool]
    allergen_assessment_complete: bool

    # Planner Readiness & Instructions
    planner_readiness: str
    nutrition_planner_eligible: bool
    recipe_instruction_eligible: bool
    preparation_instruction_available: bool
    notes: str

    def to_safety_dict(self) -> Dict[str, Any]:
        """Converts entity to raw dictionary format consumed by Phase 5A.1 safety filter."""
        return {
            "entity_id": self.planner_entity_id,
            "entity_name": self.entity_name_en,
            "dietary_class": self.dietary_class,
            "known_contains_dairy": self.known_contains_dairy,
            "known_contains_egg": self.known_contains_egg,
            "known_contains_fish": self.known_contains_fish,
            "known_contains_meat": self.known_contains_meat,
            "known_contains_wheat": self.known_contains_wheat,
            "known_contains_nuts": self.known_contains_nuts,
            "allergen_assessment_complete": self.allergen_assessment_complete,
            "planner_readiness": self.planner_readiness,
        }

    def supports_meal_role(self, role: Any) -> bool:
        """Checks if entity explicitly supports requested meal role.
        
        Uses exact normalized membership match against parsed meal_roles collection.
        Never performs raw substring matching.
        """
        if hasattr(role, "value"):
            r = str(role.value).strip().lower()
        else:
            r = str(role).strip().lower()
        return r in self.meal_roles


def load_master_planner_catalog(path: Optional[Path] = None) -> Dict[str, PlannerCatalogEntity]:
    """Loads and validates the 71-entity Pakistani master planner catalog from CSV."""
    catalog_file = path or DEFAULT_CATALOG_PATH
    if not catalog_file.exists():
        raise FileNotFoundError(f"Master planner catalog not found at {catalog_file}")

    entities: Dict[str, PlannerCatalogEntity] = {}
    with open(catalog_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            eid = row["planner_entity_id"].strip()
            if not eid:
                continue

            # Parse meal roles
            raw_roles = row.get("meal_roles", "")
            parsed_roles = [r.strip().lower() for r in raw_roles.split(",") if r.strip()]

            entity = PlannerCatalogEntity(
                planner_entity_id=eid,
                entity_type=row.get("entity_type", "").strip(),
                canonical_or_component_source_id=row.get("canonical_or_component_source_id", "").strip(),
                entity_name_en=row.get("entity_name_en", "").strip(),
                entity_name_local=row.get("entity_name_local", "").strip(),
                category=row.get("category", "").strip(),
                meal_roles=parsed_roles,
                native_nutrition_basis=row.get("native_nutrition_basis", "").strip(),
                source_preparation_state=row.get("source_preparation_state", "").strip(),
                supports_dynamic_portioning=bool(_parse_bool(row.get("supports_dynamic_portioning"))),
                portion_weight_g=_parse_float(row.get("portion_weight_g")),
                nutrition_per_portion=_parse_float(row.get("nutrition_per_portion")),
                guideline_exchange_energy_kcal=_parse_float(row.get("guideline_exchange_energy_kcal")),
                guideline_exchange_carb_g=_parse_float(row.get("guideline_exchange_carb_g")),
                guideline_exchange_protein_g=_parse_float(row.get("guideline_exchange_protein_g")),
                guideline_exchange_fat_min_g=_parse_float(row.get("guideline_exchange_fat_min_g")),
                guideline_exchange_fat_max_g=_parse_float(row.get("guideline_exchange_fat_max_g")),
                derived_fct_energy_kcal=_parse_float(row.get("derived_fct_energy_kcal")),
                derived_fct_carb_g=_parse_float(row.get("derived_fct_carb_g")),
                derived_fct_protein_g=_parse_float(row.get("derived_fct_protein_g")),
                derived_fct_fat_g=_parse_float(row.get("derived_fct_fat_g")),
                energy_kcal_per_100g=_parse_float(row.get("energy_kcal_per_100g")),
                protein_g_per_100g=_parse_float(row.get("protein_g_per_100g")),
                fat_g_per_100g=_parse_float(row.get("fat_g_per_100g")),
                carb_g_per_100g=_parse_float(row.get("carb_g_per_100g")),
                fiber_g_per_100g=_parse_float(row.get("fiber_g_per_100g")),
                normalized_per_100g_available=bool(_parse_bool(row.get("normalized_per_100g_available"))),
                normalized_energy_kcal_per_100g=_parse_float(row.get("normalized_energy_kcal_per_100g")),
                normalized_protein_g_per_100g=_parse_float(row.get("normalized_protein_g_per_100g")),
                normalized_fat_g_per_100g=_parse_float(row.get("normalized_fat_g_per_100g")),
                normalized_carb_g_per_100g=_parse_float(row.get("normalized_carb_g_per_100g")),
                normalized_fiber_g_per_100g=_parse_float(row.get("normalized_fiber_g_per_100g")),
                dietary_class=row.get("dietary_class", "").strip(),
                known_contains_dairy=_parse_bool(row.get("known_contains_dairy")),
                known_contains_egg=_parse_bool(row.get("known_contains_egg")),
                known_contains_fish=_parse_bool(row.get("known_contains_fish")),
                known_contains_meat=_parse_bool(row.get("known_contains_meat")),
                known_contains_wheat=_parse_bool(row.get("known_contains_wheat")),
                known_contains_nuts=_parse_bool(row.get("known_contains_nuts")),
                allergen_assessment_complete=bool(_parse_bool(row.get("allergen_assessment_complete"))),
                planner_readiness=row.get("planner_readiness", "").strip(),
                nutrition_planner_eligible=bool(_parse_bool(row.get("nutrition_planner_eligible"))),
                recipe_instruction_eligible=bool(_parse_bool(row.get("recipe_instruction_eligible"))),
                preparation_instruction_available=bool(_parse_bool(row.get("preparation_instruction_available"))),
                notes=row.get("notes", "").strip(),
            )
            entities[eid] = entity

    if len(entities) != 71:
        raise ValueError(f"Catalog invariant violation: expected exactly 71 entities, loaded {len(entities)}")

    return entities

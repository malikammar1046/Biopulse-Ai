"""
backend/apps/intelligence/services/pakistan_food_catalog.py

Pakistani Food Catalog Grounding Helper for BioPulse AI.
Reads authoritative, peer-reviewed Pakistani food composition data from:
Meal/data/processed/pakistan_master_planner_catalog.csv

STRICT INVARIANTS:
1. READ-ONLY: Never modifies the locked Meal/ datasets.
2. Grounded: Surfaces only authentic, laboratory-analyzed Pakistani composite dishes
   and direct components (FCT 2001 & Khan 2019).
3. Safety: Filters eligible dishes based on user allergens and dietary restrictions.
4. Macro Integrity: Never fabricates or zeroes out missing nutrient values.
"""

from __future__ import annotations

import csv
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)

# Allergen to column mapping in pakistan_master_planner_catalog.csv
ALLERGEN_TO_CATALOG_COLUMN = {
    "dairy": "known_contains_dairy",
    "milk": "known_contains_dairy",
    "lactose": "known_contains_dairy",
    "egg": "known_contains_egg",
    "eggs": "known_contains_egg",
    "fish": "known_contains_fish",
    "seafood": "known_contains_fish",
    "shellfish": "known_contains_fish",
    "wheat": "known_contains_wheat",
    "gluten": "known_contains_wheat",
    "nuts": "known_contains_nuts",
    "peanuts": "known_contains_nuts",
    "tree_nuts": "known_contains_nuts",
}


@dataclass(frozen=True)
class GroundedPakistaniFood:
    planner_entity_id: str
    entity_name_en: str
    entity_name_local: str
    category: str
    meal_roles: str
    dietary_class: str
    contains_dairy: bool
    contains_egg: bool
    contains_fish: bool
    contains_meat: bool
    contains_wheat: bool
    contains_nuts: bool
    energy_kcal_per_100g: Optional[float]
    protein_g_per_100g: Optional[float]
    fat_g_per_100g: Optional[float]
    carb_g_per_100g: Optional[float]
    fiber_g_per_100g: Optional[float]


class PakistanFoodCatalog:
    """
    In-memory read-only index of the authoritative Pakistani food catalog.
    """
    _foods: Optional[List[GroundedPakistaniFood]] = None

    @classmethod
    def _get_csv_path(cls) -> Path:
        # Resolves to PMOSense/Meal/data/processed/pakistan_master_planner_catalog.csv
        file_path = Path(__file__).resolve()
        candidates = [
            file_path.parents[4] / "Meal" / "data" / "processed" / "pakistan_master_planner_catalog.csv",
            file_path.parents[3] / "Meal" / "data" / "processed" / "pakistan_master_planner_catalog.csv",
        ]
        for p in candidates:
            if p.exists():
                return p
        return candidates[0]

    @classmethod
    def load_catalog(cls) -> List[GroundedPakistaniFood]:
        if cls._foods is not None:
            return cls._foods

        csv_path = cls._get_csv_path()
        foods: List[GroundedPakistaniFood] = []

        if not csv_path.exists():
            logger.warning("Pakistani food catalog not found at %s. Using core fallback list.", csv_path)
            cls._foods = cls._get_core_fallback_catalog()
            return cls._foods

        try:
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Check eligibility
                    is_eligible = str(row.get("nutrition_planner_eligible", "")).strip().lower() == "true"
                    if not is_eligible:
                        continue

                    def _parse_bool(val: Any) -> bool:
                        return str(val or "").strip().lower() == "true"

                    def _parse_float(val: Any) -> Optional[float]:
                        v = str(val or "").strip()
                        if not v or v.lower() == "none":
                            return None
                        try:
                            return round(float(v), 1)
                        except ValueError:
                            return None

                    food = GroundedPakistaniFood(
                        planner_entity_id=row.get("planner_entity_id", "").strip(),
                        entity_name_en=row.get("entity_name_en", "").strip(),
                        entity_name_local=row.get("entity_name_local", "").strip(),
                        category=row.get("category", "").strip(),
                        meal_roles=row.get("meal_roles", "").strip(),
                        dietary_class=row.get("dietary_class", "").strip().lower(),
                        contains_dairy=_parse_bool(row.get("known_contains_dairy")),
                        contains_egg=_parse_bool(row.get("known_contains_egg")),
                        contains_fish=_parse_bool(row.get("known_contains_fish")),
                        contains_meat=_parse_bool(row.get("known_contains_meat")),
                        contains_wheat=_parse_bool(row.get("known_contains_wheat")),
                        contains_nuts=_parse_bool(row.get("known_contains_nuts")),
                        energy_kcal_per_100g=_parse_float(row.get("normalized_energy_kcal_per_100g") or row.get("energy_kcal_per_100g")),
                        protein_g_per_100g=_parse_float(row.get("normalized_protein_g_per_100g") or row.get("protein_g_per_100g")),
                        fat_g_per_100g=_parse_float(row.get("normalized_fat_g_per_100g") or row.get("fat_g_per_100g")),
                        carb_g_per_100g=_parse_float(row.get("normalized_carb_g_per_100g") or row.get("carb_g_per_100g")),
                        fiber_g_per_100g=_parse_float(row.get("normalized_fiber_g_per_100g") or row.get("fiber_g_per_100g")),
                    )
                    foods.append(food)

            cls._foods = foods
            logger.info("Successfully loaded %d grounded Pakistani foods into memory.", len(foods))
        except Exception as exc:
            logger.error("Failed to parse Pakistani food catalog: %s. Using core fallback.", exc)
            cls._foods = cls._get_core_fallback_catalog()

        return cls._foods

    @classmethod
    def get_eligible_foods(
        cls,
        allergens: Optional[List[str]] = None,
        intolerances: Optional[List[str]] = None,
        dietary_preference: str = "omnivore",
        excluded_food_categories: Optional[List[str]] = None,
    ) -> List[GroundedPakistaniFood]:
        """
        Filters the Pakistani food catalog against deterministic patient safety constraints.
        """
        all_foods = cls.load_catalog()
        excluded_categories = set(excluded_food_categories or [])
        user_allergens = set([a.strip().lower() for a in (allergens or []) + (intolerances or []) if a])
        diet_pref = str(dietary_preference or "omnivore").strip().lower()

        # Build set of prohibited allergen columns
        prohibit_dairy = any(a in user_allergens for a in ("dairy", "milk", "lactose", "cheese", "paneer")) or "dairy" in excluded_categories
        prohibit_egg = any(a in user_allergens for a in ("egg", "eggs")) or "eggs" in excluded_categories
        prohibit_fish = any(a in user_allergens for a in ("fish", "seafood", "shellfish")) or "seafood" in excluded_categories
        prohibit_wheat = any(a in user_allergens for a in ("wheat", "gluten", "atta")) or "gluten" in excluded_categories
        prohibit_nuts = any(a in user_allergens for a in ("nuts", "peanuts", "tree_nuts")) or "nuts" in excluded_categories

        # Dietary preference constraints
        is_vegetarian = diet_pref in ("vegetarian", "vegan", "lacto_vegetarian")
        is_vegan = diet_pref == "vegan"
        is_pescatarian = diet_pref == "pescatarian"
        prohibit_red_meat = "red_meat" in excluded_categories

        eligible: List[GroundedPakistaniFood] = []

        for food in all_foods:
            # 1. Allergen checks
            if prohibit_dairy and food.contains_dairy:
                continue
            if prohibit_egg and food.contains_egg:
                continue
            if prohibit_fish and food.contains_fish:
                continue
            if prohibit_wheat and food.contains_wheat:
                continue
            if prohibit_nuts and food.contains_nuts:
                continue

            # 2. Dietary preference checks
            if is_vegan:
                if food.contains_meat or food.contains_fish or food.contains_egg or food.contains_dairy:
                    continue
            elif is_vegetarian:
                if food.contains_meat or food.contains_fish:
                    continue
            elif is_pescatarian:
                if food.contains_meat and not food.contains_fish:
                    continue

            # 3. Red meat exclusion check (Beef/Mutton)
            if prohibit_red_meat and food.contains_meat:
                name_l = food.entity_name_en.lower()
                if any(m in name_l for m in ("beef", "mutton", "gosht", "nihari", "korma")):
                    continue

            # 4. Refined simple sugars check (Halwa, Zarda, Kheer)
            if "refined_simple_sugars" in excluded_categories:
                if food.category.lower().startswith("dessert"):
                    continue

            eligible.append(food)

        return eligible

    @classmethod
    def _get_core_fallback_catalog(cls) -> List[GroundedPakistaniFood]:
        """Provides verified fallback list of canonical Pakistani dishes if CSV is inaccessible."""
        return [
            GroundedPakistaniFood("PK_DISH_001", "Chapati", "Gandum ki Roti", "Cereal Staple", "staple,breakfast,lunch,dinner", "plant_based", False, False, False, False, True, False, 282.0, 9.7, 2.0, 54.7, 1.0),
            GroundedPakistaniFood("PK_DISH_002", "Daal Masoor", "Masoor Daal Salan", "Pulse/Legume Curry", "lunch,dinner", "plant_based", False, False, False, False, False, False, 96.0, 5.2, 2.5, 12.6, 1.0),
            GroundedPakistaniFood("PK_DISH_003", "Alu Gosht", "Aloo Gosht", "Meat & Vegetable Curry", "lunch,dinner", "contains_meat", False, False, False, True, False, False, 120.0, 7.0, 4.0, 13.0, 2.0),
            GroundedPakistaniFood("PK_DISH_004", "Kalool / Lobia", "Kalool / Lobia Curry", "Pulse/Legume Curry", "lunch,dinner", "plant_based", False, False, False, False, False, False, 162.0, 11.7, 1.5, 24.3, 2.5),
            GroundedPakistaniFood("PK_DISH_007", "Shami Kabab", "Shami Kabab", "Meat Patties / Kabab", "lunch,dinner,snack", "contains_meat", False, True, False, True, False, False, 137.0, 10.2, 3.0, 16.3, 0.0),
            GroundedPakistaniFood("PK_DISH_009", "Chicken Curry", "Murgh Salan", "Poultry Dish", "lunch,dinner", "contains_meat", False, False, False, True, False, False, 167.0, 9.8, 8.5, 11.7, 0.0),
            GroundedPakistaniFood("PK_DISH_011", "Machli (Fish)", "Tali Hui Machli", "Fish Preparation", "lunch,dinner", "contains_fish", False, False, True, False, False, False, 237.0, 23.7, 14.2, 1.8, 0.3),
            GroundedPakistaniFood("PK_DISH_023", "Bhindi Masala", "Bhindi", "Vegetable Curry / Bhujia", "lunch,dinner", "plant_based", False, False, False, False, False, False, 158.0, 1.2, 11.6, 12.2, 2.0),
            GroundedPakistaniFood("PK_DISH_026", "Choley (Chana Masala)", "Chana Masala", "Pulse/Legume Curry", "breakfast,lunch,dinner", "plant_based", False, False, False, False, False, False, 182.5, 4.2, 9.9, 19.3, 3.0),
            GroundedPakistaniFood("PK_DISH_027", "Daal Lauki (Kadu)", "Dal Lauki", "Vegetable & Pulse Dish", "lunch,dinner", "plant_based", False, False, False, False, False, False, 182.5, 2.3, 13.1, 13.8, 2.0),
            GroundedPakistaniFood("PK_PORTION_002", "Boiled Basmati Rice", "Ublay Chawal", "Cereal Staple", "staple,lunch,dinner", "plant_based", False, False, False, False, False, False, 130.0, 2.7, 0.3, 28.2, 0.4),
        ]

"""
backend/apps/health/nutrition_vocabularies.py

Centralized nutrition normalization, canonical vocabularies, and ingredient definitions
for BioPulse AI.

Responsibilities:
1. Canonical Food Allergen vocabulary and synonym normalizer.
2. Distinct Intolerance vocabulary (treating gluten/lactose as intolerances/restrictions, not classic IgE allergens).
3. Canonical Dietary Pattern vocabulary with strict deterministic filtering.
4. Non-food allergy whitelist filtering (prevents Penicillin, Latex, Pollen from blocking meals).
5. Canonical Ingredient Registry with allergen and dietary tags.
6. Validation utilities for planning boundaries (budget, cooking effort, meals per day).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple


# ==============================================================================
# 1. CANONICAL ALLERGENS (Food Only)
# ==============================================================================

class CanonicalAllergen(str, Enum):
    """
    Standard top food allergens recognized in BioPulse.
    Gluten is intentionally modeled under CanonicalIntolerance rather than as a primary food allergen.
    """
    PEANUT = "peanut"
    TREE_NUT = "tree_nut"
    MILK = "milk"
    EGG = "egg"
    WHEAT = "wheat"
    SOY = "soy"
    FISH = "fish"
    SHELLFISH = "shellfish"
    SESAME = "sesame"


ALLERGEN_DISPLAY_LABELS: Dict[CanonicalAllergen, str] = {
    CanonicalAllergen.PEANUT: "Peanuts",
    CanonicalAllergen.TREE_NUT: "Tree Nuts (Almonds, Walnuts, Cashews)",
    CanonicalAllergen.MILK: "Milk & Dairy",
    CanonicalAllergen.EGG: "Eggs",
    CanonicalAllergen.WHEAT: "Wheat",
    CanonicalAllergen.SOY: "Soy / Soya",
    CanonicalAllergen.FISH: "Fish",
    CanonicalAllergen.SHELLFISH: "Shellfish (Shrimp, Prawn, Crab)",
    CanonicalAllergen.SESAME: "Sesame (Til)",
}

# Synonyms and localized terms mapped strictly to canonical food allergens
_ALLERGEN_SYNONYMS: Dict[str, CanonicalAllergen] = {
    # Peanut
    "peanut": CanonicalAllergen.PEANUT,
    "peanuts": CanonicalAllergen.PEANUT,
    "groundnut": CanonicalAllergen.PEANUT,
    "groundnuts": CanonicalAllergen.PEANUT,
    "mungfali": CanonicalAllergen.PEANUT,
    "moongfali": CanonicalAllergen.PEANUT,
    "peanut butter": CanonicalAllergen.PEANUT,
    # Tree Nut
    "tree nut": CanonicalAllergen.TREE_NUT,
    "tree nuts": CanonicalAllergen.TREE_NUT,
    "tree_nut": CanonicalAllergen.TREE_NUT,
    "tree_nuts": CanonicalAllergen.TREE_NUT,
    "nut": CanonicalAllergen.TREE_NUT,
    "nuts": CanonicalAllergen.TREE_NUT,
    "almond": CanonicalAllergen.TREE_NUT,
    "almonds": CanonicalAllergen.TREE_NUT,
    "badam": CanonicalAllergen.TREE_NUT,
    "walnut": CanonicalAllergen.TREE_NUT,
    "walnuts": CanonicalAllergen.TREE_NUT,
    "akhrot": CanonicalAllergen.TREE_NUT,
    "cashew": CanonicalAllergen.TREE_NUT,
    "cashews": CanonicalAllergen.TREE_NUT,
    "kaju": CanonicalAllergen.TREE_NUT,
    "pistachio": CanonicalAllergen.TREE_NUT,
    "pistachios": CanonicalAllergen.TREE_NUT,
    "pista": CanonicalAllergen.TREE_NUT,
    "hazelnut": CanonicalAllergen.TREE_NUT,
    "hazelnuts": CanonicalAllergen.TREE_NUT,
    "pecan": CanonicalAllergen.TREE_NUT,
    "pecans": CanonicalAllergen.TREE_NUT,
    "brazil nut": CanonicalAllergen.TREE_NUT,
    "macadamia": CanonicalAllergen.TREE_NUT,
    # Milk / Dairy
    "milk": CanonicalAllergen.MILK,
    "cow milk": CanonicalAllergen.MILK,
    "cow's milk": CanonicalAllergen.MILK,
    "buffalo milk": CanonicalAllergen.MILK,
    "dairy": CanonicalAllergen.MILK,
    "dairy / lactose": CanonicalAllergen.MILK,
    "dahi": CanonicalAllergen.MILK,
    "curd": CanonicalAllergen.MILK,
    "yogurt": CanonicalAllergen.MILK,
    "yoghurt": CanonicalAllergen.MILK,
    "cheese": CanonicalAllergen.MILK,
    "paneer": CanonicalAllergen.MILK,
    "butter": CanonicalAllergen.MILK,
    "makhan": CanonicalAllergen.MILK,
    "ghee": CanonicalAllergen.MILK,
    "desi ghee": CanonicalAllergen.MILK,
    "cream": CanonicalAllergen.MILK,
    "malai": CanonicalAllergen.MILK,
    "lassi": CanonicalAllergen.MILK,
    # Egg
    "egg": CanonicalAllergen.EGG,
    "eggs": CanonicalAllergen.EGG,
    "anda": CanonicalAllergen.EGG,
    "anday": CanonicalAllergen.EGG,
    "egg white": CanonicalAllergen.EGG,
    "egg yolk": CanonicalAllergen.EGG,
    # Wheat
    "wheat": CanonicalAllergen.WHEAT,
    "atta": CanonicalAllergen.WHEAT,
    "gehun": CanonicalAllergen.WHEAT,
    "gandum": CanonicalAllergen.WHEAT,
    "maida": CanonicalAllergen.WHEAT,
    "semolina": CanonicalAllergen.WHEAT,
    "suji": CanonicalAllergen.WHEAT,
    "whole wheat": CanonicalAllergen.WHEAT,
    # Soy
    "soy": CanonicalAllergen.SOY,
    "soya": CanonicalAllergen.SOY,
    "soybean": CanonicalAllergen.SOY,
    "soybeans": CanonicalAllergen.SOY,
    "soya chunks": CanonicalAllergen.SOY,
    "tofu": CanonicalAllergen.SOY,
    "edamame": CanonicalAllergen.SOY,
    "soy sauce": CanonicalAllergen.SOY,
    # Fish
    "fish": CanonicalAllergen.FISH,
    "machli": CanonicalAllergen.FISH,
    "machhli": CanonicalAllergen.FISH,
    "salmon": CanonicalAllergen.FISH,
    "rohu": CanonicalAllergen.FISH,
    "tuna": CanonicalAllergen.FISH,
    "trout": CanonicalAllergen.FISH,
    "pomfret": CanonicalAllergen.FISH,
    "cod": CanonicalAllergen.FISH,
    # Shellfish
    "shellfish": CanonicalAllergen.SHELLFISH,
    "shell fish": CanonicalAllergen.SHELLFISH,
    "shrimp": CanonicalAllergen.SHELLFISH,
    "shrimps": CanonicalAllergen.SHELLFISH,
    "jhinga": CanonicalAllergen.SHELLFISH,
    "prawn": CanonicalAllergen.SHELLFISH,
    "prawns": CanonicalAllergen.SHELLFISH,
    "crab": CanonicalAllergen.SHELLFISH,
    "crabs": CanonicalAllergen.SHELLFISH,
    "lobster": CanonicalAllergen.SHELLFISH,
    "crayfish": CanonicalAllergen.SHELLFISH,
    "oyster": CanonicalAllergen.SHELLFISH,
    "clam": CanonicalAllergen.SHELLFISH,
    "mussel": CanonicalAllergen.SHELLFISH,
    # Sesame
    "sesame": CanonicalAllergen.SESAME,
    "sesame seed": CanonicalAllergen.SESAME,
    "sesame seeds": CanonicalAllergen.SESAME,
    "til": CanonicalAllergen.SESAME,
    "tahini": CanonicalAllergen.SESAME,
}


# ==============================================================================
# 2. CANONICAL INTOLERANCES & NON-ALLERGIC RESTRICTIONS
# ==============================================================================

class CanonicalIntolerance(str, Enum):
    """
    Intolerances and non-IgE dietary sensitivities.
    Gluten is normalized here to preserve clinical distinction from wheat IgE allergy.
    """
    GLUTEN = "gluten"
    LACTOSE = "lactose"
    FRUCTOSE = "fructose"
    HISTAMINE = "histamine"


INTOLERANCE_DISPLAY_LABELS: Dict[CanonicalIntolerance, str] = {
    CanonicalIntolerance.GLUTEN: "Gluten (Non-Celiac Sensitivity / Celiac)",
    CanonicalIntolerance.LACTOSE: "Lactose Intolerance",
    CanonicalIntolerance.FRUCTOSE: "Fructose Malabsorption",
    CanonicalIntolerance.HISTAMINE: "Histamine Sensitivity",
}

_INTOLERANCE_SYNONYMS: Dict[str, CanonicalIntolerance] = {
    "gluten": CanonicalIntolerance.GLUTEN,
    "gluten-free": CanonicalIntolerance.GLUTEN,
    "gluten free": CanonicalIntolerance.GLUTEN,
    "celiac": CanonicalIntolerance.GLUTEN,
    "coeliac": CanonicalIntolerance.GLUTEN,
    "gluten sensitivity": CanonicalIntolerance.GLUTEN,
    "lactose": CanonicalIntolerance.LACTOSE,
    "lactose intolerance": CanonicalIntolerance.LACTOSE,
    "lactose intolerant": CanonicalIntolerance.LACTOSE,
    "lactose sensitive": CanonicalIntolerance.LACTOSE,
    "fructose": CanonicalIntolerance.FRUCTOSE,
    "histamine": CanonicalIntolerance.HISTAMINE,
}


# ==============================================================================
# 3. NON-FOOD ALLERGIES (Safely ignored by nutrition planning)
# ==============================================================================

KNOWN_NON_FOOD_ALLERGENS: Set[str] = {
    "penicillin",
    "sulfa",
    "sulfa drugs",
    "sulfonamides",
    "antibiotics",
    "latex",
    "pollen",
    "dust",
    "dust mites",
    "cat hair",
    "dog hair",
    "animal dander",
    "mold",
    "mould",
    "aspirin",
    "ibuprofen",
    "nsaids",
    "nickel",
}


# ==============================================================================
# 4. CANONICAL DIETARY PATTERNS
# ==============================================================================

class DietaryPattern(str, Enum):
    """Supported structured dietary patterns."""
    OMNIVORE = "omnivore"
    HALAL_OMNIVORE = "halal_omnivore"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    PESCATARIAN = "pescatarian"


DIETARY_DISPLAY_LABELS: Dict[DietaryPattern, str] = {
    DietaryPattern.OMNIVORE: "Omnivore (Standard / Unrestricted)",
    DietaryPattern.HALAL_OMNIVORE: "Halal Omnivore (Meat, Poultry, Fish & Vegetables)",
    DietaryPattern.VEGETARIAN: "Vegetarian (Plant foods with dairy & eggs)",
    DietaryPattern.VEGAN: "Vegan (100% Plant-based)",
    DietaryPattern.PESCATARIAN: "Pescatarian (Fish, Seafood & Plant foods)",
}

_DIETARY_PATTERN_SYNONYMS: Dict[str, DietaryPattern] = {
    "omnivore": DietaryPattern.OMNIVORE,
    "standard": DietaryPattern.OMNIVORE,
    "balanced": DietaryPattern.OMNIVORE,
    "traditional": DietaryPattern.OMNIVORE,
    "regular": DietaryPattern.OMNIVORE,
    "unrestricted": DietaryPattern.OMNIVORE,
    # Halal Omnivore
    "halal_omnivore": DietaryPattern.HALAL_OMNIVORE,
    "non-vegetarian / halal": DietaryPattern.HALAL_OMNIVORE,
    "non-vegetarian/halal": DietaryPattern.HALAL_OMNIVORE,
    "non_vegetarian_halal": DietaryPattern.HALAL_OMNIVORE,
    "non-vegetarian": DietaryPattern.HALAL_OMNIVORE,
    "non_vegetarian": DietaryPattern.HALAL_OMNIVORE,
    "non-veg": DietaryPattern.HALAL_OMNIVORE,
    "non_veg": DietaryPattern.HALAL_OMNIVORE,
    "halal": DietaryPattern.HALAL_OMNIVORE,
    # Vegetarian
    "vegetarian": DietaryPattern.VEGETARIAN,
    "lacto_vegetarian": DietaryPattern.VEGETARIAN,
    "lacto-vegetarian": DietaryPattern.VEGETARIAN,
    "ovo_lacto_vegetarian": DietaryPattern.VEGETARIAN,
    "ovo-lacto-vegetarian": DietaryPattern.VEGETARIAN,
    "veg": DietaryPattern.VEGETARIAN,
    # Vegan
    "vegan": DietaryPattern.VEGAN,
    "100% plant-based": DietaryPattern.VEGAN,
    "plant-based": DietaryPattern.VEGAN,
    "plant_based": DietaryPattern.VEGAN,
    # Pescatarian
    "pescatarian": DietaryPattern.PESCATARIAN,
    "pescetarian": DietaryPattern.PESCATARIAN,
}


def build_dietary_compatibility_map(
    known_contains_meat: Optional[bool] = None,
    known_contains_fish: Optional[bool] = None,
    known_contains_dairy: Optional[bool] = None,
    known_contains_egg: Optional[bool] = None,
    is_halal: Optional[bool] = True,
) -> Dict[str, str]:
    """
    Deterministically computes dietary compatibility for an entity.
    Returns a dict mapping dietary pattern names to 'COMPATIBLE', 'INCOMPATIBLE', or 'UNKNOWN'.

    Rules:
    - vegetarian:
      * meat or fish PRESENT -> INCOMPATIBLE
      * meat and fish ABSENT -> COMPATIBLE
      * otherwise -> UNKNOWN
    - vegan:
      * meat, fish, dairy, or egg PRESENT -> INCOMPATIBLE
      * meat, fish, dairy, and egg ABSENT -> COMPATIBLE
      * otherwise -> UNKNOWN
    - pescatarian:
      * meat PRESENT -> INCOMPATIBLE
      * meat ABSENT -> COMPATIBLE
      * otherwise -> UNKNOWN
    - halal_omnivore / halal:
      * is_halal is True -> COMPATIBLE
      * is_halal is False -> INCOMPATIBLE
      * otherwise -> UNKNOWN
    - omnivore:
      * COMPATIBLE
    """
    res: Dict[str, str] = {
        "omnivore": "COMPATIBLE",
        "standard": "COMPATIBLE",
    }

    # Halal Omnivore
    if is_halal is True:
        res["halal_omnivore"] = "COMPATIBLE"
        res["halal"] = "COMPATIBLE"
    elif is_halal is False:
        res["halal_omnivore"] = "INCOMPATIBLE"
        res["halal"] = "INCOMPATIBLE"
    else:
        res["halal_omnivore"] = "UNKNOWN"
        res["halal"] = "UNKNOWN"

    # Vegetarian (no meat, no fish)
    if known_contains_meat is True or known_contains_fish is True:
        res["vegetarian"] = "INCOMPATIBLE"
        res["ovo_lacto_vegetarian"] = "INCOMPATIBLE"
        res["lacto_vegetarian"] = "INCOMPATIBLE"
    elif known_contains_meat is False and known_contains_fish is False:
        res["vegetarian"] = "COMPATIBLE"
        res["ovo_lacto_vegetarian"] = "COMPATIBLE"
        if known_contains_egg is False:
            res["lacto_vegetarian"] = "COMPATIBLE"
        elif known_contains_egg is True:
            res["lacto_vegetarian"] = "INCOMPATIBLE"
        else:
            res["lacto_vegetarian"] = "UNKNOWN"
    else:
        res["vegetarian"] = "UNKNOWN"
        res["ovo_lacto_vegetarian"] = "UNKNOWN"
        res["lacto_vegetarian"] = "UNKNOWN"

    # Vegan (no meat, no fish, no dairy, no egg)
    if (
        known_contains_meat is True
        or known_contains_fish is True
        or known_contains_dairy is True
        or known_contains_egg is True
    ):
        res["vegan"] = "INCOMPATIBLE"
    elif (
        known_contains_meat is False
        and known_contains_fish is False
        and known_contains_dairy is False
        and known_contains_egg is False
    ):
        res["vegan"] = "COMPATIBLE"
    else:
        res["vegan"] = "UNKNOWN"

    # Pescatarian (no meat; fish allowed)
    if known_contains_meat is True:
        res["pescatarian"] = "INCOMPATIBLE"
    elif known_contains_meat is False:
        res["pescatarian"] = "COMPATIBLE"
    else:
        res["pescatarian"] = "UNKNOWN"

    return res


# ==============================================================================
# 5. NORMALIZATION FUNCTIONS
# ==============================================================================

def _clean_string(val: Any) -> str:
    if val is None:
        return ""
    return re.sub(r"\s+", " ", str(val).strip().lower())


def is_known_non_food_allergen(text: str) -> bool:
    """Returns True if the term is a recognized non-food medical/environmental allergy."""
    clean = _clean_string(text)
    return clean in KNOWN_NON_FOOD_ALLERGENS


def normalize_food_allergens(
    raw_inputs: Sequence[str] | str | None,
) -> Tuple[List[str], List[str], List[str]]:
    """
    Normalizes a list or comma-separated string of allergy entries.

    Returns:
        (canonical_allergens, non_food_allergies, unmapped_items)
    - canonical_allergens: sorted unique list of CanonicalAllergen values.
    - non_food_allergies: detected non-food items (e.g. Penicillin, Latex) that must not block nutrition.
    - unmapped_items: items that are neither recognized food allergens nor known non-food allergens.
    """
    if raw_inputs is None:
        return [], [], []

    items: List[str] = []
    if isinstance(raw_inputs, str):
        cleaned = raw_inputs.strip()
        if cleaned.startswith("[") and cleaned.endswith("]"):
            # Strip brackets if passed as stringified JSON representation
            cleaned = cleaned[1:-1]
        items = [p.strip().strip("'\"") for p in cleaned.split(",") if p.strip()]
    else:
        for x in raw_inputs:
            if x is not None:
                items.append(str(x).strip())

    canonical: Set[str] = set()
    non_food: Set[str] = set()
    unmapped: Set[str] = set()

    for raw in items:
        clean = _clean_string(raw)
        if not clean or clean in ("none", "no allergies", "no known allergies", "[]"):
            continue

        if clean in _ALLERGEN_SYNONYMS:
            canonical.add(_ALLERGEN_SYNONYMS[clean].value)
        elif clean in _INTOLERANCE_SYNONYMS:
            # Intolerance entered in allergy box: if wheat-derived, do not auto-map to wheat allergy
            unmapped.add(raw)
        elif clean in KNOWN_NON_FOOD_ALLERGENS:
            non_food.add(raw)
        else:
            unmapped.add(raw)

    return sorted(canonical), sorted(non_food), sorted(unmapped)


def filter_legacy_allergies_for_backfill(
    legacy_allergies: Sequence[str] | None,
    existing_food_allergies: Sequence[str] | None = None,
) -> List[str]:
    """
    Idempotently extracts canonical food allergies from legacy medical allergy list.
    Non-food allergies (Penicillin, Sulfa, Latex, Pollen) are strictly ignored.
    Any existing food allergies are preserved without duplicates.
    """
    if not legacy_allergies:
        return sorted(list(set(existing_food_allergies or [])))

    canonical, _, _ = normalize_food_allergens(legacy_allergies)
    existing_set = set(existing_food_allergies or [])
    combined = existing_set.union(canonical)
    return sorted(list(combined))


def normalize_food_intolerances(
    raw_inputs: Sequence[str] | str | None,
) -> Tuple[List[str], List[str]]:
    """
    Normalizes a list or string of food intolerance entries.
    Returns: (canonical_intolerances, unmapped_items)
    """
    if raw_inputs is None:
        return [], []

    items: List[str] = []
    if isinstance(raw_inputs, str):
        items = [p.strip().strip("'\"") for p in raw_inputs.split(",") if p.strip()]
    else:
        items = [str(x).strip() for x in raw_inputs if x is not None]

    canonical: Set[str] = set()
    unmapped: Set[str] = set()

    for raw in items:
        clean = _clean_string(raw)
        if not clean or clean in ("none", "no intolerances", "[]"):
            continue

        if clean in _INTOLERANCE_SYNONYMS:
            canonical.add(_INTOLERANCE_SYNONYMS[clean].value)
        else:
            unmapped.add(raw)

    return sorted(canonical), sorted(unmapped)


def normalize_dietary_pattern(raw_input: Any) -> Optional[DietaryPattern]:
    """
    Normalizes raw dietary preference into Canonical DietaryPattern.
    Returns None if unknown/unsupported (never silently defaults to omnivore).
    """
    if raw_input is None:
        return None
    clean = _clean_string(raw_input).replace("-", "_")
    return _DIETARY_PATTERN_SYNONYMS.get(clean) or _DIETARY_PATTERN_SYNONYMS.get(_clean_string(raw_input))


def normalize_ingredient_name(raw_name: str) -> str:
    """Normalizes free-text ingredient string into canonical lookup key."""
    clean = _clean_string(raw_name)
    clean = re.sub(r"\(.*?\)", "", clean).strip()  # remove parentheses
    return clean


# ==============================================================================
# 6. STRUCTURED INGREDIENT REGISTRY
# ==============================================================================

@dataclass(frozen=True)
class IngredientDefinition:
    """Normalized structured representation of a food ingredient."""
    ingredient_id: str
    display_name: str
    category: str  # e.g. grain, poultry, meat, fish, legume, dairy, vegetable, fruit, seed
    allergen_tags: List[str] = field(default_factory=list)  # values from CanonicalAllergen
    dietary_tags: List[str] = field(default_factory=list)   # omnivore, halal_omnivore, vegetarian, vegan, pescatarian
    intolerance_tags: List[str] = field(default_factory=list)  # values from CanonicalIntolerance


# Core ingredient registry covering the BioPulse Pakistani meal catalog
INGREDIENT_REGISTRY: Dict[str, IngredientDefinition] = {
    # Staples & Grains
    "ING_WHEAT_ATTA": IngredientDefinition(
        ingredient_id="ING_WHEAT_ATTA",
        display_name="Whole Wheat Flour (Atta)",
        category="grain",
        allergen_tags=[CanonicalAllergen.WHEAT.value],
        intolerance_tags=[CanonicalIntolerance.GLUTEN.value],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_BASMATI_RICE": IngredientDefinition(
        ingredient_id="ING_BASMATI_RICE",
        display_name="Basmati Rice",
        category="grain",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_BESAN": IngredientDefinition(
        ingredient_id="ING_BESAN",
        display_name="Gram Flour (Besan)",
        category="legume",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    # Dairy & Eggs
    "ING_EGG": IngredientDefinition(
        ingredient_id="ING_EGG",
        display_name="Chicken Egg",
        category="egg",
        allergen_tags=[CanonicalAllergen.EGG.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "pescatarian"],
    ),
    "ING_DAHI": IngredientDefinition(
        ingredient_id="ING_DAHI",
        display_name="Curd / Yogurt (Dahi)",
        category="dairy",
        allergen_tags=[CanonicalAllergen.MILK.value],
        intolerance_tags=[CanonicalIntolerance.LACTOSE.value],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "pescatarian"],
    ),
    "ING_MILK": IngredientDefinition(
        ingredient_id="ING_MILK",
        display_name="Whole Buffalo / Cow Milk",
        category="dairy",
        allergen_tags=[CanonicalAllergen.MILK.value],
        intolerance_tags=[CanonicalIntolerance.LACTOSE.value],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "pescatarian"],
    ),
    "ING_PANEER": IngredientDefinition(
        ingredient_id="ING_PANEER",
        display_name="Cottage Cheese (Paneer)",
        category="dairy",
        allergen_tags=[CanonicalAllergen.MILK.value],
        intolerance_tags=[CanonicalIntolerance.LACTOSE.value],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "pescatarian"],
    ),
    # Poultry, Meat & Seafood
    "ING_CHICKEN": IngredientDefinition(
        ingredient_id="ING_CHICKEN",
        display_name="Chicken (Murgh)",
        category="poultry",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore"],
    ),
    "ING_BEEF": IngredientDefinition(
        ingredient_id="ING_BEEF",
        display_name="Beef (Gosht)",
        category="meat",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore"],
    ),
    "ING_MUTTON": IngredientDefinition(
        ingredient_id="ING_MUTTON",
        display_name="Mutton / Lamb",
        category="meat",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore"],
    ),
    "ING_FISH": IngredientDefinition(
        ingredient_id="ING_FISH",
        display_name="Fish (Rohu / Machli)",
        category="fish",
        allergen_tags=[CanonicalAllergen.FISH.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "pescatarian"],
    ),
    "ING_SHRIMP": IngredientDefinition(
        ingredient_id="ING_SHRIMP",
        display_name="Shrimp / Prawns (Jhinga)",
        category="shellfish",
        allergen_tags=[CanonicalAllergen.SHELLFISH.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "pescatarian"],
    ),
    # Legumes & Pulses
    "ING_CHICKPEA": IngredientDefinition(
        ingredient_id="ING_CHICKPEA",
        display_name="Cooked Chickpeas (Channa)",
        category="legume",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_LOBIA": IngredientDefinition(
        ingredient_id="ING_LOBIA",
        display_name="Cooked Broad Beans (Lobia)",
        category="legume",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_MASOOR_DAAL": IngredientDefinition(
        ingredient_id="ING_MASOOR_DAAL",
        display_name="Red Lentil Daal (Masur)",
        category="legume",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_MOONG_DAAL": IngredientDefinition(
        ingredient_id="ING_MOONG_DAAL",
        display_name="Yellow Split Moong Daal",
        category="legume",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    # Nuts & Seeds
    "ING_ALMOND": IngredientDefinition(
        ingredient_id="ING_ALMOND",
        display_name="Almonds (Badam)",
        category="tree_nut",
        allergen_tags=[CanonicalAllergen.TREE_NUT.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_WALNUT": IngredientDefinition(
        ingredient_id="ING_WALNUT",
        display_name="Walnuts (Akhrot)",
        category="tree_nut",
        allergen_tags=[CanonicalAllergen.TREE_NUT.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_PEANUT": IngredientDefinition(
        ingredient_id="ING_PEANUT",
        display_name="Peanuts (Mungfali)",
        category="peanut",
        allergen_tags=[CanonicalAllergen.PEANUT.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_SESAME": IngredientDefinition(
        ingredient_id="ING_SESAME",
        display_name="Sesame Seeds (Til)",
        category="seed",
        allergen_tags=[CanonicalAllergen.SESAME.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_SOY": IngredientDefinition(
        ingredient_id="ING_SOY",
        display_name="Soy / Soya Chunks",
        category="soy",
        allergen_tags=[CanonicalAllergen.SOY.value],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    # Vegetables & Fruits
    "ING_SPINACH": IngredientDefinition(
        ingredient_id="ING_SPINACH",
        display_name="Spinach (Palak)",
        category="vegetable",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_OKRA": IngredientDefinition(
        ingredient_id="ING_OKRA",
        display_name="Okra (Bhindi)",
        category="vegetable",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_CUCUMBER": IngredientDefinition(
        ingredient_id="ING_CUCUMBER",
        display_name="Cucumber (Khira)",
        category="vegetable",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_TOMATO": IngredientDefinition(
        ingredient_id="ING_TOMATO",
        display_name="Tomato (Tamatar)",
        category="vegetable",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_APPLE": IngredientDefinition(
        ingredient_id="ING_APPLE",
        display_name="Fresh Apple (Seb)",
        category="fruit",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
    "ING_GUAVA": IngredientDefinition(
        ingredient_id="ING_GUAVA",
        display_name="Fresh Guava (Amrud)",
        category="fruit",
        allergen_tags=[],
        intolerance_tags=[],
        dietary_tags=["omnivore", "halal_omnivore", "vegetarian", "vegan", "pescatarian"],
    ),
}


# ==============================================================================
# 7. PLANNING SETTINGS VALIDATORS
# ==============================================================================

VALID_BUDGET_TIERS: Set[str] = {"low", "medium", "flexible"}
VALID_COOKING_TIME_PREFERENCES: Set[str] = {"quick", "moderate", "flexible"}
VALID_MEALS_PER_DAY_RANGE: Tuple[int, int] = (3, 5)


def validate_budget_tier(val: Any) -> str:
    clean = _clean_string(val)
    if clean in VALID_BUDGET_TIERS:
        return clean
    return "medium"


def validate_cooking_time_preference(val: Any) -> str:
    clean = _clean_string(val)
    if clean in VALID_COOKING_TIME_PREFERENCES:
        return clean
    return "moderate"


def validate_meals_per_day(val: Any) -> int:
    try:
        n = int(val)
        if VALID_MEALS_PER_DAY_RANGE[0] <= n <= VALID_MEALS_PER_DAY_RANGE[1]:
            return n
    except (TypeError, ValueError):
        pass
    return 4

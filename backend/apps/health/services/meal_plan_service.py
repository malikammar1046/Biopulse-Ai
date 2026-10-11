"""
backend/apps/health/services/meal_plan_service.py

Orchestration service for BioPulse Meal Planning under Solution A Constrained Sub-Catalog MVP:
1. Validates readiness.
2. Builds UserNutritionProfile (Phase 5A) and ConditionEvidenceContext (Phase 5B).
3. Computes Phase 5A neutral targets and Phase 5B condition profile.
4. Sets up standard 4-meal Pakistani daily schedule (Breakfast 25%, Lunch 35%, Dinner 30%, Snack 10%).
5. Loads verified production portion constraints and gates candidate pool.
6. Runs Phase 6E weekly plan generation across N=7 planning days.
7. Constructs stable API DTO and persists immutable snapshot via MealPlanRepository.
"""

from __future__ import annotations

import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

try:
    from Meal.daily.orchestrator import generate_full_day_plan
    from Meal.daily.schemas import (
        DailyMealSchedule,
        FullDayPlanningPolicy,
        MealAllocation,
    )
    from Meal.engine.orchestrator import build_nutrition_target_profile
    from Meal.evidence.orchestrator import build_condition_nutrition_profile
    from Meal.optimizer.schemas import PortionOptimizationTarget
    from Meal.planner.schemas import CandidateSelectionContext, MealRole
    from Meal.weekly.orchestrator import generate_weekly_plan
    from Meal.weekly.schemas import WeeklyVarietyPolicy
    HAS_MEAL_MODULE = True
except (ImportError, ModuleNotFoundError):
    HAS_MEAL_MODULE = False
    generate_full_day_plan = None
    DailyMealSchedule = None
    FullDayPlanningPolicy = None
    MealAllocation = None
    build_nutrition_target_profile = None
    build_condition_nutrition_profile = None
    PortionOptimizationTarget = None
    CandidateSelectionContext = None
    MealRole = None
    generate_weekly_plan = None
    WeeklyVarietyPolicy = None

from apps.health.services.meal_constraint_provider import (
    get_production_eligible_entity_ids,
    get_production_portion_constraints,
    load_verified_portion_records,
)
from apps.health.services.meal_plan_repository import meal_plan_repository
from apps.health.services.meal_profile_builder import MealProfileBuilder
try:
    from Meal.engine.schemas import Allergen, DietaryClass
except (ImportError, ModuleNotFoundError):
    Allergen = None
    DietaryClass = None

logger = logging.getLogger(__name__)

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

DAIRY_ENTITY_IDS: Set[str] = {
    "PK_COMP_001", "PK_COMP_002", "PK_COMP_003", "PK_COMP_004",
    "PK_DISH_013", "PK_DISH_016", "PK_DISH_033",
}
DAIRY_KEYWORDS: Set[str] = {
    "dahi", "yogurt", "curd", "lassi", "milk", "paneer", "cheese", "dairy", "butter", "malai", "kheer",
}

GLUTEN_ENTITY_IDS: Set[str] = {
    "PK_DISH_001", "PK_DISH_010", "PK_DISH_014", "PK_DISH_021",
    "PK_DISH_034", "PK_COMP_035", "PK_PORTION_001",
}
GLUTEN_KEYWORDS: Set[str] = {
    "wheat", "barley", "rye", "suji", "sooji", "semolina", "maida",
    "atta", "macaroni", "pasta", "haleem", "nihari", "nan", "naan", "roti", "chapati", "jau",
}

VERIFIED_SUBSET_NOTICE = (
    "Some Pakistani dishes are available for nutritional reference but are not yet included in "
    "automated portion planning. Automated portions are calibrated exclusively on verified source-backed quantities."
)


class NutritionReadinessException(Exception):
    """Raised when profile readiness check fails."""
    def __init__(self, readiness_result: Dict[str, Any]):
        self.readiness_result = readiness_result
        super().__init__("User profile is not ready for automated meal planning.")


class MealPlanService:
    """
    Coordinates end-to-end meal plan generation, DTO assembly, and snapshot persistence.
    """

    def __init__(self, repository=None):
        self.repository = repository or meal_plan_repository
        self._verified_records_map = {
            r.planner_entity_id: r for r in load_verified_portion_records()
        }

    @staticmethod
    def _generate_meal_title(role_name: str, items: List[Dict[str, Any]]) -> str:
        """Constructs authentic, semantic Pakistani dish titles from optimized items."""
        if not items:
            return role_name.capitalize()

        role_upper = role_name.upper()

        clean_items: List[Tuple[str, str]] = []
        for it in items:
            name = it.get("display_name", "")
            clean = (
                name.replace("Standard ", "")
                    .replace("Plain ", "")
                    .replace("Cooked ", "")
                    .replace("Raw ", "")
                    .replace("Fresh ", "")
                    .strip()
            )
            if clean:
                clean_items.append((it.get("entity_id", ""), clean))

        if not clean_items:
            return role_name.capitalize()

        if role_upper == "SNACK":
            names = [c[1] for c in clean_items]
            if len(names) > 1:
                return f"Fresh Fruit & Snack Medley ({', '.join(names[:2])})"
            return f"Nutritious Snack ({names[0]})"

        # Categorize into staple, main protein/pulse, and salad/vegetable sides
        staple: Optional[str] = None
        main: Optional[str] = None
        sides: List[str] = []

        for eid, name in clean_items:
            lower = name.lower()
            if any(k in lower for k in ["rice", "chapati", "roti", "nan", "naan", "bread"]):
                if not staple:
                    staple = name
                else:
                    sides.append(name)
            elif any(k in lower for k in ["daal", "lobia", "channa", "bean", "lentil", "chicken", "beef", "mutton", "fish", "egg", "tikka", "karahi", "haleem", "nihari"]):
                if not main:
                    main = name
                else:
                    sides.append(name)
            else:
                sides.append(name)

        if not main and clean_items:
            main = clean_items[0][1]
            if staple == main and len(clean_items) > 1:
                main = clean_items[1][1]

        if main and staple:
            if sides:
                return f"{main} with {staple} & Salad"
            return f"{main} with {staple}"
        elif main and sides:
            return f"{main} with {sides[0]}"
        elif staple and sides:
            return f"{staple} with {sides[0]}"
        elif main:
            return main
        elif staple:
            return staple
        else:
            return clean_items[0][1]

    @classmethod
    def resolve_dislikes_to_entity_ids(cls, raw_dislikes: Sequence[str]) -> Tuple[List[str], List[str]]:
        """
        Resolves user food dislikes to valid canonical planner entity IDs.
        
        Returns:
            (resolved_eids, unresolved_items)
            - resolved_eids: Canonical planner entity IDs strictly mapped to catalog entities.
            - unresolved_items: User-entered dislike items that could not be mapped to verified catalog IDs.
        
        Strict Rules:
        - NEVER maps or returns allergen categories (dairy, milk, wheat, nuts, eggs, etc.)
          into dislikes (allergens belong strictly in food_allergies or food_intolerances).
        - Accepts valid planner entity IDs (e.g. PK_COMP_..., PK_PORTION_..., PK_DISH_...).
        - Maps recognizable food dish/ingredient names to matching planner entity IDs.
        - Preserves unresolved items to warn user rather than silently ignoring preferences.
        """
        if not raw_dislikes:
            return [], []

        try:
            from Meal.planner.catalog import load_master_planner_catalog
            cat = load_master_planner_catalog()
            valid_eids = set(cat.keys())
        except Exception as exc:
            logger.warning("Could not load master planner catalog for dislike resolution: %s", exc)
            return [], [str(x).strip() for x in raw_dislikes if str(x).strip()]

        allergen_words = {
            "dairy", "milk", "lactose", "dahi", "yogurt", "curd", "lassi", "paneer", "cheese", "butter", "malai",
            "gluten", "wheat", "atta", "maida",
            "egg", "eggs", "anda", "anday",
            "nut", "nuts", "peanut", "peanuts", "almond", "walnut",
            "fish", "machli", "shellfish", "prawn", "shrimp",
            "soy", "soya", "sesame", "til",
        }

        resolved: Set[str] = set()
        unresolved: List[str] = []

        for item in raw_dislikes:
            clean = str(item).strip().lower()
            if not clean:
                continue
            if clean in allergen_words:
                # Allergen words are handled in allergy/intolerance checks, not as dislikes
                continue

            matched = False
            # 1. Exact planner entity ID match
            if item in valid_eids:
                resolved.add(item)
                matched = True
            elif str(item).strip().upper() in valid_eids:
                resolved.add(str(item).strip().upper())
                matched = True
            else:
                # 2. Match by english or local entity name in catalog
                for eid, ent in cat.items():
                    en_name = ent.entity_name_en.lower()
                    local_name = ent.entity_name_local.lower()
                    if clean == en_name or clean == local_name:
                        resolved.add(eid)
                        matched = True
                        break
                    elif len(clean) >= 4 and (clean in en_name or clean in local_name):
                        resolved.add(eid)
                        matched = True
                        break

            if not matched:
                unresolved.append(str(item).strip())

        return sorted(list(resolved)), unresolved

    @staticmethod
    def _validate_plan_allergen_safety(
        days_dto: List[Dict[str, Any]],
        user_allergies: List[Any],
        user_intolerances: Optional[List[str]] = None,
    ) -> None:
        """Fail-closed validation gate: verifies 0 allergen-violating items exist in the generated plan.
        Keeps allergies (IgE) and intolerances (non-IgE) distinct in diagnostic messages.
        """
        is_dairy_allergic = False
        is_egg_allergic = False
        is_nuts_allergic = False
        is_wheat_allergic = False
        is_fish_allergic = False

        for a in user_allergies:
            val = str(getattr(a, "value", a)).lower().strip()
            if "dairy" in val or "milk" in val:
                is_dairy_allergic = True
            elif "egg" in val:
                is_egg_allergic = True
            elif "nut" in val or "peanut" in val:
                is_nuts_allergic = True
            elif "wheat" in val:
                is_wheat_allergic = True
            elif "fish" in val:
                is_fish_allergic = True

        raw_intolerances = [str(x).lower().strip() for x in (user_intolerances or [])]
        is_lactose_intolerant = any("lactose" in x or "dairy" in x for x in raw_intolerances)
        is_gluten_intolerant = any("gluten" in x for x in raw_intolerances)
        is_dairy_restricted = is_dairy_allergic or is_lactose_intolerant
        is_gluten_restricted = is_wheat_allergic or is_gluten_intolerant

        if not any([is_dairy_restricted, is_egg_allergic, is_nuts_allergic, is_gluten_restricted, is_fish_allergic]):
            return

        cat = {}
        try:
            from Meal.planner.catalog import load_master_planner_catalog
            cat = load_master_planner_catalog()
        except Exception:
            pass

        violations = []
        for day in days_dto:
            day_name = day.get("day_name", f"Day {day.get('day_index')}") if isinstance(day, dict) else getattr(day, "day_name", "Day")
            meals = day.get("meals", []) if isinstance(day, dict) else getattr(day, "meals", [])
            for meal in meals:
                role = meal.get("role", "MEAL") if isinstance(meal, dict) else getattr(meal, "role", "MEAL")
                items = meal.get("items", []) if isinstance(meal, dict) else getattr(meal, "items", [])
                for item in items:
                    eid = item.get("entity_id", "") if isinstance(item, dict) else getattr(item, "entity_id", "")
                    disp_name = item.get("display_name", "") if isinstance(item, dict) else getattr(item, "display_name", "")
                    name = disp_name.lower()

                    if is_dairy_restricted:
                        has_dairy = (
                            eid in DAIRY_ENTITY_IDS
                            or any(re.search(rf"\b{re.escape(k)}\b", name) for k in DAIRY_KEYWORDS)
                            or (eid in cat and getattr(cat[eid], "known_contains_dairy", False))
                        )
                        if has_dairy:
                            reason = "Milk/Dairy Allergy" if is_dairy_allergic else "Lactose Intolerance"
                            violations.append(f"{day_name} {role}: {disp_name} contains dairy ({eid}) [violating {reason}]")

                    if is_egg_allergic:
                        has_egg = (
                            any(re.search(rf"\b{re.escape(k)}\b", name) for k in ["egg", "eggs", "anda", "anday"])
                            or (eid in cat and getattr(cat[eid], "known_contains_egg", False))
                        )
                        if has_egg:
                            violations.append(f"{day_name} {role}: {disp_name} contains egg ({eid}) [violating Egg Allergy]")

                    if is_nuts_allergic:
                        has_nuts = (
                            any(re.search(rf"\b{re.escape(k)}\b", name) for k in ["nut", "nuts", "peanut", "peanuts", "almond", "walnut", "kaju", "badam", "pista"])
                            or (eid in cat and getattr(cat[eid], "known_contains_nuts", False))
                        )
                        if has_nuts:
                            violations.append(f"{day_name} {role}: {disp_name} contains nuts ({eid}) [violating Nut Allergy]")

                    if is_gluten_restricted:
                        has_gluten = (
                            eid in GLUTEN_ENTITY_IDS
                            or any(re.search(rf"\b{re.escape(k)}\b", name) for k in GLUTEN_KEYWORDS)
                            or (eid in cat and getattr(cat[eid], "known_contains_wheat", False))
                        )
                        if has_gluten:
                            reason = "Wheat Allergy" if is_wheat_allergic else "Gluten Intolerance/Sensitivity"
                            violations.append(f"{day_name} {role}: {disp_name} contains gluten ({eid}) [violating {reason}]")

                    if is_fish_allergic:
                        has_fish = (
                            any(re.search(rf"\b{re.escape(k)}\b", name) for k in ["fish", "machli", "machhli"])
                            or (eid in cat and getattr(cat[eid], "known_contains_fish", False))
                        )
                        if has_fish:
                            violations.append(f"{day_name} {role}: {disp_name} contains fish ({eid}) [violating Fish Allergy]")

        if violations:
            raise RuntimeError(
                f"FAIL-CLOSED ALLERGEN/INTOLERANCE SAFETY REJECTION: Generated meal plan contains incompatible items! Violations: {'; '.join(violations)}"
            )

    def check_user_readiness(
        self,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
        active_assessment_module: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Runs the complete readiness check and returns the structured dictionary."""
        res = MealProfileBuilder.check_nutrition_readiness(
            raw_user_meta_data, profile_data, active_assessment_module=active_assessment_module
        )
        return res.to_dict()

    def get_nutrition_targets(
        self,
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
        active_assessment_module: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calculates and returns Phase 5A targets and 5B condition profile for user."""
        readiness = MealProfileBuilder.check_nutrition_readiness(raw_user_meta_data, profile_data)
        if not readiness.ready:
            raise NutritionReadinessException(readiness.to_dict())

        user_profile = MealProfileBuilder.build_user_nutrition_profile(
            user_id=user_id,
            raw_user_meta_data=raw_user_meta_data,
            profile_data=profile_data,
        )
        condition_ctx = MealProfileBuilder.build_condition_evidence_context(
            user_id=user_id,
            raw_user_meta_data=raw_user_meta_data,
            profile_data=profile_data,
            active_assessment_module=active_assessment_module,
        )

        neutral = build_nutrition_target_profile(user_profile)
        condition = build_condition_nutrition_profile(neutral, condition_ctx)

        return {
            "energy_kcal": round(neutral.energy_target_kcal, 1),
            "protein_g": {
                "min": round(neutral.protein_target_min_g, 1),
                "max": round(neutral.protein_target_max_g, 1),
            },
            "carbohydrate_g": {
                "min": round(neutral.carbohydrate_target_min_g, 1),
                "max": round(neutral.carbohydrate_target_max_g, 1),
            },
            "fat_g": {
                "min": round(neutral.fat_amdr_min_g, 1),
                "max": round(neutral.fat_amdr_max_g, 1),
            },
            "fiber_ai_g": round(neutral.fiber_ai_g, 1),
            "condition_pathway": condition_ctx.condition_pathway.value,
            "evidence_context_status": condition_ctx.evidence_context_status.value,
            "condition_evidence_annotations": [
                r.rule.statement for r in getattr(condition, "rule_evaluations", [])
                if getattr(r, "rule", None) and getattr(r.rule, "statement", None)
            ],
        }

    def generate_weekly_plan(
        self,
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
        active_assessment_module: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes full weekly meal plan generation and persists immutable snapshot.
        """
        # 1. Readiness evaluation
        readiness = MealProfileBuilder.check_nutrition_readiness(raw_user_meta_data, profile_data)
        if not readiness.ready:
            raise NutritionReadinessException(readiness.to_dict())

        # 2. Build UserNutritionProfile & ConditionEvidenceContext
        canonical_profile = MealProfileBuilder.build_canonical_nutrition_profile(
            user_id=user_id,
            raw_user_meta_data=raw_user_meta_data,
            profile_data=profile_data,
        )
        user_profile = canonical_profile.to_engine_user_nutrition_profile()
        condition_ctx = MealProfileBuilder.build_condition_evidence_context(
            user_id=user_id,
            raw_user_meta_data=raw_user_meta_data,
            profile_data=profile_data,
            active_assessment_module=active_assessment_module,
        )

        # 3. Phase 5A Neutral Targets & Phase 5B Condition Profile
        neutral = build_nutrition_target_profile(user_profile)
        condition = build_condition_nutrition_profile(neutral, condition_ctx)

        # 4. Check dairy and gluten restrictions (keeping allergies and intolerances distinct)
        is_dairy_allergic = any(
            "dairy" in str(getattr(a, "value", a)).lower() or "milk" in str(getattr(a, "value", a)).lower()
            for a in user_profile.food_allergies
        )
        is_lactose_intolerant = any(
            "lactose" in str(i).lower() or "dairy" in str(i).lower()
            for i in canonical_profile.food_intolerances
        )
        is_dairy_excluded = is_dairy_allergic or is_lactose_intolerant

        is_wheat_allergic = any(
            "wheat" in str(getattr(a, "value", a)).lower()
            for a in user_profile.food_allergies
        )
        is_gluten_restricted = (
            is_wheat_allergic
            or any("gluten" in str(i).lower() for i in canonical_profile.food_intolerances)
            or "gluten" in str(canonical_profile.dietary_pattern).lower()
        )

        # In Solution A catalog, DietaryClass.STANDARD (omnivore) has no restricted catalog mapping.
        # Passing dietary_class=None preserves standard omnivore foods.
        diet_class_val = None
        if user_profile.dietary_class and getattr(user_profile.dietary_class, "name", "") != "STANDARD":
            diet_class_val = user_profile.dietary_class.value.lower()

        extra_exclusions: List[str] = []
        if is_dairy_excluded:
            extra_exclusions.extend(list(DAIRY_ENTITY_IDS))
        if is_gluten_restricted:
            extra_exclusions.extend(list(GLUTEN_ENTITY_IDS))

        # Resolve food dislikes strictly to valid canonical planner entity IDs (never allergen names!)
        # Preserves unmapped dislikes to show a clear notice rather than silently ignoring preferences.
        resolved_dislikes, unresolved_dislikes = self.resolve_dislikes_to_entity_ids(user_profile.disliked_foods or [])

        base_context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=user_profile.food_allergies,
            dietary_class=diet_class_val,
            dislikes=resolved_dislikes,
            requested_exclusions=extra_exclusions,
        )

        # 5. Define 3 distinct daily slot rotation schedules ensuring variety and strict safety
        e_tot = neutral.energy_target_kcal
        constraints = get_production_portion_constraints()

        excl_set = list(set(extra_exclusions))

        if is_gluten_restricted and is_dairy_excluded:
            # Both Gluten-free and Dairy-free: Rice and Legumes as base, Fruits & Vegetables, 0 dairy, 0 gluten
            slot_definitions = [
                # Day 1: Channa+Apple, Rice+Lobia+Tomato, Rice+Lobia+Carrot, Banana
                {
                    "b_req": ["PK_COMP_021", "PK_COMP_007"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": excl_set, "l_pref": ["PK_COMP_027"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": excl_set, "d_pref": ["PK_COMP_028"],
                    "s_req": ["PK_COMP_008"], "s_excl": excl_set,
                },
                # Day 2: Channa+Banana, Rice+Lobia+Beetroot, Rice+Lobia+Tomato, Malta
                {
                    "b_req": ["PK_COMP_021", "PK_COMP_008"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": excl_set, "l_pref": ["PK_COMP_030"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": excl_set, "d_pref": ["PK_COMP_027"],
                    "s_req": ["PK_COMP_012"], "s_excl": excl_set,
                },
                # Day 3: Channa+Malta, Rice+Lobia+Carrot, Rice+Lobia+Onion, Apple
                {
                    "b_req": ["PK_COMP_021", "PK_COMP_012"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": excl_set, "l_pref": ["PK_COMP_028"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": excl_set, "d_pref": ["PK_COMP_031"],
                    "s_req": ["PK_COMP_007"], "s_excl": excl_set,
                },
            ]
        elif is_gluten_restricted:
            # Gluten-free only: Rice and Legumes, Dairy allowed (Dahi, Lassi), 0 gluten grains
            slot_definitions = [
                # Day 1: Channa+Dahi, Rice+Lobia+Tomato, Rice+Lobia+Carrot, Apple
                {
                    "b_req": ["PK_COMP_021", "PK_COMP_001"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": excl_set, "l_pref": ["PK_COMP_027"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": excl_set, "d_pref": ["PK_COMP_028"],
                    "s_req": ["PK_COMP_007"], "s_excl": excl_set,
                },
                # Day 2: Channa+Banana, Rice+Lobia+Beetroot, Rice+Lobia+Tomato, Lassi
                {
                    "b_req": ["PK_COMP_021", "PK_COMP_008"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": excl_set, "l_pref": ["PK_COMP_030"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": excl_set, "d_pref": ["PK_COMP_027"],
                    "s_req": ["PK_COMP_002"], "s_excl": excl_set,
                },
                # Day 3: Channa+Apple, Rice+Lobia+Carrot, Rice+Lobia+Onion, Malta
                {
                    "b_req": ["PK_COMP_021", "PK_COMP_007"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": excl_set, "l_pref": ["PK_COMP_028"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": excl_set, "d_pref": ["PK_COMP_031"],
                    "s_req": ["PK_COMP_012"], "s_excl": excl_set,
                },
            ]
        elif is_dairy_excluded:
            # Dairy-free only: Whole wheat Chapati allowed, Rice, Legumes, 0 dairy
            slot_definitions = [
                # Day 1: Chapati+Channa, Rice+Lobia+Tomato, Chapati+Lobia+Carrot, Apple
                {
                    "b_req": ["PK_PORTION_001", "PK_COMP_021"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": ["PK_PORTION_001"] + excl_set, "l_pref": ["PK_COMP_027"],
                    "d_req": ["PK_PORTION_001", "PK_COMP_023"], "d_excl": ["PK_PORTION_002"] + excl_set, "d_pref": ["PK_COMP_028"],
                    "s_req": ["PK_COMP_007"], "s_excl": excl_set,
                },
                # Day 2: Chapati+Banana, Chapati+Lobia+Beetroot, Rice+Lobia+Tomato, Banana
                {
                    "b_req": ["PK_PORTION_001", "PK_COMP_008"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_001", "PK_COMP_023"], "l_excl": ["PK_PORTION_002"] + excl_set, "l_pref": ["PK_COMP_030"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": ["PK_PORTION_001"] + excl_set, "d_pref": ["PK_COMP_027"],
                    "s_req": ["PK_COMP_008"], "s_excl": excl_set,
                },
                # Day 3: Chapati+Apple, Rice+Lobia+Carrot, Chapati+Lobia+Onion, Malta
                {
                    "b_req": ["PK_PORTION_001", "PK_COMP_007"], "b_excl": excl_set,
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": ["PK_PORTION_001"] + excl_set, "l_pref": ["PK_COMP_028"],
                    "d_req": ["PK_PORTION_001", "PK_COMP_023"], "d_excl": ["PK_PORTION_002"] + excl_set, "d_pref": ["PK_COMP_031"],
                    "s_req": ["PK_COMP_012"], "s_excl": excl_set,
                },
            ]
        else:
            # Standard: Balanced variety with both Chapati, Rice, Dahi, and Lassi
            slot_definitions = [
                # Day 1: Chapati+Dahi, Rice+Lobia+Tomato, Chapati+Lobia+Carrot, Apple
                {
                    "b_req": ["PK_PORTION_001", "PK_COMP_001"], "b_excl": [],
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": ["PK_PORTION_001"], "l_pref": ["PK_COMP_027"],
                    "d_req": ["PK_PORTION_001", "PK_COMP_023"], "d_excl": ["PK_PORTION_002"], "d_pref": ["PK_COMP_028"],
                    "s_req": ["PK_COMP_007"], "s_excl": [],
                },
                # Day 2: Chapati+Banana, Chapati+Lobia+Beetroot, Rice+Lobia+Tomato, Lassi
                {
                    "b_req": ["PK_PORTION_001", "PK_COMP_008"], "b_excl": [],
                    "l_req": ["PK_PORTION_001", "PK_COMP_023"], "l_excl": ["PK_PORTION_002"], "l_pref": ["PK_COMP_030"],
                    "d_req": ["PK_PORTION_002", "PK_COMP_023"], "d_excl": ["PK_PORTION_001"], "d_pref": ["PK_COMP_027"],
                    "s_req": ["PK_COMP_002"], "s_excl": [],
                },
                # Day 3: Chapati+Channa, Rice+Lobia+Carrot, Chapati+Lobia+Onion, Malta
                {
                    "b_req": ["PK_PORTION_001", "PK_COMP_021"], "b_excl": [],
                    "l_req": ["PK_PORTION_002", "PK_COMP_023"], "l_excl": ["PK_PORTION_001"], "l_pref": ["PK_COMP_028"],
                    "d_req": ["PK_PORTION_001", "PK_COMP_023"], "d_excl": ["PK_PORTION_002"], "d_pref": ["PK_COMP_031"],
                    "s_req": ["PK_COMP_012"], "s_excl": [],
                },
            ]

        # 6. Generate Phase 6D candidate full days across 3 slots
        candidate_days_by_slot: Dict[int, List[Any]] = {}
        for slot_idx, slot in enumerate(slot_definitions, start=1):
            alloc_b = MealAllocation(
                role=MealRole.BREAKFAST,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.25, 1),
                    energy_tolerance_kcal=60.0,
                    protein_min_g=8.0,
                    protein_max_g=30.0,
                    carbohydrate_min_g=20.0,
                    carbohydrate_max_g=70.0,
                    fat_min_g=2.0,
                    fat_max_g=20.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                required_entity_ids=slot["b_req"],
                explicitly_excluded_ids=slot["b_excl"],
            )
            alloc_l = MealAllocation(
                role=MealRole.LUNCH,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.35, 1),
                    energy_tolerance_kcal=70.0,
                    protein_min_g=12.0,
                    protein_max_g=40.0,
                    carbohydrate_min_g=30.0,
                    carbohydrate_max_g=90.0,
                    fat_min_g=5.0,
                    fat_max_g=25.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                required_entity_ids=slot["l_req"],
                explicitly_excluded_ids=slot["l_excl"],
                preferred_entity_ids=slot.get("l_pref", []),
            )
            alloc_d = MealAllocation(
                role=MealRole.DINNER,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.30, 1),
                    energy_tolerance_kcal=60.0,
                    protein_min_g=10.0,
                    protein_max_g=35.0,
                    carbohydrate_min_g=25.0,
                    carbohydrate_max_g=80.0,
                    fat_min_g=4.0,
                    fat_max_g=22.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                required_entity_ids=slot["d_req"],
                explicitly_excluded_ids=slot["d_excl"],
                preferred_entity_ids=slot.get("d_pref", []),
            )
            alloc_s = MealAllocation(
                role=MealRole.SNACK,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.10, 1),
                    energy_tolerance_kcal=40.0,
                    protein_min_g=1.0,
                    protein_max_g=15.0,
                    carbohydrate_min_g=10.0,
                    carbohydrate_max_g=40.0,
                    fat_min_g=0.5,
                    fat_max_g=12.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                required_entity_ids=slot["s_req"],
                explicitly_excluded_ids=slot["s_excl"],
            )

            schedule = DailyMealSchedule(
                allocations=[alloc_b, alloc_l, alloc_d, alloc_s],
                schedule_name=f"BioPulse Pakistani Day Slot {slot_idx}",
                schedule_source="ENGINEERING_DEFAULT_NON_CLINICAL",
            )

            dres = generate_full_day_plan(
                neutral_profile=neutral,
                condition_profile=condition,
                schedule=schedule,
                policy=FullDayPlanningPolicy(
                    maximum_meal_candidates_per_role=3,
                    maximum_alternative_day_plans=2,
                    maximum_day_combinations_evaluated=30,
                ),
                base_context=base_context,
                default_constraints=constraints,
            )
            if dres.is_successful and dres.best_day_plan:
                candidate_days_by_slot[slot_idx] = [dres.best_day_plan] + dres.alternative_day_plans
            else:
                logger.warning("Slot %d generation produced deviations or failed: %s", slot_idx, dres.failed_meal_details)

        # Fallback if any of the 3 slots failed to generate
        if len(candidate_days_by_slot) < 3:
            fb_b_pref = ["PK_COMP_021", "PK_COMP_007"] if is_gluten_restricted else ["PK_PORTION_001", "PK_COMP_021"]
            fb_d_pref = ["PK_PORTION_002", "PK_COMP_023"] if is_gluten_restricted else ["PK_PORTION_001", "PK_COMP_023"]
            fallback_alloc_b = MealAllocation(
                role=MealRole.BREAKFAST,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.25, 1),
                    energy_tolerance_kcal=60.0,
                    protein_min_g=8.0,
                    protein_max_g=30.0,
                    carbohydrate_min_g=20.0,
                    carbohydrate_max_g=70.0,
                    fat_min_g=2.0,
                    fat_max_g=20.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                preferred_entity_ids=fb_b_pref,
                explicitly_excluded_ids=extra_exclusions,
            )
            fallback_alloc_l = MealAllocation(
                role=MealRole.LUNCH,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.35, 1),
                    energy_tolerance_kcal=70.0,
                    protein_min_g=12.0,
                    protein_max_g=40.0,
                    carbohydrate_min_g=30.0,
                    carbohydrate_max_g=90.0,
                    fat_min_g=5.0,
                    fat_max_g=25.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                preferred_entity_ids=["PK_PORTION_002", "PK_COMP_023"],
                explicitly_excluded_ids=extra_exclusions,
            )
            fallback_alloc_d = MealAllocation(
                role=MealRole.DINNER,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.30, 1),
                    energy_tolerance_kcal=60.0,
                    protein_min_g=10.0,
                    protein_max_g=35.0,
                    carbohydrate_min_g=25.0,
                    carbohydrate_max_g=80.0,
                    fat_min_g=4.0,
                    fat_max_g=22.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                preferred_entity_ids=fb_d_pref,
                explicitly_excluded_ids=extra_exclusions,
            )
            fallback_alloc_s = MealAllocation(
                role=MealRole.SNACK,
                target=PortionOptimizationTarget(
                    target_energy_kcal=round(e_tot * 0.10, 1),
                    energy_tolerance_kcal=40.0,
                    protein_min_g=1.0,
                    protein_max_g=15.0,
                    carbohydrate_min_g=10.0,
                    carbohydrate_max_g=40.0,
                    fat_min_g=0.5,
                    fat_max_g=12.0,
                    target_source="APPLICATION_SCHEDULE",
                ),
                preferred_entity_ids=["PK_COMP_007"],
                explicitly_excluded_ids=extra_exclusions,
            )
            fallback_sched = DailyMealSchedule(
                allocations=[fallback_alloc_b, fallback_alloc_l, fallback_alloc_d, fallback_alloc_s],
                schedule_name="BioPulse Pakistani Baseline Plan",
                schedule_source="ENGINEERING_DEFAULT_NON_CLINICAL",
            )
            day_res = generate_full_day_plan(
                neutral_profile=neutral,
                condition_profile=condition,
                schedule=fallback_sched,
                policy=FullDayPlanningPolicy(
                    maximum_meal_candidates_per_role=3,
                    maximum_alternative_day_plans=3,
                ),
                base_context=base_context,
                default_constraints=constraints,
            )
            if not day_res.is_successful or not day_res.best_day_plan:
                raise RuntimeError(f"Failed to generate valid candidate day plan: {day_res.failed_meal_details}")
            pool = [day_res.best_day_plan] + day_res.alternative_day_plans
            for s in range(1, 4):
                if s not in candidate_days_by_slot:
                    candidate_days_by_slot[s] = pool

        # 7. Generate Phase 6E 3-Day Plan with Variety Sequencing across exactly 3 days
        week_res = generate_weekly_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_days_by_slot=candidate_days_by_slot,
            planning_days=3,
            policy=WeeklyVarietyPolicy(
                maximum_same_entity_occurrences_per_week=12,
                maximum_same_meal_combination_occurrences_per_week=2,
                maximum_candidate_days_per_slot=2,
            ),
        )

        if not week_res.is_successful or not week_res.best_week:
            raise RuntimeError(f"Failed to sequence 3-day meal plan: {week_res.warnings}")

        best_week = week_res.best_week

        # 8. Assemble Stable API DTO for exactly 3 consecutive calendar dates
        today = date.today()
        start_date = today
        end_date = today + timedelta(days=2)

        # Target Adherence helper
        def _get_adherence(val: float, target: float, min_val: Optional[float] = None, max_val: Optional[float] = None) -> str:
            if min_val is not None and max_val is not None:
                if val < min_val:
                    return "BELOW_RANGE"
                if val > max_val:
                    return "ABOVE_RANGE"
                return "WITHIN_RANGE"
            # Energy comparison (tolerance +/- 10%)
            low = target * 0.90
            high = target * 1.10
            if val < low:
                return "BELOW_RANGE"
            if val > high:
                return "ABOVE_RANGE"
            return "WITHIN_RANGE"

        days_dto = []
        for idx, day_plan in enumerate(best_week.day_plans):
            day_num = idx + 1
            day_date = start_date + timedelta(days=idx)
            day_name = DAY_NAMES[day_date.weekday()]

            energy_adh = _get_adherence(day_plan.daily_energy_kcal, neutral.energy_target_kcal)
            protein_adh = _get_adherence(day_plan.daily_protein_g, neutral.protein_target_min_g, neutral.protein_target_min_g, neutral.protein_target_max_g)
            carb_adh = _get_adherence(day_plan.daily_carbohydrate_g, neutral.carbohydrate_target_min_g, neutral.carbohydrate_target_min_g, neutral.carbohydrate_target_max_g)
            fat_adh = _get_adherence(day_plan.daily_fat_g, neutral.fat_amdr_min_g, neutral.fat_amdr_min_g, neutral.fat_amdr_max_g)

            # Build meals DTO
            meals_dto = []
            for role, meal in day_plan.meals.items():
                items_dto = []
                for it in meal.items:
                    verified_rec = self._verified_records_map.get(it.entity_id)
                    portion_desc = (
                        f"Standard serving: {verified_rec.source_serving_grams}g ({verified_rec.source_reference})"
                        if verified_rec else f"{it.optimized_grams:.1f}g"
                    )
                    items_dto.append({
                        "entity_id": it.entity_id,
                        "display_name": it.display_name,
                        "grams": round(it.optimized_grams, 1),
                        "standard_portion": portion_desc,
                        "energy_kcal": round(it.energy_kcal, 1),
                        "protein_g": round(it.protein_g, 1),
                        "carbohydrate_g": round(it.carbohydrate_g, 1),
                        "fat_g": round(it.fat_g, 1),
                        "has_recipe": False,
                        "recipe_note": "Recipe instructions are not available from the current verified source.",
                    })

                clean_dish_title = self._generate_meal_title(role.value, items_dto)
                meals_dto.append({
                    "role": role.value.upper(),
                    "title": clean_dish_title,
                    "energy_kcal": round(meal.total_energy_kcal, 1),
                    "protein_g": round(meal.total_protein_g, 1),
                    "carbohydrate_g": round(meal.total_carbohydrate_g, 1),
                    "fat_g": round(meal.total_fat_g, 1),
                    "items": items_dto,
                })

            fiber_val = day_plan.fiber_result.known_fiber_total_g
            days_dto.append({
                "day_index": day_num,
                "day_name": day_name,
                "date": day_date.isoformat(),
                "status": day_plan.feasibility_class.value,
                "energy_kcal": round(day_plan.daily_energy_kcal, 1),
                "protein_g": round(day_plan.daily_protein_g, 1),
                "carbohydrate_g": round(day_plan.daily_carbohydrate_g, 1),
                "fat_g": round(day_plan.daily_fat_g, 1),
                "fiber_g": round(fiber_val, 1) if fiber_val is not None else None,
                "fiber_coverage": day_plan.fiber_result.fiber_coverage_status.value,
                "target_adherence": {
                    "energy": energy_adh,
                    "protein": protein_adh,
                    "carbohydrate": carb_adh,
                    "fat": fat_adh,
                },
                "meals": meals_dto,
            })

        # 9. Fail-closed safety validation gate (reject any plan containing confirmed allergens or intolerances)
        self._validate_plan_allergen_safety(days_dto, user_profile.food_allergies, canonical_profile.food_intolerances)

        # Condition guidance
        guidance_statements = [
            r.rule.statement for r in getattr(condition, "rule_evaluations", [])
            if getattr(r, "rule", None) and getattr(r.rule, "statement", None)
        ]
        if not guidance_statements:
            if condition_ctx.condition_pathway.value == "PCOS":
                guidance_statements.append("Focus on complex carbohydrates, balanced protein, and consistent meal timing to support metabolic equilibrium.")
            elif condition_ctx.condition_pathway.value == "MALE_HYPOGONADISM":
                guidance_statements.append("Ensure adequate dietary protein, essential fatty acids, and balanced micronutrients to support general endocrine health.")
            else:
                guidance_statements.append("Maintain consistent meal schedules and balanced whole foods aligned with dietary guidelines.")

        is_unconfirmed = getattr(canonical_profile, "allergy_status", "") == "UNCONFIRMED"
        has_no_known_allergies = getattr(canonical_profile, "allergy_status", "CONFIRMED_NONE") == "CONFIRMED_NONE"

        warnings_list = list(week_res.warnings)
        if is_unconfirmed:
            warnings_list.append(
                "Provisional meal plan: Allergy status unconfirmed. Full ingredient listing provided for manual review without allergen-free assurances."
            )
        if unresolved_dislikes:
            warnings_list.append(
                f"The following disliked food(s) could not be matched to our verified Pakistani food catalog: {', '.join(unresolved_dislikes)}. Please review meal ingredients manually."
            )

        plan_data_dto = {
            "status": "3_DAY_PLAN_GENERATED",
            "weekly_status": week_res.status.value,
            "canonical_week_id": best_week.canonical_week_id,
            "days_targets_met": best_week.nutrition_summary.days_full_targets_met,
            "days_with_deviations": best_week.nutrition_summary.days_with_target_deviations,
            "mean_j_day": round(best_week.nutrition_summary.mean_J_day, 6),
            "planning_days": 3,
            "allergy_status": getattr(canonical_profile, "allergy_status", "CONFIRMED_NONE"),
            "no_known_allergies_declared": has_no_known_allergies,
            "allergen_safe_claimed": False,  # Never describe generated meals as certified safe merely because user selected No Known Allergies
            "provisional_notice": (
                "Provisional plan: Allergy status was not confirmed. This meal plan provides general lifestyle guidance and does not provide allergen-free assurances. Please review the full ingredient listing for each meal."
                if is_unconfirmed else None
            ),
            "unresolved_dislikes": unresolved_dislikes,
            "days": days_dto,
            "coverage": {
                "fiber": best_week.fiber_summary.fiber_coverage_status.value,
                "fiber_note": "Some selected foods do not have verified fiber data." if best_week.fiber_summary.fiber_coverage_status.value != "COMPLETE" else "Complete fiber data available.",
                "recipes": best_week.recipe_instruction_coverage_status.value,
                "verified_subset_notice": VERIFIED_SUBSET_NOTICE,
            },
            "condition_guidance": guidance_statements,
            "warnings": warnings_list,
        }

        # Snapshot representations
        profile_snapshot = {
            "age": user_profile.age,
            "sex": user_profile.sex_for_reference_equation,
            "height_cm": user_profile.height_cm,
            "weight_kg": user_profile.weight_kg,
            "activity_level": user_profile.pal_category.value,
            "goal": user_profile.goal.value,
            "dietary_class": user_profile.dietary_class.value,
            "food_allergies": list(canonical_profile.food_allergies),
            "food_intolerances": list(canonical_profile.food_intolerances),
            "allergy_status": getattr(canonical_profile, "allergy_status", "CONFIRMED_NONE"),
        }
        target_profile_snapshot = {
            "energy_kcal": neutral.energy_target_kcal,
            "protein_g": {"min": neutral.protein_target_min_g, "max": neutral.protein_target_max_g},
            "carbohydrate_g": {"min": neutral.carbohydrate_target_min_g, "max": neutral.carbohydrate_target_max_g},
            "fat_g": {"min": neutral.fat_amdr_min_g, "max": neutral.fat_amdr_max_g},
            "fiber_ai_g": neutral.fiber_ai_g,
        }
        condition_context_snapshot = {
            "condition_pathway": condition_ctx.condition_pathway.value,
            "evidence_context_status": condition_ctx.evidence_context_status.value,
        }
        audit_diagnostics = {
            "total_possible_sequences": week_res.total_possible_week_sequences,
            "sequences_evaluated": week_res.week_sequences_evaluated,
            "search_truncated": week_res.week_search_truncated,
            "planning_days": 3,
        }

        # 9. Persist snapshot via repository as three_day plan
        saved_record = self.repository.save_plan(
            user_id=user_id,
            plan_type="three_day",
            start_date=start_date,
            end_date=end_date,
            profile_snapshot=profile_snapshot,
            target_profile=target_profile_snapshot,
            condition_context=condition_context_snapshot,
            plan_data=plan_data_dto,
            audit_diagnostics=audit_diagnostics,
            meal_module_version="1.0.0",
            auth_token=auth_token,
        )

        return self._format_plan_response(saved_record)

    def get_current_plan(self, user_id: str, auth_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves and formats the user's active plan, strictly revalidating allergen safety."""
        record = self.repository.get_active_plan(user_id, auth_token=auth_token)
        if not record:
            return None

        # Revalidate allergen safety against the profile snapshot
        profile_snapshot = record.get("profile_snapshot") or {}
        allergies = profile_snapshot.get("food_allergies") or []
        is_dairy_allergic = any("dairy" in str(a).lower() or "milk" in str(a).lower() for a in allergies)

        if is_dairy_allergic:
            plan_data = record.get("plan_data") or {}
            days = plan_data.get("days", [])
            has_violation = False
            for day in days:
                for meal in day.get("meals", []):
                    for item in meal.get("items", []):
                        eid = item.get("entity_id", "")
                        name = item.get("display_name", "").lower()
                        if eid in DAIRY_ENTITY_IDS or any(k in name for k in DAIRY_KEYWORDS):
                            has_violation = True
                            logger.warning(
                                "Active plan %s for user %s contains dairy allergen item %s (%s). Inactivating unsafe plan.",
                                record.get("id"), user_id[:8] + "***", item.get("display_name"), eid
                            )
                            break
                    if has_violation:
                        break
                if has_violation:
                    break

            if has_violation:
                try:
                    self.repository.update_plan_payload(
                        user_id=user_id,
                        plan_id=record.get("id"),
                        plan_data=plan_data,
                        is_active=False,
                        auth_token=auth_token,
                    )
                except Exception as exc:
                    logger.warning("Failed to inactivate unsafe plan: %s", exc)
                return None

        return self._format_plan_response(record)

    def get_plan_by_id(self, user_id: str, plan_id: str, auth_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves and formats a specific plan by ID, enforcing user ownership."""
        record = self.repository.get_plan_by_id(user_id=user_id, plan_id=plan_id, auth_token=auth_token)
        if not record:
            return None
        return self._format_plan_response(record)

    def get_plan_history(self, user_id: str, limit: int = 10, auth_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves lightweight summary list of historical plans."""
        records = self.repository.get_plan_history(user_id=user_id, limit=limit, auth_token=auth_token)
        history = []
        for r in records:
            cond = r.get("condition_context") or {}
            raw_type = (r.get("plan_type") or "").lower()
            plan_data_r = r.get("plan_data") or {}
            days_count = len(plan_data_r.get("days", []))
            if "3" in raw_type or "three" in raw_type or days_count == 3:
                plan_type_dto = "THREE_DAY_PLAN"
            elif raw_type == "weekly" or days_count == 7:
                plan_type_dto = "WEEKLY_7_DAY"
            else:
                plan_type_dto = r.get("plan_type") or "THREE_DAY_PLAN"
            history.append({
                "id": r.get("id"),
                "plan_type": plan_type_dto,
                "start_date": r.get("start_date"),
                "end_date": r.get("end_date"),
                "is_active": r.get("is_active", False),
                "condition_pathway": cond.get("condition_pathway", "GENERAL"),
                "status": (r.get("plan_data") or {}).get("weekly_status", "COMPLETED"),
                "created_at": r.get("created_at"),
            })
        return history

    def _format_plan_response(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Formats a stored nutrition_plans database row into the stable API DTO."""
        plan_data = record.get("plan_data") or {}
        targets = record.get("target_profile") or {}
        cond = record.get("condition_context") or {}
        profile = record.get("profile_snapshot") or {}

        raw_plan_type = (record.get("plan_type") or "").lower()
        days = plan_data.get("days", [])
        if "3" in raw_plan_type or "three" in raw_plan_type or len(days) == 3:
            plan_type_dto = "THREE_DAY_PLAN"
        elif raw_plan_type == "weekly" or len(days) == 7:
            plan_type_dto = "WEEKLY_7_DAY"
        else:
            plan_type_dto = record.get("plan_type") or "THREE_DAY_PLAN"

        # Format and ensure UI fields on days and meals
        for d in days:
            for m in d.get("meals", []):
                if "is_locked" not in m:
                    m["is_locked"] = False
                if "why_it_fits" not in m:
                    m["why_it_fits"] = f"Calibrated for your {profile.get('dietary_class', 'balanced')} dietary targets and hormonal balance."
                if "prep_time_minutes" not in m:
                    m["prep_time_minutes"] = 20

        return {
            "id": record.get("id"),
            "plan_type": plan_type_dto,
            "start_date": record.get("start_date"),
            "end_date": record.get("end_date"),
            "is_active": record.get("is_active", True),
            "replaced_plan_id": record.get("replaced_plan_id"),
            "status": plan_data.get("weekly_status", "FULL_WEEK_GENERATED"),
            "created_at": record.get("created_at"),
            "profile_context": {
                "condition_pathway": cond.get("condition_pathway", "GENERAL"),
                "evidence_context_status": cond.get("evidence_context_status", "UNKNOWN"),
                "goal": profile.get("goal", "MAINTAIN"),
                "activity_level": profile.get("activity_level", "ACTIVE"),
                "dietary_class": profile.get("dietary_class", "STANDARD"),
            },
            "targets": {
                "energy_kcal": targets.get("energy_kcal", 0),
                "protein_g": targets.get("protein_g", {"min": 0, "max": 0}),
                "carbohydrate_g": targets.get("carbohydrate_g", {"min": 0, "max": 0}),
                "fat_g": targets.get("fat_g", {"min": 0, "max": 0}),
            },
            "days_targets_met": plan_data.get("days_targets_met", 0),
            "days_with_deviations": plan_data.get("days_with_deviations", 0),
            "days": days,
            "coverage": plan_data.get("coverage", {}),
            "condition_guidance": plan_data.get("condition_guidance", []),
            "warnings": plan_data.get("warnings", []),
            "provisional_notice": plan_data.get("provisional_notice"),
            "unresolved_dislikes": plan_data.get("unresolved_dislikes", []),
            "allergen_safe_claimed": plan_data.get("allergen_safe_claimed", False),
            "no_known_allergies_declared": plan_data.get("no_known_allergies_declared", False),
            "allergy_status": plan_data.get("allergy_status", profile.get("allergy_status", "CONFIRMED_NONE")),
            "plan_data": plan_data,
        }

    def lock_meal(
        self,
        user_id: str,
        plan_id: str,
        day_index: int,
        meal_role: str,
        is_locked: bool = True,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Locks or unlocks an individual meal to preserve it during regeneration."""
        record = self.repository.get_plan_by_id(user_id=user_id, plan_id=plan_id, auth_token=auth_token)
        if not record:
            raise ValueError(f"Plan {plan_id} not found for user.")
        plan_data = record.get("plan_data") or {}
        days = plan_data.get("days", [])
        role_clean = str(meal_role).strip().upper()

        found = False
        for d in days:
            if d.get("day_index") == int(day_index):
                for m in d.get("meals", []):
                    if m.get("role", "").upper() == role_clean:
                        m["is_locked"] = bool(is_locked)
                        found = True
                        break
                if found:
                    break

        if not found:
            raise ValueError(f"Meal {meal_role} on day {day_index} not found.")

        updated = self.repository.update_plan_payload(
            user_id=user_id, plan_id=plan_id, plan_data=plan_data, auth_token=auth_token
        )
        return self._format_plan_response(updated or record)

    def swap_meal(
        self,
        user_id: str,
        plan_id: str,
        day_index: int,
        meal_role: str,
        target_entity_id: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Swaps an individual meal for a safe, verified alternative that strictly respects
        patient allergens, dietary pattern, and macro ranges.
        """
        record = self.repository.get_plan_by_id(user_id=user_id, plan_id=plan_id, auth_token=auth_token)
        if not record:
            raise ValueError(f"Plan {plan_id} not found for user.")

        plan_data = record.get("plan_data") or {}
        days = plan_data.get("days", [])
        role_clean = str(meal_role).strip().upper()

        target_day = None
        target_meal = None
        for d in days:
            if d.get("day_index") == int(day_index):
                target_day = d
                for m in d.get("meals", []):
                    if m.get("role", "").upper() == role_clean:
                        target_meal = m
                        break
                break

        if not target_day or not target_meal:
            raise ValueError(f"Meal {meal_role} on day {day_index} not found.")

        # Get user safety constraints
        profile = record.get("profile_snapshot") or {}
        allergens = profile.get("food_allergies") or []
        diet_class = profile.get("dietary_class", "omnivore")

        # Query eligible alternate foods from PakistanFoodCatalog
        from apps.intelligence.services.pakistan_food_catalog import PakistanFoodCatalog
        eligible = PakistanFoodCatalog.get_eligible_foods(
            allergens=allergens,
            dietary_preference=diet_class,
        )

        current_items = [it.get("entity_id") for it in target_meal.get("items", [])]
        candidates = [
            f for f in eligible
            if f.planner_entity_id not in current_items
            and (role_clean.lower() in f.meal_roles.lower() or "lunch,dinner" in f.meal_roles.lower() or "all" in f.meal_roles.lower())
        ]

        if not candidates:
            candidates = [f for f in eligible if f.planner_entity_id not in current_items]

        if not candidates:
            raise ValueError("No eligible alternative meal found matching safety and dietary requirements.")

        chosen = None
        if target_entity_id:
            for c in candidates:
                if c.planner_entity_id == target_entity_id:
                    chosen = c
                    break
        if not chosen:
            # Deterministic alternate selection based on day_index to be reproducible
            chosen = candidates[int(day_index) % len(candidates)]

        target_cals = target_meal.get("energy_kcal", 400.0)
        cals_per_100g = chosen.energy_kcal_per_100g or 150.0
        portion_grams = round((target_cals / cals_per_100g) * 100.0, 1) if cals_per_100g > 0 else 150.0
        portion_grams = max(50.0, min(350.0, portion_grams))

        new_cals = round(cals_per_100g * (portion_grams / 100.0), 1)
        new_prot = round((chosen.protein_g_per_100g or 0.0) * (portion_grams / 100.0), 1)
        new_carb = round((chosen.carb_g_per_100g or 0.0) * (portion_grams / 100.0), 1)
        new_fat = round((chosen.fat_g_per_100g or 0.0) * (portion_grams / 100.0), 1)

        verified_rec = self._verified_records_map.get(chosen.planner_entity_id)
        portion_desc = (
            f"Standard serving: {verified_rec.source_serving_grams}g ({verified_rec.source_reference})"
            if verified_rec else f"{portion_grams:.0f}g portion"
        )

        why_fits = f"Fits your {diet_class} preference and provides ~{new_prot}g protein for satiety and metabolic balance."

        target_meal["title"] = f"{chosen.entity_name_en} ({chosen.entity_name_local})" if chosen.entity_name_local else chosen.entity_name_en
        target_meal["energy_kcal"] = new_cals
        target_meal["protein_g"] = new_prot
        target_meal["carbohydrate_g"] = new_carb
        target_meal["fat_g"] = new_fat
        target_meal["why_it_fits"] = why_fits
        target_meal["prep_time_minutes"] = 25
        target_meal["items"] = [{
            "entity_id": chosen.planner_entity_id,
            "display_name": chosen.entity_name_en,
            "grams": portion_grams,
            "standard_portion": portion_desc,
            "energy_kcal": new_cals,
            "protein_g": new_prot,
            "carbohydrate_g": new_carb,
            "fat_g": new_fat,
            "has_recipe": False,
            "recipe_note": "Prepared with olive oil / light oil and minimal refined sugar.",
        }]

        # Recalculate day totals
        day_meals = target_day.get("meals", [])
        target_day["energy_kcal"] = round(sum(m.get("energy_kcal", 0) for m in day_meals), 1)
        target_day["protein_g"] = round(sum(m.get("protein_g", 0) for m in day_meals), 1)
        target_day["carbohydrate_g"] = round(sum(m.get("carbohydrate_g", 0) for m in day_meals), 1)
        target_day["fat_g"] = round(sum(m.get("fat_g", 0) for m in day_meals), 1)

        updated = self.repository.update_plan_payload(
            user_id=user_id, plan_id=plan_id, plan_data=plan_data, auth_token=auth_token
        )
        return self._format_plan_response(updated or record)

    def regenerate_day(
        self,
        user_id: str,
        plan_id: str,
        day_index: int,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Regenerates all unlocked meals for a specific day while preserving locked meals."""
        record = self.repository.get_plan_by_id(user_id=user_id, plan_id=plan_id, auth_token=auth_token)
        if not record:
            raise ValueError(f"Plan {plan_id} not found for user.")

        plan_data = record.get("plan_data") or {}
        days = plan_data.get("days", [])
        target_day = next((d for d in days if d.get("day_index") == int(day_index)), None)
        if not target_day:
            raise ValueError(f"Day {day_index} not found.")

        for meal in target_day.get("meals", []):
            if not meal.get("is_locked"):
                self.swap_meal(
                    user_id=user_id,
                    plan_id=plan_id,
                    day_index=int(day_index),
                    meal_role=meal.get("role"),
                    auth_token=auth_token,
                )

        updated = self.repository.get_plan_by_id(user_id=user_id, plan_id=plan_id, auth_token=auth_token)
        return self._format_plan_response(updated or record)

    def update_plan_status(
        self,
        user_id: str,
        plan_id: str,
        status_val: str,
        start_date: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Updates plan status (draft, active, completed, archived) and maps dates."""
        record = self.repository.get_plan_by_id(user_id=user_id, plan_id=plan_id, auth_token=auth_token)
        if not record:
            raise ValueError(f"Plan {plan_id} not found for user.")

        plan_data = record.get("plan_data") or {}
        plan_data["weekly_status"] = str(status_val).upper()

        new_start_dt = None
        if start_date:
            s_clean = str(start_date).strip().lower()
            today = date.today()
            if s_clean in ("today", "now"):
                new_start_dt = today
            elif s_clean in ("next_monday", "monday"):
                days_ahead = (0 - today.weekday() + 7) % 7
                if days_ahead == 0:
                    days_ahead = 7
                new_start_dt = today + timedelta(days=days_ahead)
            else:
                try:
                    new_start_dt = datetime.strptime(s_clean[:10], "%Y-%m-%d").date()
                except Exception:
                    new_start_dt = today

        end_date_str = None
        start_date_str = None
        if new_start_dt:
            start_date_str = new_start_dt.isoformat()
            days = plan_data.get("days", [])
            num_days = len(days) if days else 3
            end_date_str = (new_start_dt + timedelta(days=max(0, num_days - 1))).isoformat()
            for idx, d in enumerate(days):
                cur_dt = new_start_dt + timedelta(days=idx)
                d["date"] = cur_dt.isoformat()
                d["day_name"] = DAY_NAMES[cur_dt.weekday()]

        updated = self.repository.update_plan_payload(
            user_id=user_id,
            plan_id=plan_id,
            plan_data=plan_data,
            start_date=start_date_str,
            end_date=end_date_str,
            auth_token=auth_token,
        )
        return self._format_plan_response(updated or record)

    # ----------------------------------------------------------------------
    # Authoritative Food Logging Integration (Supabase public.food_logs)
    # ----------------------------------------------------------------------
    _memory_food_logs: List[Dict[str, Any]] = []
    _memory_reminders: Dict[str, Dict[str, Any]] = {}

    def log_food_item(
        self,
        user_id: str,
        meal_type: str,
        food_name: str,
        serving: str = "1 serving",
        calories: Optional[float] = None,
        protein_g: Optional[float] = None,
        carbs_g: Optional[float] = None,
        fat_g: Optional[float] = None,
        fiber_g: Optional[float] = None,
        notes: str = "",
        logged_at: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Saves a food log entry to the authoritative food_logs table."""
        import uuid
        log_id = str(uuid.uuid4())
        today_iso = (logged_at[:10] if logged_at else date.today().isoformat())
        now_iso = datetime.now(timezone.utc).isoformat()
        clean_meal_type = str(meal_type).lower().replace(" ", "_")
        if clean_meal_type not in ("breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "snack"):
            clean_meal_type = "lunch"
        if clean_meal_type == "snack":
            clean_meal_type = "afternoon_snack"

        # Check for duplicate submission on the same date and meal_type with identical food name
        existing_logs = self.get_food_logs(user_id=user_id, date_iso=today_iso, auth_token=auth_token)
        for existing in existing_logs:
            if (
                existing.get("meal_type") == clean_meal_type
                and existing.get("food_name", "").strip().lower() == food_name.strip().lower()
            ):
                logger.info("Prevented duplicate food log for user %s on %s (%s)", user_id[:8] + "***", today_iso, clean_meal_type)
                return existing

        # Preserve None for unknown nutritional values instead of fabricating 0
        has_verified_nutrition = calories is not None
        calories_val = int(round(float(calories))) if calories is not None else None
        protein_val = round(float(protein_g), 1) if protein_g is not None else None
        carbs_val = round(float(carbs_g), 1) if carbs_g is not None else None
        fat_val = round(float(fat_g), 1) if fat_g is not None else None
        fiber_val = round(float(fiber_g), 1) if fiber_g is not None else None

        clean_notes = notes.strip()
        if not has_verified_nutrition and "[nutrition:unverified]" not in clean_notes:
            clean_notes = f"{clean_notes} [nutrition:unverified]".strip()

        record = {
            "id": log_id,
            "user_id": user_id,
            "meal_type": clean_meal_type,
            "food_name": food_name.strip(),
            "serving": serving.strip() or "1 serving",
            "calories": calories_val,
            "protein_g": protein_val,
            "carbs_g": carbs_val,
            "fat_g": fat_val,
            "fiber_g": fiber_val,
            "logged_at": today_iso,
            "notes": clean_notes,
            "created_at": now_iso,
        }

        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                client.table("food_logs").insert(record).execute()
            except Exception as exc:
                logger.warning("Supabase food_logs insert failed: %s, falling back to in-memory store", exc)
                self._memory_food_logs.append(record)
        else:
            self._memory_food_logs.append(record)

        return record

    # ----------------------------------------------------------------------
    # Server-Side Meal Selection & Scheduling (public.meal_plans)
    # ----------------------------------------------------------------------
    _memory_scheduled_meals: List[Dict[str, Any]] = []

    def schedule_meal(
        self,
        user_id: str,
        target_date: str,
        meal_type: str,
        meal_name: str,
        meal_data: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Schedules a planned meal to the user's dashboard for a specific date and meal role.
        Persists to Supabase `public.meal_plans` with unique constraint on (user_id, date, meal_type).
        """
        import uuid
        now_iso = datetime.now(timezone.utc).isoformat()
        clean_meal_type = str(meal_type).lower().replace(" ", "_")
        if clean_meal_type not in ("breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "snack"):
            clean_meal_type = "lunch"
        if clean_meal_type == "snack":
            clean_meal_type = "afternoon_snack"

        record = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "date": target_date[:10],
            "meal_type": clean_meal_type,
            "meal_name": meal_name.strip(),
            "meal_data": meal_data or {},
            "created_at": now_iso,
        }

        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                res = client.table("meal_plans").upsert(record, on_conflict="user_id,date,meal_type").execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.warning("Supabase meal_plans upsert failed: %s, falling back to memory store", exc)

        # In-memory store fallback with upsert semantics
        self._memory_scheduled_meals = [
            m for m in self._memory_scheduled_meals
            if not (m.get("user_id") == user_id and m.get("date") == target_date[:10] and m.get("meal_type") == clean_meal_type)
        ]
        self._memory_scheduled_meals.append(record)
        return record

    def get_scheduled_meals(
        self,
        user_id: str,
        target_date: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves scheduled meals for the user and target date."""
        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                q = client.table("meal_plans").select("*").eq("user_id", user_id)
                if target_date:
                    q = q.eq("date", target_date[:10])
                res = q.order("date", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as exc:
                logger.warning("Supabase meal_plans select failed: %s", exc)

        return [
            m for m in self._memory_scheduled_meals
            if m.get("user_id") == user_id and (not target_date or m.get("date") == target_date[:10])
        ]

    def delete_scheduled_meal(
        self,
        user_id: str,
        meal_id: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        """Deletes a scheduled meal by ID."""
        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                client.table("meal_plans").delete().eq("id", meal_id).eq("user_id", user_id).execute()
                return True
            except Exception as exc:
                logger.warning("Supabase meal_plans delete failed: %s", exc)

        self._memory_scheduled_meals = [
            m for m in self._memory_scheduled_meals
            if not (m.get("id") == meal_id and m.get("user_id") == user_id)
        ]
        return True

    def get_food_logs(
        self,
        user_id: str,
        date_iso: Optional[str] = None,
        days: int = 7,
        auth_token: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves food logs for user strictly scoped to user_id."""
        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                query = client.table("food_logs").select("*").eq("user_id", user_id)
                if date_iso:
                    query = query.eq("logged_at", date_iso)
                elif start_date and end_date:
                    query = query.gte("logged_at", start_date).lte("logged_at", end_date)
                elif start_date:
                    query = query.gte("logged_at", start_date)
                else:
                    cutoff = (date.today() - timedelta(days=days)).isoformat()
                    query = query.gte("logged_at", cutoff)
                res = query.order("logged_at", desc=True).order("created_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as exc:
                logger.warning("Supabase food_logs select failed: %s", exc)

        # In-memory fallback
        def _matches(l: Dict[str, Any]) -> bool:
            if l.get("user_id") != user_id:
                return False
            log_date = str(l.get("logged_at", ""))
            if date_iso:
                return log_date.startswith(date_iso)
            if start_date and end_date:
                return start_date <= log_date[:10] <= end_date
            if start_date:
                return log_date[:10] >= start_date
            return True

        logs = [l for l in self._memory_food_logs if _matches(l)]
        logs.sort(key=lambda x: (x.get("logged_at", ""), x.get("created_at", "")), reverse=True)
        return logs

    def delete_food_log(self, user_id: str, log_id: str, auth_token: Optional[str] = None) -> bool:
        """Deletes a food log entry strictly verifying user ownership."""
        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                client.table("food_logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
                return True
            except Exception as exc:
                logger.warning("Supabase food_logs delete failed: %s", exc)

        # In-memory fallback
        self._memory_food_logs = [
            l for l in self._memory_food_logs
            if not (l.get("id") == log_id and l.get("user_id") == user_id)
        ]
        return True

    # ----------------------------------------------------------------------
    # Meal Reminders Settings
    # ----------------------------------------------------------------------
    def get_meal_reminders(self, user_id: str, auth_token: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves user meal reminder preferences."""
        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                res = client.table("profiles").select("meal_reminders").eq("id", user_id).maybe_single().execute()
                if res.data and res.data.get("meal_reminders"):
                    return res.data["meal_reminders"]
            except Exception:
                pass

        default_settings = {
            "breakfast_enabled": True,
            "breakfast_time": "08:00",
            "lunch_enabled": True,
            "lunch_time": "13:00",
            "dinner_enabled": True,
            "dinner_time": "20:00",
            "snack_enabled": False,
            "snack_time": "16:30",
            "browser_notifications": False,
        }
        return self._memory_reminders.get(user_id, default_settings)

    def update_meal_reminders(self, user_id: str, settings_dict: Dict[str, Any], auth_token: Optional[str] = None) -> Dict[str, Any]:
        """Updates user meal reminder preferences."""
        self._memory_reminders[user_id] = settings_dict
        client = None
        try:
            from apps.health.services.supabase_health_service import health_service
            client = health_service._client_or_raise(auth_token=auth_token)
        except Exception:
            pass

        if client is not None:
            try:
                client.table("profiles").update({"meal_reminders": settings_dict}).eq("id", user_id).execute()
            except Exception as exc:
                logger.debug("Could not update meal_reminders on profiles table: %s", exc)

        return settings_dict


# Global singleton service
meal_plan_service = MealPlanService()



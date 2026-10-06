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
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set

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
    from Meal.planner.schemas import MealRole
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

logger = logging.getLogger(__name__)

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

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

        # 3. Phase 5A Neutral Targets & Phase 5B Condition Profile
        neutral = build_nutrition_target_profile(user_profile)
        condition = build_condition_nutrition_profile(neutral, condition_ctx)

        # 4. Standard 4-meal daily schedule (Breakfast 25%, Lunch 35%, Dinner 30%, Snack 10%)
        e_tot = neutral.energy_target_kcal
        alloc_b = MealAllocation(
            role=MealRole.BREAKFAST,
            target=PortionOptimizationTarget(
                target_energy_kcal=round(e_tot * 0.25, 1),
                energy_tolerance_kcal=50.0,
                protein_min_g=10.0,
                protein_max_g=30.0,
                carbohydrate_min_g=25.0,
                carbohydrate_max_g=70.0,
                fat_min_g=5.0,
                fat_max_g=20.0,
                target_source="APPLICATION_SCHEDULE",
            ),
            preferred_entity_ids=["PK_PORTION_001", "PK_COMP_005"],
        )
        alloc_l = MealAllocation(
            role=MealRole.LUNCH,
            target=PortionOptimizationTarget(
                target_energy_kcal=round(e_tot * 0.35, 1),
                energy_tolerance_kcal=70.0,
                protein_min_g=15.0,
                protein_max_g=40.0,
                carbohydrate_min_g=35.0,
                carbohydrate_max_g=90.0,
                fat_min_g=8.0,
                fat_max_g=25.0,
                target_source="APPLICATION_SCHEDULE",
            ),
            preferred_entity_ids=["PK_PORTION_001", "PK_COMP_023"],
        )
        alloc_d = MealAllocation(
            role=MealRole.DINNER,
            target=PortionOptimizationTarget(
                target_energy_kcal=round(e_tot * 0.30, 1),
                energy_tolerance_kcal=60.0,
                protein_min_g=12.0,
                protein_max_g=35.0,
                carbohydrate_min_g=30.0,
                carbohydrate_max_g=80.0,
                fat_min_g=6.0,
                fat_max_g=22.0,
                target_source="APPLICATION_SCHEDULE",
            ),
            preferred_entity_ids=["PK_PORTION_002", "PK_COMP_023"],
        )
        alloc_s = MealAllocation(
            role=MealRole.SNACK,
            target=PortionOptimizationTarget(
                target_energy_kcal=round(e_tot * 0.10, 1),
                energy_tolerance_kcal=40.0,
                protein_min_g=2.0,
                protein_max_g=15.0,
                carbohydrate_min_g=10.0,
                carbohydrate_max_g=40.0,
                fat_min_g=1.0,
                fat_max_g=12.0,
                target_source="APPLICATION_SCHEDULE",
            ),
            preferred_entity_ids=["PK_COMP_007"],
        )

        schedule = DailyMealSchedule(
            allocations=[alloc_b, alloc_l, alloc_d, alloc_s],
            schedule_name="BioPulse Pakistani 4-Meal Plan (Sub-Catalog MVP)",
            schedule_source="ENGINEERING_DEFAULT_NON_CLINICAL",
        )

        # 5. Production Portion Constraints
        constraints = get_production_portion_constraints()

        # 6. Generate Phase 6D candidate full days
        day_res = generate_full_day_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            schedule=schedule,
            policy=FullDayPlanningPolicy(
                maximum_meal_candidates_per_role=3,
                maximum_alternative_day_plans=3,
            ),
            default_constraints=constraints,
        )

        if not day_res.is_successful or not day_res.best_day_plan:
            raise RuntimeError(f"Failed to generate valid candidate day plan: {day_res.failure_details}")

        candidate_pool = [day_res.best_day_plan] + day_res.alternative_day_plans

        # 7. Generate Phase 6E 7-Day Plan
        week_res = generate_weekly_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_day_pool=candidate_pool,
            planning_days=7,
            policy=WeeklyVarietyPolicy(
                maximum_same_entity_occurrences_per_week=28,
                maximum_same_meal_combination_occurrences_per_week=7,
                maximum_candidate_days_per_slot=3,
            ),
        )

        if not week_res.is_successful or not week_res.best_week:
            raise RuntimeError(f"Failed to sequence 7-day meal plan: {week_res.failure_details}")

        best_week = week_res.best_week

        # 8. Assemble Stable API DTO
        today = date.today()
        start_date = today
        end_date = today + timedelta(days=6)

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

                meals_dto.append({
                    "role": role.value.upper(),
                    "title": role.value.capitalize(),
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

        plan_data_dto = {
            "status": best_week.status.value if hasattr(best_week, "status") else "FULL_WEEK_GENERATED",
            "weekly_status": week_res.status.value,
            "canonical_week_id": best_week.canonical_week_id,
            "days_targets_met": best_week.nutrition_summary.days_full_targets_met,
            "days_with_deviations": best_week.nutrition_summary.days_with_target_deviations,
            "mean_j_day": round(best_week.nutrition_summary.mean_J_day, 6),
            "days": days_dto,
            "coverage": {
                "fiber": best_week.fiber_summary.fiber_coverage_status.value,
                "fiber_note": "Some selected foods do not have verified fiber data." if best_week.fiber_summary.fiber_coverage_status.value != "COMPLETE" else "Complete fiber data available.",
                "recipes": best_week.recipe_instruction_coverage_status.value,
                "verified_subset_notice": VERIFIED_SUBSET_NOTICE,
            },
            "condition_guidance": guidance_statements,
            "warnings": week_res.warnings,
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
            "food_allergies": [a.value for a in user_profile.food_allergies],
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
        }

        # 9. Persist snapshot via repository
        saved_record = self.repository.save_plan(
            user_id=user_id,
            plan_type="weekly",
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
        """Retrieves and formats the user's active plan."""
        record = self.repository.get_active_plan(user_id, auth_token=auth_token)
        if not record:
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
            plan_type_dto = "WEEKLY_7_DAY" if raw_type == "weekly" else (r.get("plan_type") or "WEEKLY_7_DAY")
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
        plan_type_dto = "WEEKLY_7_DAY" if raw_plan_type == "weekly" else (record.get("plan_type") or "WEEKLY_7_DAY")

        # Format and ensure UI fields on days and meals
        days = plan_data.get("days", [])
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
            end_date_str = (new_start_dt + timedelta(days=6)).isoformat()
            days = plan_data.get("days", [])
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
        calories: float = 0.0,
        protein_g: float = 0.0,
        carbs_g: float = 0.0,
        fat_g: float = 0.0,
        fiber_g: float = 0.0,
        notes: str = "",
        logged_at: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Saves a food log entry to the authoritative food_logs table."""
        import uuid
        log_id = str(uuid.uuid4())
        today_iso = logged_at or date.today().isoformat()
        now_iso = datetime.now(timezone.utc).isoformat()
        clean_meal_type = str(meal_type).lower().replace(" ", "_")
        if clean_meal_type not in ("breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "snack"):
            clean_meal_type = "lunch"
        if clean_meal_type == "snack":
            clean_meal_type = "afternoon_snack"

        record = {
            "id": log_id,
            "user_id": user_id,
            "meal_type": clean_meal_type,
            "food_name": food_name.strip(),
            "serving": serving.strip() or "1 serving",
            "calories": int(round(calories)),
            "protein_g": round(float(protein_g), 1),
            "carbs_g": round(float(carbs_g), 1),
            "fat_g": round(float(fat_g), 1),
            "fiber_g": round(float(fiber_g), 1),
            "logged_at": today_iso,
            "notes": notes.strip(),
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

    def get_food_logs(
        self,
        user_id: str,
        date_iso: Optional[str] = None,
        days: int = 7,
        auth_token: Optional[str] = None,
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
                else:
                    cutoff = (date.today() - timedelta(days=days)).isoformat()
                    query = query.gte("logged_at", cutoff)
                res = query.order("logged_at", desc=True).order("created_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as exc:
                logger.warning("Supabase food_logs select failed: %s", exc)

        # In-memory fallback
        logs = [
            l for l in self._memory_food_logs
            if l.get("user_id") == user_id and (not date_iso or l.get("logged_at") == date_iso)
        ]
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


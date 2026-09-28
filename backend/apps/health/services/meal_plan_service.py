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
    ) -> Dict[str, Any]:
        """Runs the complete readiness check and returns the structured dictionary."""
        res = MealProfileBuilder.check_nutrition_readiness(raw_user_meta_data, profile_data)
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
            "days": plan_data.get("days", []),
            "coverage": plan_data.get("coverage", {}),
            "condition_guidance": plan_data.get("condition_guidance", []),
            "warnings": plan_data.get("warnings", []),
        }


# Global singleton service
meal_plan_service = MealPlanService()

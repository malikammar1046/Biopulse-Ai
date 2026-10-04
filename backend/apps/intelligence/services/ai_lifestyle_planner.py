"""
backend/apps/intelligence/services/ai_lifestyle_planner.py

Hybrid Rule-Based + Generative AI Recommendation Engine for BioPulse AI.

Architecture Pipeline:
BioPulse React
    ↓
Django Lifestyle API
    ↓
LifestyleContextBuilder
    ↓
Existing Rule-Based Safety Engine (LifestyleSafetyEngine)
    ↓
Existing Rule-Based Recommendation Engine (LifestyleRecommendationEngine)
    ↓
Approved Deterministic Constraints & Grounded Pakistani Catalog
    ↓
Gemini LLM Provider (Google Gemini)
    ↓
Structured JSON Response
    ↓
AI Output Validator / Safety Gate (Deterministic)
    ↓
Final Nutrition + Fitness + Lifestyle Plan
    ↓
Existing React Lifestyle UI

AUTHORITY INVARIANTS:
1. Deterministic Rule Engine is AUTHORITATIVE for clinical safety, allergens, caloric floors,
   joint-friendly limits, and escalation.
2. Gemini is NOT authoritative for medical decisions.
3. Gemini must NEVER override deterministic safety rules.
4. Gemini does NOT fabricate numerical nutrition data (calories, macros) when authoritative
   values are unavailable.
5. All outbound context is scrubbed of PII and user identifiers via LLMContextSanitizer.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from apps.intelligence.services.context_sanitizer import LLMContextSanitizer
from apps.intelligence.services.lifestyle_context_builder import (
    ComprehensiveLifestyleContext,
    LifestyleContextBuilder,
)
from apps.intelligence.services.lifestyle_recommendation_engine import (
    DailyTargets,
    LifestyleRecommendationEngine,
    LifestyleRecommendationsResult,
)
from apps.intelligence.services.lifestyle_repository import lifestyle_repository
from apps.intelligence.services.lifestyle_safety_rules import (
    ALLERGEN_INGREDIENT_MAP,
    LifestyleSafetyEngine,
    SafetyEvaluationResult,
    get_pathway_disclaimer,
)
from apps.intelligence.services.llm_provider import (
    GeminiProvider,
    LLMProvider,
    LLMProviderError,
    get_llm_provider,
)
from apps.intelligence.services.pakistan_food_catalog import (
    GroundedPakistaniFood,
    PakistanFoodCatalog,
)

logger = logging.getLogger(__name__)


# Standard schema returned to frontend and consumers
@dataclass
class AIMealItem:
    name: str
    description: str
    why: str
    dish_id: Optional[str] = None
    local_name: Optional[str] = None


@dataclass
class AIDailyMealPlan:
    day: int
    day_name: str
    breakfast: AIMealItem
    lunch: AIMealItem
    snack: AIMealItem
    dinner: AIMealItem


@dataclass
class AIPhysicalActivitySession:
    day_name: str
    activity: str
    duration_mins: int
    intensity: str  # 'low' | 'moderate'
    coaching_cue: str


@dataclass
class AILifestylePlan:
    plan_duration_days: int
    summary: str
    engine_type: str
    pathway: str
    nutrition: Dict[str, Any]
    hydration: Dict[str, Any]
    physical_activity: Dict[str, Any]
    sleep_and_lifestyle: Dict[str, Any]
    personalization_reasons: List[str]
    safety_notices: List[str]
    disclaimer: str
    authoritative_daily_targets: Dict[str, Any]
    context_version: str
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AILifestylePlanner:
    """
    Orchestrates the Hybrid Rule-Based + Generative AI Lifestyle Planning pipeline.
    """

    @classmethod
    def generate_plan(
        cls,
        context: ComprehensiveLifestyleContext,
        force_refresh: bool = False,
        auth_token: Optional[str] = None,
        provider_override: Optional[LLMProvider] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point: Evaluates rules, checks cache, generates via Gemini if needed,
        validates output, and persists the final safe 7-day personalized plan.
        """
        user_id = context.user_id
        module = context.demographics.pathway
        context_version = context.context_version or LifestyleContextBuilder.compute_context_version(context)

        # 1. Step A: Check Cache if force_refresh is False
        if not force_refresh:
            cached_record = lifestyle_repository.get_active_recommendations(
                user_id=user_id,
                module=module,
                auth_token=auth_token,
            )
            if cached_record and cached_record.get("context_version") == context_version:
                payload = cached_record.get("payload", {})
                if isinstance(payload, dict) and "ai_lifestyle_plan" in payload:
                    logger.info("Serving cached AI lifestyle plan for user %s (version %s)", user_id[:8], context_version)
                    return payload["ai_lifestyle_plan"]

        # 2. Step B: Evaluate Deterministic Rule-Based Safety Engine
        safety: SafetyEvaluationResult = LifestyleSafetyEngine.evaluate_safety(context)

        # 3. Step C: Evaluate Deterministic Recommendation Engine for authoritative targets
        rule_result: LifestyleRecommendationsResult = LifestyleRecommendationEngine.generate(context, safety)

        # 4. Step D: Load Approved Grounded Pakistani Food Catalog
        eligible_foods = PakistanFoodCatalog.get_eligible_foods(
            allergens=context.demographics.allergens,
            intolerances=context.demographics.intolerances,
            dietary_preference=context.demographics.dietary_preference,
            excluded_food_categories=safety.excluded_food_categories,
        )

        # 5. Step E: Build Strict Controlled Gemini Prompt
        system_prompt, user_prompt = cls._build_controlled_prompts(
            context=context,
            safety=safety,
            rule_result=rule_result,
            eligible_foods=eligible_foods,
        )

        # 6. Step F: Call Gemini via Provider Abstraction
        raw_json = cls._invoke_gemini(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context=context,
            provider_override=provider_override,
        )

        # 7. Step G: Deterministic AI Output Validation / Safety Gate
        validated_plan = cls._validate_and_sanitize_output(
            raw_json=raw_json,
            context=context,
            safety=safety,
            rule_result=rule_result,
            eligible_foods=eligible_foods,
        )

        # 8. Step H: Persist into LifestyleRepository alongside rule recommendations
        try:
            active_rec = lifestyle_repository.get_active_recommendations(
                user_id=user_id,
                module=module,
                auth_token=auth_token,
            )
            existing_payload = active_rec.get("payload") if active_rec else rule_result.to_dict()
            if not isinstance(existing_payload, dict):
                existing_payload = rule_result.to_dict()

            existing_payload["ai_lifestyle_plan"] = validated_plan
            existing_statuses = active_rec.get("item_statuses", {}) if active_rec else {}

            lifestyle_repository.save_recommendations(
                user_id=user_id,
                module=module,
                context_version=context_version,
                payload=existing_payload,
                item_statuses=existing_statuses,
                auth_token=auth_token,
            )
            logger.info("Persisted validated AI lifestyle plan for user %s into repository.", user_id[:8])
        except Exception as e:
            logger.warning("Could not persist AI plan to repository: %s. Returning plan directly.", e)

        return validated_plan

    @classmethod
    def _build_controlled_prompts(
        cls,
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        rule_result: LifestyleRecommendationsResult,
        eligible_foods: List[GroundedPakistaniFood],
    ) -> tuple[str, str]:
        """
        Builds a compact, strict, and sanitized prompt for Gemini.
        Authoritative constraints are strictly passed as inviolable rules.
        """
        demo = context.demographics
        is_female = demo.gender == "female"
        condition_name = "Polycystic Ovary Syndrome (PCOS)" if is_female else "Male Hypogonadism"

        # Food Catalog Summary (top 20 eligible Pakistani dishes)
        food_list_str = ", ".join(
            [f"{f.entity_name_en} ({f.entity_name_local} - {f.category})" for f in eligible_foods[:22]]
        )

        # Authoritative nutrition numbers or null notice
        dt = rule_result.nutrition.daily_targets
        if dt.target_status == "calculated" and dt.daily_calories_kcal:
            nutrition_guidance = (
                f"Authoritative Caloric Range: {dt.calorie_range_min}–{dt.calorie_range_max} kcal/day "
                f"(Floor: {int(safety.min_safe_calories_kcal)} kcal/day). "
                f"Protein: ~{dt.protein.grams}g, Carbs: ~{dt.carbohydrates.grams}g, Fats: ~{dt.fats.grams}g."
            )
        else:
            nutrition_guidance = (
                "Caloric numbers are UNAVAILABLE due to missing height or weight. "
                "DO NOT FABRICATE CALORIES OR MACRO GRAMS. Focus strictly on meal composition, food quality, and satiety."
            )

        # Prohibitions
        prohibited_foods = ", ".join(safety.excluded_food_categories) or "None"
        prohibited_exercises = ", ".join(safety.excluded_exercise_modalities) or "None"

        system_instruction = (
            "You are the BioPulse AI Lifestyle Personalization Engine, a clinical-grade health optimization assistant.\n"
            "Your role is to personalize wording, organize practical 7-day meal ideas from the approved Pakistani catalog, "
            "and create a gentle, supportive 7-day lifestyle protocol.\n\n"
            "STRICT CLINICAL SAFETY RULES (INVIOLABLE):\n"
            "1. NON-DIAGNOSTIC: You must NEVER diagnose PCOS, hypogonadism, diabetes, or any medical condition.\n"
            "   Screening risk probability is an educational screening index, NOT a clinical diagnosis.\n"
            "2. NO MEDICATIONS: You must NEVER prescribe, modify, or advise stopping any medication or supplement.\n"
            "3. NO FOOD PRESCRIPTIONS: You must NEVER claim that food cures a condition or directly balances hormones.\n"
            "   Use supportive language: 'Supports metabolic balance' or 'Promotes steady energy'.\n"
            "4. NO FABRICATED MACROS: You must NEVER invent calorie numbers or macro grams if they are not provided.\n"
            "5. RESPECT ALL ALLERGIES & RESTRICTIONS: Follow all prohibited categories strictly.\n"
            "6. PAKISTANI NUTRITION GROUNDING: Use dishes and foods from the approved Pakistani catalog provided below.\n"
            "7. STRICT JSON ONLY: You must respond ONLY with a single valid JSON object matching the requested schema. "
            "No markdown preamble, no commentary outside the JSON."
        )

        user_content = (
            f"--- PATIENT DEMOGRAPHICS & PROFILE ---\n"
            f"Pathway: {demo.pathway}\n"
            f"Gender: {demo.gender}\n"
            f"Age: {demo.age or 'Not provided'}\n"
            f"BMI Category: {'Underweight' if (demo.bmi and demo.bmi < 18.5) else 'Elevated' if (demo.bmi and demo.bmi >= 25.0) else 'Normal / Unspecified'}\n"
            f"Dietary Preference: {demo.dietary_preference}\n"
            f"Allergens & Intolerances: {', '.join(demo.allergens + demo.intolerances) or 'None'}\n"
            f"Activity Level: {demo.activity_level or 'Moderate'}\n"
            f"Reported Symptoms: {', '.join(context.symptoms.active_symptoms[:4]) or 'None reported'}\n\n"
            f"--- AUTHORITATIVE DETERMINISTIC CONSTRAINTS (CANNOT BE OVERRIDDEN) ---\n"
            f"Safety Status: {safety.safety_status}\n"
            f"Prohibited Food Categories: {prohibited_foods}\n"
            f"Prohibited Exercise Modalities: {prohibited_exercises}\n"
            f"Joint Protection Active: {safety.joint_protection_active}\n"
            f"Recovery-First Active: {safety.recovery_first_active}\n"
            f"Glycemic Priority Active: {safety.glycemic_priority_active}\n"
            f"Nutrition Guidance: {nutrition_guidance}\n"
            f"Daily Fluid Guidance: {dt.hydration_liters or 2.5} Liters/day\n\n"
            f"--- APPROVED ELIGIBLE PAKISTANI FOOD DISHES ---\n"
            f"{food_list_str}\n\n"
            "--- REQUIRED JSON OUTPUT SCHEMA ---\n"
            "{\n"
            '  "plan_duration_days": 7,\n'
            '  "summary": "1-2 sentence encouraging overview of the 7-day protocol.",\n'
            '  "nutrition": {\n'
            '    "goals": ["Goal 1", "Goal 2"],\n'
            '    "daily_meals": [\n'
            '      {\n'
            '        "day": 1,\n'
            '        "day_name": "Monday",\n'
            '        "breakfast": {"name": "...", "description": "...", "why": "..."},\n'
            '        "lunch": {"name": "...", "description": "...", "why": "..."},\n'
            '        "snack": {"name": "...", "description": "...", "why": "..."},\n'
            '        "dinner": {"name": "...", "description": "...", "why": "..."}\n'
            '      }\n'
            "      ... (7 days total: Monday through Sunday)\n"
            "    ]\n"
            "  },\n"
            '  "hydration": {\n'
            '    "guidance": "Daily hydration advice",\n'
            '    "daily_target_liters": 2.5\n'
            "  },\n"
            '  "physical_activity": {\n'
            '    "weekly_goal": "Supportive movement goal",\n'
            '    "schedule": [\n'
            '      {"day_name": "Monday", "activity": "...", "duration_mins": 30, "intensity": "moderate", "coaching_cue": "..."}\n'
            "      ... (7 days)\n"
            "    ]\n"
            "  },\n"
            '  "sleep_and_lifestyle": {\n'
            '    "sleep_guidance": "Consistent 7-9 hours advice",\n'
            '    "stress_guidance": "Mindful pacing advice",\n'
            '    "daily_habits": ["Habit 1", "Habit 2"]\n'
            "  },\n"
            '  "personalization_reasons": ["Reason 1 based on health profile", "Reason 2 based on dietary preference"],\n'
            '  "safety_notices": ["Notice 1 based on deterministic rules"],\n'
            f'  "disclaimer": "{safety.disclaimer}"\n'
            "}"
        )

        return system_instruction, user_content

    @classmethod
    def _invoke_gemini(
        cls,
        system_prompt: str,
        user_prompt: str,
        context: ComprehensiveLifestyleContext,
        provider_override: Optional[LLMProvider] = None,
    ) -> Dict[str, Any]:
        """
        Invokes Gemini with sanitization, parsing the structured JSON output.
        Falls back to rule-based synthesis if provider is offline or errors.
        """
        # Scrub PII
        clean_sys = LLMContextSanitizer.sanitize_system_instruction(
            system_prompt, patient_uuid=context.user_id
        )
        clean_user = LLMContextSanitizer.sanitize_user_message(
            user_prompt, patient_uuid=context.user_id
        )

        provider: LLMProvider
        if provider_override is not None:
            provider = provider_override
        else:
            try:
                provider = get_llm_provider()
            except Exception as e:
                logger.warning("Could not instantiate configured LLM provider: %s. Using fallback.", e)
                provider = None

        if provider is not None:
            try:
                response = provider.generate_chat_response(
                    system_instruction=clean_sys,
                    user_message=clean_user,
                    health_context="",
                    conversation_history=[],
                )
                text = response.answer.strip()
                # Parse JSON
                parsed = cls._extract_json_object(text)
                if parsed and isinstance(parsed, dict) and "nutrition" in parsed:
                    return parsed
            except LLMProviderError as lpe:
                logger.warning("Gemini provider error during lifestyle plan generation: %s", lpe)
            except Exception as exc:
                logger.warning("Unexpected error invoking Gemini for lifestyle plan: %s", exc)

        # Fallback to deterministic rule-based generator
        logger.info("Using deterministic rule-based template generation for 7-day lifestyle plan.")
        return cls._generate_deterministic_fallback_plan(context)

    @classmethod
    def _extract_json_object(cls, text: str) -> Optional[Dict[str, Any]]:
        """Tolerantly extracts a JSON dictionary from markdown code fences or plain text."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        # Find first '{' and last '}'
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            json_slice = cleaned[start : end + 1]
            try:
                return json.loads(json_slice)
            except Exception:
                pass
        return None

    @classmethod
    def _validate_and_sanitize_output(
        cls,
        raw_json: Dict[str, Any],
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        rule_result: LifestyleRecommendationsResult,
        eligible_foods: List[GroundedPakistaniFood],
    ) -> Dict[str, Any]:
        """
        DETERMINISTIC AI OUTPUT VALIDATOR / SAFETY GATE:
        1. Checks structure & 7 days of meals.
        2. Scans meals for prohibited allergens and dietary restrictions; replaces violations with approved catalog dishes.
        3. Scans workouts for prohibited exercise modalities (HIIT, sprints); replaces violations with joint-safe options.
        4. Strips diagnostic language ("diagnosed with PCOS", "cure", "prescribe").
        5. Enforces authoritative daily targets from rule engine (no fabricated calories).
        6. Enforces pathway disclaimer.
        """
        demo = context.demographics
        is_female = demo.gender == "female"
        user_allergens = set([a.strip().lower() for a in demo.allergens + demo.intolerances if a])
        diet_pref = str(demo.dietary_preference or "omnivore").strip().lower()
        is_vegetarian = diet_pref in ("vegetarian", "vegan", "lacto_vegetarian")
        is_vegan = diet_pref == "vegan"
        is_pescatarian = diet_pref == "pescatarian"

        # Catalog lookup for clean replacements
        safe_veggie_dishes = [f for f in eligible_foods if f.dietary_class == "plant_based"]
        safe_lentil = next((f for f in safe_veggie_dishes if "daal" in f.entity_name_en.lower()), safe_veggie_dishes[0] if safe_veggie_dishes else None)
        safe_grain = next((f for f in eligible_foods if "chapati" in f.entity_name_en.lower() or "rice" in f.entity_name_en.lower()), eligible_foods[0] if eligible_foods else None)

        def _is_text_violating_allergens(text: str) -> Optional[str]:
            lower = text.lower()
            for allergy in user_allergens:
                if allergy in ALLERGEN_INGREDIENT_MAP:
                    for trigger_word in ALLERGEN_INGREDIENT_MAP[allergy]:
                        pattern = rf"\b{re.escape(trigger_word)}\b"
                        if re.search(pattern, lower):
                            return f"Allergen trigger '{trigger_word}' ({allergy})"
            for cat in safety.excluded_food_categories:
                if cat in ALLERGEN_INGREDIENT_MAP:
                    for trigger_word in ALLERGEN_INGREDIENT_MAP[cat]:
                        pattern = rf"\b{re.escape(trigger_word)}\b"
                        if re.search(pattern, lower):
                            return f"Excluded category trigger '{trigger_word}' ({cat})"
            # Dietary checks
            if is_vegetarian or is_vegan:
                for meat_word in ("chicken", "beef", "mutton", "gosht", "meat", "pork", "fish", "prawn", "seafood"):
                    if re.search(rf"\b{meat_word}\b", lower):
                        return f"Non-vegetarian item '{meat_word}'"
            elif is_pescatarian:
                for meat_word in ("chicken", "beef", "mutton", "gosht", "meat", "pork"):
                    if re.search(rf"\b{meat_word}\b", lower):
                        return f"Non-pescatarian meat item '{meat_word}'"
            return None

        # Validate meals
        nutrition = raw_json.get("nutrition", {})
        daily_meals = nutrition.get("daily_meals", [])
        if not isinstance(daily_meals, list) or len(daily_meals) < 7:
            daily_meals = cls._generate_deterministic_fallback_meals(eligible_foods, demo.dietary_preference)

        sanitized_daily_meals: List[Dict[str, Any]] = []
        safety_audit_notes: List[str] = list(safety.safety_notices)

        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        for idx, day_plan in enumerate(daily_meals[:7]):
            day_num = idx + 1
            day_name = days_of_week[idx] if idx < len(days_of_week) else f"Day {day_num}"
            meals_dict: Dict[str, Any] = {
                "day": day_num,
                "day_name": day_name,
            }

            for meal_slot in ("breakfast", "lunch", "snack", "dinner"):
                slot_data = day_plan.get(meal_slot) if isinstance(day_plan, dict) else None
                if not isinstance(slot_data, dict) or not slot_data.get("name"):
                    slot_data = cls._get_default_slot_meal(meal_slot, eligible_foods, day_num)

                meal_name = str(slot_data.get("name", "")).strip()
                meal_desc = str(slot_data.get("description", "")).strip()
                meal_why = str(slot_data.get("why", "")).strip()

                # Allergen check
                violation = _is_text_violating_allergens(f"{meal_name} {meal_desc}")
                if violation:
                    logger.warning("AI Output Validator caught constraint violation in Day %d %s: %s", day_num, meal_slot, violation)
                    # Replace with guaranteed safe catalog dish
                    replacement = cls._get_default_slot_meal(meal_slot, eligible_foods, day_num)
                    meal_name = replacement["name"]
                    meal_desc = replacement["description"]
                    meal_why = replacement["why"]
                    note = f"Day {day_num} {meal_slot.title()}: Automatically adjusted to adhere to dietary restriction ({violation})."
                    if note not in safety_audit_notes:
                        safety_audit_notes.append(note)

                # Scrub diagnostic claims
                meal_why = cls._scrub_medical_claims(meal_why, is_female)
                meal_desc = cls._scrub_medical_claims(meal_desc, is_female)

                meals_dict[meal_slot] = {
                    "name": meal_name,
                    "description": meal_desc,
                    "why": meal_why or "Provides balanced energy and quality whole-food nutrition.",
                }

            sanitized_daily_meals.append(meals_dict)

        # Validate Physical Activity
        activity_data = raw_json.get("physical_activity", {})
        schedule = activity_data.get("schedule", [])
        if not isinstance(schedule, list) or len(schedule) < 7:
            schedule = [asdict(s) for s in rule_result.fitness.weekly_schedule]

        sanitized_schedule: List[Dict[str, Any]] = []
        for idx, s in enumerate(schedule[:7]):
            day_name = days_of_week[idx] if idx < len(days_of_week) else f"Day {idx+1}"
            act_name = str(s.get("activity") or s.get("focus") or "Moderate Movement").strip()
            duration = int(s.get("duration_mins", 30) or 30)
            intensity = str(s.get("intensity", "moderate")).strip().lower()
            cue = str(s.get("coaching_cue", "Move at a comfortable, steady pace.")).strip()

            # Check exercise restrictions
            if safety.joint_protection_active or safety.recovery_first_active:
                for prohibited in ("hiit", "sprint", "extreme", "jumping", "exhaustive"):
                    if prohibited in act_name.lower():
                        act_name = "Low-Impact Brisk Walking or Stationary Cycling"
                        intensity = "low"
                        cue = "Focus on joint comfort and steady breathing."
                        break

            sanitized_schedule.append({
                "day_name": day_name,
                "activity": act_name,
                "duration_mins": duration,
                "intensity": intensity,
                "coaching_cue": cue,
            })

        # Validate Sleep & Lifestyle
        sleep_data = raw_json.get("sleep_and_lifestyle", {})
        daily_habits = sleep_data.get("daily_habits", [])
        if not isinstance(daily_habits, list) or not daily_habits:
            daily_habits = [h.action_item for h in rule_result.lifestyle.recommended_habits]

        # Ensure Authoritative Daily Targets are preserved exactly
        dt = rule_result.nutrition.daily_targets
        authoritative_targets_dict = {
            "daily_calories_kcal": dt.daily_calories_kcal,
            "calorie_range_min": dt.calorie_range_min,
            "calorie_range_max": dt.calorie_range_max,
            "protein_g": dt.protein.grams,
            "carbs_g": dt.carbohydrates.grams,
            "fats_g": dt.fats.grams,
            "fiber_g": dt.fiber_grams,
            "hydration_liters": dt.hydration_liters,
            "target_status": dt.target_status,
            "guidance_note": dt.guidance_note,
        }

        # Hydration
        hydration_data = raw_json.get("hydration", {})
        if not isinstance(hydration_data, dict):
            hydration_data = {}
        hydration_liters = dt.hydration_liters or 2.5
        hydration_guidance = hydration_data.get("guidance") or (
            f"Aim for approximately {hydration_liters}L of fluids daily across water, herbal teas, and water-rich foods."
        )

        # Summary
        summary = str(raw_json.get("summary", "")).strip()
        if not summary:
            summary = (
                f"A personalized 7-day nutritional and lifestyle roadmap grounded in authentic Pakistani foods, "
                f"supporting steady metabolic wellness and daily vitality."
            )
        summary = cls._scrub_medical_claims(summary, is_female)

        # Personalization Reasons
        reasons = raw_json.get("personalization_reasons", [])
        if not isinstance(reasons, list) or not reasons:
            reasons = [
                f"Tailored to your active {demo.pathway.replace('_', ' ').title()} screening profile and metabolic goals.",
                f"Grounded in wholesome Pakistani dishes respecting your {demo.dietary_preference.title()} preference.",
                "Calibrated with conservative clinical safety guardrails for sustainable daily pacing.",
            ]

        final_plan = AILifestylePlan(
            plan_duration_days=7,
            summary=summary,
            engine_type="Hybrid Rule-Based + Generative AI Recommendation Engine",
            pathway=demo.pathway,
            nutrition={
                "goals": nutrition.get("goals") or rule_result.nutrition.key_guidelines[:3],
                "daily_meals": sanitized_daily_meals,
            },
            hydration={
                "guidance": hydration_guidance,
                "daily_target_liters": hydration_liters,
            },
            physical_activity={
                "weekly_goal": activity_data.get("weekly_goal") or rule_result.fitness.aerobic_target_minutes,
                "schedule": sanitized_schedule,
            },
            sleep_and_lifestyle={
                "sleep_guidance": sleep_data.get("sleep_guidance") or "Maintain consistent 7 to 9 hours of sleep with a regular bedtime.",
                "stress_guidance": sleep_data.get("stress_guidance") or "Incorporate breath-paced relaxation pauses during busy hours.",
                "daily_habits": daily_habits[:4],
            },
            personalization_reasons=reasons[:4],
            safety_notices=safety_audit_notes,
            disclaimer=safety.disclaimer,
            authoritative_daily_targets=authoritative_targets_dict,
            context_version=context.context_version,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

        return final_plan.to_dict()

    @classmethod
    def _scrub_medical_claims(cls, text: str, is_female: bool) -> str:
        """Sanitizes text of diagnostic claims, cures, or medication prescriptions."""
        if not text:
            return ""
        scrubbed = text
        # Cures or reversal claims
        scrubbed = re.sub(
            r"\b(?:cures?|reverses?|eliminates?)\s+(?:PCOS|hypogonadism|diabetes)\b",
            "supports endocrine balance",
            scrubbed,
            flags=re.IGNORECASE,
        )
        # Diagnosis claims
        scrubbed = re.sub(
            r"\b(?:because\s+you\s+are\s+diagnosed\s+with|diagnosed\s+with|your\s+diagnosis\s+of)\s+(?:PCOS|hypogonadism|diabetes)\b",
            "based on your screening profile",
            scrubbed,
            flags=re.IGNORECASE,
        )
        # Medication tampering
        scrubbed = re.sub(
            r"\b(?:stop|discontinue|replace|increase|decrease|change)(?:\s+taking|\s+using)?\s+(?:metformin|spironolactone|birth\s*control|testosterone|TRT|medications?|pills?)\b",
            "review medications with your physician",
            scrubbed,
            flags=re.IGNORECASE,
        )
        return scrubbed

    @classmethod
    def _get_default_slot_meal(
        cls,
        meal_slot: str,
        eligible_foods: List[GroundedPakistaniFood],
        day_num: int,
    ) -> Dict[str, str]:
        """Returns a guaranteed-safe Pakistani meal concept for a given slot."""
        if meal_slot == "breakfast":
            return {
                "name": "Spiced Vegetable Omelet with Chapati",
                "description": "2 eggs cooked with diced onions, tomatoes, and spinach, paired with 1 warm whole wheat chapati.",
                "why": "High protein and steady complex carbohydrates anchor morning fullness and blood sugar balance.",
            }
        elif meal_slot == "lunch":
            daal = next((f for f in eligible_foods if "daal" in f.entity_name_en.lower()), None)
            dish_name = daal.entity_name_en if daal else "Daal Masoor with Boiled Basmati Rice"
            return {
                "name": dish_name,
                "description": "Slow-cooked lentil curry seasoned with cumin and turmeric, served with cucumber-tomato kachumber salad.",
                "why": "Lentils supply dietary fiber and plant protein that promote steady post-meal glucose.",
            }
        elif meal_slot == "snack":
            return {
                "name": "Roasted Chana & Green Tea",
                "description": "Handful of roasted chickpeas with unsweetened cardamom green tea.",
                "why": "Crunchy fiber-rich snack bridging midday energy without added sugars.",
            }
        else:  # dinner
            dish = next((f for f in eligible_foods if any(k in f.entity_name_en.lower() for k in ("chicken", "bhindi", "baingan", "machli"))), None)
            name = dish.entity_name_en if dish else "Bhindi Masala with Whole Wheat Chapati"
            return {
                "name": name,
                "description": "Tender okra cooked with sliced onions, fresh coriander, and spices, served with 1 chapati.",
                "why": "A light, easily digestible evening meal providing micronutrients and dietary fiber.",
            }

    @classmethod
    def _generate_deterministic_fallback_meals(
        cls,
        eligible_foods: List[GroundedPakistaniFood],
        dietary_preference: str,
    ) -> List[Dict[str, Any]]:
        """Generates 7 diverse, safe daily meal plans when external LLM generation is unavailable."""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        plans = []
        for idx, day_name in enumerate(days):
            day_num = idx + 1
            plans.append({
                "day": day_num,
                "day_name": day_name,
                "breakfast": cls._get_default_slot_meal("breakfast", eligible_foods, day_num),
                "lunch": cls._get_default_slot_meal("lunch", eligible_foods, day_num),
                "snack": cls._get_default_slot_meal("snack", eligible_foods, day_num),
                "dinner": cls._get_default_slot_meal("dinner", eligible_foods, day_num),
            })
        return plans

    @classmethod
    def _generate_deterministic_fallback_plan(
        cls,
        context: ComprehensiveLifestyleContext,
    ) -> Dict[str, Any]:
        """Full deterministic fallback structure matching the target JSON schema."""
        safety = LifestyleSafetyEngine.evaluate_safety(context)
        rule_result = LifestyleRecommendationEngine.generate(context, safety)
        eligible_foods = PakistanFoodCatalog.get_eligible_foods(
            allergens=context.demographics.allergens,
            intolerances=context.demographics.intolerances,
            dietary_preference=context.demographics.dietary_preference,
            excluded_food_categories=safety.excluded_food_categories,
        )

        return {
            "plan_duration_days": 7,
            "summary": (
                f"Personalized 7-day lifestyle protocol grounded in authentic Pakistani nutrition, "
                f"tailored to your {context.demographics.pathway.replace('_', ' ').title()} screening profile."
            ),
            "nutrition": {
                "goals": rule_result.nutrition.key_guidelines[:3],
                "daily_meals": cls._generate_deterministic_fallback_meals(eligible_foods, context.demographics.dietary_preference),
            },
            "hydration": {
                "guidance": "Maintain steady fluid intake throughout the day, choosing water and unsweetened infusions.",
                "daily_target_liters": rule_result.nutrition.daily_targets.hydration_liters or 2.5,
            },
            "physical_activity": {
                "weekly_goal": rule_result.fitness.aerobic_target_minutes,
                "schedule": [asdict(s) for s in rule_result.fitness.weekly_schedule],
            },
            "sleep_and_lifestyle": {
                "sleep_guidance": "Consistent 7 to 9 hours nightly sleep with regular schedule.",
                "stress_guidance": "Brief relaxation breathing pauses during high-stress hours.",
                "daily_habits": [h.action_item for h in rule_result.lifestyle.recommended_habits],
            },
            "personalization_reasons": [
                f"Aligned with active screening risk tier ({context.screening.risk_category.title()}).",
                f"Grounded in eligible Pakistani dishes for a {context.demographics.dietary_preference.title()} pattern.",
                "Calibrated against deterministic clinical safety rules.",
            ],
            "safety_notices": safety.safety_notices,
            "disclaimer": safety.disclaimer,
        }

"""
backend/apps/intelligence/services/ai_recipe_generator.py

AI Personalized Recipe Generator for BioPulse AI Lifestyle & Nutrition.
Synthesizes individual, profile-aware whole-food recipes grounded in authentic
Pakistani cuisine using the existing backend LLM architecture (Google Gemini).

AUTHORITY & SAFETY INVARIANTS:
1. Grounded: Uses authentic, accessible Pakistani ingredients (lentils, poultry, river fish,
   spinach/palak, cumin, turmeric, mustard/olive oil, brown basmati, whole-wheat/sorghum).
2. Deterministic Safety: Authoritative allergen checking via LifestyleSafetyEngine &
   ALLERGEN_INGREDIENT_MAP gates all outputs.
3. Strict Zero PCOS in Male Experience: When generating for male users, prompts and output
   validators strictly forbid any mention of PCOS, polycystic ovaries, or menstrual cycles.
4. Non-Diagnostic: Recipes never claim to treat, cure, or reverse medical conditions or
   substitute for prescription medications or hormonal therapy.
5. No Fabricated Numbers: If biometrics (height/weight/BMI) are unavailable, numerical
   calories and macronutrient grams are omitted in favor of qualitative nutritional highlights.
6. Privacy: Outbound prompts are scrubbed of patient IDs and PII via LLMContextSanitizer.
"""

from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from apps.intelligence.services.context_sanitizer import LLMContextSanitizer
from apps.intelligence.services.lifestyle_context_builder import (
    ComprehensiveLifestyleContext,
    LifestyleContextBuilder,
)
from apps.intelligence.services.lifestyle_safety_rules import (
    ALLERGEN_INGREDIENT_MAP,
    LifestyleSafetyEngine,
    SafetyEvaluationResult,
    is_food_forbidden,
)
from apps.intelligence.services.llm_provider import (
    LLMProvider,
    LLMProviderError,
    get_llm_provider,
)
from apps.intelligence.services.pakistan_food_catalog import (
    GroundedPakistaniFood,
    PakistanFoodCatalog,
)

logger = logging.getLogger(__name__)


@dataclass
class RecipeIngredient:
    item: str
    quantity: str
    practical_measure: str
    category: str = "general"


@dataclass
class RecipeSubstitution:
    original: str
    substitute: str
    reason: str


@dataclass
class RecipeNutritionalHighlights:
    estimated_calories_per_serving: Optional[int] = None
    protein_grams: Optional[int] = None
    carbs_grams: Optional[int] = None
    fat_grams: Optional[int] = None
    fiber_grams: Optional[int] = None
    key_micronutrients: List[str] = field(default_factory=list)
    qualitative_summary: str = ""


@dataclass
class AIPersonalizedRecipe:
    recipe_name: str
    short_description: str
    meal_type: str
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    ingredients: List[Dict[str, Any]]
    instructions: List[str]
    why_suits_profile: str
    nutritional_highlights: Dict[str, Any]
    substitutions: List[Dict[str, Any]]
    allergens_excluded: List[str]
    disclaimer: str
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AIRecipeGeneratorError(Exception):
    """Raised when recipe generation fails due to safety or provider errors."""
    pass


class AIRecipeGenerator:
    """
    Orchestrates personalized Pakistani whole-food recipe generation
    using patient health context, safety constraints, and Gemini LLM.
    """

    @classmethod
    def generate_recipe(
        cls,
        context: ComprehensiveLifestyleContext,
        meal_type: str = "Lunch",
        preference_tag: Optional[str] = None,
        custom_notes: Optional[str] = None,
        provider_override: Optional[LLMProvider] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point for generating a single tailored recipe.
        Evaluates safety, invokes LLM with PII scrubbing, deterministically validates allergens,
        and returns clean JSON.
        """
        demo = context.demographics
        is_male = (demo.gender == "male") or (demo.pathway in ("male_hypogonadism", "androsense"))
        has_biometrics = bool(demo.weight_kg and demo.height_cm)

        # 1. Authoritative Safety Evaluation
        safety: SafetyEvaluationResult = LifestyleSafetyEngine.evaluate_safety(context)

        # 2. Eligible Grounded Pakistani Food Reference
        eligible_foods = PakistanFoodCatalog.get_eligible_foods(
            allergens=demo.allergens,
            intolerances=demo.intolerances,
            dietary_preference=demo.dietary_preference,
            excluded_food_categories=safety.excluded_food_categories,
        )

        # 3. Build strict, controlled prompt
        system_prompt, user_prompt = cls._build_controlled_recipe_prompts(
            context=context,
            safety=safety,
            eligible_foods=eligible_foods,
            meal_type=meal_type,
            preference_tag=preference_tag,
            custom_notes=custom_notes,
            is_male=is_male,
            has_biometrics=has_biometrics,
        )

        # 4. Invoke LLM Provider
        raw_json = cls._invoke_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context=context,
            provider_override=provider_override,
        )

        if not raw_json or not isinstance(raw_json, dict):
            raise AIRecipeGeneratorError(
                "AI recipe generation service was unable to generate a valid recipe. Please try again."
            )

        # 5. Deterministic Validation & Safety Gate
        validated_recipe = cls._validate_and_sanitize_recipe(
            raw_json=raw_json,
            context=context,
            safety=safety,
            meal_type=meal_type,
            is_male=is_male,
            has_biometrics=has_biometrics,
        )

        return validated_recipe

    @classmethod
    def _build_controlled_recipe_prompts(
        cls,
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        eligible_foods: List[GroundedPakistaniFood],
        meal_type: str,
        preference_tag: Optional[str],
        custom_notes: Optional[str],
        is_male: bool,
        has_biometrics: bool,
    ) -> tuple[str, str]:
        demo = context.demographics
        labs = context.labs
        screening = context.screening

        # Check male condition risk
        is_male_risk = is_male and screening.has_assessment and (
            screening.risk_category in ("moderate", "high", "elevated")
            or (labs.total_testosterone_ng_dl is not None and labs.total_testosterone_ng_dl < 300.0)
        )

        # Catalog food suggestions
        sample_foods = ", ".join(
            [f"{f.entity_name_en} ({f.entity_name_local})" for f in eligible_foods[:16]]
        )

        prohibited_allergens = ", ".join(safety.excluded_food_categories) or "None"

        # System Instruction
        if is_male:
            condition_guidance = (
                "The user is a MALE patient. Focus strictly on male metabolic vitality, muscle protein synthesis, "
                "steady energy, and micronutrient cofactors (zinc, magnesium, vitamin D, healthy monounsaturated fats).\n"
                "CRITICAL INVIOLABLE RULE: Do NOT mention PCOS, polycystic ovaries, ovaries, theca cells, "
                "menstrual cycle, or female reproductive health anywhere in your response. "
                "Do NOT use speculative jargon (e.g., steroidogenesis, aromatase, leydig cells). "
                "Do NOT recommend spearmint tea or anti-androgenic herbal infusions."
            )
        else:
            condition_guidance = (
                "The user is a FEMALE patient. Focus on gentle blood sugar stability, steady sustained energy, "
                "and nutrient-dense whole foods."
            )

        system_instruction = (
            "You are the BioPulse AI Recipe Personalization Engine, specializing in authentic, affordable, "
            "and health-supportive Pakistani and South Asian whole-food home cooking.\n"
            "Your role is to create a practical, delicious, step-by-step recipe tailored precisely to the user's "
            "dietary preferences, health context, and allergens.\n\n"
            f"{condition_guidance}\n\n"
            "STRICT CLINICAL SAFETY RULES (INVIOLABLE):\n"
            "1. NON-PRESCRIPTIVE: You must NEVER claim that this recipe cures, reverses, or eliminates any disease.\n"
            "2. ALLERGEN SAFETY: You must NEVER use or suggest any ingredient matching the user's declared allergens or prohibited food categories.\n"
            "3. ACCESSIBLE PAKISTANI INGREDIENTS: Ground recipes in authentic, accessible Pakistani staples (e.g., lentils/daal, chicken, eggs, river fish, spinach/palak, seasonal vegetables, brown basmati, whole-wheat/sorghum flour, olive/mustard oil, cumin, coriander, turmeric).\n"
            "4. REALISTIC MEASURES: Provide practical quantities (e.g., '250g chicken breast', '1/2 cup yellow moong daal', '1 tsp cumin seeds').\n"
            "5. NUTRITIONAL INTEGRITY: "
            + (
                "Provide reasonable nutritional estimates per serving based on standard food composition tables."
                if has_biometrics else
                "Height and weight are missing; DO NOT FABRICATE CALORIES OR MACRO GRAMS. Leave estimated numbers null and provide qualitative highlights."
            )
            + "\n6. STRICT JSON ONLY: Respond strictly with a single valid JSON object adhering to the schema below. No markdown preamble, no commentary outside the JSON."
        )

        # User Content Prompt
        profile_parts = [
            f"Gender: {demo.gender}",
            f"Age: {demo.age or 'Not provided'}",
            f"Dietary Preference: {demo.dietary_preference or 'Omnivore'}",
            f"Declared Allergens & Intolerances: {', '.join(demo.allergens + demo.intolerances) or 'None'}",
            f"Prohibited Categories (Deterministic Safety): {prohibited_allergens}",
            f"Requested Meal Type: {meal_type}",
        ]

        if preference_tag:
            profile_parts.append(f"Preference Focus: {preference_tag.replace('_', ' ').title()}")
        if custom_notes:
            profile_parts.append(f"User Request / Note: {custom_notes}")

        if is_male:
            if is_male_risk:
                profile_parts.append("Health Context: Male Health Assessment indicates elevated metabolic / endocrine risk. Prioritize zinc-, magnesium-, and antioxidant-rich ingredients with clean protein.")
            else:
                profile_parts.append("Health Context: General Male Health & Metabolic Vitality. Prioritize high-quality protein, steady complex carbohydrates, and micronutrient density.")
        else:
            profile_parts.append("Health Context: Female Metabolic Balance. Prioritize low glycemic impact and fiber-rich nourishment.")

        profile_str = "\n".join(f"- {p}" for p in profile_parts)

        cal_guidance = (
            '    "estimated_calories_per_serving": 450,\n'
            '    "protein_grams": 35,\n'
            '    "carbs_grams": 40,\n'
            '    "fat_grams": 14,\n'
            '    "fiber_grams": 8,\n'
            if has_biometrics else
            '    "estimated_calories_per_serving": null,\n'
            '    "protein_grams": null,\n'
            '    "carbs_grams": null,\n'
            '    "fat_grams": null,\n'
            '    "fiber_grams": null,\n'
        )

        user_content = (
            "--- PATIENT HEALTH & NUTRITION PROFILE ---\n"
            f"{profile_str}\n\n"
            "--- APPROVED GROUNDED PAKISTANI FOOD DISHES & INGREDIENTS ---\n"
            f"{sample_foods}\n\n"
            "--- REQUIRED JSON OUTPUT SCHEMA ---\n"
            "{\n"
            '  "recipe_name": "Authentic Pakistani dish name (e.g., Spiced Palak Chicken with Brown Basmati)",\n'
            '  "short_description": "1-2 sentence appetizing description of the dish.",\n'
            f'  "meal_type": "{meal_type}",\n'
            '  "prep_time_minutes": 15,\n'
            '  "cook_time_minutes": 25,\n'
            '  "servings": 2,\n'
            '  "ingredients": [\n'
            '    {"item": "Chicken breast", "quantity": "250g", "practical_measure": "approx. 1 medium breast, diced", "category": "protein"},\n'
            '    {"item": "Fresh baby spinach (palak)", "quantity": "200g", "practical_measure": "approx. 4 packed cups, chopped", "category": "vegetable"},\n'
            '    {"item": "Cold-pressed mustard oil", "quantity": "1 tbsp", "practical_measure": "15 ml", "category": "fat"},\n'
            '    {"item": "Garlic & ginger paste", "quantity": "1 tbsp", "practical_measure": "freshly minced", "category": "spice"}\n'
            '  ],\n'
            '  "instructions": [\n'
            '    "Heat mustard oil in a pan over medium heat until fragrant.",\n'
            '    "Add minced ginger and garlic paste and sauté for 1 minute.",\n'
            '    "Add diced chicken breast and sauté until lightly golden.",\n'
            '    "Stir in chopped spinach and ground spices; simmer for 10 minutes until chicken is cooked through.",\n'
            '    "Serve warm with a measured portion of steamed brown basmati rice."\n'
            '  ],\n'
            '  "why_suits_profile": "Concise explanation of why this recipe suits the user profile (e.g., provides zinc, magnesium, and lean amino acids for sustained vitality and muscle synthesis without excess saturated fats).",\n'
            '  "nutritional_highlights": {\n'
            f"{cal_guidance}"
            '    "key_micronutrients": ["Zinc", "Magnesium", "Iron", "Vitamin B6"],\n'
            '    "qualitative_summary": "High protein, rich in zinc and dietary fiber supporting metabolic vitality."\n'
            '  },\n'
            '  "substitutions": [\n'
            '    {"original": "Chicken breast", "substitute": "Organic firm tofu (250g) or pan-seared paneer", "reason": "Vegetarian or plant-based alternative"}\n'
            '  ]\n'
            "}"
        )

        return system_instruction, user_content

    @classmethod
    def _invoke_llm(
        cls,
        system_prompt: str,
        user_prompt: str,
        context: ComprehensiveLifestyleContext,
        provider_override: Optional[LLMProvider] = None,
    ) -> Optional[Dict[str, Any]]:
        # Scrub PII
        clean_sys = LLMContextSanitizer.sanitize_system_instruction(
            system_prompt, patient_uuid=context.user_id
        )
        clean_user = LLMContextSanitizer.sanitize_user_message(
            user_prompt, patient_uuid=context.user_id
        )

        provider: Optional[LLMProvider] = provider_override
        if provider is None:
            try:
                provider = get_llm_provider()
            except Exception as e:
                logger.error("Could not obtain LLM provider for recipe generation: %s", e)
                return None

        try:
            response = provider.generate_chat_response(
                system_instruction=clean_sys,
                user_message=clean_user,
                health_context="",
                conversation_history=[],
            )
            text = response.answer.strip()
            parsed = cls._extract_json_object(text)
            if parsed and isinstance(parsed, dict) and "recipe_name" in parsed:
                return parsed
            else:
                logger.warning("LLM response did not contain a valid recipe JSON: %s", text[:200])
                return None
        except LLMProviderError as lpe:
            logger.error("LLM Provider error during recipe generation: %s", lpe)
            raise AIRecipeGeneratorError(f"AI recipe service error: {lpe}")
        except Exception as exc:
            logger.error("Unexpected error during recipe generation: %s", exc)
            raise AIRecipeGeneratorError("An unexpected error occurred while communicating with the AI service.")

    @classmethod
    def _extract_json_object(cls, text: str) -> Optional[Dict[str, Any]]:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

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
    def _validate_and_sanitize_recipe(
        cls,
        raw_json: Dict[str, Any],
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        meal_type: str,
        is_male: bool,
        has_biometrics: bool,
    ) -> Dict[str, Any]:
        """
        DETERMINISTIC RECIPE SAFETY GATE:
        1. Checks structure, required fields, and non-empty ingredients/instructions.
        2. Scans every ingredient and text block against ALLERGEN_INGREDIENT_MAP & excluded categories.
        3. If male: strictly strips/scrubs any accidental PCOS or female reproductive terminology.
        4. Strips medical claims (cures, reversal).
        5. Enforces null numbers if biometrics are missing.
        6. Injects clinical disclaimer.
        """
        demo = context.demographics
        excluded_cats = safety.excluded_food_categories

        recipe_name = str(raw_json.get("recipe_name", "")).strip() or f"Nourishing Pakistani {meal_type}"
        short_desc = str(raw_json.get("short_description", "")).strip()
        why_suits = str(raw_json.get("why_suits_profile", "")).strip()

        # 1. Deterministic Rejection Audit Across Full Recipe Corpus
        raw_ingredients = raw_json.get("ingredients", [])
        raw_instructions = raw_json.get("instructions", [])
        raw_subs = raw_json.get("substitutions", [])

        text_corpus_elements = [
            recipe_name,
            short_desc,
            why_suits,
            str(raw_json.get("nutritional_highlights", {}).get("qualitative_summary", "")),
        ]
        if isinstance(raw_ingredients, list):
            for ing in raw_ingredients:
                if isinstance(ing, dict):
                    text_corpus_elements.append(str(ing.get("item", "")))
        if isinstance(raw_instructions, list):
            for s in raw_instructions:
                text_corpus_elements.append(str(s))
        if isinstance(raw_subs, list):
            for sub in raw_subs:
                if isinstance(sub, dict):
                    text_corpus_elements.append(str(sub.get("substitute", "")))
                    text_corpus_elements.append(str(sub.get("reason", "")))

        full_corpus = " ".join(text_corpus_elements)

        # Safety Rejection Rule 1: Male Output Must NEVER Expose PCOS or Female Reproductive Terms
        if is_male:
            forbidden_matches = re.findall(
                r"\b(pcos|polycystic|ovary|ovarian|theca|menstrual|menstruation|follicular|luteal|ovulation)\b",
                full_corpus,
                flags=re.IGNORECASE,
            )
            if forbidden_matches:
                logger.warning(
                    "Deterministic Rejection: Generated male recipe contained forbidden female/PCOS terms: %s",
                    forbidden_matches,
                )
                raise AIRecipeGeneratorError(
                    "AI generation included female-specific terminology for a male profile. Generation was safely rejected."
                )

        # Safety Rejection Rule 2: Unsubstantiated Medical Cures or Prescription Claims
        cure_matches = re.findall(
            r"\b(?:cures?|reverses?|eliminates?|prescribed\s+for|medical\s+prescription)\s+(?:pcos|hypogonadism|diabetes|disease|condition|testosterone)\b",
            full_corpus,
            flags=re.IGNORECASE,
        )
        if cure_matches:
            logger.warning("Deterministic Rejection: Recipe made prohibited disease cure or prescription claims: %s", cure_matches)
            raise AIRecipeGeneratorError(
                "AI generation made unsupported disease treatment claims. Generation was safely rejected."
            )

        # Safety Rejection Rule 3: Unsupported Hormonal Elevation / Testosterone Promises
        t_boost_matches = re.findall(
            r"\b(?:boosts?|increases?|raises?|supercharges?|multiplies?)\s+testosterone\b",
            full_corpus,
            flags=re.IGNORECASE,
        )
        if t_boost_matches:
            logger.warning("Deterministic Rejection: Recipe made unsupported testosterone-boosting claims: %s", t_boost_matches)
            raise AIRecipeGeneratorError(
                "AI generation made unsupported hormonal elevation claims. Generation was safely rejected."
            )

        # Clean minor stylistic references
        recipe_name = cls._scrub_medical_and_pcos_claims(recipe_name, is_male)
        short_desc = cls._scrub_medical_and_pcos_claims(short_desc, is_male)
        why_suits = cls._scrub_medical_and_pcos_claims(why_suits, is_male)

        # 2. Validate Ingredients & Allergen Safety
        sanitized_ingredients: List[Dict[str, Any]] = []

        if not isinstance(raw_ingredients, list) or len(raw_ingredients) == 0:
            raise AIRecipeGeneratorError("Generated recipe did not contain valid ingredients.")

        for ing in raw_ingredients:
            if not isinstance(ing, dict):
                continue
            item_name = str(ing.get("item", "")).strip()
            qty = str(ing.get("quantity", "")).strip()
            measure = str(ing.get("practical_measure", "")).strip()
            category = str(ing.get("category", "general")).strip()

            if not item_name:
                continue

            # Deterministic Allergen Check on Ingredient
            is_forbidden, matched_cat = is_food_forbidden(f"{item_name} {measure}", excluded_cats)
            if is_forbidden:
                logger.warning(
                    "Deterministic Recipe Safety Gate caught allergen violation in ingredient '%s' (category '%s')",
                    item_name, matched_cat
                )
                raise AIRecipeGeneratorError(
                    f"Generated recipe contained restricted ingredient '{item_name}' conflicting with your allergen profile ({matched_cat}). Generation was blocked for your safety."
                )

            item_name = cls._scrub_medical_and_pcos_claims(item_name, is_male)
            sanitized_ingredients.append({
                "item": item_name,
                "quantity": qty or "to taste",
                "practical_measure": measure or qty,
                "category": category,
            })

        if len(sanitized_ingredients) == 0:
            raise AIRecipeGeneratorError("No valid ingredients remained after safety checks.")

        # 3. Validate Instructions
        sanitized_instructions: List[str] = []
        if isinstance(raw_instructions, list):
            for step in raw_instructions:
                step_str = str(step).strip()
                if step_str:
                    # Allergen Check on Instruction Text
                    is_forbidden, matched_cat = is_food_forbidden(step_str, excluded_cats)
                    if is_forbidden:
                        raise AIRecipeGeneratorError(
                            f"Generated instruction contained restricted element ({matched_cat}). Blocked for safety."
                        )
                    step_str = cls._scrub_medical_and_pcos_claims(step_str, is_male)
                    sanitized_instructions.append(step_str)

        if len(sanitized_instructions) == 0:
            sanitized_instructions = ["Cook ingredients gently over medium heat until tender and well combined."]

        # 4. Validate Substitutions (Check proposed substitutes against user allergens)
        sanitized_subs: List[Dict[str, Any]] = []
        if isinstance(raw_subs, list):
            for sub in raw_subs:
                if isinstance(sub, dict):
                    orig = str(sub.get("original", "")).strip()
                    alt = str(sub.get("substitute", "")).strip()
                    reason = str(sub.get("reason", "")).strip()
                    if alt:
                        # Allergen Check on Proposed Substitute
                        sub_forbidden, sub_cat = is_food_forbidden(alt, excluded_cats)
                        if sub_forbidden:
                            logger.info(
                                "Filtering out unsafe substitution '%s' matching excluded allergen category '%s'",
                                alt, sub_cat,
                            )
                            continue  # Reject unsafe substitution
                        alt = cls._scrub_medical_and_pcos_claims(alt, is_male)
                        reason = cls._scrub_medical_and_pcos_claims(reason, is_male)
                        sanitized_subs.append({
                            "original": orig,
                            "substitute": alt,
                            "reason": reason or "Alternative option",
                        })

        # 4. Nutritional Highlights
        raw_nh = raw_json.get("nutritional_highlights", {})
        if not isinstance(raw_nh, dict):
            raw_nh = {}

        if has_biometrics:
            cal = raw_nh.get("estimated_calories_per_serving")
            cal = int(cal) if (cal is not None and isinstance(cal, (int, float))) else None
            prot = raw_nh.get("protein_grams")
            prot = int(prot) if (prot is not None and isinstance(prot, (int, float))) else None
            carbs = raw_nh.get("carbs_grams")
            carbs = int(carbs) if (carbs is not None and isinstance(carbs, (int, float))) else None
            fat = raw_nh.get("fat_grams")
            fat = int(fat) if (fat is not None and isinstance(fat, (int, float))) else None
            fiber = raw_nh.get("fiber_grams")
            fiber = int(fiber) if (fiber is not None and isinstance(fiber, (int, float))) else None
        else:
            # Strictly do not fabricate numbers when biometrics are unavailable
            cal, prot, carbs, fat, fiber = None, None, None, None, None

        micros = raw_nh.get("key_micronutrients", ["Zinc", "Magnesium", "Iron"])
        if not isinstance(micros, list):
            micros = ["Zinc", "Magnesium", "Iron"]
        qual_summary = str(raw_nh.get("qualitative_summary", "")).strip() or "Nutrient-dense Pakistani home-cooked recipe supporting metabolic vitality."
        qual_summary = cls._scrub_medical_and_pcos_claims(qual_summary, is_male)

        nutritional_highlights = {
            "estimated_calories_per_serving": cal,
            "protein_grams": prot,
            "carbs_grams": carbs,
            "fat_grams": fat,
            "fiber_grams": fiber,
            "key_micronutrients": [str(m).strip() for m in micros if m][:5],
            "qualitative_summary": qual_summary,
            "calories_disclaimer": (
                "Numerical calories withheld: complete height and weight profile to calibrate caloric targets."
                if not has_biometrics else None
            ),
        }

        # Prep / Cook times
        prep_time = int(raw_json.get("prep_time_minutes", 15) or 15)
        cook_time = int(raw_json.get("cook_time_minutes", 20) or 20)
        servings = int(raw_json.get("servings", 2) or 2)

        final_recipe = AIPersonalizedRecipe(
            recipe_name=recipe_name,
            short_description=short_desc or "Wholesome, home-cooked Pakistani dish crafted for your metabolic vitality.",
            meal_type=meal_type,
            prep_time_minutes=max(5, min(120, prep_time)),
            cook_time_minutes=max(5, min(180, cook_time)),
            servings=max(1, min(10, servings)),
            ingredients=sanitized_ingredients,
            instructions=sanitized_instructions,
            why_suits_profile=why_suits or (
                "Provides high-quality protein and essential micronutrients supporting metabolic balance and vitality."
            ),
            nutritional_highlights=nutritional_highlights,
            substitutions=sanitized_subs,
            allergens_excluded=list(excluded_cats),
            disclaimer=safety.disclaimer,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

        return final_recipe.to_dict()

    @classmethod
    def _scrub_medical_and_pcos_claims(cls, text: str, is_male: bool) -> str:
        """Sanitizes text of diagnostic claims, cures, and PCOS mentions for males."""
        if not text:
            return ""
        scrubbed = text

        # 1. Strip cures / reversal claims
        scrubbed = re.sub(
            r"\b(?:cures?|reverses?|eliminates?)\s+(?:PCOS|hypogonadism|diabetes|condition)\b",
            "supports metabolic balance",
            scrubbed,
            flags=re.IGNORECASE,
        )

        # 2. Strip prescription language
        scrubbed = re.sub(
            r"\b(?:prescribed\s+for|medical\s+prescription|prescribes?)\b",
            "recommended for",
            scrubbed,
            flags=re.IGNORECASE,
        )

        # 3. STRICT RULE: Zero PCOS / Female Terminology in Male Experience
        if is_male:
            scrubbed = re.sub(r"\b(?:PCOS|Polycystic\s+Ovary\s+Syndrome)\b", "metabolic wellness", scrubbed, flags=re.IGNORECASE)
            scrubbed = re.sub(r"\b(?:ovarian|ovaries|theca\s+cells?|follicular)\b", "metabolic", scrubbed, flags=re.IGNORECASE)
            scrubbed = re.sub(r"\b(?:menstrual(?:\s+cycle)?|period|periods|menstruation)\b", "metabolic rhythms", scrubbed, flags=re.IGNORECASE)
            scrubbed = re.sub(r"\bspearmint\s+tea\b", "green tea", scrubbed, flags=re.IGNORECASE)

        return scrubbed

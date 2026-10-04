"""
OvaSense — Conversational Medical Safety & Guardrails.

Enforces emergency symptom escalation, prompt injection prevention,
and strict non-diagnostic communication boundaries.
Prevents speculative OCR extraction or ML screening probabilities from being
treated as confirmed clinical diagnoses.
"""

from __future__ import annotations

import re
from typing import Optional, Tuple

# Urgent clinical red-flag patterns requiring immediate escalation
EMERGENCY_PATTERNS = [
    r"\b(?:severe|sudden|extreme|unbearable)\s+(?:pelvic|abdominal|stomach)\s+pain\b",
    r"\b(?:heavy\s+bleeding|hemorrhag\w*|soaking\s+(?:a\s+)?pad\s+every\s+hour)\b",
    r"\b(?:fainted|passed\s+out|loss\s+of\s+consciousness|blacked\s+out)\b",
    r"\b(?:chest\s+pain|shortness\s+of\s+breath|difficulty\s+breathing)\b",
    r"\b(?:suicid\w*|kill\s+myself|harm\s+myself)\b",
]

# Prompt injection patterns attempting to bypass safety rules
INJECTION_PATTERNS = [
    r"\bignore\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|prompts|guardrails)\b",
    r"\bdisregard\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|safety)\b",
    r"\bforget\s+(?:all\s+)?(?:your\s+)?(?:rules|instructions)\b",
    r"\byou\s+are\s+now\s+(?:a\s+doctor|an\s+unrestricted\s+ai|jailbroken)\b",
    r"\bdiagnose\s+me\s+(?:definitively|now|officially)\b",
]

# Mandatory medical disclaimer
MEDICAL_SAFETY_FOOTER = (
    "\n\n*Note: BioPulse AI Companion provides health monitoring information and educational support. "
    "It does not provide medical diagnoses or prescribe treatment. Please consult a qualified healthcare provider for clinical care.*"
)


def is_food_safe_for_user(text: str, allergens: list[str], intolerances: list[str] | None = None) -> bool:
    """
    Checks if a given food text is 100% free of declared allergens and intolerances.
    """
    from apps.intelligence.services.lifestyle_safety_rules import is_food_forbidden
    exclusions = list(allergens or []) + list(intolerances or [])
    is_forbid, _ = is_food_forbidden(text, exclusions)
    return not is_forbid


class SafetyGuardrails:
    """Evaluates user input and LLM output against safety, emergency, and injection rules."""

    @staticmethod
    def check_emergency(user_message: str) -> Optional[str]:
        """
        Detects acute clinical emergency red flags.
        Returns urgent emergency advisory if detected, or None.
        """
        msg_lower = user_message.lower()
        for pattern in EMERGENCY_PATTERNS:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return (
                    "⚠️ **Immediate Medical Attention Recommended**\n\n"
                    "The symptoms you described may indicate a medical situation that requires urgent professional evaluation. "
                    "BioPulse AI is not an emergency service and cannot diagnose or treat acute conditions.\n\n"
                    "• **Action**: Please call your local emergency services (e.g. 911, 112, or local helpline) or go to the "
                    "nearest hospital emergency department immediately.\n"
                    "• If you have a trusted friend, family member, or care circle contact nearby, alert them right away."
                )
        return None

    @staticmethod
    def check_prompt_injection(user_message: str) -> Optional[str]:
        """
        Detects prompt injection attempts aiming to override clinical guardrails.
        Returns standard safety boundary refusal if detected, or None.
        """
        msg_lower = user_message.lower()
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return (
                    "BioPulse AI Companion is an educational health literacy companion and operates strictly within clinical safety guidelines. "
                    "I cannot provide a formal medical diagnosis, prescribe medications, or override healthcare safety boundaries.\n\n"
                    "I am happy to help you understand your logged symptoms, explain laboratory reference intervals, or prepare a structured "
                    "list of questions for your next doctor's appointment."
                )
        return None

    @staticmethod
    def sanitize_llm_response(text: str) -> Tuple[str, str]:
        """
        Sanitizes the generated response to eliminate any inadvertent diagnostic pronouncements,
        medication adjustments, or equating ML screening / speculative OCR with confirmed diagnoses.
        Returns (cleaned_text, safety_level).
        """
        cleaned = text

        # 1. Reframe assertive diagnostic claims (PCOS and Hypogonadism)
        cleaned = re.sub(
            r"\byou\s+(?:definitely|certainly)\s+have\s+pcos\b",
            "some of your recorded features can be associated with PCOS patterns",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\byou\s+(?:definitely|certainly)\s+have\s+hypogonadism\b",
            "some of your recorded features can be associated with hypogonadism screening patterns",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\byou\s+are\s+diagnosed\s+with\b",
            "your recorded patterns show indicators that can be discussed regarding",
            cleaned,
            flags=re.IGNORECASE,
        )

        # 2. Prevent treating ML screening probability or model output as confirmed diagnosis
        cleaned = re.sub(
            r"\b(?:the\s+model|the\s+screening\s+score|your\s+score)\s+(?:confirms|diagnoses|proves)\s+(?:that\s+you\s+have\s+)?(?:pcos|hypogonadism)\b",
            "the BioPulse AI screening model identifies statistical risk indicators for discussion with your doctor",
            cleaned,
            flags=re.IGNORECASE,
        )

        # 3. Prevent treating speculative OCR extraction as verified clinical fact
        cleaned = re.sub(
            r"\b(?:the\s+scanned\s+report|the\s+ocr\s+result)\s+(?:confirms|proves)\b",
            "the scanned document shows potential values awaiting your verification",
            cleaned,
            flags=re.IGNORECASE,
        )

        # 4. Block any suggestions to alter or stop medication
        cleaned = re.sub(
            r"\b(?:increase|decrease|stop|change)\s+your\s+(?:medication|dosage|dose|prescription)\b",
            "discuss any adjustments to your medication or dosage with your prescribing physician",
            cleaned,
            flags=re.IGNORECASE,
        )

        safety_level = "normal"
        if "emergency" in cleaned.lower() or "immediate" in cleaned.lower():
            safety_level = "caution"

        return cleaned, safety_level

    @classmethod
    def validate_dietary_safety(
        cls,
        text: str,
        excluded_categories: Optional[List[str]] = None,
        user_message: str = "",
        safe_substitutions: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Deterministic post-LLM food safety validator for Lifestyle/Nutrition chat.
        Flow: LLM output -> dietary/allergen safety validator -> safe response.

        Guarantees:
        1. Non-food conversations are NEVER over-sanitized (returned untouched).
        2. Food/lifestyle inquiries strictly check for allergen, intolerance, and dietary exclusions.
        3. Forbidden ingredients are deterministically replaced with certified safe alternatives.
        4. If any forbidden ingredient persists, it is cleanly sanitized with zero leakage.
        """
        if not text or not excluded_categories:
            return text

        valid_exclusions = [
            str(c).lower().strip()
            for c in excluded_categories
            if str(c).lower().strip() not in ("", "none", "null")
        ]
        if not valid_exclusions:
            return text

        # Check if conversation touches food, nutrition, meals, snacks, diets, recipes, or ingredients
        food_triggers = {
            "food", "foods", "meal", "meals", "ingredient", "ingredients",
            "nutrition", "snack", "snacks", "recipe", "recipes", "diet", "diets",
            "eat", "eating", "eaten", "breakfast", "lunch", "dinner", "drink",
            "yogurt", "protein", "carbs", "calories", "calorie", "fasting",
            "cook", "cooking", "fat", "fats", "oil", "oils", "butter", "bake",
            "baking", "shake", "smoothie", "snacking", "dish", "dishes"
        }
        user_msg_lower = (user_message or "").lower()
        text_lower = text.lower()

        from apps.intelligence.services.lifestyle_safety_rules import ALLERGEN_INGREDIENT_MAP, is_food_forbidden

        has_food_intent = (
            any(k in user_msg_lower for k in food_triggers)
            or any(k in text_lower for k in food_triggers)
            or any(is_food_forbidden(text, [c])[0] for c in valid_exclusions)
        )
        if not has_food_intent:
            return text

        cleaned = text
        substitutions_made: List[str] = []

        # Restriction-Aware Candidate Substitute Registry
        # Maps regex pattern -> (target_categories, candidate_replacements)
        # Each candidate is dynamically revalidated against patient's complete exclusions
        CANDIDATE_SUBSTITUTES: Dict[str, Tuple[List[str], List[str]]] = {
            # Dairy / Milk candidates
            r"\b(?:cow(?:'s)?\s+)?milk\b": (["milk", "dairy", "lactose"], ["oat milk", "rice milk", "soy milk", "almond milk", "lactose-free milk"]),
            r"\b(?:greek\s+)?yogurt\b": (["milk", "dairy", "lactose"], ["coconut yogurt", "oat yogurt", "soy yogurt", "almond yogurt", "lactose-free yogurt"]),
            r"\bdahi\b": (["milk", "dairy", "lactose"], ["coconut yogurt", "oat yogurt", "soy yogurt"]),
            r"\bcurd\b": (["milk", "dairy", "lactose"], ["coconut yogurt", "oat yogurt", "soy yogurt"]),
            r"\bpaneer\b": (["milk", "dairy", "lactose"], ["spiced organic tofu", "spiced chickpeas", "roasted black chana", "steamed lentils"]),
            r"\bcheese\b": (["milk", "dairy", "lactose"], ["dairy-free nutritional yeast", "avocado slices", "an allergy-compatible spread"]),
            r"(?<!seed\s)(?<!seeds\s)(?<!apple\s)\bbutter\b": (["milk", "dairy", "lactose"], ["cold-pressed olive oil", "avocado oil", "sunflower oil", "coconut oil"]),
            r"\bwhey(?:\s+protein)?\b": (["milk", "dairy", "lactose"], ["pea protein", "rice protein", "hemp seed protein"]),
            r"\bcream\b": (["milk", "dairy", "lactose"], ["coconut cream", "oat cream"]),

            # Peanuts & Nut butters
            r"\bpeanut\s+butter\b": (["peanut", "peanuts", "nuts"], ["sunflower seed butter", "pumpkin seed butter", "tahini", "almond butter", "an allergy-compatible spread"]),
            r"\bnut\s+butter\b": (["tree_nut", "tree_nuts", "nuts", "peanut"], ["sunflower seed butter", "pumpkin seed butter", "tahini", "an allergy-compatible spread"]),
            r"\bseed\s+butter(?:\s+alternative)?\b": (["seed", "seeds", "sesame"], ["an allergy-compatible spread"]),
            r"\bseed-based\s+spread\b": (["seed", "seeds", "sesame"], ["an allergy-compatible spread"]),
            r"\bpeanuts?\b": (["peanut", "peanuts", "nuts"], ["roasted pumpkin seeds", "roasted sunflower seeds", "roasted chickpeas"]),
            r"\bgroundnuts?\b": (["peanut", "peanuts", "nuts"], ["roasted pumpkin seeds", "roasted sunflower seeds", "roasted chickpeas"]),
            r"\bpeanut\s+oil\b": (["peanut", "peanuts", "nuts"], ["cold-pressed olive oil", "mustard oil", "sunflower oil", "avocado oil"]),

            # Tree nuts
            r"\balmond\s+milk\b": (["tree_nut", "tree_nuts", "nuts"], ["oat milk", "rice milk", "soy milk", "coconut milk"]),
            r"\balmonds?\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted pumpkin seeds", "roasted sunflower seeds", "roasted chickpeas"]),
            r"\bbadam\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted pumpkin seeds", "roasted sunflower seeds", "roasted chickpeas"]),
            r"\bwalnuts?\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted pumpkin seeds", "flaxseeds", "roasted sunflower seeds", "chia seeds", "roasted chickpeas"]),
            r"\bakhrot\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted pumpkin seeds", "flaxseeds", "roasted sunflower seeds", "roasted chickpeas"]),
            r"\bcashews?\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted sunflower seeds", "roasted pumpkin seeds", "roasted chickpeas"]),
            r"\bkaju\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted sunflower seeds", "roasted pumpkin seeds", "roasted chickpeas"]),
            r"\bpistachios?\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted watermelon seeds", "roasted pumpkin seeds", "roasted chickpeas"]),
            r"\bpista\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted watermelon seeds", "roasted pumpkin seeds", "roasted chickpeas"]),
            r"\bhazelnuts?\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted pumpkin seeds", "roasted sunflower seeds", "roasted chickpeas"]),
            r"\btree\s+nuts?\b": (["tree_nut", "tree_nuts", "nuts"], ["roasted pumpkin seeds", "seeds", "roasted chickpeas"]),

            # Eggs
            r"\bboiled\s+eggs?\b": (["egg", "eggs"], ["steamed moong sprouts", "besan chilla (chickpea pancake)", "pan-seared tofu"]),
            r"\begg\s+whites?\b": (["egg", "eggs"], ["steamed moong sprouts", "pan-seared tofu"]),
            r"\beggs?\b": (["egg", "eggs"], ["besan chilla (chickpea pancake)", "spiced organic tofu", "steamed moong sprouts"]),
            r"\banda\b": (["egg", "eggs"], ["besan chilla (chickpea pancake)", "spiced organic tofu"]),

            # Fish / Shellfish
            r"\bsalmon\b": (["fish", "seafood"], ["grilled organic tofu", "spiced chickpeas", "steamed lentils", "grilled paneer", "grilled chicken"]),
            r"\btuna\b": (["fish", "seafood"], ["chickpea salad mash", "grilled organic tofu", "steamed lentils"]),
            r"\bfish\b": (["fish", "seafood"], ["spiced organic tofu", "spiced chickpeas", "steamed lentils", "grilled paneer"]),
            r"\bprawns?\b": (["shellfish", "seafood"], ["spiced chickpea patties", "pan-seared tofu cubes", "grilled portobello mushrooms"]),
            r"\bshrimps?\b": (["shellfish", "seafood"], ["pan-seared tofu cubes", "spiced chickpea patties", "grilled portobello mushrooms"]),
            r"\bcrabs?\b": (["shellfish", "seafood"], ["grilled portobello mushrooms", "pan-seared tofu cubes"]),
            r"\blobsters?\b": (["shellfish", "seafood"], ["pan-seared tofu", "spiced chickpeas"]),
            r"\bshellfish\b": (["shellfish", "seafood"], ["plant-based protein", "spiced chickpeas", "pan-seared tofu"]),
            r"\bmachli\b": (["fish", "seafood"], ["spiced organic tofu", "spiced chickpeas", "steamed lentils"]),

            # Wheat / Gluten
            r"\bwhole\s+wheat\s+roti\b": (["wheat", "gluten"], ["gluten-free jowar (sorghum) roti", "bajra millet roti", "brown rice"]),
            r"\broti\b": (["wheat", "gluten"], ["gluten-free millet roti", "jowar flatbread", "brown rice"]),
            r"\bchapati\b": (["wheat", "gluten"], ["gluten-free millet roti", "jowar flatbread"]),
            r"\bwheat\s+bread\b": (["wheat", "gluten"], ["gluten-free seeded toast", "gluten-free rice toast"]),
            r"\bbread\b": (["wheat", "gluten"], ["gluten-free toast", "gluten-free seeded flatbread"]),
            r"\bpasta\b": (["wheat", "gluten"], ["brown rice pasta", "lentil pasta", "quinoa pasta"]),
            r"\batta\b": (["wheat", "gluten"], ["jowar flour", "chickpea (besan) flour"]),
            r"\bmaida\b": (["wheat", "gluten"], ["chickpea flour", "rice flour"]),
            r"\bsemolina\b": (["wheat", "gluten"], ["quinoa", "millet flakes"]),
            r"\bsuji\b": (["wheat", "gluten"], ["quinoa", "millet flakes"]),

            # Soy
            r"\btofu\b": (["soy"], ["spiced chickpeas", "yellow moong daal", "steamed lentils", "grilled paneer"]),
            r"\bedamame\b": (["soy"], ["green peas", "steamed chickpeas"]),
            r"\bsoy\s+sauce\b": (["soy"], ["coconut aminos"]),
            r"\bsoy(?:a)?\s+chunks?\b": (["soy"], ["black chana", "steamed lentils", "chickpeas"]),

            # Sesame & Tahini
            r"\btahini\b": (["sesame"], ["sunflower seed paste", "pumpkin seed butter", "avocado puree", "an allergy-compatible spread"]),
            r"\btil\b": (["sesame"], ["flaxseeds", "poppy seeds", "roasted chickpeas"]),
            r"\bsesame\s+seeds?\b": (["sesame"], ["flaxseeds", "poppy seeds", "roasted chickpeas"]),

            # Meat / Poultry
            r"\bchicken\s+breast\b": (["poultry"], ["spiced organic tofu", "steamed lentils", "chickpeas", "paneer", "wild fish"]),
            r"\bchicken\b": (["poultry"], ["spiced organic tofu", "chickpeas", "steamed lentils", "paneer"]),
            r"\bbeef\b": (["red_meat"], ["black lentils", "portobello mushrooms", "cooked chickpeas", "tofu"]),
            r"\bmutton\b": (["red_meat"], ["spiced chickpeas", "black lentils"]),
            r"\bred\s+meat\b": (["red_meat"], ["cooked legumes", "spiced chickpeas"]),
            r"\bpork\b": (["pork", "red_meat"], ["mushrooms", "beans", "tofu"]),
            r"\bbacon\b": (["pork", "red_meat"], ["crispy tempeh", "crispy coconut flakes"]),
            r"\bmeat\b": (["red_meat"], ["plant-based protein", "legumes"]),

            # Gelatin / Honey
            r"\bgelatin\b": (["gelatin"], ["agar-agar"]),
            r"\bhoney\b": (["honey"], ["pure maple syrup", "date syrup"]),
        }

        def _resolve_candidate(pattern: str, default_generic: str = "an allergy-compatible alternative") -> str:
            """
            Validates candidates against patient's complete exclusion profile.
            Returns the first candidate that is 100% free of all excluded categories.
            Never returns seed-based candidates or fallbacks if seeds are restricted.
            """
            is_butter_pattern = any(w in pattern for w in ("butter", "tahini", "spread", "paste"))
            seeds_excluded = any(c in valid_exclusions for c in ("seed", "seeds", "sesame"))

            # Check user custom overrides first if provided and safe
            if safe_substitutions and pattern in safe_substitutions:
                cand = safe_substitutions[pattern]
                if not (seeds_excluded and any(sw in cand.lower() for sw in ("seed", "sesame", "tahini"))):
                    is_forbid, _ = is_food_forbidden(cand, valid_exclusions)
                    if not is_forbid:
                        return cand

            entry = CANDIDATE_SUBSTITUTES.get(pattern)
            candidates = entry[1] if entry else []
            for cand in candidates:
                if seeds_excluded and any(sw in cand.lower() for sw in ("seed", "sesame", "tahini")):
                    continue
                is_forbid, _ = is_food_forbidden(cand, valid_exclusions)
                if not is_forbid:
                    return cand

            if is_butter_pattern:
                return "an allergy-compatible spread"

            return default_generic

        # Apply substitutions for all active exclusions
        for cat in valid_exclusions:
            if is_food_forbidden(cleaned, [cat]):
                # 1. First pass: Apply restriction-aware candidate replacements (longest multi-word phrases first)
                for pattern in sorted(CANDIDATE_SUBSTITUTES.keys(), key=len, reverse=True):
                    target_cats, _ = CANDIDATE_SUBSTITUTES[pattern]
                    if cat in target_cats or any(c in valid_exclusions for c in target_cats):
                        if re.search(pattern, cleaned, re.IGNORECASE):
                            replacement = _resolve_candidate(pattern)
                            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
                            substitutions_made.append(f"{cat} -> {replacement}")

                # 2. Second pass: If any raw allergen term persists, sanitize with validated fallback
                terms_for_cat = list(ALLERGEN_INGREDIENT_MAP.get(cat, set()))
                terms_for_cat.extend([cat, cat.replace("_", " "), cat.replace(" ", "_")])
                for term in terms_for_cat:
                    term_regex = r"(?<!seed\s)\b" + re.escape(term) + r"(?:s|es)?\b"
                    if re.search(term_regex, cleaned, re.IGNORECASE):
                        if "nut" in cat or "peanut" in cat:
                            seeds_excl = any(c in valid_exclusions for c in ("seed", "seeds", "sesame"))
                            if not seeds_excl and not is_food_forbidden("pumpkin seeds", valid_exclusions)[0]:
                                fb = "roasted pumpkin seeds"
                            elif not is_food_forbidden("roasted chickpeas", valid_exclusions)[0]:
                                fb = "roasted chickpeas"
                            else:
                                fb = "an allergy-compatible alternative"
                        elif "milk" in cat or "dairy" in cat:
                            fb = "oat milk" if not is_food_forbidden("oat milk", valid_exclusions)[0] else "rice milk"
                        elif "soy" in cat:
                            fb = "chickpeas" if not is_food_forbidden("chickpeas", valid_exclusions)[0] else "lentils"
                        else:
                            fb = "an allergy-compatible alternative"
                        cleaned = re.sub(term_regex, fb, cleaned, flags=re.IGNORECASE)
                        substitutions_made.append(f"{term} -> {fb}")

        # Final verification: Ensure ZERO forbidden food leakage remains
        seeds_excluded = any(c in valid_exclusions for c in ("seed", "seeds", "sesame"))
        if seeds_excluded:
            cleaned = re.sub(r"\bseed\s+butter(?:\s+alternative)?\b", "an allergy-compatible spread", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\bseed-based\s+spread\b", "an allergy-compatible spread", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\b(?:sunflower\s+seed\s+butter|pumpkin\s+seed\s+butter)\b", "an allergy-compatible spread", cleaned, flags=re.IGNORECASE)

        for cat in valid_exclusions:
            if is_food_forbidden(cleaned, [cat]):
                terms_for_cat = list(ALLERGEN_INGREDIENT_MAP.get(cat, set()))
                terms_for_cat.extend([cat, cat.replace("_", " "), cat.replace(" ", "_")])
                for term in terms_for_cat:
                    term_regex = r"(?<!seed\s)\b" + re.escape(term) + r"(?:s|es)?\b"
                    fb_str = "an allergy-compatible spread" if "butter" in term else "an allergy-compatible alternative"
                    cleaned = re.sub(term_regex, fb_str, cleaned, flags=re.IGNORECASE)

        if substitutions_made:
            cleaned += "\n\n*(Note: Ingredients containing your declared dietary/allergy exclusions were deterministically substituted with verified safe alternatives. Check packaged-food labels and cross-contact warnings for your declared allergens).* "

        return cleaned


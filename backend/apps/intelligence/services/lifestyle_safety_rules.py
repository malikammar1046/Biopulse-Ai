"""
backend/apps/intelligence/services/lifestyle_safety_rules.py

Clinical Safety & Eligibility Rules Engine for Lifestyle Recommendations.
Enforces deterministic safety boundaries, contraindication checks, and allergen exclusions:
1. Exercise safety gating (supportive low-impact guidance, joint comfort, recovery pacing).
2. Caloric safety bounds (caloric floors, no deficits for underweight or lean phenotypes).
3. Hard allergen & intolerance filtering.
4. Pathway-specific hormonal safety boundaries & clinician review escalation.
5. Non-diagnostic regulatory disclaimers.

Guarantees 100% independence from legacy Meal Directory.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from apps.intelligence.services.lifestyle_context_builder import ComprehensiveLifestyleContext

logger = logging.getLogger(__name__)

def get_pathway_disclaimer(pathway: str = "female_pcos") -> str:
    is_male = str(pathway or "").lower() in ("male_hypogonadism", "male", "androsense")
    condition = "Male Hypogonadism" if is_male else "PCOS"
    return (
        "BioPulse AI lifestyle recommendations are non-diagnostic, educational, and personalized "
        "to support metabolic and endocrine balance. They are designed for collaborative discussion "
        "with your qualified healthcare professional and do not replace professional medical advice, "
        "diagnosis, or prescribed medical treatment. Lifestyle interventions support hormonal health "
        f"but do not cure or reverse {condition}."
    )

CLINICAL_DISCLAIMER = get_pathway_disclaimer("female_pcos")

ALLERGEN_INGREDIENT_MAP: Dict[str, Set[str]] = {
    "dairy": {"milk", "yogurt", "cheese", "paneer", "butter", "ghee", "cream", "whey", "curd", "dahi", "malai", "lassi"},
    "milk": {"milk", "yogurt", "cheese", "paneer", "butter", "ghee", "cream", "whey", "curd", "dahi", "malai", "lassi"},
    "lactose": {"milk", "yogurt", "cheese", "paneer", "butter", "cream", "whey", "curd", "dahi", "malai", "lassi"},
    "gluten": {"wheat", "barley", "rye", "roti", "paratha", "naan", "bread", "semolina", "sooji", "pasta", "couscous", "maida", "atta"},
    "wheat": {"wheat", "barley", "rye", "roti", "paratha", "naan", "bread", "semolina", "sooji", "pasta", "couscous", "maida", "atta"},
    "nuts": {"peanut", "peanuts", "almond", "almonds", "walnut", "walnuts", "cashew", "cashews", "pistachio", "pistachios", "hazelnut", "hazelnuts", "pecan", "pecans", "macadamia", "nut butter", "badam", "akhrot", "kaju", "pista"},
    "peanuts": {"peanut", "peanuts", "peanut butter", "groundnut", "groundnuts", "mungfali", "moongfali"},
    "peanut": {"peanut", "peanuts", "peanut butter", "groundnut", "groundnuts", "mungfali", "moongfali"},
    "tree_nuts": {"almond", "almonds", "walnut", "walnuts", "cashew", "cashews", "pistachio", "pistachios", "hazelnut", "hazelnuts", "pecan", "pecans", "badam", "akhrot", "kaju", "pista", "nut butter", "nuts"},
    "tree_nut": {"almond", "almonds", "walnut", "walnuts", "cashew", "cashews", "pistachio", "pistachios", "hazelnut", "hazelnuts", "pecan", "pecans", "badam", "akhrot", "kaju", "pista", "nut butter", "nuts"},
    "eggs": {"egg", "eggs", "egg white", "egg whites", "egg yolk", "egg yolks", "omelet", "omelette", "mayonnaise", "anda", "anday"},
    "egg": {"egg", "eggs", "egg white", "egg whites", "egg yolk", "egg yolks", "omelet", "omelette", "mayonnaise", "anda", "anday"},
    "fish": {"fish", "salmon", "tuna", "cod", "mackerel", "sardine", "sardines", "tilapia", "trout", "machli", "machhli", "rohu"},
    "shellfish": {"prawn", "prawns", "shrimp", "shrimps", "crab", "crabs", "lobster", "lobsters", "clam", "clams", "mussel", "mussels", "oyster", "oysters", "jhinga"},
    "soy": {"soy", "tofu", "edamame", "soy sauce", "soy milk", "tempeh", "soya"},
    "sesame": {"sesame", "til", "tahini"},
    "seeds": {"seed", "seeds", "sunflower seed", "sunflower seeds", "pumpkin seed", "pumpkin seeds", "chia seed", "chia seeds", "flaxseed", "flaxseeds", "sesame", "tahini"},
    "seed": {"seed", "seeds", "sunflower seed", "sunflower seeds", "pumpkin seed", "pumpkin seeds", "chia seed", "chia seeds", "flaxseed", "flaxseeds", "sesame", "tahini"},
    "red_meat": {"beef", "mutton", "lamb", "veal", "pork", "steak", "keema", "meat"},
    "poultry": {"chicken", "turkey", "duck"},
    "seafood": {"fish", "prawn", "prawns", "shrimp", "shrimps", "crab", "crabs", "lobster", "lobsters", "machli", "jhinga", "seafood", "clam", "mussel", "oyster", "salmon", "tuna"},
    "pork": {"pork", "bacon", "ham", "lard"},
    "alcohol": {"alcohol", "wine", "beer", "liquor", "cocktail"},
    "gelatin": {"gelatin", "gelatine"},
    "honey": {"honey"},
}


def is_food_forbidden(text: str, excluded_categories: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Deterministically checks if any term in `text` violates `excluded_categories`.
    Returns (is_forbidden, matched_category_or_ingredient).
    """
    if not text or not excluded_categories:
        return False, None
    import re
    t_clean = text.lower()
    for cat in excluded_categories:
        cat_norm = str(cat).strip().lower()
        if not cat_norm or cat_norm == "none":
            continue
        # Direct category keyword match (allowing singular and plural forms)
        base_cat = cat_norm[:-1] if cat_norm.endswith("s") and len(cat_norm) > 3 else cat_norm
        if re.search(r"\b" + re.escape(base_cat) + r"(?:s|es)?\b", t_clean):
            return True, cat_norm
        # Check ingredient terms mapped to category (allowing optional plural)
        terms = ALLERGEN_INGREDIENT_MAP.get(cat_norm, set())
        for term in terms:
            term_base = term[:-1] if term.endswith("s") and len(term) > 3 else term
            if re.search(r"\b" + re.escape(term_base) + r"(?:s|es)?\b", t_clean):
                return True, f"{cat_norm}:{term}"
    return False, None


PRODUCT_SAFETY_FLOOR_FEMALE: float = 1200.0
PRODUCT_SAFETY_FLOOR_MALE: float = 1500.0


@dataclass
class SafetyEvaluationResult:
    is_safe: bool = True
    safety_status: str = "ALLOW"  # 'ALLOW' | 'MODIFY' | 'WITHHOLD' | 'CLINICIAN_REVIEW'
    safety_tier: str = "standard"  # 'standard', 'cautious', 'medical_escalation'
    clinician_review_needed: bool = False
    clinician_review_reason: Optional[str] = None
    contraindications: List[str] = field(default_factory=list)
    safety_notices: List[str] = field(default_factory=list)
    excluded_food_categories: List[str] = field(default_factory=list)
    excluded_exercise_modalities: List[str] = field(default_factory=list)
    min_safe_calories_kcal: float = PRODUCT_SAFETY_FLOOR_FEMALE
    max_safe_deficit_kcal: float = 350.0
    joint_protection_active: bool = False
    caloric_floor_enforced: bool = False
    recovery_first_active: bool = False
    glycemic_priority_active: bool = False
    disclaimer: str = CLINICAL_DISCLAIMER


class LifestyleSafetyEngine:
    """
    Evaluates patient context against clinical safety guidelines and returns
    strict boundary constraints to govern dynamic recommendation generation.
    """

    @classmethod
    def evaluate_safety(cls, context: ComprehensiveLifestyleContext) -> SafetyEvaluationResult:
        result = SafetyEvaluationResult()
        demo = context.demographics
        result.disclaimer = get_pathway_disclaimer(demo.pathway)
        screening = context.screening
        symptoms = context.symptoms
        labs = context.labs

        # 1. Conservative Product Safety Caloric Floors (automated guardrails against extreme restriction)
        if demo.gender == "female":
            result.min_safe_calories_kcal = PRODUCT_SAFETY_FLOOR_FEMALE
            result.max_safe_deficit_kcal = 350.0 if (demo.bmi and demo.bmi >= 25.0) else 0.0
        else:
            result.min_safe_calories_kcal = PRODUCT_SAFETY_FLOOR_MALE
            result.max_safe_deficit_kcal = 450.0 if (demo.bmi and demo.bmi >= 25.0) else 0.0

        # Underweight contraindication: deficit is strictly withheld
        if demo.bmi is not None and demo.bmi < 18.5:
            result.safety_status = "WITHHOLD"
            result.max_safe_deficit_kcal = 0.0
            result.contraindications.append(
                "Caloric deficit is contraindicated for individuals with BMI < 18.5. "
                "Nutrient density, energy sufficiency, and clinical evaluation are prioritized."
            )
            result.safety_notices.append(
                "Underweight safety notice: Focus placed on restorative nutrition and physician consultation."
            )

        # 2. Joint & High-Impact Safety (supportive, non-dogmatic guidance)
        if demo.bmi and demo.bmi >= 32.0:
            result.joint_protection_active = True
            if result.safety_status == "ALLOW":
                result.safety_status = "MODIFY"
            result.excluded_exercise_modalities.extend([
                "prolonged_pavement_sprinting",
                "excessive_high_repetition_jumping",
            ])
            result.safety_notices.append(
                "Lower-impact activity (such as brisk walking, cycling, water exercise, or supported resistance) "
                "may be a more comfortable starting option depending on your current fitness level and joint comfort."
            )

        # 3. High Fatigue / Severe Stress Safety (Recovery-First)
        has_fatigue = any("fatigue" in s or "tired" in s or "exhaust" in s for s in symptoms.active_symptoms)
        if has_fatigue or (demo.stress_level in ("high", "severe")):
            result.recovery_first_active = True
            if result.safety_status == "ALLOW":
                result.safety_status = "MODIFY"
            result.excluded_exercise_modalities.extend([
                "daily_exhaustive_hiit",
                "two_a_day_intense_sessions",
            ])
            result.safety_notices.append(
                "Recovery-first pacing: High fatigue or stress indicators detected. "
                "Prioritizing restorative sleep, moderate aerobic movement, and relaxation practices over exhaustive training."
            )

        # 4. Metabolic / Glycemic Safety & Diabetes Thresholds (Non-Diagnostic Review Flag)
        has_diabetes_biomarkers = (
            (labs.fasting_glucose_mg_dl and labs.fasting_glucose_mg_dl >= 126.0)
            or (labs.hba1c_percent and labs.hba1c_percent >= 6.5)
        )
        has_prediabetes_biomarkers = (
            (labs.fasting_glucose_mg_dl and 100.0 <= labs.fasting_glucose_mg_dl < 126.0)
            or (labs.hba1c_percent and 5.7 <= labs.hba1c_percent < 6.5)
        )

        if has_diabetes_biomarkers:
            result.clinician_review_needed = True
            result.clinician_review_reason = (
                "Elevated glycemic indicators detected (HbA1c >= 6.5% or Fasting Glucose >= 126 mg/dL). "
                "This result may warrant clinical review and repeat confirmatory testing by a qualified physician."
            )
            result.safety_status = "CLINICIAN_REVIEW"
            result.safety_notices.append("Clinical review: Glycemic biomarkers warrant formal physician evaluation.")
        elif has_prediabetes_biomarkers or (demo.pathway in ("female_pcos", "ovasense") and screening.risk_category == "elevated"):
            result.glycemic_priority_active = True
            if result.safety_status == "ALLOW":
                result.safety_status = "MODIFY"
            result.excluded_food_categories.extend([
                "refined_simple_sugars",
                "sweetened_beverages",
            ])
            result.safety_notices.append(
                "Glycemic stabilization priority: Recommending low-glycemic, protein-and-fiber anchored meal structures."
            )

        # 5. Male Hormonal Red Flags (Testosterone < 300 ng/dL) - Non-Diagnostic Review Flag
        if demo.gender == "male" and labs.total_testosterone_ng_dl is not None:
            if labs.total_testosterone_ng_dl < 300.0:
                result.clinician_review_needed = True
                result.clinician_review_reason = (
                    "A serum total testosterone value below 300 ng/dL was identified in laboratory records. "
                    "This result may warrant clinical review. Clinical guidelines recommend morning repeat testing and "
                    "discussion with a physician to evaluate symptoms, timing, and personal health context."
                )
                result.safety_status = "CLINICIAN_REVIEW"
                result.safety_notices.append(
                    "Clinical review flagged: Serum total testosterone level warrants formal physician follow-up."
                )

        # 6. Female Prolactin Red Flag (> 30 ng/mL) - Non-Diagnostic Review Flag
        if demo.gender == "female" and labs.prolactin_ng_ml is not None and labs.prolactin_ng_ml > 30.0:
            result.clinician_review_needed = True
            result.clinician_review_reason = (
                "An elevated serum prolactin value (> 30 ng/mL) was identified in laboratory records. "
                "This result may warrant clinical evaluation by a healthcare provider to exclude secondary factors."
            )
            result.safety_status = "CLINICIAN_REVIEW"
            result.safety_notices.append("Clinical review: Elevated prolactin warrants healthcare provider evaluation.")

        # 7. Food Allergen & Intolerance Filtering
        user_allergens = set(demo.allergens + demo.intolerances)
        for allergy_name in user_allergens:
            norm_a = allergy_name.strip().lower()
            if not norm_a or norm_a == "none":
                continue
            result.excluded_food_categories.append(norm_a)
            if result.safety_status == "ALLOW":
                result.safety_status = "MODIFY"

        # 8. Dietary Pattern Invariants
        if demo.dietary_preference in ("vegetarian", "vegan"):
            result.excluded_food_categories.extend(["red_meat", "poultry", "seafood", "fish", "shellfish", "gelatin"])
            if demo.dietary_preference == "vegan":
                result.excluded_food_categories.extend(["dairy", "milk", "eggs", "egg", "honey"])
        elif demo.dietary_preference == "pescatarian":
            result.excluded_food_categories.extend(["red_meat", "poultry"])
        elif demo.dietary_preference in ("halal", "halal_omnivore"):
            result.excluded_food_categories.extend(["pork", "alcohol"])

        # Deduplicate and remove any potential 'none'
        result.excluded_food_categories = sorted(list(set(
            c for c in result.excluded_food_categories if c and c.lower() != "none"
        )))
        result.excluded_exercise_modalities = sorted(list(set(result.excluded_exercise_modalities)))

        return result

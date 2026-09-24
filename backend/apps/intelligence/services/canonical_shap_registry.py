"""
backend/apps/intelligence/services/canonical_shap_registry.py
Canonical metadata registry for patient-centered SHAP explainability across
Female PCOS and Male Hypogonadism screening pathways in BioPulse AI.

Centralized source of truth for:
- Clinical feature keys and model mappings
- Human-friendly patient labels and categories
- Value formatters for recorded patient data
- Transparent clinical descriptions and model usage rationale
- Modifiability status (non-prescriptive)
- Non-causation safe directional language templates
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional


def _format_binary_symptom(val: Any) -> str:
    if val is None or val == "":
        return "Not recorded"
    try:
        fval = float(val)
        return "Reported" if fval > 0 else "Not reported"
    except (ValueError, TypeError):
        s = str(val).strip().lower()
        if s in ("1", "true", "yes", "y", "reported", "frequent", "daily", "severe", "moderate"):
            return "Reported"
        return "Not reported"


def _format_cycle_regularity(val: Any) -> str:
    if val is None or val == "":
        return "Not recorded"
    try:
        fval = float(val)
        return "Irregular" if fval > 0 else "Regular"
    except (ValueError, TypeError):
        s = str(val).strip().lower()
        return "Irregular" if "irreg" in s or "vary" in s else "Regular"


def _format_numeric_unit(unit: str, decimals: int = 1) -> Callable[[Any], str]:
    def _formatter(val: Any) -> str:
        if val is None or val == "":
            return "Not recorded"
        try:
            fval = float(val)
            fmt = f"{{:.{decimals}f}}"
            rendered = fmt.format(fval)
            return f"{rendered} {unit}".strip()
        except (ValueError, TypeError):
            return str(val)
    return _formatter


def _format_lifestyle_flag(positive_label: str, negative_label: str) -> Callable[[Any], str]:
    def _formatter(val: Any) -> str:
        if val is None or val == "":
            return "Not recorded"
        try:
            fval = float(val)
            return positive_label if fval > 0 else negative_label
        except (ValueError, TypeError):
            s = str(val).strip().lower()
            return positive_label if s in ("1", "true", "yes", "y") else negative_label
    return _formatter


class FeatureMetadata:
    def __init__(
        self,
        feature_key: str,
        patient_label: str,
        pathway: str,  # 'female_pcos', 'male_hypogonadism', 'both'
        supported_tiers: List[int],
        category: str,  # 'cycle_symptom', 'anthropometric', 'lifestyle', 'hormone_lab', 'metabolic_lab', 'vital_sign', 'general_lab'
        formatter: Callable[[Any], str],
        simple_description: str,
        why_model_uses_it: str,
        modifiable_status: str,  # 'lifestyle_influenced', 'changes_over_time', 'clinical_measurement', 'background_factor'
        unit: str = "",
        technical_label: str = "",
        reference_interval: Optional[str] = None,
        reference_source: Optional[str] = None,
    ) -> None:
        self.feature_key = feature_key
        self.patient_label = patient_label
        self.pathway = pathway
        self.supported_tiers = supported_tiers
        self.category = category
        self.formatter = formatter
        self.simple_description = simple_description
        self.why_model_uses_it = why_model_uses_it
        self.modifiable_status = modifiable_status
        self.unit = unit
        self.technical_label = technical_label or feature_key
        self.reference_interval = reference_interval
        self.reference_source = reference_source


CANONICAL_SHAP_REGISTRY: Dict[str, FeatureMetadata] = {
    # ── FEMALE TIER 1 & SHARED ANTHROPOMETRICS ────────────────────────────
    "age": FeatureMetadata(
        feature_key="age",
        patient_label="Age",
        pathway="both",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("years", 0),
        simple_description="Your recorded chronological age.",
        why_model_uses_it="Age provides demographic baseline prevalence context in reproductive and metabolic screening algorithms.",
        modifiable_status="background_factor",
        unit="years",
    ),
    "weight_kg": FeatureMetadata(
        feature_key="weight_kg",
        patient_label="Body Weight",
        pathway="both",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("kg", 1),
        simple_description="Recorded body weight.",
        why_model_uses_it="Body weight is evaluated as part of systemic metabolic and body composition screening patterns.",
        modifiable_status="changes_over_time",
        unit="kg",
    ),
    "height_cm": FeatureMetadata(
        feature_key="height_cm",
        patient_label="Height",
        pathway="both",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("cm", 0),
        simple_description="Recorded standing height.",
        why_model_uses_it="Height establishes physical scale for derived anthropometric indices like BMI.",
        modifiable_status="background_factor",
        unit="cm",
    ),
    "bmi": FeatureMetadata(
        feature_key="bmi",
        patient_label="Body Mass Index (BMI)",
        pathway="both",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("kg/m²", 1),
        simple_description="Body Mass Index derived from height and weight.",
        why_model_uses_it="BMI reflects general adiposity that can correlate statistically with metabolic and endocrine indicators.",
        modifiable_status="changes_over_time",
        unit="kg/m²",
    ),
    "cycle_regularity": FeatureMetadata(
        feature_key="cycle_regularity",
        patient_label="Menstrual Cycle Regularity",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_cycle_regularity,
        simple_description="Whether your menstrual cycle occurs at regular, predictable intervals.",
        why_model_uses_it="Cycle regularity is one of the primary historical indicators of ovulatory pattern regularity.",
        modifiable_status="changes_over_time",
    ),
    "cycle_length_raw": FeatureMetadata(
        feature_key="cycle_length_raw",
        patient_label="Cycle Length",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_numeric_unit("days", 0),
        simple_description="Typical duration of your menstrual cycle in days.",
        why_model_uses_it="Cycle durations outside the typical 21–35 day physiological window provide ovulatory pattern signals.",
        modifiable_status="changes_over_time",
        unit="days",
    ),
    "hip_inch": FeatureMetadata(
        feature_key="hip_inch",
        patient_label="Hip Circumference",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("inches", 1),
        simple_description="Hip circumference measurement.",
        why_model_uses_it="Evaluated alongside waist circumference to assess body fat distribution patterns.",
        modifiable_status="changes_over_time",
        unit="inches",
    ),
    "waist_inch": FeatureMetadata(
        feature_key="waist_inch",
        patient_label="Waist Circumference",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("inches", 1),
        simple_description="Waist circumference measurement.",
        why_model_uses_it="Central waist measurement provides indicators regarding abdominal fat distribution.",
        modifiable_status="changes_over_time",
        unit="inches",
    ),
    "waist_hip_ratio": FeatureMetadata(
        feature_key="waist_hip_ratio",
        patient_label="Waist-to-Hip Ratio",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="anthropometric",
        formatter=_format_numeric_unit("", 2),
        simple_description="Ratio of waist circumference to hip circumference.",
        why_model_uses_it="Waist-to-hip ratio is an established indicator of central vs peripheral adipose distribution.",
        modifiable_status="changes_over_time",
    ),
    "weight_gain": FeatureMetadata(
        feature_key="weight_gain",
        patient_label="Recent Rapid Weight Gain",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Self-reported unexplained or rapid weight gain.",
        why_model_uses_it="Recent weight trajectory can correlate with underlying metabolic signaling shifts.",
        modifiable_status="changes_over_time",
    ),
    "hirsutism": FeatureMetadata(
        feature_key="hirsutism",
        patient_label="Excess Facial/Body Hair",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Self-reported noticeable coarse hair growth in androgen-dependent areas.",
        why_model_uses_it="Hirsutism serves as a clinical physical indicator of potential androgenic activity.",
        modifiable_status="changes_over_time",
    ),
    "skin_darkening": FeatureMetadata(
        feature_key="skin_darkening",
        patient_label="Skin Darkening (Acanthosis Nigricans)",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Hyperpigmentation in skin folds (neck, underarms).",
        why_model_uses_it="Skin hyperpigmentation is a hallmark physical indicator of insulin sensitivity variation.",
        modifiable_status="changes_over_time",
    ),
    "hair_loss": FeatureMetadata(
        feature_key="hair_loss",
        patient_label="Scalp Hair Thinning",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Noticeable hair shedding or crown thinning.",
        why_model_uses_it="Androgen-pattern scalp hair thinning is evaluated in clinical symptom profiles.",
        modifiable_status="changes_over_time",
    ),
    "pimples_acne": FeatureMetadata(
        feature_key="pimples_acne",
        patient_label="Persistent Acne / Breakouts",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Persistent or cyclical skin breakouts.",
        why_model_uses_it="Adult acne can be influenced by cutaneous androgen receptor activity.",
        modifiable_status="changes_over_time",
    ),
    "fast_food": FeatureMetadata(
        feature_key="fast_food",
        patient_label="Frequent Processed / Fast Food",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="lifestyle",
        formatter=_format_lifestyle_flag("Frequent", "Infrequent / None"),
        simple_description="Self-reported regular consumption of ultra-processed food.",
        why_model_uses_it="Dietary pattern context evaluated alongside physical and metabolic markers.",
        modifiable_status="lifestyle_influenced",
    ),
    "regular_exercise": FeatureMetadata(
        feature_key="regular_exercise",
        patient_label="Regular Physical Activity",
        pathway="female_pcos",
        supported_tiers=[1, 2],
        category="lifestyle",
        formatter=_format_lifestyle_flag("Regular", "Sedentary / Rare"),
        simple_description="Consistent weekly physical exercise routine.",
        why_model_uses_it="Regular physical activity supports glycemic regulation and metabolic balance.",
        modifiable_status="lifestyle_influenced",
    ),

    # ── FEMALE TIER 2 CLINICAL LABS & VITALS ─────────────────────────────
    "fsh": FeatureMetadata(
        feature_key="fsh",
        patient_label="Follicle Stimulating Hormone (FSH)",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("mIU/mL", 1),
        simple_description="Serum pituitary gonadotropin regulating ovarian follicle maturation.",
        why_model_uses_it="FSH concentrations and its ratio to LH are informative for pituitary-ovarian axis signaling.",
        modifiable_status="clinical_measurement",
        unit="mIU/mL",
        reference_interval="2.5 – 10.2 mIU/mL",
        reference_source="Standard Clinical Endocrine Reference (Follicular)",
    ),
    "lh": FeatureMetadata(
        feature_key="lh",
        patient_label="Luteinizing Hormone (LH)",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("mIU/mL", 1),
        simple_description="Pituitary gonadotropin triggering ovulatory signaling.",
        why_model_uses_it="Elevated LH relative to FSH is frequently observed in anovulatory endocrine patterns.",
        modifiable_status="clinical_measurement",
        unit="mIU/mL",
        reference_interval="1.9 – 12.5 mIU/mL",
        reference_source="Standard Clinical Endocrine Reference (Follicular)",
    ),
    "fsh_lh_ratio": FeatureMetadata(
        feature_key="fsh_lh_ratio",
        patient_label="FSH / LH Ratio",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("", 2),
        simple_description="Calculated ratio between serum FSH and LH.",
        why_model_uses_it="Captures the relative balance between the two primary pituitary gonadotropins.",
        modifiable_status="clinical_measurement",
        reference_interval="1.0 – 2.0",
        reference_source="Standard Clinical Endocrine Evaluation",
    ),
    "amh": FeatureMetadata(
        feature_key="amh",
        patient_label="Anti-Müllerian Hormone (AMH)",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("ng/mL", 1),
        simple_description="Ovarian granulosa cell marker reflecting growing antral follicle quantity.",
        why_model_uses_it="AMH correlates strongly with the density of small preantral and antral follicles in ovaries.",
        modifiable_status="clinical_measurement",
        unit="ng/mL",
        reference_interval="1.0 – 4.0 ng/mL",
        reference_source="Rotterdam Consensus Guidelines",
    ),
    "tsh": FeatureMetadata(
        feature_key="tsh",
        patient_label="Thyroid Stimulating Hormone (TSH)",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("mIU/L", 2),
        simple_description="Thyroid pituitary hormone evaluated to differentiate metabolic symptoms.",
        why_model_uses_it="Used to rule out thyroid dysfunction as an alternate cause of menstrual and metabolic variation.",
        modifiable_status="clinical_measurement",
        unit="mIU/L",
        reference_interval="0.45 – 4.50 µIU/mL",
        reference_source="American Thyroid Association",
    ),
    "prolactin": FeatureMetadata(
        feature_key="prolactin",
        patient_label="Serum Prolactin",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("ng/mL", 1),
        simple_description="Pituitary hormone evaluated to rule out hyperprolactinemia.",
        why_model_uses_it="Helps rule out pituitary hyperprolactinemia as an independent cause of oligomenorrhea.",
        modifiable_status="clinical_measurement",
        unit="ng/mL",
        reference_interval="4.8 – 23.3 ng/mL",
        reference_source="Endocrine Society Guidelines",
    ),
    "vitamin_d3": FeatureMetadata(
        feature_key="vitamin_d3",
        patient_label="Vitamin D3 (25-OH)",
        pathway="female_pcos",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("ng/mL", 1),
        simple_description="Circulating Vitamin D level.",
        why_model_uses_it="Vitamin D status has documented statistical correlations with insulin sensitivity.",
        modifiable_status="lifestyle_influenced",
        unit="ng/mL",
        reference_interval="30 – 100 ng/mL",
        reference_source="Endocrine Society Clinical Practice Guidelines",
    ),
    "progesterone": FeatureMetadata(
        feature_key="progesterone",
        patient_label="Serum Progesterone",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("ng/mL", 2),
        simple_description="Luteal phase ovarian hormone confirming ovulatory activity.",
        why_model_uses_it="Low mid-luteal progesterone reflects anovulatory or irregular cycle dynamics.",
        modifiable_status="clinical_measurement",
        unit="ng/mL",
    ),
    "rbs": FeatureMetadata(
        feature_key="rbs",
        patient_label="Random Blood Sugar (RBS)",
        pathway="female_pcos",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("mg/dL", 0),
        simple_description="Circulating blood glucose reading.",
        why_model_uses_it="Provides glycemic screening context to detect impaired glucose tolerance.",
        modifiable_status="clinical_measurement",
        unit="mg/dL",
        reference_interval="70 – 140 mg/dL",
        reference_source="American Diabetes Association (ADA)",
    ),
    "hemoglobin": FeatureMetadata(
        feature_key="hemoglobin",
        patient_label="Hemoglobin",
        pathway="female_pcos",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("g/dL", 1),
        simple_description="Total hemoglobin in blood.",
        why_model_uses_it="Evaluated in baseline complete blood work for general physiological status.",
        modifiable_status="clinical_measurement",
        unit="g/dL",
    ),
    "beta_hcg_i": FeatureMetadata(
        feature_key="beta_hcg_i",
        patient_label="Beta-HCG I",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("mIU/mL", 1),
        simple_description="Baseline human chorionic gonadotropin measurement.",
        why_model_uses_it="Evaluated to confirm non-pregnant reproductive baseline status.",
        modifiable_status="clinical_measurement",
        unit="mIU/mL",
    ),
    "beta_hcg_ii": FeatureMetadata(
        feature_key="beta_hcg_ii",
        patient_label="Beta-HCG II",
        pathway="female_pcos",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("mIU/mL", 1),
        simple_description="Confirmatory follow-up chorionic gonadotropin titer.",
        why_model_uses_it="Confirms non-pregnancy context across progressive screening intervals.",
        modifiable_status="clinical_measurement",
        unit="mIU/mL",
    ),
    "pulse_rate_bpm": FeatureMetadata(
        feature_key="pulse_rate_bpm",
        patient_label="Resting Heart Rate",
        pathway="female_pcos",
        supported_tiers=[2],
        category="vital_sign",
        formatter=_format_numeric_unit("bpm", 0),
        simple_description="Resting heart rate in beats per minute.",
        why_model_uses_it="Cardiovascular vital indicator evaluated in systemic autonomic screening.",
        modifiable_status="changes_over_time",
        unit="bpm",
    ),
    "respiratory_rate": FeatureMetadata(
        feature_key="respiratory_rate",
        patient_label="Respiratory Rate",
        pathway="female_pcos",
        supported_tiers=[2],
        category="vital_sign",
        formatter=_format_numeric_unit("breaths/min", 0),
        simple_description="Resting respiratory rate.",
        why_model_uses_it="Baseline vital sign included in comprehensive clinical screening observations.",
        modifiable_status="changes_over_time",
        unit="breaths/min",
    ),
    "bp_systolic": FeatureMetadata(
        feature_key="bp_systolic",
        patient_label="Systolic Blood Pressure",
        pathway="female_pcos",
        supported_tiers=[2],
        category="vital_sign",
        formatter=_format_numeric_unit("mmHg", 0),
        simple_description="Peak vascular pressure during heart contraction.",
        why_model_uses_it="Cardiometabolic marker evaluated alongside lipid and glycemic measurements.",
        modifiable_status="changes_over_time",
        unit="mmHg",
    ),
    "bp_diastolic": FeatureMetadata(
        feature_key="bp_diastolic",
        patient_label="Diastolic Blood Pressure",
        pathway="female_pcos",
        supported_tiers=[2],
        category="vital_sign",
        formatter=_format_numeric_unit("mmHg", 0),
        simple_description="Resting vascular pressure between heart contractions.",
        why_model_uses_it="Cardiovascular vascular resistance indicator included in clinical screening.",
        modifiable_status="changes_over_time",
        unit="mmHg",
    ),

    # ── MALE TIER 1 QUESTIONNAIRE & SYMPTOMS ──────────────────────────────
    "waist_cm": FeatureMetadata(
        feature_key="waist_cm",
        patient_label="Waist Circumference",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="anthropometric",
        formatter=_format_numeric_unit("cm", 1),
        simple_description="Recorded waist circumference at the umbilicus.",
        why_model_uses_it="Visceral adiposity is a strong statistical driver of increased aromatase activity and suppressed gonadotropins.",
        modifiable_status="changes_over_time",
        unit="cm",
    ),
    "low_energy": FeatureMetadata(
        feature_key="low_energy",
        patient_label="Low Energy / Daytime Fatigue",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Reported chronic fatigue or reduced vitality.",
        why_model_uses_it="Daytime fatigue is one of the core validated constitutional symptoms included in ADAM questionnaire screening.",
        modifiable_status="changes_over_time",
    ),
    "sleep_trouble": FeatureMetadata(
        feature_key="sleep_trouble",
        patient_label="Post-Dinner Sleepiness / Sleep Trouble",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Falling asleep immediately after dinner or interrupted sleep.",
        why_model_uses_it="Post-dinner sleepiness is a validated indicator of afternoon androgen and glycemic fluctuation.",
        modifiable_status="changes_over_time",
    ),
    "low_mood": FeatureMetadata(
        feature_key="low_mood",
        patient_label="Low Mood / Irritability",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Feelings of grumpiness, reduced motivation, or low mood.",
        why_model_uses_it="Affective changes correlate statistically with central androgen receptor signaling variation.",
        modifiable_status="changes_over_time",
    ),
    "low_interest": FeatureMetadata(
        feature_key="low_interest",
        patient_label="Reduced Libido / Sexual Desire",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="cycle_symptom",
        formatter=_format_binary_symptom,
        simple_description="Reported decrease in sexual desire or libido.",
        why_model_uses_it="Decreased libido is the single most sensitive symptom marker for low bioavailable testosterone.",
        modifiable_status="changes_over_time",
    ),
    "high_blood_pressure": FeatureMetadata(
        feature_key="high_blood_pressure",
        patient_label="Hypertension History",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="general_lab",
        formatter=_format_binary_symptom,
        simple_description="Known medical history of elevated blood pressure.",
        why_model_uses_it="Hypertension serves as a clinical comorbidity marker in metabolic-endocrine screening models.",
        modifiable_status="changes_over_time",
    ),
    "diabetes": FeatureMetadata(
        feature_key="diabetes",
        patient_label="Diabetes / Prediabetes History",
        pathway="male_hypogonadism",
        supported_tiers=[1],
        category="metabolic_lab",
        formatter=_format_binary_symptom,
        simple_description="Recorded history of insulin resistance or elevated blood sugar.",
        why_model_uses_it="Type 2 diabetes and insulin resistance strongly correlate with functional hypogonadotropic hypogonadism.",
        modifiable_status="changes_over_time",
    ),

    # ── MALE TIER 2 INDIRECT LABORATORY MARKERS ──────────────────────────
    "shbg_nmol_l": FeatureMetadata(
        feature_key="shbg_nmol_l",
        patient_label="Sex Hormone-Binding Globulin (SHBG)",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("nmol/L", 1),
        simple_description="Liver-derived carrier glycoprotein for circulating sex steroids.",
        why_model_uses_it="SHBG determines the proportion of circulating testosterone that remains free and bioavailable.",
        modifiable_status="clinical_measurement",
        unit="nmol/L",
    ),
    "estradiol_pg_ml": FeatureMetadata(
        feature_key="estradiol_pg_ml",
        patient_label="Serum Estradiol (E2)",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="hormone_lab",
        formatter=_format_numeric_unit("pg/mL", 1),
        simple_description="Primary circulating estrogen derived from androgen aromatization.",
        why_model_uses_it="Elevated estradiol indicates peripheral aromatization of androgens, common in visceral adiposity.",
        modifiable_status="clinical_measurement",
        unit="pg/mL",
    ),
    "albumin_g_dl": FeatureMetadata(
        feature_key="albumin_g_dl",
        patient_label="Serum Albumin",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("g/dL", 1),
        simple_description="Major circulating serum protein that weakly binds testosterone.",
        why_model_uses_it="Used alongside SHBG in calculating free and bioavailable testosterone fractions.",
        modifiable_status="clinical_measurement",
        unit="g/dL",
    ),
    "hba1c_pct": FeatureMetadata(
        feature_key="hba1c_pct",
        patient_label="Hemoglobin A1c (HbA1c)",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("%", 1),
        simple_description="3-month average glycemic control marker.",
        why_model_uses_it="HbA1c reflects sustained glycemic regulation and chronic insulin resistance.",
        modifiable_status="changes_over_time",
        unit="%",
    ),
    "glucose_mg_dl": FeatureMetadata(
        feature_key="glucose_mg_dl",
        patient_label="Fasting Glucose",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("mg/dL", 0),
        simple_description="Fasting blood glucose concentration.",
        why_model_uses_it="Acute glycemic measurement reflecting metabolic balance.",
        modifiable_status="clinical_measurement",
        unit="mg/dL",
    ),
    "hemoglobin_g_dl": FeatureMetadata(
        feature_key="hemoglobin_g_dl",
        patient_label="Hemoglobin",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("g/dL", 1),
        simple_description="Oxygen-carrying protein in red blood cells.",
        why_model_uses_it="Androgens stimulate erythropoietin; low testosterone can mildly suppress erythropoiesis.",
        modifiable_status="clinical_measurement",
        unit="g/dL",
    ),
    "hematocrit_pct": FeatureMetadata(
        feature_key="hematocrit_pct",
        patient_label="Hematocrit",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("%", 1),
        simple_description="Volume percentage of red blood cells in blood.",
        why_model_uses_it="Hematocrit tracks red cell mass and serves as an indirect clinical indicator of androgen activity.",
        modifiable_status="clinical_measurement",
        unit="%",
    ),
    "rbc_count": FeatureMetadata(
        feature_key="rbc_count",
        patient_label="Red Blood Cell Count",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("M/µL", 2),
        simple_description="Total circulating red blood cells.",
        why_model_uses_it="Evaluated alongside hemoglobin and hematocrit in complete blood work.",
        modifiable_status="clinical_measurement",
        unit="M/µL",
    ),
    "alt_u_l": FeatureMetadata(
        feature_key="alt_u_l",
        patient_label="Alanine Aminotransferase (ALT)",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("U/L", 0),
        simple_description="Liver enzyme indicating hepatic cellular health.",
        why_model_uses_it="Elevated ALT indicates hepatic steatosis, strongly linked to metabolic hypogonadism.",
        modifiable_status="clinical_measurement",
        unit="U/L",
    ),
    "ast_u_l": FeatureMetadata(
        feature_key="ast_u_l",
        patient_label="Aspartate Aminotransferase (AST)",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("U/L", 0),
        simple_description="Hepatic and muscular enzyme reading.",
        why_model_uses_it="Liver profile biomarker evaluated in metabolic screening.",
        modifiable_status="clinical_measurement",
        unit="U/L",
    ),
    "total_bilirubin_mg_dl": FeatureMetadata(
        feature_key="total_bilirubin_mg_dl",
        patient_label="Total Bilirubin",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("mg/dL", 2),
        simple_description="Bile breakdown byproduct evaluated in hepatic health.",
        why_model_uses_it="Evaluated in complete liver function panels.",
        modifiable_status="clinical_measurement",
        unit="mg/dL",
    ),
    "creatinine_mg_dl": FeatureMetadata(
        feature_key="creatinine_mg_dl",
        patient_label="Serum Creatinine",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("mg/dL", 2),
        simple_description="Kidney filtration waste product.",
        why_model_uses_it="Renal function indicator; chronic kidney impairment suppresses hypothalamic-pituitary signaling.",
        modifiable_status="clinical_measurement",
        unit="mg/dL",
    ),
    "bun_mg_dl": FeatureMetadata(
        feature_key="bun_mg_dl",
        patient_label="Blood Urea Nitrogen (BUN)",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="general_lab",
        formatter=_format_numeric_unit("mg/dL", 1),
        simple_description="Urea waste product evaluated in renal function.",
        why_model_uses_it="Renal metabolic profile indicator.",
        modifiable_status="clinical_measurement",
        unit="mg/dL",
    ),
    "uric_acid_mg_dl": FeatureMetadata(
        feature_key="uric_acid_mg_dl",
        patient_label="Serum Uric Acid",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("mg/dL", 1),
        simple_description="Purine metabolism end-product.",
        why_model_uses_it="Hyperuricemia is a common comorbidity marker in visceral adiposity and metabolic syndrome.",
        modifiable_status="clinical_measurement",
        unit="mg/dL",
    ),
    "hdl_mg_dl": FeatureMetadata(
        feature_key="hdl_mg_dl",
        patient_label="HDL Cholesterol",
        pathway="male_hypogonadism",
        supported_tiers=[2],
        category="metabolic_lab",
        formatter=_format_numeric_unit("mg/dL", 0),
        simple_description="High-density lipoprotein cholesterol ('protective cholesterol').",
        why_model_uses_it="Low HDL is a hallmark component of atherogenic dyslipidemia in hypogonadal men.",
        modifiable_status="changes_over_time",
        unit="mg/dL",
    ),
}


def get_feature_metadata(feature_key: str) -> FeatureMetadata:
    """Returns canonical metadata for a feature, or sensible fallback if unlisted."""
    if feature_key in CANONICAL_SHAP_REGISTRY:
        return CANONICAL_SHAP_REGISTRY[feature_key]

    clean_label = feature_key.replace("_", " ").title()
    return FeatureMetadata(
        feature_key=feature_key,
        patient_label=clean_label,
        pathway="both",
        supported_tiers=[1, 2],
        category="general_lab",
        formatter=lambda val: "Not recorded" if val is None or val == "" else str(val),
        simple_description=f"Recorded {clean_label.lower()} reading.",
        why_model_uses_it=f"{clean_label} is evaluated as part of the multi-factor screening algorithm.",
        modifiable_status="clinical_measurement",
    )

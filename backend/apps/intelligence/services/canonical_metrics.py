"""
Canonical metrics catalog and domain definitions for BioPulse AI Longitudinal Health.
Enforces strict pathway isolation, canonical units, validation rules, and non-diagnostic objective deltas.
"""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class MetricDefinition:
    key: str
    label: str
    unit: str
    category: str              # 'screening' | 'anthropometric' | 'laboratory' | 'symptom' | 'cycle'
    pathway: str               # 'shared' | 'female_pcos' | 'male_hypogonadism'
    value_type: str            # 'numeric' | 'boolean_symptom' | 'ordinal_symptom' | 'categorical' | 'screening_probability'
    comparison_type: str       # 'numeric' | 'boolean_symptom' | 'ordinal_symptom' | 'categorical' | 'screening_probability'
    clinical_directionality: str # 'neutral' | 'no_interpretation' | 'resolution_is_favorable' | 'lower_is_favorable' | 'higher_is_favorable'
    display_precision: int
    historically_comparable: bool
    is_graphable: bool
    min_valid: float | None = None
    max_valid: float | None = None


# Authoritative catalog of all supported longitudinal metrics
CANONICAL_METRICS: dict[str, MetricDefinition] = {
    # --- Shared Anthropometric & Metabolic Metrics ---
    "weight_kg": MetricDefinition(
        key="weight_kg",
        label="Body Weight",
        unit="kg",
        category="anthropometric",
        pathway="shared",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="neutral",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=20.0,
        max_valid=350.0,
    ),
    "bmi": MetricDefinition(
        key="bmi",
        label="Body Mass Index",
        unit="kg/m²",
        category="anthropometric",
        pathway="shared",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="neutral",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=10.0,
        max_valid=80.0,
    ),
    "waist_circumference": MetricDefinition(
        key="waist_circumference",
        label="Waist Circumference",
        unit="cm",
        category="anthropometric",
        pathway="shared",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="neutral",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=40.0,
        max_valid=200.0,
    ),
    "waist_hip_ratio": MetricDefinition(
        key="waist_hip_ratio",
        label="Waist-Hip Ratio",
        unit="ratio",
        category="anthropometric",
        pathway="shared",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="neutral",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.4,
        max_valid=2.0,
    ),
    "fasting_glucose": MetricDefinition(
        key="fasting_glucose",
        label="Fasting Blood Glucose",
        unit="mg/dL",
        category="laboratory",
        pathway="shared",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=30.0,
        max_valid=600.0,
    ),
    "hba1c": MetricDefinition(
        key="hba1c",
        label="Hemoglobin A1c",
        unit="%",
        category="laboratory",
        pathway="shared",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=3.0,
        max_valid=20.0,
    ),

    # --- Female PCOS Specific Metrics ---
    "pcos_screening_probability": MetricDefinition(
        key="pcos_screening_probability",
        label="PCOS Screening Risk",
        unit="%",
        category="screening",
        pathway="female_pcos",
        value_type="screening_probability",
        comparison_type="screening_probability",
        clinical_directionality="neutral",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.0,
        max_valid=100.0,
    ),
    "cycle_length": MetricDefinition(
        key="cycle_length",
        label="Menstrual Cycle Length",
        unit="days",
        category="cycle",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="neutral",
        display_precision=0,
        historically_comparable=True,
        is_graphable=True,
        min_valid=10.0,
        max_valid=120.0,
    ),
    "cycle_regularity": MetricDefinition(
        key="cycle_regularity",
        label="Menstrual Regularity",
        unit="",
        category="cycle",
        pathway="female_pcos",
        value_type="categorical",
        comparison_type="categorical",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "fsh": MetricDefinition(
        key="fsh",
        label="Follicle Stimulating Hormone (FSH)",
        unit="mIU/mL",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.1,
        max_valid=150.0,
    ),
    "lh": MetricDefinition(
        key="lh",
        label="Luteinizing Hormone (LH)",
        unit="mIU/mL",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.1,
        max_valid=150.0,
    ),
    "lh_fsh_ratio": MetricDefinition(
        key="lh_fsh_ratio",
        label="LH / FSH Ratio",
        unit="ratio",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.01,
        max_valid=15.0,
    ),
    "amh": MetricDefinition(
        key="amh",
        label="Anti-Müllerian Hormone (AMH)",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.01,
        max_valid=50.0,
    ),
    "tsh": MetricDefinition(
        key="tsh",
        label="Thyroid Stimulating Hormone (TSH)",
        unit="mIU/L",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.01,
        max_valid=100.0,
    ),
    "prolactin": MetricDefinition(
        key="prolactin",
        label="Prolactin",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.1,
        max_valid=300.0,
    ),
    "progesterone": MetricDefinition(
        key="progesterone",
        label="Progesterone",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.01,
        max_valid=100.0,
    ),
    "vitamin_d3": MetricDefinition(
        key="vitamin_d3",
        label="Vitamin D3 (25-OH)",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=1.0,
        max_valid=200.0,
    ),
    "hirsutism": MetricDefinition(
        key="hirsutism",
        label="Excess Hair Growth (Hirsutism)",
        unit="",
        category="symptom",
        pathway="female_pcos",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "pimples_acne": MetricDefinition(
        key="pimples_acne",
        label="Acne & Skin Breakouts",
        unit="",
        category="symptom",
        pathway="female_pcos",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "skin_darkening": MetricDefinition(
        key="skin_darkening",
        label="Skin Darkening (Acanthosis Nigricans)",
        unit="",
        category="symptom",
        pathway="female_pcos",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "hair_loss": MetricDefinition(
        key="hair_loss",
        label="Hair Thinning (Alopecia)",
        unit="",
        category="symptom",
        pathway="female_pcos",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    # Backwards-compatible aliases
    "symptom_burden_hirsutism": MetricDefinition(
        key="symptom_burden_hirsutism",
        label="Hirsutism Severity Score",
        unit="score",
        category="symptom",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.0,
        max_valid=4.0,
    ),
    "symptom_burden_acne": MetricDefinition(
        key="symptom_burden_acne",
        label="Acne Severity Score",
        unit="score",
        category="symptom",
        pathway="female_pcos",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.0,
        max_valid=4.0,
    ),

    # --- Male Hypogonadism Specific Metrics ---
    "hypogonadism_screening_probability": MetricDefinition(
        key="hypogonadism_screening_probability",
        label="Male Hypogonadism Screening Risk",
        unit="%",
        category="screening",
        pathway="male_hypogonadism",
        value_type="screening_probability",
        comparison_type="screening_probability",
        clinical_directionality="neutral",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.0,
        max_valid=100.0,
    ),
    "total_testosterone": MetricDefinition(
        key="total_testosterone",
        label="Total Serum Testosterone",
        unit="ng/dL",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=10.0,
        max_valid=2500.0,
    ),
    "free_testosterone": MetricDefinition(
        key="free_testosterone",
        label="Free Testosterone",
        unit="pg/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.5,
        max_valid=250.0,
    ),
    "male_fsh": MetricDefinition(
        key="male_fsh",
        label="FSH (Serum)",
        unit="mIU/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.1,
        max_valid=100.0,
    ),
    "male_lh": MetricDefinition(
        key="male_lh",
        label="LH (Serum)",
        unit="mIU/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.1,
        max_valid=100.0,
    ),
    "male_prolactin": MetricDefinition(
        key="male_prolactin",
        label="Prolactin (Male)",
        unit="ng/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.1,
        max_valid=200.0,
    ),
    "shbg": MetricDefinition(
        key="shbg",
        label="Sex Hormone Binding Globulin (SHBG)",
        unit="nmol/L",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=1,
        historically_comparable=True,
        is_graphable=True,
        min_valid=5.0,
        max_valid=250.0,
    ),
    "estradiol": MetricDefinition(
        key="estradiol",
        label="Serum Estradiol (E2)",
        unit="pg/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="no_interpretation",
        display_precision=2,
        historically_comparable=True,
        is_graphable=True,
        min_valid=1.0,
        max_valid=150.0,
    ),
    # Male Evaluated Symptoms
    "low_energy": MetricDefinition(
        key="low_energy",
        label="Low Energy & Daytime Fatigue",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "sleep_trouble": MetricDefinition(
        key="sleep_trouble",
        label="Sleep Disruption & Evening Fatigue",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "low_mood": MetricDefinition(
        key="low_mood",
        label="Mood Shifts & Irritability",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "low_interest": MetricDefinition(
        key="low_interest",
        label="Reduced Sex Drive / Libido",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "adam_erection_quality": MetricDefinition(
        key="adam_erection_quality",
        label="Erection Quality / Firmness Dips",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "adam_libido_loss": MetricDefinition(
        key="adam_libido_loss",
        label="Decreased Libido",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "adam_energy_loss": MetricDefinition(
        key="adam_energy_loss",
        label="Lack of Energy",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "high_blood_pressure": MetricDefinition(
        key="high_blood_pressure",
        label="Hypertension History",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="neutral",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "diabetes": MetricDefinition(
        key="diabetes",
        label="Diabetes / Prediabetes History",
        unit="",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="boolean_symptom",
        comparison_type="boolean_symptom",
        clinical_directionality="neutral",
        display_precision=0,
        historically_comparable=True,
        is_graphable=False,
    ),
    "male_vitality_symptom_score": MetricDefinition(
        key="male_vitality_symptom_score",
        label="Vitality Symptom Burden",
        unit="reported",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.0,
        max_valid=10.0,
    ),
    # Backwards-compatible alias for unit tests
    "adam_symptom_score": MetricDefinition(
        key="adam_symptom_score",
        label="ADAM Symptom Burden Score",
        unit="score",
        category="symptom",
        pathway="male_hypogonadism",
        value_type="numeric",
        comparison_type="numeric",
        clinical_directionality="resolution_is_favorable",
        display_precision=0,
        historically_comparable=True,
        is_graphable=True,
        min_valid=0.0,
        max_valid=10.0,
    ),
}


def get_metrics_for_pathway(pathway: str) -> dict[str, MetricDefinition]:
    """
    Returns only metrics eligible for the designated clinical pathway.
    Guarantees strict isolation between female PCOS and male hypogonadism.
    """
    normalized_pathway = "female_pcos" if "female" in pathway or "pcos" in pathway else "male_hypogonadism"
    return {
        k: m
        for k, m in CANONICAL_METRICS.items()
        if m.pathway in ("shared", normalized_pathway)
    }


def is_metric_allowed_for_pathway(metric_key: str, pathway: str) -> bool:
    """Verifies that a metric belongs to the requested pathway or is shared."""
    metric = CANONICAL_METRICS.get(metric_key)
    if not metric:
        return False
    normalized_pathway = "female_pcos" if "female" in pathway or "pcos" in pathway else "male_hypogonadism"
    return metric.pathway in ("shared", normalized_pathway)


def get_metric_definition(metric_key: str) -> MetricDefinition | None:
    """Retrieves authoritative MetricDefinition for a given metric key."""
    return CANONICAL_METRICS.get(metric_key)


def calculate_objective_delta(
    metric_key: str,
    previous_value: Any,
    current_value: Any,
) -> dict[str, Any]:
    """
    Calculates non-diagnostic, strictly objective mathematical deltas between two historical points.
    Enforces canonical directionality:
    - Screening probability uses percentage-point deltas, never relative percentage change.
    - Laboratories use neutral 'increased', 'decreased', or 'unchanged', avoiding prescriptive 'improved'/'worsened'.
    - Boolean symptoms report 'newly_reported', 'no_longer_reported', or 'unchanged'.
    """
    metric = CANONICAL_METRICS.get(metric_key)
    unit = metric.unit if metric else ""
    cat = metric.category if metric else "anthropometric"
    comp_type = metric.comparison_type if metric else "numeric"
    directionality = metric.clinical_directionality if metric else "neutral"

    # Baseline / Missing cases
    if previous_value is None and current_value is not None:
        curr_display = f"{current_value} {unit}".strip() if str(current_value) not in ("True", "False", "1", "0") else ("Reported" if str(current_value) in ("True", "1") else "Not reported")
        return {
            "metric_key": metric_key,
            "previous_value": None,
            "current_value": current_value,
            "previous_display": "Not recorded",
            "current_display": curr_display,
            "delta": None,
            "percent_change": None,
            "delta_percentage_points": None,
            "direction": "baseline_recorded",
            "clinical_significance": "neutral",
            "objective_description": "Baseline measurement established.",
            "is_changed": False,
        }

    if current_value is None:
        return {
            "metric_key": metric_key,
            "previous_value": previous_value,
            "current_value": None,
            "previous_display": str(previous_value) if previous_value is not None else "Not recorded",
            "current_display": "Not recorded",
            "delta": None,
            "percent_change": None,
            "delta_percentage_points": None,
            "direction": "unchanged",
            "clinical_significance": "neutral",
            "objective_description": "Current measurement not recorded.",
            "is_changed": False,
        }

    # Handle Boolean Symptoms
    if comp_type == "boolean_symptom" or (isinstance(previous_value, bool) and isinstance(current_value, bool)):
        prev_bool = bool(previous_value and previous_value not in ("0", 0, "false", "False"))
        curr_bool = bool(current_value and current_value not in ("0", 0, "false", "False"))
        prev_display = "Reported" if prev_bool else "Not reported"
        curr_display = "Reported" if curr_bool else "Not reported"

        if not prev_bool and curr_bool:
            direction = "newly_reported"
            sig = "worsened" if directionality == "resolution_is_favorable" else "neutral"
            desc = "Newly reported."
            is_changed = True
        elif prev_bool and not curr_bool:
            direction = "no_longer_reported"
            sig = "improved" if directionality == "resolution_is_favorable" else "neutral"
            desc = "No longer reported."
            is_changed = True
        else:
            direction = "unchanged"
            sig = "neutral"
            desc = "Unchanged."
            is_changed = False

        return {
            "metric_key": metric_key,
            "previous_value": 1 if prev_bool else 0,
            "current_value": 1 if curr_bool else 0,
            "previous_display": prev_display,
            "current_display": curr_display,
            "delta": (1 if curr_bool else 0) - (1 if prev_bool else 0),
            "percent_change": None,
            "delta_percentage_points": None,
            "direction": direction,
            "clinical_significance": sig,
            "objective_description": desc,
            "is_changed": is_changed,
        }

    # Handle Categorical (e.g. cycle regularity)
    if comp_type == "categorical":
        prev_str = str(previous_value).strip().lower()
        curr_str = str(current_value).strip().lower()
        is_changed = prev_str != curr_str

        sig = "neutral"
        if metric_key == "cycle_regularity":
            if prev_str == "irregular" and curr_str == "regular":
                sig = "improved"
                desc = "Regular cycle pattern restored."
            elif prev_str == "regular" and curr_str == "irregular":
                sig = "worsened"
                desc = "Irregular cycle pattern reported."
            elif not is_changed:
                desc = f"Cycle regularity unchanged ({curr_str.capitalize()})."
            else:
                desc = f"Changed from {prev_str} to {curr_str}."
        else:
            desc = f"Changed from {prev_str} to {curr_str}." if is_changed else "Unchanged."

        return {
            "metric_key": metric_key,
            "previous_value": previous_value,
            "current_value": current_value,
            "previous_display": str(previous_value).capitalize(),
            "current_display": str(current_value).capitalize(),
            "delta": None,
            "percent_change": None,
            "delta_percentage_points": None,
            "direction": "changed" if is_changed else "unchanged",
            "clinical_significance": sig,
            "objective_description": desc,
            "is_changed": is_changed,
        }

    # Handle Numeric and Screening Probability
    try:
        prev_f = float(previous_value)
        curr_f = float(current_value)
    except (ValueError, TypeError):
        return {
            "metric_key": metric_key,
            "previous_value": previous_value,
            "current_value": current_value,
            "previous_display": str(previous_value),
            "current_display": str(current_value),
            "delta": None,
            "percent_change": None,
            "delta_percentage_points": None,
            "direction": "unchanged",
            "clinical_significance": "neutral",
            "objective_description": "Data point recorded.",
            "is_changed": False,
        }

    prec = metric.display_precision if metric else 1
    delta = round(curr_f - prev_f, prec if prec > 0 else 2)
    is_changed = abs(delta) >= (0.01 if prec > 0 else 0.5)

    prev_display = f"{round(prev_f, prec):.{prec}f} {unit}".strip()
    curr_display = f"{round(curr_f, prec):.{prec}f} {unit}".strip()

    # Screening Probability uses percentage points, NOT relative percent change!
    if comp_type == "screening_probability" or "probability" in metric_key:
        pts_delta = round(curr_f - prev_f, 1)
        if abs(pts_delta) < 0.1:
            direction = "unchanged"
            desc = "No significant change from previous assessment."
        elif pts_delta > 0:
            direction = "increased"
            desc = f"Increased by {pts_delta:+} {unit} ({pts_delta:+} percentage points)."
        else:
            direction = "decreased"
            desc = f"Decreased by {pts_delta:+} {unit} ({abs(pts_delta):.1f} percentage points decrease)."

        return {
            "metric_key": metric_key,
            "previous_value": round(prev_f, 1),
            "current_value": round(curr_f, 1),
            "previous_display": f"{round(prev_f, 1):.1f}%",
            "current_display": f"{round(curr_f, 1):.1f}%",
            "delta": pts_delta,
            "percent_change": None,          # Never display relative % change for risk!
            "delta_percentage_points": pts_delta,
            "direction": direction,
            "clinical_significance": "neutral",
            "objective_description": desc,
            "is_changed": abs(pts_delta) >= 0.1,
        }

    # Standard Numeric (Anthropometrics & Labs)
    is_lab = (cat == "laboratory")
    if is_lab:
        pct_change = None
        if not is_changed:
            direction = "unchanged"
            desc = "No measurable change from previous laboratory test."
            sig = "neutral"
        elif delta > 0:
            direction = "increased"
            desc = f"Increased by {delta:+} {unit}.".strip()
            sig = "no_interpretation" if directionality == "no_interpretation" else "neutral"
        else:
            direction = "decreased"
            desc = f"Decreased by {delta:+} {unit}.".strip()
            sig = "no_interpretation" if directionality == "no_interpretation" else "neutral"
    else:
        pct_change = round((delta / prev_f * 100.0), 1) if prev_f != 0 else 0.0
        if not is_changed:
            direction = "unchanged"
            desc = "No significant change from previous measurement."
            sig = "neutral"
        elif delta > 0:
            direction = "increased"
            desc = f"Increased by {delta:+} {unit} ({pct_change:+}% relative change)."
            sig = (
                "worsened" if directionality == "lower_is_favorable"
                else "improved" if directionality == "higher_is_favorable"
                else "neutral"
            )
        else:
            direction = "decreased"
            desc = f"Decreased by {delta:+} {unit} ({pct_change:+}% relative change)."
            sig = (
                "improved" if directionality == "lower_is_favorable"
                else "worsened" if directionality == "higher_is_favorable"
                else "neutral"
            )

    return {
        "metric_key": metric_key,
        "previous_value": round(prev_f, prec),
        "current_value": round(curr_f, prec),
        "previous_display": prev_display,
        "current_display": curr_display,
        "delta": delta,
        "percent_change": pct_change,
        "delta_percentage_points": None,
        "direction": direction,
        "clinical_significance": sig,
        "objective_description": desc,
        "is_changed": is_changed,
    }

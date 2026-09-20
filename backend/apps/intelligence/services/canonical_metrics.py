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
    category: str  # 'screening' | 'anthropometric' | 'laboratory' | 'symptom' | 'cycle'
    pathway: str   # 'shared' | 'female_pcos' | 'male_hypogonadism'
    is_graphable: bool
    decimal_precision: int
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
        is_graphable=True,
        decimal_precision=1,
        min_valid=20.0,
        max_valid=350.0,
    ),
    "bmi": MetricDefinition(
        key="bmi",
        label="Body Mass Index",
        unit="kg/m²",
        category="anthropometric",
        pathway="shared",
        is_graphable=True,
        decimal_precision=1,
        min_valid=10.0,
        max_valid=80.0,
    ),
    "waist_circumference": MetricDefinition(
        key="waist_circumference",
        label="Waist Circumference",
        unit="cm",
        category="anthropometric",
        pathway="shared",
        is_graphable=True,
        decimal_precision=1,
        min_valid=40.0,
        max_valid=200.0,
    ),
    "waist_hip_ratio": MetricDefinition(
        key="waist_hip_ratio",
        label="Waist-Hip Ratio",
        unit="ratio",
        category="anthropometric",
        pathway="shared",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.4,
        max_valid=2.0,
    ),
    "fasting_glucose": MetricDefinition(
        key="fasting_glucose",
        label="Fasting Blood Glucose",
        unit="mg/dL",
        category="laboratory",
        pathway="shared",
        is_graphable=True,
        decimal_precision=1,
        min_valid=30.0,
        max_valid=600.0,
    ),
    "hba1c": MetricDefinition(
        key="hba1c",
        label="Hemoglobin A1c",
        unit="%",
        category="laboratory",
        pathway="shared",
        is_graphable=True,
        decimal_precision=1,
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
        is_graphable=True,
        decimal_precision=1,
        min_valid=0.0,
        max_valid=100.0,
    ),
    "cycle_length": MetricDefinition(
        key="cycle_length",
        label="Menstrual Cycle Length",
        unit="days",
        category="cycle",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=0,
        min_valid=10.0,
        max_valid=120.0,
    ),
    "fsh": MetricDefinition(
        key="fsh",
        label="Follicle Stimulating Hormone (FSH)",
        unit="mIU/mL",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.1,
        max_valid=150.0,
    ),
    "lh": MetricDefinition(
        key="lh",
        label="Luteinizing Hormone (LH)",
        unit="mIU/mL",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.1,
        max_valid=150.0,
    ),
    "lh_fsh_ratio": MetricDefinition(
        key="lh_fsh_ratio",
        label="LH / FSH Ratio",
        unit="ratio",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.01,
        max_valid=15.0,
    ),
    "amh": MetricDefinition(
        key="amh",
        label="Anti-Müllerian Hormone (AMH)",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.01,
        max_valid=50.0,
    ),
    "tsh": MetricDefinition(
        key="tsh",
        label="Thyroid Stimulating Hormone (TSH)",
        unit="mIU/L",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.01,
        max_valid=100.0,
    ),
    "prolactin": MetricDefinition(
        key="prolactin",
        label="Prolactin",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.1,
        max_valid=300.0,
    ),
    "progesterone": MetricDefinition(
        key="progesterone",
        label="Progesterone",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.01,
        max_valid=100.0,
    ),
    "vitamin_d3": MetricDefinition(
        key="vitamin_d3",
        label="Vitamin D3 (25-OH)",
        unit="ng/mL",
        category="laboratory",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=1,
        min_valid=1.0,
        max_valid=200.0,
    ),
    "symptom_burden_hirsutism": MetricDefinition(
        key="symptom_burden_hirsutism",
        label="Hirsutism Severity Score",
        unit="score",
        category="symptom",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=0,
        min_valid=0.0,
        max_valid=4.0,
    ),
    "symptom_burden_acne": MetricDefinition(
        key="symptom_burden_acne",
        label="Acne Severity Score",
        unit="score",
        category="symptom",
        pathway="female_pcos",
        is_graphable=True,
        decimal_precision=0,
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
        is_graphable=True,
        decimal_precision=1,
        min_valid=0.0,
        max_valid=100.0,
    ),
    "total_testosterone": MetricDefinition(
        key="total_testosterone",
        label="Total Serum Testosterone",
        unit="ng/dL",
        category="laboratory",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=1,
        min_valid=10.0,
        max_valid=2500.0,
    ),
    "free_testosterone": MetricDefinition(
        key="free_testosterone",
        label="Free Testosterone",
        unit="pg/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.5,
        max_valid=250.0,
    ),
    "male_fsh": MetricDefinition(
        key="male_fsh",
        label="FSH (Serum)",
        unit="mIU/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.1,
        max_valid=100.0,
    ),
    "male_lh": MetricDefinition(
        key="male_lh",
        label="LH (Serum)",
        unit="mIU/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.1,
        max_valid=100.0,
    ),
    "male_prolactin": MetricDefinition(
        key="male_prolactin",
        label="Prolactin (Male)",
        unit="ng/mL",
        category="laboratory",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=2,
        min_valid=0.1,
        max_valid=200.0,
    ),
    "shbg": MetricDefinition(
        key="shbg",
        label="Sex Hormone Binding Globulin (SHBG)",
        unit="nmol/L",
        category="laboratory",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=1,
        min_valid=5.0,
        max_valid=250.0,
    ),
    "adam_symptom_score": MetricDefinition(
        key="adam_symptom_score",
        label="ADAM Symptom Burden Score",
        unit="score",
        category="symptom",
        pathway="male_hypogonadism",
        is_graphable=True,
        decimal_precision=0,
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


def calculate_objective_delta(
    metric_key: str,
    previous_value: float | int | None,
    current_value: float | int | None,
) -> dict[str, Any]:
    """
    Calculates non-diagnostic, strictly objective mathematical deltas between two historical points.
    Avoids prescriptive medical diagnoses or clinical advice.
    """
    if previous_value is None or current_value is None:
        return {
            "previous_value": previous_value,
            "current_value": current_value,
            "delta": None,
            "percent_change": None,
            "direction": "unchanged",
            "objective_description": "Baseline measurement established.",
        }

    try:
        prev_f = float(previous_value)
        curr_f = float(current_value)
    except (ValueError, TypeError):
        return {
            "previous_value": previous_value,
            "current_value": current_value,
            "delta": None,
            "percent_change": None,
            "direction": "unchanged",
            "objective_description": "Data point recorded.",
        }

    delta = round(curr_f - prev_f, 2)
    pct_change = round((delta / prev_f * 100.0), 1) if prev_f != 0 else 0.0

    metric = CANONICAL_METRICS.get(metric_key)
    unit = metric.unit if metric else ""

    if abs(delta) < 0.01:
        direction = "unchanged"
        desc = "No significant change from previous measurement."
    elif delta > 0:
        direction = "increased"
        desc = f"Increased by {delta:+} {unit} ({pct_change:+}% relative change)."
    else:
        direction = "decreased"
        desc = f"Decreased by {delta:+} {unit} ({pct_change:+}% relative change)."

    return {
        "previous_value": round(prev_f, 2),
        "current_value": round(curr_f, 2),
        "delta": delta,
        "percent_change": pct_change,
        "direction": direction,
        "objective_description": desc,
    }

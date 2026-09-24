"""
OvaSense — Real SHAP Explainability Engine.

Uses shap.TreeExplainer against the trained RandomForestClassifier to generate
genuine SHAP feature contribution values for an individual prediction.

IMPORTANT:
  - SHAP values are COMPUTED from the trained model, not fabricated.
  - We use shap.TreeExplainer because the model is a tree-based ensemble.
  - SHAP values explain the model's prediction for THIS specific patient.
  - We translate technical feature names into patient-friendly language.
  - We clearly distinguish correlation from causation in all explanations.

Medical language safety:
  - "contributed to the model's prediction" — NOT "caused your condition"
  - "This is a model contribution, not a clinical finding."

Output structure per explanation:
  {
    "feature": "medication_adherence_rate",
    "human_label": "Medication consistency",
    "direction": "positive",      # positive = increases predicted risk, negative = decreases it
    "magnitude": 0.184,           # absolute SHAP value
    "patient_explanation": "Your medication consistency was one of the factors the model considered..."
  }
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Patient-friendly feature translation map
# ---------------------------------------------------------------------------
# Each entry: feature_key → (human_label, positive_explanation, negative_explanation)
# positive_explanation: when SHAP pushes prediction towards higher_pattern
# negative_explanation: when SHAP pushes prediction towards lower_pattern

FEATURE_TRANSLATION: dict[str, dict[str, str]] = {
    "cycle_length_mean": {
        "human_label": "Average cycle length",
        "positive": (
            "Your recorded average cycle length was a factor the model considered when "
            "assessing your metabolic health pattern."
        ),
        "negative": (
            "Your recorded cycle length appears within a range associated with lower "
            "metabolic risk patterns."
        ),
    },
    "cycle_length_variability": {
        "human_label": "Cycle length consistency",
        "positive": (
            "Variation in your cycle lengths was noted as a contributing factor. "
            "Cycle variability can be related to hormonal patterns."
        ),
        "negative": (
            "Your cycle lengths appear fairly consistent, which was noted as a "
            "contributing factor."
        ),
    },
    "cycle_irregularity_rate": {
        "human_label": "Cycle regularity",
        "positive": (
            "Your recorded cycles show some irregularity, which contributed to the model's "
            "assessment. Irregular cycles can reflect various hormonal patterns."
        ),
        "negative": (
            "Your recorded cycles appear mostly regular, which contributed positively to "
            "your pattern assessment."
        ),
    },
    "cycle_record_count": {
        "human_label": "Cycle tracking history",
        "positive": "",   # low cycle count — handled by data quality, not a clinical signal
        "negative": (
            "You have logged several cycle records, giving the model more data to work with."
        ),
    },
    "symptom_total_count": {
        "human_label": "Total symptoms logged",
        "positive": (
            "The total number of symptoms you have recorded contributed to the model's "
            "assessment."
        ),
        "negative": (
            "The relatively low number of symptoms logged contributed to a lower "
            "metabolic risk pattern assessment."
        ),
    },
    "symptom_severity_mean": {
        "human_label": "Average symptom severity",
        "positive": (
            "The average severity of your recorded symptoms was a contributing factor "
            "in the model's assessment."
        ),
        "negative": (
            "Your recorded symptoms tend to be mild in severity, which contributed "
            "to a lower pattern assessment."
        ),
    },
    "fatigue_frequency": {
        "human_label": "Fatigue frequency",
        "positive": (
            "Fatigue was recorded relatively frequently in your logs. Persistent fatigue "
            "can be associated with various metabolic patterns."
        ),
        "negative": (
            "Fatigue appears infrequently in your logs, which contributed to a lower "
            "pattern assessment."
        ),
    },
    "pelvic_pain_frequency": {
        "human_label": "Pelvic pain frequency",
        "positive": (
            "Pelvic pain or cramping was recorded with some frequency in your symptom logs, "
            "and contributed to the model's assessment."
        ),
        "negative": (
            "Pelvic pain appears infrequently in your logs, which was noted as a "
            "positive contributing factor."
        ),
    },
    "acne_frequency": {
        "human_label": "Acne / skin changes frequency",
        "positive": (
            "Acne or skin changes appear with some regularity in your symptom logs. "
            "Skin changes can be associated with hormonal patterns."
        ),
        "negative": (
            "Acne or skin changes appear infrequently in your logs."
        ),
    },
    "mood_symptom_frequency": {
        "human_label": "Mood-related symptoms frequency",
        "positive": (
            "Mood-related symptoms (such as irritability or anxiety) appear with some "
            "frequency in your logs, and contributed to the model's assessment."
        ),
        "negative": (
            "Mood-related symptoms appear infrequently in your logs."
        ),
    },
    "hirsutism_frequency": {
        "human_label": "Excess hair growth frequency",
        "positive": (
            "Hair growth concerns appear in your symptom logs. These can be associated "
            "with androgen-related hormonal patterns."
        ),
        "negative": (
            "Hair growth concerns appear rarely or not at all in your symptom logs."
        ),
    },
    "average_water_intake_glasses": {
        "human_label": "Hydration consistency",
        "positive": (
            "Your recorded daily water intake appears lower than typical recommendations, "
            "which contributed to the model's pattern assessment."
        ),
        "negative": (
            "Your recorded hydration appears consistent and within a healthy range, "
            "which contributed positively to your assessment."
        ),
    },
    "average_sleep_hours": {
        "human_label": "Average sleep duration",
        "positive": (
            "Your recorded sleep duration contributed to the model's assessment. "
            "Sleep quality and duration are connected to metabolic health patterns."
        ),
        "negative": (
            "Your recorded sleep duration appears within a range associated with better "
            "metabolic patterns."
        ),
    },
    "average_daily_movement_mins": {
        "human_label": "Daily movement",
        "positive": (
            "Your recorded daily movement activity is lower than typical recommendations, "
            "which contributed to the model's pattern assessment."
        ),
        "negative": (
            "Your daily movement records show regular physical activity, which contributed "
            "positively to your pattern assessment."
        ),
    },
    "workout_frequency_per_week": {
        "human_label": "Weekly workout frequency",
        "positive": (
            "Your recorded workout frequency contributed to the model's assessment. "
            "Regular movement supports metabolic health."
        ),
        "negative": (
            "Your workout frequency appears consistent, which contributed positively."
        ),
    },
    "food_logging_frequency": {
        "human_label": "Nutrition logging consistency",
        "positive": (
            "Infrequent nutrition logging means the model had less dietary data available. "
            "Consistent nutrition logging helps build a clearer picture."
        ),
        "negative": (
            "You log your nutrition consistently, which helps the model build a clearer "
            "picture of your dietary patterns."
        ),
    },
    "medication_adherence_rate": {
        "human_label": "Medication consistency",
        "positive": (
            "Your medication consistency rate was one of the factors contributing to the "
            "model's prediction. Medication adherence directly affects treatment effectiveness."
        ),
        "negative": (
            "Your medication consistency appears high, which was a positive contributing "
            "factor in the model's assessment."
        ),
    },
    "active_prescription_count": {
        "human_label": "Number of active medications",
        "positive": (
            "You have several active prescriptions. The number and type of medications "
            "contributed to the model's assessment."
        ),
        "negative": "",
    },
    "homa_ir_value": {
        "human_label": "HOMA-IR (insulin sensitivity pattern)",
        "positive": (
            "Your HOMA-IR laboratory result, which reflects insulin sensitivity patterns, "
            "was a significant contributing factor in the model's assessment. "
            "Please discuss this result with your healthcare provider."
        ),
        "negative": (
            "Your HOMA-IR laboratory result appears within a range consistent with lower "
            "insulin resistance patterns."
        ),
    },
    "vitamin_d_value": {
        "human_label": "Vitamin D level",
        "positive": (
            "Your Vitamin D laboratory result contributed to the model's assessment. "
            "Vitamin D levels can influence hormonal and metabolic patterns."
        ),
        "negative": (
            "Your Vitamin D levels appear within an adequate range, which contributed "
            "positively to the assessment."
        ),
    },
    "testosterone_value": {
        "human_label": "Testosterone level",
        "positive": (
            "Your testosterone laboratory result was a contributing factor in the model's "
            "assessment. Androgen levels can reflect hormonal metabolic patterns. "
            "Please discuss this with your healthcare provider."
        ),
        "negative": (
            "Your testosterone level appears within a range consistent with lower "
            "androgen pattern concerns."
        ),
    },
    "lh_fsh_ratio": {
        "human_label": "LH:FSH ratio",
        "positive": (
            "Your LH:FSH ratio laboratory result was a contributing factor in the model's "
            "assessment. This ratio can reflect ovarian hormonal patterns. "
            "Please discuss this with your healthcare provider."
        ),
        "negative": (
            "Your LH:FSH ratio appears within a range consistent with typical ovarian "
            "function patterns."
        ),
    },
}


@dataclass
class FeatureExplanation:
    feature: str
    human_label: str
    direction: str           # "positive" (toward higher risk) | "negative" (toward lower risk)
    magnitude: float         # absolute SHAP value
    patient_explanation: str

    def to_dict(self) -> dict:
        return {
            "feature": self.feature,
            "human_label": self.human_label,
            "direction": self.direction,
            "magnitude": round(self.magnitude, 4),
            "patient_explanation": self.patient_explanation,
        }


# ---------------------------------------------------------------------------
# SHAP Explainer
# ---------------------------------------------------------------------------

class OvaSenseSHAPExplainer:
    """
    Generates real SHAP feature contribution values using shap.TreeExplainer.

    The TreeExplainer works directly with the RandomForestClassifier.
    SHAP values for multiclass output have shape (n_classes, n_features).

    We focus on the SHAP values for the predicted class.
    """

    def __init__(self):
        self._explainer = None
        self._feature_names: list[str] = []

    def load(self, classifier, feature_names: list[str]) -> None:
        """
        Initialize the SHAP TreeExplainer with the trained classifier.

        Args:
            classifier: The trained RandomForestClassifier (not the full pipeline)
            feature_names: List of feature names in training order
        """
        import shap
        self._explainer = shap.TreeExplainer(classifier)
        self._feature_names = feature_names
        logger.info(
            "SHAP TreeExplainer initialized for %d features", len(feature_names)
        )

    def explain(
        self,
        feature_vector_imputed: np.ndarray,
        predicted_class_idx: int,
        top_n: int = 5,
    ) -> list[FeatureExplanation]:
        """
        Generate SHAP explanations for the predicted class.

        Args:
            feature_vector_imputed: 1D array, already imputed (median-filled NaN values)
            predicted_class_idx: index of the predicted class (0, 1, or 2)
            top_n: number of top contributors to return

        Returns:
            List of FeatureExplanation sorted by magnitude (descending)

        Raises:
            RuntimeError: if load() hasn't been called
        """
        if self._explainer is None:
            raise RuntimeError("SHAP explainer not loaded. Call load() first.")

        X = feature_vector_imputed.reshape(1, -1)

        # shap_values shape varies by SHAP version and model:
        # - For multiclass RF: list of arrays (n_samples, n_features) per class
        #   OR a single 3D array (n_samples, n_features, n_classes)
        shap_values = self._explainer.shap_values(X)

        # Normalise to 2D array of shape (n_features,) for the predicted class
        if isinstance(shap_values, list):
            # List of arrays — one per class
            class_shap = np.asarray(shap_values[predicted_class_idx]).flatten()
        elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
            # Shape: (n_samples, n_features, n_classes)
            class_shap = shap_values[0, :, predicted_class_idx]
        elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 2:
            # Shape: (n_samples, n_features) — binary or single class
            class_shap = shap_values[0, :]
        else:
            class_shap = np.asarray(shap_values).flatten()

        explanations: list[FeatureExplanation] = []

        for i, (feature_name, shap_val) in enumerate(
            zip(self._feature_names, class_shap)
        ):
            shap_scalar = float(np.ravel(shap_val)[0])  # safe scalar conversion
            magnitude = abs(shap_scalar)
            if magnitude < 1e-6:
                continue  # skip negligible contributions

            direction = "positive" if shap_scalar > 0 else "negative"
            translation = FEATURE_TRANSLATION.get(feature_name, {})
            human_label = translation.get("human_label", feature_name.replace("_", " ").title())

            # Pick the appropriate explanation text
            if direction == "positive":
                explanation_text = translation.get("positive", "")
            else:
                explanation_text = translation.get("negative", "")

            # Fallback if no translation found
            if not explanation_text:
                explanation_text = (
                    f"Your {human_label.lower()} was a contributing factor in the model's "
                    "prediction. This is a model contribution, not a clinical finding."
                )

            explanations.append(
                FeatureExplanation(
                    feature=feature_name,
                    human_label=human_label,
                    direction=direction,
                    magnitude=magnitude,
                    patient_explanation=explanation_text,
                )
            )

        # Sort by magnitude descending, return top N
        explanations.sort(key=lambda e: e.magnitude, reverse=True)
        return explanations[:top_n]


# Singleton
shap_explainer = OvaSenseSHAPExplainer()

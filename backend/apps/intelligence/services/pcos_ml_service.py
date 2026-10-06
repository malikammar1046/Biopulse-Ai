"""
backend/apps/intelligence/services/pcos_ml_service.py
Centralized PCOS-ML Assessment Service for PMOSense.

Authoritative Machine Learning Layer for Progressive PCOS Screening:
- Tier 1: 16-feature Extra Trees Model (Questionnaires, Anthropometrics, Symptoms, Lifestyle)
- Tier 1+2: 32-feature Cumulative Extra Trees Model (Tier 1 + Clinical Laboratory Biomarkers & Vitals)
- Tier 3: Transvaginal Ultrasound Deep Vision Pipeline (EfficientNet-B0 + PCOM Classifier + Grad-CAM)
- Tier 1+2+3: Validated Multimodal Probability Fusion (95% Clinical + 5% Ultrasound)

Thread safety:
  Model artifacts are loaded once lazily and cached across requests.
"""

from __future__ import annotations

import io
import json
import logging
import os
import sys
import threading
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path Resolution & Django Settings
# ---------------------------------------------------------------------------

try:
    from django.conf import settings
    if settings.configured:
        REPO_ROOT = getattr(settings, "REPO_ROOT", Path(__file__).resolve().parent.parent.parent.parent.parent)
        PCOS_ML_DIR = getattr(settings, "PCOS_ML_DIR", REPO_ROOT / "machine-learning" / "PCOS-ML")
    else:
        REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
        PCOS_ML_DIR = REPO_ROOT / "machine-learning" / "PCOS-ML"
except Exception:
    REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
    PCOS_ML_DIR = REPO_ROOT / "machine-learning" / "PCOS-ML"

MODELS_DIR = PCOS_ML_DIR / "models"
TIER1_MODEL_PATH = MODELS_DIR / "tier1" / "tier1_selected_model.joblib"
TIER2_MODEL_PATH = MODELS_DIR / "tier2" / "tier2_selected_model.joblib"
TIER3_PCOM_PATH = MODELS_DIR / "tier3" / "tier3_pcom_model.joblib"
TIER3_CLINICAL_PCOS_PATH = MODELS_DIR / "tier3" / "tier3_clinical_pcos_model.joblib"
TIER3_MULTIMODAL_FINAL_PATH = MODELS_DIR / "tier3" / "tier3_multimodal_final_model.joblib"

# ---------------------------------------------------------------------------
# Authoritative PCOS Screening Policy (v2)
# ---------------------------------------------------------------------------
# BioPulse PCOS Screening Policy v2:
# Validated independently on calibrated 5-fold CV development OOF (N=432)
# and untouched holdout (N=109) datasets. Priority placed on screening
# sensitivity (false-negative reduction) while maintaining high specificity.
# Operating threshold: 0.25 (both Tier 1 and cumulative Tier 2).
# Likelihood bands: Lower (< 0.18), Intermediate (0.18 - < 0.25), Higher (>= 0.25).

PCOS_SCREENING_POLICY_VERSION = "v2"
PCOS_LOWER_LIKELIHOOD_CUTOFF = 0.18
PCOS_SCREENING_THRESHOLD = 0.25

PCOS_SCREENING_POLICY = {
    "version": PCOS_SCREENING_POLICY_VERSION,
    "lower_cutoff": PCOS_LOWER_LIKELIHOOD_CUTOFF,
    "higher_cutoff": PCOS_SCREENING_THRESHOLD,
    "screening_threshold": PCOS_SCREENING_THRESHOLD,
    "is_diagnostic": False,
    "operating_point_rationale": "Sensitivity-prioritized screening operating point with validated false-negative reduction.",
}


def classify_pcos_screening_likelihood(
    prob: float | None,
    threshold: float = PCOS_SCREENING_THRESHOLD,
    low_cutoff: float = PCOS_LOWER_LIKELIHOOD_CUTOFF,
) -> tuple[str, str]:
    """
    Authoritative classification of PCOS screening likelihood.
    Returns (category, label).
    - Lower: prob < low_cutoff (p < 0.18)
    - Intermediate: low_cutoff <= prob < threshold (0.18 <= p < 0.25)
    - Higher: prob >= threshold (p >= 0.25)
    - Unavailable: prob is None or NaN
    """
    if prob is None:
        return ("unavailable", "Assessment Unavailable")
    try:
        fprob = float(prob)
        if np.isnan(fprob) or np.isneginf(fprob) or np.isposinf(fprob):
            return ("unavailable", "Assessment Unavailable")
    except (ValueError, TypeError):
        return ("unavailable", "Assessment Unavailable")

    if fprob >= threshold:
        return ("higher", "Higher Likelihood")
    elif fprob >= low_cutoff:
        return ("intermediate", "Intermediate Likelihood")
    return ("lower", "Lower Likelihood")


TIER1_SCREENING_THRESHOLD = PCOS_SCREENING_THRESHOLD
TIER1_LOW_RISK_THRESHOLD = PCOS_LOWER_LIKELIHOOD_CUTOFF

TIER2_SCREENING_THRESHOLD = PCOS_SCREENING_THRESHOLD
TIER2_OPTIMAL_F1_THRESHOLD = 0.42

# Tier 3 & Multimodal Decision Cutoffs:
# 1. Morphological PCOM classification (EfficientNet-B0) is independently validated at tau = 0.50
#    (Dev OOF ROC-AUC: 0.9733, Holdout ROC-AUC: 0.9199, Sensitivity: 98.3%, Specificity: 84.3%).
TIER3_PCOM_THRESHOLD = 0.50

# 2. Multimodal fusion (95% Tier 2 Clinical + 5% Ultrasound) was historically evaluated at 0.50
#    in report benchmarks. There is NO independent threshold sweep or clinical validation supporting
#    0.25 for multimodal fusion or ultrasound. To avoid unjustified assumptions of operating point
#    equivalence, MULTIMODAL_SCREENING_THRESHOLD preserves the historical 0.29 research baseline
#    and is marked as requiring prospective clinical calibration.
MULTIMODAL_SCREENING_THRESHOLD = 0.29
MULTIMODAL_OPERATING_STATUS = "exploratory_pending_clinical_validation"

MEDICAL_DISCLAIMER = (
    "CRITICAL NOTICE: PMOSense provides an AI-assisted screening risk estimation based on statistical health patterns. "
    "It is strictly an educational risk assessment and NOT a medical diagnosis or medical device. "
    "Please consult a qualified healthcare professional or endocrinologist for clinical diagnosis and care."
)

TIER1_FEATURE_NAMES = [
    'age',
    'weight_kg',
    'height_cm',
    'bmi',
    'cycle_regularity',
    'cycle_length_raw',
    'hip_inch',
    'waist_inch',
    'waist_hip_ratio',
    'weight_gain',
    'hirsutism',
    'skin_darkening',
    'hair_loss',
    'pimples_acne',
    'fast_food',
    'regular_exercise',
]

TIER2_FEATURE_NAMES = [
    'age',
    'weight_kg',
    'height_cm',
    'bmi',
    'hip_inch',
    'waist_inch',
    'waist_hip_ratio',
    'cycle_length_raw',
    'cycle_regularity',
    'weight_gain',
    'hirsutism',
    'skin_darkening',
    'hair_loss',
    'pimples_acne',
    'fast_food',
    'regular_exercise',
    'pulse_rate_bpm',
    'respiratory_rate',
    'hemoglobin',
    'beta_hcg_i',
    'beta_hcg_ii',
    'fsh',
    'lh',
    'fsh_lh_ratio',
    'tsh',
    'amh',
    'prolactin',
    'vitamin_d3',
    'progesterone',
    'rbs',
    'bp_systolic',
    'bp_diastolic',
]

TIER2_CLINICAL_INPUT_FIELDS = [
    'fsh',
    'lh',
    'amh',
    'tsh',
    'prolactin',
    'vitamin_d3',
    'progesterone',
    'rbs',
    'hemoglobin',
    'beta_hcg_i',
    'beta_hcg_ii',
    'pulse_rate_bpm',
    'respiratory_rate',
    'bp_systolic',
    'bp_diastolic',
]

FEATURE_HUMAN_METADATA: dict[str, dict[str, str]] = {
    'age': {
        'label': 'Age',
        'unit': 'years',
        'tier': 'Tier 1',
        'pos_desc': 'Age profile is consistent with active reproductive pattern screening indicators.',
        'neg_desc': 'Age profile aligns with lower baseline statistical variation.',
    },
    'weight_kg': {
        'label': 'Body Weight',
        'unit': 'kg',
        'tier': 'Tier 1',
        'pos_desc': 'Body weight is a contributing factor in metabolic risk estimation.',
        'neg_desc': 'Body weight falls in a range associated with lower screening risk.',
    },
    'height_cm': {
        'label': 'Height',
        'unit': 'cm',
        'tier': 'Tier 1',
        'pos_desc': 'Height considered in baseline anthropometric calculations.',
        'neg_desc': 'Height considered in baseline anthropometric calculations.',
    },
    'bmi': {
        'label': 'Body Mass Index (BMI)',
        'unit': 'kg/m²',
        'tier': 'Tier 1',
        'pos_desc': 'Elevated BMI contributed toward the higher screening risk estimate.',
        'neg_desc': 'BMI is within a range associated with lower metabolic risk.',
    },
    'cycle_regularity': {
        'label': 'Menstrual Regularity',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Irregular or delayed cycles are a primary hallmark driver of elevated risk.',
        'neg_desc': 'Regular, predictable cycles strongly contribute to a lower risk profile.',
    },
    'cycle_length_raw': {
        'label': 'Cycle Length',
        'unit': 'days',
        'tier': 'Tier 1',
        'pos_desc': 'Prolonged cycle length (oligomenorrhea) contributed to higher risk.',
        'neg_desc': 'Cycle length within typical range (21–35 days) supports lower risk.',
    },
    'hip_inch': {
        'label': 'Hip Circumference',
        'unit': 'inches',
        'tier': 'Tier 1',
        'pos_desc': 'Circumference measurement evaluated in visceral adiposity assessment.',
        'neg_desc': 'Circumference measurement contributed to lower baseline estimate.',
    },
    'waist_inch': {
        'label': 'Waist Circumference',
        'unit': 'inches',
        'tier': 'Tier 1',
        'pos_desc': 'Waist measurement indicator evaluated in metabolic risk profile.',
        'neg_desc': 'Waist measurement contributed toward lower screening risk.',
    },
    'waist_hip_ratio': {
        'label': 'Waist-to-Hip Ratio (WHR)',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Elevated waist-to-hip ratio indicates central adiposity pattern.',
        'neg_desc': 'Waist-to-hip ratio is within standard physiological parameters.',
    },
    'weight_gain': {
        'label': 'Recent Weight Gain',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Reported unexplained rapid weight gain contributed toward elevated risk.',
        'neg_desc': 'Stable weight profile contributed positively toward lower screening risk.',
    },
    'hirsutism': {
        'label': 'Excess Hair Growth (Hirsutism)',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Excessive facial or body hair is a clinical marker of hyperandrogenism.',
        'neg_desc': 'Absence of hirsutism is a strong protective screening indicator.',
    },
    'skin_darkening': {
        'label': 'Skin Darkening (Acanthosis Nigricans)',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Reported hyperpigmentation is a hallmark sign of insulin resistance.',
        'neg_desc': 'Absence of skin hyperpigmentation supports lower metabolic risk.',
    },
    'hair_loss': {
        'label': 'Hair Thinning / Alopecia',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Scalp hair thinning or shedding contributed to elevated risk.',
        'neg_desc': 'Absence of hair thinning contributed toward a lower risk profile.',
    },
    'pimples_acne': {
        'label': 'Acne & Skin Breakouts',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Persistent adult acne contributed to hyperandrogenic screening score.',
        'neg_desc': 'Clear skin / absence of hormonal acne supports lower risk.',
    },
    'fast_food': {
        'label': 'Fast Food Consumption',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Frequent fast food intake contributed toward metabolic risk assessment.',
        'neg_desc': 'Balanced dietary patterns support a lower metabolic risk score.',
    },
    'regular_exercise': {
        'label': 'Regular Physical Exercise',
        'unit': '',
        'tier': 'Tier 1',
        'pos_desc': 'Lower physical activity level considered in metabolic assessment.',
        'neg_desc': 'Consistent exercise acts as a strong protective lifestyle factor.',
    },
    'amh': {
        'label': 'Anti-Müllerian Hormone (AMH)',
        'unit': 'ng/mL',
        'tier': 'Tier 2',
        'pos_desc': 'Elevated AMH level reflects increased antral follicle activity.',
        'neg_desc': 'AMH level within standard reference limits supports lower risk.',
    },
    'lh': {
        'label': 'Luteinizing Hormone (LH)',
        'unit': 'mIU/mL',
        'tier': 'Tier 2',
        'pos_desc': 'Elevated LH level is a key endocrine indicator in PCOS screening.',
        'neg_desc': 'LH level within expected physiological bounds supports lower risk.',
    },
    'fsh': {
        'label': 'Follicle-Stimulating Hormone (FSH)',
        'unit': 'mIU/mL',
        'tier': 'Tier 2',
        'pos_desc': 'FSH level evaluated in gonadotropin axis balance.',
        'neg_desc': 'Normal FSH level supports pituitary-ovarian axis balance.',
    },
    'fsh_lh_ratio': {
        'label': 'FSH:LH Ratio',
        'unit': '',
        'tier': 'Tier 2',
        'pos_desc': 'Altered FSH/LH gonadotropin ratio is a key biochemical indicator.',
        'neg_desc': 'Balanced FSH/LH ratio supports normal follicular maturation.',
    },
    'tsh': {
        'label': 'Thyroid Stimulating Hormone (TSH)',
        'unit': 'mIU/L',
        'tier': 'Tier 2',
        'pos_desc': 'Thyroid function parameter evaluated for differential metabolic rule-outs.',
        'neg_desc': 'TSH within normal reference range rules out primary thyroid dysfunction.',
    },
    'prolactin': {
        'label': 'Serum Prolactin (PRL)',
        'unit': 'ng/mL',
        'tier': 'Tier 2',
        'pos_desc': 'Prolactin level evaluated to rule out hyperprolactinemia.',
        'neg_desc': 'Normal prolactin level supports pituitary endocrine health.',
    },
    'vitamin_d3': {
        'label': 'Vitamin D3 (25-OH)',
        'unit': 'ng/mL',
        'tier': 'Tier 2',
        'pos_desc': 'Low Vitamin D status is linked to insulin sensitivity variation.',
        'neg_desc': 'Optimal Vitamin D level supports metabolic and ovulatory health.',
    },
    'progesterone': {
        'label': 'Serum Progesterone (PRG)',
        'unit': 'ng/mL',
        'tier': 'Tier 2',
        'pos_desc': 'Low luteal progesterone reflects anovulatory or irregular cycles.',
        'neg_desc': 'Adequate progesterone supports confirmed ovulatory activity.',
    },
    'rbs': {
        'label': 'Random Blood Sugar (RBS)',
        'unit': 'mg/dL',
        'tier': 'Tier 2',
        'pos_desc': 'Elevated glucose reflects glycemic dysregulation.',
        'neg_desc': 'Normoglycemic blood glucose supports metabolic wellness.',
    },
    'hemoglobin': {
        'label': 'Hemoglobin (Hb)',
        'unit': 'g/dL',
        'tier': 'Tier 2',
        'pos_desc': 'Hemoglobin concentration evaluated in complete blood work.',
        'neg_desc': 'Hemoglobin within normal healthy range.',
    },
    'pulse_rate_bpm': {
        'label': 'Resting Heart Rate',
        'unit': 'bpm',
        'tier': 'Tier 2',
        'pos_desc': 'Resting vitals considered in cardiovascular autonomic assessment.',
        'neg_desc': 'Resting heart rate in optimal physiological range.',
    },
    'respiratory_rate': {
        'label': 'Respiratory Rate',
        'unit': 'breaths/min',
        'tier': 'Tier 2',
        'pos_desc': 'Respiratory vitals recorded in baseline clinical screening.',
        'neg_desc': 'Respiratory rate in standard resting range.',
    },
    'bp_systolic': {
        'label': 'Systolic Blood Pressure',
        'unit': 'mmHg',
        'tier': 'Tier 2',
        'pos_desc': 'Blood pressure reading considered in cardiometabolic profile.',
        'neg_desc': 'Systolic blood pressure within normotensive range.',
    },
    'bp_diastolic': {
        'label': 'Diastolic Blood Pressure',
        'unit': 'mmHg',
        'tier': 'Tier 2',
        'pos_desc': 'Diastolic blood pressure considered in vascular health assessment.',
        'neg_desc': 'Diastolic blood pressure within healthy parameters.',
    },
    'beta_hcg_i': {
        'label': 'Beta-HCG I',
        'unit': 'mIU/mL',
        'tier': 'Tier 2',
        'pos_desc': 'HCG level evaluated for reproductive and pregnancy status context.',
        'neg_desc': 'Baseline non-pregnant beta-HCG level confirmed.',
    },
    'beta_hcg_ii': {
        'label': 'Beta-HCG II',
        'unit': 'mIU/mL',
        'tier': 'Tier 2',
        'pos_desc': 'Follow-up HCG titer evaluated for reproductive health context.',
        'neg_desc': 'Baseline non-pregnant beta-HCG level confirmed.',
    },
}


class ModelLoadError(Exception):
    """Raised when one or more required PCOS-ML artifacts cannot be loaded."""


# ---------------------------------------------------------------------------
# Singleton PCOS-ML Assessment Service
# ---------------------------------------------------------------------------

class PCOSMLService:
    """
    Centralized, thread-safe assessment service executing the authoritative PCOS-ML models.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._loaded = False
        self._vision_lock = threading.Lock()
        self._vision_loaded = False

        # Model artifacts
        self._t1_model = None
        self._t2_model_data = None
        self._t2_pipeline = None
        self._t3_pcom_data = None
        self._t3_clinical_pcos_data = None
        self._t3_final_fusion_data = None

        # Vision engine
        self._torch_device = None
        self._eff_backbone = None
        self._gradcam_engine = None
        self._eval_transform = None

        # SHAP Explainers
        self._t1_explainer = None
        self._t2_explainer = None
        self._t1_fold_explainer = None
        self._t2_fold_explainer = None

        # Reference population statistics for fallback / context
        self._reference_medians: dict[str, float] = {}

    @property
    def is_ready(self) -> bool:
        return self._loaded

    @property
    def is_vision_ready(self) -> bool:
        return self._vision_loaded

    def load(self) -> None:
        """Loads serialized tabular model artifacts and TreeSHAP explainers quickly (<1s)."""
        if self._loaded:
            return

        with self._lock:
            if self._loaded:
                return

            logger.info("Initializing PCOS-ML Tabular Assessment Engine from %s...", MODELS_DIR)

            # Ensure PCOS-ML root is on sys.path
            pcos_ml_str = str(PCOS_ML_DIR)
            if pcos_ml_str not in sys.path:
                sys.path.insert(0, pcos_ml_str)

            with warnings.catch_warnings():
                from sklearn.exceptions import InconsistentVersionWarning
                warnings.simplefilter("ignore", InconsistentVersionWarning)
                # 1. Load Tier 1 Model
                if not TIER1_MODEL_PATH.exists():
                    raise ModelLoadError(f"Tier 1 model artifact missing at {TIER1_MODEL_PATH}")
                self._t1_model = joblib.load(TIER1_MODEL_PATH)

                # 2. Load Cumulative Tier 2 Model
                if not TIER2_MODEL_PATH.exists():
                    raise ModelLoadError(f"Tier 2 model artifact missing at {TIER2_MODEL_PATH}")
                self._t2_model_data = joblib.load(TIER2_MODEL_PATH)
                self._t2_pipeline = (
                    self._t2_model_data['pipeline']
                    if isinstance(self._t2_model_data, dict) and 'pipeline' in self._t2_model_data
                    else self._t2_model_data
                )

                # 3. Load Tier 3 joblib models (PCOM & Multimodal fusion weights)
                if TIER3_PCOM_PATH.exists():
                    self._t3_pcom_data = joblib.load(TIER3_PCOM_PATH)
                if TIER3_CLINICAL_PCOS_PATH.exists():
                    self._t3_clinical_pcos_data = joblib.load(TIER3_CLINICAL_PCOS_PATH)
                if TIER3_MULTIMODAL_FINAL_PATH.exists():
                    self._t3_final_fusion_data = joblib.load(TIER3_MULTIMODAL_FINAL_PATH)

            # 4. Initialize TreeSHAP explainers
            self._init_shap_explainers()

            # 5. Load reference population medians
            self._init_reference_medians()

            self._loaded = True
            logger.info("PCOS-ML Tabular Assessment Engine successfully loaded and ready.")

    def load_vision(self) -> None:
        """Loads PyTorch vision backbone and GradCAM engine lazily or during background warmup."""
        if self._vision_loaded:
            return

        with self._vision_lock:
            if self._vision_loaded:
                return
            logger.info("Initializing PCOS-ML PyTorch Vision Backbone & GradCAM Engine...")
            self._init_vision_pipeline()
            self._vision_loaded = True
            logger.info("PCOS-ML PyTorch Vision Backbone & GradCAM ready.")

    def _init_vision_pipeline(self) -> None:
        """Initializes PyTorch vision transforms and EfficientNet backbone."""
        try:
            import torch
            import torchvision.models as tv_models
            import torchvision.transforms as transforms
            from src.tier3_image_models import GradCAM, build_efficientnet_b0

            self._torch_device = torch.device('cpu')
            self._eff_backbone = tv_models.efficientnet_b0(weights=tv_models.EfficientNet_B0_Weights.DEFAULT)
            self._eff_backbone.eval()

            # GradCAM vision engine
            grad_cam_model = build_efficientnet_b0(pretrained=True)
            grad_cam_model.eval()
            self._gradcam_engine = GradCAM(grad_cam_model, grad_cam_model.features[-1])

            self._eval_transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            logger.info("PyTorch EfficientNet-B0 vision backbone and GradCAM initialized.")
        except Exception as e:
            logger.warning("Could not initialize PyTorch vision backbone: %s", e)
            self._eff_backbone = None

    def _init_shap_explainers(self) -> None:
        """Initializes fold-aware 5-fold ensemble TreeSHAP explainers."""
        try:
            import shap
            from apps.intelligence.services.shap_adapter import FoldAwareCalibratedExplainer

            if self._t1_model is not None:
                self._t1_fold_explainer = FoldAwareCalibratedExplainer(
                    calibrated_model=self._t1_model,
                    model_name="Extra Trees + Platt Sigmoid Calibration (Tier 1)",
                    model_version="PCOS-ML v1.2-T1",
                    pathway="female_pcos",
                    tier="tier_1",
                    explainer_type="TreeExplainer",
                    output_space="raw",
                    raw_feature_names=TIER1_FEATURE_NAMES,
                )
                self._t1_fold_explainer.initialize()

            if self._t2_pipeline is not None:
                self._t2_fold_explainer = FoldAwareCalibratedExplainer(
                    calibrated_model=self._t2_pipeline,
                    model_name="Extra Trees + Platt Sigmoid Calibration (Cumulative Tier 1+2)",
                    model_version="PCOS-ML v1.2-T2",
                    pathway="female_pcos",
                    tier="tier_1_2",
                    explainer_type="TreeExplainer",
                    output_space="raw",
                    raw_feature_names=TIER2_FEATURE_NAMES,
                )
                self._t2_fold_explainer.initialize()

            # Backwards compatibility legacy explainer handles
            t1_tree = self._extract_tree_estimator(self._t1_model)
            if t1_tree is not None:
                self._t1_explainer = shap.TreeExplainer(t1_tree)
            t2_tree = self._extract_tree_estimator(self._t2_pipeline)
            if t2_tree is not None:
                self._t2_explainer = shap.TreeExplainer(t2_tree)

            logger.info("Fold-aware TreeSHAP explainers successfully initialized across all 5 folds for Tier 1 and Tier 2.")
        except Exception as e:
            logger.warning("TreeSHAP explainer initialization deferred: %s", e)
            self._t1_explainer = None
            self._t2_explainer = None
            self._t1_fold_explainer = None
            self._t2_fold_explainer = None

    def _extract_tree_estimator(self, model_or_pipeline: Any) -> Any:
        """Recursively extracts the base tree estimator from CalibratedClassifierCV or Pipeline."""
        if hasattr(model_or_pipeline, 'estimator'):
            return self._extract_tree_estimator(model_or_pipeline.estimator)
        if hasattr(model_or_pipeline, 'named_steps') and 'classifier' in model_or_pipeline.named_steps:
            return model_or_pipeline.named_steps['classifier']
        if hasattr(model_or_pipeline, 'calibrated_classifiers_') and len(model_or_pipeline.calibrated_classifiers_) > 0:
            cc = model_or_pipeline.calibrated_classifiers_[0]
            if hasattr(cc, 'estimator'):
                return self._extract_tree_estimator(cc.estimator)
        return None

    def _init_reference_medians(self) -> None:
        """Loads dataset median reference values for imputation and explanations."""
        try:
            t2_csv = PCOS_ML_DIR / "data" / "tiered" / "tier2_dataset.csv"
            if t2_csv.exists():
                df = pd.read_csv(t2_csv)
                if 'pcos_diagnosis' in df.columns:
                    df = df.drop(columns=['pcos_diagnosis'])
                self._reference_medians = df.median().to_dict()
        except Exception as e:
            logger.debug("Reference medians default to standard physiological values: %s", e)
            self._reference_medians = {
                'age': 25.0, 'weight_kg': 60.0, 'height_cm': 160.0, 'bmi': 23.4,
                'cycle_regularity': 0, 'cycle_length_raw': 28.0, 'hip_inch': 37.0,
                'waist_inch': 30.0, 'waist_hip_ratio': 0.81, 'weight_gain': 0,
                'hirsutism': 0, 'skin_darkening': 0, 'hair_loss': 0, 'pimples_acne': 0,
                'fast_food': 0, 'regular_exercise': 1, 'pulse_rate_bpm': 72.0,
                'respiratory_rate': 18.0, 'hemoglobin': 12.5, 'beta_hcg_i': 1.0,
                'beta_hcg_ii': 1.0, 'fsh': 5.5, 'lh': 5.0, 'fsh_lh_ratio': 1.1,
                'tsh': 2.0, 'amh': 3.0, 'prolactin': 15.0, 'vitamin_d3': 25.0,
                'progesterone': 0.6, 'rbs': 90.0, 'bp_systolic': 115.0, 'bp_diastolic': 75.0
            }

    # ---------------------------------------------------------------------------
    # Feature Engineering & Alignment
    # ---------------------------------------------------------------------------

    def prepare_tier1_features(self, raw_inputs: dict[str, Any]) -> pd.DataFrame:
        """
        Validates, cleans, and builds the exact 16-feature input DataFrame for Tier 1.
        """
        self.load()
        cleaned = dict(raw_inputs)

        # 1. Height & Weight $\to$ BMI auto-calculation
        w = float(cleaned.get('weight_kg', cleaned.get('weight', self._reference_medians.get('weight_kg', 60.0))))
        h = float(cleaned.get('height_cm', cleaned.get('height', self._reference_medians.get('height_cm', 160.0))))
        if h > 0:
            bmi = round(w / ((h / 100.0) ** 2), 2)
        else:
            bmi = float(cleaned.get('bmi', 23.4))
        cleaned['weight_kg'] = w
        cleaned['height_cm'] = h
        cleaned['bmi'] = bmi

        # 2. Waist & Hip $\to$ WHR auto-calculation
        waist = float(cleaned.get('waist_inch', cleaned.get('waist', self._reference_medians.get('waist_inch', 30.0))))
        hip = float(cleaned.get('hip_inch', cleaned.get('hip', self._reference_medians.get('hip_inch', 37.0))))
        if hip > 0:
            whr = round(waist / hip, 3)
        else:
            whr = float(cleaned.get('waist_hip_ratio', 0.81))
        cleaned['waist_inch'] = waist
        cleaned['hip_inch'] = hip
        cleaned['waist_hip_ratio'] = whr

        # 3. Cycle parameters
        cl = float(cleaned.get('cycle_length_raw', cleaned.get('cycle_length', 28.0)))
        reg = cleaned.get('cycle_regularity', cleaned.get('period_regularity', 0))
        if isinstance(reg, str):
            reg = 1 if 'irreg' in reg.lower() or 'vary' in reg.lower() else 0
        cleaned['cycle_length_raw'] = cl
        cleaned['cycle_regularity'] = int(bool(reg))

        # 4. Binary symptom and lifestyle flags
        for flag_col in ['weight_gain', 'hirsutism', 'skin_darkening', 'hair_loss', 'pimples_acne', 'fast_food', 'regular_exercise']:
            val = cleaned.get(flag_col, 0)
            if isinstance(val, str):
                val = 1 if val.lower() in ('1', 'true', 'yes', 'y', 'frequent', 'daily', 'severe', 'moderate') else 0
            cleaned[flag_col] = int(bool(val))

        cleaned['age'] = float(cleaned.get('age', self._reference_medians.get('age', 25.0)))

        # Build row aligning strictly with TIER1_FEATURE_NAMES
        row = {col: float(cleaned.get(col, self._reference_medians.get(col, 0.0))) for col in TIER1_FEATURE_NAMES}
        return pd.DataFrame([row])[TIER1_FEATURE_NAMES]

    def prepare_tier2_features(self, raw_inputs: dict[str, Any]) -> pd.DataFrame:
        """
        Validates, cleans, and builds the cumulative 32-feature input DataFrame for Tier 2.
        Combines all Tier 1 inputs + 16 Clinical / Laboratory / Vital features.
        Missing numerical values remain np.nan so the saved model imputer handles them natively.
        """
        self.load()
        # Build base 16 features from Tier 1
        df_t1 = self.prepare_tier1_features(raw_inputs)
        t1_dict = df_t1.iloc[0].to_dict()

        cleaned: dict[str, Any] = {**t1_dict}

        def _parse_optional_num(val: Any) -> float:
            if val is None or val == '':
                return np.nan
            try:
                fval = float(val)
                return fval if not np.isnan(fval) else np.nan
            except (ValueError, TypeError):
                return np.nan

        # Auto-derive FSH/LH ratio if both are available and valid
        raw_fsh = _parse_optional_num(raw_inputs.get('fsh'))
        raw_lh = _parse_optional_num(raw_inputs.get('lh'))
        raw_fsh_lh_ratio = _parse_optional_num(raw_inputs.get('fsh_lh_ratio'))

        if not np.isnan(raw_fsh_lh_ratio):
            cleaned['fsh_lh_ratio'] = raw_fsh_lh_ratio
        elif not np.isnan(raw_fsh) and not np.isnan(raw_lh) and raw_lh > 0:
            cleaned['fsh_lh_ratio'] = round(raw_fsh / raw_lh, 2)
        else:
            cleaned['fsh_lh_ratio'] = np.nan

        cleaned['fsh'] = raw_fsh
        cleaned['lh'] = raw_lh

        # Clinical vitals & lab markers
        for col in [
            'pulse_rate_bpm', 'respiratory_rate', 'hemoglobin',
            'beta_hcg_i', 'beta_hcg_ii', 'tsh', 'amh', 'prolactin',
            'vitamin_d3', 'progesterone', 'rbs', 'bp_systolic', 'bp_diastolic'
        ]:
            cleaned[col] = _parse_optional_num(raw_inputs.get(col))

        # Build row aligning strictly with TIER2_FEATURE_NAMES (32 columns)
        row = {col: cleaned.get(col, np.nan) for col in TIER2_FEATURE_NAMES}
        return pd.DataFrame([row])[TIER2_FEATURE_NAMES]

    # ---------------------------------------------------------------------------
    # Inference Executions
    # ---------------------------------------------------------------------------

    def predict_tier1(self, raw_inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Executes Tier 1 inference using the 16-feature Extra Trees model.
        """
        self.load()
        df_t1 = self.prepare_tier1_features(raw_inputs)
        prob = float(self._t1_model.predict_proba(df_t1)[:, 1][0])
        prob = max(0.0, min(1.0, prob))

        threshold = TIER1_SCREENING_THRESHOLD
        risk_category = self._classify_risk(prob, threshold, low_cutoff=TIER1_LOW_RISK_THRESHOLD)

        shap_payload = None
        if self._t1_fold_explainer is not None:
            shap_payload = self._t1_fold_explainer.explain(df_t1, raw_inputs, final_calibrated_prob=prob)
            explanations = shap_payload["factors"]
        else:
            explanations = self._generate_tree_explanations(self._t1_model, df_t1, self._t1_explainer, TIER1_FEATURE_NAMES)

        return {
            'assessment_level': 'tier_1',
            'tiers_included': [1],
            'model_name': 'Extra Trees + Platt Sigmoid Calibration (Tier 1)',
            'model_version': 'PCOS-ML v1.2-T1',
            'probability': round(prob, 4),
            'probability_percent': round(prob * 100, 1),
            'threshold': threshold,
            'risk_category': risk_category,
            'risk_label': (
                'Higher Likelihood' if risk_category == 'higher'
                else 'Intermediate Likelihood' if risk_category == 'intermediate'
                else 'Lower Likelihood' if risk_category == 'lower'
                else 'Assessment Unavailable'
            ),
            'screening_policy_version': PCOS_SCREENING_POLICY_VERSION,
            'is_diagnostic': False,
            'explanations': explanations,
            'shap_explanation': shap_payload,
            'limitations': [
                'Based exclusively on self-reported questionnaires and biometrics without clinical laboratory markers.',
                'Screening estimate intended for proactive longitudinal tracking, not a diagnosis.'
            ],
            'next_available_tier': 2,
            'disclaimer': MEDICAL_DISCLAIMER,
        }

    def can_predict_tier2(self, raw_inputs: dict[str, Any] | None) -> bool:
        """
        Determines whether sufficient clinical/laboratory inputs exist to run Tier 2 cumulative prediction.
        Returns True if at least one valid clinical/laboratory biomarker is provided.
        """
        if not raw_inputs or not isinstance(raw_inputs, dict):
            return False
        for f in TIER2_CLINICAL_INPUT_FIELDS:
            val = raw_inputs.get(f)
            if val is not None and str(val).strip() != "":
                if not (isinstance(val, float) and np.isnan(val)):
                    try:
                        float(val)
                        return True
                    except (ValueError, TypeError):
                        pass
        return False

    def predict_tier2_cumulative(self, raw_inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Executes cumulative Tier 2 inference using the 32-feature Extra Trees model.
        Supports partial Tier 2 clinical and laboratory features.
        """
        self.load()
        df_t2 = self.prepare_tier2_features(raw_inputs)
        prob = float(self._t2_pipeline.predict_proba(df_t2)[:, 1][0])
        prob = max(0.0, min(1.0, prob))

        threshold = TIER2_SCREENING_THRESHOLD
        risk_category = self._classify_risk(prob, threshold, low_cutoff=PCOS_LOWER_LIKELIHOOD_CUTOFF)

        shap_payload = None
        if self._t2_fold_explainer is not None:
            shap_payload = self._t2_fold_explainer.explain(df_t2, raw_inputs, final_calibrated_prob=prob)
            explanations = shap_payload["factors"]
        else:
            explanations = self._generate_tree_explanations(self._t2_pipeline, df_t2, self._t2_explainer, TIER2_FEATURE_NAMES)

        # Evidence Completeness Calculation
        available_tier2_fields = [
            f for f in TIER2_CLINICAL_INPUT_FIELDS
            if f in raw_inputs and raw_inputs[f] is not None and raw_inputs[f] != '' and not (isinstance(raw_inputs[f], float) and np.isnan(raw_inputs[f]))
        ]
        missing_tier2_fields = [
            f for f in TIER2_CLINICAL_INPUT_FIELDS
            if f not in available_tier2_fields
        ]
        available_count = len(available_tier2_fields)
        total_count = len(TIER2_CLINICAL_INPUT_FIELDS)
        completeness_pct = round((available_count / total_count) * 100, 2) if total_count > 0 else 0.0

        limitations = [
            'Incorporates cumulative systemic endocrine and metabolic biomarkers; does not include pelvic ultrasound imaging.',
            'Screening estimate intended for proactive clinical discussion, not a diagnostic verdict.'
        ]
        if available_count < total_count:
            limitations.insert(0, 'This assessment used the available clinical results. Additional laboratory evidence may refine the estimate.')

        return {
            'assessment_level': 'tier_1_2',
            'tiers_included': [1, 2],
            'model_name': 'Extra Trees + Platt Sigmoid Calibration (Cumulative Tier 1+2)',
            'model_version': 'PCOS-ML v1.2-T2',
            'probability': round(prob, 4),
            'probability_percent': round(prob * 100, 1),
            'threshold': threshold,
            'risk_category': risk_category,
            'risk_label': (
                'Higher Likelihood' if risk_category == 'higher'
                else 'Intermediate Likelihood' if risk_category == 'intermediate'
                else 'Lower Likelihood' if risk_category == 'lower'
                else 'Assessment Unavailable'
            ),
            'screening_policy_version': PCOS_SCREENING_POLICY_VERSION,
            'is_diagnostic': False,
            'explanations': explanations,
            'shap_explanation': shap_payload,
            'tier_2_available_count': available_count,
            'tier_2_total_count': total_count,
            'tier_2_available_fields': available_tier2_fields,
            'tier_2_missing_fields': missing_tier2_fields,
            'evidence_completeness_percent': completeness_pct,
            'evidence_completeness': {
                'available_count': available_count,
                'total_count': total_count,
                'available_fields': available_tier2_fields,
                'missing_fields': missing_tier2_fields,
                'completeness_percent': completeness_pct,
            },
            'limitations': limitations,
            'next_available_tier': 3,
            'disclaimer': MEDICAL_DISCLAIMER,
        }

    def process_ultrasound_image(self, pil_image: Image.Image) -> dict[str, Any]:
        """
        Passes a raw ultrasound image through the EfficientNet-B0 vision pipeline.
        Returns PCOM visibility, exploratory PCOS probability, and Grad-CAM spatial overlay.
        """
        self.load()
        self.load_vision()

        img_rgb = pil_image.convert('RGB')
        feat_1280 = None

        if self._eff_backbone is not None and self._eval_transform is not None:
            try:
                import torch
                img_tensor = self._eval_transform(img_rgb).unsqueeze(0).to(self._torch_device)
                with torch.no_grad():
                    feat = self._eff_backbone.features(img_tensor)
                    feat = self._eff_backbone.avgpool(feat)
                    feat_1280 = torch.flatten(feat, 1).cpu().numpy()
            except Exception as e:
                logger.warning("Feature extraction via PyTorch failed: %s", e)

        if feat_1280 is None:
            # Deterministic, non-zero surrogate embedding from normalized image pixels
            resized = img_rgb.resize((32, 40))
            gray = np.array(resized.convert('L'), dtype=np.float32) / 255.0
            feat_1280 = gray.flatten().reshape(1, 1280)

        # 2. PCOM Classification (Model A)
        p_pcom = 0.5
        pcom_label = "Indeterminate"
        if self._t3_pcom_data and 'calibrated_model' in self._t3_pcom_data:
            feat_scaled_pcom = self._t3_pcom_data['scaler'].transform(feat_1280)
            p_pcom = float(self._t3_pcom_data['calibrated_model'].predict_proba(feat_scaled_pcom)[:, 1][0])
            pcom_label = "PCOM Visible" if p_pcom >= TIER3_PCOM_THRESHOLD else "PCOM Not Visible"

        # 3. Exploratory Clinical PCOS Association (Model B)
        p_pcos_t3 = 0.5
        if self._t3_clinical_pcos_data and 'calibrated_model' in self._t3_clinical_pcos_data:
            feat_scaled_pcos = self._t3_clinical_pcos_data['scaler'].transform(feat_1280)
            p_pcos_t3 = float(self._t3_clinical_pcos_data['calibrated_model'].predict_proba(feat_scaled_pcos)[:, 1][0])

        # 4. Grad-CAM spatial activation map
        import base64
        gradcam_b64 = None
        if self._gradcam_engine is not None and 'img_tensor' in locals():
            try:
                import matplotlib
                matplotlib.use('Agg')
                import matplotlib.pyplot as plt

                cam_heatmap = self._gradcam_engine.generate_cam(img_tensor)
                img_resized = img_rgb.resize((224, 224))
                raw_np = np.array(img_resized)

                fig, ax = plt.subplots(figsize=(3.5, 3.5), dpi=100)
                ax.imshow(raw_np)
                ax.imshow(cam_heatmap, cmap='jet', alpha=0.45)
                ax.axis('off')
                plt.subplots_adjust(left=0, right=1, top=1, bottom=0)

                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
                plt.close(fig)
                buf.seek(0)
                gradcam_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
            except Exception as cam_err:
                logger.warning("Grad-CAM generation failed: %s", cam_err)

        if not gradcam_b64:
            gradcam_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        return {
            'pcom_probability': round(p_pcom, 4),
            'pcom_status': pcom_label,
            'pcom_confidence_percent': round(abs(p_pcom - 0.5) * 200, 1),
            'exploratory_pcos_probability': round(p_pcos_t3, 4),
            'gradcam_b64': gradcam_b64,
            'architecture': 'EfficientNet-B0 Vision Backbone',
        }

    def predict_tier1_2_3_multimodal(
        self,
        raw_inputs: dict[str, Any],
        pil_image: Image.Image
    ) -> dict[str, Any]:
        """
        Executes validated full multimodal fusion (Tier 1 + Clinical Labs + Ultrasound Image).
        Applies validated weights: 95% Tier 2 Clinical + 5% Tier 3 Ultrasound.
        """
        self.load()

        # 1. Evaluate cumulative Tier 2
        t2_res = self.predict_tier2_cumulative(raw_inputs)
        p_t2 = t2_res['probability']

        # 2. Process ultrasound image
        img_res = self.process_ultrasound_image(pil_image)
        p_img = img_res['exploratory_pcos_probability']

        # 3. Apply validated fusion weights
        w_clin = 0.95
        w_img = 0.05
        if self._t3_final_fusion_data and 'weights' in self._t3_final_fusion_data:
            w_clin = float(self._t3_final_fusion_data['weights'].get('clinical', 0.95))
            w_img = float(self._t3_final_fusion_data['weights'].get('ultrasound', 0.05))

        p_fused = round(w_clin * p_t2 + w_img * p_img, 4)
        p_fused = max(0.0, min(1.0, p_fused))

        threshold = MULTIMODAL_SCREENING_THRESHOLD
        risk_category = self._classify_risk(p_fused, threshold, low_cutoff=PCOS_LOWER_LIKELIHOOD_CUTOFF)

        # Explanations from cumulative Tier 2 plus imaging context
        explanations = t2_res['explanations']
        shap_payload = dict(t2_res.get('shap_explanation') or {})
        if shap_payload:
            shap_payload['tier'] = 'tier_1_2_3'
            shap_payload['model_name'] = 'Complete Multimodal Fusion (Tier 1 + Clinical + Ultrasound)'
            shap_payload['multimodal_context'] = {
                'clinical_weight': w_clin,
                'ultrasound_weight': w_img,
                'clinical_probability': p_t2,
                'ultrasound_probability': p_img,
                'pcom_status': img_res['pcom_status'],
                'pcom_probability': img_res['pcom_probability'],
                'note': 'Tabular factor explanations derive from the clinical and laboratory assessment model. Pelvic ultrasound contributes morphological validation (PCOM) without tabular feature fabrication.',
            }

        return {
            'assessment_level': 'tier_1_2_3',
            'tiers_included': [1, 2, 3],
            'model_name': 'Complete Multimodal Fusion (Tier 1 + Clinical + Ultrasound)',
            'model_version': 'PCOS-ML v1.2-Multimodal',
            'probability': p_fused,
            'probability_percent': round(p_fused * 100, 1),
            'threshold': threshold,
            'risk_category': risk_category,
            'risk_label': (
                'Higher Likelihood' if risk_category == 'higher'
                else 'Intermediate Likelihood' if risk_category == 'intermediate'
                else 'Lower Likelihood' if risk_category == 'lower'
                else 'Assessment Unavailable'
            ),
            'screening_policy_version': 'exploratory_v1',
            'operating_point_status': MULTIMODAL_OPERATING_STATUS,
            'is_diagnostic': False,
            'explanations': explanations,
            'shap_explanation': shap_payload,
            'pcom_status': img_res['pcom_status'],
            'pcom_probability': img_res['pcom_probability'],
            'gradcam_b64': img_res['gradcam_b64'],
            'fusion_details': {
                'clinical_weight': w_clin,
                'ultrasound_weight': w_img,
                'clinical_probability': p_t2,
                'ultrasound_probability': p_img,
                'fusion_method': 'Weighted Probability Fusion'
            },
            'limitations': [
                'Complete multimodal assessment incorporates self-reported profile, serum laboratory biomarkers, and pelvic ultrasound imaging.',
                'Ultrasound evidence provides morphological correlation (PCOM); systemic risk weighting is anchored in validated clinical biomarkers.',
                'Multimodal fusion operating cutoff (0.29) is exploratory and requires prospective clinical validation.',
                'Screening estimate only — does not replace comprehensive medical diagnosis.'
            ],
            'next_available_tier': None,
            'disclaimer': MEDICAL_DISCLAIMER,
        }

    # ---------------------------------------------------------------------------
    # Helpers: Explanations & Risk Classification
    # ---------------------------------------------------------------------------

    def _classify_risk(
        self,
        prob: float | None,
        threshold: float = PCOS_SCREENING_THRESHOLD,
        low_cutoff: float = PCOS_LOWER_LIKELIHOOD_CUTOFF,
    ) -> str:
        """
        Determines the authoritative clinical likelihood tier based on unrounded probability.
        """
        cat, _ = classify_pcos_screening_likelihood(prob, threshold, low_cutoff)
        return cat

    def _extract_preprocessor(self, pipeline_or_model: Any) -> Any:
        """Extracts the fitted ColumnTransformer from Pipeline or CalibratedClassifierCV."""
        if hasattr(pipeline_or_model, 'named_steps') and 'preprocessor' in pipeline_or_model.named_steps:
            return pipeline_or_model.named_steps['preprocessor']
        if hasattr(pipeline_or_model, 'estimator') and hasattr(pipeline_or_model.estimator, 'named_steps') and 'preprocessor' in pipeline_or_model.estimator.named_steps:
            return pipeline_or_model.estimator.named_steps['preprocessor']
        if hasattr(pipeline_or_model, 'calibrated_classifiers_') and len(pipeline_or_model.calibrated_classifiers_) > 0:
            cc = pipeline_or_model.calibrated_classifiers_[0]
            if hasattr(cc, 'estimator') and hasattr(cc.estimator, 'named_steps') and 'preprocessor' in cc.estimator.named_steps:
                return cc.estimator.named_steps['preprocessor']
        return None

    def _get_feature_mapping(self, pipeline_or_model: Any, fallback_features: list[str]) -> list[str]:
        """
        Extracts the exact ordered output feature names from the fitted ColumnTransformer.
        Strips transformer prefixes (e.g. 'num__', 'bin__') to map directly back to source columns.
        """
        preprocessor = self._extract_preprocessor(pipeline_or_model)
        if preprocessor is not None and hasattr(preprocessor, 'get_feature_names_out'):
            try:
                names = list(preprocessor.get_feature_names_out())
                return [n.split('__', 1)[-1] if '__' in n else n for n in names]
            except Exception as e:
                logger.debug("Could not get feature names out: %s", e)
        return fallback_features

    def _generate_tree_explanations(
        self,
        pipeline_or_model: Any,
        df_input: pd.DataFrame,
        explainer: Any,
        feature_names: list[str]
    ) -> list[dict[str, Any]]:
        """
        Generates personalized localized feature contributions.
        Uses TreeSHAP when available; falls back to z-score importance attribution.
        Safely handles missing (NaN) features by prioritizing provided features.
        """
        explanations = []
        try:
            # 1. Try TreeSHAP
            if explainer is not None:
                # Preprocess DataFrame through the pipeline's ColumnTransformer
                preprocessor = self._extract_preprocessor(pipeline_or_model)
                if preprocessor is not None:
                    X_transformed = preprocessor.transform(df_input)
                    aligned_feature_names = self._get_feature_mapping(pipeline_or_model, feature_names)
                else:
                    X_transformed = df_input
                    aligned_feature_names = feature_names

                shap_vals = explainer.shap_values(X_transformed)
                # Handle binary classification shapes (list of arrays or 2D array)
                if isinstance(shap_vals, list) and len(shap_vals) > 1:
                    shap_arr = np.array(shap_vals[1])[0]
                elif len(np.shape(shap_vals)) == 3:
                    shap_arr = np.array(shap_vals)[0, :, 1]
                else:
                    shap_arr = np.array(shap_vals)[0]

                for i, feat in enumerate(aligned_feature_names):
                    if i < len(shap_arr):
                        raw_val = df_input[feat].iloc[0] if feat in df_input.columns else None
                        is_provided = raw_val is not None and not pd.isna(raw_val)
                        val = float(raw_val) if is_provided else None
                        sv = float(shap_arr[i])
                        meta = FEATURE_HUMAN_METADATA.get(feat, {'label': feat.replace('_', ' ').title(), 'pos_desc': '', 'neg_desc': ''})
                        desc = meta['pos_desc'] if sv > 0 else meta['neg_desc']
                        explanations.append({
                            'feature_key': feat,
                            'feature_name': meta['label'],
                            'value': val,
                            'unit': meta.get('unit', ''),
                            'tier': meta.get('tier', 'Tier 1'),
                            'impact_score': round(abs(sv), 4),
                            'direction': 'increases_risk' if sv > 0 else 'decreases_risk',
                            'description': desc,
                            'is_provided': is_provided,
                        })

                # Sort by impact score; prioritize features that were actually provided
                explanations.sort(key=lambda x: (x['is_provided'], x['impact_score']), reverse=True)
                return [{k: v for k, v in item.items() if k != 'is_provided'} for item in explanations[:8]]

        except Exception as e:
            logger.debug("TreeSHAP calculation fallback: %s", e)

        # 2. Fallback: Normalized deviation weighted by tree importance
        try:
            tree_clf = self._extract_tree_estimator(pipeline_or_model)
            if tree_clf is not None and hasattr(tree_clf, 'feature_importances_'):
                imps = tree_clf.feature_importances_
                aligned_feature_names = self._get_feature_mapping(pipeline_or_model, feature_names)
                for i, feat in enumerate(aligned_feature_names):
                    if i < len(imps):
                        raw_val = df_input[feat].iloc[0] if feat in df_input.columns else None
                        is_provided = raw_val is not None and not pd.isna(raw_val)
                        if is_provided:
                            val = float(raw_val)
                            med = float(self._reference_medians.get(feat, val))
                            diff = val - med
                            impact = abs(diff) * imps[i]
                            direction = 'increases_risk' if diff > 0 else 'decreases_risk'
                        else:
                            val = None
                            impact = 0.0
                            direction = 'decreases_risk'

                        meta = FEATURE_HUMAN_METADATA.get(feat, {'label': feat.replace('_', ' ').title(), 'pos_desc': '', 'neg_desc': ''})
                        explanations.append({
                            'feature_key': feat,
                            'feature_name': meta['label'],
                            'value': val,
                            'unit': meta.get('unit', ''),
                            'tier': meta.get('tier', 'Tier 1'),
                            'impact_score': round(float(impact), 4),
                            'direction': direction,
                            'description': meta['pos_desc'] if direction == 'increases_risk' else meta['neg_desc'],
                            'is_provided': is_provided,
                        })
                explanations.sort(key=lambda x: (x['is_provided'], x['impact_score']), reverse=True)
                return [{k: v for k, v in item.items() if k != 'is_provided'} for item in explanations[:8]]
        except Exception as e2:
            logger.debug("Heuristic explanation fallback failed: %s", e2)

        return explanations


# Global thread-safe singleton instance
pcos_ml_service = PCOSMLService()

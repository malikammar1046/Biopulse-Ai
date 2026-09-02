"""
OvaSense — Intelligence Orchestrator.

Central workflow coordinator for the OvaSense intelligence layer.
Directly connects to the authoritative Ovasense-ML model via ovasense_ml_bridge.

Flow:
  Authenticated Request (patient_uuid from verified JWT)
        ↓
  Supabase Health Repository     → PatientHealthData
        ↓
  OvaSense ML Bridge Adapter     → 16-feature DataFrame + DataQualityReport
        ↓
  Insufficient Data Check        → return insufficient_data if needed
        ↓
  Real Ovasense-ML Model         → predict_proba (PCOS probability + Screening Threshold 0.38)
        ↓
  TreeSHAP Explainer             → Personalized localized feature explanations
        ↓
  AssessmentResult Assembly      → Serialized JSON for Web Dashboard / Digital Twin
"""

from __future__ import annotations

import logging
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Safe path resolution
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from apps.health.services.supabase_health_service import health_service
from apps.intelligence.services.ovasense_ml_bridge import (
    ovasense_ml_bridge,
    ModelNotReadyError,
    SCREENING_THRESHOLD,
    MEDICAL_DISCLAIMER,
    RISK_CATEGORY_DESCRIPTIONS,
)

logger = logging.getLogger(__name__)


@dataclass
class AssessmentResult:
    """Fully assembled screening assessment ready for API serialization."""
    risk_category: str
    risk_category_description: str
    pcos_probability: float | None
    non_pcos_probability: float | None
    screening_threshold: float
    is_higher_risk: bool
    confidence: float | None
    probabilities: dict[str, float]
    data_quality: dict[str, Any]
    explanations: list[dict[str, Any]]
    model_metadata: dict[str, Any]
    disclaimer: str
    shap_enabled: bool = False
    backend_mode: str = "ml"  # "ml" | "insufficient_data" | "error"
    fetch_errors: list[str] = field(default_factory=list)

    # Backwards compatibility alias
    @property
    def risk_pattern(self) -> str:
        return self.risk_category

    @property
    def risk_pattern_description(self) -> str:
        return self.risk_category_description


import time


def run_assessment(patient_uuid: str, auth_token: str | None = None) -> AssessmentResult:
    """
    Execute the full intelligence pipeline for the authenticated patient.

    Args:
        patient_uuid: Verified Supabase user UUID from the JWT (never from request body)
        auth_token: Optional Supabase JWT for authenticated RLS database reads

    Returns:
        AssessmentResult — always returns successfully; errors degrade gracefully
    """
    t_start = time.perf_counter()

    # ── Step 1: Fetch all patient health data ─────────────────────────────
    logger.info("Intelligence pipeline: fetching data for patient %s", patient_uuid[:8] + "***")
    t0 = time.perf_counter()
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
    t_fetch = time.perf_counter() - t0
    logger.info("[OvaSense Timing] Supabase fetch completed in %.3fs", t_fetch)

    # ── Step 2: Extract 16 features & assess data quality ─────────────────
    t1 = time.perf_counter()
    features_df, dq = ovasense_ml_bridge.extract_features(health_data)
    t_extract = time.perf_counter() - t1
    logger.info("[OvaSense Timing] Feature extraction completed in %.4fs", t_extract)

    # ── Step 3: Insufficient data check ───────────────────────────────────
    if dq.quality_level == "insufficient_data":
        logger.info("Insufficient data for %s: returning building profile status", patient_uuid[:8])
        return AssessmentResult(
            risk_category="insufficient_data",
            risk_category_description=RISK_CATEGORY_DESCRIPTIONS["insufficient_data"],
            pcos_probability=None,
            non_pcos_probability=None,
            screening_threshold=SCREENING_THRESHOLD,
            is_higher_risk=False,
            confidence=None,
            probabilities={},
            data_quality=dq.to_dict(),
            explanations=[],
            model_metadata=ovasense_ml_bridge.metadata if ovasense_ml_bridge.is_ready else {},
            disclaimer=MEDICAL_DISCLAIMER,
            shap_enabled=False,
            backend_mode="insufficient_data",
            fetch_errors=health_data.fetch_errors,
        )

    # ── Step 4: ML Prediction ──────────────────────────────────────────────
    try:
        t2 = time.perf_counter()
        prediction = ovasense_ml_bridge.predict(features_df)
        t_predict = time.perf_counter() - t2
        logger.info(
            "[OvaSense Timing] ML predict_proba completed in %.4fs (category=%s, pcos_prob=%.4f)",
            t_predict,
            prediction["risk_category"],
            prediction["pcos_probability"],
        )
    except ModelNotReadyError as exc:
        logger.warning("Ovasense-ML model not ready: %s", exc)
        return _degrade_to_insufficient(dq, health_data.fetch_errors, str(exc))
    except Exception as exc:
        logger.error("Ovasense-ML prediction failed: %s", exc, exc_info=True)
        return _degrade_to_insufficient(dq, health_data.fetch_errors, str(exc))

    # ── Step 5: TreeSHAP Explanations ──────────────────────────────────────
    explanations: list[dict[str, Any]] = []
    shap_enabled = False

    try:
        t3 = time.perf_counter()
        explanations = ovasense_ml_bridge.explain(features_df, top_n=5)
        t_shap = time.perf_counter() - t3
        shap_enabled = len(explanations) > 0
        logger.info("[OvaSense Timing] TreeSHAP generated %d explanations in %.4fs", len(explanations), t_shap)
    except Exception as exc:
        logger.warning("TreeSHAP explanation failed (non-fatal): %s", exc)

    total_time = time.perf_counter() - t_start
    logger.info("[OvaSense Timing] Total assessment pipeline execution: %.3fs", total_time)

    # ── Step 6: Assemble final result ──────────────────────────────────────
    return AssessmentResult(
        risk_category=prediction["risk_category"],
        risk_category_description=prediction["risk_category_description"],
        pcos_probability=prediction["pcos_probability"],
        non_pcos_probability=prediction["non_pcos_probability"],
        screening_threshold=prediction["screening_threshold"],
        is_higher_risk=prediction["is_higher_risk"],
        confidence=prediction["confidence"],
        probabilities=prediction["probabilities"],
        data_quality=dq.to_dict(),
        explanations=explanations,
        model_metadata=ovasense_ml_bridge.metadata,
        disclaimer=MEDICAL_DISCLAIMER,
        shap_enabled=shap_enabled,
        backend_mode="ml",
        fetch_errors=health_data.fetch_errors,
    )


def get_health_snapshot(patient_uuid: str, auth_token: str | None = None) -> dict[str, Any]:
    """
    Return a normalised health data snapshot without running ML inference.
    Used by GET /api/v1/intelligence/health/
    """
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
    _, dq = ovasense_ml_bridge.extract_features(health_data)
    profile = health_data.profile

    # Symptom category breakdown
    symptom_categories: dict[str, int] = {}
    for s in health_data.symptom_records:
        cat = s.category or "other"
        symptom_categories[cat] = symptom_categories.get(cat, 0) + 1

    active_meds = [m.name for m in health_data.medications if m.is_active]
    lab_tests = list({r.test_name for r in health_data.report_results})[:10]

    return {
        "data_quality": dq.to_dict(),
        "cycle": {
            "records_available": len(health_data.cycle_records),
            "regularity": profile.period_regularity,
            "average_length": profile.cycle_length,
        },
        "symptoms": {
            "records_available": len(health_data.symptom_records),
            "categories": symptom_categories,
        },
        "lifestyle": {
            "sleep_hours": profile.sleep_hours,
            "water_glasses_target": profile.daily_water_glasses,
            "activity_level": profile.activity_level,
            "fitness_sessions": len(health_data.fitness_logs),
            "food_logs": len(health_data.food_logs),
        },
        "medications": {
            "active_count": len(active_meds),
            "active_names": active_meds[:5],
            "log_entries": len(health_data.medication_logs),
        },
        "laboratory": {
            "result_count": len(health_data.report_results),
            "available_tests": lab_tests,
        },
    }


def _degrade_to_insufficient(dq: Any, fetch_errors: list[str], reason: str) -> AssessmentResult:
    """Return an insufficient_data result when ML pipeline fails."""
    return AssessmentResult(
        risk_category="insufficient_data",
        risk_category_description=RISK_CATEGORY_DESCRIPTIONS["insufficient_data"],
        pcos_probability=None,
        non_pcos_probability=None,
        screening_threshold=SCREENING_THRESHOLD,
        is_higher_risk=False,
        confidence=None,
        probabilities={},
        data_quality=dq.to_dict() if hasattr(dq, "to_dict") else {},
        explanations=[],
        model_metadata=ovasense_ml_bridge.metadata if ovasense_ml_bridge.is_ready else {},
        disclaimer=MEDICAL_DISCLAIMER,
        shap_enabled=False,
        backend_mode="error",
        fetch_errors=fetch_errors + [reason],
    )

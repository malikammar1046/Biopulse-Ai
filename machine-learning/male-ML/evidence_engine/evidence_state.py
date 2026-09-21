"""
evidence_engine/evidence_state.py
---------------------------------
Normalized patient evidence state for BioPulse Male Endocrine Screening.
Integrates Tier 1 biometrics and Tier 2 laboratory evidence with full
provenance, longitudinal testosterone tracking, and verification guarantees.
"""

from __future__ import annotations
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

# Add male_tier2/src to path for safe unit normalization
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_MALE_TIER2_SRC = os.path.abspath(os.path.join(_CURRENT_DIR, "..", "male_tier2", "src"))
if _MALE_TIER2_SRC not in sys.path:
    sys.path.insert(0, _MALE_TIER2_SRC)

try:
    from unit_normalizer import convert_value_and_range, STANDARD_UNITS
except ImportError:
    # Fallback standard normalization mapping if isolated
    STANDARD_UNITS = {
        "total_testosterone": "ng/dL",
        "free_testosterone": "ng/dL",
        "lh": "mIU/mL",
        "fsh": "mIU/mL",
        "shbg": "nmol/L",
        "prolactin": "ng/mL",
        "estradiol": "pg/mL",
        "albumin": "g/dL",
        "glucose": "mg/dL",
        "hemoglobin": "g/dL",
        "hematocrit": "%",
        "hba1c": "%",
        "alt": "U/L",
        "ast": "U/L",
        "total_bilirubin": "mg/dL",
        "creatinine": "mg/dL",
        "bun": "mg/dL",
        "uric_acid": "mg/dL",
        "hdl": "mg/dL"
    }

    def convert_value_and_range(analyte, val, unit, ref_low=None, ref_high=None):
        return val, ref_low, ref_high, 1.0, STANDARD_UNITS.get(analyte, unit or "")

from schemas import (
    AnalyteEvidence,
    TestosteroneMeasurement,
    EvidenceSource,
    DataOrigin,
    AssessmentStage
)


# Standard canonical keys for all laboratory analytes
CANONICAL_ANALYTE_KEYS = [
    "total_testosterone",
    "free_testosterone",
    "shbg",
    "albumin",
    "lh",
    "fsh",
    "prolactin",
    "estradiol",
    "hba1c",
    "glucose",
    "hemoglobin",
    "hematocrit",
    "rbc",
    "alt",
    "ast",
    "total_bilirubin",
    "creatinine",
    "bun",
    "uric_acid",
    "hdl"
]

# Field aliases for flexible ingestion from API / form / OCR names
ANALYTE_ALIASES = {
    "total_t": "total_testosterone",
    "tt": "total_testosterone",
    "testosterone": "total_testosterone",
    "free_t": "free_testosterone",
    "cft": "free_testosterone",
    "shbg_nmol_l": "shbg",
    "estradiol_pg_ml": "estradiol",
    "e2": "estradiol",
    "albumin_g_dl": "albumin",
    "alb": "albumin",
    "hba1c_pct": "hba1c",
    "a1c": "hba1c",
    "glucose_mg_dl": "glucose",
    "fasting_glucose": "glucose",
    "hemoglobin_g_dl": "hemoglobin",
    "hb": "hemoglobin",
    "hgb": "hemoglobin",
    "hematocrit_pct": "hematocrit",
    "hct": "hematocrit",
    "rbc_count": "rbc",
    "alt_u_l": "alt",
    "sgpt": "alt",
    "ast_u_l": "ast",
    "sgot": "ast",
    "total_bilirubin_mg_dl": "total_bilirubin",
    "tbil": "total_bilirubin",
    "creatinine_mg_dl": "creatinine",
    "bun_mg_dl": "bun",
    "uric_acid_mg_dl": "uric_acid",
    "hdl_mg_dl": "hdl",
}


class EvidenceState:
    """
    Maintains the complete, normalized clinical evidence state for a patient.
    - Represents observed data distinctly from model predictions.
    - Preserves missing data as None (never fabricates).
    - Preserves multiple testosterone tests as longitudinal evidence.
    - Tracks OCR verification status.
    """

    def __init__(
        self,
        patient_id: Optional[str] = None,
        session_id: Optional[str] = None,
        age: Optional[float] = None,
        timestamp: Optional[str] = None
    ) -> None:
        # 1. Identity & Context
        self.patient_id: Optional[str] = patient_id
        self.session_id: Optional[str] = session_id
        self.age: Optional[float] = float(age) if age is not None else None
        self.timestamp: str = timestamp or datetime.now(timezone.utc).isoformat()

        # 2. Tier 1 Questionnaire & Biometrics
        self.height_cm: Optional[float] = None
        self.weight_kg: Optional[float] = None
        self.bmi: Optional[float] = None
        self.waist_cm: Optional[float] = None
        self.low_energy: Optional[int] = None
        self.sleep_trouble: Optional[int] = None
        self.low_mood: Optional[int] = None
        self.low_interest: Optional[int] = None
        self.high_blood_pressure: Optional[int] = None
        self.diabetes: Optional[int] = None
        self.lifestyle_info: Dict[str, Any] = {}

        # Model-derived Tier 1 outputs (strictly isolated from observed data)
        self.tier1_model_probability: Optional[float] = None
        self.tier1_screening_threshold: Optional[float] = 0.1808
        self.tier1_screen_positive: Optional[bool] = None
        self.tier1_risk_category: Optional[str] = None
        self.tier1_assessment_status: Optional[str] = None

        # 3. Tier 2 Laboratory Evidence (Map of canonical key -> AnalyteEvidence)
        self.analytes: Dict[str, AnalyteEvidence] = {}

        # 4. Longitudinal Testosterone Measurements (Two-Test Requirement)
        self.testosterone_measurements: List[TestosteroneMeasurement] = []

        # 5. Laboratory Metadata & Source Reports
        self.lab_reports_metadata: List[Dict[str, Any]] = []

    # -------------------------------------------------------------------------
    # Tier 1 Ingestion
    # -------------------------------------------------------------------------

    def set_tier1_inputs(
        self,
        age: Optional[float] = None,
        height_cm: Optional[float] = None,
        weight_kg: Optional[float] = None,
        waist_cm: Optional[float] = None,
        low_energy: Optional[int] = None,
        sleep_trouble: Optional[int] = None,
        low_mood: Optional[int] = None,
        low_interest: Optional[int] = None,
        high_blood_pressure: Optional[int] = None,
        diabetes: Optional[int] = None,
        bmi: Optional[float] = None,
        lifestyle_info: Optional[Dict[str, Any]] = None,
    ) -> EvidenceState:
        """Sets Tier 1 physical and symptom inputs, calculating BMI if height & weight available."""
        if age is not None:
            self.age = float(age)
        if height_cm is not None:
            self.height_cm = float(height_cm)
        if weight_kg is not None:
            self.weight_kg = float(weight_kg)
        if waist_cm is not None:
            self.waist_cm = float(waist_cm)
        if low_energy is not None:
            self.low_energy = int(low_energy)
        if sleep_trouble is not None:
            self.sleep_trouble = int(sleep_trouble)
        if low_mood is not None:
            self.low_mood = int(low_mood)
        if low_interest is not None:
            self.low_interest = int(low_interest)
        if high_blood_pressure is not None:
            self.high_blood_pressure = int(high_blood_pressure)
        if diabetes is not None:
            self.diabetes = int(diabetes)
        if lifestyle_info:
            self.lifestyle_info.update(lifestyle_info)

        # Calculate or assign BMI
        if bmi is not None:
            self.bmi = round(float(bmi), 1)
        elif self.height_cm and self.weight_kg and self.height_cm > 0:
            h_m = self.height_cm / 100.0
            self.bmi = round(self.weight_kg / (h_m * h_m), 1)

        return self

    def set_tier1_model_output(
        self,
        probability: float,
        threshold: float = 0.1808,
        risk_category: Optional[str] = None
    ) -> None:
        """Records Tier 1 model output explicitly marked as model-derived."""
        self.tier1_model_probability = float(probability)
        self.tier1_screening_threshold = float(threshold)
        self.tier1_screen_positive = (self.tier1_model_probability >= self.tier1_screening_threshold)
        self.tier1_risk_category = risk_category or ("Higher Screening Risk" if self.tier1_screen_positive else "Lower Screening Risk")
        self.tier1_assessment_status = "completed"

    # -------------------------------------------------------------------------
    # Tier 2 Ingestion & Provenance
    # -------------------------------------------------------------------------

    def add_analyte(
        self,
        analyte: str,
        value: float,
        unit: Optional[str] = None,
        source: str = EvidenceSource.MANUAL_LAB_ENTRY.value,
        verified: bool = True,
        collection_date: Optional[str] = None,
        collection_time: Optional[str] = None,
        fasting: Optional[bool] = None,
        ocr_confidence: Optional[float] = None,
        reference_low: Optional[float] = None,
        reference_high: Optional[float] = None,
    ) -> AnalyteEvidence:
        """
        Adds or updates a laboratory analyte with full provenance tracking.
        Automatically executes safe unit normalization while preserving original report ranges.
        """
        raw_key = analyte.strip().lower()
        canon_key = ANALYTE_ALIASES.get(raw_key, raw_key)

        # Perform safe unit normalization
        try:
            norm_val, norm_ref_l, norm_ref_h, factor, norm_u = convert_value_and_range(
                analyte=canon_key,
                val=float(value),
                unit=unit or STANDARD_UNITS.get(canon_key, ""),
                ref_low=reference_low,
                ref_high=reference_high
            )
        except Exception:
            norm_val = float(value)
            norm_ref_l = reference_low
            norm_ref_h = reference_high
            norm_u = unit or STANDARD_UNITS.get(canon_key, "")

        item = AnalyteEvidence(
            analyte=canon_key,
            value=float(value),
            unit=unit,
            source=source,
            verified=verified,
            data_origin=DataOrigin.OBSERVED.value,
            collection_date=collection_date,
            collection_time=collection_time,
            fasting=fasting,
            ocr_confidence=ocr_confidence,
            original_unit=unit,
            normalized_value=norm_val,
            normalized_unit=norm_u,
            reference_low=reference_low,
            reference_high=reference_high
        )

        self.analytes[canon_key] = item

        # If this is a total testosterone measurement, also record in longitudinal list
        if canon_key == "total_testosterone":
            self.add_testosterone_measurement(
                value=float(value),
                unit=unit or "ng/dL",
                collection_date=collection_date,
                collection_time=collection_time,
                fasting=fasting,
                verified=verified,
                source=source,
                ocr_confidence=ocr_confidence,
                normalized_value=norm_val,
                normalized_unit=norm_u,
                reference_low=reference_low or 300.0,
                reference_high=reference_high or 1000.0
            )

        return item

    # -------------------------------------------------------------------------
    # Longitudinal Testosterone Management (Two-Test Requirement)
    # -------------------------------------------------------------------------

    def add_testosterone_measurement(
        self,
        value: float,
        unit: str = "ng/dL",
        collection_date: Optional[str] = None,
        collection_time: Optional[str] = None,
        fasting: Optional[bool] = None,
        verified: bool = True,
        source: str = EvidenceSource.MANUAL_LAB_ENTRY.value,
        ocr_confidence: Optional[float] = None,
        normalized_value: Optional[float] = None,
        normalized_unit: str = "ng/dL",
        reference_low: Optional[float] = 300.0,
        reference_high: Optional[float] = 1000.0,
    ) -> TestosteroneMeasurement:
        """
        Records a testosterone measurement longitudinally without overwriting previous measurements.
        """
        if normalized_value is None:
            try:
                norm_val, _, _, _, norm_u = convert_value_and_range("total_testosterone", float(value), unit)
            except Exception:
                norm_val = float(value)
                norm_u = unit
        else:
            norm_val = normalized_value
            norm_u = normalized_unit

        meas = TestosteroneMeasurement(
            value=float(value),
            unit=unit,
            collection_date=collection_date,
            collection_time=collection_time,
            fasting=fasting,
            verified=verified,
            source=source,
            ocr_confidence=ocr_confidence,
            normalized_value=norm_val,
            normalized_unit=norm_u,
            reference_low=reference_low,
            reference_high=reference_high
        )

        # Avoid exact duplicate insertion
        duplicate = False
        for existing in self.testosterone_measurements:
            if (
                existing.value == meas.value
                and existing.unit == meas.unit
                and existing.collection_date == meas.collection_date
                and existing.collection_time == meas.collection_time
                and existing.source == meas.source
            ):
                duplicate = True
                break

        if not duplicate:
            self.testosterone_measurements.append(meas)

        return meas

    def get_testosterone_measurements(self, verified_only: bool = False) -> List[TestosteroneMeasurement]:
        """Returns all recorded testosterone measurements."""
        if verified_only:
            return [m for m in self.testosterone_measurements if m.verified]
        return list(self.testosterone_measurements)

    def get_latest_testosterone(self, verified_only: bool = False) -> Optional[TestosteroneMeasurement]:
        """Returns the most recent testosterone measurement."""
        meas = self.get_testosterone_measurements(verified_only=verified_only)
        if not meas:
            return None
        return meas[-1]

    def has_morning_timing(self, measurement: Optional[TestosteroneMeasurement] = None) -> Optional[bool]:
        """
        Determines whether a collection time conforms to the recommended
        early morning fasting window (8:00 AM – 10:00 AM or < 10:30 AM).
        Returns: True (morning), False (afternoon/evening), None (time unknown).
        """
        target = measurement or self.get_latest_testosterone()
        if not target or not target.collection_time:
            return None

        t_str = target.collection_time.strip().upper()
        # Parse time string e.g. "08:15", "8:15 AM", "14:30"
        try:
            parts = t_str.replace("AM", "").replace("PM", "").strip().split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            if "PM" in t_str and hour < 12:
                hour += 12
            elif "AM" in t_str and hour == 12:
                hour = 0

            # Early morning peak window: 07:00 to 10:30
            if (hour == 7 and minute >= 0) or (hour in [8, 9]) or (hour == 10 and minute <= 30):
                return True
            return False
        except Exception:
            return None

    # -------------------------------------------------------------------------
    # Verification & Quality Methods
    # -------------------------------------------------------------------------

    def verify_analyte(self, analyte: str) -> bool:
        """Marks an analyte as user-verified."""
        canon = ANALYTE_ALIASES.get(analyte.lower(), analyte.lower())
        if canon in self.analytes:
            self.analytes[canon].verified = True
            # Also update in testosterone measurements if applicable
            if canon == "total_testosterone":
                for m in self.testosterone_measurements:
                    m.verified = True
            return True
        return False

    def has_unverified_evidence(self) -> bool:
        """Returns True if any analyte evidence is currently unverified."""
        return any(not item.verified for item in self.analytes.values())

    def get_unverified_analytes(self) -> List[str]:
        """Returns list of analyte names that have not been verified."""
        return [k for k, v in self.analytes.items() if not v.verified]

    # -------------------------------------------------------------------------
    # Serialization
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Serializes complete EvidenceState to dictionary."""
        return {
            "patient_id": self.patient_id,
            "session_id": self.session_id,
            "age": self.age,
            "timestamp": self.timestamp,
            "tier1": {
                "height_cm": self.height_cm,
                "weight_kg": self.weight_kg,
                "bmi": self.bmi,
                "waist_cm": self.waist_cm,
                "low_energy": self.low_energy,
                "sleep_trouble": self.sleep_trouble,
                "low_mood": self.low_mood,
                "low_interest": self.low_interest,
                "high_blood_pressure": self.high_blood_pressure,
                "diabetes": self.diabetes,
                "lifestyle_info": self.lifestyle_info,
                "model_output": {
                    "probability": self.tier1_model_probability,
                    "threshold": self.tier1_screening_threshold,
                    "screen_positive": self.tier1_screen_positive,
                    "risk_category": self.tier1_risk_category,
                    "status": self.tier1_assessment_status
                }
            },
            "tier2_analytes": {k: v.to_dict() for k, v in self.analytes.items()},
            "testosterone_measurements": [m.to_dict() for m in self.testosterone_measurements],
            "lab_reports_metadata": self.lab_reports_metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> EvidenceState:
        """Restores EvidenceState from dictionary."""
        state = cls(
            patient_id=data.get("patient_id"),
            session_id=data.get("session_id"),
            age=data.get("age"),
            timestamp=data.get("timestamp")
        )

        t1 = data.get("tier1") or {}
        state.set_tier1_inputs(
            age=data.get("age"),
            height_cm=t1.get("height_cm"),
            weight_kg=t1.get("weight_kg"),
            waist_cm=t1.get("waist_cm"),
            low_energy=t1.get("low_energy"),
            sleep_trouble=t1.get("sleep_trouble"),
            low_mood=t1.get("low_mood"),
            low_interest=t1.get("low_interest"),
            high_blood_pressure=t1.get("high_blood_pressure"),
            diabetes=t1.get("diabetes"),
            bmi=t1.get("bmi"),
            lifestyle_info=t1.get("lifestyle_info")
        )

        m_out = t1.get("model_output") or {}
        if m_out.get("probability") is not None:
            state.set_tier1_model_output(
                probability=m_out["probability"],
                threshold=m_out.get("threshold", 0.1808),
                risk_category=m_out.get("risk_category")
            )

        for k, v in (data.get("tier2_analytes") or {}).items():
            state.analytes[k] = AnalyteEvidence.from_dict(v)

        for m_dict in data.get("testosterone_measurements") or []:
            state.testosterone_measurements.append(TestosteroneMeasurement.from_dict(m_dict))

        state.lab_reports_metadata = data.get("lab_reports_metadata") or []
        return state

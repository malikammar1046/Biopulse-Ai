"""
evidence_engine/schemas.py
--------------------------
Data structures, enums, and schemas for the BioPulse Progressive Evidence Engine.
Distinguishes observed evidence from model-derived data, captures provenance,
and enforces non-diagnostic safety contracts.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class EvidenceSource(str, Enum):
    USER_INPUT = "user_input"
    ONBOARDING = "onboarding"
    UPLOADED_LAB_REPORT = "uploaded_lab_report"
    MANUAL_LAB_ENTRY = "manual_lab_entry"
    CALCULATED = "calculated"
    MODEL_OUTPUT = "model_output"


class DataOrigin(str, Enum):
    OBSERVED = "observed"
    MODEL_DERIVED = "model_derived"


class AssessmentStage(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"


@dataclass
class AnalyteEvidence:
    """
    Structured evidence record for an individual laboratory biomarker.
    Maintains complete provenance, source verification status, and reference ranges.
    """
    analyte: str
    value: float
    unit: Optional[str] = None
    source: str = EvidenceSource.MANUAL_LAB_ENTRY.value
    verified: bool = True
    data_origin: str = DataOrigin.OBSERVED.value
    collection_date: Optional[str] = None
    collection_time: Optional[str] = None
    fasting: Optional[bool] = None
    ocr_confidence: Optional[float] = None
    original_unit: Optional[str] = None
    normalized_value: Optional[float] = None
    normalized_unit: Optional[str] = None
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> AnalyteEvidence:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class TestosteroneMeasurement:
    """
    Represents an individual testosterone measurement to support
    longitudinal evidence and the clinical two-test confirmation requirement.
    """
    value: float
    unit: str = "ng/dL"
    collection_date: Optional[str] = None
    collection_time: Optional[str] = None
    fasting: Optional[bool] = None
    verified: bool = True
    source: str = EvidenceSource.MANUAL_LAB_ENTRY.value
    ocr_confidence: Optional[float] = None
    normalized_value: Optional[float] = None
    normalized_unit: str = "ng/dL"
    reference_low: Optional[float] = 300.0
    reference_high: Optional[float] = 1000.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> TestosteroneMeasurement:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class CompletenessReport:
    """
    Information completeness indicator across Core Tier 1, Core Tier 2,
    and Supporting laboratory evidence.
    """
    available: int
    expected: int
    percentage: float
    core_tier1_complete: bool
    core_tier2_complete: bool
    core_missing: List[str] = field(default_factory=list)
    tier1_available: int = 0
    tier1_expected: int = 0
    tier1_completeness_pct: float = 0.0
    tier2_available: int = 0
    tier2_expected: int = 0
    tier2_completeness_pct: float = 0.0
    supporting_available: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EvidenceGap:
    """
    Deterministic evidence gap identifying missing clinical or timing context.
    Strictly non-prescriptive (does not order or prescribe medical tests).
    """
    gap_key: str
    category: str
    description: str
    clinical_rationale: str
    guidance: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AssessmentSnapshot:
    """
    Snapshot of an assessment at a specific point in time, enabling
    the assessment history timeline to show how results evolve as new evidence arrives.
    """
    snapshot_id: str
    timestamp: str
    stage: str
    evidence_completeness: Dict[str, Any]
    summary_status: str
    change_summary: str
    added_evidence: List[str] = field(default_factory=list)
    assessment_payload: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class UnifiedAssessmentResult:
    """
    Unified progressive endocrine assessment output format.
    Explicitly separates:
    1. ML Screening Branch (Tier 1 & Tier 2 without Total Testosterone leakage)
    2. Clinical Pattern Branch (Hormonal Pattern Engine: T + LH + FSH + Prolactin)
    3. Evidence Engine (Gap Analysis, Completeness, 2-Morning-Draw Rule)
    4. Explainability Engine
    5. Digital Twin (Longitudinal tracking & lifestyle trajectory)
    6. Research Layer (Calibration, Discrimination, Audit Context)
    """
    assessment_stage: str
    screening_status: str
    tier1_result: Optional[Dict[str, Any]] = None
    tier2_result: Optional[Dict[str, Any]] = None
    hormonal_pattern: Optional[Dict[str, Any]] = None
    longitudinal_testosterone: Optional[Dict[str, Any]] = None
    evidence_completeness: Dict[str, Any] = field(default_factory=dict)
    evidence_gaps: List[Dict[str, Any]] = field(default_factory=list)
    explanations: List[Dict[str, Any]] = field(default_factory=list)
    limitations: List[str] = field(default_factory=list)
    safety_disclaimer: str = ""

    # Explicit Architectural Separation (User Architecture Alignment)
    ml_screening: Dict[str, Any] = field(default_factory=dict)
    clinical_pattern: Dict[str, Any] = field(default_factory=dict)
    digital_twin: Dict[str, Any] = field(default_factory=dict)
    research_layer: Dict[str, Any] = field(default_factory=dict)
    biopulse_story: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

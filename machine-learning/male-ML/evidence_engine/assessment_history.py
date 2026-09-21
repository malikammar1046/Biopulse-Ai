"""
evidence_engine/assessment_history.py
-------------------------------------
Chronological assessment history repository and evolution tracker for BioPulse.
Tracks snapshots each time meaningful evidence is added or updated,
explaining clearly to patients how and why their assessment changed.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from schemas import AssessmentSnapshot, UnifiedAssessmentResult
from evidence_state import EvidenceState


class AssessmentHistory:
    """
    Maintains the chronological record of assessment snapshots for a patient.
    Computes evidence differentials between consecutive assessments.
    """

    def __init__(self, patient_id: Optional[str] = None) -> None:
        self.patient_id: Optional[str] = patient_id
        self.snapshots: List[AssessmentSnapshot] = []

    def record_snapshot(
        self,
        assessment: UnifiedAssessmentResult,
        evidence_state: EvidenceState,
        change_summary: Optional[str] = None
    ) -> AssessmentSnapshot:
        """
        Creates and stores a new immutable snapshot of the current assessment state.
        Automatically calculates what new evidence was added since the last snapshot.
        """
        snapshot_id = f"snap_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Determine evidence diff compared to previous snapshot
        added_evidence_items: List[str] = []
        if self.snapshots:
            prev_snapshot = self.snapshots[-1]
            prev_payload = prev_snapshot.assessment_payload or {}
            prev_analytes = prev_payload.get("analytes_detected", [])

            # Check new analytes
            for k, item in evidence_state.analytes.items():
                if k not in prev_analytes:
                    added_evidence_items.append(f"{k.replace('_', ' ').title()} ({item.value} {item.unit or ''})")

            # Check new testosterone test
            prev_tt_count = prev_payload.get("testosterone_count", 0)
            curr_tt_count = len(evidence_state.testosterone_measurements)
            if curr_tt_count > prev_tt_count and "total_testosterone" not in added_evidence_items:
                latest_tt = evidence_state.get_latest_testosterone()
                if latest_tt:
                    added_evidence_items.append(f"Repeat Testosterone Draw ({latest_tt.value} {latest_tt.unit})")

        # Synthesize friendly change reason
        if change_summary is None:
            if not self.snapshots:
                if assessment.assessment_stage == "tier_1":
                    auto_summary = "Initial Tier 1 lifestyle, demographic, and symptom baseline recorded."
                else:
                    auto_summary = "Initial multi-tier endocrine assessment generated."
            else:
                if added_evidence_items:
                    auto_summary = f"Your assessment changed because new evidence was added: {', '.join(added_evidence_items)}."
                else:
                    auto_summary = "Assessment refreshed with updated clinical parameters."
        else:
            auto_summary = change_summary

        snapshot_payload = {
            "stage": assessment.assessment_stage,
            "screening_status": assessment.screening_status,
            "tier1_result": assessment.tier1_result,
            "tier2_result": assessment.tier2_result,
            "hormonal_pattern": assessment.hormonal_pattern,
            "analytes_detected": list(evidence_state.analytes.keys()),
            "testosterone_count": len(evidence_state.testosterone_measurements),
            "evidence_completeness": assessment.evidence_completeness,
            "evidence_gaps_count": len(assessment.evidence_gaps)
        }

        snap = AssessmentSnapshot(
            snapshot_id=snapshot_id,
            timestamp=now_iso,
            stage=assessment.assessment_stage,
            evidence_completeness=assessment.evidence_completeness,
            summary_status=assessment.screening_status,
            change_summary=auto_summary,
            added_evidence=added_evidence_items,
            assessment_payload=snapshot_payload
        )

        self.snapshots.append(snap)
        return snap

    def get_timeline(self) -> List[Dict[str, Any]]:
        """
        Returns chronological timeline items ready for user-facing presentation.
        """
        timeline = []
        for idx, snap in enumerate(self.snapshots, 1):
            pattern_info = snap.assessment_payload.get("hormonal_pattern") or {}
            pattern_title = pattern_info.get("pattern_name") if isinstance(pattern_info, dict) else None

            timeline.append({
                "sequence_number": idx,
                "snapshot_id": snap.snapshot_id,
                "timestamp": snap.timestamp,
                "stage": snap.stage,
                "headline": f"Assessment #{idx} ({snap.stage.replace('_', ' ').title()})",
                "summary": snap.change_summary,
                "screening_status": snap.summary_status,
                "hormonal_pattern": pattern_title,
                "completeness_pct": snap.evidence_completeness.get("percentage", 0.0),
                "added_evidence": snap.added_evidence
            })
        return timeline

    def to_dict(self) -> Dict[str, Any]:
        """Serializes history to dictionary."""
        return {
            "patient_id": self.patient_id,
            "snapshots_count": len(self.snapshots),
            "snapshots": [s.to_dict() for s in self.snapshots]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> AssessmentHistory:
        """Restores history from dictionary."""
        hist = cls(patient_id=data.get("patient_id"))
        for s_data in data.get("snapshots") or []:
            hist.snapshots.append(AssessmentSnapshot(**s_data))
        return hist

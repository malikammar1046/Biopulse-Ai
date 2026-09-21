"""
tests/test_evidence_state.py
----------------------------
Unit tests for EvidenceState, provenance tracking, verification guarantees,
and longitudinal testosterone management (TEST 4 & TEST 5).
"""

import os
import sys
import unittest

# Ensure evidence_engine is in sys.path
ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from evidence_state import EvidenceState
from schemas import DataOrigin, EvidenceSource


class TestEvidenceState(unittest.TestCase):

    def setUp(self):
        self.state = EvidenceState(patient_id="patient_123", age=45)

    def test_tier1_missing_data_remains_none(self):
        """Missing Tier 1 fields must remain None, never invented or zeroed."""
        self.state.set_tier1_inputs(age=45, height_cm=180.0, weight_kg=85.0)
        self.assertIsNone(self.state.waist_cm)
        self.assertIsNone(self.state.low_energy)
        self.assertIsNone(self.state.diabetes)
        self.assertIsNone(self.state.tier1_model_probability)
        self.assertEqual(self.state.bmi, 26.2)

    def test_analyte_provenance_and_data_origin(self):
        """Verify evidence captures provenance and marks observed data vs model-derived."""
        item = self.state.add_analyte(
            analyte="shbg",
            value=24.0,
            unit="nmol/L",
            source=EvidenceSource.UPLOADED_LAB_REPORT.value,
            verified=True,
            collection_date="2026-08-10",
            collection_time="08:15",
            fasting=True,
            ocr_confidence=0.98,
            reference_low=16.0,
            reference_high=55.0
        )
        self.assertEqual(item.analyte, "shbg")
        self.assertEqual(item.value, 24.0)
        self.assertEqual(item.data_origin, DataOrigin.OBSERVED.value)
        self.assertTrue(item.verified)
        self.assertEqual(item.source, "uploaded_lab_report")
        self.assertEqual(item.ocr_confidence, 0.98)
        self.assertEqual(item.collection_time, "08:15")

    def test_04_multiple_testosterone_measurements_retained(self):
        """
        TEST 4: Two testosterone measurements.
        Verify both are retained as longitudinal evidence with NO overwrite.
        """
        # First measurement
        meas1 = self.state.add_testosterone_measurement(
            value=260.0,
            unit="ng/dL",
            collection_date="2026-08-01",
            collection_time="08:10",
            fasting=True,
            source=EvidenceSource.UPLOADED_LAB_REPORT.value
        )
        # Second measurement on a later date
        meas2 = self.state.add_testosterone_measurement(
            value=275.0,
            unit="ng/dL",
            collection_date="2026-08-15",
            collection_time="08:25",
            fasting=True,
            source=EvidenceSource.MANUAL_LAB_ENTRY.value
        )

        all_meas = self.state.get_testosterone_measurements()
        self.assertEqual(len(all_meas), 2)
        self.assertEqual(all_meas[0].value, 260.0)
        self.assertEqual(all_meas[0].collection_time, "08:10")
        self.assertEqual(all_meas[1].value, 275.0)
        self.assertEqual(all_meas[1].collection_time, "08:25")
        self.assertEqual(self.state.get_latest_testosterone().value, 275.0)
        print("\n[PASS] Test 4: Multiple testosterone measurements retained without overwrite.")

    def test_05_unverified_ocr_data_distinguished(self):
        """
        TEST 5: OCR-derived value not verified.
        Verify evidence is marked unverified and not silently treated as verified evidence.
        """
        # Ingest raw unverified OCR analyte
        item = self.state.add_analyte(
            analyte="total_testosterone",
            value=245.0,
            unit="ng/dL",
            source=EvidenceSource.UPLOADED_LAB_REPORT.value,
            verified=False,
            collection_time="08:30",
            ocr_confidence=0.82
        )

        self.assertFalse(item.verified)
        self.assertTrue(self.state.has_unverified_evidence())
        self.assertIn("total_testosterone", self.state.get_unverified_analytes())

        # Verified-only query must exclude it
        verified_tt = self.state.get_testosterone_measurements(verified_only=True)
        self.assertEqual(len(verified_tt), 0)

        # After user verifies, it is marked verified
        self.state.verify_analyte("total_testosterone")
        self.assertFalse(self.state.has_unverified_evidence())
        verified_after = self.state.get_testosterone_measurements(verified_only=True)
        self.assertEqual(len(verified_after), 1)
        print("\n[PASS] Test 5: Unverified OCR evidence distinguished from verified observed data.")

    def test_serialization_roundtrip(self):
        """Verify EvidenceState serializes to dict and restores faithfully."""
        self.state.set_tier1_inputs(age=50, height_cm=175.0, weight_kg=90.0, waist_cm=104.0, low_energy=2)
        self.state.add_analyte("lh", 11.5, unit="mIU/mL", source="manual_lab_entry", verified=True)
        self.state.add_testosterone_measurement(250.0, collection_time="08:00")

        d = self.state.to_dict()
        restored = EvidenceState.from_dict(d)

        self.assertEqual(restored.age, 50.0)
        self.assertEqual(restored.waist_cm, 104.0)
        self.assertEqual(restored.low_energy, 2)
        self.assertIn("lh", restored.analytes)
        self.assertEqual(restored.analytes["lh"].value, 11.5)
        self.assertEqual(len(restored.testosterone_measurements), 1)


if __name__ == "__main__":
    unittest.main()

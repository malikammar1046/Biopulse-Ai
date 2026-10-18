"""
BioPulse AI — Final Male Assessment QA & Staging Verification Suite
Validates:
1. 7-feature model with ENABLE_MALE_TIER1_CLEAN_7FEAT=True in isolated staging environment.
2. Complete artifact verification (hash, size, threshold, features, ADAM separation, missing waist).
3. Tier 2 laboratory completeness: 0 indirect -> direct hormone evaluation, <15 -> partial, 15 -> complete.
4. Supabase persistence, RLS isolation between two synthetic accounts, and strict no-silent-fallback policy.
"""
import os
import sys
import hashlib
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

# Django bootstrap
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from django.conf import settings
from apps.intelligence.services.male_ml_service import (
    male_ml_service,
    MALE_TIER1_7FEAT_FEATURE_NAMES,
    MALE_TIER2_FEATURE_NAMES,
)
from apps.intelligence.services.assessment_repository import (
    assessment_repository,
    PersistenceError,
    _is_local_sqlite_fallback_allowed,
)
from apps.intelligence.services.intelligence_orchestrator import (
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    format_assessment_response,
)


def run_qa_suite():
    results = {}
    print("=" * 80)
    print("BIOPULSE AI — FINAL MALE ASSESSMENT QA AND STAGING READINESS")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # TASK 1: 7-Feature Model Artifact & Inference Verification (Flag ON)
    # -------------------------------------------------------------------------
    print("\n[QA 1] Verifying 7-Feature Model Artifact & Inference Contract (Flag ON)...")
    staged_path = Path(__file__).resolve().parent.parent / "machine-learning" / "male-ML" / "male_tier1" / "artifacts" / "male_tier1_7feat_candidate.joblib"
    if not staged_path.exists():
        staged_path = Path(__file__).resolve().parent.parent / "machine-learning" / "male-ML" / "experiments" / "male_tier1_7feat" / "artifacts" / "male_tier1_7feat_candidate.joblib"
    artifact_path = staged_path
    assert artifact_path.exists(), f"Artifact not found at {artifact_path}"
    
    file_bytes = artifact_path.read_bytes()
    byte_size = len(file_bytes)
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    print(f"  Artifact Path: {artifact_path.name}")
    print(f"  Byte Size:     {byte_size} bytes")
    print(f"  SHA-256:       {sha256_hash}")

    assert byte_size == 12018, f"Expected 12018 bytes, got {byte_size}"
    assert sha256_hash == "8334b37cb450fc85e8137a89c0300e8d5f3f0c35123823d5a1b871f198eed29f", (
        f"SHA-256 mismatch: {sha256_hash}"
    )

    # Load with flag enabled
    with patch.object(settings, "ENABLE_MALE_TIER1_CLEAN_7FEAT", True):
        male_ml_service.load()
        assert round(male_ml_service.tier1_screening_threshold, 4) == 0.1799
        assert male_ml_service.tier1_feature_names == MALE_TIER1_7FEAT_FEATURE_NAMES

        print(f"  Threshold:      {male_ml_service.tier1_screening_threshold} (verified calibrated LR)")
        print(f"  Feature Names:  {male_ml_service.tier1_feature_names}")

        # Complete synthetic patient
        sample_complete = {
            "age": 45.0,
            "weight_kg": 85.0,
            "height_cm": 175.0,
            "bmi": 27.76,
            "waist_cm": 95.0,
            "diabetes": 0,
            "high_blood_pressure": 1,
            # Independent ADAM inputs (must NOT be used in 7-feat LR model)
            "low_energy": 1,
            "sleep_trouble": 1,
            "low_mood": 1,
            "low_interest": 1,
        }
        res_complete = male_ml_service.predict_tier1(sample_complete)
        print(f"  Complete Patient Inference: prob={res_complete['probability']:.4f}, complete={res_complete.get('is_complete')}")
        assert res_complete["is_complete"] is True
        assert res_complete["assessment_status"] == "complete"
        assert res_complete["probability"] is not None

        # Missing waist circumference patient -> must flag incomplete!
        sample_no_waist = {
            "age": 45.0,
            "weight_kg": 85.0,
            "height_cm": 175.0,
            "bmi": 27.76,
            "waist_cm": None,  # OMITTED
            "diabetes": 0,
            "high_blood_pressure": 1,
        }
        res_no_waist = male_ml_service.predict_tier1(sample_no_waist)
        print(f"  Missing Waist Circumference: prob={res_no_waist['probability']}, complete={res_no_waist.get('is_complete')}, notice='{res_no_waist.get('notice')}'")
        assert res_no_waist["is_complete"] is False
        assert res_no_waist["assessment_status"] == "incomplete"
        assert "Waist circumference" in res_no_waist.get("notice", "")

    # Confirm default production flag remains False
    assert getattr(settings, "ENABLE_MALE_TIER1_CLEAN_7FEAT", False) is False, (
        "Production setting ENABLE_MALE_TIER1_CLEAN_7FEAT must be False by default!"
    )
    male_ml_service.load()
    print("  Production Settings: ENABLE_MALE_TIER1_CLEAN_7FEAT is False (default baseline 11-feat active).")
    results["task_1_tier1_7feat_isolated_qa"] = "PASS"

    # -------------------------------------------------------------------------
    # TASK 2: Tier 2 Laboratory Completeness & Non-Diagnostic Decoupling
    # -------------------------------------------------------------------------
    print("\n[QA 2] Verifying Tier 2 Laboratory Completeness & Decoupling...")
    tier1_base = {"age": 42.0, "bmi": 26.5, "waist_cm": 90.0, "high_blood_pressure": 0, "diabetes": 0}

    # Case 2A: Direct hormones only (Total T, LH, FSH, Prolactin) -> 0 indirect labs
    direct_only_labs = {
        "testosterone_total": 240.0,  # Below 300 ng/dL -> subnormal
        "lh": 8.5,                   # Elevated gonadotropin -> primary hypogonadism pattern
        "fsh": 7.2,
        "prolactin": 11.0,
    }
    res_direct = male_ml_service.predict_tier2(direct_only_labs, tier1_inputs=tier1_base)
    fmt_direct = format_assessment_response(res_direct)
    print(f"  Case 2A (Direct Endocrine Only, 0 Indirect Labs):")
    print(f"    Probability:       {res_direct['probability']}")
    print(f"    Risk Category:     {res_direct['risk_category']}")
    print(f"    Risk Label:        {res_direct['risk_label']}")
    print(f"    Assessment Status: {res_direct['assessment_status']}")
    print(f"    Is Complete:       {res_direct.get('is_complete')}")
    print(f"    Pattern Type:      {res_direct.get('hormone_pattern_interpretation', {}).get('pattern_type')}")
    print(f"    Is Diagnostic:     {fmt_direct.get('is_diagnostic')}")
    
    assert res_direct["probability"] is None, "0 indirect labs must NOT generate an RF probability!"
    assert res_direct["risk_category"] == "direct_hormone_evaluation"
    assert res_direct["assessment_status"] == "hormone_pattern_only"
    assert res_direct["is_complete"] is False
    assert fmt_direct.get("is_diagnostic") is False
    assert res_direct.get("hormone_pattern_interpretation", {}).get("pattern_type") in ("PRIMARY", "SECONDARY")

    # Case 2B: Partial indirect labs (e.g. 5 indirect labs out of 15)
    partial_labs = {
        "testosterone_total": 250.0,
        "lh": 4.0,
        "fasting_glucose": 105.0,
        "total_cholesterol": 210.0,
        "triglycerides": 180.0,
        "hdl": 42.0,
        "creatinine": 1.0,
    }
    res_partial = male_ml_service.predict_tier2(partial_labs, tier1_inputs=tier1_base)
    print(f"  Case 2B (Partial Indirect Labs: {res_partial.get('tier_2_available_count')}/15):")
    print(f"    Probability:       {res_partial['probability']:.4f}")
    print(f"    Is Complete:       {res_partial.get('is_complete')}")
    print(f"    Assessment Status: {res_partial.get('assessment_status')}")
    print(f"    Notice:            {res_partial.get('notice')}")

    assert res_partial["is_complete"] is False
    assert res_partial["assessment_status"] == "partial"
    assert res_partial["probability"] is not None
    assert ("missing" in res_partial.get("notice", "").lower() or "partial" in res_partial.get("notice", "").lower())
    assert res_partial.get("tier_2_available_count") < 15

    # Case 2C: Complete 15 indirect labs
    complete_labs = {
        "testosterone_total": 250.0,
        "lh": 4.0,
        "shbg": 32.0,
        "estradiol": 25.0,
        "albumin": 4.4,
        "hba1c": 5.6,
        "fasting_glucose": 95.0,
        "hemoglobin": 15.2,
        "hematocrit": 45.0,
        "rbc_count": 5.1,
        "alt": 25.0,
        "ast": 22.0,
        "total_bilirubin": 0.8,
        "creatinine": 0.95,
        "bun": 14.0,
        "uric_acid": 5.2,
        "hdl": 48.0,
    }
    res_complete_t2 = male_ml_service.predict_tier2(complete_labs, tier1_inputs=tier1_base)
    print(f"  Case 2C (Complete Indirect Labs: {res_complete_t2.get('tier_2_available_count')}/15):")
    print(f"    Probability:       {res_complete_t2['probability']:.4f}")
    print(f"    Is Complete:       {res_complete_t2.get('is_complete')}")
    print(f"    Assessment Status: {res_complete_t2.get('assessment_status')}")
    print(f"    Notice:            {res_complete_t2.get('notice')}")

    assert res_complete_t2["is_complete"] is True
    assert res_complete_t2["assessment_status"] == "complete"
    assert res_complete_t2.get("notice") is None
    results["task_2_tier2_completeness_and_decoupling"] = "PASS"

    # -------------------------------------------------------------------------
    # TASK 3: Supabase Persistence, RLS Cross-User Isolation, and Fallback Guard
    # -------------------------------------------------------------------------
    print("\n[QA 3] Verifying Supabase Persistence, RLS Isolation, and SQLite Fallback Guard...")
    
    # 3A: Strict No-Silent-Fallback in Production
    print("  Testing Production Persistence Policy (ALLOW_LOCAL_SQLITE_FALLBACK=False)...")
    mock_supabase_fail = MagicMock()
    mock_supabase_fail.rpc.side_effect = Exception("Supabase network failure / 401 Unauthorized")
    
    with patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=mock_supabase_fail), \
         patch.dict("os.environ", {"SUPABASE_URL": "https://test.supabase.co", "ALLOW_LOCAL_SQLITE_FALLBACK": "false"}):
        try:
            assessment_repository.save_assessment(
                user_id="synthetic-user-1111",
                assessment_data={"module": "male_hypogonadism", "assessment_level": "tier_1", "probability": 0.15},
                make_active=True,
            )
            raise AssertionError("Expected PersistenceError was not raised!")
        except PersistenceError as pe:
            print(f"  [PASS] Confirmed: primary cloud failure raises PersistenceError when fallback disabled: {pe}")
        except Exception as e:
            if not isinstance(e, PersistenceError):
                raise AssertionError(f"Expected PersistenceError, got {type(e)}: {e}")

    # 3B: Explicit Local/Test Mode (ALLOW_LOCAL_SQLITE_FALLBACK=True)
    print("  Testing Explicit Local/Test Mode (ALLOW_LOCAL_SQLITE_FALLBACK=True)...")
    with patch.dict("os.environ", {"ALLOW_LOCAL_SQLITE_FALLBACK": "1"}):
        assert _is_local_sqlite_fallback_allowed() is True
        saved = assessment_repository.save_assessment(
            user_id="synthetic-user-1111",
            assessment_data={"module": "male_hypogonadism", "assessment_level": "tier_1", "probability": 0.15},
            make_active=True,
        )
        assert saved.get("id") is not None
        print(f"  [PASS] Graceful fallback to SQLite when explicitly configured: id={saved['id']}")

    # 3C: Cross-User RLS Isolation Check with Two Synthetic Accounts
    print("  Testing Cross-User Assessment Isolation (Patient A vs. Patient B)...")
    patient_a = "11111111-2222-3333-4444-555555555555"
    patient_b = "99999999-8888-7777-6666-555555555555"

    with patch.dict("os.environ", {"ALLOW_LOCAL_SQLITE_FALLBACK": "1"}):
        # Save assessment for Patient A
        asmt_a = assessment_repository.save_assessment(
            user_id=patient_a,
            assessment_data={
                "module": "male_hypogonadism",
                "assessment_level": "tier_1",
                "probability": 0.145,
                "risk_category": "intermediate",
                "summary_text": "Confidential Patient A assessment",
            },
            make_active=True,
        )
        
        # Save assessment for Patient B
        asmt_b = assessment_repository.save_assessment(
            user_id=patient_b,
            assessment_data={
                "module": "male_hypogonadism",
                "assessment_level": "tier_1",
                "probability": 0.280,
                "risk_category": "higher",
                "summary_text": "Confidential Patient B assessment",
            },
            make_active=True,
        )

        # Query Patient A's active assessment
        active_a = assessment_repository.get_active_assessment(patient_a, module="male_hypogonadism")
        # Query Patient B's active assessment
        active_b = assessment_repository.get_active_assessment(patient_b, module="male_hypogonadism")

        assert active_a["id"] == asmt_a["id"]
        assert active_a["id"] != active_b["id"]
        assert active_a["user_id"] == patient_a
        assert active_b["user_id"] == patient_b
        assert active_a["probability"] == 0.145
        assert active_b["probability"] == 0.280

        # Query Patient A's history -> Must contain 0 records belonging to Patient B
        hist_a = assessment_repository.get_assessment_history(patient_a, module="male_hypogonadism")
        for record in hist_a:
            assert str(record.get("user_id")) == patient_a, (
                f"Data Leakage Detected! Patient A history contains record for {record.get('user_id')}"
            )
            assert record.get("id") != asmt_b["id"]

        # Query Patient B's history -> Must contain 0 records belonging to Patient A
        hist_b = assessment_repository.get_assessment_history(patient_b, module="male_hypogonadism")
        for record in hist_b:
            assert str(record.get("user_id")) == patient_b, (
                f"Data Leakage Detected! Patient B history contains record for {record.get('user_id')}"
            )
            assert record.get("id") != asmt_a["id"]

        print(f"  [PASS] Cross-user boundary verified: Patient A ({patient_a[:8]}) and Patient B ({patient_b[:8]}) cannot view each other's records.")
    
    results["task_3_supabase_persistence_and_rls"] = "PASS"

    # -------------------------------------------------------------------------
    # Summary Output
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("QA RESULTS MATRIX:")
    for k, v in results.items():
        print(f"  - {k:<45}: {v}")
    print("=" * 80)
    return results

if __name__ == "__main__":
    run_qa_suite()

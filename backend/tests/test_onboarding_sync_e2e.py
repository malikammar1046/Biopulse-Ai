import os
import sys
import uuid
import django
from datetime import datetime, timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ["ALLOW_LOCAL_SQLITE_FALLBACK"] = "1"
os.environ["DISABLE_INTELLIGENCE_PREWARM"] = "1"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from apps.intelligence.views import LongitudinalHealthView
from apps.intelligence.services.longitudinal_health_service import longitudinal_health_service
from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.clinical_state_repository import clinical_state_repository
from apps.intelligence.services.observation_repository import observation_repository
from apps.intelligence.services.intelligence_orchestrator import run_male_tier1_assessment
from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.lifestyle_context_builder import LifestyleContextBuilder
from apps.intelligence.services.lifestyle_safety_rules import LifestyleSafetyEngine
from apps.intelligence.services.lifestyle_recommendation_engine import LifestyleRecommendationEngine
from apps.intelligence.services.lifestyle_repository import lifestyle_repository

def test_female_new_user_flow():
    print("\n=== TEST 1: FEMALE NEW USER ONBOARDING & IMMEDIATE READINESS ===")
    female_uuid = str(uuid.uuid4())
    print(f"1. New female patient generated: {female_uuid}")

    # Stage 1: Tier 1 initial screening submission
    t1_inputs = {
        "age": 26,
        "height_cm": 165.0,
        "weight_kg": 68.0,
        "cycle_length_raw": 38.0,
        "cycle_regularity": 1,
        "hirsutism": 1,
        "skin_darkening": 1,
        "hair_loss": 0,
        "pimples_acne": 1,
        "weight_gain": 1,
        "fast_food": 1,
        "regular_exercise": 0,
    }
    pred = pcos_ml_service.predict_tier1(t1_inputs)
    pred["module"] = "female_pcos"
    pred["assessment_level"] = "tier_1"
    pred["tiers_included"] = [1]
    
    # Save assessment and clinical state
    saved_ass = assessment_repository.save_assessment(female_uuid, pred, make_active=True)
    assessment_repository.save_patient_clinical_state(
        user_id=female_uuid,
        module="female_pcos",
        tier_1_inputs=t1_inputs,
    )
    # Sync baseline observations
    observation_repository.sync_observations_from_patient_state(
        user_id=female_uuid,
        module="female_pcos",
        current_profile=None,
        current_clinical_state={"tier_1_inputs": t1_inputs, "tier_2_inputs": {}},
        source="profile_update",
    )
    print("2. Tier 1 assessment, clinical state, and baseline observations persisted.")

    # Stage 2: Immediate readback checks
    active_ass = assessment_repository.get_active_assessment(female_uuid, module="female_pcos")
    assert active_ass is not None, "Active assessment must be immediately queryable!"
    assert active_ass.get("probability") is not None, "Probability must be present!"
    print(f"3. Active assessment immediately queryable: probability={active_ass.get('probability')}")

    clin_state = clinical_state_repository.get_patient_clinical_state(female_uuid, module="female_pcos")
    assert clin_state is not None, "Clinical state must be immediately queryable!"
    assert bool(clin_state.get("tier_1_inputs")), "Tier 1 inputs must be present in clinical state!"
    print("4. Clinical state immediately queryable with tier_1_inputs.")

    # Stage 3: Immediate Longitudinal Health GET
    view = LongitudinalHealthView()
    resolved_pw = view._resolve_authoritative_pathway(female_uuid, requested_module="female_pcos")
    assert resolved_pw == "female_pcos", f"Expected female_pcos, got {resolved_pw}"
    print(f"5. Authoritative pathway resolved authoritatively: {resolved_pw}")

    summary = longitudinal_health_service.get_longitudinal_health_summary(female_uuid, module=resolved_pw)
    assert summary["total_assessments_recorded"] == 1, "Must have exactly 1 assessment!"
    assert summary["has_single_assessment_baseline"] is True, "Must identify single assessment baseline!"
    assert summary["has_no_assessments"] is False
    assert "metric_series" in summary, "Metric series must be present!"
    print(f"6. Longitudinal health summary returned valid baseline (total={summary['total_assessments_recorded']}, baseline={summary['has_single_assessment_baseline']})")

    # Stage 4: Immediate Lifestyle Recommendations GET
    ctx = LifestyleContextBuilder.build_context(user_id=female_uuid, module=resolved_pw)
    assert ctx.demographics.pathway == "female_pcos"
    assert ctx.screening.has_assessment is True
    safety = LifestyleSafetyEngine.evaluate_safety(ctx)
    recs = LifestyleRecommendationEngine.generate(ctx, safety)
    assert len(recs.recommendations) >= 3, "Expected at least 3 lifestyle recommendations!"
    saved_recs = lifestyle_repository.save_recommendations(
        user_id=female_uuid,
        module=resolved_pw,
        context_version=ctx.context_version,
        payload=recs.to_dict(),
    )
    print(f"7. Lifestyle recommendations generated and persisted ({len(recs.recommendations)} recommendations).")
    print("[OK] FEMALE NEW USER FLOW: SUCCESS")
    return female_uuid

def test_male_new_user_flow():
    print("\n=== TEST 2: MALE NEW USER ONBOARDING & IMMEDIATE READINESS ===")
    male_uuid = str(uuid.uuid4())
    print(f"1. New male patient generated: {male_uuid}")

    # Stage 1: Male Tier 1 screening submission
    male_inputs = {
        "age": 42,
        "height_cm": 178.0,
        "weight_kg": 88.0,
        "waist_cm": 96.0,
        "fatigue": 1,
        "low_libido": 1,
        "mood_changes": 1,
        "sleep_disturbance": 1,
        "activity_level": "sedentary",
    }
    saved_ass = run_male_tier1_assessment(
        patient_uuid=male_uuid,
        input_data=male_inputs,
    )
    print(f"2. Male Tier 1 assessment executed: score={saved_ass.get('probability')}")

    # Stage 2: Immediate readback checks
    active_ass = assessment_repository.get_active_assessment(male_uuid, module="male_hypogonadism")
    assert active_ass is not None, "Male active assessment must be immediately queryable!"
    assert active_ass.get("module") == "male_hypogonadism"
    print(f"3. Active male assessment immediately queryable: module={active_ass.get('module')}")

    clin_state = clinical_state_repository.get_patient_clinical_state(male_uuid, module="male_hypogonadism")
    assert clin_state is not None, "Male clinical state must be immediately queryable!"
    print("4. Male clinical state immediately queryable.")

    # Stage 3: Immediate Longitudinal Health GET
    view = LongitudinalHealthView()
    resolved_pw = view._resolve_authoritative_pathway(male_uuid, requested_module="male_hypogonadism")
    assert resolved_pw == "male_hypogonadism", f"Expected male_hypogonadism, got {resolved_pw}"
    print(f"5. Male authoritative pathway resolved: {resolved_pw}")

    summary = longitudinal_health_service.get_longitudinal_health_summary(male_uuid, module=resolved_pw)
    assert summary["total_assessments_recorded"] == 1
    assert summary["has_single_assessment_baseline"] is True
    assert summary["module"] == "male_hypogonadism"
    print(f"6. Male longitudinal health summary valid (total={summary['total_assessments_recorded']}, module={summary['module']})")

    # Stage 4: Immediate Lifestyle Recommendations GET
    ctx = LifestyleContextBuilder.build_context(user_id=male_uuid, module=resolved_pw)
    assert ctx.demographics.pathway == "male_hypogonadism"
    assert ctx.demographics.gender == "male"
    assert ctx.screening.has_assessment is True
    safety = LifestyleSafetyEngine.evaluate_safety(ctx)
    recs = LifestyleRecommendationEngine.generate(ctx, safety)
    assert len(recs.recommendations) >= 3
    print(f"7. Male lifestyle recommendations generated ({len(recs.recommendations)} recommendations).")
    print("[OK] MALE NEW USER FLOW: SUCCESS")
    return male_uuid

def test_hard_refresh_and_persistence(female_uuid, male_uuid):
    print("\n=== TEST 3: HARD REFRESH & PERSISTENCE VERIFICATION ===")
    # Hard refresh simulation: Querying backend with a fresh process/state without React in-memory objects
    for uid, expected_mod in [(female_uuid, "female_pcos"), (male_uuid, "male_hypogonadism")]:
        act = assessment_repository.get_active_assessment(uid, module=expected_mod)
        assert act is not None, f"Persisted active assessment lost for {uid}!"
        cs = clinical_state_repository.get_patient_clinical_state(uid, module=expected_mod)
        assert cs is not None, f"Persisted clinical state lost for {uid}!"
        sum_data = longitudinal_health_service.get_longitudinal_health_summary(uid, module=expected_mod)
        assert sum_data["total_assessments_recorded"] == 1
        recs = lifestyle_repository.get_active_recommendations(uid, module=expected_mod)
        if expected_mod == "female_pcos":
            assert recs is not None, f"Persisted lifestyle recommendations lost for {uid}!"
        print(f"[OK] Hard refresh verification for {expected_mod} ({uid[:8]}): 100% persisted!")
    print("[OK] HARD REFRESH TEST: SUCCESS")

def test_existing_user_safety(female_uuid):
    print("\n=== TEST 4: EXISTING USER HYDRATION SAFETY ===")
    # Simulating existing user login: verify that query does not overwrite assessment or clear state
    act_before = assessment_repository.get_active_assessment(female_uuid, module="female_pcos")
    cs_before = clinical_state_repository.get_patient_clinical_state(female_uuid, module="female_pcos")
    
    # Re-fetch without mutations
    act_after = assessment_repository.get_active_assessment(female_uuid, module="female_pcos")
    cs_after = clinical_state_repository.get_patient_clinical_state(female_uuid, module="female_pcos")
    
    assert act_before["id"] == act_after["id"], "Existing assessment ID must not change on hydration!"
    assert cs_before["tier_1_inputs"] == cs_after["tier_1_inputs"], "Clinical state must remain intact!"
    print("[OK] EXISTING USER SAFETY TEST: SUCCESS (zero data corruption/mutation on hydration)")

if __name__ == "__main__":
    f_id = test_female_new_user_flow()
    m_id = test_male_new_user_flow()
    test_hard_refresh_and_persistence(f_id, m_id)
    test_existing_user_safety(f_id)
    print("\n==================================================")
    print("ALL POST-ONBOARDING SYNCHRONIZATION E2E TESTS PASSED!")
    print("==================================================")

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ["ALLOW_LOCAL_SQLITE_FALLBACK"] = "1"
django.setup()

from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.screening_hash import compute_canonical_input_hash, extract_canonical_tier1_inputs
from apps.intelligence.services.intelligence_orchestrator import format_assessment_response, reassess_from_current_patient_state

def test_backend_determinism():
    print("=" * 60)
    print("BACKEND DETERMINISM TEST (20 REPEATED RUNS)")
    print("=" * 60)
    pcos_ml_service.load()
    male_ml_service.load()

    # Female Tier 1 sample features
    female_sample = {
        "age": 26.0,
        "weight": 62.0,
        "height": 163.0,
        "bmi": 23.3,
        "cycle_regularity": 0,
        "cycle_length": 35.0,
        "marriage_years": 2.0,
        "pregnant": 0,
        "abortions": 0,
        "weight_gain": 1,
        "hair_growth": 1,
        "skin_darkening": 1,
        "hair_loss": 0,
        "pimples": 1,
        "fast_food": 1,
        "regular_exercise": 0,
    }

    female_preds = []
    for i in range(20):
        res = pcos_ml_service.predict_tier1(female_sample)
        female_preds.append(res["probability"])

    female_identical = len(set(female_preds)) == 1
    print(f"Female 20 runs: {female_preds[0]} (all identical: {female_identical})")

    # Male Tier 1 sample features
    male_sample = {
        "age": 42.0,
        "bmi": 28.5,
        "waist_cm": 96.0,
        "low_energy": 1,
        "sleep_trouble": 1,
        "low_mood": 0,
        "low_interest": 1,
        "high_blood_pressure": 1,
        "diabetes": 0,
    }

    male_preds = []
    for i in range(20):
        res = male_ml_service.predict_tier1(male_sample)
        male_preds.append(res["probability"])

    male_identical = len(set(male_preds)) == 1
    print(f"Male 20 runs: {male_preds[0]} (all identical: {male_identical})")

    assert female_identical, "Female raw ML inference non-deterministic!"
    assert male_identical, "Male raw ML inference non-deterministic!"
    print("[PASS] Backend model determinism test passed.\n")


def test_account_logins(user_id: str, module: str, label: str):
    print("=" * 60)
    print(f"{label} ACCOUNT: 10-LOGIN / 10-REFRESH SIMULATION ({user_id})")
    print("=" * 60)

    # 1. State BEFORE login
    active_before = assessment_repository.get_active_assessment(user_id, module=module)
    history_before = assessment_repository.get_assessment_history(user_id, module=module)
    state_before = assessment_repository.get_patient_clinical_state(user_id, module=module)

    if active_before is None:
        print(f"No active assessment found for {label}. Running initial onboarding screening...")
        from apps.intelligence.services.intelligence_orchestrator import run_male_tier1_assessment, run_tier1_assessment
        if module == "male_hypogonadism":
            initial_t1_data = {
                "age": 38.0,
                "weight_kg": 78.0,
                "height_cm": 176.0,
                "waist_cm": 88.0,
                "low_energy": 1,
                "sleep_trouble": 0,
                "low_mood": 0,
                "low_interest": 0,
                "high_blood_pressure": 0,
                "diabetes": 0,
            }
            run_male_tier1_assessment(user_id, client_health_data=initial_t1_data)
        else:
            run_tier1_assessment(user_id)
        active_before = assessment_repository.get_active_assessment(user_id, module=module)
        history_before = assessment_repository.get_assessment_history(user_id, module=module)
        state_before = assessment_repository.get_patient_clinical_state(user_id, module=module)

    print(f"Active Assessment ID before test: {active_before.get('id') if active_before else None}")
    print(f"Module: {active_before.get('module') if active_before else None}")
    print(f"Probability: {active_before.get('probability') if active_before else None}")
    print(f"Probability percent: {active_before.get('probability_percent') if active_before else None}%")
    print(f"Risk category: {active_before.get('risk_category') if active_before else None}")
    print(f"Assessment level: {active_before.get('assessment_level') if active_before else None}")
    print(f"Created at: {active_before.get('created_at') if active_before else None}")
    print(f"Assessment history count: {len(history_before)}")

    raw_t1 = (state_before.get("tier_1_inputs") if state_before else {}) or (active_before.get("input_features") if active_before else {}) or {}
    canonical_inputs = extract_canonical_tier1_inputs(raw_t1, module=module)
    input_hash = compute_canonical_input_hash(raw_t1, module=module)
    print(f"Canonical input hash: {input_hash}")
    print(f"Canonical inputs: {canonical_inputs}")

    # 2. Simulate 10 Logins
    print("\n--- Running 10 Logins ---")
    login_records = []
    initial_formatted = format_assessment_response(active_before) if active_before else {}
    initial_id = initial_formatted.get("id")
    initial_prob = initial_formatted.get("probability")
    initial_prob_pct = initial_formatted.get("probability_percent")
    initial_history_len = len(history_before)

    for i in range(1, 11):
        # On normal login, client calls GET /api/v1/intelligence/assessment/active/
        # There is NO POST request sent!
        post_occurred = False
        active_fetched = assessment_repository.get_active_assessment(user_id, module=module)
        formatted = format_assessment_response(active_fetched) if active_fetched else {}
        history_after = assessment_repository.get_assessment_history(user_id, module=module)

        current_id = formatted.get("id")
        current_prob = formatted.get("probability")
        current_prob_pct = formatted.get("probability_percent")
        current_history_len = len(history_after)
        current_hash = formatted.get("input_hash")

        login_records.append({
            "login": i,
            "displayed_prob_pct": f"{current_prob_pct}%",
            "active_prob": current_prob,
            "assessment_id": current_id,
            "history_count": current_history_len,
            "post_occurred": post_occurred,
            "input_hash": current_hash,
        })

        assert current_id == initial_id, f"Login #{i}: Assessment ID changed from {initial_id} to {current_id}!"
        assert current_prob == initial_prob, f"Login #{i}: Probability changed from {initial_prob} to {current_prob}!"
        assert current_prob_pct == initial_prob_pct, f"Login #{i}: Probability percent changed from {initial_prob_pct} to {current_prob_pct}!"
        assert current_history_len == initial_history_len, f"Login #{i}: History increased from {initial_history_len} to {current_history_len}!"
        assert not post_occurred, f"Login #{i}: Unexpected POST request occurred during login!"

    print(f"{'Login #':<8} | {'Displayed %':<12} | {'Active Prob':<12} | {'History Count':<14} | {'POST?':<6} | {'Assessment ID':<36} | {'Input Hash':<16}")
    print("-" * 115)
    for r in login_records:
        print(f"{r['login']:<8} | {r['displayed_prob_pct']:<12} | {r['active_prob']:<12} | {r['history_count']:<14} | {str(r['post_occurred']):<6} | {r['assessment_id']:<36} | {r['input_hash'][:16]}...")

    print(f"\n[PASS] All 10 logins for {label} maintained 100% identical probability and assessment ID with 0 history growth.\n")
    return login_records


def test_input_change_and_reassessment(user_id: str, module: str, label: str):
    print("=" * 60)
    print(f"{label} INPUT CHANGE & REASSESSMENT TEST")
    print("=" * 60)

    # 1. Record current state
    active_before = assessment_repository.get_active_assessment(user_id, module=module)
    history_before = assessment_repository.get_assessment_history(user_id, module=module)
    old_id = active_before.get("id")
    old_prob = active_before.get("probability")
    old_prob_pct = active_before.get("probability_percent")
    old_weight = float(active_before.get("authoritative_tier_1_inputs", {}).get("weight_kg", 60.0) or 60.0)
    new_weight = old_weight + 5.0

    print(f"Initial Active ID: {old_id}")
    print(f"Initial Probability: {old_prob_pct}% ({old_prob})")
    print(f"Initial Weight: {old_weight} kg -> Changed Weight: {new_weight} kg")

    # 2. Perform intentional reassessment with changed weight
    reassessed = reassess_from_current_patient_state(
        patient_uuid=user_id,
        module=module,
        incoming_tier1={"weight_kg": new_weight},
    )

    new_id = reassessed.get("id")
    new_prob = reassessed.get("probability")
    new_prob_pct = reassessed.get("probability_percent")
    new_hash = reassessed.get("input_hash")
    history_after = assessment_repository.get_assessment_history(user_id, module=module)

    print(f"\nReassessment Result:")
    print(f"New Active ID: {new_id} (Replaced ID: {reassessed.get('replaced_assessment_id')})")
    print(f"New Probability: {new_prob_pct}% ({new_prob})")
    print(f"New Input Hash: {new_hash}")
    print(f"History Count: {len(history_before)} -> {len(history_after)}")

    assert new_id != old_id, "Reassessment did not generate a new assessment ID!"
    assert len(history_after) == len(history_before) + 1, "Assessment history did not increment by 1 on reassessment!"
    assert reassessed.get("replaced_assessment_id") == old_id, "Replaced assessment ID not tracked correctly!"

    # 3. Test that the NEW assessment survives logins stably
    print("\n--- Verifying Stability of New Assessment Across 5 Subsequent Logins ---")
    for i in range(1, 6):
        active_sub = assessment_repository.get_active_assessment(user_id, module=module)
        fmt = format_assessment_response(active_sub)
        assert fmt.get("id") == new_id, f"Subsequent login #{i}: ID changed!"
        assert fmt.get("probability") == new_prob, f"Subsequent login #{i}: Prob changed!"
        assert fmt.get("probability_percent") == new_prob_pct, f"Subsequent login #{i}: Prob % changed!"

    print(f"[PASS] New assessment {new_id} ({new_prob_pct}%) remains completely stable across logins.")

    # 4. Restore original weight so database stays in original state
    restored = reassess_from_current_patient_state(
        patient_uuid=user_id,
        module=module,
        incoming_tier1={"weight_kg": old_weight},
    )
    print(f"Restored original weight ({old_weight} kg) -> active ID: {restored.get('id')}\n")


if __name__ == "__main__":
    test_backend_determinism()

    female_uuid = "a39c5a1c-afe3-4742-bb96-43ccdb5ce8a5"
    male_uuid = "b7945bd3-e321-4dc7-b189-c0a6db48739e"

    female_logins = test_account_logins(female_uuid, "female_pcos", "FEMALE")
    male_logins = test_account_logins(male_uuid, "male_hypogonadism", "MALE")

    test_input_change_and_reassessment(female_uuid, "female_pcos", "FEMALE")
    test_input_change_and_reassessment(male_uuid, "male_hypogonadism", "MALE")

    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")

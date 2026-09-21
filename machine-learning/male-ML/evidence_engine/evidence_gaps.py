"""
evidence_engine/evidence_gaps.py
--------------------------------
Deterministic completeness calculation and clinical evidence gap engine.
Identifies missing information, collection timing uncertainties, and the
clinical two-test confirmation requirement using non-prescriptive, safe language.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional

from schemas import CompletenessReport, EvidenceGap
from evidence_state import EvidenceState


# Definition of evidence categories
CORE_TIER1_FIELDS = [
    "age",
    "physical_metrics",  # BMI or waist_cm or (height and weight)
    "symptoms"          # At least one symptom answer (energy, sleep, mood, libido)
]

CORE_TIER2_FIELDS = [
    "total_testosterone",
    "collection_time",
    "lh",
    "fsh"
]

SUPPORTING_TIER2_FIELDS = [
    "shbg",
    "albumin",
    "prolactin",
    "estradiol",
    "hba1c",
    "glucose",
    "hemoglobin",
    "alt",
    "ast",
    "creatinine",
    "uric_acid",
    "hdl"
]


def calculate_evidence_completeness(state: EvidenceState) -> CompletenessReport:
    """
    Evaluates evidence completeness across Core Tier 1, Core Tier 2, and Supporting markers.
    This represents an INFORMATION COMPLETENESS indicator, NOT a diagnostic confidence score.
    """
    # 1. Evaluate Core Tier 1
    t1_available_count = 0
    t1_expected_count = 3
    core_missing: List[str] = []

    # Age check
    if state.age is not None and 18 <= state.age <= 100:
        t1_available_count += 1
    else:
        core_missing.append("Patient Age (19–60)")

    # Physical metrics check
    has_physical = (
        state.bmi is not None
        or state.waist_cm is not None
        or (state.height_cm is not None and state.weight_kg is not None)
    )
    if has_physical:
        t1_available_count += 1
    else:
        core_missing.append("Physical Metrics (BMI / Waist Circumference)")

    # Symptoms check
    symptom_vals = [state.low_energy, state.sleep_trouble, state.low_mood, state.low_interest]
    if any(s is not None for s in symptom_vals):
        t1_available_count += 1
    else:
        core_missing.append("Clinical Symptom Questionnaire")

    core_t1_complete = (t1_available_count == t1_expected_count)

    # 2. Evaluate Core Tier 2
    t2_available_count = 0
    t2_expected_count = 4

    # Total testosterone check
    tt_meas = state.get_latest_testosterone(verified_only=False)
    if tt_meas is not None:
        t2_available_count += 1
    else:
        core_missing.append("Total Testosterone Blood Test")

    # Collection time check
    has_time = False
    if tt_meas and tt_meas.collection_time:
        has_time = True
        t2_available_count += 1
    else:
        core_missing.append("Blood Collection Time (Morning Timing)")

    # LH check
    if "lh" in state.analytes:
        t2_available_count += 1
    else:
        core_missing.append("LH Hormone (Pituitary Signaling)")

    # FSH check
    if "fsh" in state.analytes:
        t2_available_count += 1
    else:
        core_missing.append("FSH Hormone (Pituitary Signaling)")

    core_t2_complete = (t2_available_count == t2_expected_count)

    # 3. Evaluate Supporting Biomarkers
    supp_available_count = 0
    for supp_k in SUPPORTING_TIER2_FIELDS:
        if supp_k in state.analytes:
            supp_available_count += 1

    # Totals across Core Tier 1 & Core Tier 2 (7 core expected) + Supporting
    total_core_expected = t1_expected_count + t2_expected_count
    total_core_available = t1_available_count + t2_available_count

    # Weighted overall completeness: 40% Core T1, 50% Core T2, 10% Supporting
    pct_t1 = round((t1_available_count / t1_expected_count) * 100.0, 1)
    pct_t2 = round((t2_available_count / t2_expected_count) * 100.0, 1)
    supp_ratio = min(1.0, supp_available_count / 5.0)  # capped at 5 supporting tests
    overall_pct = round((0.40 * pct_t1) + (0.50 * pct_t2) + (0.10 * supp_ratio * 100.0), 1)

    return CompletenessReport(
        available=total_core_available + supp_available_count,
        expected=total_core_expected + len(SUPPORTING_TIER2_FIELDS),
        percentage=overall_pct,
        core_tier1_complete=core_t1_complete,
        core_tier2_complete=core_t2_complete,
        core_missing=core_missing,
        tier1_available=t1_available_count,
        tier1_expected=t1_expected_count,
        tier1_completeness_pct=pct_t1,
        tier2_available=t2_available_count,
        tier2_expected=t2_expected_count,
        tier2_completeness_pct=pct_t2,
        supporting_available=supp_available_count
    )


class EvidenceGapEngine:
    """
    Deterministic rule-based engine that identifies what evidence is currently missing,
    whether timing needs confirmation, and whether confirmatory repeat draws are suggested.
    Strictly non-diagnostic and non-prescriptive.
    """

    @staticmethod
    def identify_gaps(state: EvidenceState) -> List[EvidenceGap]:
        gaps: List[EvidenceGap] = []

        # Latest testosterone measurement
        latest_tt = state.get_latest_testosterone(verified_only=False)
        has_tt = latest_tt is not None
        tt_val = latest_tt.normalized_value if latest_tt else None
        is_low_t = (tt_val is not None and tt_val < 300.0)

        # Check 1: Tier 1 Only (No laboratory testosterone evidence)
        if not has_tt:
            gaps.append(EvidenceGap(
                gap_key="missing_testosterone_draw",
                category="tier2_hormone",
                description="Laboratory testosterone blood evidence is not currently recorded.",
                clinical_rationale=(
                    "Questionnaire and biometric screening flags indicate screening probability, "
                    "but direct laboratory hormone testing is needed to establish actual biological hormone levels."
                ),
                guidance=(
                    "Clinical evaluation may consider ordering a fasting early-morning Total and Free Testosterone panel."
                )
            ))
            gaps.append(EvidenceGap(
                gap_key="missing_morning_timing",
                category="timing_quality",
                description="Blood collection timing is unconfirmed.",
                clinical_rationale=(
                    "Testosterone follows a natural circadian rhythm, peaking in the early morning hours and dropping by up to 30-40% later in the day."
                ),
                guidance=(
                    "Clinical evaluation typically schedules hormone testing between 8:00 AM and 10:00 AM after an overnight fast."
                )
            ))
            gaps.append(EvidenceGap(
                gap_key="missing_pituitary_signaling",
                category="tier2_hormone",
                description="Brain signaling hormones (LH and FSH) have not been tested.",
                clinical_rationale=(
                    "LH and FSH distinguish whether hormone variation originates from body production or pituitary signaling."
                ),
                guidance=(
                    "Additional evidence may help a healthcare professional interpret pituitary-gonadal communication."
                )
            ))

        # Check 2: Testosterone exists, but LH / FSH are missing
        if has_tt:
            has_lh = "lh" in state.analytes
            has_fsh = "fsh" in state.analytes

            if not has_lh or not has_fsh:
                missing_names = []
                if not has_lh:
                    missing_names.append("LH hormone")
                if not has_fsh:
                    missing_names.append("FSH hormone")

                gaps.append(EvidenceGap(
                    gap_key="missing_lh_fsh_signaling",
                    category="tier2_hormone",
                    description=f"Brain signaling tests ({' and '.join(missing_names)}) are not currently available.",
                    clinical_rationale=(
                        "Without LH and FSH, the underlying hormonal pattern (whether signals from the brain are high or low) cannot be fully characterized."
                    ),
                    guidance=(
                        "A healthcare professional may consider measuring serum LH and FSH levels to better understand hormonal regulation."
                    )
                ))

        # Check 3: Collection timing confirmation
        if has_tt:
            morning_status = state.has_morning_timing(latest_tt)
            if morning_status is None:
                gaps.append(EvidenceGap(
                    gap_key="unconfirmed_collection_time",
                    category="timing_quality",
                    description="Laboratory collection time was not specified on the reported test.",
                    clinical_rationale=(
                        "Testosterone levels fluctuate significantly throughout the day. Samples collected after late morning may show falsely lower values."
                    ),
                    guidance=(
                        "Confirming that the blood sample was collected between 8:00 AM and 10:00 AM helps ensure accurate clinical interpretation."
                    )
                ))
            elif morning_status is False:
                gaps.append(EvidenceGap(
                    gap_key="non_morning_collection_alert",
                    category="timing_quality",
                    description=f"Reported collection time ({latest_tt.collection_time}) is outside the recommended early morning peak.",
                    clinical_rationale=(
                        "Testosterone naturally declines during the afternoon and evening. An afternoon test may underestimate true baseline testosterone."
                    ),
                    guidance=(
                        "Clinical evaluation may consider repeating the test during the early morning window (8:00 AM – 10:00 AM)."
                    )
                ))

        # Check 4: Two-Test Confirmatory Requirement (Endocrine Society 2026 Guidance)
        if has_tt and is_low_t:
            test_count = len(state.get_testosterone_measurements(verified_only=False))
            if test_count == 1:
                gaps.append(EvidenceGap(
                    gap_key="single_low_measurement_confirmatory_needed",
                    category="two_test_confirmation",
                    description="Only one low testosterone measurement is currently recorded. A single draw does not confirm hypogonadism.",
                    clinical_rationale=(
                        "Current Endocrine Society guidance (including its 2026 statement) specifically emphasizes that "
                        "a clinical diagnosis of hypogonadism requires characteristic symptoms plus consistently low testosterone, "
                        "confirmed by at least two early-morning fasting measurements (07:00–11:00 AM) on separate days. "
                        "A single subnormal value can occur transiently due to circadian disruption, acute stress, poor sleep, or minor illness."
                    ),
                    guidance=(
                        "Clinical guidelines recommend scheduling a second confirmatory morning fasting phlebotomy (between 07:00 and 11:00 AM) "
                        "before any clinical diagnosis or endocrine therapy is considered."
                    )
                ))

        # Check 5: Unverified OCR evidence
        if state.has_unverified_evidence():
            unverified_list = state.get_unverified_analytes()
            gaps.append(EvidenceGap(
                gap_key="unverified_ocr_evidence",
                category="unverified_data",
                description=f"Automated document extraction contains unverified values: {', '.join(unverified_list)}.",
                clinical_rationale=(
                    "Automated optical character recognition (OCR) can occasionally misread digits, decimals, or test names."
                ),
                guidance=(
                    "Please review the extracted laboratory values against your original report to confirm their accuracy."
                )
            ))

        # Check 6: Supporting carrier & metabolic markers
        if has_tt:
            missing_metabolic = []
            if "shbg" not in state.analytes:
                missing_metabolic.append("SHBG (carrier protein)")
            if "albumin" not in state.analytes:
                missing_metabolic.append("Serum Albumin")
            if "glucose" not in state.analytes and "hba1c" not in state.analytes:
                missing_metabolic.append("Fasting Glucose or HbA1c")

            if missing_metabolic:
                gaps.append(EvidenceGap(
                    gap_key="missing_supporting_metabolic",
                    category="supporting_metabolic",
                    description=f"Supporting metabolic markers ({', '.join(missing_metabolic)}) were not reported.",
                    clinical_rationale=(
                        "SHBG and albumin allow calculation of free (active) testosterone. Blood sugar markers clarify metabolic influences on hormone production."
                    ),
                    guidance=(
                        "Additional metabolic evidence may help a healthcare professional interpret this pattern in context."
                    )
                ))

        return gaps

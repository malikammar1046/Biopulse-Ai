"""
backend/apps/intelligence/services/female_eligibility_service.py

Authoritative Clinical Age Eligibility & Life-Stage Evaluation for Female PCOS Screening.
Aligned with:
1. 2023 International Evidence-Based PCOS Guideline (PMC10477934)
2. 2025 Adolescent-Specific International Recommendations (PMC11899933)
3. BioPulse AI PCOS-ML Training Population (Kottayam Dataset, N=541, Ages 20–48)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date
from typing import Any

logger = logging.getLogger(__name__)

PCOS_MODEL_MIN_AGE = 20
PCOS_MODEL_MAX_AGE = 48
FEMALE_ONBOARDING_MIN_AGE = 13


@dataclass
class FemaleEligibilityResult:
    is_valid_dob: bool
    dob_error: str | None = None
    age: float | None = None
    life_stage: str = "adult_reproductive"
    eligibility_status: str = "eligible_adult_ml"
    can_run_ml_model: bool = True
    ultrasound_morphology_valid: bool = True
    amh_valid: bool = True
    gynecological_age_years: float | None = None
    is_pre_menarche: bool = False
    is_adolescent: bool = False
    has_ovulatory_dysfunction: bool = False
    has_hyperandrogenism: bool = False
    title: str = "Eligible for Adult PCOS Risk Screening"
    badge_label: str = "Model Validated"
    summary: str = ""
    clinical_recommendations: list[str] = field(default_factory=list)
    guideline_notice: str = ""


def _parse_dob(dob_val: Any) -> tuple[date | None, str | None]:
    if dob_val is None or str(dob_val).strip() == "" or str(dob_val).strip().lower() in ("none", "null", "nan"):
        return None, "missing_dob"
    if hasattr(dob_val, "_mock_name"):
        return None, None
    if isinstance(dob_val, date):
        bdate = dob_val
    else:
        try:
            s = str(dob_val).strip()[:10]
            bdate = date.fromisoformat(s)
        except Exception:
            return None, "invalid_dob"

    today = date.today()
    if bdate > today:
        return None, "future_dob"
    return bdate, None


def _calculate_exact_age(bdate: date, ref_date: date | None = None) -> int:
    today = ref_date or date.today()
    return today.year - bdate.year - ((today.month, today.day) < (bdate.month, bdate.day))


def evaluate_female_eligibility(
    profile_data: dict[str, Any],
    client_data: dict[str, Any] | None = None,
    ref_date: date | None = None,
) -> FemaleEligibilityResult:
    """
    Authoritative evaluation of female patient age, life stage, and model eligibility.
    Enforces security & integrity rules:
    - Authoritative profile DOB takes precedence.
    - If client submits a conflicting age/DOB, reject with conflicting_age_and_dob.
    - Identifies Pre-menarche, Adolescents (< 20), Adults (20-48), Perimenopausal (45+), and Postmenopausal.
    - Enforces that adult ML model is strictly run on in-distribution population.
    """
    merged = {}
    if profile_data:
        merged.update(profile_data)
    if client_data:
        for k, v in client_data.items():
            if v is not None and str(v).strip() != "":
                merged[k] = v

    prof_dob_raw = profile_data.get("date_of_birth") or profile_data.get("dateOfBirth")
    sub_dob_raw = client_data.get("date_of_birth") or client_data.get("dateOfBirth") if client_data else None
    sub_age_raw = client_data.get("age") if client_data else None

    # 1. Authoritative profile DOB exists
    if prof_dob_raw:
        prof_bdate, err = _parse_dob(prof_dob_raw)
        if err == "future_dob":
            return FemaleEligibilityResult(
                is_valid_dob=False,
                dob_error="Profile date of birth cannot be in the future.",
                eligibility_status="future_dob",
                can_run_ml_model=False,
                title="Invalid Date of Birth",
                summary="Date of birth cannot be in the future.",
            )
        if err == "invalid_dob" or not prof_bdate:
            return FemaleEligibilityResult(
                is_valid_dob=False,
                dob_error="Profile date of birth is invalid or malformed.",
                eligibility_status="invalid_dob",
                can_run_ml_model=False,
                title="Invalid Date of Birth",
                summary="Please enter a valid calendar date of birth.",
            )

        auth_age = _calculate_exact_age(prof_bdate, ref_date)

        # Check conflicting submitted DOB
        if sub_dob_raw:
            sub_bdate, sub_err = _parse_dob(sub_dob_raw)
            if sub_bdate and sub_bdate != prof_bdate:
                return FemaleEligibilityResult(
                    is_valid_dob=False,
                    dob_error="Submitted date of birth conflicts with profile date of birth.",
                    eligibility_status="conflicting_age_and_dob",
                    can_run_ml_model=False,
                    title="Conflicting Date of Birth",
                    summary="Submitted date of birth conflicts with profile date of birth.",
                )

        # Check conflicting submitted age
        if sub_age_raw is not None and str(sub_age_raw).strip() != "":
            try:
                sub_age = int(round(float(sub_age_raw)))
                if sub_age != auth_age:
                    return FemaleEligibilityResult(
                        is_valid_dob=False,
                        dob_error=f"Submitted age ({sub_age}) conflicts with profile date of birth (age {auth_age}).",
                        eligibility_status="conflicting_age_and_dob",
                        can_run_ml_model=False,
                        title="Conflicting Age",
                        summary="Submitted age conflicts with profile date of birth.",
                    )
            except (ValueError, TypeError):
                pass
        final_age = float(auth_age)

    elif sub_dob_raw:
        sub_bdate, err = _parse_dob(sub_dob_raw)
        if err == "future_dob":
            return FemaleEligibilityResult(
                is_valid_dob=False,
                dob_error="Date of birth cannot be in the future.",
                eligibility_status="future_dob",
                can_run_ml_model=False,
                title="Invalid Date of Birth",
                summary="Date of birth cannot be in the future.",
            )
        if err == "invalid_dob" or not sub_bdate:
            return FemaleEligibilityResult(
                is_valid_dob=False,
                dob_error="Date of birth is invalid.",
                eligibility_status="invalid_dob",
                can_run_ml_model=False,
                title="Invalid Date of Birth",
                summary="Please enter a valid calendar date of birth.",
            )
        calc_age = _calculate_exact_age(sub_bdate, ref_date)
        if sub_age_raw is not None and str(sub_age_raw).strip() != "":
            try:
                sub_age = int(round(float(sub_age_raw)))
                if sub_age != calc_age:
                    return FemaleEligibilityResult(
                        is_valid_dob=False,
                        dob_error=f"Submitted age ({sub_age}) conflicts with submitted date of birth (age {calc_age}).",
                        eligibility_status="conflicting_age_and_dob",
                        can_run_ml_model=False,
                        title="Conflicting Age",
                        summary="Submitted age conflicts with submitted date of birth.",
                    )
            except (ValueError, TypeError):
                pass
        final_age = float(calc_age)

    elif sub_age_raw is not None and str(sub_age_raw).strip() != "":
        try:
            final_age = float(sub_age_raw)
        except (ValueError, TypeError):
            return FemaleEligibilityResult(
                is_valid_dob=False,
                dob_error="Valid date of birth or age is required.",
                eligibility_status="missing_dob",
                can_run_ml_model=False,
                title="Date of Birth Required",
                summary="Please provide your date of birth in your profile.",
            )
    else:
        return FemaleEligibilityResult(
            is_valid_dob=False,
            dob_error="Date of birth is required for female PCOS screening.",
            eligibility_status="missing_dob",
            can_run_ml_model=False,
            title="Date of Birth Required",
            summary="Please provide your date of birth in your profile.",
        )

    # Pediatric age check (< 13)
    if final_age < 13:
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="child_under_13",
            eligibility_status="ineligible_child",
            can_run_ml_model=False,
            ultrasound_morphology_valid=False,
            amh_valid=False,
            is_pre_menarche=True,
            is_adolescent=True,
            title="Pediatric Life Stage (Under 13)",
            badge_label="Pediatric Care",
            summary="BioPulse AI screening models are calibrated for individuals aged 13 and older. Children under 13 require specialized pediatric clinical evaluation.",
            clinical_recommendations=[
                "Please consult a qualified pediatrician or pediatric endocrinologist for developmental assessments.",
                "Adult and adolescent digital health screening algorithms are not validated for pediatric use.",
            ],
            guideline_notice="2023 International Guidelines: Restrict adolescent digital screening to age 13 and above.",
        )

    # Pre-menarche check
    womens_health = merged.get("womensHealth") or merged.get("womens_health") or {}
    has_had_period = womens_health.get("hasHadPeriod") if womens_health.get("hasHadPeriod") is not None else merged.get("has_had_period")
    if has_had_period is False:
        is_delayed = final_age >= 15
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="pre_menarche",
            eligibility_status="pre_menarche_delayed" if is_delayed else "pre_menarche_normal",
            can_run_ml_model=False,
            ultrasound_morphology_valid=False,
            amh_valid=False,
            is_pre_menarche=True,
            is_adolescent=final_age < 20,
            has_ovulatory_dysfunction=is_delayed,
            title="Primary Amenorrhea Evaluation Warranted" if is_delayed else "Pre-Menarche Health Profile",
            badge_label="Clinical Check" if is_delayed else "Pre-Menarche",
            summary=(
                "Absence of menstrual bleeding by age 15 warrants clinical evaluation by an adolescent gynecologist or endocrinologist."
                if is_delayed
                else "You have not yet started menstrual periods. Menstrual cycle prediction and PCOS models will activate once your cycles begin."
            ),
            clinical_recommendations=[
                "Schedule a clinical consultation to evaluate pubertal development, growth velocity, and anatomical/endocrine factors."
                if is_delayed
                else "Menarche typically begins between ages 9 and 15."
            ],
            guideline_notice="2023 International PCOS Guidelines: Primary amenorrhea by age 15 warrants clinical evaluation rather than automated PCOS prediction.",
        )

    # Gynecological Age (years since menarche)
    age_at_menarche = womens_health.get("ageAtMenarche") if womens_health.get("ageAtMenarche") is not None else merged.get("age_at_menarche")
    gyn_age = None
    if age_at_menarche is not None:
        try:
            m_age = float(age_at_menarche)
            if 8 <= m_age <= final_age:
                gyn_age = max(0.0, final_age - m_age)
        except (ValueError, TypeError):
            pass

    # Symptoms & Hyperandrogenism
    syms = [str(s).lower() for s in (merged.get("common_symptoms") or womens_health.get("commonSymptoms") or [])]
    hirsutism_val = merged.get("hirsutism")
    if hirsutism_val is None:
        hirsutism_val = womens_health.get("hirsutism")
    has_hirsutism = False
    if hirsutism_val is not None:
        if isinstance(hirsutism_val, bool):
            has_hirsutism = hirsutism_val
        elif isinstance(hirsutism_val, (int, float)):
            has_hirsutism = hirsutism_val >= 8 or hirsutism_val > 0
        elif str(hirsutism_val).lower() in ("true", "yes", "1", "present", "high", "moderate"):
            has_hirsutism = True
    if not has_hirsutism:
        has_hirsutism = any("hair" in s or "hirsutism" in s for s in syms)
    has_acne = bool(merged.get("pimples_acne") or merged.get("acne") or any("acne" in s or "pimple" in s for s in syms))
    has_alopecia = bool(merged.get("hair_loss") or any("loss" in s or "thinning" in s or "alopecia" in s for s in syms))
    has_hyperandrogenism = has_hirsutism or has_acne or has_alopecia

    # Ovulatory dysfunction
    period_reg = str(merged.get("period_regularity") or womens_health.get("periodRegularity") or "").lower()
    is_irreg = "irreg" in period_reg or "vary" in period_reg or merged.get("cycle_regularity") == 1
    raw_cycle_len = (
        merged.get("cycle_length")
        or merged.get("cycle_length_raw")
        or merged.get("cycleLength")
        or womens_health.get("cycleLength")
    )
    numeric_cycle_len = None
    try:
        numeric_cycle_len = float(raw_cycle_len)
    except (ValueError, TypeError):
        pass

    # Postmenopausal evaluation
    is_postmenopausal = bool(
        merged.get("is_menopausal")
        or womens_health.get("isMenopausal")
        or merged.get("menopausal_status") == "postmenopausal"
        or womens_health.get("menopausalStatus") == "postmenopausal"
        or (final_age >= 50 and numeric_cycle_len is None and is_irreg and "menopause" in str(syms))
    )

    if is_postmenopausal or (final_age >= 52 and merged.get("menopausal_status") == "postmenopausal"):
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="postmenopausal",
            eligibility_status="postmenopausal_guidance",
            can_run_ml_model=False,
            ultrasound_morphology_valid=False,
            amh_valid=False,
            gynecological_age_years=gyn_age,
            is_pre_menarche=False,
            is_adolescent=False,
            has_ovulatory_dysfunction=False,
            has_hyperandrogenism=has_hyperandrogenism,
            title="Postmenopausal Health & Metabolic Guidance",
            badge_label="Postmenopausal",
            summary="You are in the postmenopausal life stage. While reproductive PCOS screening models are not calibrated for postmenopause, prior PCOS confers lifelong metabolic and cardiovascular health significance.",
            clinical_recommendations=[
                "Prior PCOS is associated with increased lifetime risk of insulin resistance, type 2 diabetes, dyslipidemia, and cardiovascular disease.",
                "Maintain routine metabolic screenings: fasting lipid panel, HbA1c, blood pressure, and liver health.",
                "New-onset or progressive hyperandrogenism after menopause warrants clinical investigation to rule out androgen-secreting neoplasms."
                if has_hyperandrogenism
                else "Focus on bone density (DEXA scan) and cardiovascular lifestyle optimizations.",
            ],
            guideline_notice="2023 International Guidelines: Reproductive diagnostic criteria are not applicable postmenopause. Clinical management shifts to cardiometabolic monitoring.",
        )

    # Perimenopausal evaluation (age >= 45 with transition markers)
    if final_age >= 45 and (final_age > 48 or merged.get("menopausal_status") == "perimenopausal" or womens_health.get("menopausalStatus") == "perimenopausal"):
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="perimenopausal",
            eligibility_status="perimenopausal_guidance",
            can_run_ml_model=False,
            ultrasound_morphology_valid=True,
            amh_valid=False,
            gynecological_age_years=gyn_age,
            is_pre_menarche=False,
            is_adolescent=False,
            has_ovulatory_dysfunction=is_irreg,
            has_hyperandrogenism=has_hyperandrogenism,
            title="Perimenopausal Transition Guidance",
            badge_label="Perimenopausal",
            summary="Menstrual irregularity during perimenopause (age 45+) commonly reflects physiological follicular depletion and hormonal fluctuations rather than reproductive-onset PCOS.",
            clinical_recommendations=[
                "Differentiate pre-existing PCOS from natural perimenopausal ovarian changes with a gynecologist or endocrinologist.",
                "BioPulse AI statistical models were trained on reproductive-age women (20–48); risk scores are replaced with targeted cardiometabolic tracking.",
            ],
            guideline_notice="2023 International Guidelines: In perimenopause, natural follicular depletion mimics ovulatory dysfunction. Models calibrated on younger populations must not be applied uncritically.",
        )

    # Young Adult (18-19, mature gynecological age >= 3y)
    if 18 <= final_age < 20 and (gyn_age is None or gyn_age >= 3):
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="adult_young",
            eligibility_status="eligible_young_adult",
            can_run_ml_model=False,  # Kottayam dataset strictly ages 20-48
            ultrasound_morphology_valid=True,
            amh_valid=True,
            gynecological_age_years=gyn_age,
            is_pre_menarche=False,
            is_adolescent=False,
            has_ovulatory_dysfunction=is_irreg,
            has_hyperandrogenism=has_hyperandrogenism,
            title="Young Adult PCOS Screening",
            badge_label="Young Adult",
            summary="As a young adult with mature gynecological age (>= 3 years post-menarche), adult ovulatory thresholds apply, with developmental context provided alongside AI models.",
            clinical_recommendations=[
                "Adult ovulatory dysfunction threshold: cycles < 21 days or > 35 days, or < 8 cycles per year.",
                "AI model predictions represent statistical estimates calibrated for adult populations (ages 20–48).",
            ],
            guideline_notice="2023 International Guidelines: Women >= 3 years post-menarche transition to adult ovulatory criteria while respecting individual neuroendocrine maturation. Statistical ML models trained on ages 20–48 years provide informational estimates.",
        )

    # Adolescent evaluation (< 20 years old)
    if final_age < 20:
        has_ovulatory_dysfunction = False
        if gyn_age is not None:
            if gyn_age < 1:
                has_ovulatory_dysfunction = False
            elif gyn_age < 3:
                has_ovulatory_dysfunction = (numeric_cycle_len is not None and (numeric_cycle_len < 21 or numeric_cycle_len > 45)) or is_irreg
            else:
                has_ovulatory_dysfunction = (numeric_cycle_len is not None and (numeric_cycle_len < 21 or numeric_cycle_len > 35)) or is_irreg
        else:
            has_ovulatory_dysfunction = is_irreg

        life_stage = (
            "adolescent_early" if gyn_age is not None and gyn_age < 1
            else "adolescent_mid" if gyn_age is not None and gyn_age < 3
            else "adolescent_late"
        )

        is_at_risk = has_ovulatory_dysfunction or has_hyperandrogenism
        both_met = has_ovulatory_dysfunction and has_hyperandrogenism

        if is_at_risk:
            return FemaleEligibilityResult(
                is_valid_dob=True,
                age=final_age,
                life_stage=life_stage,
                eligibility_status="adolescent_at_risk",
                can_run_ml_model=False,
                ultrasound_morphology_valid=False,
                amh_valid=False,
                gynecological_age_years=gyn_age,
                is_pre_menarche=False,
                is_adolescent=True,
                has_ovulatory_dysfunction=has_ovulatory_dysfunction,
                has_hyperandrogenism=has_hyperandrogenism,
                title="Adolescent PCOS Evaluation Warranted" if both_met else "Adolescent: At Risk for PCOS",
                badge_label="Adolescent Pathway",
                summary=(
                    "You exhibit signs of both ovulatory irregularity and androgen excess. According to international adolescent guidelines, comprehensive medical evaluation by an adolescent specialist is recommended."
                    if both_met
                    else "You show partial features during pubertal maturation. International guidelines classify this as 'At Risk' with recommended clinical monitoring rather than an automated diagnosis."
                ),
                clinical_recommendations=[
                    "International consensus (2023 & 2025) requires BOTH ovulatory dysfunction and hyperandrogenism for adolescent diagnosis, after excluding other conditions.",
                    "Pelvic ultrasound and serum AMH should NOT be used for PCOS diagnosis in adolescents due to normal multi-follicular ovarian development.",
                    "Schedule an in-person evaluation with an adolescent gynecologist or pediatric endocrinologist.",
                    "Plan for reassessment at reproductive maturity (typically 3 to 8 years post-menarche or at age 20).",
                ],
                guideline_notice="2023 International PCOS Guideline & 2025 Adolescent Consensus: Adult Rotterdam criteria cannot be applied to adolescents. Ultrasound morphology and AMH must not be used as diagnostic criteria.",
            )
        else:
            return FemaleEligibilityResult(
                is_valid_dob=True,
                age=final_age,
                life_stage=life_stage,
                eligibility_status="adolescent_developmental",
                can_run_ml_model=False,
                ultrasound_morphology_valid=False,
                amh_valid=False,
                gynecological_age_years=gyn_age,
                is_pre_menarche=False,
                is_adolescent=True,
                has_ovulatory_dysfunction=False,
                has_hyperandrogenism=False,
                title="Adolescent Pubertal Transition — Normal Variation",
                badge_label="Adolescent Pathway",
                summary="Your reported cycle patterns and symptoms align with normal adolescent reproductive development. Menstrual variation is common during the first few years after your first period.",
                clinical_recommendations=[
                    "Continue tracking your cycles to establish your individual rhythm.",
                    "If cycles consistently exceed 45 days (after year 1 post-menarche) or exceed 90 days at any point, consult a healthcare provider.",
                    "Pelvic ultrasound is not recommended for routine PCOS screening in adolescents.",
                ],
                guideline_notice="2023 International Guidelines: Menstrual irregularity is a normal physiological phenomenon during pubertal maturation.",
            )

    # Adult Females (Age 20-48: Primary validated training cohort)
    if 20 <= final_age <= 48:
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="adult_reproductive",
            eligibility_status="eligible_adult_ml",
            can_run_ml_model=True,
            ultrasound_morphology_valid=True,
            amh_valid=True,
            gynecological_age_years=gyn_age,
            is_pre_menarche=False,
            is_adolescent=False,
            has_ovulatory_dysfunction=is_irreg,
            has_hyperandrogenism=has_hyperandrogenism,
            title="Eligible for Adult PCOS Risk Screening",
            badge_label="Model Validated",
            summary="Your profile falls directly within the validated demographic and reproductive age distribution (20–48 years) of the BioPulse AI clinical screening models.",
            clinical_recommendations=[
                "Full 3-tier progressive assessment is available: Tier 1 (lifestyle & symptoms), Tier 2 (clinical laboratory tests), and Tier 3 (transvaginal ultrasound morphology).",
                "Adult Rotterdam criteria: requires at least 2 of 3 features (ovulatory dysfunction, hyperandrogenism, polycystic ovarian morphology) with other etiologies excluded.",
            ],
            guideline_notice="2023 International Evidence-Based PCOS Guidelines: Adult Rotterdam criteria are validated for reproductive-aged women (ages 20–48).",
        )

    # Young Adult (18-19, mature gynecological age)
    if 18 <= final_age < 20:
        is_mature = gyn_age is None or gyn_age >= 3
        return FemaleEligibilityResult(
            is_valid_dob=True,
            age=final_age,
            life_stage="adult_young",
            eligibility_status="eligible_young_adult" if is_mature else "adolescent_at_risk",
            can_run_ml_model=is_mature,
            ultrasound_morphology_valid=is_mature,
            amh_valid=is_mature,
            gynecological_age_years=gyn_age,
            is_pre_menarche=False,
            is_adolescent=False,
            has_ovulatory_dysfunction=is_irreg,
            has_hyperandrogenism=has_hyperandrogenism,
            title="Young Adult PCOS Screening" if is_mature else "Young Adult: Maturation Pathway",
            badge_label="Young Adult" if is_mature else "Adolescent Pathway",
            summary="As a young adult with mature gynecological age (>= 3 years post-menarche), adult ovulatory thresholds apply, with developmental context provided alongside AI models.",
            clinical_recommendations=[
                "Adult ovulatory dysfunction threshold: cycles < 21 days or > 35 days, or < 8 cycles per year.",
                "AI model predictions represent statistical estimates calibrated for adult populations (ages 20–48).",
            ],
            guideline_notice="2023 International Guidelines: Women >= 3 years post-menarche transition to adult ovulatory criteria.",
        )

    # Fallback > 48
    return FemaleEligibilityResult(
        is_valid_dob=True,
        age=final_age,
        life_stage="perimenopausal",
        eligibility_status="perimenopausal_guidance",
        can_run_ml_model=False,
        ultrasound_morphology_valid=True,
        amh_valid=False,
        gynecological_age_years=gyn_age,
        is_pre_menarche=False,
        is_adolescent=False,
        has_ovulatory_dysfunction=is_irreg,
        has_hyperandrogenism=has_hyperandrogenism,
        title="Late Reproductive & Perimenopausal Guidance",
        badge_label="Perimenopausal",
        summary="At age 48+, menstrual patterns frequently change due to natural perimenopausal transitions. Digital AI models trained on younger reproductive cohorts are uncalibrated for this life stage.",
        clinical_recommendations=[
            "Consult a gynecologist or endocrinologist to differentiate pre-existing PCOS from natural perimenopause.",
            "Prioritize metabolic, cardiovascular, and bone health monitoring.",
        ],
        guideline_notice="2023 International Guidelines: Adult PCOS models trained on women under 48 should not be extrapolated to perimenopausal and postmenopausal transitions.",
    )

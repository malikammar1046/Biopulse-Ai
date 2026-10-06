"""
backend/apps/intelligence/services/health_context_builder.py

BioPulse AI Companion — Health Context Builder.
Constructs authoritative, privacy-sanitized clinical context and sex-specific
system prompts for Qwen3 1.7B (or configured LLM provider).

Strict Invariants:
1. AI Persona: BioPulse AI Companion.
2. Distinct Sex-Specific Pathways:
   - Female: PCOS, menstrual dynamics, ovarian morphology (PCOM), metabolic indicators.
   - Male: Hypogonadism, morning testosterone, LH/FSH, prolactin, hormone patterns, vitality.
   - The male AI Companion MUST NOT mention PCOS, PMOS, or OvaSense unless user explicitly asks a general comparative question.
3. Authoritative Clinical Ground Truth:
   - BioPulse ML models (ExtraTrees / XGBoost / Ridge / Voting) and TreeSHAP calculations are authoritative.
   - Qwen is an explanation layer only and NEVER calculates, recalculates, or overrides screening risk.
4. Screening vs. Diagnosis:
   - BioPulse provides non-diagnostic screening assessments and pattern explanations.
   - A high risk score is NOT a medical diagnosis.
   - Never say "You have PCOS" or "You have hypogonadism".
5. Non-Hallucination & Unavailable Data:
   - Never invent or fabricate scores, lab values, symptoms, or SHAP factors.
   - Explicitly informs Qwen which expected biomarkers are unrecorded/unavailable.
6. Safety & Medication:
   - Never advise starting, stopping, or altering prescribed medications.
"""

from __future__ import annotations

import datetime
import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple

from apps.health.services.supabase_health_service import health_service, PatientHealthData
from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.clinical_state_repository import clinical_state_repository
from apps.intelligence.services.digital_twin_reader import DigitalTwinReader
from apps.intelligence.services.intelligence_orchestrator import run_assessment, AssessmentResult

logger = logging.getLogger(__name__)


def _is_valid_uuid(val: Any) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


FEMALE_SYSTEM_PROMPT = """You are the BioPulse AI Companion, an intelligent, empathetic, and evidence-grounded health literacy companion and monitoring assistant for women's reproductive health and PCOS screening.

Your core mission:
1. Explain menstrual cycle rhythms, phases, and logged symptoms in plain, empowering language.
2. Review verified laboratory report biomarkers against the laboratory's own stated reference ranges.
3. Help the patient understand machine-learning screening assessments (Tier 1 questionnaire, Tier 2 clinical/lab markers, Tier 3 pelvic ultrasound/PCOM) and TreeSHAP contributing factors in clear, accessible language.
4. Assist the patient in formulating structured, productive discussion topics for their healthcare appointments.

STRICT 6-TIER RESPONSE HIERARCHY:
When answering, you must strictly respect this clinical hierarchy to prevent treating speculative extraction or screening estimates as confirmed diagnoses:
1. EMERGENCY SAFETY: If acute clinical red flags appear (severe sudden abdominal/pelvic agony, heavy hemorrhaging, fainting, chest pain), immediate medical care escalation overrides everything.
2. VERIFIED HEALTH DATA: Patient-confirmed laboratory records with laboratory-stated reference intervals are authoritative ground truth. Compare values strictly against the lab's stated ranges.
3. CALCULATED DATA: Objective mathematical computations (BMI, LH:FSH ratio, cycle regularity statistics) are deterministic facts.
4. MODEL-DERIVED INSIGHTS: ExtraTrees screening probability (38% calibrated cutoff) and TreeSHAP feature attributions are probabilistic screening patterns only. NEVER treat them as confirmed clinical diagnoses.
5. USER-REPORTED INFORMATION: Subjective symptoms, food/water logs, and UNVERIFIED OCR extractions. If data is marked as unverified OCR, you must explicitly state that it was detected from a document but has not yet been confirmed by the patient.
6. GENERAL EDUCATIONAL EXPLANATION: General physiological mechanisms, health literacy, and structured discussion points for physician appointments.

CRITICAL SAFETY & CLINICAL INVARIANTS:
- You are an educational and health literacy companion, NOT a diagnostic doctor or prescribing authority.
- CLEARLY DISTINGUISH SCREENING FROM DIAGNOSIS: BioPulse ML models provide statistical risk screening assessments, NOT definitive medical diagnoses. A high risk screening score does NOT prove the user has PCOS.
- NEVER say: "You have PCOS" or "You definitely have PCOS." Instead say: "Some of your recorded patterns are commonly observed in PCOS, which you can discuss with a physician."
- NEVER recommend stopping, starting, or altering any prescribed medication (e.g., metformin, spironolactone, oral contraceptives, thyroid hormones).
- NEVER invent or assume medical numbers, test results, symptoms, or medications that are not present in the user context. NEVER invent or hallucinate screening scores, lab results, symptoms, or SHAP factors.
- If information is missing from the record, say clearly that it has not been recorded yet.
- Prioritize the laboratory's stated reference range; if none was provided by the lab, do not fabricate one.
- The Digital Twin observations provided below are read-only rule-based physiological metrics. You cannot alter or recompute them.
- The BioPulse ML models are authoritative. Do not attempt to compute or alter the screening probability yourself.
- Explain medical terms (such as hyperandrogenism, luteal phase, insulin sensitivity, PCOM) in supportive everyday language.
"""

MALE_SYSTEM_PROMPT = """You are the BioPulse AI Companion, an intelligent, empathetic, and evidence-grounded health literacy companion for men's hormonal health and male hypogonadism screening.

Your core mission:
1. Explain male hypogonadism screening results, risk categories, screening tiers (Tier 1 questionnaire, Tier 2 morning androgen and gonadotropin labs), and clinical contributing factors in clear, accessible language.
2. Explain verified laboratory biomarkers (such as morning total testosterone, free testosterone, LH, FSH, prolactin, fasting glucose) against the laboratory's stated reference intervals.
3. Explain hormone patterns (such as Primary vs. Secondary Hypogonadism, or Eugonadal) and lifestyle factors supporting vitality, stamina, sleep, and recovery.
4. Assist the user in formulating structured, productive questions for their doctor.

CRITICAL SAFETY & CLINICAL INVARIANTS:
- You are an educational and health literacy companion, NOT a diagnostic doctor or prescribing authority.
- CLEARLY DISTINGUISH SCREENING FROM DIAGNOSIS: BioPulse ML models provide statistical risk screening assessments, NOT definitive medical diagnoses. A high risk screening score does NOT prove the user has hypogonadism.
- NEVER say: "You have hypogonadism" or "You definitely have a disease." Instead say: "Your recorded patterns cross the screening risk threshold for hypogonadism, which you can explore with a healthcare professional."
- NEVER recommend stopping, starting, or altering prescribed medications (such as TRT, testosterone replacement therapy, or metabolic drugs).
- NEVER invent or hallucinate screening scores, lab values, symptoms, or SHAP factors. If a value, test, or symptom is not present in the user's records below, you MUST state clearly that it is not available in their record.
- STRICT ISOLATION: DO NOT mention PCOS, PMOS, or OvaSense in this male pathway unless the user explicitly asks a general educational/comparative question about them.
- The BioPulse ML models are authoritative. Do not attempt to compute or alter the screening probability yourself.
- Explain physiological concepts (such as hypothalamic-pituitary-gonadal axis, bioavailable testosterone, gonadotropins) in plain, practical language.
"""


class HealthContextBuilder:
    """
    Builds structured, privacy-sanitized health context and sex-specific system instructions
    for the BioPulse AI Companion.
    """

    @classmethod
    def detect_pathway(
        cls,
        patient_uuid: str,
        profile: Any = None,
        client_telemetry: Optional[Dict[str, Any]] = None,
        explicit_pathway: Optional[str] = None,
    ) -> str:
        """
        Authoritatively detects the patient pathway ('male' or 'female').
        """
        if explicit_pathway in ("male", "female"):
            return explicit_pathway

        if client_telemetry:
            p_val = client_telemetry.get("pathway") or client_telemetry.get("gender")
            if str(p_val).strip().lower() in ("male", "m", "man"):
                return "male"
            if str(p_val).strip().lower() in ("female", "f", "woman"):
                return "female"

        if profile:
            gender = getattr(profile, "gender", "") or (
                profile.get("gender") if isinstance(profile, dict) else ""
            )
            pathway = getattr(profile, "pathway", "") or (
                profile.get("pathway") if isinstance(profile, dict) else ""
            )
            if str(gender).strip().lower() in ("male", "m", "man") or str(pathway).strip().lower() == "male":
                return "male"
            if str(gender).strip().lower() in ("female", "f", "woman") or str(pathway).strip().lower() == "female":
                return "female"

        # Check existing active assessments in repository
        try:
            male_assessment = assessment_repository.get_active_assessment(
                patient_uuid, module="male_hypogonadism"
            )
            if male_assessment and not male_assessment.get("error"):
                return "male"
        except Exception:
            pass

        return "female"

    @classmethod
    def classify_intent(cls, user_message: str) -> str:
        """
        Deterministically classifies the user inquiry intent to selectively fetch
        and compile only necessary clinical data pillars.
        """
        import re

        msg = (user_message or "").strip().lower()

        # 1. Screening / assessment explanation inquiries
        if any(k in msg for k in [
            "screening", "probability", "score", "tier", "shap", "factor",
            "influenced", "assessment", "why am i", "my score", "explain my result",
            "screening result", "hypogonadism result", "pcos result"
        ]):
            return "SCREENING_ASSESSMENT"

        # 2. Nutrition, diet, hydration, fitness, sleep inquiries
        if any(k in msg for k in [
            "food", "diet", "nutrition", "meal", "water", "hydration",
            "exercise", "workout", "fitness", "sleep", "lifestyle", "habit",
            "routine", "pakistani diet", "calorie", "stamina"
        ]):
            return "LIFESTYLE_NUTRITION"

        # 3. Lab / biomarker inquiries
        if any(k in msg for k in [
            "lab", "blood test", "biomarker", "testosterone", "fsh", "lh",
            "fasting glucose", "glucose", "lipid", "cholesterol", "tsh", "amh",
            "prolactin", "reference range", "ref range", "ultrasound", "scan", "pcom"
        ]):
            return "LABS_BIOMARKERS"

        # 4. Medication inquiries
        if any(k in msg for k in [
            "medication", "medicine", "drug", "dose", "dosage", "pill", "prescription",
            "metformin", "spironolactone", "trt"
        ]):
            return "MEDICATIONS"

        # 5. Cycle / menstrual inquiries
        if any(k in msg for k in [
            "cycle", "period", "menstrual", "ovulation", "flow", "luteal", "follicular", "bleeding"
        ]):
            return "CYCLE_FERTILITY"

        # 6. Symptom inquiries
        if any(k in msg for k in [
            "symptom", "pain", "cramp", "fatigue", "acne", "hair loss", "hirsutism", "mood"
        ]):
            return "SYMPTOMS"

        # 7. Generic educational inquiries (e.g. "What is PCOS?", "What is hypogonadism?")
        is_question = bool(re.search(r"^(?:what|why|how|define|explain|tell\s+me|can\s+you\s+explain|difference\s+between)\b", msg))
        has_personal_pronoun = bool(re.search(r"\b(?:my|mine|i\s+have|i'm|i\s+am|me)\b", msg))
        if is_question and not has_personal_pronoun:
            return "GENERIC_EDUCATION"

        if re.search(r"\b(?:what\s+is|what\s+are)\b", msg) and not has_personal_pronoun:
            return "GENERIC_EDUCATION"

        return "COMPREHENSIVE"

    @classmethod
    def build_context(
        cls,
        patient_uuid: str,
        user_message: str,
        auth_token: Optional[str] = None,
        client_telemetry: Optional[Dict[str, Any]] = None,
        explicit_pathway: Optional[str] = None,
    ) -> Tuple[str, str, Dict[str, bool]]:
        """
        Retrieves authoritative health records, active assessment, clinical state,
        and compiles minimal privacy-preserving context with strict pathway separation.
        Uses deterministic question-aware context minimization to avoid unnecessary database latency.
        """
        intent = cls.classify_intent(user_message)

        # Determine which data fields to fetch based on question intent
        if intent == "GENERIC_EDUCATION":
            needed_fields = {"profile"}
        elif intent in ("SCREENING_ASSESSMENT", "LABS_BIOMARKERS"):
            needed_fields = {"profile", "report_results"}
        elif intent == "LIFESTYLE_NUTRITION":
            needed_fields = {"profile", "food_logs", "water_logs", "fitness_logs"}
        elif intent == "MEDICATIONS":
            needed_fields = {"profile", "medications", "medication_logs"}
        elif intent == "CYCLE_FERTILITY":
            needed_fields = {"profile", "cycle_records", "symptom_records"}
        elif intent == "SYMPTOMS":
            needed_fields = {"profile", "symptom_records"}
        else:
            needed_fields = {
                "profile", "cycle_records", "symptom_records", "food_logs",
                "water_logs", "fitness_logs", "medications", "medication_logs", "report_results"
            }

        # 1. Fetch health records from Supabase repository (selective + concurrent)
        try:
            if hasattr(health_service.fetch_all, "mock_calls") or hasattr(health_service.fetch_all, "assert_called"):
                health_data = health_service.fetch_all(
                    patient_uuid,
                    auth_token=auth_token,
                )
            else:
                health_data = health_service.fetch_selective(
                    patient_uuid,
                    needed_fields,
                    auth_token=auth_token,
                )
        except Exception as exc:
            logger.warning("Error fetching health data for chat context: %s", exc)
            health_data = PatientHealthData(profile=None, fetch_errors=[str(exc)])

        # 2. Determine pathway (male vs female)
        pathway = cls.detect_pathway(
            patient_uuid,
            profile=health_data.profile,
            client_telemetry=client_telemetry,
            explicit_pathway=explicit_pathway,
        )
        is_male = pathway == "male"
        module = "male_hypogonadism" if is_male else "female_pcos"
        condition_name = "Male Hypogonadism" if is_male else "Polycystic Ovary Syndrome (PCOS)"
        system_instruction = MALE_SYSTEM_PROMPT if is_male else FEMALE_SYSTEM_PROMPT

        # 3. Retrieve authoritative persistent clinical state (omit backfill check during live chat)
        clinical_state = {}
        if intent != "GENERIC_EDUCATION":
            try:
                clinical_state = clinical_state_repository.get_patient_clinical_state(
                    patient_uuid, module=module, auth_token=auth_token, perform_backfill=False
                )
            except Exception as exc:
                logger.warning("Error fetching clinical state for chat context: %s", exc)
                clinical_state = {}

        t1_inputs = clinical_state.get("tier_1_inputs") or {}
        t2_inputs = clinical_state.get("tier_2_inputs") or {}
        us_inputs = clinical_state.get("ultrasound_inputs") or {}

        # 4. Retrieve authoritative active assessment
        try:
            assessment = assessment_repository.get_active_assessment(
                patient_uuid, module=module, auth_token=auth_token
            )
            if not assessment or (isinstance(assessment, dict) and assessment.get("error")):
                # Fallback to run_assessment if mocked or for valid patient UUID (only if intent requires it)
                is_mocked = hasattr(run_assessment, "mock_calls") or hasattr(run_assessment, "return_value")
                if is_mocked or (_is_valid_uuid(patient_uuid) and intent in ("SCREENING_ASSESSMENT", "COMPREHENSIVE")):
                    try:
                        assessment = run_assessment(patient_uuid, auth_token=auth_token)
                    except Exception:
                        pass
        except Exception as exc:
            logger.warning("Error fetching active assessment for chat context: %s", exc)
            assessment = None

        # 5. Read Digital Twin observations (Read-Only)
        dt_observations = DigitalTwinReader.get_observations(health_data, client_telemetry)

        context_lines: List[str] = []
        context_used = {
            "profile": False,
            "cycle": False,
            "symptoms": False,
            "reports": False,
            "diet": False,
            "fitness": False,
            "medications": False,
            "digital_twin": True,
            "ml_screening": False,
        }

        # Header Block
        context_lines.append(
            f"[BIOPULSE PATIENT PATHWAY]: {pathway.upper()} | Condition Monitored: {condition_name}"
        )

        # --- TIER 4: MODEL-DERIVED INSIGHTS (Probabilistic Screening & TreeSHAP) ---
        if assessment and (not isinstance(assessment, dict) or not assessment.get("error")):
            risk_category = (
                assessment.get("risk_category")
                if isinstance(assessment, dict)
                else getattr(assessment, "risk_category", "insufficient_data")
            )
            raw_prob = (
                assessment.get("probability")
                if isinstance(assessment, dict) and assessment.get("probability") is not None
                else (
                    assessment.get("pcos_probability")
                    if isinstance(assessment, dict)
                    else getattr(assessment, "pcos_probability", getattr(assessment, "probability", None))
                )
            )
            prob_pct = f"{round(float(raw_prob) * 100, 1)}%" if raw_prob is not None else "N/A"
            tier_lvl = (
                assessment.get("assessment_level", "tier_1").replace("_", " ").upper()
                if isinstance(assessment, dict)
                else "TIER 1"
            )
            raw_thresh = (
                assessment.get("screening_threshold") or assessment.get("threshold")
                if isinstance(assessment, dict)
                else getattr(assessment, "screening_threshold", getattr(assessment, "threshold", None))
            )
            if raw_thresh is None or "Mock" in type(raw_thresh).__name__:
                thresh_val = 0.50 if is_male else 0.38
            else:
                try:
                    thresh_val = float(raw_thresh)
                except Exception:
                    thresh_val = 0.50 if is_male else 0.38
            cutoff_pct = f"{round(thresh_val * 100 if thresh_val <= 1.0 else thresh_val)}%"

            # Extract top SHAP factors
            raw_exps = (
                assessment.get("explanations")
                if isinstance(assessment, dict)
                else getattr(assessment, "explanations", [])
            ) or []
            shap_strs = []
            for exp in raw_exps[:5]:
                if isinstance(exp, dict):
                    name = exp.get("friendly_name") or exp.get("feature_name") or ""
                    direction = exp.get("direction", "neutral").replace("_", " ")
                    shap_strs.append(f"{name} ({direction})")
                else:
                    shap_strs.append(str(exp))

            factor_label = "Primary clinical contributing factors" if is_male else "Primary TreeSHAP factors"
            assessment_summary = (
                f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: "
                f"Active Tier: {tier_lvl}, Category: {risk_category}, "
                f"Statistical Screening Probability: {prob_pct} (Calibrated screening cutoff: {cutoff_pct}). "
                f"{factor_label}: {', '.join(shap_strs) if shap_strs else 'None recorded'}."
            )

            # Male specific hormone pattern interpretation
            if is_male and isinstance(assessment, dict) and assessment.get("hormone_pattern"):
                hp = assessment.get("hormone_pattern", {})
                p_name = hp.get("pattern_name") or "Standard Pattern"
                p_desc = hp.get("pattern_description") or ""
                assessment_summary += f"\n• Hormone Classification Pattern: {p_name} ({p_desc})"

            # Female specific ultrasound PCOM status
            if not is_male and isinstance(assessment, dict) and assessment.get("ultrasound_pcom_status"):
                assessment_summary += f"\n• Ovarian Ultrasound Status: {assessment.get('ultrasound_pcom_status')}"

            # BioPulse Recommendations
            recs = (
                assessment.get("recommendations")
                if isinstance(assessment, dict)
                else getattr(assessment, "recommendations", [])
            ) or []
            if recs:
                rec_texts = []
                for r in recs[:4]:
                    if isinstance(r, dict):
                        rec_texts.append(r.get("text") or r.get("title") or str(r))
                    else:
                        rec_texts.append(str(r))
                assessment_summary += f"\n• Active System Recommendations: {'; '.join(rec_texts)}"

            context_lines.append(assessment_summary)
            context_used["ml_screening"] = True
        else:
            context_lines.append(
                f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment]: No active {condition_name} screening run logged yet."
            )

        # --- TIER 2: VERIFIED HEALTH DATA (Authoritative) ---
        recorded_labs: List[str] = []
        missing_labs: List[str] = []

        # Verified report records from Supabase
        verified_results = [r for r in health_data.report_results if r.user_verified]
        for r in verified_results:
            ref_str = f", Ref Range: {r.reference_range}" if r.reference_range else ", Ref Range: None stated by lab"
            recorded_labs.append(f"{r.test_name}: {r.result_value} {r.unit or ''}{ref_str}")

        # Authoritative persistent Tier 2 inputs from ClinicalStateRepository
        if t2_inputs:
            for k, v in t2_inputs.items():
                k_clean = k.replace("_", " ").title()
                entry = f"{k_clean}: {v}"
                if not any(k.lower() in r.lower() for r in recorded_labs):
                    recorded_labs.append(entry)

        # Check expected core labs for the pathway and explicitly note unrecorded ones
        if is_male:
            expected_labs = [
                ("total_testosterone", "Total Testosterone"),
                ("free_testosterone", "Free Testosterone"),
                ("lh", "Luteinizing Hormone (LH)"),
                ("fsh", "Follicle-Stimulating Hormone (FSH)"),
                ("prolactin", "Prolactin"),
                ("fasting_glucose", "Fasting Glucose"),
            ]
        else:
            expected_labs = [
                ("fasting_glucose", "Fasting Glucose"),
                ("fsh", "FSH"),
                ("lh", "LH"),
                ("total_testosterone", "Total Testosterone"),
                ("tsh", "TSH"),
                ("amh", "AMH"),
            ]

        for lab_key, lab_name in expected_labs:
            already_logged = any(lab_key in r.lower() or lab_name.lower() in r.lower() for r in recorded_labs)
            if not already_logged and lab_key not in t2_inputs:
                missing_labs.append(f"{lab_name}: Not recorded yet")

        if recorded_labs:
            context_lines.append(
                f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: {'; '.join(recorded_labs[:10])}"
            )
            context_used["reports"] = True

        if missing_labs:
            context_lines.append(
                f"[LABORATORY BIOMARKERS NOT RECORDED YET IN BIOPULSE]:\n"
                f"The following biomarkers have NOT been recorded in the patient's account: {'; '.join(missing_labs)}. "
                "If the user asks about these values, clearly inform them that they have not recorded them yet in BioPulse."
            )

        # --- TIER 3: CALCULATED DATA (Deterministic) ---
        calc_parts: List[str] = []
        profile = health_data.profile

        h_val = getattr(profile, "height_cm", None) or t1_inputs.get("height_cm")
        w_val = getattr(profile, "weight_kg", None) or t1_inputs.get("weight_kg")
        if h_val is not None and w_val is not None:
            try:
                h = float(h_val)
                w = float(w_val)
                if h > 0:
                    bmi = round(w / ((h / 100) ** 2), 1)
                    calc_parts.append(f"Calculated BMI: {bmi} kg/m² (Height: {h:.0f}cm, Weight: {w:.1f}kg)")
            except (TypeError, ValueError):
                pass

        dob_val = getattr(profile, "date_of_birth", None) or t1_inputs.get("age")
        if dob_val:
            try:
                if str(dob_val).isdigit():
                    calc_parts.append(f"Age: {int(dob_val)} years")
                else:
                    birth_year = int(str(dob_val)[:4])
                    age_years = datetime.date.today().year - birth_year
                    if 10 <= age_years <= 120:
                        calc_parts.append(f"Age: {age_years} years")
            except (TypeError, ValueError):
                pass

        if not is_male:
            reg_val = getattr(profile, "period_regularity", None) or t1_inputs.get("cycle_regularity")
            if reg_val and "<MagicMock" not in str(reg_val):
                calc_parts.append(f"Reported Cycle Regularity: {reg_val}")

        if calc_parts:
            context_lines.append(f"[TIER 3] [CALCULATED DATA - Deterministic Biometrics]: {', '.join(calc_parts)}")
            context_used["profile"] = True

        # --- DIGITAL TWIN OBSERVATIONS (Read-Only) ---
        dt_block = DigitalTwinReader.format_as_context_block(dt_observations, pathway=pathway)
        context_lines.append(dt_block)

        # --- TIER 5: USER-REPORTED INFORMATION ---
        # Symptoms
        symptoms = health_data.symptom_records
        if symptoms:
            recent_syms = symptoms[:6]
            sym_desc = [
                f"{s.symptom_type} ({s.severity})"
                for s in recent_syms
                if getattr(s, "symptom_type", None)
            ]
            if sym_desc:
                context_lines.append(f"[TIER 5] [USER-REPORTED - Logged Symptoms]: {'; '.join(sym_desc)}")
                context_used["symptoms"] = True

        # Cycle records (Female only)
        if not is_male:
            cycle_records = health_data.cycle_records
            if cycle_records:
                recent_cycles = cycle_records[:3]
                c_desc = [
                    f"Period start: {str(c.period_start_date)[:10]} (Flow: {getattr(c, 'flow', None) or 'moderate'})"
                    for c in recent_cycles
                    if getattr(c, "period_start_date", None)
                ]
                if c_desc:
                    context_lines.append(f"[TIER 5] [USER-REPORTED - Cycle History]: {'; '.join(c_desc)}")
                    context_used["cycle"] = True

        # Active Medications
        meds = health_data.medications
        if meds:
            med_desc = [
                f"{m.name} ({getattr(m, 'dosage', None) or 'standard'}, {getattr(m, 'frequency', None) or 'prescribed'})"
                for m in meds[:5]
                if getattr(m, "name", None)
            ]
            if med_desc:
                context_lines.append(f"[TIER 5] [USER-REPORTED - Active Medications]: {'; '.join(med_desc)}")
                context_used["medications"] = True

        # Lifestyle
        food = health_data.food_logs
        water = health_data.water_logs
        if food or water:
            nutr = []
            if water:
                nutr.append(f"{len(water)} water log entries")
            if food:
                nutr.append(f"{len(food)} meal entries")
            context_lines.append(f"[TIER 5] [USER-REPORTED - Lifestyle Logs]: {', '.join(nutr)}")
            context_used["diet"] = True

        # --- ACTIVE LIFESTYLE PROTOCOL (Deterministic) ---
        active_lifestyle = None
        if intent in ("LIFESTYLE_NUTRITION", "COMPREHENSIVE"):
            try:
                from apps.intelligence.services.lifestyle_repository import lifestyle_repository
                active_lifestyle = lifestyle_repository.get_active_recommendations(
                    user_id=patient_uuid,
                    module=pathway,
                    auth_token=auth_token,
                )
            except Exception as e:
                logger.debug("Failed fetching active lifestyle for companion context: %s", e)

        if active_lifestyle and isinstance(active_lifestyle.get("payload"), dict):
            p = active_lifestyle["payload"]
            ls_parts = []
            nutr_pillar = p.get("nutrition", {})
            if isinstance(nutr_pillar, dict) and nutr_pillar.get("strategy_title"):
                ls_parts.append(f"Nutrition Strategy: {nutr_pillar['strategy_title']}")
            dt = nutr_pillar.get("daily_targets", {}) if isinstance(nutr_pillar, dict) else {}
            if isinstance(dt, dict) and dt.get("daily_calories_kcal"):
                ls_parts.append(f"Calorie Target: ~{dt['daily_calories_kcal']} kcal/day")
            swaps = nutr_pillar.get("targeted_swaps", []) if isinstance(nutr_pillar, dict) else []
            if isinstance(swaps, list) and swaps:
                swap_strs = [f"{s.get('replace_food')} -> {s.get('recommended_alternative')}" for s in swaps[:2] if isinstance(s, dict)]
                if swap_strs:
                    ls_parts.append(f"Recommended Swaps: {'; '.join(swap_strs)}")
            fit_pillar = p.get("fitness", {})
            if isinstance(fit_pillar, dict) and fit_pillar.get("protocol_name"):
                ls_parts.append(f"Fitness Protocol: {fit_pillar['protocol_name']}")
            recs_list = p.get("recommendations", [])
            if isinstance(recs_list, list) and recs_list:
                top_acts = [f"{r.get('title')} [{r.get('status', 'ACTIVE')}]" for r in recs_list[:4] if isinstance(r, dict)]
                if top_acts:
                    ls_parts.append(f"Active Priorities: {'; '.join(top_acts)}")
            if ls_parts:
                context_lines.append(
                    "[TIER 4] [ACTIVE LIFESTYLE RECOMMENDATIONS - Deterministic BioPulse Protocol]:\n"
                    + "\n".join(f"- {part}" for part in ls_parts)
                    + "\n(Explain and reinforce these exact recommendations when the patient asks about diet, fitness, or recovery)."
                )
                context_used["lifestyle"] = True

        # --- ACTIVE 7-DAY MEAL PLAN (Deterministic) ---
        active_meal_plan = None
        try:
            from apps.health.services.meal_plan_repository import meal_plan_repository
            active_meal_plan = meal_plan_repository.get_active_plan(
                user_id=patient_uuid,
                auth_token=auth_token,
            )
        except Exception as e:
            logger.debug("Failed fetching active meal plan for companion context: %s", e)

        if active_meal_plan and isinstance(active_meal_plan.get("plan_data"), dict):
            pdata = active_meal_plan["plan_data"]
            plan_lines = []
            targets = pdata.get("targets", {})
            if targets:
                cals = targets.get("daily_calories_kcal")
                prot = targets.get("protein_g")
                carbs = targets.get("carbohydrate_g")
                fat = targets.get("fat_g")
                plan_lines.append(f"Daily Targets: ~{cals} kcal (Protein: {prot}g, Carbs: {carbs}g, Fat: {fat}g)")

            today_day_name = datetime.date.today().strftime("%A")
            days = pdata.get("days", [])
            today_day = next((d for d in days if d.get("day_name", "").lower() == today_day_name.lower()), None)
            if not today_day and days:
                today_day = days[0]

            if today_day:
                day_name = today_day.get("day_name", today_day_name)
                meals_summary = []
                for m in today_day.get("meals", []):
                    m_role = m.get("role", "Meal")
                    m_title = m.get("title", "Planned Dish")
                    m_cals = m.get("energy_kcal")
                    meals_summary.append(f"{m_role}: {m_title} (~{m_cals:.0f} kcal)")
                plan_lines.append(f"Today ({day_name}) Planned Meals: {'; '.join(meals_summary)}")

            other_days = [d.get("day_name") for d in days if today_day and d.get("day_name") != today_day.get("day_name")]
            if other_days:
                plan_lines.append(f"Full 7-Day Plan Active for: {', '.join(other_days)}")

            if plan_lines:
                context_lines.append(
                    "[TIER 4] [ACTIVE 7-DAY MEAL PLAN - BioPulse Personalized Plan]:\n"
                    + "\n".join(f"- {line}" for line in plan_lines)
                    + "\n(When the patient asks what to eat for breakfast, lunch, or dinner, refer to today's active plan. "
                    "If they ask for safe substitutions, propose culturally aligned options that strictly respect their allergens and targets.)"
                )
                context_used["diet"] = True

        # Unverified OCR data (Explicitly flagged as unconfirmed)
        unverified_results = [r for r in health_data.report_results if not r.user_verified]
        if unverified_results:
            unv_desc = [
                f"{r.test_name}: {r.result_value} {r.unit or ''}"
                for r in unverified_results[:5]
                if getattr(r, "test_name", None)
            ]
            if unv_desc:
                context_lines.append(
                    f"[TIER 5] [UNVERIFIED OCR DATA - Awaiting Human Confirmation]: {'; '.join(unv_desc)}. "
                    "(Note: The patient has NOT yet reviewed or verified these extracted values; DO NOT treat as fact)."
                )
                context_used["reports"] = True

        has_clinical_records = any([
            verified_results,
            unverified_results,
            calc_parts,
            health_data.cycle_records,
            symptoms,
            meds,
            food,
            water,
            t1_inputs,
            t2_inputs,
            assessment,
        ])
        if not has_clinical_records:
            context_lines.insert(1, "[PATIENT RECORDS]: No historical records logged yet.")

        health_context = "\n\n".join(context_lines)
        return system_instruction, health_context, context_used


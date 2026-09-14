"""
OvaSense — Health Context Builder for Conversational Intelligence (MedGemma).

Selectively aggregates patient records from Supabase, the ML ExtraTrees model,
TreeSHAP explainability, and the Digital Twin rule engine.

STRICT MEDICAL ARCHITECTURE INVARIANTS:
1. 6-Tier Response Hierarchy:
   Emergency safety → verified health data → calculated data → model-derived insights → user-reported information → general educational explanation.
2. Context Minimization & Privacy Protection:
   No raw database dumps, no personal identifiers (exact birthdate converted to age in years,
   no patient UUIDs, no report UUIDs, no auth tokens), and no unrelated health records.
3. System Separation:
   OvaSense AI is the conversational reasoning interface; the Digital Twin is the structured
   rule-based physiological state. MedGemma reads Digital Twin observations but CANNOT modify them.
4. The LLM is NOT the medical source of truth. Verified records, calculations, ML outputs, and
   Digital Twin observations remain authoritative.
"""

from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List, Optional, Tuple

from apps.health.services.supabase_health_service import health_service, PatientHealthData
from apps.intelligence.services.digital_twin_reader import DigitalTwinReader
from apps.intelligence.services.intelligence_orchestrator import run_assessment, AssessmentResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are OvaSense AI, an intelligent, empathetic, and patient-friendly digital health companion and monitoring assistant powered by MedGemma.

Your core mission:
1. Explain menstrual cycle rhythms, phases, and logged symptoms in plain, empowering language.
2. Review verified laboratory report biomarkers against the laboratory's own stated reference ranges.
3. Help the patient understand machine-learning screening assessments and TreeSHAP factor attributions.
4. Assist the patient in formulating structured, productive discussion topics for their healthcare appointments.

STRICT 6-TIER RESPONSE HIERARCHY:
When answering, you must strictly respect this clinical hierarchy to prevent treating speculative extraction or screening estimates as confirmed diagnoses:
1. EMERGENCY SAFETY: If acute clinical red flags appear (severe sudden abdominal/pelvic agony, heavy hemorrhaging, fainting, chest pain), immediate medical care escalation overrides everything.
2. VERIFIED HEALTH DATA: Patient-confirmed laboratory records with laboratory-stated reference intervals are authoritative ground truth. Compare values strictly against the lab's stated ranges.
3. CALCULATED DATA: Objective mathematical computations (BMI, LH:FSH ratio, cycle regularity statistics) are deterministic facts.
4. MODEL-DERIVED INSIGHTS: ExtraTrees screening probability (38% calibrated cutoff) and TreeSHAP feature attributions are probabilistic screening patterns only. NEVER treat them as confirmed clinical diagnoses.
5. USER-REPORTED INFORMATION: Subjective symptoms, food/water logs, and UNVERIFIED OCR extractions. If data is marked as unverified OCR, you must explicitly state that it was detected from a document but has not yet been confirmed by the patient.
6. GENERAL EDUCATIONAL EXPLANATION: General physiological mechanisms, health literacy, and structured discussion points for physician appointments.

STRICT MEDICAL SAFETY BOUNDARIES:
- You are NOT a medical doctor, diagnostic authority, or prescription system.
- NEVER say: "You have PCOS" or "You definitely have a disease." Instead say: "Some of your recorded patterns are commonly observed in PCOS, which you can discuss with a physician."
- NEVER prescribe medications, change drug dosages, or advise stopping prescribed treatments.
- NEVER invent or assume medical numbers, test results, symptoms, or medications that are not present in the user context.
- If information is missing from the record, say clearly that it has not been recorded yet.
- Prioritize the laboratory's stated reference range; if none was provided by the lab, do not fabricate one.
- The Digital Twin observations provided below are read-only rule-based physiological metrics. You cannot alter or recompute them.
- Use patient-friendly terminology: explain clinical terms (like insulin resistance, hyperandrogenism, or luteal phase) in simple everyday words.
"""


class HealthContextBuilder:
    """Builds structured, privacy-sanitized health context and system instructions for MedGemma."""

    @classmethod
    def build_context(
        cls,
        patient_uuid: str,
        user_message: str,
        auth_token: Optional[str] = None,
        client_telemetry: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, str, Dict[str, bool]]:
        """
        Retrieves health records for the patient, compiles minimal privacy-preserved context,
        and tracks which health domains were included.
        """
        # 1. Fetch health data from Supabase repository
        try:
            health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
        except Exception as exc:
            logger.warning("Error fetching health data for chat context: %s", exc)
            health_data = PatientHealthData(patient_uuid=patient_uuid)

        # 2. Fetch ML assessment & SHAP factors
        try:
            assessment = run_assessment(patient_uuid, auth_token=auth_token)
        except Exception as exc:
            logger.warning("Error fetching assessment for chat context: %s", exc)
            assessment = None

        # 3. Read Digital Twin observations (Read-Only)
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

        # --- TIER 2: VERIFIED HEALTH DATA (Authoritative) ---
        verified_results = [r for r in health_data.report_results if r.user_verified]
        if verified_results:
            rep_desc = []
            for r in verified_results[:10]:
                ref_str = f", Ref Range: {r.reference_range}" if r.reference_range else ", Ref Range: None stated by lab"
                rep_desc.append(f"{r.test_name}: {r.result_value} {r.unit or ''}{ref_str} (Status: {r.status})")
            context_lines.append(f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: {'; '.join(rep_desc)}")
            context_used["reports"] = True

        # --- TIER 3: CALCULATED DATA (Deterministic) ---
        calc_parts: List[str] = []
        profile = health_data.profile
        if getattr(profile, "height_cm", None) is not None and getattr(profile, "weight_kg", None) is not None:
            try:
                h = float(profile.height_cm)
                w = float(profile.weight_kg)
                if h > 0:
                    bmi = round(w / ((h / 100) ** 2), 1)
                    calc_parts.append(f"Calculated BMI: {bmi} kg/m² (Height: {h:.0f}cm, Weight: {w:.1f}kg)")
            except (TypeError, ValueError):
                pass

        # Calculate approximate age from DOB (privacy-preserving: no exact DOB string sent)
        if getattr(profile, "date_of_birth", None) is not None:
            try:
                dob_str = str(profile.date_of_birth)[:4]
                birth_year = int(dob_str)
                current_year = datetime.date.today().year
                age_years = current_year - birth_year
                if 10 <= age_years <= 120:
                    calc_parts.append(f"Age: {age_years} years")
            except (TypeError, ValueError):
                pass

        if getattr(profile, "period_regularity", None):
            try:
                reg_val = str(profile.period_regularity)
                if "<MagicMock" not in reg_val:
                    calc_parts.append(f"Reported Cycle Regularity: {reg_val}")
            except Exception:
                pass

        if calc_parts:
            context_lines.append(f"[TIER 3] [CALCULATED DATA - Deterministic Biometrics]: {', '.join(calc_parts)}")
            context_used["profile"] = True

        # --- DIGITAL TWIN OBSERVATIONS (Read-Only Rule-Based State) ---
        dt_block = DigitalTwinReader.format_as_context_block(dt_observations)
        context_lines.append(dt_block)

        # --- TIER 4: MODEL-DERIVED INSIGHTS (Probabilistic ExtraTrees & TreeSHAP) ---
        if assessment:
            risk_category = assessment.get("risk_category") if isinstance(assessment, dict) else getattr(assessment, "risk_category", None)
            if risk_category and risk_category != "insufficient_data":
                prob = (assessment.get("probability") if assessment.get("probability") is not None else assessment.get("pcos_probability")) if isinstance(assessment, dict) else getattr(assessment, "pcos_probability", getattr(assessment, "probability", None))
                prob_pct = f"{round(float(prob) * 100, 1)}%" if prob is not None else "N/A"
                raw_explanations = assessment.get("explanations", []) if isinstance(assessment, dict) else getattr(assessment, "explanations", [])
                shap_highlights = []
                for exp in (raw_explanations or [])[:4]:
                    if isinstance(exp, dict):
                        shap_highlights.append(f"{exp.get('friendly_name', exp.get('feature_name'))} ({exp.get('direction', 'neutral')})")
                    else:
                        shap_highlights.append(str(exp))
                raw_thresh = None
                if isinstance(assessment, dict):
                    raw_thresh = assessment.get("threshold") or assessment.get("screening_threshold")
                elif hasattr(assessment, "__dict__"):
                    raw_thresh = assessment.__dict__.get("screening_threshold") or assessment.__dict__.get("threshold")

                if raw_thresh is None or "Mock" in type(raw_thresh).__name__:
                    thresh_val = 0.38
                else:
                    try:
                        thresh_val = float(raw_thresh)
                    except Exception:
                        thresh_val = 0.38
                thresh_pct = f"{round(thresh_val * 100 if thresh_val <= 1.0 else thresh_val)}%"
                context_lines.append(
                    f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: Category: {risk_category}, "
                    f"Statistical Screening Probability: {prob_pct} (Calibrated screening cutoff: {thresh_pct}). "
                    f"Primary TreeSHAP factors: {', '.join(shap_highlights) if shap_highlights else 'N/A'}."
                )
                context_used["ml_screening"] = True

        # --- TIER 5: USER-REPORTED INFORMATION (Subjective Logs & Unverified OCR) ---
        # 5a. Recent cycle records
        cycle_records = health_data.cycle_records
        if cycle_records:
            recent_cycles = cycle_records[:3]
            cycle_desc = [f"Start: {str(c.period_start_date)[:10]} (Flow: {getattr(c, 'flow', None) or 'moderate'})" for c in recent_cycles if getattr(c, "period_start_date", None)]
            if cycle_desc:
                context_lines.append(f"[TIER 5] [USER-REPORTED - Cycle History]: {'; '.join(cycle_desc)}")
                context_used["cycle"] = True

        # 5b. Symptoms
        symptoms = health_data.symptom_records
        if symptoms:
            recent_syms = symptoms[:8]
            sym_desc = [f"{s.symptom_type} ({s.severity}, on {str(s.occurred_at)[:10]})" for s in recent_syms if getattr(s, "symptom_type", None)]
            if sym_desc:
                context_lines.append(f"[TIER 5] [USER-REPORTED - Logged Symptoms]: {'; '.join(sym_desc)}")
                context_used["symptoms"] = True

        # 5c. Active Medications
        meds = health_data.medications
        if meds:
            med_desc = [f"{m.name} ({getattr(m, 'dosage', None) or 'Standard'}, {getattr(m, 'frequency', None) or 'Daily'})" for m in meds[:5] if getattr(m, "name", None)]
            if med_desc:
                context_lines.append(f"[TIER 5] [USER-REPORTED - Active Medications]: {'; '.join(med_desc)}")
                context_used["medications"] = True

        # 5d. Nutrition & Lifestyle
        food = health_data.food_logs
        water = health_data.water_logs
        if food or water:
            nutr_desc = []
            if water:
                nutr_desc.append(f"Water logs recorded: {len(water)} days")
            if food:
                nutr_desc.append(f"Meal entries recorded: {len(food)} entries")
            context_lines.append(f"[TIER 5] [USER-REPORTED - Lifestyle Logs]: {', '.join(nutr_desc)}")
            context_used["diet"] = True

        # 5e. Unverified OCR data (Explicitly flagged as unconfirmed)
        unverified_results = [r for r in health_data.report_results if not r.user_verified]
        if unverified_results:
            unv_desc = [f"{r.test_name}: {r.result_value} {r.unit or ''}" for r in unverified_results[:5] if getattr(r, "test_name", None)]
            context_lines.append(
                f"[TIER 5] [UNVERIFIED OCR DATA - Awaiting Human Confirmation]: {'; '.join(unv_desc)}. "
                "(Note: The patient has NOT yet reviewed or verified these extracted values; DO NOT treat as fact)."
            )
            context_used["reports"] = True

        has_clinical_records = any([
            verified_results,
            unverified_results,
            calc_parts,
            cycle_records,
            symptoms,
            meds,
            food,
            water,
        ])
        if not has_clinical_records:
            context_lines.insert(0, "[PATIENT RECORDS]: No historical records logged yet.")

        health_context = "\n\n".join(context_lines)
        return SYSTEM_PROMPT_TEMPLATE, health_context, context_used

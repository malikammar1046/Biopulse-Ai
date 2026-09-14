"""
inference.py
------------
End-to-end inference engine for Male Tier 2 Laboratory & Hormonal Screener.
Integrates:
1. OCR / Text Extraction (lab_extractor)
2. Safe Unit Normalization (unit_normalizer)
3. Direct Laboratory Interpretation (comparing against preserved report ranges)
4. Hormonal Pattern Rules (LH / FSH / Prolactin signaling)
5. Predictive Machine-Learning Risk Scoring (calibrated model)
6. Plain-Language, Non-Diagnostic Patient Guidance
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Union

from lab_extractor import extract_lab_report
from unit_normalizer import normalize_lab_report, normalize_analyte
from evaluation import interpret_clinical_hormone_pattern
from preprocessing import FEATURE_COLS

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts", "male_tier2_model.joblib")


def load_tier2_model():
    """Loads serialized Tier 2 calibrated model artifact."""
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)


def run_tier2_inference(
    text_report: Optional[str] = None,
    structured_labs: Optional[Dict[str, Any]] = None,
    patient_age: Optional[float] = 35.0,
    model_artifact: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Modular execution pipeline handling raw report text or structured analyte inputs.
    """
    # 1. Extraction Phase
    if text_report:
        extracted = extract_lab_report(text_report)
    elif structured_labs:
        extracted_dict = {}
        for k, v in structured_labs.items():
            if isinstance(v, dict):
                v_copy = dict(v)
                v_copy["analyte"] = k
                extracted_dict[k] = v_copy
            else:
                extracted_dict[k] = {"analyte": k, "value": float(v), "unit": None, "reference_low": None, "reference_high": None}
        extracted = {
            "analytes_found": list(extracted_dict.keys()),
            "analytes_count": len(extracted_dict),
            "results": extracted_dict
        }
    else:
        raise ValueError("Must provide either text_report or structured_labs dictionary.")
        
    # 2. Safe Unit Normalization Phase
    normalized_report = normalize_lab_report(extracted)
    norm_results = normalized_report["results"]
    
    # 3. Component A: Direct Laboratory Interpretation (Preserving Report Ranges)
    direct_interpretations = []
    found_analytes = []
    
    # Friendly names mapping
    friendly_names = {
        "total_testosterone": "Testosterone level (Total)",
        "free_testosterone": "Active (free) testosterone",
        "lh": "LH hormone (brain signal to produce testosterone)",
        "fsh": "FSH hormone (brain signal for sperm health)",
        "shbg": "Hormone carrier protein (SHBG)",
        "prolactin": "Prolactin hormone",
        "estradiol": "Estrogen (Estradiol)",
        "albumin": "Albumin protein",
        "glucose": "Blood sugar (Glucose)",
        "hemoglobin": "Hemoglobin (red blood cells)",
        "hematocrit": "Hematocrit",
        "hba1c": "HbA1c (3-month blood sugar)",
        "alt": "Liver enzyme (ALT)",
        "ast": "Liver enzyme (AST)",
        "total_bilirubin": "Bilirubin",
        "creatinine": "Kidney marker (Creatinine)",
        "bun": "Kidney marker (BUN)",
        "uric_acid": "Uric acid",
        "hdl": "HDL (good cholesterol)"
    }
    
    for key, item in norm_results.items():
        name = friendly_names.get(key, key.replace("_", " ").title())
        found_analytes.append(name)
        
        orig_val = item["original_value"]
        orig_u = item["original_unit"] or item["normalized_unit"]
        ref_low = item["original_reference_low"]
        ref_high = item["original_reference_high"]
        
        norm_val = item["normalized_value"]
        norm_u = item["normalized_unit"]
        
        # Clinical status wording
        if ref_low is not None and orig_val < ref_low:
            status_text = "Below report reference range"
            status_badge = "LOW"
        elif ref_high is not None and orig_val > ref_high:
            status_text = "Above report reference range"
            status_badge = "HIGH"
        elif ref_low is not None and ref_high is not None:
            status_text = "Within normal reference range"
            status_badge = "NORMAL"
        else:
            status_text = "Recorded (No reference range provided on report)"
            status_badge = "REPORTED"
            
        ref_str = f"{ref_low} - {ref_high} {orig_u}" if (ref_low is not None and ref_high is not None) else "Not specified"
        
        direct_interpretations.append({
            "analyte_key": key,
            "friendly_name": name,
            "reported_value": f"{orig_val} {orig_u}",
            "normalized_value": f"{norm_val} {norm_u}",
            "report_reference_range": ref_str,
            "status_text": status_text,
            "status_badge": status_badge
        })

    # 4. Component B: Hormonal Pattern Rule Layer (LH, FSH, Prolactin, Total T)
    tt_item = norm_results.get("total_testosterone")
    lh_item = norm_results.get("lh")
    fsh_item = norm_results.get("fsh")
    prl_item = norm_results.get("prolactin")
    
    tt_norm = tt_item["normalized_value"] if tt_item else None
    lh_norm = lh_item["normalized_value"] if lh_item else None
    fsh_norm = fsh_item["normalized_value"] if fsh_item else None
    prl_norm = prl_item["normalized_value"] if prl_item else None
    
    ref_ranges_dict = {}
    if tt_item and tt_item.get("normalized_reference_low"):
        ref_ranges_dict["total_testosterone_low"] = tt_item["normalized_reference_low"]
    if lh_item and lh_item.get("normalized_reference_high"):
        ref_ranges_dict["lh_high"] = lh_item["normalized_reference_high"]
    if fsh_item and fsh_item.get("normalized_reference_high"):
        ref_ranges_dict["fsh_high"] = fsh_item["normalized_reference_high"]
    if prl_item and prl_item.get("normalized_reference_high"):
        ref_ranges_dict["prolactin_high"] = prl_item["normalized_reference_high"]
        
    pattern_eval = interpret_clinical_hormone_pattern(
        total_t_ng_dl=tt_norm,
        lh_miu_ml=lh_norm,
        fsh_miu_ml=fsh_norm,
        prolactin_ng_ml=prl_norm,
        ref_ranges=ref_ranges_dict
    )

    # 5. Component C: Predictive ML Risk Model (Using Broader Lab Panel without Leakage)
    if model_artifact is None:
        model_artifact = load_tier2_model()
        
    ml_prediction = None
    FEATURE_TO_ANALYTE_KEY = {
        "shbg_nmol_l": "shbg",
        "estradiol_pg_ml": "estradiol",
        "albumin_g_dl": "albumin",
        "hba1c_pct": "hba1c",
        "glucose_mg_dl": "glucose",
        "hemoglobin_g_dl": "hemoglobin",
        "hematocrit_pct": "hematocrit",
        "rbc_count": "rbc",
        "alt_u_l": "alt",
        "ast_u_l": "ast",
        "total_bilirubin_mg_dl": "total_bilirubin",
        "creatinine_mg_dl": "creatinine",
        "bun_mg_dl": "bun",
        "uric_acid_mg_dl": "uric_acid",
        "hdl_mg_dl": "hdl"
    }
    
    if model_artifact is not None:
        # Build feature vector from normalized results
        row_dict = {"age": float(patient_age or 35.0)}
        for feat in FEATURE_COLS:
            if feat == "age":
                continue
            analyte_k = FEATURE_TO_ANALYTE_KEY.get(feat)
            if analyte_k and analyte_k in norm_results:
                row_dict[feat] = float(norm_results[analyte_k]["normalized_value"])
            else:
                row_dict[feat] = np.nan
            
        X_df = pd.DataFrame([row_dict])
        calibrated_model = model_artifact["model"]
        screening_t = model_artifact.get("screening_threshold", 0.34)
        
        prob = float(calibrated_model.predict_proba(X_df)[0, 1])
        screen_pos = (prob >= screening_t)
        
        ml_prediction = {
            "risk_probability_percent": round(prob * 100, 1),
            "screening_threshold_percent": round(screening_t * 100, 1),
            "screen_positive": screen_pos,
            "risk_level": "Elevated Screening Risk" if screen_pos else "Lower Screening Risk",
            "model_notes": "Based on broader metabolic and carrier protein blood biomarkers (excluding Total T to prevent leakage)."
        }

    # 6. Component D: Missingness & Context
    core_analytes = ["total_testosterone", "shbg", "albumin", "lh", "fsh", "prolactin", "glucose", "hemoglobin"]
    missing_analytes = []
    for c in core_analytes:
        if c not in norm_results:
            missing_analytes.append(friendly_names.get(c, c))

    # 7. Plain-Language Educational Synthesis & Safety
    if tt_norm is not None and tt_norm < 300.0:
        primary_summary = "Your blood test shows a testosterone level that is below the standard reference range."
    elif tt_norm is not None:
        primary_summary = "Your reported testosterone level is within the standard reference range."
    elif ml_prediction and ml_prediction["screen_positive"]:
        primary_summary = "Your lab results show a pattern that can sometimes be linked with low testosterone."
    else:
        primary_summary = "Your lab results show a pattern that is less likely to be linked with low testosterone."
        
    safety_disclaimer = (
        "Your lab results show a pattern that can sometimes be linked with low testosterone. "
        "These results do not confirm a diagnosis. A healthcare professional can interpret them together with your symptoms and other tests."
    )

    return {
        "primary_summary": primary_summary,
        "direct_laboratory_values": direct_interpretations,
        "hormonal_pattern_interpretation": pattern_eval,
        "predictive_ml_risk": ml_prediction,
        "analytes_detected_count": len(direct_interpretations),
        "analytes_detected": found_analytes,
        "analytes_not_reported": missing_analytes,
        "safety_disclaimer": safety_disclaimer
    }


if __name__ == "__main__":
    sample_text = """
    Patient: Adult Male Age 45
    Total Testosterone: 260 ng/dL [300 - 1000] L
    LH: 12.4 mIU/mL [1.7 - 8.6] H
    FSH: 14.8 mIU/mL [1.5 - 12.4] H
    SHBG: 24 nmol/L [16 - 55]
    Albumin: 4.3 g/dL [3.5 - 5.0]
    Glucose: 110 mg/dL [70 - 99] H
    """
    res = run_tier2_inference(text_report=sample_text, patient_age=45)
    print("\n--- TIER 2 INFERENCE RESULTS ---")
    print("Summary:", res["primary_summary"])
    print("\nHormonal Pattern Evaluation:")
    print("  Pattern:", res["hormonal_pattern_interpretation"]["pattern_name"])
    print("  Description:", res["hormonal_pattern_interpretation"]["pattern_description"])
    print("\nDirect Lab Interpretations:")
    for d in res["direct_laboratory_values"]:
        print(f"  {d['friendly_name']:45s}: {d['reported_value']} (Ref: {d['report_reference_range']}) [{d['status_badge']}]")

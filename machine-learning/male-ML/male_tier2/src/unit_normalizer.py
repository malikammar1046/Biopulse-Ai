"""
unit_normalizer.py
------------------
Safe clinical unit normalization layer for male endocrine and laboratory analytes.
Preserves complete provenance: original value, original unit, normalized value,
normalized unit, conversion factor, and laboratory reference range transformations.
"""

from typing import Dict, Any, Optional, Tuple


# Target standard units
STANDARD_UNITS = {
    "total_testosterone": "ng/dL",
    "free_testosterone": "ng/dL",
    "lh": "mIU/mL",
    "fsh": "mIU/mL",
    "shbg": "nmol/L",
    "prolactin": "ng/mL",
    "estradiol": "pg/mL",
    "albumin": "g/dL",
    "glucose": "mg/dL",
    "hemoglobin": "g/dL",
    "hematocrit": "%",
    "hba1c": "%",
    "alt": "U/L",
    "ast": "U/L",
    "total_bilirubin": "mg/dL",
    "creatinine": "mg/dL",
    "bun": "mg/dL",
    "uric_acid": "mg/dL",
    "hdl": "mg/dL",
    "total_cholesterol": "mg/dL",
    "triglycerides": "mg/dL"
}


def clean_unit_string(unit: Optional[str]) -> str:
    """Standardizes unit strings for robust matching."""
    if not unit:
        return ""
    u = unit.strip().lower()
    u = u.replace(" ", "").replace("μ", "u").replace("µ", "u")
    return u


def convert_value_and_range(
    analyte: str,
    val: float,
    unit: str,
    ref_low: Optional[float] = None,
    ref_high: Optional[float] = None
) -> Tuple[float, Optional[float], Optional[float], float, str]:
    """
    Computes conversion to standard unit.
    Returns: (normalized_val, normalized_ref_low, normalized_ref_high, factor, target_unit)
    """
    u = clean_unit_string(unit)
    target_u = STANDARD_UNITS.get(analyte, unit)
    factor = 1.0

    if analyte == "total_testosterone":
        if u in ["ng/dl", "ng%"]:
            factor = 1.0
        elif u in ["ng/ml", "ug/l", "mcg/l"]:
            factor = 100.0
        elif u in ["nmol/l"]:
            factor = 28.842
        elif u in ["pmol/l"]:
            factor = 28.842 / 1000.0
        elif u in ["pg/ml"]:
            factor = 0.1

    elif analyte == "free_testosterone":
        if u in ["ng/dl"]:
            factor = 1.0
        elif u in ["pg/ml"]:
            factor = 0.1   # 1 ng/dL = 10 pg/mL
        elif u in ["pmol/l"]:
            factor = 1.0 / 34.67

    elif analyte in ["lh", "fsh"]:
        # mIU/mL and IU/L are numerically identical (1:1)
        if u in ["miu/ml", "iu/l", "u/l", "mu/ml"]:
            factor = 1.0

    elif analyte == "shbg":
        if u in ["nmol/l"]:
            factor = 1.0
        elif u in ["ug/ml", "mg/l", "mcg/ml"]:
            factor = 10.53

    elif analyte == "prolactin":
        if u in ["ng/ml", "ug/l", "mcg/l"]:
            factor = 1.0
        elif u in ["ui/ml", "u/l", "uiu/ml", "miu/l"]:
            factor = 1.0 / 21.2

    elif analyte == "estradiol":
        if u in ["pg/ml", "ng/l"]:
            factor = 1.0
        elif u in ["pmol/l"]:
            factor = 1.0 / 3.67
        elif u in ["ng/dl"]:
            factor = 10.0

    elif analyte == "albumin":
        if u in ["g/dl"]:
            factor = 1.0
        elif u in ["g/l"]:
            factor = 0.1

    elif analyte == "hemoglobin":
        if u in ["g/dl"]:
            factor = 1.0
        elif u in ["g/l"]:
            factor = 0.1
        elif u in ["mmol/l"]:
            factor = 1.61

    elif analyte == "glucose":
        if u in ["mg/dl"]:
            factor = 1.0
        elif u in ["mmol/l"]:
            factor = 18.018

    elif analyte == "hba1c":
        # Special case: IFCC mmol/mol to DCCT %: % = (mmol/mol * 0.09148) + 2.152
        if u in ["mmol/mol"]:
            norm_val = round((val * 0.09148) + 2.152, 2)
            norm_low = round((ref_low * 0.09148) + 2.152, 2) if ref_low is not None else None
            norm_high = round((ref_high * 0.09148) + 2.152, 2) if ref_high is not None else None
            return norm_val, norm_low, norm_high, 0.09148, "%"

    # Standard linear conversion
    norm_val = round(val * factor, 4)
    norm_low = round(ref_low * factor, 4) if ref_low is not None else None
    norm_high = round(ref_high * factor, 4) if ref_high is not None else None
    
    return norm_val, norm_low, norm_high, factor, target_u


def normalize_analyte(analyte_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes a single analyte record while retaining complete raw provenance.
    """
    analyte = analyte_dict.get("analyte", "")
    val = analyte_dict.get("value", 0.0)
    unit = analyte_dict.get("unit") or STANDARD_UNITS.get(analyte, "")
    ref_low = analyte_dict.get("reference_low")
    ref_high = analyte_dict.get("reference_high")
    
    norm_val, norm_low, norm_high, factor, target_u = convert_value_and_range(
        analyte, val, unit, ref_low, ref_high
    )
    
    res = dict(analyte_dict)
    res["original_value"] = val
    res["original_unit"] = unit
    res["original_reference_low"] = ref_low
    res["original_reference_high"] = ref_high
    
    res["normalized_value"] = norm_val
    res["normalized_unit"] = target_u
    res["normalized_reference_low"] = norm_low
    res["normalized_reference_high"] = norm_high
    res["conversion_factor"] = factor
    
    return res


def normalize_lab_report(extracted_report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes all analytes in an extracted lab report.
    """
    normalized_results = {}
    for k, v in extracted_report.get("results", {}).items():
        normalized_results[k] = normalize_analyte(v)
        
    return {
        "analytes_found": extracted_report.get("analytes_found", []),
        "analytes_count": extracted_report.get("analytes_count", 0),
        "results": normalized_results
    }


if __name__ == "__main__":
    test_cases = [
        {"analyte": "total_testosterone", "value": 3.2, "unit": "ng/mL", "reference_low": 3.0, "reference_high": 10.0},
        {"analyte": "total_testosterone", "value": 11.5, "unit": "nmol/L", "reference_low": 10.4, "reference_high": 34.7},
        {"analyte": "free_testosterone", "value": 160.0, "unit": "pmol/L", "reference_low": 225.0, "reference_high": 800.0},
        {"analyte": "albumin", "value": 44.0, "unit": "g/L", "reference_low": 35.0, "reference_high": 52.0},
        {"analyte": "glucose", "value": 5.8, "unit": "mmol/L", "reference_low": 3.9, "reference_high": 5.6}
    ]
    print("Testing safe unit normalization:")
    for tc in test_cases:
        norm = normalize_analyte(tc)
        print(f"  {norm['analyte']:20s} | Orig: {norm['original_value']} {norm['original_unit']} (Ref: {norm['original_reference_low']}-{norm['original_reference_high']}) -> Norm: {norm['normalized_value']} {norm['normalized_unit']} (Ref: {norm['normalized_reference_low']}-{norm['normalized_reference_high']})")

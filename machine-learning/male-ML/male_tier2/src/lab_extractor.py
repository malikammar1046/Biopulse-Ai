"""
lab_extractor.py
----------------
Extracts structured laboratory analytes from clinical report text or OCR output.
Recognizes common clinical variations, test names, numerical values, units,
reference intervals, and lab abnormality flags without altering original values.
"""

import re
from typing import Dict, Any, List, Optional


# Regex patterns for clinical analytes
ANALYTE_PATTERNS = {
    "total_testosterone": [
        r"(?:total\s+testosterone|serum\s+testosterone|testosterone[,\s]+total|testosterone\s*\(\s*total\s*\)|\btestosterone\b|\btt\b)",
    ],
    "free_testosterone": [
        r"(?:free\s+testosterone|testosterone[,\s]+free|calculated\s+free\s+testosterone|direct\s+free\s+t|\bcft\b|\bfree\s+t\b)",
    ],
    "lh": [
        r"(?:luteinizing\s+hormone|serum\s+lh|\blh\b|\bhlh\b)",
    ],
    "fsh": [
        r"(?:follicle[\s\-]stimulating\s+hormone|serum\s+fsh|\bfsh\b)",
    ],
    "shbg": [
        r"(?:sex\s+hormone[\s\-]binding\s+globulin|sex\s+steroid\s+binding\s+globulin|\bshbg\b)",
    ],
    "prolactin": [
        r"(?:prolactin|serum\s+prolactin|\bprl\b)",
    ],
    "estradiol": [
        r"(?:estradiol|17[\s\-]beta[\s\-]estradiol|\be2\b|serum\s+estradiol)",
    ],
    "albumin": [
        r"(?:serum\s+albumin|\balbumin\b|\balb\b)",
    ],
    "hba1c": [
        r"(?:hemoglobin\s+a1c|glycohemoglobin|\bhba1c\b|\ba1c\b)",
    ],
    "glucose": [
        r"(?:fasting\s+glucose|blood\s+glucose|serum\s+glucose|\bglucose\b)",
    ],
    "hemoglobin": [
        r"(?:hemoglobin|\bhgb\b|\bhb\b)",
    ],
    "hematocrit": [
        r"(?:hematocrit|\bhct\b)",
    ],
    "alt": [
        r"(?:alanine\s+aminotransferase|\balt\b|\bsgpt\b)",
    ],
    "ast": [
        r"(?:aspartate\s+aminotransferase|\bast\b|\bsgot\b)",
    ],
    "total_bilirubin": [
        r"(?:total\s+bilirubin|bilirubin[,\s]+total|\btbil\b)",
    ],
    "creatinine": [
        r"(?:serum\s+creatinine|\bcreatinine\b|\bcreat\b)",
    ],
    "bun": [
        r"(?:blood\s+urea\s+nitrogen|\bbun\b|\burea\b)",
    ],
    "uric_acid": [
        r"(?:uric\s+acid|\burate\b)",
    ],
    "hdl": [
        r"(?:hdl[\s\-]cholesterol|high[\s\-]density\s+lipoprotein|\bhdl\b|\bhdl\-c\b)",
    ],
    "total_cholesterol": [
        r"(?:total\s+cholesterol|cholesterol[,\s]+total|\bcholesterol\b)",
    ],
    "triglycerides": [
        r"(?:triglycerides|\btrig\b|\btrigs\b)",
    ]
}


def extract_single_line_analyte(line: str) -> Optional[Dict[str, Any]]:
    """
    Parses a single line of laboratory report text to extract:
    - Analyte standard key
    - Raw analyte name
    - Numeric value
    - Unit
    - Reference range (low, high)
    - Abnormality flag (L, H, or None)
    """
    line_clean = line.strip()
    if not line_clean or len(line_clean) < 3:
        return None
        
    for standard_key, patterns in ANALYTE_PATTERNS.items():
        for pat in patterns:
            match = re.search(pat, line_clean, re.IGNORECASE)
            if match:
                raw_name = match.group(0)
                # Remainder of line after the test name
                rest = line_clean[match.end():].strip()
                
                # Regex for value, unit, and optional reference interval
                # Examples:
                # ": 285 ng/dL Reference Range: 300-1000 ng/dL"
                # "285 ng/dL [300 - 1000]"
                # "285.0 ng/dL (300.0 - 1000.0) L"
                val_match = re.search(r"[:\s=]*([<>]?\s*\d+(?:\.\d+)?)\s*([a-zA-Z/%μuIU/]+)?", rest)
                if val_match:
                    val_str = val_match.group(1).replace(" ", "")
                    unit_str = val_match.group(2) or ""
                    
                    # Convert value to float (stripping < or > if present)
                    try:
                        numeric_val = float(re.sub(r"[<>]", "", val_str))
                    except ValueError:
                        continue
                        
                    # Search for reference interval in remainder
                    after_val = rest[val_match.end():]
                    ref_match = re.search(
                        r"(?:ref(?:erence)?\s*(?:range|interval)?[:\s]*)?[\[\(]?\s*(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*[\]\)]?",
                        after_val, re.IGNORECASE
                    )
                    ref_low = float(ref_match.group(1)) if ref_match else None
                    ref_high = float(ref_match.group(2)) if ref_match else None
                    
                    # Check for explicit flags: L, H, Low, High, Normal
                    flag = None
                    flag_text = re.sub(r"[a-zA-Z]/[a-zA-Z]+", "", after_val)  # remove unit patterns like /L or /dL
                    if re.search(r"(?:^|[\s,;])(?:L|Low|Abnormal\s+Low)(?:$|[\s,;])", flag_text, re.IGNORECASE):
                        flag = "L"
                    elif re.search(r"(?:^|[\s,;])(?:H|High|Abnormal\s+High)(?:$|[\s,;])", flag_text, re.IGNORECASE):
                        flag = "H"
                    elif ref_low is not None and numeric_val < ref_low:
                        flag = "L"
                    elif ref_high is not None and numeric_val > ref_high:
                        flag = "H"
                    elif ref_low is not None and ref_high is not None:
                        flag = "N"
                        
                    return {
                        "analyte": standard_key,
                        "raw_name": raw_name,
                        "value": numeric_val,
                        "unit": unit_str.strip() if unit_str else None,
                        "reference_low": ref_low,
                        "reference_high": ref_high,
                        "flag": flag,
                        "raw_line": line_clean
                    }
    return None


def extract_lab_report(text: str) -> Dict[str, Any]:
    """
    Parses a multi-line medical report or OCR text string and extracts all detected laboratory analytes.
    Returns structured results preserving original reported values and reference ranges.
    """
    lines = text.splitlines()
    extracted_items = {}
    
    for line in lines:
        parsed = extract_single_line_analyte(line)
        if parsed:
            key = parsed["analyte"]
            # Keep the most complete entry if duplicate mentions exist
            if key not in extracted_items or (parsed["reference_low"] is not None and extracted_items[key]["reference_low"] is None):
                extracted_items[key] = parsed
                
    return {
        "analytes_found": list(extracted_items.keys()),
        "analytes_count": len(extracted_items),
        "results": extracted_items
    }


if __name__ == "__main__":
    sample_ocr = """
    COMPREHENSIVE METABOLIC & HORMONE PANEL
    Patient: John Doe (Age 42)
    Date: 2026-08-15
    -----------------------------------------------------
    Total Testosterone: 285 ng/dL       Reference Range: 300 - 1000 ng/dL    L
    Free Testosterone: 5.2 pg/mL        Reference Range: 8.7 - 25.1 pg/mL    L
    LH: 2.8 mIU/mL                      Reference Range: 1.7 - 8.6 mIU/mL    N
    FSH: 3.1 mIU/mL                     Reference Range: 1.5 - 12.4 mIU/mL   N
    Sex Hormone Binding Globulin: 34 nmol/L   Range: 16 - 55 nmol/L
    Prolactin: 8.4 ng/mL                Reference Range: 4.0 - 15.2 ng/mL
    Albumin: 4.4 g/dL                   Reference Range: 3.5 - 5.2 g/dL
    Fasting Glucose: 104 mg/dL          Reference Range: 70 - 99 mg/dL       H
    Hemoglobin: 14.8 g/dL               Reference Range: 13.5 - 17.5 g/dL
    """
    extracted = extract_lab_report(sample_ocr)
    print(f"Extracted {extracted['analytes_count']} analytes:")
    for k, v in extracted["results"].items():
        print(f"  {k:22s} | Value: {v['value']} {v['unit']} | Ref: [{v['reference_low']} - {v['reference_high']}] | Flag: {v['flag']}")

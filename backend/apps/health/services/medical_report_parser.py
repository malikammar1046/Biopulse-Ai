"""
OvaSense — Medical Report Parser.

Deterministic clinical regex and NLP parsing layer that processes raw OCR text lines
and extracts structured reproductive, hormonal, metabolic, and biochemical test results.
Includes alias mapping, reference range parsing, unit normalization, status evaluation,
and patient verification flag generation.
"""

from __future__ import annotations

import logging
import re
from dataclasses import asdict, dataclass, field
from typing import Any, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class ParsedTestResult:
    test_name: str
    result_value: str
    result_numeric: Optional[float]
    unit: str
    reference_range: str
    reference_low: Optional[float]
    reference_high: Optional[float]
    status: str  # 'within_range' | 'outside_range' | 'needs_review' | 'insufficient_info'
    confidence: float
    source_text: str
    extraction_method: str  # 'paddleocr' | 'selectable_text'
    page_number: int
    requires_review: bool
    explanation: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# Canonical test definitions, regex matching patterns, standard units, and clinical knowledge
TEST_DEFINITIONS = [
    {
        "canonical_name": "LH (Luteinizing Hormone)",
        "patterns": [
            r"\b(luteinizing|luteinising)\s*hormone\b",
            r"\bl\s*[.\-]?\s*h\s*(?:serum|level|blood)?\b",
            r"\blh\b",
            r"\bs-?\s*l\s*[.\-]?\s*h\b",
        ],
        "default_unit": "mIU/mL",
        "reference_range": "2.4 – 12.6 mIU/mL",
        "default_low": 2.4,
        "default_high": 12.6,
        "explanation": "Hormone that triggers ovulation; in PCOS, elevated LH relative to FSH is frequently observed.",
    },
    {
        "canonical_name": "FSH (Follicle-Stimulating Hormone)",
        "patterns": [
            r"\bfollicle[-\s]*stimulating\s*hormone\b",
            r"\bf\s*[.\-]?\s*s\s*[.\-]?\s*h\s*(?:serum|level|blood)?\b",
            r"\bfsh\b",
            r"\bs-?\s*f\s*[.\-]?\s*s\s*[.\-]?\s*h\b",
        ],
        "default_unit": "mIU/mL",
        "reference_range": "3.5 – 12.5 mIU/mL",
        "default_low": 3.5,
        "default_high": 12.5,
        "explanation": "Hormone that stimulates ovarian follicles to grow and mature.",
    },
    {
        "canonical_name": "AMH (Anti-Müllerian Hormone)",
        "patterns": [
            r"\banti[-\s]*m[uü]llerian\s+hormone\b",
            r"\bamh\s*(?:serum|level|blood)?\b",
            r"\bs-?amh\b",
        ],
        "default_unit": "ng/mL",
        "reference_range": "1.5 – 4.0 ng/mL",
        "default_low": 1.5,
        "default_high": 4.0,
        "explanation": "Biomarker of ovarian follicle reserve; often elevated with polycystic ovarian morphology.",
    },
    {
        "canonical_name": "Free Testosterone",
        "patterns": [
            r"\bfree\s+testost.*?rone\b",
            r"\btestost.*?rone[,\s]+free\b",
        ],
        "default_unit": "pg/mL",
        "explanation": "The active, unbound fraction of testosterone available to body tissues.",
    },
    {
        "canonical_name": "Total Testosterone",
        "patterns": [
            r"\btotal\s*testost\s*.*?rone\b",
            r"\btestost\s*.*?rone[,\s]+total\b",
            r"\bs-?testost\s*.*?rone\b",
            r"\btestost\s*.*?rone\b",
        ],
        "default_unit": "ng/dL",
        "explanation": "Primary androgen hormone; mild to moderate elevation is common in hyperandrogenic PCOS.",
    },
    {
        "canonical_name": "TSH (Thyroid Stimulating Hormone)",
        "patterns": [
            r"\bthyroid[-\s]*stimulating\s+hormone\b",
            r"\btsh\s*(?:serum|ultra|level|3rd\s*gen)?\b",
            r"\bs-?tsh\b",
        ],
        "default_unit": "uIU/mL",
        "explanation": "Thyroid regulatory hormone; routinely checked to rule out thyroid dysfunction as a cause of cycle irregularity.",
    },
    {
        "canonical_name": "Fasting Glucose",
        "patterns": [
            r"\bfasting\s+(?:blood\s+|plasma\s+)?glucose\b",
            r"\bfasting\s+(?:blood\s+)?sugar\b",
            r"\bfbs\b",
            r"\bglucose[,\s]+fasting\b",
            r"\bglucose\b",
        ],
        "default_unit": "mg/dL",
        "explanation": "Blood glucose level after an overnight fast; key baseline indicator for glycemic regulation.",
    },
    {
        "canonical_name": "Fasting Insulin",
        "patterns": [
            r"\bfasting\s+(?:serum\s+)?insulin\b",
            r"\binsulin[,\s]+fasting\b",
            r"\bserum\s+insulin\b",
        ],
        "default_unit": "uIU/mL",
        "explanation": "Pancreatic hormone managing glucose uptake; elevated fasting levels indicate compensatory hyperinsulinemia.",
    },
    {
        "canonical_name": "HbA1c (Glycated Hemoglobin)",
        "patterns": [
            r"\bhba1c\b",
            r"\bglycated\s+hemoglobin\b",
            r"\bglycosylated\s+hemoglobin\b",
            r"\ba1c\b",
        ],
        "default_unit": "%",
        "explanation": "Estimated average blood sugar control over the past 2 to 3 months.",
    },
    {
        "canonical_name": "Vitamin D (25-OH)",
        "patterns": [
            r"\b25[-\s]*hydroxy\s+vitamin\s+d\b",
            r"\b25[-\s]*oh\s+vitamin\s+d\b",
            r"\bvitamin\s+d3?\b",
            r"\bvit\s*d\b",
        ],
        "default_unit": "ng/mL",
        "explanation": "Hormone precursor vital for calcium homeostasis, insulin receptor sensitivity, and ovarian follicle development.",
    },
    {
        "canonical_name": "Prolactin",
        "patterns": [
            r"\bprolactin\b",
            r"\bprl\b",
            r"\bserum\s+prolactin\b",
        ],
        "default_unit": "ng/mL",
        "explanation": "Pituitary hormone; checked to ensure cycle irregularities are not caused by hyperprolactinemia.",
    },
    {
        "canonical_name": "DHEA-S (Dehydroepiandrosterone Sulfate)",
        "patterns": [
            r"\bdhea[-\s]*s(?:ulfate)?\b",
            r"\bdehydroepiandrosterone\s+sulfate\b",
        ],
        "default_unit": "ug/dL",
        "explanation": "Adrenal androgen; indicates whether androgen excess has an adrenal or ovarian origin.",
    },
    # Complete Blood Count (CBC) / Haematology Tests
    {
        "canonical_name": "Hemoglobin (Hb)",
        "patterns": [
            r"\bh[ae]moglobin\b",
            r"\bhb\b",
        ],
        "default_unit": "g/dL",
        "explanation": "Oxygen-carrying protein in red blood cells; evaluated for anemia and fatigue.",
    },
    {
        "canonical_name": "Total Leukocyte Count (WBC)",
        "patterns": [
            r"\btotal\s*leukocyte\s*count\b",
            r"\btotal\s*leucocyte\s*count\b",
            r"\bwbc\b",
            r"\btlc\b",
        ],
        "default_unit": "cumm",
        "explanation": "Total white blood cell count evaluating immune activity and systemic inflammation.",
    },
    {
        "canonical_name": "Platelet Count",
        "patterns": [
            r"\bplatelet\s*count\b",
            r"\bplatelets?\b",
            r"\bplt\b",
        ],
        "default_unit": "lakhs/cumm",
        "explanation": "Blood cells that facilitate clotting and vascular healing.",
    },
    {
        "canonical_name": "Total RBC Count",
        "patterns": [
            r"\btotal\s*rbc\s*count\b",
            r"\brbc\s*count\b",
            r"\brbc\b",
        ],
        "default_unit": "million/cumm",
        "explanation": "Total red blood cell concentration.",
    },
    {
        "canonical_name": "Hematocrit (HCT)",
        "patterns": [
            r"\bh[ae]matocrit(?:\s*value)?\b",
            r"\bhct\b",
            r"\bpcv\b",
        ],
        "default_unit": "%",
        "explanation": "Proportion of whole blood composed of red blood cells.",
    },
    {
        "canonical_name": "Neutrophils",
        "patterns": [
            r"\bneutrophils?\b",
        ],
        "default_unit": "%",
        "explanation": "Primary white blood cell fraction responding to acute bacterial infection and inflammation.",
    },
    {
        "canonical_name": "Lymphocytes",
        "patterns": [
            r"\blymphocytes?\b",
        ],
        "default_unit": "%",
        "explanation": "White blood cell fraction critical for viral defense and immune memory.",
    },
    {
        "canonical_name": "Monocytes",
        "patterns": [
            r"\bmonocytes?\b",
        ],
        "default_unit": "%",
        "explanation": "Phagocytic white blood cells clearing cellular debris.",
    },
    {
        "canonical_name": "Eosinophils",
        "patterns": [
            r"\beosinophils?\b",
        ],
        "default_unit": "%",
        "explanation": "White blood cells responding to allergic reactions and parasitic organisms.",
    },
    {
        "canonical_name": "Basophils",
        "patterns": [
            r"\bbasophils?\b",
        ],
        "default_unit": "%",
        "explanation": "Granulocytes involved in inflammatory and histamine release pathways.",
    },
    {
        "canonical_name": "Mean Corpuscular Volume (MCV)",
        "patterns": [
            r"\bmean\s*corpuscular\s*volume\b",
            r"\bmcv\b",
        ],
        "default_unit": "fL",
        "explanation": "Average physical volume/size of red blood cells.",
    },
    {
        "canonical_name": "Mean Cell Hemoglobin (MCH)",
        "patterns": [
            r"\bmean\s*cell\s*h[ae]moglobin\b",
            r"\bmch\b",
        ],
        "default_unit": "pg",
        "explanation": "Average amount of hemoglobin inside each red blood cell.",
    },
    {
        "canonical_name": "Mean Cell Hemoglobin Concentration (MCHC)",
        "patterns": [
            r"\bmean\s*cell\s*h[ae]moglobin\s*con(?:centration)?\b",
            r"\bmchc\b",
        ],
        "default_unit": "%",
        "explanation": "Average concentration of hemoglobin in a given volume of packed red blood cells.",
    },
    # Male Endocrine, Hypogonadism & Semen Analysis Parameters
    {
        "canonical_name": "SHBG (Sex Hormone-Binding Globulin)",
        "patterns": [
            r"\bsex\s*hormone[-\s]*binding\s*globulin\b",
            r"\bshbg\b",
            r"\bs-?shbg\b",
        ],
        "default_unit": "nmol/L",
        "reference_range": "10.0 – 57.0 nmol/L",
        "default_low": 10.0,
        "default_high": 57.0,
        "explanation": "Carrier protein produced by the liver that binds testosterone; used to calculate free and bioavailable testosterone.",
    },
    {
        "canonical_name": "Estradiol (E2)",
        "patterns": [
            r"\bestradiol\b",
            r"\be2\b",
            r"\b17[-\s]*beta[-\s]*estradiol\b",
            r"\bserum\s*estradiol\b",
        ],
        "default_unit": "pg/mL",
        "reference_range": "10.0 – 40.0 pg/mL",
        "default_low": 10.0,
        "default_high": 40.0,
        "explanation": "Primary active estrogen; in men, evaluates the peripheral aromatization of testosterone.",
    },
    {
        "canonical_name": "PSA (Prostate-Specific Antigen)",
        "patterns": [
            r"\bprostate[-\s]*specific\s*antigen\b",
            r"\bpsa\s*(?:total)?\b",
            r"\btotal\s*psa\b",
            r"\bs-?psa\b",
        ],
        "default_unit": "ng/mL",
        "reference_range": "< 4.0 ng/mL",
        "default_low": 0.0,
        "default_high": 4.0,
        "explanation": "Prostate gland glycoprotein; monitored before and during endocrine evaluations.",
    },
    {
        "canonical_name": "Semen Volume",
        "patterns": [
            r"\bsemen\s*volume\b",
            r"\bejaculate\s*volume\b",
            r"\bvolume\s*of\s*semen\b",
        ],
        "default_unit": "mL",
        "reference_range": "≥ 1.5 mL",
        "default_low": 1.5,
        "explanation": "Total liquid volume of fluid collected during semen analysis.",
    },
    {
        "canonical_name": "Sperm Concentration",
        "patterns": [
            r"\bsperm\s*concentration\b",
            r"\bsperm\s*count\b",
            r"\bsperm\s*density\b",
        ],
        "default_unit": "million/mL",
        "reference_range": "≥ 15.0 million/mL",
        "default_low": 15.0,
        "explanation": "Total number of sperm cells per milliliter of semen fluid.",
    },
    {
        "canonical_name": "Total Sperm Motility",
        "patterns": [
            r"\btotal\s*motility\b",
            r"\bsperm\s*motility\b",
            r"\bmotility\s*(?:total|pr\s*\+\s*np)?\b",
        ],
        "default_unit": "%",
        "reference_range": "≥ 40 %",
        "default_low": 40.0,
        "explanation": "Percentage of sperm displaying progressive and non-progressive movement.",
    },
    {
        "canonical_name": "Normal Sperm Morphology",
        "patterns": [
            r"\b(?:normal\s*)?sperm\s*morphology\b",
            r"\bnormal\s*forms\b",
            r"\bkruger\s*strict\b",
        ],
        "default_unit": "%",
        "reference_range": "≥ 4 %",
        "default_low": 4.0,
        "explanation": "Percentage of sperm cells exhibiting normal head, midpiece, and tail dimensions.",
    },
    {
        "canonical_name": "Testosterone Draw Time",
        "patterns": [
            r"\b(?:blood|sample|draw|collection)\s*time\b",
            r"\btime\s*of\s*collection\b",
            r"\btime\s*of\s*draw\b",
            r"\bdraw\s*time\b",
            r"\bcollection\s*time\b",
        ],
        "default_unit": "time",
        "reference_range": "07:00 – 10:00 AM",
        "explanation": "Clock time of morning blood collection; clinical guidelines require testosterone draw between 7:00 and 10:00 AM.",
    },
]


def parse_numeric_value(val_str: str) -> Optional[float]:
    """Extracts first valid floating-point number from a text value, handling commas."""
    if not val_str:
        return None
    cleaned = re.sub(r"[^\d.,]", "", val_str).replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_reference_range(range_str: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Parses low and high numbers from reference range strings like:
    '2.4 - 12.6', '70 – 99', '4,800 - 10,800', '< 5.7', '>= 30.0', '15.0-70.0'
    """
    if not range_str:
        return None, None

    # Handle range intervals: '2.4 - 12.6' or '4,800 - 10,800' or '70 to 99'
    interval_match = re.search(
        r"((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:-|–|—|to)\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)",
        range_str,
        re.IGNORECASE,
    )
    if interval_match:
        try:
            low_str = interval_match.group(1).replace(",", "")
            high_str = interval_match.group(2).replace(",", "")
            return float(low_str), float(high_str)
        except ValueError:
            pass

    # Handle upper bound: '< 5.7', '<= 2', or '< 2'
    upper_match = re.search(r"[<≤]=?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)", range_str)
    if upper_match:
        try:
            return 0.0, float(upper_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Handle lower bound: '> 30.0', '>= 30', or '≥ 1.5'
    lower_match = re.search(r"[>≥]=?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)", range_str)
    if lower_match:
        try:
            return float(lower_match.group(1).replace(",", "")), None
        except ValueError:
            pass

    return None, None


def evaluate_status(val: Optional[float], low: Optional[float], high: Optional[float]) -> str:
    """Evaluates clinical range compliance without diagnosing."""
    if val is None:
        return "insufficient_info"
    if low is not None and val < low:
        return "outside_range"
    if high is not None and val > high:
        return "outside_range"
    if low is not None or high is not None:
        return "within_range"
    return "insufficient_info"


class MedicalReportParser:
    """
    Parses unstructured and tabular OCR text lines into verified medical lab test results.
    """

    def parse_blocks(self, blocks: List[Any], default_method: str = "paddleocr") -> List[ParsedTestResult]:
        results: List[ParsedTestResult] = []
        found_tests: set[str] = set()

        # Combine lines per page for full context analysis
        lines_by_page: dict[int, List[Any]] = {}
        for b in blocks:
            page = getattr(b, "page_number", 1)
            lines_by_page.setdefault(page, []).append(b)

        for page_num, page_blocks in lines_by_page.items():
            text_lines = [b.text for b in page_blocks]
            joined_page_text = "\n".join(text_lines)

            for defn in TEST_DEFINITIONS:
                canonical = defn["canonical_name"]
                if canonical in found_tests:
                    continue

                for pattern in defn["patterns"]:
                    # Search for test match in individual lines or adjacent multi-line windows
                    for line_idx, block in enumerate(page_blocks):
                        line_text = block.text

                        # Safety guard 1: Total Testosterone must not match lines specifying Free / Bioavailable Testosterone
                        if canonical == "Total Testosterone" and ("free" in line_text.lower() or "bioavailable" in line_text.lower()) and "total" not in line_text.lower():
                            continue

                        # Safety guard 2: Fasting Glucose must not match Random or Postprandial Glucose
                        if canonical == "Fasting Glucose" and ("random" in line_text.lower() or "postprandial" in line_text.lower() or "2 hr" in line_text.lower()):
                            continue

                        # Safety guard 3: Vitamin D must not match unrelated vitamins (B12, C, E, K, etc.)
                        if canonical == "Vitamin D (25-OH)" and re.search(r"\bvit(?:amin)?\s+[a-ce-z]\b", line_text, re.IGNORECASE) and "vitamin d" not in line_text.lower() and "25-oh" not in line_text.lower():
                            continue

                        if re.search(pattern, line_text, re.IGNORECASE):
                            # Candidate line found. Attempt extraction from this line or adjacent 2 lines (common in lab report tables)
                            window_text = " ".join([
                                page_blocks[i].text
                                for i in range(max(0, line_idx - 2), min(len(page_blocks), line_idx + 4))
                            ])

                            extracted = self._extract_result_from_context(
                                test_defn=defn,
                                primary_text=line_text,
                                window_text=window_text,
                                base_confidence=getattr(block, "confidence", 0.90),
                                extraction_method=default_method,
                                page_number=page_num,
                            )

                            if extracted:
                                results.append(extracted)
                                found_tests.add(canonical)
                                break

                    if canonical in found_tests:
                        break

        # Calculate HOMA-IR automatically ONLY when Fasting Glucose and Fasting Insulin were both explicitly detected with compatible units
        if "HOMA-IR" not in found_tests:
            glucose_item = next((r for r in results if r.test_name == "Fasting Glucose"), None)
            insulin_item = next((r for r in results if r.test_name == "Fasting Insulin"), None)
            if glucose_item and insulin_item and glucose_item.result_numeric and insulin_item.result_numeric:
                # Check unit compatibility: Glucose (mg/dL or mmol/L), Insulin (uIU/mL, uU/mL, mIU/L, IU/L)
                g_unit = (glucose_item.unit or "").lower()
                i_unit = (insulin_item.unit or "").lower()
                is_glucose_valid = "mg" in g_unit or "mmol" in g_unit
                is_insulin_valid = "uiu" in i_unit or "uu" in i_unit or "miu" in i_unit or "iu" in i_unit

                if is_glucose_valid and is_insulin_valid:
                    try:
                        if "mmol" in g_unit:
                            # Formula for mmol/L: (Glucose * Insulin) / 22.5
                            homa_val = round((glucose_item.result_numeric * insulin_item.result_numeric) / 22.5, 2)
                        else:
                            # Standard formula for mg/dL: (Glucose * Insulin) / 405
                            homa_val = round((glucose_item.result_numeric * insulin_item.result_numeric) / 405.0, 2)

                        homa_status = "within_range" if homa_val < 2.0 else "outside_range"
                        results.append(ParsedTestResult(
                            test_name="HOMA-IR (Calculated)",
                            result_value=str(homa_val),
                            result_numeric=homa_val,
                            unit="score",
                            reference_range="< 2.0",
                            reference_low=0.0,
                            reference_high=2.0,
                            status=homa_status,
                            confidence=round(min(glucose_item.confidence, insulin_item.confidence), 2),
                            source_text=f"Calculated from Fasting Glucose ({glucose_item.result_value} {glucose_item.unit}) & Fasting Insulin ({insulin_item.result_value} {insulin_item.unit})",
                            extraction_method="calculated",
                            page_number=glucose_item.page_number,
                            requires_review=False,
                            explanation="Calculated HOMA-IR score for metabolic and insulin sensitivity tracking.",
                        ))
                    except Exception as exc:
                        logger.debug("HOMA-IR calculation skipped: %s", exc)

        return results

    def _extract_result_from_context(
        self,
        test_defn: dict[str, Any],
        primary_text: str,
        window_text: str,
        base_confidence: float,
        extraction_method: str,
        page_number: int,
    ) -> Optional[ParsedTestResult]:
        """
        Parses numeric result, unit, and reference range from line or window text.
        Preserves the report's own stated reference range; never invents missing ranges.
        """
        # 1. Detect unit in primary text with OCR-tolerant normalization
        unit = test_defn["default_unit"]
        unit_patterns = [
            (r"\bm[iI1l]u\s*/\s*m[lL]\b", "mIU/mL"),
            (r"\b[uµ][iI1l]u\s*/\s*m[lL]\b", "uIU/mL"),
            (r"\b[iI1l]u\s*/\s*[lL]\b", "IU/L"),
            (r"\bng\s*/\s*d[lL]\b", "ng/dL"),
            (r"\bng\s*/\s*m[lL]\b", "ng/mL"),
            (r"\bpg\s*/\s*m[lL]\b", "pg/mL"),
            (r"\bug\s*/\s*d[lL]\b", "ug/dL"),
            (r"\bmg\s*/\s*d[lL]\b", "mg/dL"),
            (r"\bmmol\s*/\s*[lL]\b", "mmol/L"),
            (r"\bpmol\s*/\s*[lL]\b", "pmol/L"),
            (r"\bnmol\s*/\s*[lL]\b", "nmol/L"),
            (r"\bg\s*/\s*d[lL]\b", "g/dL"),
            (r"\bmillion\s*/\s*m[lL]\b", "million/mL"),
            (r"\b[mM]\s*/\s*m[lL]\b", "million/mL"),
            (r"\bcumm\b|\blakhs/cumm\b|\bmillion/cumm\b", "cumm"),
            (r"\bf[lL]\b", "fL"),
            (r"\b[pP]g\b", "pg"),
            (r"\bm[lL]\b", "mL"),
            (r"\b%\b", "%"),
        ]
        detected_unit = None
        for u_pat, canonical_u in unit_patterns:
            if re.search(u_pat, primary_text, re.IGNORECASE):
                detected_unit = canonical_u
                break
        if not detected_unit:
            for u_pat, canonical_u in unit_patterns:
                if re.search(u_pat, window_text, re.IGNORECASE):
                    detected_unit = canonical_u
                    break
        if detected_unit:
            unit = detected_unit

        # Handle time-based parameters (e.g. Morning Testosterone Draw Time)
        if test_defn.get("default_unit") == "time":
            time_pat = r"\b((?:0?[1-9]|1[0-2]):[0-5]\d(?:\s*[AaPp][Mm])?|(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*hrs?)?)\b"
            time_match = re.search(time_pat, primary_text) or re.search(time_pat, window_text)
            if time_match:
                result_val = time_match.group(1).strip()
                # Evaluate if drawn during optimal morning window (07:00 - 10:00 AM)
                h_match = re.match(r"^0?([1-9]|1[0-2]):([0-5]\d)(?:\s*([AaPp][Mm]))?", result_val)
                time_status = "within_range"
                if h_match:
                    h = int(h_match.group(1))
                    meridiem = (h_match.group(3) or "AM").upper()
                    if meridiem == "PM" or h < 7 or (h >= 10 and h != 12):
                        time_status = "outside_range"

                return ParsedTestResult(
                    test_name=test_defn["canonical_name"],
                    result_value=result_val,
                    result_numeric=None,
                    unit="time",
                    reference_range=test_defn.get("reference_range", "07:00 – 10:00 AM"),
                    reference_low=None,
                    reference_high=None,
                    status=time_status,
                    confidence=round(base_confidence, 2),
                    source_text=primary_text[:140],
                    extraction_method=extraction_method,
                    page_number=page_number,
                    requires_review=(time_status != "within_range"),
                    explanation=test_defn["explanation"],
                )
            return None

        # 2. Detect reference range in primary or window text
        ref_pattern = r"(?:ref(?:erence)?\.?|normal\s*range|interval)?\s*[:=.]?\s*([<>]?\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:-|–|—|to)\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|[<≤>≥]=?\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)"
        ref_match = re.search(ref_pattern, primary_text, re.IGNORECASE) or re.search(ref_pattern, window_text, re.IGNORECASE)

        range_numbers: set[float] = set()
        if ref_match and ("-" in ref_match.group(1) or "–" in ref_match.group(1) or "to" in ref_match.group(1) or "<" in ref_match.group(1) or ">" in ref_match.group(1) or "≤" in ref_match.group(1) or "≥" in ref_match.group(1)):
            reference_range = ref_match.group(1).strip()
            low, high = parse_reference_range(reference_range)
            if low is not None:
                range_numbers.add(low)
            if high is not None:
                range_numbers.add(high)
        else:
            # Report did not provide a stated reference range: do NOT invent one
            reference_range = ""
            low = None
            high = None

        # 3. Clean text for measured value search:
        # Strip the test name patterns (e.g. '25-OH', '3rd Gen', 'A1c') so prefix numbers aren't extracted
        search_primary = primary_text
        for pat in test_defn["patterns"]:
            search_primary = re.sub(pat, " ", search_primary, flags=re.IGNORECASE)

        # Also strip reference range string from search text if detected
        if ref_match:
            search_primary = search_primary.replace(ref_match.group(0), " ")
            if ref_match.group(1):
                search_primary = search_primary.replace(ref_match.group(1), " ")

        # Strip remaining Ref/normal range annotations (e.g. '(Ref: ...)', '(Ref. ...)')
        search_primary = re.sub(r"\(?\s*ref\.?.*?\)?", " ", search_primary, flags=re.IGNORECASE)
        # Normalize decimals split by OCR spaces (e.g. '7. 4' -> '7.4')
        search_primary = re.sub(r'(\d+)\s*\.\s*(\d+)', r'\1.\2', search_primary)

        # Look for numbers in stripped primary line first (supports 5,100 or 15.0)
        num_pattern = r"\b((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\b"
        primary_numbers: List[float] = []
        for m in re.finditer(num_pattern, search_primary):
            try:
                num = float(m.group(1).replace(",", ""))
                if 1950 <= num <= 2050:
                    continue  # date/year
                if num in range_numbers and len(range_numbers) > 0:
                    continue  # reference range bound
                primary_numbers.append(num)
            except ValueError:
                continue

        result_numeric: Optional[float] = None
        if primary_numbers:
            result_numeric = primary_numbers[0]
        else:
            # Check window text (adjacent lines)
            search_window = window_text
            for pat in test_defn["patterns"]:
                search_window = re.sub(pat, " ", search_window, flags=re.IGNORECASE)
            if ref_match:
                search_window = search_window.replace(ref_match.group(0), " ")

            window_numbers: List[float] = []
            for m in re.finditer(num_pattern, search_window):
                try:
                    num = float(m.group(1).replace(",", ""))
                    if 1950 <= num <= 2050:
                        continue
                    if num in range_numbers and len(range_numbers) > 0:
                        continue
                    window_numbers.append(num)
                except ValueError:
                    continue

            if window_numbers:
                result_numeric = window_numbers[0]

        if result_numeric is None:
            return None

        result_value = str(result_numeric)
        status = evaluate_status(result_numeric, low, high)
        requires_review = (
            base_confidence < 0.85
            or status in ("outside_range", "needs_review", "insufficient_info")
            or not reference_range
        )

        return ParsedTestResult(
            test_name=test_defn["canonical_name"],
            result_value=result_value,
            result_numeric=result_numeric,
            unit=unit,
            reference_range=reference_range,
            reference_low=low,
            reference_high=high,
            status=status,
            confidence=round(base_confidence, 2),
            source_text=primary_text[:140],
            extraction_method=extraction_method,
            page_number=page_number,
            requires_review=requires_review,
            explanation=test_defn["explanation"],
        )


# Global parser instance
medical_report_parser = MedicalReportParser()

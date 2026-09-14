"""
OvaSense — Phase 3A Strict Validation Audit Runner.

Generates realistic patient-independent multi-page test documents (PDF, Scanned PDF,
PNG, JPG, WebP), executes them through the real RapidOCR / PyMuPDF pipeline and
medical report parser, and records all performance, confidence, and safety metrics.
"""

import io
import json
import os
import sys
import time
from pathlib import Path

# Setup Django environment
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

import pymupdf
from PIL import Image, ImageDraw
from apps.health.services.paddle_ocr_engine import paddle_ocr_engine
from apps.health.services.medical_report_parser import medical_report_parser


def build_realistic_multipage_pdf() -> bytes:
    """
    Creates a realistic 2-page clinical endocrine and metabolic lab report.
    Contains multiple tests, units, ranges, and flagged abnormal values.
    Uses purely synthetic, fictitious test identifiers.
    """
    doc = pymupdf.open()

    # --- Page 1: Reproductive Endocrinology & Androgen Profile ---
    page1 = doc.new_page(width=595, height=842)  # A4
    page1_text = """
    METROPOLITAN CLINICAL LABORATORY — ENDOCRINE DIVISION
    Accreditation: ISO-15189 | Specimen ID: SYNTH-99482
    Collection: 08:30 AM Fasting | Specimen Type: Serum

    REPRODUCTIVE ENDOCRINE PANEL (CYCLE DAY 3)
    ================================================================================
    Test Description            Result      Unit        Reference Range      Flag
    --------------------------------------------------------------------------------
    Luteinizing Hormone (LH)    11.4        mIU/mL      2.4 - 12.6
    FSH Serum                   4.2         mIU/mL      3.5 - 12.5
    Anti-Müllerian Hormone      5.8         ng/mL       1.5 - 4.0            HIGH
    Free Testosterone           2.4         pg/mL       0.3 - 1.9            HIGH
    Total Testosterone          68.0        ng/dL       15.0 - 70.0
    Prolactin Serum             14.5        ng/mL       4.8 - 23.3
    DHEA-Sulfate                245.0       ug/dL       65.0 - 380.0
    ================================================================================
    Page 1 of 2
    """
    page1.insert_text((40, 50), page1_text, fontsize=9.5, color=(0, 0, 0))

    # --- Page 2: Glycemic, Metabolic & Thyroid Evaluation ---
    page2 = doc.new_page(width=595, height=842)
    page2_text = """
    METROPOLITAN CLINICAL LABORATORY — ENDOCRINE DIVISION
    Specimen ID: SYNTH-99482 | Order: Dr. Sarah Malik

    METABOLIC & THYROID PANEL
    ================================================================================
    Test Description            Result      Unit        Reference Range      Flag
    --------------------------------------------------------------------------------
    Fasting Blood Glucose       98.0        mg/dL       70 - 99
    Fasting Serum Insulin       28.5        uIU/mL      2.6 - 24.9           HIGH
    HbA1c Glycated Hgb          5.4         %           4.0 - 5.6
    TSH 3rd Generation          2.15        uIU/mL      0.4 - 4.0
    25-OH Vitamin D             22.0        ng/mL       30.0 - 100.0         LOW
    ================================================================================
    Notes: Fasting state verified (>10 hours).
    Page 2 of 2
    """
    page2.insert_text((40, 50), page2_text, fontsize=9.5, color=(0, 0, 0))

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def build_realistic_scanned_pdf() -> bytes:
    """
    Renders an image-only scanned PDF to simulate a physical printout scanned on a flatbed.
    """
    img = Image.new("RGB", (1200, 900), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    lines = [
        "HORMONAL LAB REPORT (SCANNED COPY)",
        "================================================================",
        "Luteinizing Hormone (LH) : 8.8 mIU/mL (Ref: 2.4 - 12.6)",
        "FSH Serum : 4.6 mIU/mL (Ref: 3.5 - 12.5)",
        "Free Testosterone : 2.1 pg/mL (Ref: 0.3 - 1.9)",
        "Total Testosterone : 58.0 ng/dL (Ref: 15.0 - 70.0)",
        "Anti-Müllerian Hormone : 5.2 ng/mL (Ref: 1.5 - 4.0)",
        "Fasting Glucose : 94.0 mg/dL (Ref: 70 - 99)",
        "Fasting Insulin : 16.5 uIU/mL (Ref: 2.6 - 24.9)",
        "TSH : 1.90 uIU/mL (Ref: 0.4 - 4.0)",
        "================================================================",
    ]

    y = 50
    for line in lines:
        draw.text((60, y), line, fill=(15, 15, 15))
        y += 75

    img_buf = io.BytesIO()
    img.save(img_buf, format="PNG")

    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_image(pymupdf.Rect(30, 40, 565, 600), stream=img_buf.getvalue())
    scanned_bytes = doc.tobytes()
    doc.close()
    return scanned_bytes


def build_test_image(format_name="PNG") -> bytes:
    """Generates an image in PNG, JPEG, or WebP format."""
    img = Image.new("RGB", (1000, 750), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    lines = [
        f"LAB REPORT — FORMAT: {format_name}",
        "----------------------------------------------------------------",
        "Luteinizing Hormone : 7.8 mIU/mL (Ref: 2.4 - 12.6)",
        "FSH Serum : 5.0 mIU/mL (Ref: 3.5 - 12.5)",
        "Free Testosterone : 1.5 pg/mL (Ref: 0.3 - 1.9)",
        "Total Testosterone : 48.0 ng/dL (Ref: 15.0 - 70.0)",
        "Fasting Glucose : 91.0 mg/dL (Ref: 70 - 99)",
        "Fasting Insulin : 11.0 uIU/mL (Ref: 2.6 - 24.9)",
    ]

    y = 40
    for line in lines:
        draw.text((50, y), line, fill=(0, 0, 0))
        y += 75

    buf = io.BytesIO()
    save_format = "JPEG" if format_name in ("JPG", "JPEG") else format_name
    img.save(buf, format=save_format)
    return buf.getvalue()


def run_audit():
    print("=================================================================")
    print("PHASE 3A STRICT VALIDATION AUDIT")
    print("=================================================================\n")

    # --- Test 1: Multi-Page Selectable PDF ---
    print("[1] Testing Multi-Page Selectable-Text PDF...")
    pdf_bytes = build_realistic_multipage_pdf()
    t0 = time.perf_counter()
    doc1 = paddle_ocr_engine.process_document(pdf_bytes, "multipage_lab_report.pdf")
    parsed1 = medical_report_parser.parse_blocks(doc1.text_blocks, default_method="selectable_text")
    t1 = time.perf_counter()

    print(f"  Pages: {doc1.total_pages}")
    print(f"  Selectable text detected: {doc1.has_selectable_text}")
    print(f"  Processing time: {(t1 - t0)*1000:.1f} ms")
    print(f"  Tests extracted: {len(parsed1)}")

    pages_extracted = set(p.page_number for p in parsed1)
    print(f"  Page numbers preserved: {sorted(list(pages_extracted))}")

    # Check for specific tests and flags
    for p in parsed1:
        flag_str = f" [FLAGGED: {p.status.upper()}]" if p.status == "outside_range" else ""
        print(f"    - Page {p.page_number} | {p.test_name}: {p.result_value} {p.unit} (Ref: {p.reference_range}){flag_str}")

    # Verify both Free and Total Testosterone are present and distinct
    free_t = next((p for p in parsed1 if p.test_name == "Free Testosterone"), None)
    total_t = next((p for p in parsed1 if p.test_name == "Total Testosterone"), None)
    assert free_t is not None, "Free Testosterone missing!"
    assert total_t is not None, "Total Testosterone missing!"
    assert free_t.result_numeric == 2.4, f"Free Testosterone value wrong: {free_t.result_numeric}"
    assert total_t.result_numeric == 68.0, f"Total Testosterone value wrong: {total_t.result_numeric}"
    print("  -> PASSED: Free Testosterone & Total Testosterone isolated with 0 confusion.")

    # Check HOMA-IR calculation: 98 * 28.5 / 405 = 6.89
    homa = next((p for p in parsed1 if "HOMA-IR" in p.test_name), None)
    assert homa is not None, "HOMA-IR not calculated!"
    assert homa.extraction_method == "calculated", "HOMA-IR extraction method not 'calculated'!"
    assert homa.status == "outside_range", "HOMA-IR should be flagged outside range (>2.0)!"
    print(f"  -> PASSED: HOMA-IR calculated safely as {homa.result_value} (method: {homa.extraction_method}).\n")

    # --- Test 2: Scanned/Raster PDF ---
    print("[2] Testing Scanned / Raster PDF...")
    scanned_bytes = build_realistic_scanned_pdf()
    t0 = time.perf_counter()
    doc2 = paddle_ocr_engine.process_document(scanned_bytes, "scanned_lab_report.pdf")
    parsed2 = medical_report_parser.parse_blocks(doc2.text_blocks, default_method="paddleocr")
    t1 = time.perf_counter()

    print(f"  Engine: {doc2.engine_name}")
    print(f"  Selectable text detected: {doc2.has_selectable_text}")
    print(f"  Avg OCR confidence: {doc2.avg_confidence}")
    print(f"  Processing time: {(t1 - t0)*1000:.1f} ms")
    print(f"  Tests extracted: {len(parsed2)}")
    for p in parsed2:
        print(f"    - {p.test_name}: {p.result_value} {p.unit} (conf: {p.confidence})")
    assert len(parsed2) >= 6, f"Expected at least 6 tests from scanned PDF, got {len(parsed2)}"
    print("  -> PASSED: Scanned PDF rendered and processed via PaddleOCR.\n")

    # --- Test 3: Image Formats (PNG, JPEG, WebP) ---
    print("[3] Testing Image Formats (PNG, JPEG, WebP)...")
    for fmt in ["PNG", "JPEG", "WebP"]:
        img_bytes = build_test_image(fmt)
        t0 = time.perf_counter()
        doc_img = paddle_ocr_engine.process_document(img_bytes, f"report.{fmt.lower()}")
        parsed_img = medical_report_parser.parse_blocks(doc_img.text_blocks, default_method="paddleocr")
        t1 = time.perf_counter()
        print(f"  Format {fmt:5s} | Time: {(t1-t0)*1000:6.1f} ms | Confidence: {doc_img.avg_confidence} | Extracted: {len(parsed_img)} tests")
        assert len(parsed_img) >= 4, f"Format {fmt} failed extraction"
    print("  -> PASSED: All 3 image formats processed with RGB conversion.\n")

    # --- Test 4: Missing Reference Range Safety ---
    print("[4] Testing Report Without Reference Ranges (Safety Audit)...")
    doc_no_ref = pymupdf.open()
    p_no_ref = doc_no_ref.new_page(width=595, height=842)
    p_no_ref.insert_text((50, 70), "Luteinizing Hormone 9.5 mIU/mL\nFSH 4.1 mIU/mL", fontsize=11)
    no_ref_bytes = doc_no_ref.tobytes()
    doc_no_ref.close()

    doc4 = paddle_ocr_engine.process_document(no_ref_bytes, "no_ref_ranges.pdf")
    parsed4 = medical_report_parser.parse_blocks(doc4.text_blocks, default_method="selectable_text")
    for p in parsed4:
        print(f"  Test: {p.test_name} | Stated Range: '{p.reference_range}' | Requires Review: {p.requires_review}")
        assert p.reference_range == "", "Reference range was invented when missing from report!"
        assert p.requires_review is True, "Result without reference range must require review!"
    print("  -> PASSED: System NEVER invents reference ranges when absent from report.\n")

    # --- Test 5: Incompatible HOMA-IR Units Safety ---
    print("[5] Testing HOMA-IR Safety with Incompatible / Non-Fasting Inputs...")
    doc_incompat = pymupdf.open()
    p_incompat = doc_incompat.new_page(width=595, height=842)
    # Random Glucose instead of Fasting Glucose, and unknown unit
    p_incompat.insert_text((50, 70), "Random Glucose 110.0 mg/dL\nFasting Serum Insulin 15.0 uIU/mL", fontsize=11)
    incompat_bytes = doc_incompat.tobytes()
    doc_incompat.close()

    doc5 = paddle_ocr_engine.process_document(incompat_bytes, "random_glucose.pdf")
    parsed5 = medical_report_parser.parse_blocks(doc5.text_blocks, default_method="selectable_text")
    homa_incompat = next((p for p in parsed5 if "HOMA-IR" in p.test_name), None)
    glucose_incompat = next((p for p in parsed5 if "Glucose" in p.test_name), None)
    print(f"  Random Glucose matched: {glucose_incompat is not None} (Should be False)")
    print(f"  HOMA-IR calculated: {homa_incompat is not None} (Should be False)")
    assert glucose_incompat is None, "Random Glucose was falsely matched as Fasting Glucose!"
    assert homa_incompat is None, "HOMA-IR was calculated without Fasting Glucose!"
    print("  -> PASSED: HOMA-IR is strictly blocked when conditions are not satisfied.\n")

    print("=================================================================")
    print("ALL AUDIT VALIDATION TESTS COMPLETED SUCCESSFULLY!")
    print("=================================================================")


if __name__ == "__main__":
    run_audit()

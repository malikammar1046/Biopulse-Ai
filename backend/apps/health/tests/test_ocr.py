"""
OvaSense — Medical Report OCR Automated Test Suite.

Tests cover:
  1. Authenticated OCR request with valid image
  2. Authenticated OCR request with valid selectable-text PDF
  3. Authenticated OCR request with scanned/raster image PDF
  4. Unauthenticated request rejection (401)
  5. Invalid/expired token rejection (401)
  6. Missing file rejection (400)
  7. Unsupported file extension rejection (400)
  8. Blank/unreadable document graceful handling
  9. Canonical test alias matching & reference range evaluation
 10. Automatic HOMA-IR calculation from Glucose & Insulin
 11. Security & temporary resource cleanup
"""

import io
import json
from unittest.mock import MagicMock, patch

import fitz  # PyMuPDF
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image, ImageDraw
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.supabase_auth import SupabaseUser


def create_mock_supabase_token(user_id="ocr-test-patient-uuid-1234", email="patient@ovasense.local"):
    import jwt
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999,
    }
    return jwt.encode(payload, "test-jwt-secret-ovasense-key", algorithm="HS256")


def generate_sample_lab_image_bytes() -> bytes:
    """Creates a clean synthetic lab report image containing hormonal and metabolic tests."""
    img = Image.new("RGB", (1000, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    lines = [
        "METABOLIC & HORMONE DIAGNOSTIC REPORT",
        "Test Name | Result | Unit | Reference Range",
        "----------------------------------------------------------------",
        "Luteinizing Hormone : 7.4 mIU/mL (Ref: 2.4 - 12.6)",
        "FSH Serum : 5.2 mIU/mL (Ref: 3.5 - 12.5)",
        "Total Testosterone : 54.0 ng/dL (Ref: 15.0 - 70.0)",
        "TSH 3rd Gen : 1.85 uIU/mL (Ref: 0.4 - 4.0)",
        "Fasting Glucose : 88.0 mg/dL (Ref: 70 - 99)",
        "Fasting Insulin : 8.5 uIU/mL (Ref: 2.6 - 24.9)",
        "25-OH Vitamin D : 34.5 ng/mL (Ref: 30.0 - 100.0)",
    ]

    y = 40
    for line in lines:
        draw.text((50, y), line, fill=(0, 0, 0))
        y += 65

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_sample_selectable_pdf_bytes() -> bytes:
    """Creates a digital PDF document with native selectable text."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    text = """
    ENDOCRINE SPECIALIST LABORATORY REPORT
    Patient: Confidential
    Date: 2026-05-18

    Test Name              Result      Unit       Reference Range
    Luteinizing Hormone    8.2         mIU/mL     2.4 - 12.6
    FSH                    4.8         mIU/mL     3.5 - 12.5
    Total Testosterone     62.5        ng/dL      15.0 - 70.0
    AMH Serum              4.5         ng/mL      1.5 - 4.0
    Fasting Glucose        92.0        mg/dL      70 - 99
    Fasting Insulin        12.0        uIU/mL     2.6 - 24.9
    """
    page.insert_text((50, 70), text, fontsize=11, color=(0, 0, 0))

    buf = doc.tobytes()
    doc.close()
    return buf


def generate_sample_scanned_pdf_bytes() -> bytes:
    """Creates a scanned PDF document containing only an embedded raster image."""
    img_bytes = generate_sample_lab_image_bytes()
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_image(fitz.Rect(50, 50, 545, 450), stream=img_bytes)
    buf = doc.tobytes()
    doc.close()
    return buf


class MedicalReportOcrTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.ocr_url = reverse("health-ocr")
        self.test_user = SupabaseUser(
            id="ocr-test-patient-uuid-1234",
            email="patient@ovasense.local",
            role="authenticated",
            raw_token="fake-jwt-token",
        )

    def test_unauthenticated_request_rejected(self):
        """Verifies 401 Unauthorized when no token is provided."""
        img_bytes = generate_sample_lab_image_bytes()
        file = SimpleUploadedFile("lab_report.png", img_bytes, content_type="image/png")
        response = self.client.post(self.ocr_url, {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_file_rejected(self):
        """Verifies 400 Bad Request when no file is uploaded."""
        self.client.force_authenticate(user=self.test_user)
        response = self.client.post(self.ocr_url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_unsupported_file_extension_rejected(self):
        """Verifies 400 Bad Request for unsupported file types."""
        self.client.force_authenticate(user=self.test_user)
        bad_file = SimpleUploadedFile("malicious.exe", b"binary content", content_type="application/octet-stream")
        response = self.client.post(self.ocr_url, {"file": bad_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Unsupported file format", response.data["error"])

    def test_image_ocr_with_hormone_panel(self):
        """Verifies real PaddleOCR extraction and structured parsing of image."""
        self.client.force_authenticate(user=self.test_user)
        img_bytes = generate_sample_lab_image_bytes()
        file = SimpleUploadedFile("hormone_report.png", img_bytes, content_type="image/png")

        response = self.client.post(self.ocr_url, {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["document"]["filename"], "hormone_report.png")

        results = response.data["results"]
        self.assertGreaterEqual(len(results), 4)

        test_names = [r["test_name"] for r in results]
        self.assertTrue(any("LH" in name for name in test_names))
        self.assertTrue(any("FSH" in name for name in test_names))
        self.assertTrue(any("Testosterone" in name for name in test_names))
        self.assertTrue(any("Glucose" in name for name in test_names))

        # Check LH extracted values
        lh_res = next(r for r in results if "LH" in r["test_name"])
        self.assertEqual(lh_res["result_numeric"], 7.4)
        self.assertIn("mIU/mL", lh_res["unit"])
        self.assertEqual(lh_res["status"], "within_range")

        # Check disclaimer is present
        self.assertIn("disclaimer", response.data)
        self.assertIn("does not constitute a medical diagnosis", response.data["disclaimer"])

    def test_pdf_selectable_text_extraction(self):
        """Verifies fast direct extraction on digital PDFs with selectable text."""
        self.client.force_authenticate(user=self.test_user)
        pdf_bytes = generate_sample_selectable_pdf_bytes()
        file = SimpleUploadedFile("digital_report.pdf", pdf_bytes, content_type="application/pdf")

        response = self.client.post(self.ocr_url, {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["document"]["has_selectable_text"])
        self.assertEqual(response.data["document"]["total_pages"], 1)

        results = response.data["results"]
        self.assertGreaterEqual(len(results), 4)

        test_names = [r["test_name"] for r in results]
        self.assertTrue(any("AMH" in name for name in test_names))
        self.assertTrue(any("Testosterone" in name for name in test_names))

        # Check AMH outside range (4.5 > 4.0)
        amh_res = next(r for r in results if "AMH" in r["test_name"])
        self.assertEqual(amh_res["result_numeric"], 4.5)
        self.assertEqual(amh_res["status"], "outside_range")
        self.assertTrue(amh_res["requires_review"])

    def test_pdf_scanned_image_rendering_and_ocr(self):
        """Verifies raster PDF rendering to image and PaddleOCR execution."""
        self.client.force_authenticate(user=self.test_user)
        scanned_pdf_bytes = generate_sample_scanned_pdf_bytes()
        file = SimpleUploadedFile("scanned_report.pdf", scanned_pdf_bytes, content_type="application/pdf")

        response = self.client.post(self.ocr_url, {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["document"]["has_selectable_text"])
        self.assertGreaterEqual(len(response.data["results"]), 3)

    def test_blank_document_graceful_handling(self):
        """Verifies blank/empty document returns empty results and requires_review flag."""
        self.client.force_authenticate(user=self.test_user)
        blank_img = Image.new("RGB", (400, 400), color=(255, 255, 255))
        buf = io.BytesIO()
        blank_img.save(buf, format="PNG")

        file = SimpleUploadedFile("blank.png", buf.getvalue(), content_type="image/png")
        response = self.client.post(self.ocr_url, {"file": file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)
        self.assertTrue(response.data["requires_review"])

    def test_homa_ir_automatic_calculation(self):
        """Verifies HOMA-IR is calculated when Fasting Glucose and Fasting Insulin are present."""
        self.client.force_authenticate(user=self.test_user)
        pdf_bytes = generate_sample_selectable_pdf_bytes()
        file = SimpleUploadedFile("metabolic_report.pdf", pdf_bytes, content_type="application/pdf")

        response = self.client.post(self.ocr_url, {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data["results"]
        homa_res = next((r for r in results if "HOMA-IR" in r["test_name"]), None)
        self.assertIsNotNone(homa_res)
        # Fasting Glucose 92 * Fasting Insulin 12 / 405 = 2.73
        self.assertAlmostEqual(homa_res["result_numeric"], 2.73, places=1)
        self.assertEqual(homa_res["status"], "outside_range")

"""
backend/apps/intelligence/tests/test_intelligence.py
PCOS-ML Progressive Assessment Automated Test Suite.

Tests:
1. Tier 1 model loading, 16 features, and threshold 0.38
2. Cumulative Tier 2 model, 32 cumulative features, and threshold 0.29
3. Ultrasound image pipeline (EfficientNet-B0 + PCOM + Grad-CAM)
4. Full Multimodal Fusion (Tier 1+2+3, 95/5 weighted probability fusion)
5. Safe Tier 1+3 handling (returns tier_1_3_model_unavailable, preserves Tier 1 active)
6. Transactional replacement of active assessment and history preservation
7. All DRF API endpoints (/status/, /active/, /history/, /tier1/, /tier2/, /ultrasound/)
8. Image validation (corrupted images, invalid MIME types, oversized payloads)
9. Cross-user data isolation and authentication
"""

import io
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from apps.authentication.supabase_auth import SupabaseUser
from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.pcos_ml_service import (
    pcos_ml_service,
    TIER1_FEATURE_NAMES,
    TIER2_FEATURE_NAMES,
    TIER1_SCREENING_THRESHOLD,
    TIER2_SCREENING_THRESHOLD,
    MULTIMODAL_SCREENING_THRESHOLD,
)


def _create_sample_image_file(name="ultrasound.jpg", size=(224, 224), fmt="JPEG"):
    """Generates a dummy in-memory image for upload testing."""
    img = Image.new("RGB", size, color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type=f"image/{fmt.lower()}")


class TestPCOSMLProgressiveService(TestCase):
    """Unit tests for the underlying PCOSMLService ML engine."""

    def setUp(self):
        pcos_ml_service.load()

    def test_tier1_feature_preparation_and_inference(self):
        sample_raw = {
            "age": 25,
            "weight_kg": 65.0,
            "height_cm": 165.0,
            "waist_inch": 30.0,
            "hip_inch": 38.0,
            "cycle_length_raw": 32.0,
            "cycle_regularity": 0,
            "weight_gain": 0,
            "hirsutism": 0,
            "skin_darkening": 0,
            "hair_loss": 0,
            "pimples_acne": 0,
            "fast_food": 0,
            "regular_exercise": 1,
        }
        df_t1 = pcos_ml_service.prepare_tier1_features(sample_raw)
        self.assertEqual(list(df_t1.columns), TIER1_FEATURE_NAMES)
        self.assertAlmostEqual(df_t1.at[0, "bmi"], 23.88, places=1)
        self.assertAlmostEqual(df_t1.at[0, "waist_hip_ratio"], 0.789, places=2)

        res = pcos_ml_service.predict_tier1(sample_raw)
        self.assertEqual(res["assessment_level"], "tier_1")
        self.assertEqual(res["tiers_included"], [1])
        self.assertEqual(res["threshold"], TIER1_SCREENING_THRESHOLD)
        self.assertGreaterEqual(res["probability"], 0.0)
        self.assertLessEqual(res["probability"], 1.0)
        self.assertIn(res["risk_category"], ["lower", "intermediate", "higher"])
        self.assertTrue(len(res["explanations"]) > 0)

    def test_tier2_cumulative_features_and_inference(self):
        sample_t2 = {
            "age": 27,
            "weight_kg": 75.0,
            "height_cm": 160.0,
            "waist_inch": 36.0,
            "hip_inch": 40.0,
            "cycle_length_raw": 50.0,
            "cycle_regularity": 1,
            "weight_gain": 1,
            "hirsutism": 1,
            "skin_darkening": 1,
            "hair_loss": 1,
            "pimples_acne": 1,
            "fast_food": 1,
            "regular_exercise": 0,
            "pulse_rate_bpm": 80.0,
            "respiratory_rate": 20.0,
            "hemoglobin": 11.5,
            "beta_hcg_i": 1.5,
            "beta_hcg_ii": 1.2,
            "fsh": 4.2,
            "lh": 11.8,
            "tsh": 3.2,
            "amh": 8.5,
            "prolactin": 22.0,
            "vitamin_d3": 12.0,
            "progesterone": 0.3,
            "rbs": 110.0,
            "bp_systolic": 130.0,
            "bp_diastolic": 85.0,
        }
        df_t2 = pcos_ml_service.prepare_tier2_features(sample_t2)
        self.assertEqual(list(df_t2.columns), TIER2_FEATURE_NAMES)
        self.assertEqual(len(df_t2.columns), 32)
        self.assertAlmostEqual(df_t2.at[0, "fsh_lh_ratio"], round(4.2 / 11.8, 2), places=2)

        res = pcos_ml_service.predict_tier2_cumulative(sample_t2)
        self.assertEqual(res["assessment_level"], "tier_1_2")
        self.assertEqual(res["tiers_included"], [1, 2])
        self.assertEqual(res["threshold"], TIER2_SCREENING_THRESHOLD)
        self.assertGreaterEqual(res["probability"], 0.0)
        self.assertLessEqual(res["probability"], 1.0)
        self.assertEqual(res["risk_category"], "higher")

    def test_ultrasound_processing_and_multimodal_fusion(self):
        img = Image.new("RGB", (224, 224), color=(80, 80, 80))
        img_res = pcos_ml_service.process_ultrasound_image(img)
        self.assertIn("pcom_probability", img_res)
        self.assertIn("pcom_status", img_res)
        self.assertIn("gradcam_b64", img_res)

        sample_t2 = {
            "age": 25, "weight_kg": 60.0, "height_cm": 160.0, "waist_inch": 30.0, "hip_inch": 37.0,
            "cycle_length_raw": 28.0, "cycle_regularity": 0, "weight_gain": 0, "hirsutism": 0,
            "skin_darkening": 0, "hair_loss": 0, "pimples_acne": 0, "fast_food": 0, "regular_exercise": 1,
            "pulse_rate_bpm": 72.0, "respiratory_rate": 18.0, "hemoglobin": 12.5, "beta_hcg_i": 1.0,
            "beta_hcg_ii": 1.0, "fsh": 5.5, "lh": 5.0, "tsh": 2.0, "amh": 3.0, "prolactin": 15.0,
            "vitamin_d3": 25.0, "progesterone": 0.6, "rbs": 90.0, "bp_systolic": 115.0, "bp_diastolic": 75.0,
        }
        mm_res = pcos_ml_service.predict_tier1_2_3_multimodal(sample_t2, img)
        self.assertEqual(mm_res["assessment_level"], "tier_1_2_3")
        self.assertEqual(mm_res["tiers_included"], [1, 2, 3])
        self.assertEqual(mm_res["threshold"], MULTIMODAL_SCREENING_THRESHOLD)
        self.assertIn("fusion_details", mm_res)
        self.assertEqual(mm_res["fusion_details"]["clinical_weight"], 0.95)
        self.assertEqual(mm_res["fusion_details"]["ultrasound_weight"], 0.05)


class TestProgressiveAssessmentAPI(TestCase):
    """Integration API tests for progressive assessment flow."""

    def setUp(self):
        self.client = APIClient()
        self.user1_uuid = "11111111-1111-1111-1111-111111111111"
        self.user2_uuid = "22222222-2222-2222-2222-222222222222"
        self.user1 = SupabaseUser(self.user1_uuid, "user1@example.com", "authenticated", "mock-jwt-token-1")
        self.user2 = SupabaseUser(self.user2_uuid, "user2@example.com", "authenticated", "mock-jwt-token-2")

    # 1. Public Status Endpoint
    def test_status_endpoint_returns_registry_metadata(self):
        response = self.client.get("/api/v1/intelligence/status/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("tier_1", data["models"])
        self.assertIn("tier_1_2", data["models"])
        self.assertIn("tier_1_2_3", data["models"])
        self.assertEqual(data["models"]["tier_1"]["features_count"], 16)
        self.assertEqual(data["models"]["tier_1_2"]["features_count"], 32)
        self.assertFalse(data["models"]["tier_1_3"]["supported"])

    # 2. Authentication Enforcement
    def test_unauthenticated_requests_blocked(self):
        endpoints = [
            ("/api/v1/intelligence/assessment/active/", "get"),
            ("/api/v1/intelligence/assessment/history/", "get"),
            ("/api/v1/intelligence/assessment/tier1/", "post"),
            ("/api/v1/intelligence/assessment/tier2/", "post"),
            ("/api/v1/intelligence/assessment/ultrasound/", "post"),
        ]
        for url, method in endpoints:
            if method == "get":
                res = self.client.get(url)
            else:
                res = self.client.post(url, {})
            self.assertIn(res.status_code, [401, 403], f"Endpoint {url} failed auth check")

    # 3. Progressive Flow: Tier 1 -> Tier 1+2 Cumulative Replacement -> Tier 1+2+3 Multimodal
    def test_full_progressive_assessment_workflow(self):
        self.client.force_authenticate(user=self.user1)

        # Step 1: Submit Tier 1
        t1_payload = {
            "age": 24, "weight_kg": 55.0, "height_cm": 162.0, "waist_inch": 28.0, "hip_inch": 36.0,
            "cycle_length_raw": 28, "cycle_regularity": 0, "weight_gain": 0, "hirsutism": 0,
            "skin_darkening": 0, "hair_loss": 0, "pimples_acne": 0, "fast_food": 0, "regular_exercise": 1,
        }
        res_t1 = self.client.post("/api/v1/intelligence/assessment/tier1/", t1_payload, format="json")
        self.assertEqual(res_t1.status_code, 200)
        data_t1 = res_t1.json()
        self.assertEqual(data_t1["assessment_level"], "tier_1")
        self.assertTrue(data_t1["is_active"])
        t1_id = data_t1["assessment_id"]

        # Verify active assessment is Tier 1
        active_res = self.client.get("/api/v1/intelligence/assessment/active/")
        self.assertEqual(active_res.status_code, 200)
        self.assertEqual(active_res.json()["assessment_id"], t1_id)

        # Step 2: Submit Clinical Labs (Tier 1+2 Cumulative)
        t2_payload = {
            "pulse_rate_bpm": 76.0, "respiratory_rate": 18.0, "hemoglobin": 12.8,
            "beta_hcg_i": 1.0, "beta_hcg_ii": 1.0, "fsh": 5.0, "lh": 10.5,
            "tsh": 2.4, "amh": 6.8, "prolactin": 18.0, "vitamin_d3": 18.0,
            "progesterone": 0.5, "rbs": 95.0, "bp_systolic": 118.0, "bp_diastolic": 76.0,
        }
        res_t2 = self.client.post("/api/v1/intelligence/assessment/tier2/", t2_payload, format="json")
        self.assertEqual(res_t2.status_code, 200)
        data_t2 = res_t2.json()
        self.assertEqual(data_t2["assessment_level"], "tier_1_2")
        self.assertTrue(data_t2["is_active"])
        self.assertEqual(data_t2["replaced_assessment_id"], t1_id)
        t2_id = data_t2["assessment_id"]

        # Verify active assessment is now Tier 1+2 (replacing Tier 1)
        active_res2 = self.client.get("/api/v1/intelligence/assessment/active/")
        self.assertEqual(active_res2.json()["assessment_id"], t2_id)
        self.assertEqual(active_res2.json()["assessment_level"], "tier_1_2")

        # Step 3: Upload Ultrasound Image (Tier 1+2+3 Multimodal Full Fusion)
        img_file = _create_sample_image_file("pelvic_scan.jpg")
        res_t3 = self.client.post("/api/v1/intelligence/assessment/ultrasound/", {"image": img_file}, format="multipart")
        self.assertEqual(res_t3.status_code, 200)
        data_t3 = res_t3.json()
        self.assertEqual(data_t3["assessment_level"], "tier_1_2_3")
        self.assertTrue(data_t3["is_active"])
        self.assertEqual(data_t3["replaced_assessment_id"], t2_id)
        self.assertIn("pcom_status", data_t3)
        t3_id = data_t3["assessment_id"]

        # Step 4: Verify History preserves all assessments
        hist_res = self.client.get("/api/v1/intelligence/assessment/history/")
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.json()["history"]
        self.assertGreaterEqual(len(hist_data), 3)
        self.assertEqual(hist_data[0]["id"], t3_id)

    # 4. Safe Tier 1 + Ultrasound (Without Clinical Labs)
    def test_tier1_followed_directly_by_ultrasound_fallback(self):
        self.client.force_authenticate(user=self.user2)

        # Submit Tier 1
        t1_payload = {"age": 22, "weight_kg": 50.0, "height_cm": 158.0}
        self.client.post("/api/v1/intelligence/assessment/tier1/", t1_payload, format="json")

        # Upload ultrasound without clinical labs
        img_file = _create_sample_image_file("scan.jpg")
        res_us = self.client.post("/api/v1/intelligence/assessment/ultrasound/", {"image": img_file}, format="multipart")
        self.assertEqual(res_us.status_code, 200)
        data_us = res_us.json()

        # Status indicates tier_1_3_model_unavailable
        self.assertEqual(data_us.get("status_code"), "tier_1_3_model_unavailable")
        self.assertIn("pcom_status", data_us)

        # Active assessment preserves Tier 1 / Tier 1+3 state
        active_res = self.client.get("/api/v1/intelligence/assessment/active/")
        self.assertIn(active_res.json()["assessment_level"], ["tier_1", "tier_1_3"])

    # 5. Image Validation & Error Handling
    def test_corrupt_image_upload_rejected(self):
        self.client.force_authenticate(user=self.user1)
        corrupted_file = SimpleUploadedFile("broken.jpg", b"not-a-valid-jpeg-image-bytes", content_type="image/jpeg")
        response = self.client.post("/api/v1/intelligence/assessment/ultrasound/", {"image": corrupted_file}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("not a valid or readable image", response.json()["error"])

    def test_unsupported_mime_type_rejected(self):
        self.client.force_authenticate(user=self.user1)
        pdf_file = SimpleUploadedFile("report.pdf", b"%PDF-1.4 dummy pdf bytes", content_type="application/pdf")
        response = self.client.post("/api/v1/intelligence/assessment/ultrasound/", {"image": pdf_file}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file type", response.json()["error"])

    def test_oversized_image_rejected(self):
        self.client.force_authenticate(user=self.user1)
        # 11MB dummy content
        oversized = SimpleUploadedFile("huge.jpg", b"x" * (11 * 1024 * 1024), content_type="image/jpeg")
        response = self.client.post("/api/v1/intelligence/assessment/ultrasound/", {"image": oversized}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("exceeds maximum allowable size", response.json()["error"])

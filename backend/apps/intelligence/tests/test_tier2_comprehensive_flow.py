"""
Comprehensive test suite verifying Tier 2 cumulative assessment lifecycle,
persistence, deduplication, editing, removing, and downgrade to Tier 1.
"""
import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.intelligence_orchestrator import (
    run_tier1_assessment,
    run_tier2_assessment,
    clear_tier2_assessment,
)

User = get_user_model()


class TestTier2CumulativeLifecycle(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient_id = str(uuid.uuid4())
        self.user = User.objects.create_user(
            username=f"test_{self.patient_id[:8]}",
            email=f"{self.patient_id[:8]}@example.com",
        )
        self.client.force_authenticate(user=self.user)

        self.t1_inputs = {
            "age": 26.0,
            "weight_kg": 62.0,
            "height_cm": 165.0,
            "waist_inch": 29.0,
            "hip_inch": 38.0,
            "cycle_length_raw": 32.0,
            "cycle_regularity": 1,
            "hirsutism": 1,
            "pimples_acne": 1,
            "hair_loss": 0,
            "skin_darkening": 0,
            "weight_gain": 1,
            "fast_food": 1,
            "regular_exercise": 0,
        }

    def test_tier1_to_tier2_promotion_and_readback(self):
        # 1. Establish Tier 1 active assessment
        res_t1 = run_tier1_assessment(self.patient_id, client_health_data=self.t1_inputs)
        self.assertEqual(res_t1["assessment_level"], "tier_1")
        self.assertTrue(res_t1["is_active"])
        t1_id = res_t1["assessment_id"]

        # Readback active
        active_t1 = assessment_repository.get_active_assessment(self.patient_id, module="female_pcos")
        self.assertEqual(active_t1["id"], t1_id)
        self.assertEqual(active_t1["assessment_level"], "tier_1")

        # 2. Promote to Tier 2 with partial labs
        t2_labs = {"fsh": 6.5, "lh": 7.2, "amh": 4.5}
        res_t2 = run_tier2_assessment(self.patient_id, clinical_inputs=t2_labs)
        self.assertEqual(res_t2["assessment_level"], "tier_1_2")
        self.assertTrue(res_t2["is_active"])
        t2_id = res_t2["assessment_id"]
        self.assertNotEqual(t2_id, t1_id)

        # 3. Verify cumulative preservation
        self.assertIn("tier_1_inputs", res_t2)
        self.assertEqual(float(res_t2["tier_1_inputs"]["weight_kg"]), 62.0)
        self.assertEqual(res_t2["tier_2_inputs"]["fsh"], 6.5)
        self.assertEqual(res_t2["tier_2_inputs"]["lh"], 7.2)
        self.assertEqual(res_t2["tier_2_inputs"]["amh"], 4.5)

        # 4. Immediate readback
        active_t2 = assessment_repository.get_active_assessment(self.patient_id, module="female_pcos")
        self.assertEqual(active_t2["id"], t2_id)
        self.assertEqual(active_t2["assessment_level"], "tier_1_2")

        # 5. History should have both: T1 (inactive) and T2 (active)
        history = assessment_repository.get_assessment_history(self.patient_id, module="female_pcos")
        self.assertGreaterEqual(len(history), 2)
        active_count = sum(1 for h in history if h.get("is_active"))
        self.assertEqual(active_count, 1)

    def test_edit_tier2_lab_reevaluates(self):
        # Initial Tier 2
        run_tier1_assessment(self.patient_id, client_health_data=self.t1_inputs)
        t2_v1 = run_tier2_assessment(self.patient_id, clinical_inputs={"fsh": 6.5, "lh": 7.2})
        t2_v1_id = t2_v1["assessment_id"]

        # Edit LH from 7.2 to 14.5
        t2_v2 = run_tier2_assessment(self.patient_id, clinical_inputs={"lh": 14.5})
        self.assertNotEqual(t2_v2["assessment_id"], t2_v1_id)
        self.assertEqual(t2_v2["assessment_level"], "tier_1_2")
        self.assertEqual(t2_v2["tier_2_inputs"]["fsh"], 6.5)  # preserved from previous
        self.assertEqual(t2_v2["tier_2_inputs"]["lh"], 14.5)  # updated

    def test_deduplication_same_inputs(self):
        run_tier1_assessment(self.patient_id, client_health_data=self.t1_inputs)
        t2_first = run_tier2_assessment(self.patient_id, clinical_inputs={"fsh": 6.5, "lh": 7.2})
        first_id = t2_first["assessment_id"]

        # Save exact same inputs again
        t2_second = run_tier2_assessment(self.patient_id, clinical_inputs={"fsh": 6.5, "lh": 7.2})
        self.assertEqual(t2_second["assessment_id"], first_id)

    def test_remove_lab_and_clear_downgrade(self):
        run_tier1_assessment(self.patient_id, client_health_data=self.t1_inputs)
        t2_init = run_tier2_assessment(self.patient_id, clinical_inputs={"fsh": 6.5, "lh": 7.2, "amh": 4.5})
        self.assertEqual(len(t2_init["tier_2_inputs"]), 3)

        # Remove AMH
        t2_removed = run_tier2_assessment(self.patient_id, clinical_inputs={"remove_fields": ["amh"]})
        self.assertEqual(t2_removed["assessment_level"], "tier_1_2")
        self.assertNotIn("amh", t2_removed["tier_2_inputs"])
        self.assertEqual(t2_removed["tier_2_inputs"]["fsh"], 6.5)
        self.assertEqual(t2_removed["tier_2_inputs"]["lh"], 7.2)

        # Clear all Tier 2 -> Downgrades to Tier 1
        t1_downgraded = clear_tier2_assessment(self.patient_id, module="female_pcos")
        self.assertEqual(t1_downgraded["assessment_level"], "tier_1")
        self.assertEqual(len(t1_downgraded["tier_2_inputs"]), 0)
        self.assertEqual(float(t1_downgraded["tier_1_inputs"]["weight_kg"]), 62.0)

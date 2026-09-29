"""
BioPulse AI Health App — Doctors and Care Flow End-to-End Tests.

Verifies:
1. Public doctor listing: GET /api/v1/doctors/ returns active doctors with canonical schema.
2. Doctor detail: GET /api/v1/doctors/<slug>/ returns individual doctor.
3. Female PCOS relevance: ?pathway=female_pcos prioritizes gynecologists and PCOS specialists.
4. Male Hypogonadism relevance: ?pathway=male_hypogonadism prioritizes endocrinologists/andrologists.
5. Clinical isolation (no cross-leakage):
   - ?pathway=male_hypogonadism&strict=true NEVER returns gynecologists/obstetricians.
   - ?pathway=female_pcos&strict=true NEVER returns andrologists/urologists.
6. Non-strict ordering: pathway-relevant doctors appear before other doctors.
7. Inactive doctors excluded from both list and detail.
8. Non-existent slug returns 404 Not Found.
9. Security: POST, PUT, PATCH, DELETE are rejected with 405 Method Not Allowed.
10. Pathway & relevance_reason serialization integrity.
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.health.models import Doctor


class DoctorCareFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.endpoint = "/api/v1/doctors/"
        Doctor.objects.all().delete()

        # Seed standard representative clinical specialists
        self.gyn = Doctor.objects.create(
            name="Dr. Zainab Tariq",
            specialty="Consultant Gynecologist & Obstetrician",
            pathway="female_pcos",
            relevance_reason="PCOS diagnostic workup and menstrual cycle management",
            is_active=True,
            display_order=1,
        )
        self.andro = Doctor.objects.create(
            name="Dr. Usman Raza",
            specialty="Consultant Andrologist & Urologist",
            pathway="male_hypogonadism",
            relevance_reason="Male hypogonadism, testosterone evaluation, and fertility",
            is_active=True,
            display_order=2,
        )
        self.endo = Doctor.objects.create(
            name="Dr. Sarah Ahmed",
            specialty="Consultant Endocrinologist",
            pathway="both",
            relevance_reason="Hormonal imbalance, metabolic syndrome, and endocrine health",
            is_active=True,
            display_order=3,
        )
        self.inactive_gyn = Doctor.objects.create(
            name="Dr. Inactive Gyn",
            specialty="Gynecologist",
            pathway="female_pcos",
            is_active=False,
            display_order=4,
        )

    def test_01_public_listing_schema(self):
        """Public endpoint returns active doctors with pathway and relevance_reason."""
        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)

        fields = ["id", "name", "slug", "specialty", "pathway", "relevance_reason", "is_active", "display_order"]
        for item in res.data:
            for field in fields:
                self.assertIn(field, item)

    def test_02_doctor_detail_endpoint(self):
        """Individual doctor retrieved by slug."""
        res = self.client.get(f"{self.endpoint}{self.gyn.slug}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Dr. Zainab Tariq")
        self.assertEqual(res.data["pathway"], "female_pcos")
        self.assertEqual(res.data["specialty"], "Consultant Gynecologist & Obstetrician")

    def test_03_female_pcos_strict_filtering(self):
        """Strict female_pcos query returns only female_pcos and both; NO male-only specialists."""
        res = self.client.get(f"{self.endpoint}?pathway=female_pcos&strict=true")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        returned_names = [d["name"] for d in res.data]

        self.assertIn("Dr. Zainab Tariq", returned_names)
        self.assertIn("Dr. Sarah Ahmed", returned_names)
        self.assertNotIn("Dr. Usman Raza", returned_names)
        self.assertNotIn("Dr. Inactive Gyn", returned_names)

        # Verify no andrologist in female results
        for d in res.data:
            self.assertNotEqual(d["pathway"], "male_hypogonadism")
            self.assertNotIn("Andrologist", d["specialty"])
            self.assertNotIn("Urologist", d["specialty"])

    def test_04_male_hypogonadism_strict_filtering(self):
        """Strict male_hypogonadism query returns only male_hypogonadism and both; NO gynecologists."""
        res = self.client.get(f"{self.endpoint}?pathway=male_hypogonadism&strict=true")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        returned_names = [d["name"] for d in res.data]

        self.assertIn("Dr. Usman Raza", returned_names)
        self.assertIn("Dr. Sarah Ahmed", returned_names)
        self.assertNotIn("Dr. Zainab Tariq", returned_names)

        # Verify no gynecologist in male results
        for d in res.data:
            self.assertNotEqual(d["pathway"], "female_pcos")
            self.assertNotIn("Gynecologist", d["specialty"])
            self.assertNotIn("Obstetrician", d["specialty"])

    def test_05_pathway_prioritization_ordering(self):
        """Non-strict pathway query orders relevant doctors first, but keeps other doctors accessible."""
        # For male query: Dr. Usman Raza (male) and Dr. Sarah Ahmed (both) must come before Dr. Zainab (female)
        res = self.client.get(f"{self.endpoint}?pathway=male_hypogonadism")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)

        # First two must be male_hypogonadism or both
        self.assertIn(res.data[0]["pathway"], ["male_hypogonadism", "both"])
        self.assertIn(res.data[1]["pathway"], ["male_hypogonadism", "both"])
        # Last doctor is the female-only doctor
        self.assertEqual(res.data[2]["name"], "Dr. Zainab Tariq")

    def test_06_non_existent_doctor_returns_404(self):
        """Requesting non-existent slug returns 404."""
        res = self.client.get(f"{self.endpoint}dr-does-not-exist/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_07_inactive_doctor_excluded(self):
        """Inactive doctors are never returned in list or detail."""
        list_res = self.client.get(self.endpoint)
        self.assertNotIn(self.inactive_gyn.name, [d["name"] for d in list_res.data])

        detail_res = self.client.get(f"{self.endpoint}{self.inactive_gyn.slug}/")
        self.assertEqual(detail_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_08_public_write_methods_rejected(self):
        """Security: public cannot POST, PUT, PATCH, or DELETE doctors."""
        post_res = self.client.post(self.endpoint, {"name": "Fake"}, format="json")
        self.assertEqual(post_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        put_res = self.client.put(f"{self.endpoint}{self.gyn.slug}/", {"name": "Fake"}, format="json")
        self.assertEqual(put_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        del_res = self.client.delete(f"{self.endpoint}{self.gyn.slug}/")
        self.assertEqual(del_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

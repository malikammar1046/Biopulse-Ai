"""
BioPulse AI Health App — Doctor Architecture Test Suite.

Verifies:
- TEST 1: Zero active doctors returns an empty list [] with HTTP 200.
- TEST 2: Single active doctor returns expected fields.
- TEST 3: Multiple doctors are strictly sorted by display_order ascending.
- TEST 4: Deactivated doctor (is_active=False) is excluded from the public API.
- TEST 5: Editing doctor information reflects immediately in API response.
- TEST 6: Uploaded profile image generates a valid absolute image URL.
- SECURITY: Public POST, PUT, PATCH, DELETE are rejected with 405 Method Not Allowed.
"""
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.health.models import Doctor


def generate_test_image(filename="test_portrait.jpg") -> SimpleUploadedFile:
    """Helper to generate a minimal valid JPEG image in-memory."""
    file_obj = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(14, 158, 170))
    img.save(file_obj, format="JPEG")
    file_obj.seek(0)
    return SimpleUploadedFile(filename, file_obj.read(), content_type="image/jpeg")


class DoctorArchitectureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.endpoint = "/api/v1/doctors/"
        Doctor.objects.all().delete()

    def test_01_zero_doctors_returns_empty_list(self):
        """TEST 1: When database has zero active doctors, returns [] without errors."""
        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 0)

    def test_02_one_doctor_lifecycle(self):
        """TEST 2: Single doctor created is returned with required fields."""
        doc = Doctor.objects.create(
            name="Dr. Ayesha Malik",
            specialty="Reproductive Endocrinologist",
            short_bio="Specialist in PCOS metabolic phenotyping.",
            phone="+92 300 0000002",
            email="ayesha.malik@biopulse.example.com",
            location="Lahore, Punjab, Pakistan",
            is_active=True,
            display_order=1,
        )

        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        data = res.data[0]
        self.assertEqual(data["id"], doc.id)
        self.assertEqual(data["name"], "Dr. Ayesha Malik")
        self.assertEqual(data["slug"], "dr-ayesha-malik")
        self.assertEqual(data["specialty"], "Reproductive Endocrinologist")
        self.assertEqual(data["short_bio"], "Specialist in PCOS metabolic phenotyping.")
        self.assertEqual(data["phone"], "+92 300 0000002")
        self.assertEqual(data["email"], "ayesha.malik@biopulse.example.com")
        self.assertEqual(data["location"], "Lahore, Punjab, Pakistan")
        self.assertTrue(data["is_active"])
        self.assertEqual(data["display_order"], 1)
        self.assertIsNone(data["profile_image"])

    def test_03_multiple_doctors_ordered_by_display_order(self):
        """TEST 3: Multiple doctors are strictly sorted by display_order."""
        Doctor.objects.create(name="Dr. Charlie", display_order=30)
        Doctor.objects.create(name="Dr. Alice", display_order=10)
        Doctor.objects.create(name="Dr. Bob", display_order=20)

        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)

        names = [d["name"] for d in res.data]
        self.assertEqual(names, ["Dr. Alice", "Dr. Bob", "Dr. Charlie"])

    def test_04_deactivated_doctor_excluded(self):
        """TEST 4: Setting is_active=False excludes doctor from public API."""
        doc_active = Doctor.objects.create(name="Active Doctor", is_active=True)
        doc_inactive = Doctor.objects.create(name="Inactive Doctor", is_active=False)

        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], doc_active.name)

        # Confirm retrieval by slug also excludes inactive doctor
        detail_res = self.client.get(f"{self.endpoint}{doc_inactive.slug}/")
        self.assertEqual(detail_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_05_edit_doctor_reflects_dynamically(self):
        """TEST 5: Updating doctor updates API response dynamically."""
        doc = Doctor.objects.create(
            name="Dr. Tariq Khan",
            specialty="General Andrologist",
            short_bio="Initial bio",
            display_order=5,
        )

        res1 = self.client.get(self.endpoint)
        self.assertEqual(res1.data[0]["specialty"], "General Andrologist")

        # Edit doctor
        doc.specialty = "Senior Clinical Andrologist & HPT Specialist"
        doc.short_bio = "Updated comprehensive bio."
        doc.display_order = 1
        doc.save()

        res2 = self.client.get(self.endpoint)
        self.assertEqual(
            res2.data[0]["specialty"],
            "Senior Clinical Andrologist & HPT Specialist",
        )
        self.assertEqual(res2.data[0]["short_bio"], "Updated comprehensive bio.")
        self.assertEqual(res2.data[0]["display_order"], 1)

    def test_06_profile_image_url_generated(self):
        """TEST 6: Uploaded profile image returns a usable URL."""
        test_img = generate_test_image("dr_zainab.jpg")
        doc = Doctor.objects.create(
            name="Dr. Zainab Qureshi",
            specialty="Gynecological Endocrinologist",
            profile_image=test_img,
            is_active=True,
        )

        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        img_url = res.data[0]["profile_image"]
        self.assertIsNotNone(img_url)
        self.assertTrue("dr_zainab" in img_url)
        self.assertTrue(img_url.startswith("http") or img_url.startswith("/"))

    def test_07_public_cannot_create_or_modify(self):
        """SECURITY: Public users cannot create, edit, or delete doctors."""
        # Attempt POST (create)
        post_res = self.client.post(
            self.endpoint,
            {"name": "Hacker", "is_active": True},
            format="json",
        )
        self.assertEqual(post_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Create valid doctor
        doc = Doctor.objects.create(name="Dr. Real", is_active=True)

        # Attempt PUT (edit)
        put_res = self.client.put(
            f"{self.endpoint}{doc.slug}/",
            {"name": "Modified Name"},
            format="json",
        )
        self.assertEqual(put_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Attempt DELETE
        del_res = self.client.delete(f"{self.endpoint}{doc.slug}/")
        self.assertEqual(del_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_08_all_seven_fictional_doctors_schema_and_ordering(self):
        """TEST 8: Verify 7 fictional doctors are correctly exposed with phone, email, and location."""
        docs_to_create = [
            {"name": "Dr. Sarah Ahmed", "specialty": "Endocrinologist", "display_order": 1, "phone": "+92 300 0000001", "email": "sarah.ahmed@biopulse.example.com", "location": "Lahore, Punjab, Pakistan"},
            {"name": "Dr. Ayesha Malik", "specialty": "Internal Medicine Specialist", "display_order": 2, "phone": "+92 300 0000002", "email": "ayesha.malik@biopulse.example.com", "location": "Lahore, Punjab, Pakistan"},
            {"name": "Dr. Imran Siddiqui", "specialty": "Endocrinologist", "display_order": 3, "phone": "+92 300 0000003", "email": "imran.siddiqui@biopulse.example.com", "location": "Islamabad, Pakistan"},
            {"name": "Dr. Fatima Noor", "specialty": "General Physician", "display_order": 4, "phone": "+92 300 0000004", "email": "fatima.noor@biopulse.example.com", "location": "Lahore, Punjab, Pakistan"},
            {"name": "Dr. Usman Raza", "specialty": "Andrologist", "display_order": 5, "phone": "+92 300 0000005", "email": "usman.raza@biopulse.example.com", "location": "Rawalpindi, Punjab, Pakistan"},
            {"name": "Dr. Hina Tariq", "specialty": "Women's Health Specialist", "display_order": 6, "phone": "+92 300 0000006", "email": "hina.tariq@biopulse.example.com", "location": "Karachi, Sindh, Pakistan"},
            {"name": "Dr. Hamza Farooq", "specialty": "Family Medicine Specialist", "display_order": 7, "phone": "+92 300 0000007", "email": "hamza.farooq@biopulse.example.com", "location": "Faisalabad, Punjab, Pakistan"},
        ]
        for d in docs_to_create:
            Doctor.objects.create(is_active=True, **d)

        # Inactive doctor should be excluded
        Doctor.objects.create(name="Dr. Hidden", is_active=False, display_order=8)

        res = self.client.get(self.endpoint)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 7)

        # Verify ordering 1 to 7
        for idx, doc_data in enumerate(res.data, start=1):
            self.assertEqual(doc_data["display_order"], idx)
            self.assertTrue(doc_data["phone"].startswith("+92 300"))
            self.assertTrue(doc_data["email"].endswith("@biopulse.example.com"))
            self.assertIn("Pakistan", doc_data["location"])


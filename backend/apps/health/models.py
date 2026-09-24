"""
BioPulse AI Health App — Data Models.
"""
from django.db import models
from django.utils.text import slugify


class Doctor(models.Model):
    """
    Doctor profile managed via Django Admin and exposed via public REST API.
    """
    name = models.CharField(max_length=255, help_text="Full name of the doctor.")
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        help_text="Unique URL-friendly slug. Auto-generated from name if left blank.",
    )
    profile_image = models.ImageField(
        upload_to="doctors/",
        null=True,
        blank=True,
        help_text="Doctor profile portrait image.",
    )
    specialty = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Medical specialty (e.g., Reproductive Endocrinologist).",
    )
    short_bio = models.TextField(
        null=True,
        blank=True,
        help_text="Short clinical biography or credential summary.",
    )
    phone = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Contact phone number (e.g., +92 300 0000001).",
    )
    email = models.EmailField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Contact email address (e.g., doctor@biopulse.example.com).",
    )
    location = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Clinical practice location (e.g., Lahore, Punjab, Pakistan).",
    )
    fee = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Consultation fee or fee range (e.g., Rs. 1,500 - 2,500).",
    )
    qualifications = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Academic & clinical qualifications (e.g., MBBS, FCPS).",
    )
    experience_years = models.IntegerField(
        null=True,
        blank=True,
        default=0,
        help_text="Years of clinical practice experience.",
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        default=4.8,
        help_text="Patient satisfaction rating (e.g., 4.9).",
    )
    reviews_count = models.IntegerField(
        null=True,
        blank=True,
        default=0,
        help_text="Total verified patient reviews count.",
    )
    wait_time = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default="Under 15 Min",
        help_text="Average clinic wait time.",
    )
    services_offered = models.TextField(
        null=True,
        blank=True,
        help_text="Key services and conditions treated (e.g., PCOS Management, Infertility, Antenatal Care).",
    )
    profile_image_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="External profile image URL (e.g., from verified CloudFront CDN).",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this doctor profile is published and visible on the public page.",
    )
    display_order = models.IntegerField(
        default=0,
        help_text="Sort order index (lower numbers appear first).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name = "Doctor"
        verbose_name_plural = "Doctors"

    def __str__(self) -> str:
        return f"{self.name} ({self.specialty or 'General'})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "doctor"
            slug = base_slug
            counter = 1
            while Doctor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

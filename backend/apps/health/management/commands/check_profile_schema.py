"""
backend/apps/health/management/commands/check_profile_schema.py

DEV diagnostic command that verifies required profile columns against the actual
configured Supabase instance:
- id
- gender
- pathway
- height_cm
- weight_kg
- waist_cm
- allergies
- food_allergies
- food_intolerances

Fails with a clear message if any required column / migration is missing.
"""

from django.core.management.base import BaseCommand, CommandError
from apps.health.services.supabase_health_service import _get_supabase_client


REQUIRED_PROFILE_COLUMNS = [
    "id",
    "gender",
    "pathway",
    "height_cm",
    "weight_kg",
    "waist_cm",
    "allergies",
    "food_allergies",
    "food_intolerances",
]


class Command(BaseCommand):
    help = "Validates that all required profile columns exist in the active Supabase instance."

    def handle(self, *args, **options):
        self.stdout.write("Connecting to active Supabase instance...")
        try:
            client = _get_supabase_client()
        except Exception as exc:
            raise CommandError(f"Failed to connect to Supabase: {exc}")

        self.stdout.write("Auditing 'public.profiles' table schema...")
        missing_columns = []
        verified_columns = []

        for col in REQUIRED_PROFILE_COLUMNS:
            try:
                res = client.table("profiles").select(col).limit(1).execute()
                verified_columns.append(col)
                self.stdout.write(self.style.SUCCESS(f"  [OK] Column '{col}' exists."))
            except Exception as e:
                err_msg = str(e)
                missing_columns.append((col, err_msg))
                self.stdout.write(self.style.ERROR(f"  [FAIL] Column '{col}' failed: {err_msg}"))

        # Primary Key Audit: Verify 'user_id' is NOT accidentally expected as a column in 'profiles'
        try:
            res_uid = client.table("profiles").select("user_id").limit(1).execute()
            self.stdout.write(self.style.WARNING("  [WARN] Column 'user_id' exists in profiles. Authoritative PK must remain 'id'."))
        except Exception:
            self.stdout.write(self.style.SUCCESS("  [OK] Authoritative PK verified: 'profiles.id' is patient UUID ('profiles.user_id' does not exist)."))

        if missing_columns:
            missing_names = [col for col, _ in missing_columns]
            raise CommandError(
                f"Missing required columns in Supabase 'profiles' table: {missing_names}. "
                "Please ensure migrations (e.g., supabase/migrations/20260915_nutrition_profile_preferences.sql) are applied."
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nAll {len(verified_columns)} required profile columns verified successfully in live Supabase instance!"
            )
        )

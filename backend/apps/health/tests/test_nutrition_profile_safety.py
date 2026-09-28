"""
backend/apps/health/tests/test_nutrition_profile_safety.py

Step 2 Focused Test Suite:
- A. Allergen Normalization
- B. Legacy Allergy Migration & Idempotency
- C. Peanut Allergy Filtering
- D. Shellfish Metadata (Absent, Present, Unknown, Missing)
- E. Dietary Pattern (Vegetarian, Vegan, Pescatarian)
- F. Safety Beats Preference
- G. Dislike vs Allergy Distinction
- H. Non-Food Allergy (Penicillin does not block nutrition planning)
- I. Profile Reuse (Biometrics, pathway)
- J. Graded Readiness (Blocking vs Warning vs Optional)
- K. Master Catalog Allergen Metadata Coverage & Fail-Closed Audit
- L. Preferences API (GET / PUT /api/v1/health/nutrition/preferences/)
"""

import json
import os
from unittest.mock import MagicMock, patch

import jwt
import pytest
from django.test import RequestFactory
from rest_framework import status

from apps.authentication.supabase_auth import SupabaseAuthentication, SupabaseUser
from apps.health.nutrition_vocabularies import (
    CanonicalAllergen,
    CanonicalIntolerance,
    DietaryPattern,
    build_dietary_compatibility_map,
    filter_legacy_allergies_for_backfill,
    normalize_dietary_pattern,
    normalize_food_allergens,
    normalize_food_intolerances,
    normalize_ingredient_name,
)
from apps.health.services.meal_profile_builder import (
    CanonicalNutritionProfile,
    MealProfileBuilder,
    NutritionReadinessResult,
)
from apps.health.views_nutrition import NutritionPreferencesView
try:
    from Meal.engine.safety import (
        EntitySafetyResult,
        apply_safety_filter,
        check_entity_allergen_safety,
        check_entity_dietary_safety,
    )
    from Meal.engine.schemas import SafetyOutcome
    from Meal.planner.catalog import load_master_planner_catalog
    HAS_MEAL_MODULE = True
except (ImportError, ModuleNotFoundError):
    HAS_MEAL_MODULE = False

if not HAS_MEAL_MODULE:
    pytestmark = pytest.mark.skip(reason="Meal Directory has been decoupled/moved")

TEST_JWT_SECRET = "test-secret-key-at-least-32-chars-long-123456"


@pytest.fixture(autouse=True)
def setup_env():
    prev_secret = os.environ.get("SUPABASE_JWT_SECRET")
    os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET
    yield
    if prev_secret is not None:
        os.environ["SUPABASE_JWT_SECRET"] = prev_secret
    else:
        os.environ.pop("SUPABASE_JWT_SECRET", None)


@pytest.fixture
def rf():
    return RequestFactory()


def make_auth_request(method: str, path: str, data=None, user_id: str = "00000000-0000-0000-0000-000000000001"):
    rf = RequestFactory()
    payload = {
        "sub": user_id,
        "email": "patient@example.com",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999,
        "user_metadata": {
            "gender": "female",
            "pathway": "female",
            "date_of_birth": "1996-05-15",
            "height_cm": 162.0,
            "weight_kg": 65.0,
            "activity_level": "moderate",
            "dietary_preference": "halal_omnivore",
        },
    }
    token = jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")
    if method == "GET":
        req = rf.get(path, HTTP_AUTHORIZATION=f"Bearer {token}")
    else:
        req = rf.put(path, data=json.dumps(data or {}), content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {token}")
    user = SupabaseUser(id=user_id, email="patient@example.com", role="authenticated", raw_token=token)
    req.user = user
    return req


# ==============================================================================
# A. Allergen Normalization Tests
# ==============================================================================
class TestAllergenNormalization:
    def test_peanuts_normalization(self):
        canonical, _, _ = normalize_food_allergens(["Peanuts"])
        assert canonical == [CanonicalAllergen.PEANUT.value]
        canonical, _, _ = normalize_food_allergens(["peanut"])
        assert canonical == [CanonicalAllergen.PEANUT.value]
        canonical, _, _ = normalize_food_allergens(["Groundnut"])
        assert canonical == [CanonicalAllergen.PEANUT.value]
        canonical, _, _ = normalize_food_allergens(["groundnuts"])
        assert canonical == [CanonicalAllergen.PEANUT.value]

    def test_dairy_milk_normalization(self):
        canonical, _, _ = normalize_food_allergens(["Dairy"])
        assert canonical == [CanonicalAllergen.MILK.value]
        canonical, _, _ = normalize_food_allergens(["Cow milk"])
        assert canonical == [CanonicalAllergen.MILK.value]
        canonical, _, _ = normalize_food_allergens(["milk"])
        assert canonical == [CanonicalAllergen.MILK.value]
        canonical, _, _ = normalize_food_allergens(["Dahi"])
        assert canonical == [CanonicalAllergen.MILK.value]

    def test_shellfish_normalization(self):
        canonical, _, _ = normalize_food_allergens(["Shrimp"])
        assert canonical == [CanonicalAllergen.SHELLFISH.value]
        canonical, _, _ = normalize_food_allergens(["Prawn"])
        assert canonical == [CanonicalAllergen.SHELLFISH.value]
        canonical, _, _ = normalize_food_allergens(["prawns"])
        assert canonical == [CanonicalAllergen.SHELLFISH.value]
        canonical, _, _ = normalize_food_allergens(["Crab"])
        assert canonical == [CanonicalAllergen.SHELLFISH.value]

    def test_tree_nuts_normalization(self):
        canonical, _, _ = normalize_food_allergens(["Nuts"])
        assert canonical == [CanonicalAllergen.TREE_NUT.value]
        canonical, _, _ = normalize_food_allergens(["Tree nuts"])
        assert canonical == [CanonicalAllergen.TREE_NUT.value]
        canonical, _, _ = normalize_food_allergens(["Almonds"])
        assert canonical == [CanonicalAllergen.TREE_NUT.value]
        canonical, _, _ = normalize_food_allergens(["Walnut"])
        assert canonical == [CanonicalAllergen.TREE_NUT.value]

    def test_gluten_distinct_from_wheat(self):
        # Gluten is handled as an intolerance, NOT a classical allergen
        canonical, _, unmapped = normalize_food_allergens(["gluten"])
        assert canonical == []
        assert "gluten" in unmapped
        canonical_intol, _ = normalize_food_intolerances(["gluten"])
        assert canonical_intol == [CanonicalIntolerance.GLUTEN.value]
        canonical_intol, _ = normalize_food_intolerances(["gluten-free"])
        assert canonical_intol == [CanonicalIntolerance.GLUTEN.value]
        canonical_intol, _ = normalize_food_intolerances(["gluten sensitivity"])
        assert canonical_intol == [CanonicalIntolerance.GLUTEN.value]


# ==============================================================================
# B. Legacy Allergy Migration & Idempotency Tests
# ==============================================================================
class TestLegacyAllergyMigration:
    def test_legacy_allergy_backfill_filtering(self):
        legacy = ["Penicillin", "Peanuts", "Pollen"]
        result = filter_legacy_allergies_for_backfill(legacy, existing_food_allergies=[])
        assert result == ["peanut"]

    def test_idempotent_backfill(self):
        legacy = ["Penicillin", "Peanuts", "Pollen"]
        # First run
        first_run = filter_legacy_allergies_for_backfill(legacy, existing_food_allergies=[])
        assert first_run == ["peanut"]
        # Second run with existing
        second_run = filter_legacy_allergies_for_backfill(legacy, existing_food_allergies=first_run)
        assert second_run == ["peanut"]
        assert second_run != ["peanut", "peanut"]

    def test_non_food_allergies_untouched_and_ignored(self):
        legacy = ["Penicillin", "Sulfa Drugs", "Latex", "Pollen"]
        result = filter_legacy_allergies_for_backfill(legacy, existing_food_allergies=[])
        assert result == []


# ==============================================================================
# C. Peanut Allergy Tests
# ==============================================================================
class TestPeanutAllergy:
    def test_peanut_candidate_excluded_non_peanut_eligible(self):
        candidates = [
            {
                "entity_id": "P001",
                "entity_name": "Peanut Halwa",
                "allergen_map": {"peanut": "PRESENT", "nuts": "PRESENT"},
                "allergen_assessment_complete": True,
            },
            {
                "entity_id": "P002",
                "entity_name": "Plain Rice",
                "allergen_map": {"peanut": "ABSENT", "nuts": "ABSENT"},
                "allergen_assessment_complete": True,
            },
        ]
        results = apply_safety_filter(candidates, user_allergens=["peanut"], user_dietary_classes=[])
        assert not results["P001"].eligible
        assert SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN in results["P001"].all_reasons
        assert results["P002"].eligible


# ==============================================================================
# D. Shellfish Metadata Tests
# ==============================================================================
class TestShellfishMetadata:
    def test_candidate_a_shellfish_absent(self):
        # Candidate A: chicken, rice -> shellfish ABSENT
        candidate = {
            "entity_id": "C_A",
            "entity_name": "Chicken Rice",
            "allergen_map": {"shellfish": "ABSENT"},
            "allergen_assessment_complete": True,
        }
        res = check_entity_allergen_safety(
            candidate["entity_id"], candidate["entity_name"], candidate["allergen_map"],
            ["shellfish"], allergen_assessment_complete=True
        )
        assert res.eligible

    def test_candidate_b_shellfish_present(self):
        # Candidate B: shrimp, rice -> shellfish PRESENT
        candidate = {
            "entity_id": "C_B",
            "entity_name": "Shrimp Rice",
            "allergen_map": {"shellfish": "PRESENT"},
            "allergen_assessment_complete": True,
        }
        res = check_entity_allergen_safety(
            candidate["entity_id"], candidate["entity_name"], candidate["allergen_map"],
            ["shellfish"], allergen_assessment_complete=True
        )
        assert not res.eligible
        assert res.primary_outcome == SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN

    def test_candidate_c_shellfish_unknown(self):
        # Candidate C: mixed seafood -> shellfish UNKNOWN
        candidate = {
            "entity_id": "C_C",
            "entity_name": "Mixed Seafood",
            "allergen_map": {"shellfish": "UNKNOWN"},
            "allergen_assessment_complete": True,
        }
        res = check_entity_allergen_safety(
            candidate["entity_id"], candidate["entity_name"], candidate["allergen_map"],
            ["shellfish"], allergen_assessment_complete=True
        )
        assert not res.eligible
        assert res.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS

    def test_candidate_d_shellfish_missing_from_metadata(self):
        # Candidate D: shellfish missing from allergen map
        candidate = {
            "entity_id": "C_D",
            "entity_name": "Mystery Dish",
            "allergen_map": {"dairy": "ABSENT"},  # shellfish key completely missing
            "allergen_assessment_complete": True,
        }
        res = check_entity_allergen_safety(
            candidate["entity_id"], candidate["entity_name"], candidate["allergen_map"],
            ["shellfish"], allergen_assessment_complete=True
        )
        assert not res.eligible
        assert res.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS


# ==============================================================================
# E. Dietary Pattern Tests
# ==============================================================================
class TestDietaryPattern:
    def test_vegetarian_filtering(self):
        chicken_map = build_dietary_compatibility_map(known_contains_meat=True, known_contains_fish=False, known_contains_dairy=False, known_contains_egg=False)
        fish_map = build_dietary_compatibility_map(known_contains_meat=False, known_contains_fish=True, known_contains_dairy=False, known_contains_egg=False)
        daal_map = build_dietary_compatibility_map(known_contains_meat=False, known_contains_fish=False, known_contains_dairy=False, known_contains_egg=False)

        assert chicken_map["vegetarian"] == "INCOMPATIBLE"
        assert fish_map["vegetarian"] == "INCOMPATIBLE"
        assert daal_map["vegetarian"] == "COMPATIBLE"

        # Verify through safety engine
        r_chicken = check_entity_dietary_safety("E1", "Chicken", chicken_map, ["vegetarian"], dietary_assessment_complete=True)
        r_fish = check_entity_dietary_safety("E2", "Fish", fish_map, ["vegetarian"], dietary_assessment_complete=True)
        r_daal = check_entity_dietary_safety("E3", "Daal", daal_map, ["vegetarian"], dietary_assessment_complete=True)

        assert not r_chicken.eligible
        assert not r_fish.eligible
        assert r_daal.eligible

    def test_vegan_filtering(self):
        chicken_map = build_dietary_compatibility_map(known_contains_meat=True, known_contains_fish=False, known_contains_dairy=False, known_contains_egg=False)
        egg_map = build_dietary_compatibility_map(known_contains_meat=False, known_contains_fish=False, known_contains_dairy=False, known_contains_egg=True)
        dahi_map = build_dietary_compatibility_map(known_contains_meat=False, known_contains_fish=False, known_contains_dairy=True, known_contains_egg=False)
        lentils_map = build_dietary_compatibility_map(known_contains_meat=False, known_contains_fish=False, known_contains_dairy=False, known_contains_egg=False)

        assert chicken_map["vegan"] == "INCOMPATIBLE"
        assert egg_map["vegan"] == "INCOMPATIBLE"
        assert dahi_map["vegan"] == "INCOMPATIBLE"
        assert lentils_map["vegan"] == "COMPATIBLE"

        r_chicken = check_entity_dietary_safety("V1", "Chicken", chicken_map, ["vegan"], dietary_assessment_complete=True)
        r_egg = check_entity_dietary_safety("V2", "Egg", egg_map, ["vegan"], dietary_assessment_complete=True)
        r_dahi = check_entity_dietary_safety("V3", "Dahi", dahi_map, ["vegan"], dietary_assessment_complete=True)
        r_lentils = check_entity_dietary_safety("V4", "Lentils", lentils_map, ["vegan"], dietary_assessment_complete=True)

        assert not r_chicken.eligible
        assert not r_egg.eligible
        assert not r_dahi.eligible
        assert r_lentils.eligible

    def test_pescatarian_filtering(self):
        chicken_map = build_dietary_compatibility_map(known_contains_meat=True, known_contains_fish=False, known_contains_dairy=False, known_contains_egg=False)
        fish_map = build_dietary_compatibility_map(known_contains_meat=False, known_contains_fish=True, known_contains_dairy=False, known_contains_egg=False)

        assert chicken_map["pescatarian"] == "INCOMPATIBLE"
        assert fish_map["pescatarian"] == "COMPATIBLE"

        r_chicken = check_entity_dietary_safety("P1", "Chicken", chicken_map, ["pescatarian"], dietary_assessment_complete=True)
        r_fish = check_entity_dietary_safety("P2", "Fish", fish_map, ["pescatarian"], dietary_assessment_complete=True)

        assert not r_chicken.eligible
        assert r_fish.eligible


# ==============================================================================
# F. Safety Beats Preference Tests
# ==============================================================================
class TestSafetyBeatsPreference:
    def test_allergy_overrides_favorite_food(self):
        # User loves peanut, but is allergic to peanut
        entities = [
            {
                "entity_id": "PEANUT_CHIKKI",
                "entity_name": "Peanut Chikki",
                "allergen_map": {"peanut": "PRESENT"},
                "allergen_assessment_complete": True,
            }
        ]
        # Run safety filter
        results = apply_safety_filter(
            entities,
            user_allergens=["peanut"],
            user_dietary_classes=[],
            disliked_entity_ids=[],  # user did not dislike it; user likes it!
        )
        # Result: must be EXCLUDED due to hard allergy safety
        assert not results["PEANUT_CHIKKI"].eligible
        assert SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN in results["PEANUT_CHIKKI"].all_reasons


# ==============================================================================
# G. Dislike vs Allergy Semantics Tests
# ==============================================================================
class TestDislikeVsAllergySemantics:
    def test_dislike_classified_distinctly_from_allergy(self):
        entities = [
            {
                "entity_id": "KARELA_01",
                "entity_name": "Karela Sabzi",
                "allergen_map": {"dairy": "ABSENT", "nuts": "ABSENT"},
                "allergen_assessment_complete": True,
            }
        ]
        results = apply_safety_filter(
            entities,
            user_allergens=[],
            user_dietary_classes=[],
            disliked_entity_ids=["KARELA_01"],
        )
        res = results["KARELA_01"]
        assert not res.eligible
        assert res.primary_outcome == SafetyOutcome.EXCLUDED_USER_DISLIKE
        assert res.excluded_by_allergen == []
        assert any("explicitly disliked" in r for r in res.exclusion_reasons)


# ==============================================================================
# H. Non-Food Allergy Tests
# ==============================================================================
class TestNonFoodAllergy:
    def test_penicillin_does_not_block_nutrition_planning(self):
        builder = MealProfileBuilder()
        raw_meta = {
            "gender": "female",
            "pathway": "female",
        }
        profile_data = {
            "date_of_birth": "1998-05-15",
            "height_cm": 160.0,
            "weight_kg": 58.0,
            "activity_level": "moderate",
            "dietary_preference": "halal_omnivore",
            "allergies": ["Penicillin"],
            "food_allergies": [],
        }
        readiness = builder.check_nutrition_readiness(raw_meta, profile_data)
        assert readiness.ready is True
        assert readiness.overall_status in ("READY", "WARNINGS")
        assert readiness.safety_confirmations["status"] == "PASS"


# ==============================================================================
# I. Profile Reuse Tests
# ==============================================================================
class TestProfileReuse:
    def test_canonical_profile_reuses_existing_biometrics(self):
        builder = MealProfileBuilder()
        raw_meta = {
            "gender": "female",
            "pathway": "female_pcos",
        }
        profile_data = {
            "date_of_birth": "1995-05-15",
            "height_cm": 165.0,
            "weight_kg": 68.0,
            "activity_level": "active",
            "dietary_preference": "halal_omnivore",
            "food_allergies": ["peanut"],
            "food_intolerances": ["gluten"],
            "favorite_ingredients": ["spinach"],
            "disliked_ingredients": ["karela"],
            "preferred_cuisines": ["pakistani"],
            "budget_tier": "medium",
            "cooking_time_preference": "moderate",
            "meals_per_day": 4,
        }
        profile = builder.build_canonical_nutrition_profile("user_123", raw_meta, profile_data)
        assert profile.user_id == "user_123"
        assert profile.sex == "female"
        assert profile.pathway == "female_pcos"
        assert profile.height_cm == 165.0
        assert profile.weight_kg == 68.0
        assert profile.food_allergies == ["peanut"]
        assert profile.food_intolerances == ["gluten"]
        assert profile.favorite_ingredients == ["spinach"]
        assert profile.disliked_ingredients == ["karela"]


# ==============================================================================
# J. Graded Readiness Tests
# ==============================================================================
class TestReadinessGrading:
    def test_missing_favorite_foods_is_not_blocking(self):
        builder = MealProfileBuilder()
        raw_meta = {
            "gender": "male",
            "pathway": "male",
        }
        profile_data = {
            "date_of_birth": "1992-05-15",
            "height_cm": 178.0,
            "weight_kg": 76.0,
            "activity_level": "moderate",
            "dietary_preference": "halal_omnivore",
            "allergies": ["None"],
            "food_allergies": [],
            "food_intolerances": [],
        }
        readiness = builder.check_nutrition_readiness(raw_meta, profile_data)
        assert readiness.ready is True  # NOT blocked!
        assert any("favorite" in issue.lower() for issue in readiness.warning_issues)

    def test_missing_biometrics_is_blocking(self):
        builder = MealProfileBuilder()
        raw_meta = {
            "gender": "male",
            # height and weight missing!
        }
        profile_data = {}
        readiness = builder.check_nutrition_readiness(raw_meta, profile_data)
        assert readiness.ready is False
        assert readiness.overall_status == "NOT_READY"
        assert len(readiness.blocking_issues) > 0


# ==============================================================================
# K. Master Catalog Allergen Metadata Coverage & Fail-Closed Audit
# ==============================================================================
class TestMasterCatalogAllergenCoverage:
    def test_catalog_supported_allergens_audit_and_coverage(self):
        catalog = load_master_planner_catalog()
        assert len(catalog) == 71

        # Audit complete assessment vs incomplete assessment
        fully_assessed = [e for e in catalog.values() if e.allergen_assessment_complete]
        incomplete = [e for e in catalog.values() if not e.allergen_assessment_complete]

        # In Pakistani catalog, 48 entities have complete assessment and 23 have incomplete assessment
        assert len(fully_assessed) == 48
        assert len(incomplete) == 23

        # Candidates with incomplete metadata must fail-closed when evaluated with any allergy
        for inc_dish in incomplete:
            res = check_entity_allergen_safety(
                inc_dish.planner_entity_id,
                inc_dish.entity_name_en,
                inc_dish.to_safety_dict(),
                ["dairy"],
                allergen_assessment_complete=inc_dish.allergen_assessment_complete,
            )
            assert not res.eligible
            assert res.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS

    def test_unsupported_catalog_allergens_fail_closed(self):
        # Shellfish, Soy, Sesame are not represented in the 5 raw catalog columns.
        # Therefore, any user with shellfish, soy, or sesame must fail-closed.
        catalog = load_master_planner_catalog()
        sample_entity = next(iter(catalog.values())).to_safety_dict()

        for unsupported_allergen in ["shellfish", "soy", "sesame"]:
            res = check_entity_allergen_safety(
                sample_entity["entity_id"],
                sample_entity["entity_name"],
                sample_entity.get("allergen_map", {}),
                [unsupported_allergen],
                allergen_assessment_complete=True,
            )
            assert not res.eligible, f"Allergen {unsupported_allergen} should fail-closed"
            assert res.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS


# ==============================================================================
# L. Preferences API View Tests
# ==============================================================================
class TestPreferencesApi:
    def test_get_preferences_returns_normalized_defaults(self):
        view = NutritionPreferencesView.as_view()
        req = make_auth_request("GET", "/api/v1/health/nutrition/preferences/")
        with patch("apps.health.views_nutrition.health_service._client_or_raise") as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table
            mock_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(data=None)
            response = view(req)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert "food_allergies" in data
        assert "food_intolerances" in data
        assert "dietary_pattern" in data
        assert "budget_tier" in data
        assert "cooking_time_preference" in data
        assert "meals_per_day" in data

    def test_put_preferences_validates_and_normalizes(self):
        view = NutritionPreferencesView.as_view()
        payload = {
            "food_allergies": ["Peanuts", "Cow milk"],
            "food_intolerances": ["gluten"],
            "dietary_pattern": "vegetarian",
            "favorite_ingredients": ["Daal", "Palak"],
            "disliked_ingredients": ["Karela"],
            "preferred_cuisines": ["pakistani"],
            "budget_tier": "low",
            "cooking_time_preference": "quick",
            "meals_per_day": 4,
        }
        req = make_auth_request("PUT", "/api/v1/health/nutrition/preferences/", data=payload)
        with patch("apps.health.views_nutrition.health_service._client_or_raise") as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table
            mock_table.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
            response = view(req)

        assert response.status_code == status.HTTP_200_OK
        data = response.data
        # Normalized values
        assert "peanut" in data["food_allergies"]
        assert "milk" in data["food_allergies"]
        assert "gluten" in data["food_intolerances"]
        assert data["dietary_pattern"] == "vegetarian"
        assert data["favorite_ingredients"] == ["daal", "palak"]
        assert data["disliked_ingredients"] == ["karela"]

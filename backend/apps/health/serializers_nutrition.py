"""
backend/apps/health/serializers_nutrition.py

Stable DRF Serializers for BioPulse Meal Planning API.
"""

from __future__ import annotations

from rest_framework import serializers


class StatusGroupSerializer(serializers.Serializer):
    status = serializers.CharField()
    missing = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class PlanningInputsSerializer(serializers.Serializer):
    status = serializers.CharField()
    activity_status = serializers.CharField()
    missing = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class NutritionReadinessSerializer(serializers.Serializer):
    ready = serializers.BooleanField()
    overall_status = serializers.CharField(required=False, default="READY")
    personalization_level = serializers.CharField(required=False, default="LEVEL_1_PROFILE")
    available = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    missing_required = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    missing_optional = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    recommendations = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    blocking_issues = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    warning_issues = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    optional_issues = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    required_biometrics = StatusGroupSerializer()
    safety_confirmations = StatusGroupSerializer()
    planning_inputs = PlanningInputsSerializer()
    optional_personalization = serializers.DictField(required=False, default=dict)
    warnings = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class NutritionPreferencesSerializer(serializers.Serializer):
    food_allergies = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    food_intolerances = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    dietary_pattern = serializers.CharField(required=False, default="halal_omnivore")
    favorite_ingredients = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    disliked_ingredients = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    preferred_cuisines = serializers.ListField(child=serializers.CharField(), required=False, default=lambda: ["pakistani"])
    budget_tier = serializers.CharField(required=False, default="medium")
    cooking_time_preference = serializers.CharField(required=False, default="moderate")
    meals_per_day = serializers.IntegerField(required=False, default=4, min_value=3, max_value=5)

    def validate_food_allergies(self, value):
        from apps.health.nutrition_vocabularies import normalize_food_allergens
        canonical, _, _ = normalize_food_allergens(value)
        return canonical

    def validate_food_intolerances(self, value):
        from apps.health.nutrition_vocabularies import normalize_food_intolerances
        canonical, _ = normalize_food_intolerances(value)
        return canonical

    def validate_dietary_pattern(self, value):
        from apps.health.nutrition_vocabularies import normalize_dietary_pattern
        return normalize_dietary_pattern(value)

    def validate_budget_tier(self, value):
        from apps.health.nutrition_vocabularies import validate_budget_tier
        return validate_budget_tier(value)

    def validate_cooking_time_preference(self, value):
        from apps.health.nutrition_vocabularies import validate_cooking_time_preference
        return validate_cooking_time_preference(value)

    def validate_meals_per_day(self, value):
        from apps.health.nutrition_vocabularies import validate_meals_per_day
        return validate_meals_per_day(value)

    def validate_favorite_ingredients(self, value):
        from apps.health.nutrition_vocabularies import normalize_ingredient_name
        return [normalize_ingredient_name(item) for item in value if item]

    def validate_disliked_ingredients(self, value):
        from apps.health.nutrition_vocabularies import normalize_ingredient_name
        return [normalize_ingredient_name(item) for item in value if item]


class MacroRangeSerializer(serializers.Serializer):
    min = serializers.FloatField()
    max = serializers.FloatField()


class NutritionTargetsSerializer(serializers.Serializer):
    energy_kcal = serializers.FloatField()
    protein_g = MacroRangeSerializer()
    carbohydrate_g = MacroRangeSerializer()
    fat_g = MacroRangeSerializer()
    fiber_ai_g = serializers.FloatField(required=False)
    condition_pathway = serializers.CharField()
    evidence_context_status = serializers.CharField()
    condition_evidence_annotations = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )


class MealItemSerializer(serializers.Serializer):
    entity_id = serializers.CharField()
    display_name = serializers.CharField()
    grams = serializers.FloatField()
    standard_portion = serializers.CharField(required=False, allow_blank=True)
    energy_kcal = serializers.FloatField()
    protein_g = serializers.FloatField()
    carbohydrate_g = serializers.FloatField()
    fat_g = serializers.FloatField()
    has_recipe = serializers.BooleanField(default=False)
    recipe_note = serializers.CharField(required=False, allow_blank=True)


class SingleMealSerializer(serializers.Serializer):
    role = serializers.CharField()
    title = serializers.CharField()
    energy_kcal = serializers.FloatField()
    protein_g = serializers.FloatField()
    carbohydrate_g = serializers.FloatField()
    fat_g = serializers.FloatField()
    items = MealItemSerializer(many=True)
    is_locked = serializers.BooleanField(required=False, default=False)


class TargetAdherenceSerializer(serializers.Serializer):
    energy = serializers.CharField()
    protein = serializers.CharField()
    carbohydrate = serializers.CharField()
    fat = serializers.CharField()


class DayPlanSerializer(serializers.Serializer):
    day_index = serializers.IntegerField()
    day_name = serializers.CharField()
    date = serializers.CharField()
    status = serializers.CharField()
    energy_kcal = serializers.FloatField()
    protein_g = serializers.FloatField()
    carbohydrate_g = serializers.FloatField()
    fat_g = serializers.FloatField()
    fiber_g = serializers.FloatField(required=False, allow_null=True)
    fiber_coverage = serializers.CharField()
    target_adherence = TargetAdherenceSerializer()
    meals = SingleMealSerializer(many=True)


class CoverageSerializer(serializers.Serializer):
    fiber = serializers.CharField()
    fiber_note = serializers.CharField(required=False, allow_blank=True)
    recipes = serializers.CharField()
    verified_subset_notice = serializers.CharField()


class ProfileContextSerializer(serializers.Serializer):
    condition_pathway = serializers.CharField()
    evidence_context_status = serializers.CharField()
    goal = serializers.CharField()
    activity_level = serializers.CharField()
    dietary_class = serializers.CharField(required=False)


class WeeklyNutritionPlanSerializer(serializers.Serializer):
    id = serializers.CharField()
    plan_type = serializers.CharField()
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    is_active = serializers.BooleanField()
    replaced_plan_id = serializers.CharField(required=False, allow_null=True)
    status = serializers.CharField()
    created_at = serializers.CharField()
    profile_context = ProfileContextSerializer()
    targets = serializers.DictField()
    days_targets_met = serializers.IntegerField()
    days_with_deviations = serializers.IntegerField()
    days = DayPlanSerializer(many=True)
    coverage = CoverageSerializer()
    condition_guidance = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    warnings = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class PlanHistoryItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    plan_type = serializers.CharField()
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    is_active = serializers.BooleanField()
    condition_pathway = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.CharField()


class FoodLogSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    meal_type = serializers.CharField()
    food_name = serializers.CharField()
    serving = serializers.CharField(required=False, default="1 serving", allow_blank=True)
    calories = serializers.FloatField(required=False, allow_null=True)
    protein_g = serializers.FloatField(required=False, allow_null=True)
    carbs_g = serializers.FloatField(required=False, allow_null=True)
    fat_g = serializers.FloatField(required=False, allow_null=True)
    fiber_g = serializers.FloatField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    logged_at = serializers.CharField(required=False)


class MealReminderSettingsSerializer(serializers.Serializer):
    breakfast_enabled = serializers.BooleanField(required=False, default=True)
    breakfast_time = serializers.CharField(required=False, default="08:00")
    lunch_enabled = serializers.BooleanField(required=False, default=True)
    lunch_time = serializers.CharField(required=False, default="13:00")
    dinner_enabled = serializers.BooleanField(required=False, default=True)
    dinner_time = serializers.CharField(required=False, default="20:00")
    snack_enabled = serializers.BooleanField(required=False, default=False)
    snack_time = serializers.CharField(required=False, default="16:30")

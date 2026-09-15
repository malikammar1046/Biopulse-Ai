-- ==============================================================================
-- BioPulse / OvaSense: Nutrition Profile & Preferences Migration
-- Table: public.profiles
-- Description: Adds structured nutrition preferences, dedicated food allergies & intolerances,
-- and provides an idempotent legacy allergy backfill for food allergens.
-- ==============================================================================

-- 1. Add dedicated food safety & nutrition preference columns
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS food_allergies JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS food_intolerances JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS favorite_ingredients JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS disliked_ingredients JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS preferred_cuisines JSONB DEFAULT '["pakistani"]'::jsonb,
    ADD COLUMN IF NOT EXISTS budget_tier TEXT DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS cooking_time_preference TEXT DEFAULT 'moderate',
    ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 4;

-- 2. Add validation constraints (safely checking if constraint already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_budget_tier'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT check_profiles_budget_tier
            CHECK (budget_tier IN ('low', 'medium', 'flexible'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_cooking_time_preference'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT check_profiles_cooking_time_preference
            CHECK (cooking_time_preference IN ('quick', 'moderate', 'flexible'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_meals_per_day'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT check_profiles_meals_per_day
            CHECK (meals_per_day >= 3 AND meals_per_day <= 5);
    END IF;
END $$;

-- 3. Idempotent Legacy Food Allergy Migration Function
-- Only maps confidently recognized food items from general `allergies` into `food_allergies`.
-- Non-food items (Penicillin, Sulfa, Latex, Pollen) are never copied to food_allergies
-- and remain safely preserved in `allergies`.
CREATE OR REPLACE FUNCTION public.migrate_legacy_food_allergies()
RETURNS void AS $$
DECLARE
    rec RECORD;
    raw_item TEXT;
    clean_item TEXT;
    canonical_id TEXT;
    existing_food_allergies JSONB;
    updated_array JSONB;
BEGIN
    FOR rec IN SELECT id, allergies, food_allergies FROM public.profiles WHERE allergies IS NOT NULL AND jsonb_typeof(allergies) = 'array' AND jsonb_array_length(allergies) > 0 LOOP
        existing_food_allergies := COALESCE(rec.food_allergies, '[]'::jsonb);
        updated_array := existing_food_allergies;

        FOR raw_item IN SELECT jsonb_array_elements_text(rec.allergies) LOOP
            clean_item := lower(trim(raw_item));
            canonical_id := NULL;

            IF clean_item IN ('peanut', 'peanuts', 'groundnut', 'groundnuts') THEN
                canonical_id := 'peanut';
            ELSIF clean_item IN ('tree nut', 'tree nuts', 'tree_nut', 'tree_nuts', 'nuts', 'nut', 'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut') THEN
                canonical_id := 'tree_nut';
            ELSIF clean_item IN ('dairy', 'milk', 'cow milk', 'lactose', 'dahi', 'cheese', 'paneer') THEN
                canonical_id := 'milk';
            ELSIF clean_item IN ('egg', 'eggs') THEN
                canonical_id := 'egg';
            ELSIF clean_item IN ('wheat', 'atta', 'flour') THEN
                canonical_id := 'wheat';
            ELSIF clean_item IN ('soy', 'soya', 'soybean', 'soybeans') THEN
                canonical_id := 'soy';
            ELSIF clean_item IN ('fish', 'seafood') THEN
                canonical_id := 'fish';
            ELSIF clean_item IN ('shellfish', 'shrimp', 'prawn', 'prawns', 'crab', 'lobster') THEN
                canonical_id := 'shellfish';
            ELSIF clean_item IN ('sesame', 'til') THEN
                canonical_id := 'sesame';
            END IF;

            -- If recognized and not already in array, append it idempotently
            IF canonical_id IS NOT NULL AND NOT updated_array @> to_jsonb(canonical_id) THEN
                updated_array := updated_array || to_jsonb(canonical_id);
            END IF;
        END LOOP;

        IF updated_array != existing_food_allergies THEN
            UPDATE public.profiles
            SET food_allergies = updated_array
            WHERE id = rec.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Execute the migration once
SELECT public.migrate_legacy_food_allergies();

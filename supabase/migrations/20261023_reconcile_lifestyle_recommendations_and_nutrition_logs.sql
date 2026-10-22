-- ==============================================================================
-- Migration: 20261023_reconcile_lifestyle_recommendations_and_nutrition_logs.sql
-- Description: Reconciles version control schema with verified live Supabase structure
--              for public.lifestyle_recommendations and public.nutrition_food_logs.
--
-- Safety Guarantees:
-- 1. Idempotent IF NOT EXISTS syntax prevents destructive table replacement.
-- 2. Preserves all 170+ existing recommendation records and patient adherence statuses.
-- 3. Configures Row Level Security (RLS) enforcing strict patient isolation (auth.uid() = user_id).
-- 4. Creates btree indexes matching production query patterns.
-- ==============================================================================

-- 1. Create public.lifestyle_recommendations table if not present
CREATE TABLE IF NOT EXISTS public.lifestyle_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  context_version TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  item_statuses JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for lifestyle_recommendations
CREATE INDEX IF NOT EXISTS idx_lifestyle_user_module 
  ON public.lifestyle_recommendations USING btree (user_id, module, is_active);

-- 3. Row Level Security for lifestyle_recommendations
ALTER TABLE public.lifestyle_recommendations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lifestyle_recommendations' 
    AND policyname = 'Users can view their own lifestyle recommendations'
  ) THEN
    CREATE POLICY "Users can view their own lifestyle recommendations"
      ON public.lifestyle_recommendations FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lifestyle_recommendations' 
    AND policyname = 'Users can insert their own lifestyle recommendations'
  ) THEN
    CREATE POLICY "Users can insert their own lifestyle recommendations"
      ON public.lifestyle_recommendations FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lifestyle_recommendations' 
    AND policyname = 'Users can update their own lifestyle recommendations'
  ) THEN
    CREATE POLICY "Users can update their own lifestyle recommendations"
      ON public.lifestyle_recommendations FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Create public.nutrition_food_logs table if not present
CREATE TABLE IF NOT EXISTS public.nutrition_food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  portion_description TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  plan_id UUID,
  plan_meal_id TEXT,
  day_index INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Indexes for nutrition_food_logs
CREATE INDEX IF NOT EXISTS idx_nutrition_food_logs_user_id 
  ON public.nutrition_food_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_nutrition_food_logs_logged_at 
  ON public.nutrition_food_logs USING btree (user_id, logged_at DESC);

-- 6. Row Level Security for nutrition_food_logs
ALTER TABLE public.nutrition_food_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'nutrition_food_logs' 
    AND policyname = 'nutrition_food_logs_user_policy'
  ) THEN
    CREATE POLICY "nutrition_food_logs_user_policy"
      ON public.nutrition_food_logs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================================================
-- BioPulse / OvaSense: Nutrition Plans Persistence Migration
-- Table: public.nutrition_plans
-- Row Level Security (RLS) & Indexes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'WEEKLY_7_DAY',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    replaced_plan_id UUID NULL REFERENCES public.nutrition_plans(id),
    profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    condition_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    audit_diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
    meal_module_version TEXT NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1. Index on (user_id, is_active) for fast lookup of active plan
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_active 
ON public.nutrition_plans(user_id, is_active);

-- 2. Partial unique index ensuring strictly at most one active plan per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_plans_one_active_per_user
ON public.nutrition_plans(user_id)
WHERE is_active = TRUE;

-- 3. Index on (user_id, created_at DESC) for chronological plan history
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_created 
ON public.nutrition_plans(user_id, created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies
-- Authenticated users can ONLY SELECT their own nutrition plans
DROP POLICY IF EXISTS "Users can view own nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Users can view own nutrition plans"
    ON public.nutrition_plans FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Note: In accordance with hardening requirements, browser/authenticated users
-- cannot directly INSERT or UPDATE nutrition_plans. All plan generation,
-- immutable snapshots, and deactivation lifecycle updates are performed exclusively
-- by the Django backend service role.

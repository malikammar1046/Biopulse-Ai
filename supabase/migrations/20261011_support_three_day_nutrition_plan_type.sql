-- ==============================================================================
-- BioPulse: Support Three-Day Nutrition Plan Classification Migration
-- Updates check constraint on public.nutrition_plans to support 'three_day'
-- while preserving backward compatibility with historic 'weekly', 'daily', etc.
-- ==============================================================================

BEGIN;

ALTER TABLE public.nutrition_plans 
DROP CONSTRAINT IF EXISTS nutrition_plans_plan_type_check;

ALTER TABLE public.nutrition_plans 
ADD CONSTRAINT nutrition_plans_plan_type_check 
CHECK (plan_type = ANY (ARRAY['daily'::text, 'three_day'::text, 'weekly'::text, 'monthly'::text, 'WEEKLY_7_DAY'::text, 'THREE_DAY_PLAN'::text]));

COMMIT;

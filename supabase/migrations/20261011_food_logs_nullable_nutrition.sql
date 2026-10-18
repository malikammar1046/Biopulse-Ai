-- 20261011_food_logs_nullable_nutrition.sql
-- Allow food_logs nutrition columns to be NULL when logged items have unverified/unknown nutrient data.
ALTER TABLE public.food_logs ALTER COLUMN calories DROP NOT NULL;
ALTER TABLE public.food_logs ALTER COLUMN calories DROP DEFAULT;
ALTER TABLE public.food_logs ALTER COLUMN protein_g DROP NOT NULL;
ALTER TABLE public.food_logs ALTER COLUMN protein_g DROP DEFAULT;
ALTER TABLE public.food_logs ALTER COLUMN carbs_g DROP NOT NULL;
ALTER TABLE public.food_logs ALTER COLUMN carbs_g DROP DEFAULT;
ALTER TABLE public.food_logs ALTER COLUMN fat_g DROP NOT NULL;
ALTER TABLE public.food_logs ALTER COLUMN fat_g DROP DEFAULT;
ALTER TABLE public.food_logs ALTER COLUMN fiber_g DROP NOT NULL;
ALTER TABLE public.food_logs ALTER COLUMN fiber_g DROP DEFAULT;

-- ==============================================================================
-- Table: public.patient_clinical_state
-- Description: Authoritative persistent patient clinical inputs for progressive screening (Female PCOS & Male Hypogonadism).
-- Separates current patient clinical state from assessment history runs.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.patient_clinical_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('female_pcos', 'male_hypogonadism')),
  tier_1_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  tier_2_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ultrasound_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, module)
);

CREATE INDEX IF NOT EXISTS idx_patient_clinical_state_user_module
  ON public.patient_clinical_state(user_id, module);

ALTER TABLE public.patient_clinical_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own clinical state" ON public.patient_clinical_state;
CREATE POLICY "Users can manage own clinical state"
  ON public.patient_clinical_state FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Migration: Stage 5 - Unified Screening Assessment Infrastructure
-- File: supabase/migrations/20260918_stage5_screening_assessments.sql
-- Description:
--   1. Creates unified screening_assessments and pcos_ultrasound_assessments tables
--   2. Enforces explicit table privileges (read-only for authenticated, 0 direct browser writes)
--   3. Enables RLS policies for own assessments and permitted care circle members
--   4. Creates advisory-locked save_screening_assessment() RPC (service_role only)
-- ============================================================================

-- 1. Create unified table (without unique active index initially - unique index added after legacy migration)
CREATE TABLE IF NOT EXISTS public.screening_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN ('female_pcos', 'male_hypogonadism')),
    assessment_level TEXT NOT NULL,
    tiers_included JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    probability NUMERIC NOT NULL CHECK (probability >= 0.0 AND probability <= 1.0),
    probability_percent NUMERIC NOT NULL CHECK (probability_percent >= 0.0 AND probability_percent <= 100.0),
    threshold NUMERIC NOT NULL CHECK (threshold >= 0.0 AND threshold <= 1.0),
    risk_category TEXT NOT NULL,
    risk_label TEXT NULL,
    summary_text TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    replaced_assessment_id UUID REFERENCES public.screening_assessments(id) ON DELETE SET NULL,
    input_availability JSONB DEFAULT '{}'::jsonb,
    input_features JSONB DEFAULT '{}'::jsonb,
    explanations JSONB DEFAULT '[]'::jsonb,
    limitations JSONB DEFAULT '[]'::jsonb,
    next_available_tier INTEGER NULL,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_screening_assessments_user_history
ON public.screening_assessments(user_id, module, created_at DESC);

-- Extension table for PCOS ultrasound features (PCOM, GradCAM, report link)
CREATE TABLE IF NOT EXISTS public.pcos_ultrasound_assessments (
    assessment_id UUID PRIMARY KEY REFERENCES public.screening_assessments(id) ON DELETE CASCADE,
    pcom_status TEXT NULL,
    pcom_probability NUMERIC NULL CHECK (pcom_probability IS NULL OR (pcom_probability >= 0.0 AND pcom_probability <= 1.0)),
    gradcam_url TEXT NULL,
    ultrasound_report_id UUID REFERENCES public.medical_reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Explicit Table Privileges (Zero direct browser writes)
REVOKE ALL ON public.screening_assessments FROM PUBLIC;
REVOKE ALL ON public.screening_assessments FROM anon;
REVOKE ALL ON public.screening_assessments FROM authenticated;
GRANT SELECT ON public.screening_assessments TO authenticated;

REVOKE ALL ON public.pcos_ultrasound_assessments FROM PUBLIC;
REVOKE ALL ON public.pcos_ultrasound_assessments FROM anon;
REVOKE ALL ON public.pcos_ultrasound_assessments FROM authenticated;
GRANT SELECT ON public.pcos_ultrasound_assessments TO authenticated;

-- 3. RLS Policies (Read-only for patients and permitted care circle)
ALTER TABLE public.screening_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcos_ultrasound_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own assessments" ON public.screening_assessments;
CREATE POLICY "Users can select own assessments"
    ON public.screening_assessments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted assessments" ON public.screening_assessments;
CREATE POLICY "Care circle members can select permitted assessments"
    ON public.screening_assessments FOR SELECT
    TO authenticated
    USING (public.has_care_circle_permission(user_id, 'reports'));

DROP POLICY IF EXISTS "Users can select own ultrasound assessments" ON public.pcos_ultrasound_assessments;
CREATE POLICY "Users can select own ultrasound assessments"
    ON public.pcos_ultrasound_assessments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.screening_assessments s
            WHERE s.id = pcos_ultrasound_assessments.assessment_id
              AND (s.user_id = auth.uid() OR public.has_care_circle_permission(s.user_id, 'reports'))
        )
    );

-- 4. Advisory Lock Save RPC (service_role only)
CREATE OR REPLACE FUNCTION public.save_screening_assessment(
    p_user_id UUID,
    p_module TEXT,
    p_assessment_level TEXT,
    p_tiers_included JSONB,
    p_model_name TEXT,
    p_model_version TEXT,
    p_probability NUMERIC,
    p_probability_percent NUMERIC,
    p_threshold NUMERIC,
    p_risk_category TEXT,
    p_risk_label TEXT,
    p_summary_text TEXT,
    p_input_availability JSONB,
    p_input_features JSONB,
    p_explanations JSONB,
    p_limitations JSONB,
    p_next_available_tier INTEGER,
    p_disclaimer TEXT,
    p_pcom_status TEXT DEFAULT NULL,
    p_pcom_probability NUMERIC DEFAULT NULL,
    p_gradcam_url TEXT DEFAULT NULL,
    p_ultrasound_report_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prev_id UUID;
    v_new_id UUID := gen_random_uuid();
    v_result JSONB;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text), hashtext(p_module));

    SELECT id INTO v_prev_id
    FROM public.screening_assessments
    WHERE user_id = p_user_id AND module = p_module AND is_active = TRUE
    FOR UPDATE;

    IF v_prev_id IS NOT NULL THEN
        UPDATE public.screening_assessments
        SET is_active = FALSE, updated_at = now()
        WHERE id = v_prev_id;
    END IF;

    INSERT INTO public.screening_assessments (
        id, user_id, module, assessment_level, tiers_included,
        model_name, model_version, probability, probability_percent,
        threshold, risk_category, risk_label, summary_text,
        is_active, replaced_assessment_id, input_availability,
        input_features, explanations, limitations,
        next_available_tier, disclaimer, created_at, updated_at
    )
    VALUES (
        v_new_id, p_user_id, p_module, p_assessment_level, p_tiers_included,
        p_model_name, p_model_version, p_probability, p_probability_percent,
        p_threshold, p_risk_category, p_risk_label, p_summary_text,
        TRUE, v_prev_id, p_input_availability,
        p_input_features, p_explanations, p_limitations,
        p_next_available_tier, p_disclaimer, now(), now()
    );

    IF p_module = 'female_pcos' AND (p_pcom_status IS NOT NULL OR p_pcom_probability IS NOT NULL OR p_gradcam_url IS NOT NULL OR p_ultrasound_report_id IS NOT NULL) THEN
        INSERT INTO public.pcos_ultrasound_assessments (
            assessment_id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id, created_at
        )
        VALUES (
            v_new_id, p_pcom_status, p_pcom_probability, p_gradcam_url, p_ultrasound_report_id, now()
        );
    END IF;

    SELECT to_jsonb(s.*) INTO v_result
    FROM public.screening_assessments s
    WHERE s.id = v_new_id;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_screening_assessment TO service_role;
REVOKE EXECUTE ON FUNCTION public.save_screening_assessment FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_screening_assessment FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.save_screening_assessment FROM anon;

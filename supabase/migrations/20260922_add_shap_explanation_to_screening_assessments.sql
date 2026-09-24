-- Migration: Add shap_explanation and longitudinal_shap_comparison to screening_assessments
-- File: supabase/migrations/20260922_add_shap_explanation_to_screening_assessments.sql

ALTER TABLE public.screening_assessments 
ADD COLUMN IF NOT EXISTS shap_explanation JSONB DEFAULT NULL;

ALTER TABLE public.screening_assessments 
ADD COLUMN IF NOT EXISTS longitudinal_shap_comparison JSONB DEFAULT NULL;

-- Update save_screening_assessment RPC to accept and persist shap_explanation
DROP FUNCTION IF EXISTS public.save_screening_assessment(
    UUID, TEXT, TEXT, JSONB, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, INTEGER, TEXT, TEXT, NUMERIC, TEXT, UUID
);

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
    p_ultrasound_report_id UUID DEFAULT NULL,
    p_shap_explanation JSONB DEFAULT NULL,
    p_longitudinal_shap_comparison JSONB DEFAULT NULL
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
        next_available_tier, disclaimer,
        shap_explanation, longitudinal_shap_comparison,
        created_at, updated_at
    )
    VALUES (
        v_new_id, p_user_id, p_module, p_assessment_level, p_tiers_included,
        p_model_name, p_model_version, p_probability, p_probability_percent,
        p_threshold, p_risk_category, p_risk_label, p_summary_text,
        TRUE, v_prev_id, p_input_availability,
        p_input_features, p_explanations, p_limitations,
        p_next_available_tier, p_disclaimer,
        p_shap_explanation, p_longitudinal_shap_comparison,
        now(), now()
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

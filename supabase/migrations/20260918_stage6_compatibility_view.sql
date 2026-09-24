-- Stage 9: DB Migration 6 — Atomic Legacy Migration, Table Lockdown & Compatibility View
-- Executed inside controlled write-free maintenance period (Stage 8)
BEGIN;

-- 1. Copy ALL legacy PCOS assessments into screening_assessments (preserving exact legacy UUID)
-- Pass 1: Insert all rows with replaced_assessment_id = NULL
INSERT INTO public.screening_assessments (
    id, user_id, module, assessment_level, tiers_included,
    model_name, model_version, probability, probability_percent,
    threshold, risk_category, risk_label, summary_text,
    is_active, replaced_assessment_id, input_availability,
    input_features, explanations, limitations,
    next_available_tier, disclaimer, created_at, updated_at
)
SELECT 
    id, user_id, 'female_pcos', assessment_level, tiers_included,
    model_name, model_version, probability, probability_percent,
    threshold, risk_category, NULL, NULL,
    is_active, NULL, input_availability,
    input_features, explanations, limitations,
    next_available_tier, disclaimer, created_at, updated_at
FROM public.pcos_assessments old;

-- Pass 2: Restore self-referencing replaced_assessment_id links
UPDATE public.screening_assessments s
SET replaced_assessment_id = old.replaced_assessment_id
FROM public.pcos_assessments old
WHERE s.id = old.id AND old.replaced_assessment_id IS NOT NULL;

-- Pass 3: Copy ultrasound extension data
INSERT INTO public.pcos_ultrasound_assessments (
    assessment_id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id, created_at
)
SELECT 
    id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id, created_at
FROM public.pcos_assessments
WHERE pcom_status IS NOT NULL OR pcom_probability IS NOT NULL OR gradcam_url IS NOT NULL OR ultrasound_report_id IS NOT NULL;

-- 2. Bidirectional Parity Verification (Gate Check)
DO $$
DECLARE
    v_missing INTEGER;
    v_extra INTEGER;
    v_us_missing INTEGER;
    v_us_extra INTEGER;
BEGIN
    SELECT count(*) INTO v_missing FROM (
        SELECT id, user_id, assessment_level, tiers_included, model_name, model_version,
               probability, probability_percent, threshold, risk_category,
               is_active, replaced_assessment_id, input_availability,
               input_features, explanations, limitations, next_available_tier,
               disclaimer, created_at, updated_at
        FROM public.pcos_assessments
        EXCEPT
        SELECT id, user_id, assessment_level, tiers_included, model_name, model_version,
               probability, probability_percent, threshold, risk_category,
               is_active, replaced_assessment_id, input_availability,
               input_features, explanations, limitations, next_available_tier,
               disclaimer, created_at, updated_at
        FROM public.screening_assessments WHERE module = 'female_pcos'
    ) d1;

    SELECT count(*) INTO v_extra FROM (
        SELECT id, user_id, assessment_level, tiers_included, model_name, model_version,
               probability, probability_percent, threshold, risk_category,
               is_active, replaced_assessment_id, input_availability,
               input_features, explanations, limitations, next_available_tier,
               disclaimer, created_at, updated_at
        FROM public.screening_assessments WHERE module = 'female_pcos'
        EXCEPT
        SELECT id, user_id, assessment_level, tiers_included, model_name, model_version,
               probability, probability_percent, threshold, risk_category,
               is_active, replaced_assessment_id, input_availability,
               input_features, explanations, limitations, next_available_tier,
               disclaimer, created_at, updated_at
        FROM public.pcos_assessments
    ) d2;

    SELECT count(*) INTO v_us_missing FROM (
        SELECT id AS assessment_id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id
        FROM public.pcos_assessments
        WHERE pcom_status IS NOT NULL OR pcom_probability IS NOT NULL OR gradcam_url IS NOT NULL OR ultrasound_report_id IS NOT NULL
        EXCEPT
        SELECT assessment_id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id
        FROM public.pcos_ultrasound_assessments
    ) ud1;

    SELECT count(*) INTO v_us_extra FROM (
        SELECT assessment_id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id
        FROM public.pcos_ultrasound_assessments
        EXCEPT
        SELECT id AS assessment_id, pcom_status, pcom_probability, gradcam_url, ultrasound_report_id
        FROM public.pcos_assessments
        WHERE pcom_status IS NOT NULL OR pcom_probability IS NOT NULL OR gradcam_url IS NOT NULL OR ultrasound_report_id IS NOT NULL
    ) ud2;

    IF v_missing > 0 OR v_extra > 0 OR v_us_missing > 0 OR v_us_extra > 0 THEN
        RAISE EXCEPTION 'Parity Verification FAILED: missing=%, extra=%, us_missing=%, us_extra=%', v_missing, v_extra, v_us_missing, v_us_extra;
    END IF;

    RAISE NOTICE 'Parity Verification PASSED: 100%% bidirectional row-by-row parity verified.';
END;
$$;

-- 3. Assert active assessment invariant before applying index
DO $$
DECLARE
    v_active_conflicts INTEGER;
BEGIN
    SELECT count(*) INTO v_active_conflicts
    FROM (
        SELECT user_id
        FROM public.screening_assessments
        WHERE is_active = TRUE
        GROUP BY user_id, module
        HAVING count(*) > 1
    ) c;

    IF v_active_conflicts > 0 THEN
        RAISE EXCEPTION 'Stage 9 ABORTED: % users have multiple active assessments. Manual chain review required.', v_active_conflicts;
    END IF;
END;
$$;

-- 4. Rename physical table
ALTER TABLE public.pcos_assessments RENAME TO pcos_assessments_legacy;

ALTER INDEX IF EXISTS idx_pcos_assessments_user_active RENAME TO idx_pcos_assessments_user_active_legacy;
ALTER INDEX IF EXISTS idx_pcos_assessments_user_created RENAME TO idx_pcos_assessments_user_created_legacy;
ALTER INDEX IF EXISTS idx_pcos_assessments_level RENAME TO idx_pcos_assessments_level_legacy;

-- 5. Lock down physical legacy table completely
REVOKE ALL ON public.pcos_assessments_legacy FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Users can select own pcos assessments" ON public.pcos_assessments_legacy;
DROP POLICY IF EXISTS "Users can insert own pcos assessments" ON public.pcos_assessments_legacy;
DROP POLICY IF EXISTS "Users can update own pcos assessments" ON public.pcos_assessments_legacy;
DROP POLICY IF EXISTS "Care circle members can select permitted pcos assessments" ON public.pcos_assessments_legacy;
GRANT SELECT ON public.pcos_assessments_legacy TO service_role;

-- 6. Apply active assessment unique index now that data is verified
CREATE UNIQUE INDEX IF NOT EXISTS idx_screening_assessments_one_active
ON public.screening_assessments(user_id, module)
WHERE is_active = TRUE;

-- 7. Create secure compatibility view with exact 24 legacy columns
CREATE OR REPLACE VIEW public.pcos_assessments
WITH (security_invoker = on)
AS
SELECT
    s.id,
    s.user_id,
    s.assessment_level,
    s.tiers_included,
    s.model_name,
    s.model_version,
    s.probability,
    s.probability_percent,
    s.threshold,
    s.risk_category,
    s.is_active,
    s.replaced_assessment_id,
    s.input_availability,
    s.input_features,
    s.explanations,
    s.limitations,
    s.next_available_tier,
    u.pcom_status,
    u.pcom_probability,
    u.gradcam_url,
    u.ultrasound_report_id,
    s.disclaimer,
    s.created_at,
    s.updated_at
FROM public.screening_assessments s
LEFT JOIN public.pcos_ultrasound_assessments u ON u.assessment_id = s.id
WHERE s.module = 'female_pcos';

REVOKE INSERT, UPDATE, DELETE ON public.pcos_assessments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pcos_assessments TO authenticated;

COMMIT;

-- Migration: 20260918_stage7_integrity_constraints.sql
-- BioPulse AI Architecture Revision 6.1 — Stages 13 & 14
-- Applies clinical data integrity constraints, removes unsafe appointment defaults,
-- enforces deduplication/uniqueness, and drops deprecated provider RPC.

BEGIN;

-- 1. Medication dose uniqueness / duplicate slot safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_logs_unique_slot 
ON public.medication_logs(medication_id, scheduled_for, scheduled_time);

-- 2. Care circle active-membership uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_care_circle_unique_active_member 
ON public.care_circle_members(patient_id, member_user_id) 
WHERE status = 'active' AND member_user_id IS NOT NULL;

-- 3. Appointment default removal (no fabricated gynecology specialty or arbitrary default times)
ALTER TABLE public.appointments ALTER COLUMN provider_specialty DROP DEFAULT;
ALTER TABLE public.appointments ALTER COLUMN scheduled_date DROP DEFAULT;
ALTER TABLE public.appointments ALTER COLUMN scheduled_time DROP DEFAULT;
ALTER TABLE public.appointments ALTER COLUMN location DROP DEFAULT;

-- 4. Cycle record date constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_cycle_period_dates'
    ) THEN
        ALTER TABLE public.cycle_records 
        ADD CONSTRAINT chk_cycle_period_dates 
        CHECK (period_end_date IS NULL OR period_end_date >= period_start_date);
    END IF;
END $$;

-- 5. OCR confidence range constraint (on report_results.ocr_confidence)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_report_results_confidence'
    ) THEN
        ALTER TABLE public.report_results 
        ADD CONSTRAINT chk_report_results_confidence 
        CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0.0 AND ocr_confidence <= 1.0));
    END IF;
END $$;

-- 6. Stage 14: Final Legacy Provider-RPC Cleanup
DROP FUNCTION IF EXISTS public.get_care_provider_view(TEXT);

COMMIT;

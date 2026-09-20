-- ============================================================================
-- Migration: Stage 4 - Retire Legacy Provider RPC Client Access
-- File: supabase/migrations/20260918_stage4_retire_legacy_provider_rpc.sql
-- Description: Revokes public, anon, and authenticated access to get_care_provider_view(TEXT)
--              if it exists.
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_care_provider_view'
    ) THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.get_care_provider_view(TEXT) FROM PUBLIC, anon, authenticated';
    END IF;
END $$;

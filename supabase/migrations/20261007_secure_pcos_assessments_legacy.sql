-- Migration: Secure Legacy PCOS Assessments Table
-- Date: 2026-10-07
-- Description:
-- Enables and forces Row Level Security (RLS) on public.pcos_assessments_legacy.
-- Revokes all permissions from PUBLIC, anon, and authenticated roles to guarantee
-- that deprecated legacy assessment records are completely inaccessible via client APIs.
-- Authoritative assessments reside strictly in public.screening_assessments.

-- 1. Enable Row Level Security
ALTER TABLE public.pcos_assessments_legacy ENABLE ROW LEVEL SECURITY;

-- 2. Force Row Level Security (ensures RLS applies unconditionally)
ALTER TABLE public.pcos_assessments_legacy FORCE ROW LEVEL SECURITY;

-- 3. Revoke all permissions from untrusted roles
REVOKE ALL ON public.pcos_assessments_legacy FROM PUBLIC, anon, authenticated;

-- 4. Retain read-only access strictly for backend service_role if needed for archival
GRANT SELECT ON public.pcos_assessments_legacy TO service_role;

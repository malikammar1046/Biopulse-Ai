-- 20260918_stage1_schema_additions.sql
-- Stage 2: Schema Additions for Identity Link, Profiles, and Canonical Biomarkers

-- 1. Add identity link to care circle members
ALTER TABLE public.care_circle_members
ADD COLUMN IF NOT EXISTS member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_care_circle_members_user_id ON public.care_circle_members(member_user_id);

-- 2. Add audit-preserving member_id foreign key to care_circle_invitations
ALTER TABLE public.care_circle_invitations
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.care_circle_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_care_circle_invitations_member_id ON public.care_circle_invitations(member_id);

-- Harmonize invitation columns to support both code and legacy schema
ALTER TABLE public.care_circle_invitations
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS member_name TEXT,
ADD COLUMN IF NOT EXISTS invite_email TEXT;

UPDATE public.care_circle_invitations
SET 
  token = COALESCE(token, invite_token),
  member_name = COALESCE(member_name, invitee_name),
  invite_email = COALESCE(invite_email, invitee_email);

-- Backfill existing invitations with member_id
UPDATE public.care_circle_invitations i
SET member_id = m.id
FROM public.care_circle_members m
WHERE (i.invite_token = m.invite_token OR i.token = m.invite_token)
  AND i.patient_id = m.patient_id 
  AND i.member_id IS NULL;

-- 3. Formalize profile gender and pathway
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS pathway TEXT CHECK (pathway IN ('female', 'male', 'general'));

-- 4. Add canonical biomarker code
ALTER TABLE public.report_results
ADD COLUMN IF NOT EXISTS canonical_code TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_report_results_canonical ON public.report_results(canonical_code);

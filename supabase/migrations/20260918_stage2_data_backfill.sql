-- 20260918_stage2_data_backfill.sql
-- Stage 3: Deterministic Data Backfill for Profiles and Care Circle Members

-- Step 1: Sanitized Profile Backfill from Auth Metadata
UPDATE public.profiles p
SET 
  gender = COALESCE(
      p.gender,
      CASE WHEN LOWER(u.raw_user_meta_data->>'gender') IN ('female', 'male', 'other', 'prefer_not_to_say') 
           THEN LOWER(u.raw_user_meta_data->>'gender') ELSE NULL END
  ),
  pathway = COALESCE(
      p.pathway,
      CASE WHEN LOWER(u.raw_user_meta_data->>'pathway') IN ('female', 'male', 'general') 
           THEN LOWER(u.raw_user_meta_data->>'pathway') ELSE NULL END
  )
FROM auth.users u
WHERE p.id = u.id AND (p.gender IS NULL OR p.pathway IS NULL);

-- Step 2: Pathway-only backfill from single-module clinical state (NEVER gender)
WITH single_module_users AS (
    SELECT user_id, max(module) AS single_module
    FROM public.patient_clinical_state
    GROUP BY user_id
    HAVING count(DISTINCT module) = 1
)
UPDATE public.profiles p
SET pathway = CASE WHEN sm.single_module = 'male_hypogonadism' THEN 'male' ELSE 'female' END
FROM single_module_users sm
WHERE p.id = sm.user_id AND p.pathway IS NULL;

-- Step 3: Pathway-only backfill from cycle records (NEVER gender)
UPDATE public.profiles p
SET pathway = 'female'
WHERE p.pathway IS NULL
  AND EXISTS (SELECT 1 FROM public.cycle_records c WHERE c.user_id = p.id);

-- Step 4: Deterministic Existing-Member Identity Backfill
DO $$
DECLARE
    v_total INTEGER;
    v_linked INTEGER;
    v_unresolved INTEGER;
BEGIN
    SELECT count(*) INTO v_total FROM public.care_circle_members WHERE status = 'active';

    WITH unambiguous_matches AS (
        SELECT m.id AS member_id, u.id AS matched_user_id
        FROM public.care_circle_members m
        JOIN auth.users u ON LOWER(m.member_email) = LOWER(u.email)
        WHERE m.member_user_id IS NULL
          AND m.status = 'active'
          AND (SELECT count(*) FROM auth.users u2 WHERE LOWER(u2.email) = LOWER(m.member_email)) = 1
          AND (SELECT count(*) FROM public.care_circle_members m2 
               WHERE m2.patient_id = m.patient_id AND LOWER(m2.member_email) = LOWER(m.member_email) AND m2.status = 'active') = 1
    )
    UPDATE public.care_circle_members m
    SET member_user_id = um.matched_user_id, updated_at = now()
    FROM unambiguous_matches um
    WHERE m.id = um.member_id;

    SELECT count(*) INTO v_linked FROM public.care_circle_members WHERE member_user_id IS NOT NULL AND status = 'active';
    v_unresolved := v_total - v_linked;

    RAISE NOTICE 'Care Circle Backfill: total active=%, linked=%, unresolved=%', v_total, v_linked, v_unresolved;
END;
$$;

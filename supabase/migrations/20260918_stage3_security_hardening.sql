-- 20260918_stage3_security_hardening.sql
-- Stage 4: Security Hardening for Identity Authorization, Invitation RPCs, and handle_new_user

-- 1. Identity-only authorization function
CREATE OR REPLACE FUNCTION public.has_care_circle_permission(
  p_patient_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_has_access BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM public.care_circle_members m
    JOIN public.care_circle_permissions p ON p.member_id = m.id
    WHERE m.patient_id = p_patient_id
      AND m.member_user_id = v_uid
      AND m.status = 'active'
      AND p.permission_key = p_permission_key
      AND p.enabled = TRUE
  ) INTO v_has_access;

  RETURN COALESCE(v_has_access, FALSE);
END;
$$;

-- 2. Non-clinical public invitation metadata query
CREATE OR REPLACE FUNCTION public.get_care_invitation_info(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN jsonb_build_object('isValid', false, 'error', 'Invalid invitation token');
  END IF;

  SELECT id, patient_id, 
         COALESCE(member_name, invitee_name) AS member_name, 
         role, relationship, status, expires_at
  INTO v_inv
  FROM public.care_circle_invitations
  WHERE token = p_token OR invite_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('isValid', false, 'error', 'Invitation not found');
  END IF;

  IF v_inv.status != 'pending' THEN
    RETURN jsonb_build_object('isValid', false, 'error', 'Invitation is already ' || v_inv.status);
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('isValid', false, 'error', 'Invitation has expired');
  END IF;

  RETURN jsonb_build_object(
    'isValid', true,
    'role', v_inv.role,
    'relationship', v_inv.relationship,
    'memberName', v_inv.member_name,
    'status', v_inv.status,
    'expiresAt', v_inv.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_care_invitation_info(TEXT) TO authenticated, anon;

-- 3. Authenticated invitation claim bound to invited email
CREATE OR REPLACE FUNCTION public.accept_care_circle_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inv RECORD;
  v_member RECORD;
  v_caller_uid UUID;
  v_caller_email TEXT;
BEGIN
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to accept care circle invitations.';
  END IF;

  v_caller_email := LOWER(COALESCE(auth.jwt()->>'email', ''));

  SELECT * INTO v_inv
  FROM public.care_circle_invitations
  WHERE (token = p_token OR invite_token = p_token) 
    AND status = 'pending' 
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
  END IF;

  IF LOWER(COALESCE(v_inv.invite_email, v_inv.invitee_email)) != v_caller_email THEN
    RAISE EXCEPTION 'Unauthorized: This invitation was issued to %, but you are signed in as %.', 
      COALESCE(v_inv.invite_email, v_inv.invitee_email), v_caller_email;
  END IF;

  SELECT * INTO v_member
  FROM public.care_circle_members
  WHERE (id = v_inv.member_id OR invite_token = p_token)
    AND patient_id = v_inv.patient_id
    AND status = 'pending'
    AND LOWER(member_email) = v_caller_email
    AND role = v_inv.role
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending care circle member record not found or already processed.';
  END IF;

  UPDATE public.care_circle_members
  SET member_user_id = v_caller_uid,
      status = 'active',
      updated_at = now()
  WHERE id = v_member.id;

  UPDATE public.care_circle_invitations
  SET status = 'accepted'
  WHERE id = v_inv.id;

  RETURN jsonb_build_object('success', true, 'memberId', v_member.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_care_circle_invitation(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_care_circle_invitation(TEXT) FROM anon, PUBLIC;

-- 4. Harden handle_new_user() (FIX NOW)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, date_of_birth, gender, pathway, created_at, updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' != '' 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE ELSE NULL 
    END,
    CASE 
      WHEN LOWER(NEW.raw_user_meta_data->>'gender') IN ('female', 'male', 'other', 'prefer_not_to_say')
      THEN LOWER(NEW.raw_user_meta_data->>'gender') ELSE NULL
    END,
    CASE 
      WHEN LOWER(NEW.raw_user_meta_data->>'pathway') IN ('female', 'male', 'general')
      THEN LOWER(NEW.raw_user_meta_data->>'pathway') ELSE NULL
    END,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

-- 5. Member-side SELECT RLS policies
DROP POLICY IF EXISTS "Members can select own membership rows" ON public.care_circle_members;
CREATE POLICY "Members can select own membership rows"
  ON public.care_circle_members FOR SELECT
  TO authenticated
  USING (auth.uid() = member_user_id);

DROP POLICY IF EXISTS "Members can select own permissions" ON public.care_circle_permissions;
CREATE POLICY "Members can select own permissions"
  ON public.care_circle_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circle_members m
      WHERE m.id = care_circle_permissions.member_id
        AND m.member_user_id = auth.uid()
    )
  );

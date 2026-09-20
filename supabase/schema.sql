-- ==============================================================================
-- OvaSense: Supabase Database Schema
-- Table: public.profiles
-- Row Level Security (RLS) & Triggers
-- ==============================================================================

-- 1. Create profiles table linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information & Biometrics
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  date_of_birth DATE,
  avatar_url TEXT DEFAULT '',
  height_cm NUMERIC,
  weight_kg NUMERIC,
  
  -- Emergency Contacts (Array of { id, name, relationship, phone, isPrimary })
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  
  -- Medical History & Baseline
  blood_type TEXT DEFAULT '',
  allergies JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  surgeries JSONB DEFAULT '[]'::jsonb,
  family_history JSONB DEFAULT '[]'::jsonb,
  
  -- Women's Health & Reproductive Health (ML Indicators)
  cycle_length TEXT DEFAULT '28', -- supports number or 'irregular'
  period_duration INTEGER DEFAULT 5,
  last_period_date DATE,
  period_regularity TEXT DEFAULT 'mostly_regular',
  common_symptoms JSONB DEFAULT '[]'::jsonb,
  marital_status TEXT DEFAULT 'unmarried',
  marriage_years NUMERIC DEFAULT 0,
  is_pregnant BOOLEAN DEFAULT FALSE,
  abortions_count INTEGER DEFAULT 0,
  
  -- Lifestyle & Nutrition (ML Indicators)
  dietary_preference TEXT DEFAULT 'Balanced',
  fast_food_intake TEXT DEFAULT 'occasional',
  regular_exercise BOOLEAN DEFAULT TRUE,
  daily_water_glasses INTEGER DEFAULT 8,
  activity_level TEXT DEFAULT 'moderate',
  exercise_preferences JSONB DEFAULT '[]'::jsonb,
  sleep_hours NUMERIC DEFAULT 7.5,
  work_lifestyle TEXT DEFAULT '',
  
  -- Health Goals & Coaching
  selected_goals JSONB DEFAULT '[]'::jsonb,
  support_preference TEXT DEFAULT 'gentle_nudges',
  
  -- Onboarding Completion Flag
  is_onboarded BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for fast user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_onboarded ON public.profiles(is_onboarded);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Authenticated users can ONLY SELECT, INSERT, and UPDATE their own record
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Trigger Function to automatically create or initialize profile row upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    date_of_birth,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' != '' 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE 
      ELSE NULL 
    END,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- Table: public.cycle_records
-- Description: Stores authenticated user's menstrual period and cycle entries.
-- ==============================================================================

-- 7. Create cycle_records table
CREATE TABLE IF NOT EXISTS public.cycle_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  flow TEXT NOT NULL CHECK (flow IN ('light', 'medium', 'heavy')),
  symptoms JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Indexes for performance on user lookup and chronological sorting
CREATE INDEX IF NOT EXISTS idx_cycle_records_user_id ON public.cycle_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_records_user_start_date ON public.cycle_records(user_id, period_start_date DESC);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.cycle_records ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies: Authenticated users can ONLY SELECT, INSERT, UPDATE, and DELETE their own records
DROP POLICY IF EXISTS "Users can select own cycle records" ON public.cycle_records;
CREATE POLICY "Users can select own cycle records"
  ON public.cycle_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cycle records" ON public.cycle_records;
CREATE POLICY "Users can insert own cycle records"
  ON public.cycle_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cycle records" ON public.cycle_records;
CREATE POLICY "Users can update own cycle records"
  ON public.cycle_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cycle records" ON public.cycle_records;
CREATE POLICY "Users can delete own cycle records"
  ON public.cycle_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- Table: public.symptom_records
-- Description: Stores authenticated user's logged symptoms and severity observations.
-- ==============================================================================

-- 11. Create symptom_records table
CREATE TABLE IF NOT EXISTS public.symptom_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom_type TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  occurred_at DATE NOT NULL,
  cycle_day INTEGER NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Indexes for performance on user lookup and chronological sorting
CREATE INDEX IF NOT EXISTS idx_symptom_records_user_id ON public.symptom_records(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_records_user_occurred_at ON public.symptom_records(user_id, occurred_at DESC);

-- 13. Enable Row Level Security (RLS)
ALTER TABLE public.symptom_records ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies: Authenticated users can ONLY SELECT, INSERT, UPDATE, and DELETE their own records
DROP POLICY IF EXISTS "Users can select own symptom records" ON public.symptom_records;
CREATE POLICY "Users can select own symptom records"
  ON public.symptom_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own symptom records" ON public.symptom_records;
CREATE POLICY "Users can insert own symptom records"
  ON public.symptom_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own symptom records" ON public.symptom_records;
CREATE POLICY "Users can update own symptom records"
  ON public.symptom_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own symptom records" ON public.symptom_records;
CREATE POLICY "Users can delete own symptom records"
  ON public.symptom_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- Table: public.medical_reports
-- Description: Stores metadata for uploaded lab and ultrasound documents.
-- ==============================================================================

-- 15. Create medical_reports table
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_date DATE NOT NULL,
  file_path TEXT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'needs_verification' CHECK (status IN ('processing', 'needs_verification', 'verified')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON public.medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_date ON public.medical_reports(user_id, report_date DESC);

-- 17. Enable Row Level Security (RLS)
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

-- 18. RLS Policies for medical_reports
DROP POLICY IF EXISTS "Users can select own medical reports" ON public.medical_reports;
CREATE POLICY "Users can select own medical reports"
  ON public.medical_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own medical reports" ON public.medical_reports;
CREATE POLICY "Users can insert own medical reports"
  ON public.medical_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medical reports" ON public.medical_reports;
CREATE POLICY "Users can update own medical reports"
  ON public.medical_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own medical reports" ON public.medical_reports;
CREATE POLICY "Users can delete own medical reports"
  ON public.medical_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- Table: public.report_results
-- Description: Stores extracted and verified biomarker values from medical reports.
-- ==============================================================================

-- 19. Create report_results table
CREATE TABLE IF NOT EXISTS public.report_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  result_value TEXT NOT NULL,
  result_numeric NUMERIC NULL,
  unit TEXT NOT NULL,
  reference_range TEXT DEFAULT '',
  reference_low NUMERIC NULL,
  reference_high NUMERIC NULL,
  status TEXT NOT NULL CHECK (status IN ('within_range', 'outside_range', 'needs_review', 'insufficient_info')),
  ocr_confidence NUMERIC DEFAULT 0.95,
  user_verified BOOLEAN DEFAULT false,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Indexes for report_results
CREATE INDEX IF NOT EXISTS idx_report_results_report_id ON public.report_results(report_id);
CREATE INDEX IF NOT EXISTS idx_report_results_test_name ON public.report_results(test_name);

-- 21. Enable Row Level Security (RLS)
ALTER TABLE public.report_results ENABLE ROW LEVEL SECURITY;

-- 22. RLS Policies for report_results (joined via parent medical_reports user_id)
DROP POLICY IF EXISTS "Users can select own report results" ON public.report_results;
CREATE POLICY "Users can select own report results"
  ON public.report_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_reports
      WHERE medical_reports.id = report_results.report_id
      AND medical_reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own report results" ON public.report_results;
CREATE POLICY "Users can insert own report results"
  ON public.report_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_reports
      WHERE medical_reports.id = report_results.report_id
      AND medical_reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own report results" ON public.report_results;
CREATE POLICY "Users can update own report results"
  ON public.report_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_reports
      WHERE medical_reports.id = report_results.report_id
      AND medical_reports.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_reports
      WHERE medical_reports.id = report_results.report_id
      AND medical_reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own report results" ON public.report_results;
CREATE POLICY "Users can delete own report results"
  ON public.report_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_reports
      WHERE medical_reports.id = report_results.report_id
      AND medical_reports.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- Supabase Storage: Bucket 'medical-reports' & Secure Storage Policies
-- ==============================================================================

-- 22b. Create private bucket for medical reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-reports',
  'medical-reports',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated users can upload files into their own user_id folder
DROP POLICY IF EXISTS "Users can upload own medical reports" ON storage.objects;
CREATE POLICY "Users can upload own medical reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'medical-reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Authenticated users can read their own medical reports
DROP POLICY IF EXISTS "Users can select own medical reports storage" ON storage.objects;
CREATE POLICY "Users can select own medical reports storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'medical-reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Authenticated users can update their own medical reports
DROP POLICY IF EXISTS "Users can update own medical reports storage" ON storage.objects;
CREATE POLICY "Users can update own medical reports storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'medical-reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'medical-reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Authenticated users can delete their own medical reports
DROP POLICY IF EXISTS "Users can delete own medical reports storage" ON storage.objects;
CREATE POLICY "Users can delete own medical reports storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'medical-reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
-- ==============================================================================
-- Table: public.care_circle_members
-- Description: Stores invited and connected care circle members (doctors, family, trusted persons)
-- ==============================================================================

-- 23. Create care_circle_members table
CREATE TABLE IF NOT EXISTS public.care_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  member_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'family', 'trusted_person')),
  relationship TEXT NOT NULL DEFAULT '',
  clinic_organization TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'revoked')) DEFAULT 'pending',
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  last_viewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 24. Indexes for care_circle_members
CREATE INDEX IF NOT EXISTS idx_care_circle_members_patient_id ON public.care_circle_members(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_circle_members_email ON public.care_circle_members(member_email);
CREATE INDEX IF NOT EXISTS idx_care_circle_members_token ON public.care_circle_members(invite_token);
CREATE INDEX IF NOT EXISTS idx_care_circle_members_status ON public.care_circle_members(patient_id, status);

-- 25. Enable Row Level Security (RLS)
ALTER TABLE public.care_circle_members ENABLE ROW LEVEL SECURITY;

-- 26. RLS Policies for care_circle_members (Patient full control)
DROP POLICY IF EXISTS "Patients can select own care circle members" ON public.care_circle_members;
CREATE POLICY "Patients can select own care circle members"
  ON public.care_circle_members FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can insert own care circle members" ON public.care_circle_members;
CREATE POLICY "Patients can insert own care circle members"
  ON public.care_circle_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can update own care circle members" ON public.care_circle_members;
CREATE POLICY "Patients can update own care circle members"
  ON public.care_circle_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can delete own care circle members" ON public.care_circle_members;
CREATE POLICY "Patients can delete own care circle members"
  ON public.care_circle_members FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- ==============================================================================
-- Table: public.care_circle_permissions
-- Description: Stores granular permission flags granted to a specific care circle member
-- ==============================================================================

-- 27. Create care_circle_permissions table
CREATE TABLE IF NOT EXISTS public.care_circle_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.care_circle_members(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(member_id, permission_key)
);

-- 28. Indexes for care_circle_permissions
CREATE INDEX IF NOT EXISTS idx_care_circle_permissions_member ON public.care_circle_permissions(member_id);
CREATE INDEX IF NOT EXISTS idx_care_circle_permissions_key ON public.care_circle_permissions(member_id, permission_key);

-- 29. Enable Row Level Security (RLS)
ALTER TABLE public.care_circle_permissions ENABLE ROW LEVEL SECURITY;

-- 30. RLS Policies for care_circle_permissions
DROP POLICY IF EXISTS "Patients can manage own care circle permissions" ON public.care_circle_permissions;
CREATE POLICY "Patients can manage own care circle permissions"
  ON public.care_circle_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circle_members
      WHERE care_circle_members.id = care_circle_permissions.member_id
      AND care_circle_members.patient_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_circle_members
      WHERE care_circle_members.id = care_circle_permissions.member_id
      AND care_circle_members.patient_id = auth.uid()
    )
  );

-- ==============================================================================
-- Table: public.care_circle_invitations
-- Description: Stores pending invitations for doctors and family members
-- ==============================================================================

-- 31. Create care_circle_invitations table
CREATE TABLE IF NOT EXISTS public.care_circle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_email TEXT NOT NULL,
  member_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'family', 'trusted_person')),
  relationship TEXT DEFAULT '',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now() + interval '30 days') NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 32. Indexes for care_circle_invitations
CREATE INDEX IF NOT EXISTS idx_care_invitations_patient_id ON public.care_circle_invitations(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_invitations_token ON public.care_circle_invitations(token);
CREATE INDEX IF NOT EXISTS idx_care_invitations_email ON public.care_circle_invitations(invite_email);

-- 33. Enable Row Level Security (RLS)
ALTER TABLE public.care_circle_invitations ENABLE ROW LEVEL SECURITY;

-- 34. RLS Policies for care_circle_invitations
DROP POLICY IF EXISTS "Patients can select own invitations" ON public.care_circle_invitations;
CREATE POLICY "Patients can select own invitations"
  ON public.care_circle_invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can insert own invitations" ON public.care_circle_invitations;
CREATE POLICY "Patients can insert own invitations"
  ON public.care_circle_invitations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can update own invitations" ON public.care_circle_invitations;
CREATE POLICY "Patients can update own invitations"
  ON public.care_circle_invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can delete own invitations" ON public.care_circle_invitations;
CREATE POLICY "Patients can delete own invitations"
  ON public.care_circle_invitations FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- ==============================================================================
-- Table: public.weekly_health_summaries
-- Description: Stores automatically synthesized weekly health overviews for care review
-- ==============================================================================

-- 35. Create weekly_health_summaries table
CREATE TABLE IF NOT EXISTS public.weekly_health_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(patient_id, week_start, week_end)
);

-- 36. Indexes for weekly_health_summaries
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_patient ON public.weekly_health_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_dates ON public.weekly_health_summaries(patient_id, week_start DESC);

-- 37. Enable Row Level Security (RLS)
ALTER TABLE public.weekly_health_summaries ENABLE ROW LEVEL SECURITY;

-- 38. RLS Policies for weekly_health_summaries
DROP POLICY IF EXISTS "Patients can select own weekly summaries" ON public.weekly_health_summaries;
CREATE POLICY "Patients can select own weekly summaries"
  ON public.weekly_health_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can insert own weekly summaries" ON public.weekly_health_summaries;
CREATE POLICY "Patients can insert own weekly summaries"
  ON public.weekly_health_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can update own weekly summaries" ON public.weekly_health_summaries;
CREATE POLICY "Patients can update own weekly summaries"
  ON public.weekly_health_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ==============================================================================
-- Security Helper Functions & Granular Care Provider RLS Access
-- ==============================================================================

-- 39. Function to verify if a given email/user has active permission for a patient
CREATE OR REPLACE FUNCTION public.has_care_circle_permission(
  p_patient_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_email TEXT;
  v_has_access BOOLEAN;
BEGIN
  -- Get current authenticated user's email from JWT
  v_user_email := auth.jwt()->>'email';
  IF v_user_email IS NULL OR v_user_email = '' THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM public.care_circle_members m
    JOIN public.care_circle_permissions p ON p.member_id = m.id
    WHERE m.patient_id = p_patient_id
      AND LOWER(m.member_email) = LOWER(v_user_email)
      AND m.status = 'active'
      AND p.permission_key = p_permission_key
      AND p.enabled = TRUE
  ) INTO v_has_access;

  RETURN COALESCE(v_has_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 40. Care Provider SELECT policy for cycle_records (when 'cycle' permission enabled)
DROP POLICY IF EXISTS "Care circle members can select permitted cycle records" ON public.cycle_records;
CREATE POLICY "Care circle members can select permitted cycle records"
  ON public.cycle_records FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'cycle')
  );

-- 41. Care Provider SELECT policy for symptom_records (when 'symptoms' permission enabled)
DROP POLICY IF EXISTS "Care circle members can select permitted symptom records" ON public.symptom_records;
CREATE POLICY "Care circle members can select permitted symptom records"
  ON public.symptom_records FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'symptoms')
  );

-- 42. Care Provider SELECT policy for medical_reports (when 'reports' permission enabled)
DROP POLICY IF EXISTS "Care circle members can select permitted medical reports" ON public.medical_reports;
CREATE POLICY "Care circle members can select permitted medical reports"
  ON public.medical_reports FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'reports')
  );

-- 43. Care Provider SELECT policy for report_results (when 'reports' permission enabled)
DROP POLICY IF EXISTS "Care circle members can select permitted report results" ON public.report_results;
CREATE POLICY "Care circle members can select permitted report results"
  ON public.report_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_reports mr
      WHERE mr.id = report_results.report_id
      AND public.has_care_circle_permission(mr.user_id, 'reports')
    )
  );

-- 44. Care Provider SELECT policy for weekly_health_summaries (when 'weekly_summary' permission enabled)
DROP POLICY IF EXISTS "Care circle members can select permitted weekly summaries" ON public.weekly_health_summaries;
CREATE POLICY "Care circle members can select permitted weekly summaries"
  ON public.weekly_health_summaries FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(patient_id, 'weekly_summary')
  );

-- ==============================================================================
-- Module: Diet & Nutrition (food_logs, water_logs, meal_plans)
-- ==============================================================================

-- 45. Food Logs Table
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner')),
  food_name TEXT NOT NULL,
  serving TEXT NOT NULL DEFAULT '1 serving',
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  fiber_g NUMERIC NOT NULL DEFAULT 0,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 46. Water Logs Table
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses INTEGER NOT NULL DEFAULT 0,
  target_glasses INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- 47. Meal Plans Table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 48. Indexes for Food, Water & Meal Plans
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON public.meal_plans(user_id, date);

-- 49. Enable RLS on Diet Tables
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- 50. RLS Policies: food_logs
DROP POLICY IF EXISTS "Users can manage own food logs" ON public.food_logs;
CREATE POLICY "Users can manage own food logs"
  ON public.food_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted food logs" ON public.food_logs;
CREATE POLICY "Care circle members can select permitted food logs"
  ON public.food_logs FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'diet')
  );

-- 51. RLS Policies: water_logs
DROP POLICY IF EXISTS "Users can manage own water logs" ON public.water_logs;
CREATE POLICY "Users can manage own water logs"
  ON public.water_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted water logs" ON public.water_logs;
CREATE POLICY "Care circle members can select permitted water logs"
  ON public.water_logs FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'diet')
  );

-- 52. RLS Policies: meal_plans
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage own meal plans"
  ON public.meal_plans FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted meal plans" ON public.meal_plans;
CREATE POLICY "Care circle members can select permitted meal plans"
  ON public.meal_plans FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'diet')
  );

-- ==============================================================================
-- Module: Fitness & Movement (fitness_logs)
-- ==============================================================================

-- 53. Fitness Logs Table
CREATE TABLE IF NOT EXISTS public.fitness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('walking', 'strength', 'yoga', 'stretching', 'cycling', 'low_impact_cardio', 'mobility', 'rest_recovery', 'other')),
  activity_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  energy_level TEXT CHECK (energy_level IN ('low_energy', 'okay', 'good', 'great')),
  notes TEXT DEFAULT '',
  occurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 54. Indexes for Fitness Logs
CREATE INDEX IF NOT EXISTS idx_fitness_logs_user_occurred ON public.fitness_logs(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_logs_activity_type ON public.fitness_logs(user_id, activity_type);

-- 55. Enable RLS on fitness_logs
ALTER TABLE public.fitness_logs ENABLE ROW LEVEL SECURITY;

-- 56. RLS Policies: fitness_logs
DROP POLICY IF EXISTS "Users can manage own fitness logs" ON public.fitness_logs;
CREATE POLICY "Users can manage own fitness logs"
  ON public.fitness_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted fitness logs" ON public.fitness_logs;
CREATE POLICY "Care circle members can select permitted fitness logs"
  ON public.fitness_logs FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'fitness')
  );

-- ==============================================================================
-- Module: Medications & Adherence (medications & medication_logs)
-- ==============================================================================

-- 57. Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mg',
  frequency TEXT NOT NULL CHECK (frequency IN ('once_daily', 'twice_daily', 'three_times_daily', 'every_other_day', 'as_needed')),
  scheduled_times JSONB NOT NULL DEFAULT '["08:00"]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 58. Medication Logs Table (Daily Doses Tracked)
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TEXT NOT NULL DEFAULT '08:00',
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'missed', 'pending')),
  taken_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 59. Indexes for Medications & Logs
CREATE INDEX IF NOT EXISTS idx_medications_user_active ON public.medications(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date ON public.medication_logs(user_id, scheduled_for DESC);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);

-- 60. Enable RLS on medications and medication_logs
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- 61. RLS Policies: medications
DROP POLICY IF EXISTS "Users can manage own medications" ON public.medications;
CREATE POLICY "Users can manage own medications"
  ON public.medications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted medications" ON public.medications;
CREATE POLICY "Care circle members can select permitted medications"
  ON public.medications FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'medications')
  );

-- 62. RLS Policies: medication_logs
DROP POLICY IF EXISTS "Users can manage own medication logs" ON public.medication_logs;
CREATE POLICY "Users can manage own medication logs"
  ON public.medication_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted medication logs" ON public.medication_logs;
CREATE POLICY "Care circle members can select permitted medication logs"
  ON public.medication_logs FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'medications')
  );

-- ==============================================================================
-- Module: Doctor Appointments & Consultations (appointments)
-- ==============================================================================

-- 63. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  care_circle_member_id UUID REFERENCES public.care_circle_members(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  provider_specialty TEXT DEFAULT 'Gynecology / Endocrinology',
  title TEXT NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'follow_up', 'lab_review', 'routine_check', 'other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TEXT NOT NULL DEFAULT '15:30',
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  location TEXT NOT NULL DEFAULT 'Clinic Consultation',
  meeting_url TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  patient_notes TEXT DEFAULT '',
  provider_notes TEXT DEFAULT '',
  doctor_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 64. Indexes for Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_care_circle ON public.appointments(care_circle_member_id);

-- 65. Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 66. RLS Policies: appointments
DROP POLICY IF EXISTS "Patients can manage own appointments" ON public.appointments;
CREATE POLICY "Patients can manage own appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Care circle members can select permitted appointments" ON public.appointments;
CREATE POLICY "Care circle members can select permitted appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(patient_id, 'appointments')
  );

-- ==============================================================================
-- 67. Secure Provider Token Verification & Live Data Retrieval Function (SECURITY DEFINER)
-- Allows authorized healthcare providers or contacts with a valid invite token to fetch permitted patient records
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_care_provider_view(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_member RECORD;
  v_patient RECORD;
  v_perms JSONB;
  v_result JSONB;
  v_reports JSONB := '[]'::jsonb;
  v_symptoms JSONB := '[]'::jsonb;
  v_appointments JSONB := '[]'::jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RETURN jsonb_build_object('isValid', false, 'error', 'Invalid token');
  END IF;

  -- 1. Find member by invite_token
  SELECT id, patient_id, member_email, member_name, role, relationship, clinic_organization, status, invite_token, created_at, updated_at
  INTO v_member
  FROM public.care_circle_members
  WHERE invite_token = p_token;

  IF NOT FOUND THEN
    -- Check pending invitations
    SELECT id, patient_id, invite_email AS member_email, member_name, role, relationship, '' AS clinic_organization, status, token AS invite_token, created_at, created_at AS updated_at
    INTO v_member
    FROM public.care_circle_invitations
    WHERE token = p_token;
  END IF;

  IF v_member.id IS NULL OR v_member.status = 'revoked' THEN
    RETURN jsonb_build_object('isValid', false, 'error', 'Token not found or access revoked');
  END IF;

  -- Update last_viewed_at
  UPDATE public.care_circle_members
  SET last_viewed_at = now()
  WHERE invite_token = p_token;

  -- 2. Build permissions map
  SELECT jsonb_object_agg(permission_key, enabled)
  INTO v_perms
  FROM public.care_circle_permissions
  WHERE member_id = v_member.id;

  IF v_perms IS NULL THEN
    v_perms := jsonb_build_object(
      'profile', true,
      'cycle', true,
      'symptoms', true,
      'reports', true,
      'medications', true,
      'diet', true,
      'fitness', true,
      'appointments', true,
      'weekly_summary', true,
      'chat_summary', true
    );
  END IF;

  -- 3. Fetch Patient Profile
  SELECT id, full_name, date_of_birth, blood_type, conditions, cycle_length, period_duration, last_period_date, dietary_preference, daily_water_glasses, activity_level, sleep_hours
  INTO v_patient
  FROM public.profiles
  WHERE id = v_member.patient_id;

  -- 4. Fetch Medical Reports if permitted
  IF COALESCE((v_perms->>'reports')::boolean, false) THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'reportType', r.report_type,
        'reportDate', r.report_date,
        'fileName', r.file_name,
        'status', r.status,
        'results', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'testName', res.test_name,
              'resultValue', res.result_value,
              'unit', res.unit,
              'referenceRange', res.reference_range,
              'status', res.status
            )
          )
          FROM public.report_results res
          WHERE res.report_id = r.id
        )
      )
    )
    INTO v_reports
    FROM (
      SELECT * FROM public.medical_reports
      WHERE user_id = v_member.patient_id
      ORDER BY report_date DESC
      LIMIT 10
    ) r;
  END IF;

  -- 5. Fetch Symptoms if permitted
  IF COALESCE((v_perms->>'symptoms')::boolean, false) THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'symptomType', s.symptom_type,
        'category', s.category,
        'severity', s.severity,
        'occurredAt', s.occurred_at
      )
    )
    INTO v_symptoms
    FROM (
      SELECT * FROM public.symptom_records
      WHERE user_id = v_member.patient_id
      ORDER BY occurred_at DESC
      LIMIT 20
    ) s;
  END IF;

  -- 6. Fetch Appointments if permitted
  IF COALESCE((v_perms->>'appointments')::boolean, false) THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'title', a.title,
        'providerName', a.provider_name,
        'providerSpecialty', a.provider_specialty,
        'appointmentType', a.appointment_type,
        'scheduledAt', a.scheduled_at,
        'scheduledDate', a.scheduled_date,
        'scheduledTime', a.scheduled_time,
        'durationMinutes', a.duration_minutes,
        'status', a.status,
        'location', a.location,
        'meetingUrl', a.meeting_url,
        'reason', a.reason,
        'doctorQuestions', a.doctor_questions
      )
    )
    INTO v_appointments
    FROM (
      SELECT * FROM public.appointments
      WHERE patient_id = v_member.patient_id
        AND (care_circle_member_id IS NULL OR care_circle_member_id = v_member.id)
      ORDER BY scheduled_at ASC
    ) a;
  END IF;

  -- Return complete bundle
  v_result := jsonb_build_object(
    'isValid', true,
    'member', jsonb_build_object(
      'id', v_member.id,
      'name', v_member.member_name,
      'email', v_member.member_email,
      'role', v_member.role,
      'relationship', v_member.relationship,
      'clinicOrganization', v_member.clinic_organization,
      'status', v_member.status,
      'permissions', v_perms
    ),
    'patient', jsonb_build_object(
      'id', v_patient.id,
      'name', CASE WHEN COALESCE((v_perms->>'profile')::boolean, false) THEN v_patient.full_name ELSE 'Patient' END,
      'bloodType', CASE WHEN COALESCE((v_perms->>'profile')::boolean, false) THEN v_patient.blood_type ELSE NULL END,
      'conditions', CASE WHEN COALESCE((v_perms->>'profile')::boolean, false) THEN v_patient.conditions ELSE NULL END,
      'dateOfBirth', CASE WHEN COALESCE((v_perms->>'profile')::boolean, false) THEN v_patient.date_of_birth ELSE NULL END,
      'cycleLength', v_patient.cycle_length,
      'periodDuration', v_patient.period_duration,
      'lastPeriodDate', v_patient.last_period_date,
      'dailyWaterGlasses', v_patient.daily_water_glasses
    ),
    'reports', COALESCE(v_reports, '[]'::jsonb),
    'symptoms', COALESCE(v_symptoms, '[]'::jsonb),
    'appointments', COALESCE(v_appointments, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- Module: Progressive Cumulative PCOS Assessments (pcos_assessments)
-- ==============================================================================

-- 68. PCOS Progressive Assessments Table
CREATE TABLE IF NOT EXISTS public.pcos_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_level TEXT NOT NULL CHECK (assessment_level IN ('tier_1', 'tier_1_2', 'tier_1_3', 'tier_1_2_3')),
  tiers_included JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  probability NUMERIC NOT NULL,
  probability_percent NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  risk_category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  replaced_assessment_id UUID REFERENCES public.pcos_assessments(id) ON DELETE SET NULL,
  input_availability JSONB DEFAULT '{}'::jsonb,
  input_features JSONB DEFAULT '{}'::jsonb,
  explanations JSONB DEFAULT '[]'::jsonb,
  limitations JSONB DEFAULT '[]'::jsonb,
  next_available_tier INTEGER NULL,
  pcom_status TEXT NULL,
  pcom_probability NUMERIC NULL,
  gradcam_url TEXT NULL,
  ultrasound_report_id UUID REFERENCES public.medical_reports(id) ON DELETE SET NULL,
  disclaimer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 69. Indexes for pcos_assessments
CREATE INDEX IF NOT EXISTS idx_pcos_assessments_user_active ON public.pcos_assessments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pcos_assessments_user_created ON public.pcos_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pcos_assessments_level ON public.pcos_assessments(user_id, assessment_level);

-- 70. Enable RLS on pcos_assessments
ALTER TABLE public.pcos_assessments ENABLE ROW LEVEL SECURITY;

-- 71. RLS Policies for pcos_assessments (authenticated user full control over own assessments)
DROP POLICY IF EXISTS "Users can select own pcos assessments" ON public.pcos_assessments;
CREATE POLICY "Users can select own pcos assessments"
  ON public.pcos_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pcos assessments" ON public.pcos_assessments;
CREATE POLICY "Users can insert own pcos assessments"
  ON public.pcos_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pcos assessments" ON public.pcos_assessments;
CREATE POLICY "Users can update own pcos assessments"
  ON public.pcos_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Care circle members can select permitted pcos assessments" ON public.pcos_assessments;
CREATE POLICY "Care circle members can select permitted pcos assessments"
  ON public.pcos_assessments FOR SELECT
  TO authenticated
  USING (
    public.has_care_circle_permission(user_id, 'reports')
  );


-- 72. Nutrition Plans Table (BioPulse Meal Module Persistence)
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'WEEKLY_7_DAY',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  replaced_plan_id UUID NULL REFERENCES public.nutrition_plans(id),
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  condition_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  meal_module_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 73. Indexes for Nutrition Plans
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_active ON public.nutrition_plans(user_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_plans_one_active_per_user ON public.nutrition_plans(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_created ON public.nutrition_plans(user_id, created_at DESC);

-- 74. Enable RLS on nutrition_plans
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

-- 75. RLS Policies for nutrition_plans
DROP POLICY IF EXISTS "Users can view own nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Users can view own nutrition plans"
  ON public.nutrition_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 76. Patient Clinical State Table (Authoritative Tier 1 & Tier 2 Input Persistence)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patient_clinical_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('female_pcos', 'male_hypogonadism')),
  tier_1_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  tier_2_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ultrasound_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_patient_clinical_state UNIQUE (user_id, module)
);

CREATE INDEX IF NOT EXISTS idx_patient_clinical_state_user_module 
  ON public.patient_clinical_state(user_id, module);

ALTER TABLE public.patient_clinical_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own clinical state" ON public.patient_clinical_state;
CREATE POLICY "Users can select own clinical state"
  ON public.patient_clinical_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clinical state" ON public.patient_clinical_state;
CREATE POLICY "Users can insert own clinical state"
  ON public.patient_clinical_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clinical state" ON public.patient_clinical_state;
CREATE POLICY "Users can update own clinical state"
  ON public.patient_clinical_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clinical state" ON public.patient_clinical_state;
CREATE POLICY "Users can delete own clinical state"
  ON public.patient_clinical_state FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


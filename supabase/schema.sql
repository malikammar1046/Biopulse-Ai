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
  
  -- Women's Health & Cycle Rhythm
  cycle_length TEXT DEFAULT '28', -- supports number or 'irregular'
  period_duration INTEGER DEFAULT 5,
  last_period_date DATE,
  period_regularity TEXT DEFAULT 'mostly_regular',
  common_symptoms JSONB DEFAULT '[]'::jsonb,
  
  -- Lifestyle & Nutrition
  dietary_preference TEXT DEFAULT 'Balanced',
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
  status TEXT NOT NULL CHECK (status IN ('processing', 'needs_verification', 'verified')),
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
  user_verified BOOLEAN DEFAULT true,
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



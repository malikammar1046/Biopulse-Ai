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


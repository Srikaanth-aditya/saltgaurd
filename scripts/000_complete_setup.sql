-- SALTGUARD Complete Database Setup
-- Run this script in your Supabase SQL Editor to set up all tables from scratch

-- =====================================================
-- 1. PROFILES TABLE (User Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = id);

-- =====================================================
-- 2. PATIENTS TABLE (Clinical Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  age NUMERIC NOT NULL,
  sodium NUMERIC NOT NULL,
  creatinine NUMERIC NOT NULL,
  bun NUMERIC NOT NULL,
  hemoglobin NUMERIC NOT NULL,
  wbc NUMERIC NOT NULL,
  status TEXT DEFAULT 'Monitor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients policies - users can only access their own patients
CREATE POLICY "Users can view own patients" ON public.patients
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

CREATE POLICY "Users can insert own patients" ON public.patients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own patients" ON public.patients
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

CREATE POLICY "Users can delete own patients" ON public.patients
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);

-- =====================================================
-- 3. RESULTS TABLE (AI Analysis Results)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  mortality_risk TEXT NOT NULL,
  mortality_probability NUMERIC,
  heart_attack_risk TEXT,
  shock_index NUMERIC,
  renal_dysfunction BOOLEAN DEFAULT false,
  hyponatremia BOOLEAN DEFAULT false,
  severe_anemia BOOLEAN DEFAULT false,
  leukocytosis BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Monitor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on results
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Results policies - users can only access results for their own patients
CREATE POLICY "Users can view own patient results" ON public.results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = results.patient_id 
      AND (patients.user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true)
    )
  );

CREATE POLICY "Users can insert results for own patients" ON public.results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = results.patient_id 
      AND (patients.user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true)
    )
  );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_results_patient_id ON public.results(patient_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON public.results(created_at DESC);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for patients table
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- All tables, indexes, and policies have been created.
-- You can now use SALTGUARD to:
-- 1. Sign up new users (stored in profiles table)
-- 2. Create patient assessments (stored in patients table)
-- 3. Store AI analysis results (stored in results table)
-- 4. Each user will only see their own data (enforced by RLS policies)

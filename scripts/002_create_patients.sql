-- Create patients table for SALTGUARD
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  sodium DECIMAL(5,2) NOT NULL,
  creatinine DECIMAL(5,2) NOT NULL,
  bilirubin DECIMAL(5,2) NOT NULL,
  inr DECIMAL(5,2) NOT NULL,
  platelet_count DECIMAL(10,2) NOT NULL,
  bun DECIMAL(5,2) NOT NULL,
  hemoglobin DECIMAL(5,2) NOT NULL,
  wbc DECIMAL(5,2) NOT NULL,
  systolic_bp INTEGER NOT NULL,
  heart_rate INTEGER NOT NULL,
  -- Results from ML API
  mortality_risk TEXT,
  mortality_probability DECIMAL(5,2),
  heart_attack_risk TEXT,
  shock_index DECIMAL(5,2),
  renal_dysfunction BOOLEAN DEFAULT FALSE,
  hyponatremia BOOLEAN DEFAULT FALSE,
  severe_anemia BOOLEAN DEFAULT FALSE,
  leukocytosis BOOLEAN DEFAULT FALSE,
  -- Metadata
  status TEXT DEFAULT 'Monitor',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);

-- Enable Row Level Security (optional - remove if you want public access)
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (for demo purposes)
-- CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true) WITH CHECK (true);

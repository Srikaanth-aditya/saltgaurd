-- Create results table for SALTGUARD
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  -- Results from ML API
  mortality_risk TEXT NOT NULL,
  mortality_probability DECIMAL(5,2),
  heart_attack_risk TEXT,
  shock_index DECIMAL(5,2),
  -- Clinical Flags
  renal_dysfunction BOOLEAN DEFAULT FALSE,
  hyponatremia BOOLEAN DEFAULT FALSE,
  severe_anemia BOOLEAN DEFAULT FALSE,
  leukocytosis BOOLEAN DEFAULT FALSE,
  -- Status
  status TEXT DEFAULT 'Monitor',
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_results_patient_id ON results(patient_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);

-- Enable Row Level Security (optional)
-- ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Fix the type mismatch - DROP and recreate tables with correct UUID types
-- Run this in your Supabase SQL Editor

-- First, drop the results table if it exists
DROP TABLE IF EXISTS results CASCADE;

-- Drop the patients table if it exists  
DROP TABLE IF EXISTS patients CASCADE;

-- Create patients table with UUID id
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
  status TEXT DEFAULT 'Monitor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create results table with proper UUID foreign key
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  mortality_risk TEXT NOT NULL,
  mortality_probability DECIMAL(5,2),
  heart_attack_risk TEXT,
  shock_index DECIMAL(5,2),
  renal_dysfunction BOOLEAN DEFAULT FALSE,
  hyponatremia BOOLEAN DEFAULT FALSE,
  severe_anemia BOOLEAN DEFAULT FALSE,
  leukocytosis BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Monitor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX idx_results_patient_id ON results(patient_id);
CREATE INDEX idx_results_created_at ON results(created_at DESC);

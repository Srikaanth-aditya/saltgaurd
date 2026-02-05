-- Create profiles table to store user information for SALTGUARD
-- Run this SQL in your Supabase dashboard: SQL Editor > New Query

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for signup)
CREATE POLICY "Allow public insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Allow anyone to select (for login verification)
CREATE POLICY "Allow public select" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to update profiles
CREATE POLICY "Allow public update" ON public.profiles
  FOR UPDATE USING (true);

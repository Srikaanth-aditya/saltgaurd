-- Add user_id column to patients table for user data isolation
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Update existing patients to have a default user_id (optional, can be NULL for old data)
-- UPDATE patients SET user_id = 'legacy' WHERE user_id IS NULL;

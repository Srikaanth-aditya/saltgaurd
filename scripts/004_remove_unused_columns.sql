-- Remove columns that are no longer used in the form
ALTER TABLE patients DROP COLUMN IF EXISTS bilirubin;
ALTER TABLE patients DROP COLUMN IF EXISTS inr;
ALTER TABLE patients DROP COLUMN IF EXISTS platelet_count;
ALTER TABLE patients DROP COLUMN IF EXISTS systolic_bp;
ALTER TABLE patients DROP COLUMN IF EXISTS heart_rate;

-- Remove status constraint to allow custom statuses
-- This allows admins to set any status value (not just predefined ones)
-- Execute this in Supabase SQL Editor

-- Drop the existing check constraint on loan_applications table
ALTER TABLE loan_applications 
DROP CONSTRAINT IF EXISTS loan_applications_status_check;

-- Drop the existing check constraint on loans table (if it exists)
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_status_check;

-- Note: After running this, the status column will accept any VARCHAR value
-- The application code will handle validation (2-50 characters)

-- Optional: Verify the constraints have been removed
-- Uncomment the query below if you want to check:
/*
SELECT 
    tc.table_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_name LIKE '%status_check%'
ORDER BY tc.table_name;
*/


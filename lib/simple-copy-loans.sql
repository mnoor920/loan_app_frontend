-- Simple copy script - only copy columns that exist in both tables
-- This will fix the column mismatch error

-- First, let's see what we're working with
SELECT 'CHECKING LOANS TABLE STRUCTURE:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'loans' ORDER BY ordinal_position;

-- Copy only the basic columns that should exist in both tables
INSERT INTO loan_applications (
  id, 
  user_id, 
  loan_amount, 
  duration_months, 
  interest_rate, 
  status,
  created_at
)
SELECT 
  id, 
  user_id, 
  loan_amount, 
  duration_months, 
  interest_rate, 
  status,
  created_at
FROM loans
ON CONFLICT (id) DO NOTHING;

-- Verify the copy worked
SELECT 'COPY RESULTS:' as info;
SELECT COUNT(*) as loan_applications_count FROM loan_applications;

-- Check if our specific loan ID now exists
SELECT 'SPECIFIC LOAN CHECK:' as info;
SELECT id, status, loan_amount, user_id
FROM loan_applications 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID;
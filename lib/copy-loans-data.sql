-- Copy data from loans table to loan_applications table
-- This will fix the 500 error by putting data where the API expects it

-- First, let's see what columns exist in both tables
SELECT 'LOANS TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'loans' ORDER BY ordinal_position;

SELECT 'LOAN_APPLICATIONS TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'loan_applications' ORDER BY ordinal_position;

-- Copy all data from loans to loan_applications
-- We'll match the columns that exist in both tables
INSERT INTO loan_applications (
  id, user_id, loan_amount, duration_months, interest_rate, 
  monthly_payment, total_amount, loan_purpose, status, 
  application_date, approval_date, first_payment_date, 
  admin_notes, created_at, updated_at
)
SELECT 
  id, user_id, loan_amount, duration_months, interest_rate,
  monthly_payment, total_amount, loan_purpose, status,
  application_date, approval_date, first_payment_date,
  admin_notes, created_at, updated_at
FROM loans
ON CONFLICT (id) DO NOTHING;

-- Verify the copy worked
SELECT 'COPY RESULTS:' as info;
SELECT COUNT(*) as loan_applications_count FROM loan_applications;

-- Check if our specific loan ID now exists
SELECT 'SPECIFIC LOAN CHECK:' as info;
SELECT id, status, loan_amount 
FROM loan_applications 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID;
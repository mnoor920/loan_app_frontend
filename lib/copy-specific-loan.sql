-- Copy just the specific loan record you need
-- This is the minimal fix to get your loan page working

-- First check what columns the loans table actually has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;

-- Copy just the specific loan record with minimal columns
INSERT INTO loan_applications (id, user_id, loan_amount, duration_months, interest_rate, status, created_at)
SELECT id, user_id, loan_amount, duration_months, interest_rate, status, created_at
FROM loans 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID
ON CONFLICT (id) DO NOTHING;

-- Verify it worked
SELECT 'SUCCESS - Loan record copied:' as result;
SELECT id, status, loan_amount 
FROM loan_applications 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID;
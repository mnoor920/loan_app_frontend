-- Check both loans and loan_applications tables
-- Run this to see what data exists in each

-- 1. Check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('loans', 'loan_applications');

-- 2. Check structure of loans table
SELECT 'LOANS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;

-- 3. Check structure of loan_applications table  
SELECT 'LOAN_APPLICATIONS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
ORDER BY ordinal_position;

-- 4. Check data in loans table
SELECT 'LOANS TABLE DATA:' as info;
SELECT COUNT(*) as loans_count FROM loans;
SELECT id, status, loan_amount, user_id FROM loans LIMIT 3;

-- 5. Check data in loan_applications table
SELECT 'LOAN_APPLICATIONS TABLE DATA:' as info;
SELECT COUNT(*) as loan_applications_count FROM loan_applications;
SELECT id, status, loan_amount, user_id FROM loan_applications LIMIT 3;

-- 6. Check if the specific loan ID exists in either table
SELECT 'CHECKING SPECIFIC LOAN ID:' as info;
SELECT 'In loans table:' as location, COUNT(*) as found 
FROM loans 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID;

SELECT 'In loan_applications table:' as location, COUNT(*) as found 
FROM loan_applications 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID;
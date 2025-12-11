-- Debug Script - Check existing loan_applications table structure
-- Run this in Supabase SQL Editor to see what's missing

-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
ORDER BY ordinal_position;

-- 2. Check if we have any data
SELECT COUNT(*) as total_loans FROM loan_applications;

-- 3. Check if the specific loan ID exists
SELECT id, status, loan_amount, created_at 
FROM loan_applications 
WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID;

-- 4. Check if users table exists and has the right structure
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'users';

-- 5. Check if we can join loan_applications with users
SELECT la.id, la.status, u.email, u.first_name, u.last_name
FROM loan_applications la
LEFT JOIN users u ON la.user_id = u.id
LIMIT 5;

-- 6. Check what functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'log_admin_modification';
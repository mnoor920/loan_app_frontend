-- Diagnostic queries for wallet withdrawal code issues
-- Run these in Supabase SQL Editor to diagnose the problem

-- 1. Check if wallet_withdrawal_codes table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'wallet_withdrawal_codes';

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'wallet_withdrawal_codes'
ORDER BY ordinal_position;

-- 3. Check all wallet withdrawal codes (replace with actual user_id)
SELECT 
    id,
    user_id,
    code,
    is_used,
    used_at,
    created_at
FROM wallet_withdrawal_codes
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check codes for a specific user (replace 'USER_ID_HERE' with actual user_id)
SELECT 
    id,
    user_id,
    code,
    is_used,
    used_at,
    created_at
FROM wallet_withdrawal_codes
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id
ORDER BY created_at DESC;

-- 5. Check if a specific code exists (replace 'CODE_HERE' with actual code)
SELECT 
    id,
    user_id,
    code,
    is_used,
    used_at,
    created_at
FROM wallet_withdrawal_codes
WHERE code = 'CODE_HERE'  -- Replace with actual 6-digit code
ORDER BY created_at DESC;

-- 6. Check for codes that match user_id and code (replace both values)
SELECT 
    id,
    user_id,
    code,
    is_used,
    used_at,
    created_at
FROM wallet_withdrawal_codes
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id
  AND code = 'CODE_HERE'        -- Replace with actual 6-digit code
ORDER BY created_at DESC;

-- 7. Count codes per user
SELECT 
    user_id,
    COUNT(*) as total_codes,
    COUNT(CASE WHEN is_used = false THEN 1 END) as unused_codes,
    COUNT(CASE WHEN is_used = true THEN 1 END) as used_codes
FROM wallet_withdrawal_codes
GROUP BY user_id
ORDER BY total_codes DESC;

-- 8. Check recent code generations (last 24 hours)
SELECT 
    id,
    user_id,
    code,
    is_used,
    created_at
FROM wallet_withdrawal_codes
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


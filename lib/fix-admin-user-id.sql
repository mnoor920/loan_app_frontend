-- Fix admin user ID if it's set to 'superadmin' instead of a UUID
-- Run this in Supabase SQL Editor if your admin user has an invalid ID

-- First, check what the current ID is
SELECT id, email, role, first_name, last_name 
FROM users 
WHERE email = 'admin@brightlend.com' OR role = 'superadmin';

-- If the ID is 'superadmin' or not a valid UUID, update it
-- Generate a new UUID for the admin user
UPDATE users
SET id = gen_random_uuid()
WHERE (email = 'admin@brightlend.com' OR role = 'superadmin')
  AND id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Note: If you update the user ID, you'll need to:
-- 1. Update any foreign key references (if any)
-- 2. Have the user sign out and sign in again to get a new token

-- Verify the update
SELECT id, email, role 
FROM users 
WHERE email = 'admin@brightlend.com' OR role = 'superadmin';


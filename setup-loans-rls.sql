-- Row Level Security setup for loans table
-- Run this AFTER creating the loans table
-- NOTE: Since this app uses JWT auth (not Supabase Auth), we'll disable RLS for now
-- In production, you'd want to implement proper RLS with service role

-- For now, disable RLS since we're using JWT authentication
-- and handling authorization in the API layer
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;

-- If you want to enable RLS later with service role, use these policies:
-- ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role can manage loans" ON loans USING (true);

-- Verify table exists and is accessible
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;
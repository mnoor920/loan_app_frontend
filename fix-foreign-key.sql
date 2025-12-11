-- Fix foreign key relationship between loan_applications and users
-- Run this in Supabase SQL Editor

-- First, check if the foreign key constraint exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='loan_applications';

-- If no foreign key exists, add it
DO $$ 
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'loan_applications' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE loan_applications 
        ADD CONSTRAINT fk_loan_applications_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Refresh the schema cache (this might help with Supabase)
NOTIFY pgrst, 'reload schema';
-- Add metadata column to user_documents table for storing base64 file data
-- This is a fallback solution if Supabase Storage has issues

ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_documents_metadata ON user_documents USING GIN (metadata);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_documents' 
AND column_name = 'metadata';
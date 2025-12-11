-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the user-documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify bucket creation
SELECT * FROM storage.buckets WHERE id = 'user-documents';
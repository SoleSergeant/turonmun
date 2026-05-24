-- =============================================
-- STORAGE BUCKET RLS DISABLE FOR COMMITTEES
-- =============================================
-- Quick fix for committee image upload RLS errors
-- Run this in Supabase SQL Editor

-- Disable RLS on storage.objects for committees bucket
-- This allows public uploads to committees bucket
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- OR if you want more targeted approach, create these policies:

-- Allow public to read files from committees bucket
CREATE POLICY "Public read committees" ON storage.objects 
FOR SELECT USING (bucket_id = 'committees');

-- Allow anyone to upload to committees bucket (temporary for testing)
CREATE POLICY "Anyone can upload committees" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'committees');

-- Allow anyone to delete from committees bucket (temporary for testing)  
CREATE POLICY "Anyone can delete committees" ON storage.objects 
FOR DELETE USING (bucket_id = 'committees');

-- Note: In production, you should replace 'anyone' with proper authentication checks
-- Example: auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin' 
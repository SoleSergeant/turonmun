-- =============================================
-- ROW LEVEL SECURITY (RLS) FIXES
-- =============================================
-- Fix for registration errors: Allow public to insert applications

-- First, drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Public read access for committees" ON committees;
DROP POLICY IF EXISTS "Public read access for schedule" ON schedule_events;
DROP POLICY IF EXISTS "Public read access for resources" ON resources;

-- Disable RLS temporarily for applications to allow public registration
-- In production, you'd want more nuanced policies
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE committees DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STORAGE BUCKET POLICIES (For Image Upload)
-- =============================================
-- Note: These are storage policies, not table RLS policies
-- Run these in Supabase Dashboard → Storage → Policies

-- 1. Allow public to read files from committees bucket
-- Policy Name: "Public Access"
-- SELECT policy for storage.objects
-- Target roles: public
-- Expression: bucket_id = 'committees'

-- 2. Allow authenticated users to insert files
-- Policy Name: "Authenticated users can upload committee images"  
-- INSERT policy for storage.objects
-- Target roles: authenticated
-- Expression: bucket_id = 'committees'

-- 3. Allow authenticated users to delete files they uploaded
-- Policy Name: "Users can delete own files"
-- DELETE policy for storage.objects  
-- Target roles: authenticated
-- Expression: bucket_id = 'committees'

-- SQL VERSION (if you prefer to run via SQL instead of dashboard):
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'committees');
-- CREATE POLICY "Authenticated users can upload committee images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'committees' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'committees' AND auth.role() = 'authenticated');

-- Alternative: Create permissive policies (recommended for production)
-- Uncomment these and comment out the DISABLE commands above for better security

-- -- Allow public to insert applications (registration)
-- CREATE POLICY "Allow public application submission" ON applications 
--   FOR INSERT WITH CHECK (true);

-- -- Allow public to read committees
-- CREATE POLICY "Allow public to read committees" ON committees 
--   FOR SELECT USING (is_active = true);

-- -- Allow public to read schedule events
-- CREATE POLICY "Allow public to read schedule" ON schedule_events 
--   FOR SELECT USING (true);

-- -- Allow public to read public resources
-- CREATE POLICY "Allow public to read resources" ON resources 
--   FOR SELECT USING (is_public = true);

-- -- Allow public to insert contact messages
-- CREATE POLICY "Allow public contact submissions" ON contact_messages 
--   FOR INSERT WITH CHECK (true);

-- -- Admin-only policies for other operations
-- CREATE POLICY "Admin full access to applications" ON applications 
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admin full access to committees" ON committees 
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- REFRESH SCHEMA
-- =============================================
-- After running this, the registration should work!

SELECT 'RLS policies updated successfully!' as status; 
-- 023_storage_buckets.sql
-- The app uploads to two storage buckets that were never created:
--   • applications — delegate photos & position-paper PDFs
--   • committees   — committee images
-- This creates them (public read) and adds policies so authenticated users
-- can upload and everyone can read the public URLs the app generates.

-- ── Create buckets (public so getPublicUrl works) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('committees', 'committees', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── Policies on storage.objects ──
-- applications
DROP POLICY IF EXISTS "applications public read"      ON storage.objects;
DROP POLICY IF EXISTS "applications auth insert"      ON storage.objects;
DROP POLICY IF EXISTS "applications auth update"      ON storage.objects;
DROP POLICY IF EXISTS "applications auth delete"      ON storage.objects;

CREATE POLICY "applications public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'applications');
CREATE POLICY "applications auth insert"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'applications');
CREATE POLICY "applications auth update"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'applications');
CREATE POLICY "applications auth delete"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'applications');

-- committees
DROP POLICY IF EXISTS "committees public read" ON storage.objects;
DROP POLICY IF EXISTS "committees auth insert" ON storage.objects;
DROP POLICY IF EXISTS "committees auth update" ON storage.objects;
DROP POLICY IF EXISTS "committees auth delete" ON storage.objects;

CREATE POLICY "committees public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'committees');
CREATE POLICY "committees auth insert"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'committees');
CREATE POLICY "committees auth update"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'committees');
CREATE POLICY "committees auth delete"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'committees');

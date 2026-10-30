-- 050_drop_loose_policies.sql
-- Removes old access rules that were created by hand in the Supabase
-- dashboard (none of them are in these migrations). Policies add up, so
-- while they existed the strict rules from 036/043 had no effect:
--   * anyone, signed in or not, could add/change/delete Resources and the
--     files in the 'resources' bucket (site images, Team photos);
--   * any signed-in account could change seat allocations, votes, motions,
--     speakers lists, attendance and session logs, and delete anyone's
--     position paper or committee image.
-- The strict replacements stay: SG/Academics manage resources, seats and
-- committee images; chairs run their own sessions (can_run_session);
-- delegates upload and replace their own position paper; signed-in users
-- can still read session data; public file links keep working.
-- Safe to re-run.

-- ── Tables ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can insert resources"  ON public.resources;
DROP POLICY IF EXISTS "Anyone can update resources"  ON public.resources;
DROP POLICY IF EXISTS "Anyone can delete resources"  ON public.resources;
DROP POLICY IF EXISTS "Public read resources"        ON public.resources;  -- ignored is_public
DROP POLICY IF EXISTS "Admins manage resources"      ON public.resources;  -- any admin_users row, incl. chairs

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['attendance', 'committee_sessions', 'motions', 'session_logs',
                           'speakers_list', 'votes', 'country_assignments', 'matrix_countries']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_all" ON public.%I', t);
  END LOOP;
END $$;

-- ── Storage ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can upload resources"          ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update resources"          ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete resources"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to applications" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete applications"    ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to committees"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete committees"      ON storage.objects;
-- The buckets are public, so file links work without these; they only let
-- anyone list every file (e.g. all position papers).
DROP POLICY IF EXISTS "Public can read resources"            ON storage.objects;
DROP POLICY IF EXISTS "Public read applications bucket"      ON storage.objects;
DROP POLICY IF EXISTS "Public read committees bucket"        ON storage.objects;

NOTIFY pgrst, 'reload schema';

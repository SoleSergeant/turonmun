-- 019_security_hardening.sql
-- Comprehensive security hardening — fixes all critical RLS flaws.
--
-- Issues fixed:
-- 1. applications RLS was DISABLED — any authenticated user could read/write all applications
-- 2. country_assignments had FOR ALL USING (true) — anon full access
-- 3. committees / resources / contact_messages / schedule_events RLS was DISABLED
-- 4. admin_users RLS used id=auth.uid() which always fails (app UUID ≠ Supabase Auth UID)
-- 5. position_papers.title NOT NULL prevented all saves
-- 6. applications status/payment_status CHECK constraints were incomplete

-- ── HELPER: safe admin check using email ──────────────────────────────
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated, anon;

-- ── APPLICATIONS ──────────────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for applications" ON public.applications;
DROP POLICY IF EXISTS "Allow public application submission" ON public.applications;
DROP POLICY IF EXISTS "Admin full access to applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can manage applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view own application" ON public.applications;
DROP POLICY IF EXISTS "Authenticated can read applications" ON public.applications;
DROP POLICY IF EXISTS "Public can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Users can read own application" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;

CREATE POLICY "Public can insert applications"
  ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own application"
  ON public.applications FOR SELECT
  USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email' OR public.is_active_admin());
CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete applications"
  ON public.applications FOR DELETE
  USING (public.is_active_admin());

-- ── COUNTRY_ASSIGNMENTS ───────────────────────────────────────────────
ALTER TABLE public.country_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.country_assignments;
DROP POLICY IF EXISTS "Allow anon full access to country_assignments" ON public.country_assignments;
DROP POLICY IF EXISTS "Admins can manage country assignments" ON public.country_assignments;
DROP POLICY IF EXISTS "Delegates can view their own assignments" ON public.country_assignments;
DROP POLICY IF EXISTS "Delegates can read own assignment" ON public.country_assignments;

CREATE POLICY "Delegates can read own assignment"
  ON public.country_assignments FOR SELECT
  USING (
    application_id IN (SELECT id FROM public.applications WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email')
    OR public.is_active_admin()
  );
CREATE POLICY "Admins can manage country assignments"
  ON public.country_assignments FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.country_assignments TO authenticated;

-- ── COMMITTEES ────────────────────────────────────────────────────────
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for committees" ON public.committees;
DROP POLICY IF EXISTS "Allow public to read committees" ON public.committees;
DROP POLICY IF EXISTS "Admins can manage committees" ON public.committees;
DROP POLICY IF EXISTS "Anyone can read active committees" ON public.committees;
DROP POLICY IF EXISTS "Anyone can read committees" ON public.committees;

-- Committees are public data (shown on the marketing site) — read is open.
CREATE POLICY "Anyone can read committees"
  ON public.committees FOR SELECT
  USING (true);
CREATE POLICY "Admins can manage committees"
  ON public.committees FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
GRANT SELECT ON public.committees TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.committees TO authenticated;

-- ── RESOURCES ─────────────────────────────────────────────────────────
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public to read resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can read public resources" ON public.resources;

CREATE POLICY "Anyone can read public resources"
  ON public.resources FOR SELECT
  USING (is_public = true OR public.is_active_admin());
CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;

-- ── CONTACT_MESSAGES ──────────────────────────────────────────────────
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit contact forms" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public contact submissions" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact form"
  ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;

-- ── SCHEDULE_EVENTS ───────────────────────────────────────────────────
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for schedule" ON public.schedule_events;
DROP POLICY IF EXISTS "Anyone can manage schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Admins can manage schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Anyone can read schedule" ON public.schedule_events;
DROP POLICY IF EXISTS "Admins can manage schedule" ON public.schedule_events;

CREATE POLICY "Anyone can read schedule"
  ON public.schedule_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage schedule"
  ON public.schedule_events FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
GRANT SELECT ON public.schedule_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedule_events TO authenticated;

-- ── ADMIN_USERS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert any admin_user" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read own admin record" ON public.admin_users;

CREATE POLICY "Active admins can read admin_users"
  ON public.admin_users FOR SELECT USING (public.is_active_admin());
CREATE POLICY "Active admins can manage admin_users"
  ON public.admin_users FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
CREATE POLICY "Users can read own admin record"
  ON public.admin_users FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- ── POSITION_PAPERS (only if table exists) ────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'position_papers') THEN
    ALTER TABLE public.position_papers ALTER COLUMN title DROP NOT NULL;
    ALTER TABLE public.position_papers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Delegates can manage own papers" ON public.position_papers;
    DROP POLICY IF EXISTS "Admins can manage all papers" ON public.position_papers;
    EXECUTE $p$
      CREATE POLICY "Delegates can manage own papers"
        ON public.position_papers FOR ALL
        USING (application_id IN (SELECT id FROM public.applications WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'));
      CREATE POLICY "Admins can manage all papers"
        ON public.position_papers FOR ALL
        USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
    $p$;
    GRANT SELECT, INSERT, UPDATE ON public.position_papers TO authenticated;
  END IF;
END $$;

-- ── CHECK CONSTRAINTS ─────────────────────────────────────────────────
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted'));

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_payment_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'overdue', 'refunded'));

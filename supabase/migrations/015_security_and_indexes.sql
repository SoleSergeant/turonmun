-- 015_security_and_indexes.sql
-- 1. Tighten form_settings UPDATE policy — only admin_users can update it.
--    Previously any authenticated Supabase user (including regular applicants)
--    could open/close the form, change fees, etc.
-- 2. Add missing performance indexes used frequently by the app.

-- ── form_settings RLS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated can update form settings" ON public.form_settings;

CREATE POLICY "Admins can update form settings"
  ON public.form_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email'
        AND is_active = true
    )
  );

-- ── Missing indexes ────────────────────────────────────────────────────────────
-- applications.user_id  — queried on every dashboard load
CREATE INDEX IF NOT EXISTS idx_applications_user_id
  ON public.applications(user_id);

-- applications.status   — filtered on almost every admin query
CREATE INDEX IF NOT EXISTS idx_applications_status
  ON public.applications(status);

-- applications.email    — used by ChairRoute / duplicate-check queries
CREATE INDEX IF NOT EXISTS idx_applications_email
  ON public.applications(email);

-- admin_users.email     — ChairRoute + ChairDashboard look up by email, not id
CREATE INDEX IF NOT EXISTS idx_admin_users_email
  ON public.admin_users(email);

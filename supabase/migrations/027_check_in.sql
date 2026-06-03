-- 027_check_in.sql
-- Event-day arrival check-in.
--   applications.checked_in_at  — timestamp of arrival (NULL = not arrived)
--   applications.checked_in_by  — which admin/registration user did it
--   admin_users role 'registration' — desk volunteers; UI scopes them to /check-in

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_checked_in_at ON public.applications(checked_in_at);

-- The is_active_admin() helper already allows any active admin (incl. 'registration'
-- role) to UPDATE applications, since we treat role as an authorization flag in the
-- UI only. No additional policies needed.

NOTIFY pgrst, 'reload schema';

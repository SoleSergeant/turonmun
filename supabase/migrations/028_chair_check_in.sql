-- 028_chair_check_in.sql
-- Mirror check-in columns onto admin_users so chairs/co-chairs can be
-- checked in at the door the same way delegates are.

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_checked_in_at ON public.admin_users(checked_in_at);

NOTIFY pgrst, 'reload schema';

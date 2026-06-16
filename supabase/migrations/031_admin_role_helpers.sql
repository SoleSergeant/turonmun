-- 031_admin_role_helpers.sql
-- Role-aware admin helpers + tightened RLS so role restrictions are real
-- (not just UI-deep). Adds a 'logistics' admin role.

-- ── Allowed roles for admin_users.role ────────────────────────────────
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('sg', 'academics', 'logistics', 'registration', 'admin', 'superadmin'));

-- ── Helpers ────────────────────────────────────────────────────────────
-- True when the caller is an active admin whose role is in `roles`.
CREATE OR REPLACE FUNCTION public.has_admin_role(roles TEXT[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
      AND role = ANY (roles)
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_admin_role(TEXT[]) TO authenticated, anon;

-- True when the caller is a Secretary-General (includes legacy admin/superadmin).
CREATE OR REPLACE FUNCTION public.is_sg()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_admin_role(ARRAY['sg', 'admin', 'superadmin']);
$$;
GRANT EXECUTE ON FUNCTION public.is_sg() TO authenticated, anon;

-- ── applications: only SG can DELETE; academics can still SELECT/UPDATE
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
CREATE POLICY "SG can delete applications"
  ON public.applications FOR DELETE
  USING (public.is_sg());

-- ── volunteer_applications: only SG + Logistics can write/delete ───────
DROP POLICY IF EXISTS "Admins can update volunteer applications" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Admins can delete volunteer applications" ON public.volunteer_applications;

-- SG + Logistics can update; Academics (and others) cannot.
CREATE POLICY "SG or Logistics can update volunteer applications"
  ON public.volunteer_applications FOR UPDATE
  USING (public.has_admin_role(ARRAY['sg','admin','superadmin','logistics']))
  WITH CHECK (public.has_admin_role(ARRAY['sg','admin','superadmin','logistics']));

-- Only SG can DELETE volunteer applications (Logistics can soft-delete via status).
CREATE POLICY "SG can delete volunteer applications"
  ON public.volunteer_applications FOR DELETE
  USING (public.is_sg());

-- Read on volunteer_applications is unchanged: own row OR any active admin.
-- We do not restrict SELECT by role because the UI gate prevents Academics
-- from navigating there, and SELECT-only exposure does not allow tampering.

NOTIFY pgrst, 'reload schema';

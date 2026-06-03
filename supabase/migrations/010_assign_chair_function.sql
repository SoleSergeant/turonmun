-- assign_chair_application: SECURITY DEFINER function so any authenticated
-- admin can promote a chair applicant into admin_users regardless of their
-- own row's role in that table (bypasses RLS safely).

CREATE OR REPLACE FUNCTION public.assign_chair_application(
  p_application_id UUID,
  p_email          TEXT,
  p_full_name      TEXT,
  p_role           TEXT,          -- 'chair' | 'co_chair'
  p_committee_id   UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Approve the application
  UPDATE applications
  SET status = 'approved', reviewed_at = NOW()
  WHERE id = p_application_id;

  -- 2. Upsert into admin_users (conflict on email = update in place)
  INSERT INTO admin_users (email, full_name, role, committee_id, password_hash, is_active)
  VALUES (p_email, p_full_name, p_role, p_committee_id, 'existing_user', true)
  ON CONFLICT (email) DO UPDATE SET
    full_name    = EXCLUDED.full_name,
    role         = EXCLUDED.role,
    committee_id = EXCLUDED.committee_id,
    is_active    = true;

  -- 3. Write the name into the committees.chair / co_chair text field
  IF p_role = 'chair' THEN
    UPDATE committees SET chair    = p_full_name WHERE id = p_committee_id;
  ELSE
    UPDATE committees SET co_chair = p_full_name WHERE id = p_committee_id;
  END IF;
END;
$$;

-- Restrict to authenticated users only; revoke public access
REVOKE ALL ON FUNCTION public.assign_chair_application FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_chair_application TO authenticated;

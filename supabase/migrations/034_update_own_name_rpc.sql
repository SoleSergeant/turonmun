-- 034_update_own_name_rpc.sql
-- Lets a delegate correct the name on their own application. Google sign-in
-- pre-fills full_name from the account's display name, which isn't always the
-- delegate's official name — and that name is what the admin exports and prints
-- on certificates.
--
-- Applications has no owner-UPDATE RLS policy (only admins can update), and we
-- deliberately keep it that way so delegates can't touch status/payment. This
-- SECURITY DEFINER function is the narrow, safe exception: it updates ONLY
-- full_name, and ONLY on rows that belong to the caller.

CREATE OR REPLACE FUNCTION public.update_own_application_name(p_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := auth.jwt() ->> 'email';
  v_uid   uuid := auth.uid();
  v_name  text := btrim(p_full_name);
BEGIN
  IF v_uid IS NULL AND v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_name IS NULL OR v_name = '' THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  UPDATE public.applications
  SET full_name  = v_name,
      updated_at = now()
  WHERE user_id = v_uid
     OR email = v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_own_application_name(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

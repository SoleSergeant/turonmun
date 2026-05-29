-- 016_update_delegate_info_rpc.sql
-- Creates the update_delegate_info() SECURITY DEFINER function that
-- DelegateManagement.tsx calls when an admin edits a delegate record.
-- Without this function every "Save" in the Edit Delegate modal throws
-- a Supabase 404 / "function does not exist" error.

CREATE OR REPLACE FUNCTION public.update_delegate_info(
  p_id              uuid,
  p_full_name       text,
  p_email           text,
  p_phone           text,
  p_institution     text,
  p_country         text,
  p_payment_status  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only active admin_users may call this function.
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Permission denied: caller is not an active admin';
  END IF;

  UPDATE public.applications
  SET
    full_name      = p_full_name,
    email          = p_email,
    phone          = p_phone,
    institution    = p_institution,
    country        = p_country,
    payment_status = p_payment_status,
    updated_at     = now()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application % not found', p_id;
  END IF;
END;
$$;

-- Grant execute to authenticated users (RLS inside the function enforces admin check)
GRANT EXECUTE ON FUNCTION public.update_delegate_info(uuid, text, text, text, text, text, text)
  TO authenticated;

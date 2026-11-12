-- 059_certificates_and_returning_discount.sql
--   1. verify_certificate(code): public check behind /verify/CODE and the
--      certificate QR. Only rows marked attended have a valid certificate.
--   2. set_participation_attended(id, bool): SG/Academics mark people the
--      check-in missed (Admin → Certificates).
--   3. Returning-delegate discount: form_settings.returning_discount, taken
--      off the delegate fee when the applicant's account was a delegate in
--      an earlier season. Computed in the insert guard (from 043), so the
--      browser can't claim it.

-- ── 1. Public certificate check ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS TABLE (full_name text, event text, role text, committee text, country text, award text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- One exact code → at most one row. No listing or search, so nothing is
  -- exposed to someone who doesn't already hold the certificate.
  SELECT full_name, event, role, committee, country, award
    FROM public.participations
   WHERE certificate_code = upper(trim(p_code)) AND attended;
$$;
REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- ── 2. Attendance ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_participation_attended(p_id uuid, p_attended boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.participations;
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only the SG or Academics can change attendance' USING ERRCODE = '42501';
  END IF;
  UPDATE public.participations SET attended = CASE WHEN p_attended THEN true END
   WHERE id = p_id RETURNING * INTO r;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record not found';
  END IF;
  PERFORM public.log_activity('participation_attended', 'participation', p_id::text,
    format('%s · %s: %s', r.full_name, r.event, CASE WHEN p_attended THEN 'marked attended' ELSE 'attendance removed' END));
END;
$$;
REVOKE ALL ON FUNCTION public.set_participation_attended(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_participation_attended(uuid, boolean) TO authenticated;

-- ── 3. Returning-delegate discount ─────────────────────────────────────
ALTER TABLE public.form_settings ADD COLUMN IF NOT EXISTS returning_discount integer NOT NULL DEFAULT 0;

-- True when the signed-in account was a delegate in an earlier season.
-- By account, not email: an unconfirmed sign-up must not claim someone else's record.
CREATE OR REPLACE FUNCTION public.is_returning_delegate()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.participations
     WHERE user_id = auth.uid() AND role = 'delegate'
       AND season < coalesce(public.current_season(), 2147483647)
  );
$$;
REVOKE ALL ON FUNCTION public.is_returning_delegate() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_returning_delegate() TO authenticated;

-- Same as 043 plus the returning discount line.
CREATE OR REPLACE FUNCTION public.trg_applications_guard_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_type  text := coalesce(NEW.application_type, 'delegate');
  v_fee   integer;
  s       public.form_settings;
BEGIN
  -- Staff adding rows from the admin panel keep full control.
  IF public.is_active_admin() THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to apply.' USING ERRCODE = '42501';
  END IF;
  IF v_type NOT IN ('delegate', 'chair') THEN
    RAISE EXCEPTION 'Unknown application type' USING ERRCODE = '22023';
  END IF;

  s := public.assert_form_open(v_type);

  IF EXISTS (
    SELECT 1 FROM public.applications
    WHERE user_id = v_uid
      AND coalesce(application_type, 'delegate') = v_type
      AND season IS NOT DISTINCT FROM public.current_season()
  ) THEN
    RAISE EXCEPTION 'You have already applied with this account.' USING ERRCODE = '23505';
  END IF;

  IF v_type = 'delegate' THEN
    v_fee := coalesce(s.fee_amount, 90000)
             - CASE WHEN NEW.has_ielts THEN coalesce(s.ielts_discount, 0) ELSE 0 END
             - CASE WHEN NEW.has_sat   THEN coalesce(s.sat_discount, 0)   ELSE 0 END
             - CASE WHEN public.is_returning_delegate() THEN coalesce(s.returning_discount, 0) ELSE 0 END;
  ELSE
    v_fee := 0;
  END IF;

  -- jsonb_populate_record ignores keys for columns that don't exist, so this
  -- keeps working if a column was never added in production.
  NEW := jsonb_populate_record(NEW, jsonb_build_object(
    'user_id', v_uid,
    'email', coalesce(nullif(v_email, ''), NEW.email),
    'application_type', v_type,
    'season', public.current_season(),
    'status', 'pending',
    'payment_status', 'pending',
    'payment_amount', greatest(v_fee, 0),
    'payment_reference', NULL,
    'assigned_committee_id', NULL,
    'reviewed_at', NULL,
    'reviewed_by', NULL,
    'checked_in_at', NULL,
    'checked_in_by', NULL,
    'contacted', false,
    'contacted_at', NULL,
    'decision_emailed_at', NULL,
    'payment_reminded_at', NULL
  ));
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';

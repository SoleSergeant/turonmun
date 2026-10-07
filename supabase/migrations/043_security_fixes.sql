-- 043_security_fixes.sql
-- Fixes from the October 2026 audit:
--  1. search_users_for_admin() let any signed-in user list every applicant's
--     and account's name + email. Now SG/Academics only.
--  2. Applications and volunteer applications accepted whatever the browser
--     sent (status 'approved', payment 'paid', fee 0, someone else's email).
--     A trigger now resets those fields for non-staff, computes the delegate
--     fee from form_settings, and enforces open/closed, opens_at, deadline,
--     capacity and one application per person per season on the server.
--  3. The 'applications' and 'resources' storage buckets let anyone LIST every
--     file. Files stay reachable by their public link; listing is now limited
--     to the uploader and staff.
--  4. Chairs could edit any delegate (update_delegate_info) and open/close the
--     registration forms (old 015 form_settings policy). Now SG/Academics/SG.
--  5. assign_chair_application() took any email, so it could turn the SG (or
--     any staff account) into a chair. It now uses the application's own email
--     and refuses to touch staff accounts.
--  6. log_activity() was callable directly, so anyone could add fake activity
--     log entries. Now only the database triggers can call it.
--  7. Public form_approved_count() so the site can show "all spots filled"
--     (the browser can't count other people's applications under RLS).
--  8. Debaters could set admin_notes / reviewed_at on their own registration.
--  9. Backfills applications.application_type from the old notes marker, so
--     the code can rely on the column.
-- Safe to re-run.

-- ── 1. search_users_for_admin ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_users_for_admin(search_query TEXT)
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, source TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(search_query, ''))) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.id::UUID, a.full_name::TEXT, a.email::TEXT, 'application'::TEXT AS source
  FROM applications a
  WHERE a.full_name ILIKE '%' || search_query || '%'
     OR a.email ILIKE '%' || search_query || '%'
  UNION
  SELECT au.id::UUID,
         COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))::TEXT,
         au.email::TEXT,
         'auth'::TEXT
  FROM auth.users au
  WHERE (au.email ILIKE '%' || search_query || '%'
     OR au.raw_user_meta_data->>'full_name' ILIKE '%' || search_query || '%')
    AND NOT EXISTS (SELECT 1 FROM applications app WHERE app.email = au.email)
  ORDER BY full_name
  LIMIT 10;
END;
$$;
REVOKE ALL ON FUNCTION public.search_users_for_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_users_for_admin(TEXT) TO authenticated;

-- ── 9. application_type backfill (needed by 2 and 7) ─────────────────
UPDATE public.applications SET application_type = 'chair'
  WHERE notes ILIKE '%APPLICATION TYPE: chair%' AND application_type IS DISTINCT FROM 'chair';
UPDATE public.applications SET application_type = 'delegate'
  WHERE application_type IS NULL;

-- ── 7. Public count of approved applications per form ────────────────
CREATE OR REPLACE FUNCTION public.form_approved_count(p_form_type text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN p_form_type = 'volunteer' THEN
      (SELECT count(*)::int FROM public.volunteer_applications
        WHERE status = 'approved' AND season IS NOT DISTINCT FROM public.current_season())
    ELSE
      (SELECT count(*)::int FROM public.applications
        WHERE status = 'approved'
          AND coalesce(application_type, 'delegate') = p_form_type
          AND season IS NOT DISTINCT FROM public.current_season())
  END;
$$;
REVOKE ALL ON FUNCTION public.form_approved_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.form_approved_count(text) TO anon, authenticated;

-- Raises a friendly error when a form isn't accepting submissions.
CREATE OR REPLACE FUNCTION public.assert_form_open(p_form_type text)
RETURNS form_settings LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.form_settings;
BEGIN
  SELECT * INTO s FROM public.form_settings WHERE form_type = p_form_type;
  IF NOT FOUND THEN RETURN s; END IF;   -- no settings row: don't block
  IF NOT s.is_open THEN
    RAISE EXCEPTION '%', coalesce(nullif(s.closed_message, ''), 'Applications are closed.') USING ERRCODE = 'P0001';
  END IF;
  IF s.opens_at IS NOT NULL AND s.opens_at > now() THEN
    RAISE EXCEPTION 'Applications open on %.', to_char(s.opens_at AT TIME ZONE 'Asia/Tashkent', 'DD Mon YYYY') USING ERRCODE = 'P0001';
  END IF;
  IF s.deadline IS NOT NULL AND s.deadline < now() THEN
    RAISE EXCEPTION 'The application deadline has passed.' USING ERRCODE = 'P0001';
  END IF;
  IF s.max_capacity IS NOT NULL AND public.form_approved_count(p_form_type) >= s.max_capacity THEN
    RAISE EXCEPTION 'All % spots have been filled.', s.max_capacity USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_form_open(text) FROM PUBLIC, anon, authenticated;

-- ── 2. Applications: server decides status, payment, fee, owner ──────
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
             - CASE WHEN NEW.has_sat   THEN coalesce(s.sat_discount, 0)   ELSE 0 END;
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
DROP TRIGGER IF EXISTS guard_insert ON public.applications;
CREATE TRIGGER guard_insert BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_applications_guard_insert();

-- Only signed-in people can apply, and only as themselves.
DROP POLICY IF EXISTS "Public can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Signed-in users can apply" ON public.applications;
CREATE POLICY "Signed-in users can apply"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_active_admin());

-- Same for volunteers.
CREATE OR REPLACE FUNCTION public.trg_volunteers_guard_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
BEGIN
  IF public.is_active_admin() THEN
    RETURN NEW;
  END IF;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to apply.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.assert_form_open('volunteer');

  NEW := jsonb_populate_record(NEW, jsonb_build_object(
    'user_id', v_uid,
    'email', coalesce(nullif(v_email, ''), NEW.email),
    'season', public.current_season(),
    'status', 'pending',
    'payment_status', 'pending',
    'admin_notes', NULL,
    'decision_emailed_at', NULL,
    'notified_at', NULL
  ));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_insert ON public.volunteer_applications;
CREATE TRIGGER guard_insert BEFORE INSERT ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_volunteers_guard_insert();

DROP POLICY IF EXISTS "Public can insert volunteer applications" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Signed-in users can volunteer" ON public.volunteer_applications;
CREATE POLICY "Signed-in users can volunteer"
  ON public.volunteer_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_active_admin());

-- ── 8. Debaters can't write the admin-only fields ─────────────────────
CREATE OR REPLACE FUNCTION public.trg_debate_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_academic_staff() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.admin_notes := NULL;
    NEW.reviewed_at := NULL;
    NEW.decision_emailed_at := NULL;
    NEW.status := 'pending';
  ELSE
    NEW.admin_notes := OLD.admin_notes;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.decision_emailed_at := OLD.decision_emailed_at;
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_fields ON public.debate_registrations;
CREATE TRIGGER guard_fields BEFORE INSERT OR UPDATE ON public.debate_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_debate_guard();

-- ── 3. Storage: no public listing ─────────────────────────────────────
-- Both buckets are public, so links from getPublicUrl() keep working
-- without a SELECT policy. SELECT only controls listing/searching.
UPDATE storage.buckets SET public = true WHERE id IN ('applications', 'resources');

DROP POLICY IF EXISTS "applications public read" ON storage.objects;
DROP POLICY IF EXISTS "applications owner or staff read" ON storage.objects;
CREATE POLICY "applications owner or staff read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'applications' AND (owner = auth.uid() OR public.is_active_admin()));

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "resources staff read" ON storage.objects;
CREATE POLICY "resources staff read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resources' AND public.is_active_admin());

-- ── 4. Chairs: no editing other committees' delegates or the forms ───
CREATE OR REPLACE FUNCTION public.update_delegate_info(
  p_id uuid, p_full_name text, p_email text, p_phone text,
  p_institution text, p_country text, p_payment_status text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only SG or Academics can edit delegates' USING ERRCODE = '42501';
  END IF;

  UPDATE public.applications
  SET full_name = p_full_name, email = p_email, phone = p_phone,
      institution = p_institution, country = p_country,
      payment_status = p_payment_status, updated_at = now()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application % not found', p_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.update_delegate_info(uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_delegate_info(uuid, text, text, text, text, text, text) TO authenticated;

DROP POLICY IF EXISTS "Admins can update form settings" ON public.form_settings;

-- ── 5. assign_chair_application: the applicant's own email only ──────
CREATE OR REPLACE FUNCTION public.assign_chair_application(
  p_application_id UUID,
  p_email          TEXT,   -- ignored; kept so existing callers still work
  p_full_name      TEXT,
  p_role           TEXT,
  p_committee_id   UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_existing text;
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('chair', 'co_chair') THEN
    RAISE EXCEPTION 'Role must be chair or co_chair';
  END IF;

  SELECT email INTO v_email FROM public.applications WHERE id = p_application_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  SELECT role INTO v_existing FROM public.admin_users WHERE lower(email) = lower(v_email);
  IF v_existing IS NOT NULL AND v_existing NOT IN ('chair', 'co_chair') THEN
    RAISE EXCEPTION '% is a staff account (%). Change it in Admin accounts instead.', v_email, v_existing;
  END IF;

  UPDATE applications SET status = 'approved', reviewed_at = NOW() WHERE id = p_application_id;

  INSERT INTO admin_users (email, full_name, role, committee_id, password_hash, is_active)
  VALUES (v_email, p_full_name, p_role, p_committee_id, 'existing_user', true)
  ON CONFLICT (email) DO UPDATE SET
    full_name    = EXCLUDED.full_name,
    role         = EXCLUDED.role,
    committee_id = EXCLUDED.committee_id,
    is_active    = true;

  IF p_role = 'chair' THEN
    UPDATE committees SET chair = p_full_name WHERE id = p_committee_id;
  ELSE
    UPDATE committees SET co_chair = p_full_name WHERE id = p_committee_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_chair_application(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_chair_application(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ── 6. log_activity: triggers only ────────────────────────────────────
-- Supabase grants EXECUTE to anon/authenticated explicitly, so revoking from
-- PUBLIC (as 038 did) wasn't enough. The SECURITY DEFINER triggers still
-- call it as the owner.
REVOKE EXECUTE ON FUNCTION public.log_activity(text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

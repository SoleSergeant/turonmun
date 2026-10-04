-- 036_role_based_security.sql
-- Makes admin roles real at the database level and closes the remaining
-- open write paths. Safe to re-run.
--
-- Fixes:
--  1. Chairs live in admin_users, so is_active_admin() treated every chair as
--     a full admin (read/update every application, delete files, promote
--     themselves to SG). Chairs are now scoped to their own committee.
--  2. Migration 031's role CHECK omitted 'chair'/'co_chair', which
--     assign_chair_application() inserts.
--  3. Live-session tables (committee_sessions, speakers_list, motions, votes,
--     attendance, session_logs) were writable by anyone, including anon.
--  4. form_settings was writable by any logged-in user; matrix_countries and
--     the resources storage bucket were writable by anon.
--  5. Page-level role limits (Messages = SG only, etc.) were UI-only.
--  6. Registration desk could edit any application; check-in now goes
--     through set_check_in() instead.
--
-- Role model after this migration:
--   sg            everything
--   academics     committees, delegates, allocation, chairs, papers, awards
--   logistics     volunteers + check-in
--   registration  check-in only
--   chair/co_chair  their own committee only (chair dashboard)

-- ── Roles ──────────────────────────────────────────────────────────────
UPDATE public.admin_users SET role = lower(trim(role)) WHERE role <> lower(trim(role));
UPDATE public.admin_users SET role = 'sg' WHERE role IN ('admin', 'superadmin');

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
-- NOT VALID: enforce for new/updated rows without failing on any odd legacy row.
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('sg', 'academics', 'logistics', 'registration', 'chair', 'co_chair')) NOT VALID;

-- ── Helpers ────────────────────────────────────────────────────────────
-- (Re)defined here too in case 031 never fully applied.
CREATE OR REPLACE FUNCTION public.has_admin_role(roles TEXT[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
      AND role = ANY (roles)
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_admin_role(TEXT[]) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_sg()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_admin_role(ARRAY['sg', 'admin', 'superadmin']);
$$;
GRANT EXECUTE ON FUNCTION public.is_sg() TO authenticated, anon;

-- Staff = anyone who uses the admin panel. Chairs are NOT staff.
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_admin_role(ARRAY['sg','admin','superadmin','academics','logistics','registration']);
$$;

-- SG or Academics: the roles that manage the conference itself.
CREATE OR REPLACE FUNCTION public.is_academic_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_admin_role(ARRAY['sg','admin','superadmin','academics']);
$$;
GRANT EXECUTE ON FUNCTION public.is_academic_staff() TO authenticated, anon;

-- True when the caller chairs (or co-chairs) the given committee.
CREATE OR REPLACE FUNCTION public.is_chair_of(p_committee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_committee_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
      AND role IN ('chair', 'co_chair')
      AND committee_id = p_committee_id
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_chair_of(uuid) TO authenticated, anon;

-- Who may run a committee's live session: its chairs, plus SG/Academics.
CREATE OR REPLACE FUNCTION public.can_run_session(p_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_academic_staff() OR EXISTS (
    SELECT 1 FROM public.committee_sessions s
    WHERE s.id = p_session_id AND public.is_chair_of(s.committee_id)
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_run_session(uuid) TO authenticated, anon;

-- ── Check-in (registration desk) ───────────────────────────────────────
-- Lets any staff role mark a delegate or chair as arrived without needing
-- UPDATE rights on the whole applications / admin_users tables.
CREATE OR REPLACE FUNCTION public.set_check_in(p_kind text, p_id uuid, p_checked boolean)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin uuid;
  v_at    timestamptz := CASE WHEN p_checked THEN now() ELSE NULL END;
BEGIN
  IF NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO v_admin FROM public.admin_users WHERE email = auth.jwt() ->> 'email';

  IF p_kind = 'delegate' THEN
    UPDATE public.applications
      SET checked_in_at = v_at, checked_in_by = CASE WHEN p_checked THEN v_admin END
      WHERE id = p_id;
  ELSIF p_kind = 'chair' THEN
    UPDATE public.admin_users
      SET checked_in_at = v_at, checked_in_by = CASE WHEN p_checked THEN v_admin END
      WHERE id = p_id AND role IN ('chair', 'co_chair');
  ELSE
    RAISE EXCEPTION 'Unknown kind %', p_kind;
  END IF;
  RETURN v_at;
END;
$$;
REVOKE ALL ON FUNCTION public.set_check_in(text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_check_in(text, uuid, boolean) TO authenticated;

-- assign_chair_application() is SECURITY DEFINER; make sure only SG/Academics can call it.
CREATE OR REPLACE FUNCTION public.assign_chair_application(
  p_application_id UUID,
  p_email          TEXT,
  p_full_name      TEXT,
  p_role           TEXT,
  p_committee_id   UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('chair', 'co_chair') THEN
    RAISE EXCEPTION 'Role must be chair or co_chair';
  END IF;

  UPDATE applications SET status = 'approved', reviewed_at = NOW() WHERE id = p_application_id;

  INSERT INTO admin_users (email, full_name, role, committee_id, password_hash, is_active)
  VALUES (p_email, p_full_name, p_role, p_committee_id, 'existing_user', true)
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

-- ── applications ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "SG or Academics can update applications"
  ON public.applications FOR UPDATE
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

DROP POLICY IF EXISTS "Chairs can read their committee delegates" ON public.applications;
CREATE POLICY "Chairs can read their committee delegates"
  ON public.applications FOR SELECT
  USING (public.is_chair_of(assigned_committee_id));

-- ── country_assignments ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage country assignments" ON public.country_assignments;
DROP POLICY IF EXISTS "Staff can read country assignments" ON public.country_assignments;
DROP POLICY IF EXISTS "SG or Academics manage country assignments" ON public.country_assignments;
DROP POLICY IF EXISTS "Chairs can read their committee assignments" ON public.country_assignments;
CREATE POLICY "Staff can read country assignments"
  ON public.country_assignments FOR SELECT USING (public.is_active_admin());
CREATE POLICY "SG or Academics manage country assignments"
  ON public.country_assignments FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());
CREATE POLICY "Chairs can read their committee assignments"
  ON public.country_assignments FOR SELECT USING (public.is_chair_of(committee_id));

-- ── matrix_countries (was writable by anon) ────────────────────────────
DROP POLICY IF EXISTS "Admins can manage matrix countries" ON public.matrix_countries;
CREATE POLICY "Admins can manage matrix countries"
  ON public.matrix_countries FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

-- ── committees / resources / schedule ──────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage committees" ON public.committees;
CREATE POLICY "Admins can manage committees"
  ON public.committees FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

DROP POLICY IF EXISTS "Admins can manage schedule" ON public.schedule_events;
CREATE POLICY "Admins can manage schedule"
  ON public.schedule_events FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

-- ── SG-only tables ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "SG can manage contact messages" ON public.contact_messages;
CREATE POLICY "SG can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_sg()) WITH CHECK (public.is_sg());

DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_sg()) WITH CHECK (public.is_sg());

DROP POLICY IF EXISTS "Admins can update season info" ON public.season_info;
CREATE POLICY "Admins can update season info"
  ON public.season_info FOR ALL
  USING (public.is_sg()) WITH CHECK (public.is_sg());

-- form_settings was writable by ANY logged-in user (delegates included).
DROP POLICY IF EXISTS "Authenticated can update form settings" ON public.form_settings;
DROP POLICY IF EXISTS "SG can manage form settings" ON public.form_settings;
CREATE POLICY "SG can manage form settings"
  ON public.form_settings FOR ALL
  USING (public.is_sg()) WITH CHECK (public.is_sg());

-- ── admin_users ────────────────────────────────────────────────────────
-- SG manages every account. Academics may only manage chair accounts
-- (Chair Management page). Nobody else can write — previously any active
-- admin_users row (chairs included) could promote itself to SG.
DROP POLICY IF EXISTS "Active admins can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "SG or Academics manage admin_users" ON public.admin_users;
CREATE POLICY "SG or Academics manage admin_users"
  ON public.admin_users FOR ALL
  USING (public.is_sg() OR (public.has_admin_role(ARRAY['academics']) AND role IN ('chair', 'co_chair')))
  WITH CHECK (public.is_sg() OR (public.has_admin_role(ARRAY['academics']) AND role IN ('chair', 'co_chair')));
-- "Active admins can read admin_users" (staff) and "Users can read own admin record" stay.

-- ── position papers ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all papers" ON public.position_papers;
CREATE POLICY "Admins can manage all papers"
  ON public.position_papers FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());
DROP POLICY IF EXISTS "Chairs manage their committee papers" ON public.position_papers;
CREATE POLICY "Chairs manage their committee papers"
  ON public.position_papers FOR ALL
  USING (public.is_chair_of(committee_id)) WITH CHECK (public.is_chair_of(committee_id));

-- ── announcements ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Chairs can manage announcements" ON public.committee_announcements;
CREATE POLICY "Chairs can manage announcements"
  ON public.committee_announcements FOR ALL
  USING (public.is_academic_staff() OR public.is_chair_of(committee_id))
  WITH CHECK (public.is_academic_staff() OR public.is_chair_of(committee_id));

-- ── awards ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update award settings" ON public.award_settings;
CREATE POLICY "Admins can update award settings"
  ON public.award_settings FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

DROP POLICY IF EXISTS "Admins manage awards" ON public.committee_awards;
CREATE POLICY "Admins manage awards"
  ON public.committee_awards FOR ALL
  USING (public.is_academic_staff() OR public.is_chair_of(committee_id))
  WITH CHECK (public.is_academic_staff() OR public.is_chair_of(committee_id));

-- ── demographic aliases ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage aliases" ON public.demographic_aliases;
CREATE POLICY "Admins manage aliases"
  ON public.demographic_aliases FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

-- ── live session tables (were writable by anyone, including anon) ──────
-- Delegates only read these (Live Session page); every write comes from
-- the chair's Command Center.
DROP POLICY IF EXISTS "Anyone can view sessions"  ON public.committee_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.committee_sessions;
DROP POLICY IF EXISTS "Signed-in users can read sessions" ON public.committee_sessions;
DROP POLICY IF EXISTS "Chairs run their sessions" ON public.committee_sessions;
CREATE POLICY "Signed-in users can read sessions"
  ON public.committee_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Chairs run their sessions"
  ON public.committee_sessions FOR ALL
  USING (public.is_academic_staff() OR public.is_chair_of(committee_id))
  WITH CHECK (public.is_academic_staff() OR public.is_chair_of(committee_id));

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['speakers_list', 'motions', 'votes', 'attendance', 'session_logs'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can view speakers" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can manage speakers" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can view motions" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can manage motions" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can view votes" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can manage votes" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can view attendance" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage attendance" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can view logs" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage logs" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Signed-in users can read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Session runners can write" ON public.%I', t);

    EXECUTE format('CREATE POLICY "Signed-in users can read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- votes hang off motions, everything else off a session.
CREATE POLICY "Session runners can write" ON public.speakers_list FOR ALL
  USING (public.can_run_session(session_id)) WITH CHECK (public.can_run_session(session_id));
CREATE POLICY "Session runners can write" ON public.motions FOR ALL
  USING (public.can_run_session(session_id)) WITH CHECK (public.can_run_session(session_id));
CREATE POLICY "Session runners can write" ON public.attendance FOR ALL
  USING (public.can_run_session(session_id)) WITH CHECK (public.can_run_session(session_id));
CREATE POLICY "Session runners can write" ON public.session_logs FOR ALL
  USING (public.can_run_session(session_id)) WITH CHECK (public.can_run_session(session_id));
CREATE POLICY "Session runners can write" ON public.votes FOR ALL
  USING (public.can_run_session((SELECT m.session_id FROM public.motions m WHERE m.id = motion_id)))
  WITH CHECK (public.can_run_session((SELECT m.session_id FROM public.motions m WHERE m.id = motion_id)));

-- ── storage ────────────────────────────────────────────────────────────
-- resources + committees buckets: staff only (resources was open to anon).
DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
CREATE POLICY "Admins can upload resources" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resources' AND public.is_academic_staff());
CREATE POLICY "Admins can update resources" ON storage.objects FOR UPDATE
  USING (bucket_id = 'resources' AND public.is_academic_staff());
CREATE POLICY "Admins can delete resources" ON storage.objects FOR DELETE
  USING (bucket_id = 'resources' AND public.is_academic_staff());

DROP POLICY IF EXISTS "committees auth insert" ON storage.objects;
DROP POLICY IF EXISTS "committees auth update" ON storage.objects;
DROP POLICY IF EXISTS "committees auth delete" ON storage.objects;
CREATE POLICY "committees auth insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'committees' AND public.is_academic_staff());
CREATE POLICY "committees auth update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'committees' AND public.is_academic_staff());
CREATE POLICY "committees auth delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'committees' AND public.is_academic_staff());

-- applications bucket: delegates upload photos/certificates/papers, so any
-- signed-in user may upload — but only the uploader or staff may overwrite
-- or delete a file (previously anyone signed in could delete anything).
DROP POLICY IF EXISTS "applications auth update" ON storage.objects;
DROP POLICY IF EXISTS "applications auth delete" ON storage.objects;
CREATE POLICY "applications auth update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'applications' AND (owner = auth.uid() OR public.is_active_admin()));
CREATE POLICY "applications auth delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'applications' AND (owner = auth.uid() OR public.is_active_admin()));

NOTIFY pgrst, 'reload schema';

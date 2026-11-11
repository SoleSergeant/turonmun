-- 055_live_session_read_access.sql
-- Live-session data (sessions, speakers, motions, votes, attendance, logs)
-- was readable by every signed-in account, including people with no place in
-- the conference. Now only that committee's delegates and chairs, and staff,
-- can read it. Who can write is unchanged. Safe to re-run.

CREATE OR REPLACE FUNCTION public.can_view_committee(p_committee_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_committee_id IS NOT NULL AND (
    public.is_active_admin()
    OR public.is_chair_of(p_committee_id)
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.assigned_committee_id = p_committee_id
        AND (a.user_id = auth.uid() OR a.email = auth.jwt() ->> 'email')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.committee_sessions s
    WHERE s.id = p_session_id AND public.can_view_committee(s.committee_id)
  );
$$;

REVOKE ALL ON FUNCTION public.can_view_committee(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_committee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_session(uuid) TO authenticated;

DROP POLICY IF EXISTS "Signed-in users can read sessions" ON public.committee_sessions;
DROP POLICY IF EXISTS "Committee members can read sessions" ON public.committee_sessions;
CREATE POLICY "Committee members can read sessions" ON public.committee_sessions
  FOR SELECT TO authenticated USING (public.can_view_committee(committee_id));

DROP POLICY IF EXISTS "Signed-in users can read" ON public.speakers_list;
DROP POLICY IF EXISTS "Committee members can read" ON public.speakers_list;
CREATE POLICY "Committee members can read" ON public.speakers_list
  FOR SELECT TO authenticated USING (public.can_view_session(session_id));

DROP POLICY IF EXISTS "Signed-in users can read" ON public.motions;
DROP POLICY IF EXISTS "Committee members can read" ON public.motions;
CREATE POLICY "Committee members can read" ON public.motions
  FOR SELECT TO authenticated USING (public.can_view_session(session_id));

DROP POLICY IF EXISTS "Signed-in users can read" ON public.attendance;
DROP POLICY IF EXISTS "Committee members can read" ON public.attendance;
CREATE POLICY "Committee members can read" ON public.attendance
  FOR SELECT TO authenticated USING (public.can_view_session(session_id));

DROP POLICY IF EXISTS "Signed-in users can read" ON public.session_logs;
DROP POLICY IF EXISTS "Committee members can read" ON public.session_logs;
CREATE POLICY "Committee members can read" ON public.session_logs
  FOR SELECT TO authenticated USING (public.can_view_session(session_id));

DROP POLICY IF EXISTS "Signed-in users can read" ON public.votes;
DROP POLICY IF EXISTS "Committee members can read" ON public.votes;
CREATE POLICY "Committee members can read" ON public.votes
  FOR SELECT TO authenticated
  USING (public.can_view_session((SELECT m.session_id FROM public.motions m WHERE m.id = votes.motion_id)));

NOTIFY pgrst, 'reload schema';

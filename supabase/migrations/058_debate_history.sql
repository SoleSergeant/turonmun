-- 058_debate_history.sql
-- Turon Debate → participation history. Called from Admin → Debate day →
-- Results → "Save to history" once the event is over.
--   • Debaters: approved registrations, with their team.
--   • Judges: active 'judge' accounts.
--   • p_awards: { "<registration id>": "Winning team, One-on-one win" },
--     built in the browser from the same ranking the Results tab shows.
-- Re-running updates the rows (team, award, attendance), so results can be
-- corrected and saved again.

CREATE OR REPLACE FUNCTION public.record_debate_history(p_event text, p_awards jsonb DEFAULT '{}'::jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_n integer := 0;
  v_k integer;
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only the SG or Academics can save debate history' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(p_event), '') IS NULL THEN
    RAISE EXCEPTION 'Event name is required';
  END IF;

  INSERT INTO public.participations (user_id, email, full_name, event, role, committee, award, attended)
  SELECT DISTINCT ON (lower(r.email))
         r.user_id, lower(r.email), r.full_name, trim(p_event), 'debater',
         CASE WHEN t.id IS NOT NULL THEN
           'Team ' || t.label || coalesce(' · ' || nullif(trim(t.name), ''), '') || coalesce(' (' || nullif(trim(t.position), '') || ')', '')
         END,
         nullif(trim(p_awards ->> r.id::text), ''),
         -- Attended = their team was scored or they were in a judged one-on-one.
         CASE WHEN EXISTS (SELECT 1 FROM public.debate_scores s WHERE s.team_id = r.team_id)
                OR EXISTS (SELECT 1 FROM public.debate_pairings p JOIN public.debate_pair_votes v ON v.pairing_id = p.id
                            WHERE r.id IN (p.a_id, p.b_id))
              THEN true END
    FROM public.debate_registrations r
    LEFT JOIN public.debate_teams t ON t.id = r.team_id
   WHERE r.status = 'approved'
   ORDER BY lower(r.email), r.created_at DESC
  ON CONFLICT (email, event, role) DO UPDATE
    SET user_id = EXCLUDED.user_id, full_name = EXCLUDED.full_name, committee = EXCLUDED.committee,
        award = EXCLUDED.award, attended = EXCLUDED.attended;
  GET DIAGNOSTICS v_k = ROW_COUNT; v_n := v_n + v_k;

  INSERT INTO public.participations (user_id, email, full_name, event, role, attended)
  SELECT au.id, lower(u.email), coalesce(nullif(trim(u.full_name), ''), u.email), trim(p_event), 'judge',
         CASE WHEN EXISTS (SELECT 1 FROM public.debate_scores s WHERE s.judge_id = au.id)
                OR EXISTS (SELECT 1 FROM public.debate_pair_votes v WHERE v.judge_id = au.id)
              THEN true END
    FROM public.admin_users u
    LEFT JOIN auth.users au ON lower(au.email) = lower(u.email)
   WHERE u.role = 'judge' AND u.is_active AND u.email IS NOT NULL
  ON CONFLICT (email, event, role) DO UPDATE
    SET user_id = EXCLUDED.user_id, full_name = EXCLUDED.full_name, attended = EXCLUDED.attended;
  GET DIAGNOSTICS v_k = ROW_COUNT; v_n := v_n + v_k;

  PERFORM public.log_activity('debate_history_saved', 'participation', trim(p_event),
    format('Saved %s to participation history (%s rows)', trim(p_event), v_n));
  RETURN v_n;
END;
$$;
REVOKE ALL ON FUNCTION public.record_debate_history(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_debate_history(text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

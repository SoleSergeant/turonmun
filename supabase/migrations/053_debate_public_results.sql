-- 053_debate_public_results.sql
-- Public results on the Turon Debate site. Returns nothing until the
-- organisers switch Site content → Turon Debate → "Show results" on.
-- Debaters: name, school and seat only. Judges: an anonymous id per judge
-- (to count them), never their name or account.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.debate_public_results()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN coalesce((SELECT (value ->> 'show_results')::boolean FROM public.site_content WHERE key = 'debate'), false)
  THEN jsonb_build_object(
    'teams', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'label', label, 'name', name, 'position', position) ORDER BY label) FROM public.debate_teams), '[]'),
    'roster', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'institution', institution, 'team_id', team_id, 'slot', slot))
                        FROM public.debate_registrations WHERE status = 'approved' AND team_id IS NOT NULL), '[]'),
    'pairings', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'round', round, 'position', position, 'a_id', a_id, 'b_id', b_id) ORDER BY round, position) FROM public.debate_pairings), '[]'),
    'scores', coalesce((SELECT jsonb_agg(jsonb_build_object('judge_id', md5(judge_id::text), 'team_id', team_id, 'scores', scores)) FROM public.debate_scores), '[]'),
    'votes', coalesce((SELECT jsonb_agg(jsonb_build_object('judge_id', md5(judge_id::text), 'pairing_id', pairing_id, 'winner_id', winner_id)) FROM public.debate_pair_votes), '[]')
  ) END;
$$;
REVOKE ALL ON FUNCTION public.debate_public_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debate_public_results() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- 045_debate_judging.sql
-- Turon Debate event day: teams chosen by the organisers, one-on-one
-- pairings, and judge accounts that score teams and pick one-on-one
-- winners, with live rankings.
--
--   debate_teams            A, B, C, D … with a name and a position
--   debate_registrations    + team_id, slot (A1, A2 …)
--   debate_pairings         one-on-one pairs (and a "round" for later)
--   debate_scores           one row per judge per team: criteria → points
--   debate_pair_votes       one row per judge per pair: the winner
--
-- Judges are admin_users with role 'judge'. They are not staff: they never
-- see registrations directly (no phone numbers or emails), only names,
-- schools and teams through debate_roster().
-- Safe to re-run.

-- ── Judge role ────────────────────────────────────────────────────────
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('sg', 'academics', 'logistics', 'registration', 'chair', 'co_chair', 'judge')) NOT VALID;

CREATE OR REPLACE FUNCTION public.is_debate_judge()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_admin_role(ARRAY['judge']);
$$;
GRANT EXECUTE ON FUNCTION public.is_debate_judge() TO authenticated;

-- Staff who run the debate, or a judge.
CREATE OR REPLACE FUNCTION public.can_see_debate_event()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_academic_staff() OR public.is_debate_judge();
$$;
GRANT EXECUTE ON FUNCTION public.can_see_debate_event() TO authenticated;

-- ── Teams ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.debate_teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL UNIQUE,          -- A, B, C, D …
  name       text,                          -- optional team name
  position   text,                          -- the team's position / role on the topic
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.debate_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Debate staff and judges read teams" ON public.debate_teams;
CREATE POLICY "Debate staff and judges read teams" ON public.debate_teams
  FOR SELECT USING (public.can_see_debate_event());
DROP POLICY IF EXISTS "SG or Academics manage teams" ON public.debate_teams;
CREATE POLICY "SG or Academics manage teams" ON public.debate_teams
  FOR ALL USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

ALTER TABLE public.debate_registrations
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.debate_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slot integer;
CREATE UNIQUE INDEX IF NOT EXISTS debate_registrations_team_slot
  ON public.debate_registrations (team_id, slot) WHERE team_id IS NOT NULL;

-- Debaters can't move themselves between teams (043's guard covers the
-- other admin fields).
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
    NEW.team_id := NULL;
    NEW.slot := NULL;
  ELSE
    NEW.admin_notes := OLD.admin_notes;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.decision_emailed_at := OLD.decision_emailed_at;
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
    NEW.team_id := OLD.team_id;
    NEW.slot := OLD.slot;
  END IF;
  RETURN NEW;
END;
$$;

-- ── One-on-one pairings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.debate_pairings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round      integer NOT NULL DEFAULT 1,
  position   integer NOT NULL DEFAULT 0,     -- display order
  a_id       uuid NOT NULL REFERENCES public.debate_registrations(id) ON DELETE CASCADE,
  b_id       uuid NOT NULL REFERENCES public.debate_registrations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (a_id <> b_id)
);
ALTER TABLE public.debate_pairings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Debate staff and judges read pairings" ON public.debate_pairings;
CREATE POLICY "Debate staff and judges read pairings" ON public.debate_pairings
  FOR SELECT USING (public.can_see_debate_event());
DROP POLICY IF EXISTS "SG or Academics manage pairings" ON public.debate_pairings;
CREATE POLICY "SG or Academics manage pairings" ON public.debate_pairings
  FOR ALL USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

-- ── Scores ────────────────────────────────────────────────────────────
-- One sheet per judge per team. scores = {"Arguments & logic": 22, …};
-- the criteria and their maximums live in Site content → Turon Debate.
CREATE TABLE IF NOT EXISTS public.debate_scores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id   uuid NOT NULL DEFAULT auth.uid(),
  judge_name text,
  team_id    uuid NOT NULL REFERENCES public.debate_teams(id) ON DELETE CASCADE,
  scores     jsonb NOT NULL DEFAULT '{}'::jsonb,
  total      numeric NOT NULL DEFAULT 0,
  notes      text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (judge_id, team_id)
);
ALTER TABLE public.debate_scores ENABLE ROW LEVEL SECURITY;

-- Everyone on the panel sees all sheets (that's what the rankings are made of).
DROP POLICY IF EXISTS "Debate staff and judges read scores" ON public.debate_scores;
CREATE POLICY "Debate staff and judges read scores" ON public.debate_scores
  FOR SELECT USING (public.can_see_debate_event());
-- Judges (and staff) write only their own sheet.
DROP POLICY IF EXISTS "Judges write their own scores" ON public.debate_scores;
CREATE POLICY "Judges write their own scores" ON public.debate_scores
  FOR ALL USING (public.can_see_debate_event() AND judge_id = auth.uid())
  WITH CHECK (public.can_see_debate_event() AND judge_id = auth.uid());
DROP POLICY IF EXISTS "SG or Academics clear scores" ON public.debate_scores;
CREATE POLICY "SG or Academics clear scores" ON public.debate_scores
  FOR DELETE USING (public.is_academic_staff());

-- ── One-on-one votes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.debate_pair_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id    uuid NOT NULL DEFAULT auth.uid(),
  judge_name  text,
  pairing_id  uuid NOT NULL REFERENCES public.debate_pairings(id) ON DELETE CASCADE,
  winner_id   uuid NOT NULL REFERENCES public.debate_registrations(id) ON DELETE CASCADE,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (judge_id, pairing_id)
);
ALTER TABLE public.debate_pair_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Debate staff and judges read votes" ON public.debate_pair_votes;
CREATE POLICY "Debate staff and judges read votes" ON public.debate_pair_votes
  FOR SELECT USING (public.can_see_debate_event());
DROP POLICY IF EXISTS "Judges write their own votes" ON public.debate_pair_votes;
CREATE POLICY "Judges write their own votes" ON public.debate_pair_votes
  FOR ALL USING (public.can_see_debate_event() AND judge_id = auth.uid())
  WITH CHECK (public.can_see_debate_event() AND judge_id = auth.uid());
DROP POLICY IF EXISTS "SG or Academics clear votes" ON public.debate_pair_votes;
CREATE POLICY "SG or Academics clear votes" ON public.debate_pair_votes
  FOR DELETE USING (public.is_academic_staff());

-- ── What judges may see about debaters ────────────────────────────────
-- Name, school and team only — no phone, email or answers.
CREATE OR REPLACE FUNCTION public.debate_roster()
RETURNS TABLE (id uuid, full_name text, institution text, team_id uuid, slot integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_see_debate_event() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT r.id, r.full_name, r.institution, r.team_id, r.slot
    FROM public.debate_registrations r
    WHERE r.status = 'approved'
    ORDER BY r.full_name;
END;
$$;
REVOKE ALL ON FUNCTION public.debate_roster() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.debate_roster() TO authenticated;

-- A debater's own team and one-on-one opponent, for "My registration".
-- Shown only once the organisers switch "Show teams to debaters" on.
CREATE OR REPLACE FUNCTION public.my_debate_assignment()
RETURNS TABLE (team_label text, team_name text, team_position text, slot integer, opponent text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.label, t.name, t.position, r.slot,
         (SELECT o.full_name
            FROM public.debate_pairings p
            JOIN public.debate_registrations o ON o.id = CASE WHEN p.a_id = r.id THEN p.b_id ELSE p.a_id END
           WHERE p.a_id = r.id OR p.b_id = r.id
           ORDER BY p.round DESC
           LIMIT 1)
  FROM public.debate_registrations r
  LEFT JOIN public.debate_teams t ON t.id = r.team_id
  WHERE r.user_id = auth.uid()
    AND r.status = 'approved'
    AND coalesce((SELECT (value ->> 'reveal_teams')::boolean FROM public.site_content WHERE key = 'debate'), false);
$$;
REVOKE ALL ON FUNCTION public.my_debate_assignment() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_debate_assignment() TO authenticated;

NOTIFY pgrst, 'reload schema';

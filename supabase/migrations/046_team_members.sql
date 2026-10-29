-- 046_team_members.sql
-- People shown on the public Team page (turonmun.com/team), edited in
-- Admin → Team. `team` is a free-text group name ("Secretariat",
-- "Contributors", …); the page groups by it. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (length(trim(name)) > 0),
  role        text,
  team        text NOT NULL DEFAULT 'Secretariat',
  photo_url   text,
  link_url    text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_order_idx ON public.team_members (team, sort_order, name);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read visible team members" ON public.team_members;
CREATE POLICY "Anyone can read visible team members"
  ON public.team_members FOR SELECT USING (is_visible OR public.is_sg());

DROP POLICY IF EXISTS "SG can edit team members" ON public.team_members;
CREATE POLICY "SG can edit team members"
  ON public.team_members FOR ALL
  USING (public.is_sg()) WITH CHECK (public.is_sg());

NOTIFY pgrst, 'reload schema';

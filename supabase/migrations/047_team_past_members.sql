-- 047_team_past_members.sql
-- Marks people who are no longer on the team; the Team page lists them
-- under "Past Members" at the bottom. Safe to re-run.

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS is_past boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';

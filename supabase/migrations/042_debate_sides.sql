-- 042_debate_sides.sql
-- Turon Debate: the side a debater would like to be on (Affirmative,
-- Opposition, Government, Parents … — the list lives in Site content →
-- Turon Debate), plus a public, counts-only summary so the form can show
-- "17% of registrations chose Parents" without exposing anyone's row.
-- Safe to re-run.

ALTER TABLE public.debate_registrations
  ADD COLUMN IF NOT EXISTS preferred_side text;

CREATE INDEX IF NOT EXISTS idx_debate_registrations_side
  ON public.debate_registrations (preferred_side);

-- Number of registrations per side. Rejected registrations don't count.
-- SECURITY DEFINER so anonymous visitors get totals, never names.
CREATE OR REPLACE FUNCTION public.debate_side_stats()
RETURNS TABLE (side text, registrations bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT preferred_side, count(*)
  FROM public.debate_registrations
  WHERE preferred_side IS NOT NULL AND status <> 'rejected'
  GROUP BY preferred_side;
$$;

REVOKE ALL ON FUNCTION public.debate_side_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debate_side_stats() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

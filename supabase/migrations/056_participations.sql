-- 056_participations.sql
-- Participation history: one row per person per event (delegate, chair,
-- volunteer…). Text columns are copies, so history survives committees
-- being renamed or deleted and seats being cleared at season rollover.
--
--   • snapshot_season_participations(season) fills it from applications,
--     seats (live or archived), awards and volunteers. Safe to re-run.
--   • start_new_season() now calls it before clearing the old season.
--   • Every archived season (today: Season 7) is backfilled at the end.

CREATE TABLE IF NOT EXISTS public.participations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email            text NOT NULL CHECK (email = lower(email)),
  full_name        text NOT NULL,
  season           integer,                 -- NULL for non-season events (CAMU, debate)
  event            text NOT NULL,           -- 'Season 7', 'TuronMUN x CAMU', …
  role             text NOT NULL CHECK (role IN ('delegate','chair','co_chair','volunteer','secretariat','debater','judge')),
  committee        text,
  country          text,
  award            text,
  attended         boolean,                 -- NULL = not recorded (no check-in)
  certificate_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  source           text NOT NULL DEFAULT 'auto',   -- auto | import | manual
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, event, role)
);
CREATE INDEX IF NOT EXISTS idx_participations_user ON public.participations (user_id);

ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own participations" ON public.participations;
DROP POLICY IF EXISTS "Staff read participations" ON public.participations;
-- By account only, not by email: an unconfirmed sign-up must not see someone else's record.
CREATE POLICY "Read own participations" ON public.participations
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff read participations" ON public.participations
  FOR SELECT TO authenticated USING (public.is_active_admin());
-- No write policies: rows are written only by the functions below.
REVOKE ALL ON public.participations FROM anon, authenticated;
GRANT SELECT ON public.participations TO authenticated;

-- ── snapshot ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.snapshot_season_participations(p_season integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event text := coalesce((SELECT name FROM public.seasons WHERE number = p_season), 'Season ' || p_season);
  v_live  boolean := p_season IS NOT DISTINCT FROM public.current_season();
  v_n     integer := 0;
  v_k     integer;
BEGIN
  -- Delegates: approved applications + their seat + awards.
  WITH seats AS (
    SELECT application_id, committee_id, coalesce(country, country_name) AS country
      FROM public.country_assignments WHERE v_live
    UNION ALL
    SELECT (row_data->>'application_id')::uuid, (row_data->>'committee_id')::uuid,
           coalesce(row_data->>'country', row_data->>'country_name')
      FROM public.season_archive WHERE season = p_season AND source = 'country_assignments'
  ), wins AS (
    SELECT application_id, award_type FROM public.committee_awards WHERE v_live
    UNION ALL
    SELECT (row_data->>'application_id')::uuid, row_data->>'award_type'
      FROM public.season_archive WHERE season = p_season AND source = 'committee_awards'
  ), awards AS (
    SELECT application_id, string_agg(DISTINCT CASE award_type
             WHEN 'best_delegate' THEN 'Best Delegate'
             WHEN 'best_speaker' THEN 'Best Speaker'
             WHEN 'honorable_mention' THEN 'Honorable Mention'
             ELSE award_type END, ', ') AS award
      FROM wins WHERE application_id IS NOT NULL GROUP BY application_id
  )
  INSERT INTO public.participations (user_id, email, full_name, season, event, role, committee, country, award, attended)
  SELECT DISTINCT ON (lower(a.email))
         a.user_id, lower(a.email), a.full_name, p_season, v_event, 'delegate',
         c.name, s.country, w.award,
         CASE WHEN a.checked_in_at IS NOT NULL THEN true END
    FROM public.applications a
    LEFT JOIN seats s ON s.application_id = a.id
    LEFT JOIN public.committees c ON c.id = coalesce(s.committee_id, a.assigned_committee_id)
    LEFT JOIN awards w ON w.application_id = a.id
   WHERE a.season = p_season AND a.status = 'approved'
     AND coalesce(a.application_type, 'delegate') <> 'chair'
     AND a.email IS NOT NULL
   ORDER BY lower(a.email), a.created_at DESC
  ON CONFLICT (email, event, role) DO NOTHING;
  GET DIAGNOSTICS v_k = ROW_COUNT; v_n := v_n + v_k;

  -- Chairs: approved chair applications; role and committee from their chair account.
  INSERT INTO public.participations (user_id, email, full_name, season, event, role, committee, attended)
  SELECT DISTINCT ON (lower(a.email))
         a.user_id, lower(a.email), a.full_name, p_season, v_event,
         CASE WHEN u.role = 'co_chair' THEN 'co_chair' ELSE 'chair' END,
         c.name,
         CASE WHEN v_live AND u.checked_in_at IS NOT NULL THEN true END
    FROM public.applications a
    LEFT JOIN public.admin_users u ON lower(u.email) = lower(a.email) AND u.role IN ('chair', 'co_chair')
    LEFT JOIN public.committees c ON c.id = coalesce(u.committee_id, a.assigned_committee_id)
   WHERE a.season = p_season AND a.status = 'approved'
     AND a.application_type = 'chair' AND a.email IS NOT NULL
   ORDER BY lower(a.email), a.created_at DESC
  ON CONFLICT (email, event, role) DO NOTHING;
  GET DIAGNOSTICS v_k = ROW_COUNT; v_n := v_n + v_k;

  -- Volunteers
  INSERT INTO public.participations (user_id, email, full_name, season, event, role)
  SELECT DISTINCT ON (lower(v.email))
         v.user_id, lower(v.email), v.full_name, p_season, v_event, 'volunteer'
    FROM public.volunteer_applications v
   WHERE v.season = p_season AND v.status = 'approved' AND v.email IS NOT NULL
   ORDER BY lower(v.email), v.created_at DESC
  ON CONFLICT (email, event, role) DO NOTHING;
  GET DIAGNOSTICS v_k = ROW_COUNT; v_n := v_n + v_k;

  RETURN v_n;
END;
$$;
-- Internal: called by start_new_season (SECURITY DEFINER) and by this migration.
REVOKE ALL ON FUNCTION public.snapshot_season_participations(integer) FROM PUBLIC, anon, authenticated;

-- ── start_new_season: snapshot before clearing ─────────────────────────
-- Same as 039 plus the PERFORM line.
CREATE OR REPLACE FUNCTION public.start_new_season(p_number integer, p_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old integer := public.current_season();
BEGIN
  IF NOT public.is_sg() THEN
    RAISE EXCEPTION 'Only the Secretary-General can start a new season' USING ERRCODE = '42501';
  END IF;
  IF p_number IS NULL OR (v_old IS NOT NULL AND p_number <= v_old) THEN
    RAISE EXCEPTION 'The new season number must be greater than %', v_old;
  END IF;

  IF v_old IS NOT NULL THEN
    -- While seats, awards and chair check-ins are still live.
    PERFORM public.snapshot_season_participations(v_old);

    INSERT INTO public.season_archive (season, source, row_data)
      SELECT v_old, 'country_assignments', to_jsonb(a) FROM public.country_assignments a;
    INSERT INTO public.season_archive (season, source, row_data)
      SELECT v_old, 'committee_awards', to_jsonb(w) FROM public.committee_awards w;
    INSERT INTO public.season_archive (season, source, row_data)
      SELECT v_old, 'committee_announcements', to_jsonb(n) FROM public.committee_announcements n;

    -- "WHERE true": Supabase's safeupdate rejects DELETE/UPDATE with no WHERE.
    DELETE FROM public.country_assignments WHERE true;
    DELETE FROM public.committee_awards WHERE true;
    DELETE FROM public.committee_announcements WHERE true;

    UPDATE public.seasons SET is_current = false, archived_at = now() WHERE number = v_old;
  END IF;

  UPDATE public.award_settings SET locked = false, published = false WHERE true;
  UPDATE public.admin_users SET is_active = false, checked_in_at = NULL, checked_in_by = NULL
    WHERE role IN ('chair', 'co_chair');

  INSERT INTO public.seasons (number, name, is_current)
  VALUES (p_number, coalesce(nullif(trim(p_name), ''), 'Season ' || p_number), true);

  PERFORM public.log_activity('season_started', 'season', p_number::text,
    format('Started %s (archived season %s)', coalesce(nullif(trim(p_name), ''), 'Season ' || p_number), coalesce(v_old::text, '—')));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.start_new_season(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_new_season(integer, text) TO authenticated;

-- ── Backfill every archived season (today: Season 7) ───────────────────
SELECT public.snapshot_season_participations(number) FROM public.seasons WHERE NOT is_current;

NOTIFY pgrst, 'reload schema';

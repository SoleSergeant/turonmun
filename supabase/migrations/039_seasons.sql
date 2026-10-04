-- 039_seasons.sql
-- Seasons, so a new conference starts clean without deleting the last one.
-- Replaces the old "Delete ALL applications" button.
--
-- ▶ Before running: existing applications are filed under EXISTING_SEASON
--   below. It is set to 7 (Season 6 was March 2026 and the site now
--   advertises Season 8). Change it if that's wrong.

CREATE TABLE IF NOT EXISTS public.seasons (
  number      integer PRIMARY KEY,
  name        text NOT NULL,
  is_current  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_current ON public.seasons (is_current) WHERE is_current;

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read seasons" ON public.seasons;
CREATE POLICY "Anyone can read seasons" ON public.seasons FOR SELECT USING (true);
-- Writes only through start_new_season().

CREATE OR REPLACE FUNCTION public.current_season()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT number FROM public.seasons WHERE is_current LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.current_season() TO authenticated, anon;

-- Season columns + default-on-insert
ALTER TABLE public.applications           ADD COLUMN IF NOT EXISTS season integer;
ALTER TABLE public.volunteer_applications ADD COLUMN IF NOT EXISTS season integer;
CREATE INDEX IF NOT EXISTS idx_applications_season ON public.applications (season);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_season ON public.volunteer_applications (season);

CREATE OR REPLACE FUNCTION public.trg_set_season()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.season IS NULL THEN
    NEW.season := public.current_season();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_season ON public.applications;
CREATE TRIGGER set_season BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_season();
DROP TRIGGER IF EXISTS set_season ON public.volunteer_applications;
CREATE TRIGGER set_season BEFORE INSERT ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_season();

-- Backfill
DO $$
DECLARE
  EXISTING_SEASON constant integer := 7;   -- ◀ change if needed
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.seasons) THEN
    INSERT INTO public.seasons (number, name, is_current)
    VALUES (EXISTING_SEASON, 'Season ' || EXISTING_SEASON, true);
  END IF;
  UPDATE public.applications           SET season = EXISTING_SEASON WHERE season IS NULL;
  UPDATE public.volunteer_applications SET season = EXISTING_SEASON WHERE season IS NULL;
END $$;

-- ── Archive for per-season rows that live in shared tables ─────────────
CREATE TABLE IF NOT EXISTS public.season_archive (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season      integer NOT NULL,
  source      text NOT NULL,     -- country_assignments | committee_awards | committee_announcements
  row_data    jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_season_archive_season ON public.season_archive (season, source);
ALTER TABLE public.season_archive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can read season archive" ON public.season_archive;
CREATE POLICY "Staff can read season archive" ON public.season_archive FOR SELECT USING (public.is_academic_staff());

-- ── start_new_season ───────────────────────────────────────────────────
-- SG only. Moves the outgoing season's seats, awards and announcements into
-- season_archive, unlocks awards, and deactivates chair accounts (reassign
-- them in Chair Management). Applications are kept and stay filed under
-- their season.
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
REVOKE ALL ON FUNCTION public.start_new_season(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_new_season(integer, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

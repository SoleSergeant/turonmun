-- 021_committee_spots_countries.sql
-- Per-committee allocation setup:
--   total_spots = how many delegate seats the committee has
--   countries   = the specific country roster (optional). If empty, the
--                 allocation screen fills the seats with numbered placeholders.

ALTER TABLE public.committees
  ADD COLUMN IF NOT EXISTS total_spots integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS countries   text[]  NOT NULL DEFAULT '{}';

-- Backfill total_spots from the old max_delegates value, only if that
-- legacy column still exists in this database.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'committees' AND column_name = 'max_delegates'
  ) THEN
    EXECUTE $sql$
      UPDATE public.committees
      SET total_spots = COALESCE(NULLIF(max_delegates, 0), 20)
      WHERE total_spots = 20 AND max_delegates IS NOT NULL AND max_delegates > 0
    $sql$;
  END IF;
END $$;

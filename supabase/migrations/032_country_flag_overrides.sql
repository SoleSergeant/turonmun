-- 032_country_flag_overrides.sql
-- Lets SG + Academics upload a custom flag image for any country.
-- Resolves before flagcdn — used for historical / fictional / mis-mapped
-- entries like "Nazi Germany", "Soviet Union", "Yugoslavia", etc.

CREATE TABLE IF NOT EXISTS public.country_flag_overrides (
  country_name TEXT PRIMARY KEY,
  flag_url     TEXT NOT NULL,
  updated_by   TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flag_overrides_updated_at
  ON public.country_flag_overrides(updated_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.country_flag_overrides_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_country_flag_overrides_touch ON public.country_flag_overrides;
CREATE TRIGGER trg_country_flag_overrides_touch
  BEFORE UPDATE ON public.country_flag_overrides
  FOR EACH ROW EXECUTE FUNCTION public.country_flag_overrides_touch();

-- ── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.country_flag_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read flag overrides"    ON public.country_flag_overrides;
DROP POLICY IF EXISTS "SG or Academics can write flags"   ON public.country_flag_overrides;
DROP POLICY IF EXISTS "SG or Academics can delete flags"  ON public.country_flag_overrides;

-- Public read — flag images are not sensitive and the matrix is public.
CREATE POLICY "Anyone can read flag overrides"
  ON public.country_flag_overrides FOR SELECT USING (true);

CREATE POLICY "SG or Academics can write flags"
  ON public.country_flag_overrides FOR INSERT
  WITH CHECK (public.has_admin_role(ARRAY['sg','admin','superadmin','academics']));

CREATE POLICY "SG or Academics can update flags"
  ON public.country_flag_overrides FOR UPDATE
  USING (public.has_admin_role(ARRAY['sg','admin','superadmin','academics']))
  WITH CHECK (public.has_admin_role(ARRAY['sg','admin','superadmin','academics']));

CREATE POLICY "SG or Academics can delete flags"
  ON public.country_flag_overrides FOR DELETE
  USING (public.has_admin_role(ARRAY['sg','admin','superadmin','academics']));

GRANT SELECT ON public.country_flag_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.country_flag_overrides TO authenticated;

NOTIFY pgrst, 'reload schema';

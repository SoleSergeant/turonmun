-- 033_demographic_aliases.sql
-- Admin-managed alias map that collapses free-text region/school variants
-- ("Fergana" / "Farg'ona" / "ferghana") into a single canonical label for the
-- Analytics dashboard. Non-destructive: application rows are never modified —
-- this only changes how values are grouped for reporting, so it's reversible.

CREATE TABLE IF NOT EXISTS public.demographic_aliases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field           text NOT NULL CHECK (field IN ('region', 'school')),
  raw_value       text NOT NULL,   -- the bucket label being merged away
  canonical_value text NOT NULL,   -- what it should be counted as instead
  created_by      uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

-- One alias per (field, value); matching is case-insensitive so "Fergana" and
-- "fergana" can't both be mapped to conflicting canonicals.
CREATE UNIQUE INDEX IF NOT EXISTS idx_demographic_aliases_field_raw
  ON public.demographic_aliases (field, lower(raw_value));

ALTER TABLE public.demographic_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read aliases"   ON public.demographic_aliases;
DROP POLICY IF EXISTS "Admins manage aliases" ON public.demographic_aliases;

CREATE POLICY "Admins read aliases"
  ON public.demographic_aliases FOR SELECT
  USING (public.is_active_admin());

CREATE POLICY "Admins manage aliases"
  ON public.demographic_aliases FOR ALL
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.demographic_aliases TO authenticated;

NOTIFY pgrst, 'reload schema';

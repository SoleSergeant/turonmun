-- 024_committee_awards.sql
-- End-of-conference awards. Chairs pick winners for their committee;
-- admins lock + publish; public page shows them once published.

-- ── Single-row settings (conference-wide lock + publish flags) ──
CREATE TABLE IF NOT EXISTS public.award_settings (
  id         int PRIMARY KEY DEFAULT 1,
  locked     boolean NOT NULL DEFAULT false,
  published  boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT award_settings_single_row CHECK (id = 1)
);
INSERT INTO public.award_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.award_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read award settings"  ON public.award_settings;
DROP POLICY IF EXISTS "Admins can update award settings" ON public.award_settings;
CREATE POLICY "Anyone can read award settings"
  ON public.award_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update award settings"
  ON public.award_settings FOR UPDATE
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
GRANT SELECT ON public.award_settings TO anon, authenticated;
GRANT UPDATE ON public.award_settings TO authenticated;

-- ── Awards (one row per award per committee) ──
CREATE TABLE IF NOT EXISTS public.committee_awards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id   uuid NOT NULL REFERENCES public.committees(id)   ON DELETE CASCADE,
  award_type     text NOT NULL CHECK (award_type IN ('best_delegate','best_speaker','honorable_mention')),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  winner_name    text,   -- denormalised so the public page needs no access to applications
  winner_country text,
  photo_url      text,
  nominated_by   uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(committee_id, award_type)
);
CREATE INDEX IF NOT EXISTS idx_committee_awards_committee ON public.committee_awards(committee_id);

ALTER TABLE public.committee_awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read awards"   ON public.committee_awards;
DROP POLICY IF EXISTS "Admins manage awards" ON public.committee_awards;

-- Admins/chairs always read; public reads only once published
CREATE POLICY "Read awards"
  ON public.committee_awards FOR SELECT
  USING (
    public.is_active_admin()
    OR (SELECT published FROM public.award_settings WHERE id = 1)
  );

-- Admins/chairs write (chairs are rows in admin_users); UI scopes to own committee.
CREATE POLICY "Admins manage awards"
  ON public.committee_awards FOR ALL
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

GRANT SELECT ON public.committee_awards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.committee_awards TO authenticated;

NOTIFY pgrst, 'reload schema';

-- 025_season_info.sql
-- Editable content for the homepage "Next Season" card (Hero).
-- Single row; admins edit it, the public homepage reads it.

CREATE TABLE IF NOT EXISTS public.season_info (
  id             int PRIMARY KEY DEFAULT 1,
  badge_label    text NOT NULL DEFAULT 'Next Season',
  heading        text NOT NULL DEFAULT 'Coming Soon',
  subtitle       text NOT NULL DEFAULT 'Season 7 details will be announced shortly.',
  date_text      text NOT NULL DEFAULT 'To be announced',
  duration_text  text NOT NULL DEFAULT 'To be announced',
  location_text  text NOT NULL DEFAULT 'Fergana, Uzbekistan',
  delegates_text text NOT NULL DEFAULT 'To be announced',
  apply_label    text NOT NULL DEFAULT 'Apply for Season 7',
  updated_at     timestamptz DEFAULT now(),
  CONSTRAINT season_info_single_row CHECK (id = 1)
);

INSERT INTO public.season_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.season_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read season info"   ON public.season_info;
DROP POLICY IF EXISTS "Admins can update season info"  ON public.season_info;

CREATE POLICY "Anyone can read season info"
  ON public.season_info FOR SELECT USING (true);
CREATE POLICY "Admins can update season info"
  ON public.season_info FOR UPDATE
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

GRANT SELECT ON public.season_info TO anon, authenticated;
GRANT UPDATE ON public.season_info TO authenticated;

NOTIFY pgrst, 'reload schema';

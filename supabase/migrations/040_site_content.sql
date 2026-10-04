-- 040_site_content.sql
-- Admin-editable website content (Admin → Site content).
--
-- One row per section (general, hero, about, faq, past_seasons, …). `value`
-- holds only what an admin has changed; the site falls back to the built-in
-- defaults for anything missing, so an empty table shows the site exactly
-- as it was. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.site_content (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site content" ON public.site_content;
CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "SG can edit site content" ON public.site_content;
CREATE POLICY "SG can edit site content"
  ON public.site_content FOR ALL
  USING (public.is_sg()) WITH CHECK (public.is_sg());

CREATE OR REPLACE FUNCTION public.trg_site_content_stamp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.jwt() ->> 'email';
  PERFORM public.log_activity('content_updated', 'site_content', NEW.key, format('Edited site content: %s', NEW.key));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS stamp_site_content ON public.site_content;
CREATE TRIGGER stamp_site_content
  BEFORE INSERT OR UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.trg_site_content_stamp();

-- Carry over what was set on the old Homepage editor (season_info) so the
-- "next season" card keeps its current text.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'season_info') THEN
    INSERT INTO public.site_content (key, value)
    SELECT 'next_season', to_jsonb(s) - 'id' - 'updated_at' - 'created_at'
    FROM public.season_info s
    WHERE s.id = 1
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

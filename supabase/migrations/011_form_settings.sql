-- form_settings: one row per form type ('delegate' | 'chair')
-- Controls open/close, deadline, capacity, fee, and custom questions.

CREATE TABLE IF NOT EXISTS public.form_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type       TEXT NOT NULL UNIQUE CHECK (form_type IN ('delegate', 'chair')),
  is_open         BOOLEAN NOT NULL DEFAULT false,
  closed_message  TEXT NOT NULL DEFAULT 'Applications are currently closed. Check our Telegram channel for updates.',
  deadline        TIMESTAMPTZ,
  max_capacity    INTEGER,           -- NULL = unlimited
  fee_amount      INTEGER NOT NULL DEFAULT 90000,
  ielts_discount  INTEGER NOT NULL DEFAULT 10000,
  sat_discount    INTEGER NOT NULL DEFAULT 10000,
  custom_questions JSONB NOT NULL DEFAULT '[]',
  -- [{id, label, type, required, options?, step?}]
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      TEXT
);

-- Seed default rows
INSERT INTO public.form_settings (form_type, is_open, fee_amount, ielts_discount, sat_discount)
VALUES
  ('delegate', false, 90000, 10000, 10000),
  ('chair',    false, 0,     0,     0)
ON CONFLICT (form_type) DO NOTHING;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_form_settings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_form_settings_updated ON public.form_settings;
CREATE TRIGGER trg_form_settings_updated
  BEFORE UPDATE ON public.form_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_form_settings();

-- RLS: public can read; authenticated (admins) can update
ALTER TABLE public.form_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read form settings" ON public.form_settings;
CREATE POLICY "Anyone can read form settings"
  ON public.form_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can update form settings" ON public.form_settings;
CREATE POLICY "Authenticated can update form settings"
  ON public.form_settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON public.form_settings TO anon, authenticated;
GRANT UPDATE ON public.form_settings TO authenticated;

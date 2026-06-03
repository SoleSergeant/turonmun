-- 026_form_opens_at.sql
-- Add an "opens at" date to form_settings so the public site can show a
-- countdown until applications OPEN (deadline already covers when they CLOSE).

ALTER TABLE public.form_settings
  ADD COLUMN IF NOT EXISTS opens_at timestamptz;

NOTIFY pgrst, 'reload schema';

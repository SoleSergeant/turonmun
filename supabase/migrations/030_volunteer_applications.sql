-- 030_volunteer_applications.sql
-- Volunteer applications are stored in their own table so they stay fully
-- separated from delegate/chair `applications` rows. Schema mirrors the S6
-- Google Form one-to-one, plus auth/status bookkeeping.

CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email               TEXT NOT NULL,

  -- S6 form fields (Q1–Q8)
  full_name           TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  location            TEXT NOT NULL,
  telegram_or_phone   TEXT NOT NULL,
  school_name         TEXT,                       -- Q5 optional (blank if graduated)
  what_you_bring      TEXT NOT NULL,              -- Q6
  anything_else       TEXT,                       -- Q7 optional
  commit_to_deposit   BOOLEAN NOT NULL,           -- Q8 Yes/No

  -- Free-form catch-all (any extra dynamic-question answers admins add later)
  notes               TEXT,

  -- Status bookkeeping (matches `applications` vocabulary)
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'contacted')),
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'paid', 'overdue', 'refunded')),
  admin_notes         TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_apps_status     ON public.volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_user       ON public.volunteer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_created_at ON public.volunteer_applications(created_at DESC);
-- One submission per signed-in user (mirrors the chair/delegate "applied once" rule).
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_apps_user_unique
  ON public.volunteer_applications(user_id) WHERE user_id IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.volunteer_applications_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_volunteer_apps_updated_at ON public.volunteer_applications;
CREATE TRIGGER trg_volunteer_apps_updated_at
  BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.volunteer_applications_set_updated_at();

-- ── RLS — mirrors the `applications` policy set (see 019_security_hardening) ──
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert volunteer applications"   ON public.volunteer_applications;
DROP POLICY IF EXISTS "Users can read own volunteer application"   ON public.volunteer_applications;
DROP POLICY IF EXISTS "Admins can update volunteer applications"   ON public.volunteer_applications;
DROP POLICY IF EXISTS "Admins can delete volunteer applications"   ON public.volunteer_applications;

CREATE POLICY "Public can insert volunteer applications"
  ON public.volunteer_applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own volunteer application"
  ON public.volunteer_applications FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = auth.jwt() ->> 'email'
    OR public.is_active_admin()
  );

CREATE POLICY "Admins can update volunteer applications"
  ON public.volunteer_applications FOR UPDATE
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins can delete volunteer applications"
  ON public.volunteer_applications FOR DELETE
  USING (public.is_active_admin());

GRANT INSERT ON public.volunteer_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.volunteer_applications TO authenticated;

-- ── form_settings: allow form_type = 'volunteer' so the existing dynamic
-- question / deadline / capacity / fee_amount infrastructure works for
-- volunteers without a parallel admin UI. ─────────────────────────────────
ALTER TABLE public.form_settings DROP CONSTRAINT IF EXISTS form_settings_form_type_check;
ALTER TABLE public.form_settings ADD CONSTRAINT form_settings_form_type_check
  CHECK (form_type IN ('delegate', 'chair', 'volunteer'));

-- Seed a closed volunteer row so admins immediately see the new tab and can
-- open the form when ready. The 40,000 UZS S6 refundable deposit lives in
-- fee_amount and can be edited from the admin Form Settings page.
INSERT INTO public.form_settings (form_type, is_open, closed_message, fee_amount)
VALUES (
  'volunteer',
  false,
  'Volunteer applications are currently closed. Follow our Telegram channel for updates.',
  40000
)
ON CONFLICT (form_type) DO NOTHING;

NOTIFY pgrst, 'reload schema';

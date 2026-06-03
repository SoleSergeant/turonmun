-- 017_committee_announcements.sql
-- Persistent announcements sent by chairs to their delegates.

CREATE TABLE IF NOT EXISTS public.committee_announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id  uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  title         text NOT NULL,
  content       text NOT NULL,
  sent_by       uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  recipients    text NOT NULL DEFAULT 'all',   -- 'all' | 'paid' | etc.
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_committee
  ON public.committee_announcements(committee_id);

ALTER TABLE public.committee_announcements ENABLE ROW LEVEL SECURITY;

-- Chairs (admin_users) can insert/select announcements for their committee
CREATE POLICY "Chairs can manage announcements"
  ON public.committee_announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email'
        AND is_active = true
    )
  );

-- Delegates can read announcements for their assigned committee
CREATE POLICY "Delegates can read their committee announcements"
  ON public.committee_announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE user_id = auth.uid()
        AND assigned_committee_id = committee_announcements.committee_id
    )
  );

GRANT SELECT ON public.committee_announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.committee_announcements TO authenticated;

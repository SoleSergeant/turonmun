-- 020_contacted_status.sql
-- Track whether an accepted delegate has been contacted (via Telegram)
-- so the team doesn't double-contact or miss anyone when working the queue.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS contacted      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contacted_at   timestamptz;

-- Index so we can quickly filter "accepted but not yet contacted"
CREATE INDEX IF NOT EXISTS idx_applications_contacted
  ON public.applications(contacted);

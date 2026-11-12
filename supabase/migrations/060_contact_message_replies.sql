-- 060_contact_message_replies.sql
-- Admin → Messages saves who replied, when and what, but 038 assumed these
-- columns already existed and they never did on live: every reply was
-- emailed yet stayed under "Needs reply", and the dashboard couldn't count
-- unanswered messages. Safe to re-run.

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS responded_at     timestamptz,
  ADD COLUMN IF NOT EXISTS responded_by     uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS response_message text;

NOTIFY pgrst, 'reload schema';

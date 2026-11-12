-- 061_telegram_outbox.sql
-- Telegram messages from the TuronMUN account, queued in the admin panel
-- (Inbox → Telegram, Turon Debate → Telegram) and sent by the TuronMUN
-- Sender desktop app on the SG's PC. The Telegram login stays on that PC;
-- the database only holds what to send and what happened.
--
--   telegram_batches   one "send" from the panel; pause / cancel act on it
--   telegram_outbox    one row per person: final text, status, error
--   telegram_templates saved messages
--   telegram_sender    the app's heartbeat, so the panel shows online/offline
--
-- The app calls telegram_claim_next() → sends → telegram_complete(), with
-- 30–60 s between messages. A successful send ticks Contacted on the
-- delegate (applications) or debater (debate_registrations.contacted_at).

ALTER TABLE public.debate_registrations ADD COLUMN IF NOT EXISTS contacted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.telegram_batches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  created_by  text DEFAULT (auth.jwt() ->> 'email'),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'done')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        uuid NOT NULL REFERENCES public.telegram_batches(id) ON DELETE CASCADE,
  position        integer NOT NULL DEFAULT 0,
  recipient_type  text NOT NULL DEFAULT 'other' CHECK (recipient_type IN ('delegate', 'debater', 'other')),
  recipient_id    uuid,
  name            text NOT NULL DEFAULT '',
  username        text NOT NULL,
  text            text NOT NULL,
  status          text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'cancelled')),
  error           text,
  attempts        integer NOT NULL DEFAULT 0,
  claimed_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_telegram_outbox_batch ON public.telegram_outbox (batch_id, position);
CREATE INDEX IF NOT EXISTS idx_telegram_outbox_status ON public.telegram_outbox (status);

CREATE TABLE IF NOT EXISTS public.telegram_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  body        text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_sender (
  id        integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_seen timestamptz,
  state     text,
  message   text,
  account   text
);

-- SG and Academics only, on every table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['telegram_batches', 'telegram_outbox', 'telegram_templates', 'telegram_sender'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Academic staff manage %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Academic staff manage %s" ON public.%I FOR ALL TO authenticated
                    USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff())', t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ── For the desktop app ────────────────────────────────────────────────

-- Next message to send (or nothing). A message left "sending" for 10 minutes
-- means the app stopped mid-send: it's marked failed, never re-sent, because
-- it may already have arrived.
CREATE OR REPLACE FUNCTION public.telegram_claim_next()
RETURNS SETOF public.telegram_outbox LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only the SG or Academics can send Telegram messages' USING ERRCODE = '42501';
  END IF;
  UPDATE public.telegram_outbox
     SET status = 'failed', finished_at = now(),
         error = 'Interrupted while sending. Check in Telegram whether it arrived.'
   WHERE status = 'sending' AND claimed_at < now() - interval '10 minutes';
  RETURN QUERY
  UPDATE public.telegram_outbox o
     SET status = 'sending', claimed_at = now(), attempts = o.attempts + 1
   WHERE o.id = (
     SELECT x.id FROM public.telegram_outbox x
       JOIN public.telegram_batches b ON b.id = x.batch_id
      WHERE x.status = 'queued' AND b.status = 'active'
      ORDER BY b.created_at, x.position
      LIMIT 1
      FOR UPDATE OF x SKIP LOCKED)
  RETURNING o.*;
END;
$$;

-- Result of one message. p_pause stops its batch (Telegram's flood limit).
CREATE OR REPLACE FUNCTION public.telegram_complete(p_id uuid, p_ok boolean, p_error text DEFAULT NULL, p_pause boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.telegram_outbox;
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only the SG or Academics can send Telegram messages' USING ERRCODE = '42501';
  END IF;
  UPDATE public.telegram_outbox
     SET status = CASE WHEN p_ok THEN 'sent' WHEN p_pause THEN 'queued' ELSE 'failed' END,
         error = CASE WHEN p_ok THEN NULL ELSE p_error END,
         finished_at = CASE WHEN p_pause AND NOT p_ok THEN NULL ELSE now() END
   WHERE id = p_id RETURNING * INTO r;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_ok AND r.recipient_id IS NOT NULL THEN
    IF r.recipient_type = 'delegate' THEN
      UPDATE public.applications SET contacted = true, contacted_at = now() WHERE id = r.recipient_id;
    ELSIF r.recipient_type = 'debater' THEN
      UPDATE public.debate_registrations SET contacted_at = now() WHERE id = r.recipient_id;
    END IF;
  END IF;

  IF p_pause THEN
    UPDATE public.telegram_batches SET status = 'paused', note = p_error WHERE id = r.batch_id;
  ELSIF NOT EXISTS (SELECT 1 FROM public.telegram_outbox WHERE batch_id = r.batch_id AND status IN ('queued', 'sending')) THEN
    UPDATE public.telegram_batches SET status = 'done' WHERE id = r.batch_id AND status = 'active';
  END IF;
END;
$$;

-- "I'm running" every ~20 s, with what the app is doing.
CREATE OR REPLACE FUNCTION public.telegram_heartbeat(p_state text, p_message text DEFAULT NULL, p_account text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only the SG or Academics can run the sender' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.telegram_sender (id, last_seen, state, message, account)
  VALUES (1, now(), p_state, p_message, p_account)
  ON CONFLICT (id) DO UPDATE SET last_seen = now(), state = EXCLUDED.state, message = EXCLUDED.message,
    account = coalesce(EXCLUDED.account, public.telegram_sender.account);
END;
$$;

REVOKE ALL ON FUNCTION public.telegram_claim_next() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.telegram_complete(uuid, boolean, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.telegram_heartbeat(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.telegram_claim_next() TO authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_complete(uuid, boolean, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_heartbeat(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

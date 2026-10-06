-- 041_turon_debate.sql
-- Turon Debate (debat.turonmun.com): individual registrations.
-- One registration per account. Registrants can read theirs and edit it
-- while it is still pending; SG/Academics review it in Admin → Debate.
-- Landing-page text, video and open/closed live in site_content ('debate').
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.debate_registrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text NOT NULL,
  telegram          text,
  date_of_birth     date,
  gender            text,
  institution       text NOT NULL,
  grade             text,
  city              text,
  english_level     text,
  experience        text,               -- none | some | experienced
  past_tournaments  text,
  motivation        text,
  heard_from        text,
  agreed_to_rules   boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'waitlisted', 'rejected')),
  admin_notes       text,
  reviewed_at       timestamptz,
  decision_emailed_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debate_registrations_status ON public.debate_registrations (status);
CREATE INDEX IF NOT EXISTS idx_debate_registrations_created ON public.debate_registrations (created_at DESC);

CREATE OR REPLACE FUNCTION public.trg_debate_registrations_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS touch_debate_registrations ON public.debate_registrations;
CREATE TRIGGER touch_debate_registrations
  BEFORE UPDATE ON public.debate_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_debate_registrations_touch();

ALTER TABLE public.debate_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Debaters create their registration" ON public.debate_registrations;
CREATE POLICY "Debaters create their registration"
  ON public.debate_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND admin_notes IS NULL);

DROP POLICY IF EXISTS "Debaters read their registration" ON public.debate_registrations;
CREATE POLICY "Debaters read their registration"
  ON public.debate_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Editable only while pending, and the status can't be changed by the debater.
DROP POLICY IF EXISTS "Debaters edit a pending registration" ON public.debate_registrations;
CREATE POLICY "Debaters edit a pending registration"
  ON public.debate_registrations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Staff read debate registrations" ON public.debate_registrations;
CREATE POLICY "Staff read debate registrations"
  ON public.debate_registrations FOR SELECT USING (public.is_active_admin());

DROP POLICY IF EXISTS "SG or Academics manage debate registrations" ON public.debate_registrations;
CREATE POLICY "SG or Academics manage debate registrations"
  ON public.debate_registrations FOR ALL
  USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

-- Activity log (uses log_activity from migration 038)
CREATE OR REPLACE FUNCTION public.trg_log_debate_registrations()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('registered', 'debate', NEW.id::text, format('Debate registration: %s', NEW.full_name));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('deleted', 'debate', OLD.id::text, format('Deleted debate registration of %s', OLD.full_name));
    RETURN OLD;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_activity('status_changed', 'debate', NEW.id::text,
      format('Debate %s: %s → %s', NEW.full_name, OLD.status, NEW.status));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS log_debate_registrations ON public.debate_registrations;
CREATE TRIGGER log_debate_registrations
  AFTER INSERT OR UPDATE OR DELETE ON public.debate_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_debate_registrations();

NOTIFY pgrst, 'reload schema';

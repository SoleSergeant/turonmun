-- 048_debate_registration_window.sql
-- New Turon Debate registrations are refused once registration is closed
-- (Site content → Turon Debate: "Registration open" off, or the deadline
-- has passed). Until now only the page enforced this. Staff can still add
-- registrations, and debaters can still edit a pending one.
-- Same guard as 045, plus the check at the top of the INSERT branch.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.trg_debate_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg jsonb;
  deadline text;
BEGIN
  IF public.is_academic_staff() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    -- site_content only holds what an admin changed; the site's default is "open, no deadline".
    SELECT value INTO cfg FROM public.site_content WHERE key = 'debate';
    deadline := NULLIF(cfg ->> 'registration_deadline', '');
    IF COALESCE((cfg ->> 'registration_open')::boolean, true) = false
       OR (deadline IS NOT NULL AND now() >= deadline::timestamptz) THEN
      RAISE EXCEPTION 'Registration is closed.' USING ERRCODE = 'P0001';
    END IF;
    NEW.admin_notes := NULL;
    NEW.reviewed_at := NULL;
    NEW.decision_emailed_at := NULL;
    NEW.status := 'pending';
    NEW.team_id := NULL;
    NEW.slot := NULL;
  ELSE
    NEW.admin_notes := OLD.admin_notes;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.decision_emailed_at := OLD.decision_emailed_at;
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
    NEW.team_id := OLD.team_id;
    NEW.slot := OLD.slot;
  END IF;
  RETURN NEW;
END;
$$;

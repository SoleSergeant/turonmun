-- 038_activity_log_and_email.sql
-- 1. activity_log: who changed what, written by triggers so every page
--    (and any direct API call) is covered without client changes.
-- 2. Columns that record when an email went out, so bulk sends skip
--    people who were already emailed.

-- ── activity_log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  actor_email text,
  actor_name  text,
  action      text NOT NULL,          -- e.g. status_changed, seat_assigned, email_sent
  entity      text NOT NULL,          -- table / area, e.g. application, seat, admin_user
  entity_id   text,
  summary     text NOT NULL,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log (entity, entity_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SG can read activity log" ON public.activity_log;
CREATE POLICY "SG can read activity log"
  ON public.activity_log FOR SELECT USING (public.is_sg());
-- No INSERT/UPDATE/DELETE policies: rows come only from the SECURITY DEFINER
-- functions below (and the send-email function's service role).

CREATE OR REPLACE FUNCTION public.log_activity(
  p_action text, p_entity text, p_entity_id text, p_summary text, p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text := auth.jwt() ->> 'email';
  v_name  text;
BEGIN
  SELECT full_name INTO v_name FROM public.admin_users WHERE email = v_email;
  INSERT INTO public.activity_log (actor_email, actor_name, action, entity, entity_id, summary, details)
  VALUES (v_email, v_name, p_action, p_entity, p_entity_id, p_summary, coalesce(p_details, '{}'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.log_activity(text, text, text, text, jsonb) FROM PUBLIC;

-- applications: status, payment, deletion
CREATE OR REPLACE FUNCTION public.trg_log_applications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('deleted', 'application', OLD.id::text,
      format('Deleted application of %s', OLD.full_name),
      jsonb_build_object('email', OLD.email, 'status', OLD.status));
    RETURN OLD;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_activity('status_changed', 'application', NEW.id::text,
      format('%s: %s → %s', NEW.full_name, coalesce(OLD.status, '—'), coalesce(NEW.status, '—')),
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    PERFORM public.log_activity('payment_changed', 'application', NEW.id::text,
      format('%s payment: %s → %s', NEW.full_name, coalesce(OLD.payment_status, '—'), coalesce(NEW.payment_status, '—')),
      jsonb_build_object('from', OLD.payment_status, 'to', NEW.payment_status));
  END IF;
  IF NEW.checked_in_at IS DISTINCT FROM OLD.checked_in_at THEN
    PERFORM public.log_activity(CASE WHEN NEW.checked_in_at IS NULL THEN 'check_in_undone' ELSE 'checked_in' END,
      'application', NEW.id::text,
      format('%s %s', NEW.full_name, CASE WHEN NEW.checked_in_at IS NULL THEN 'check-in undone' ELSE 'checked in' END));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS log_applications ON public.applications;
CREATE TRIGGER log_applications
  AFTER UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_applications();

-- seats
CREATE OR REPLACE FUNCTION public.trg_log_seats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r         public.country_assignments := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  v_name    text;
  v_comm    text;
BEGIN
  SELECT full_name INTO v_name FROM public.applications WHERE id = r.application_id;
  SELECT name INTO v_comm FROM public.committees WHERE id = r.committee_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('seat_assigned', 'seat', r.id::text,
      format('%s → %s, %s', coalesce(v_name, '?'), coalesce(v_comm, '?'), coalesce(r.country, r.country_name)));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('seat_removed', 'seat', r.id::text,
      format('%s removed from %s (%s)', coalesce(v_name, '?'), coalesce(v_comm, '?'), coalesce(r.country, r.country_name)));
  ELSIF coalesce(NEW.country, NEW.country_name) IS DISTINCT FROM coalesce(OLD.country, OLD.country_name) THEN
    PERFORM public.log_activity('seat_changed', 'seat', r.id::text,
      format('%s in %s: %s → %s', coalesce(v_name, '?'), coalesce(v_comm, '?'),
        coalesce(OLD.country, OLD.country_name), coalesce(NEW.country, NEW.country_name)));
  END IF;
  RETURN r;
END;
$$;
DROP TRIGGER IF EXISTS log_seats ON public.country_assignments;
CREATE TRIGGER log_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.country_assignments
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_seats();

-- admin accounts
CREATE OR REPLACE FUNCTION public.trg_log_admin_users()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity('account_created', 'admin_user', NEW.id::text,
      format('Added %s (%s) as %s', NEW.full_name, NEW.email, NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('account_deleted', 'admin_user', OLD.id::text,
      format('Removed %s (%s, %s)', OLD.full_name, OLD.email, OLD.role));
    RETURN OLD;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    PERFORM public.log_activity('role_changed', 'admin_user', NEW.id::text,
      format('%s: %s → %s', NEW.full_name, OLD.role, NEW.role));
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    PERFORM public.log_activity(CASE WHEN NEW.is_active THEN 'account_enabled' ELSE 'account_disabled' END,
      'admin_user', NEW.id::text,
      format('%s %s', NEW.full_name, CASE WHEN NEW.is_active THEN 'enabled' ELSE 'disabled' END));
  END IF;
  IF NEW.committee_id IS DISTINCT FROM OLD.committee_id THEN
    PERFORM public.log_activity('committee_changed', 'admin_user', NEW.id::text,
      format('%s moved to another committee', NEW.full_name));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS log_admin_users ON public.admin_users;
CREATE TRIGGER log_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_admin_users();

-- volunteers
CREATE OR REPLACE FUNCTION public.trg_log_volunteers()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity('deleted', 'volunteer', OLD.id::text, format('Deleted volunteer application of %s', OLD.full_name));
    RETURN OLD;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_activity('status_changed', 'volunteer', NEW.id::text,
      format('Volunteer %s: %s → %s', NEW.full_name, coalesce(OLD.status, '—'), coalesce(NEW.status, '—')));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS log_volunteers ON public.volunteer_applications;
CREATE TRIGGER log_volunteers
  AFTER UPDATE OR DELETE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_volunteers();

-- ── email tracking ─────────────────────────────────────────────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS decision_emailed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_reminded_at timestamptz;
ALTER TABLE public.country_assignments
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;
-- contact_messages already has responded_at / responded_by / response_message.

NOTIFY pgrst, 'reload schema';

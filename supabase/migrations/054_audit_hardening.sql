-- 054_audit_hardening.sql
-- Fixes from the November 2026 security audit. Safe to re-run.

-- ── 1. Leftover policies that bypass roles ───────────────────────────────
-- These matched ANY row in admin_users by id, so deactivated accounts and
-- chairs could read and delete contact messages and edit the schedule.
-- The role-based policies from 036 ("SG can manage contact messages",
-- "Admins can manage schedule") stay.
DROP POLICY IF EXISTS "Admins manage messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins manage schedule" ON public.schedule_events;
-- Exact duplicates of policies that stay.
DROP POLICY IF EXISTS "Anyone can send message" ON public.contact_messages;
DROP POLICY IF EXISTS "Public read schedule" ON public.schedule_events;

-- ── 2. Delegates could grade their own position paper ────────────────────
-- "Delegates can manage own papers" lets a delegate write every column, so
-- through the API they could set their own score, feedback and status, file
-- a paper in another committee, or save a javascript: link that runs when a
-- chair opens it. Chairs and SG/Academics are not limited.
CREATE OR REPLACE FUNCTION public.trg_position_papers_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_committee uuid;
BEGIN
  -- SQL editor / service role (no signed-in user): not limited.
  IF auth.uid() IS NULL AND coalesce(auth.jwt() ->> 'email', '') = '' THEN
    RETURN NEW;
  END IF;
  IF public.is_academic_staff() OR public.is_chair_of(NEW.committee_id)
     OR (TG_OP = 'UPDATE' AND public.is_chair_of(OLD.committee_id)) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.application_id := OLD.application_id;
    NEW.score          := OLD.score;
    NEW.feedback       := OLD.feedback;
    NEW.chair_feedback := OLD.chair_feedback;
    NEW.reviewed_by    := OLD.reviewed_by;
    NEW.reviewed_at    := OLD.reviewed_at;
  ELSE
    NEW.score          := NULL;
    NEW.feedback       := NULL;
    NEW.chair_feedback := NULL;
    NEW.reviewed_by    := NULL;
    NEW.reviewed_at    := NULL;
  END IF;
  -- A delegate can save a draft or submit; review statuses belong to chairs.
  IF NEW.status IS DISTINCT FROM 'draft' THEN
    NEW.status := 'submitted';
  END IF;

  SELECT assigned_committee_id INTO v_committee FROM public.applications WHERE id = NEW.application_id;
  IF v_committee IS NULL OR NEW.committee_id IS DISTINCT FROM v_committee THEN
    RAISE EXCEPTION 'You can only submit a paper to your own committee.' USING ERRCODE = '42501';
  END IF;
  IF NEW.file_url IS NOT NULL AND NEW.file_url !~* '^https://' THEN
    RAISE EXCEPTION 'The paper link must be an https address.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.trg_position_papers_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_fields ON public.position_papers;
CREATE TRIGGER guard_fields
  BEFORE INSERT OR UPDATE ON public.position_papers
  FOR EACH ROW EXECUTE FUNCTION public.trg_position_papers_guard();

-- ── 3. Returning applicants could not apply for a new season ─────────────
-- one_application_per_email allowed one application per email for ever, but
-- old seasons' applications stay in the table (039). The guard trigger
-- already limits people to one application per type per season; this index
-- enforces the same thing.
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS one_application_per_email;
DROP INDEX IF EXISTS public.one_application_per_email;
CREATE UNIQUE INDEX IF NOT EXISTS one_application_per_email_type_season
  ON public.applications (lower(email), coalesce(application_type, 'delegate'), season);

-- ── 4. Column default that its own CHECK rejects ─────────────────────────
-- payment_status defaulted to 'unpaid', which applications_payment_status_check
-- does not allow, so any insert that left the column out failed.
ALTER TABLE public.applications ALTER COLUMN payment_status SET DEFAULT 'pending';

-- ── 5. Upload limits ─────────────────────────────────────────────────────
-- Any signed-in user can upload to "applications"; there was no size limit.
-- Largest real files today: 7.5 MB (applications), 11.4 MB (resources).
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'applications';  -- 10 MB
UPDATE storage.buckets SET file_size_limit = 5242880  WHERE id = 'committees';    -- 5 MB
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'resources';     -- 50 MB

-- ── 6. Housekeeping flagged by the Supabase linter ───────────────────────
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.touch_form_settings() SET search_path = public;
ALTER FUNCTION public.volunteer_applications_set_updated_at() SET search_path = public;
ALTER FUNCTION public.trg_debate_registrations_touch() SET search_path = public;
ALTER FUNCTION public.trg_admin_users_lower_email() SET search_path = public;

-- Staff-only actions: each already checks the caller's role, but there is no
-- reason for signed-out visitors to be able to call them at all.
REVOKE EXECUTE ON FUNCTION public.assign_seat(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.change_seat_country(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unassign_seat(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_check_in(text, uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.start_new_season(integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_own_application_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_seat(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_seat_country(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unassign_seat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_check_in(text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_new_season(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_application_name(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

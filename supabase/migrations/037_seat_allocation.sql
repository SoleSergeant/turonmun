-- 037_seat_allocation.sql
-- One set of seat-allocation rules, enforced in the database.
--
-- Before this, Delegates, Allocation and Country Matrix each inserted into
-- country_assignments with their own (different) checks, and the matrix
-- silently replaced whoever already held a country. All three now call
-- these functions.
--
-- Rules (assign_seat):
--   * caller is SG or Academics
--   * delegate is approved and paid
--   * delegate has no seat yet (one committee per delegate)
--   * country is not already taken in that committee
--   * if the committee has a country roster, the country must be on it
--   * the committee has a free seat (total_spots, or roster size)

-- ── Uniqueness ─────────────────────────────────────────────────────────
-- Only created when existing data is clean; otherwise a WARNING lists what
-- to fix and the functions below still enforce the rules for new seats.
DO $$
DECLARE
  dup_delegates int;
  dup_countries int;
BEGIN
  SELECT count(*) INTO dup_delegates FROM (
    SELECT application_id FROM public.country_assignments
    GROUP BY application_id HAVING count(*) > 1
  ) d;
  SELECT count(*) INTO dup_countries FROM (
    SELECT committee_id, lower(trim(coalesce(country, country_name))) FROM public.country_assignments
    GROUP BY 1, 2 HAVING count(*) > 1
  ) d;

  IF dup_delegates = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS country_assignments_one_seat_per_delegate
      ON public.country_assignments (application_id);
  ELSE
    RAISE WARNING '% delegate(s) hold more than one seat. Fix in Allocation, then re-run this migration.', dup_delegates;
  END IF;

  IF dup_countries = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS country_assignments_one_country_per_committee
      ON public.country_assignments (committee_id, lower(trim(coalesce(country, country_name))));
  ELSE
    RAISE WARNING '% country/committee pair(s) are assigned twice. Fix in Allocation, then re-run this migration.', dup_countries;
  END IF;
END $$;

-- ── assign_seat ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_seat(
  p_application_id uuid,
  p_committee_id   uuid,
  p_country        text,
  p_country_code   text DEFAULT NULL
)
RETURNS public.country_assignments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app       public.applications;
  v_committee public.committees;
  v_country   text := trim(p_country);
  v_taken_by  text;
  v_filled    int;
  v_capacity  int;
  v_existing  text;
  v_row       public.country_assignments;
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only SG or Academics can allocate seats' USING ERRCODE = '42501';
  END IF;
  IF v_country IS NULL OR v_country = '' THEN
    RAISE EXCEPTION 'Pick a country first';
  END IF;

  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Delegate not found'; END IF;
  IF v_app.status <> 'approved' THEN
    RAISE EXCEPTION '% is not an approved delegate', v_app.full_name;
  END IF;
  IF coalesce(v_app.payment_status, '') <> 'paid' THEN
    RAISE EXCEPTION '% has not paid yet. Only paid delegates can be allocated.', v_app.full_name;
  END IF;

  SELECT c.name INTO v_existing
    FROM public.country_assignments a JOIN public.committees c ON c.id = a.committee_id
    WHERE a.application_id = p_application_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION '% already has a seat in %. Unassign it first.', v_app.full_name, v_existing;
  END IF;

  SELECT * INTO v_committee FROM public.committees WHERE id = p_committee_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Committee not found'; END IF;

  SELECT ap.full_name INTO v_taken_by
    FROM public.country_assignments a LEFT JOIN public.applications ap ON ap.id = a.application_id
    WHERE a.committee_id = p_committee_id
      AND lower(trim(coalesce(a.country, a.country_name))) = lower(v_country)
    LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION '% is already taken in % (by %)', v_country, v_committee.name, coalesce(v_taken_by, 'another delegate');
  END IF;

  IF cardinality(coalesce(v_committee.countries, '{}')) > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM unnest(v_committee.countries) c WHERE lower(trim(c)) = lower(v_country)) THEN
      RAISE EXCEPTION '% is not on %''s country roster. Add it in Committees first.', v_country, v_committee.name;
    END IF;
    v_capacity := (SELECT count(DISTINCT lower(trim(c))) FROM unnest(v_committee.countries) c WHERE trim(c) <> '');
  ELSE
    v_capacity := coalesce(v_committee.total_spots, 20);
  END IF;

  SELECT count(*) INTO v_filled FROM public.country_assignments WHERE committee_id = p_committee_id;
  IF v_filled >= v_capacity THEN
    RAISE EXCEPTION '% is full (% of % seats)', v_committee.name, v_filled, v_capacity;
  END IF;

  INSERT INTO public.country_assignments (application_id, committee_id, country, country_name, country_code)
  VALUES (p_application_id, p_committee_id, v_country, v_country, nullif(upper(p_country_code), ''))
  RETURNING * INTO v_row;

  UPDATE public.applications SET assigned_committee_id = p_committee_id WHERE id = p_application_id;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_seat(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_seat(uuid, uuid, text, text) TO authenticated;

-- ── unassign_seat ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unassign_seat(p_assignment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app uuid;
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only SG or Academics can allocate seats' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.country_assignments WHERE id = p_assignment_id RETURNING application_id INTO v_app;
  IF v_app IS NOT NULL THEN
    UPDATE public.applications SET assigned_committee_id = NULL WHERE id = v_app;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.unassign_seat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unassign_seat(uuid) TO authenticated;

-- ── change_seat_country ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.change_seat_country(
  p_assignment_id uuid,
  p_country       text,
  p_country_code  text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row       public.country_assignments;
  v_committee public.committees;
  v_country   text := trim(p_country);
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only SG or Academics can allocate seats' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_row FROM public.country_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seat not found'; END IF;
  SELECT * INTO v_committee FROM public.committees WHERE id = v_row.committee_id;

  IF EXISTS (
    SELECT 1 FROM public.country_assignments
    WHERE committee_id = v_row.committee_id AND id <> p_assignment_id
      AND lower(trim(coalesce(country, country_name))) = lower(v_country)
  ) THEN
    RAISE EXCEPTION '% is already taken in %', v_country, v_committee.name;
  END IF;
  IF cardinality(coalesce(v_committee.countries, '{}')) > 0
     AND NOT EXISTS (SELECT 1 FROM unnest(v_committee.countries) c WHERE lower(trim(c)) = lower(v_country)) THEN
    RAISE EXCEPTION '% is not on %''s country roster', v_country, v_committee.name;
  END IF;

  UPDATE public.country_assignments
    SET country = v_country, country_name = v_country, country_code = nullif(upper(p_country_code), '')
    WHERE id = p_assignment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.change_seat_country(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_seat_country(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

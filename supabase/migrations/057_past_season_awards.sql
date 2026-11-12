-- 057_past_season_awards.sql
-- Set committee awards for an archived season after the fact (Admin →
-- Awards → Past seasons). Writes to participations.award, which holds a
-- comma-separated list ("Best Delegate, Best Speaker"). Like the live
-- Awards page, each award goes to one delegate per committee: giving it to
-- someone takes it off whoever held it. p_participation NULL = clear it.

CREATE OR REPLACE FUNCTION public.set_past_award(
  p_season integer, p_committee text, p_award text, p_participation uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_academic_staff() THEN
    RAISE EXCEPTION 'Only the SG or Academics can set awards' USING ERRCODE = '42501';
  END IF;
  IF p_award NOT IN ('Best Delegate', 'Best Speaker', 'Honorable Mention') THEN
    RAISE EXCEPTION 'Unknown award %', p_award;
  END IF;
  IF p_season IS NULL OR p_season IS NOT DISTINCT FROM public.current_season() THEN
    RAISE EXCEPTION 'Use the Awards page for the current season';
  END IF;

  UPDATE public.participations
     SET award = nullif(array_to_string(array_remove(string_to_array(award, ', '), p_award), ', '), '')
   WHERE season = p_season AND committee = p_committee AND role = 'delegate'
     AND p_award = ANY (string_to_array(award, ', '));

  IF p_participation IS NOT NULL THEN
    UPDATE public.participations
       SET award = array_to_string(array_append(coalesce(string_to_array(award, ', '), '{}'), p_award), ', ')
     WHERE id = p_participation AND season = p_season AND committee = p_committee AND role = 'delegate';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'That delegate was not in % in season %', p_committee, p_season;
    END IF;
  END IF;

  PERFORM public.log_activity('past_award_set', 'participation', coalesce(p_participation::text, ''),
    format('Season %s · %s · %s: %s', p_season, p_committee, p_award,
      coalesce((SELECT full_name FROM public.participations WHERE id = p_participation), 'cleared')));
END;
$$;
REVOKE ALL ON FUNCTION public.set_past_award(integer, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_past_award(integer, text, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

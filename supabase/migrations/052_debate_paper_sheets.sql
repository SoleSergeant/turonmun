-- 052_debate_paper_sheets.sql
-- Judges may score on paper instead of the website. SG and Academics then
-- type the paper sheet in on Judging → "Scoring for", saving it under that
-- judge's name (judge_id is a made-up id for judges without an account).
-- Judges themselves still write only their own sheets and votes.
-- Safe to re-run.

DROP POLICY IF EXISTS "SG or Academics enter paper scores" ON public.debate_scores;
CREATE POLICY "SG or Academics enter paper scores" ON public.debate_scores
  FOR ALL USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

DROP POLICY IF EXISTS "SG or Academics enter paper votes" ON public.debate_pair_votes;
CREATE POLICY "SG or Academics enter paper votes" ON public.debate_pair_votes
  FOR ALL USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff());

NOTIFY pgrst, 'reload schema';

-- 022_missing_tables.sql
-- Backend diagnostic found 3 tables referenced by the app that don't exist in
-- the live DB. This creates them with correct columns + RLS.
--   • position_papers      — delegate submissions + chair review (CRITICAL)
--   • newsletter_subscribers — website newsletter signup
--   • users                — optional auth mirror (signup/AuthCallback upsert)

-- ══════════════════════════════════════════════════════════════════════
-- position_papers
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.position_papers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  committee_id   uuid REFERENCES public.committees(id)   ON DELETE CASCADE,
  title          text,
  content        text,
  file_url       text,
  status         text DEFAULT 'draft'
                   CHECK (status IN ('draft','submitted','under_review','reviewed','pending','approved','needs_revision')),
  score          integer CHECK (score >= 0 AND score <= 100),
  feedback       text,
  chair_feedback text,
  reviewed_by    uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reviewed_at    timestamptz,
  submitted_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(application_id, committee_id)
);

CREATE INDEX IF NOT EXISTS idx_position_papers_application ON public.position_papers(application_id);
CREATE INDEX IF NOT EXISTS idx_position_papers_committee   ON public.position_papers(committee_id);
CREATE INDEX IF NOT EXISTS idx_position_papers_status      ON public.position_papers(status);

ALTER TABLE public.position_papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delegates can manage own papers" ON public.position_papers;
DROP POLICY IF EXISTS "Admins can manage all papers"   ON public.position_papers;

CREATE POLICY "Delegates can manage own papers"
  ON public.position_papers FOR ALL
  USING (
    application_id IN (
      SELECT id FROM public.applications
      WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    application_id IN (
      SELECT id FROM public.applications
      WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can manage all papers"
  ON public.position_papers FOR ALL
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.position_papers TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- newsletter_subscribers
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  source          text DEFAULT 'website',
  is_active       boolean DEFAULT true,
  subscribed_at   timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe"          ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- users (auth mirror — optional, removes console errors on signup)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  full_name  text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own row" ON public.users;
CREATE POLICY "Users manage own row"
  ON public.users FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- search_users_for_admin — Chair Management user search (was never applied)
-- ══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.search_users_for_admin(search_query TEXT)
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, source TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id::UUID, a.full_name::TEXT, a.email::TEXT, 'application'::TEXT AS source
  FROM applications a
  WHERE a.full_name ILIKE '%' || search_query || '%'
     OR a.email ILIKE '%' || search_query || '%'
  UNION
  SELECT au.id::UUID,
         COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))::TEXT,
         au.email::TEXT,
         'auth'::TEXT
  FROM auth.users au
  WHERE (au.email ILIKE '%' || search_query || '%'
     OR au.raw_user_meta_data->>'full_name' ILIKE '%' || search_query || '%')
    AND NOT EXISTS (SELECT 1 FROM applications app WHERE app.email = au.email)
  ORDER BY full_name
  LIMIT 10;
END;
$$;

REVOKE ALL ON FUNCTION public.search_users_for_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_users_for_admin(TEXT) TO authenticated;

-- ── reload PostgREST schema cache so the new tables/functions are usable ──
NOTIFY pgrst, 'reload schema';

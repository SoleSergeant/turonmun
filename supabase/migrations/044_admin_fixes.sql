-- 044_admin_fixes.sql
-- 1. Admin access matches admin_users.email against the login email exactly.
--    Supabase stores login emails in lower case, so an admin row typed as
--    "John@…" never matched and that person was locked out. Store admin
--    emails in lower case, always.
-- 2. motions.proposed_by / seconded_by pointed at applications without
--    ON DELETE, so deleting a delegate who had proposed or seconded a motion
--    failed. Keep the motion, forget who proposed it.
-- Safe to re-run.

-- ── 1. Lower-case admin emails ────────────────────────────────────────
-- Skip a row if lower-casing it would clash with an existing row.
UPDATE public.admin_users a
SET email = lower(btrim(a.email))
WHERE a.email <> lower(btrim(a.email))
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users b
    WHERE b.id <> a.id AND b.email = lower(btrim(a.email))
  );

CREATE OR REPLACE FUNCTION public.trg_admin_users_lower_email()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS lower_email ON public.admin_users;
CREATE TRIGGER lower_email BEFORE INSERT OR UPDATE OF email ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.trg_admin_users_lower_email();

-- ── 2. motions: don't block deleting a delegate ──────────────────────
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname, att.attname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.motions'::regclass
      AND con.contype = 'f'
      AND con.confrelid = 'public.applications'::regclass
      AND att.attname IN ('proposed_by', 'seconded_by')
  LOOP
    EXECUTE format('ALTER TABLE public.motions DROP CONSTRAINT %I', c.conname);
    EXECUTE format(
      'ALTER TABLE public.motions ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.applications(id) ON DELETE SET NULL',
      c.conname, c.attname);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

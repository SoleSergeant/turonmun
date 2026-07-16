-- 035_applications_updated_at.sql
-- The applications table is missing the updated_at column in production, even
-- though the schema types and several RPCs (016 update_delegate_info,
-- 034 update_own_application_name) write to it — so those updates fail with
-- 'column "updated_at" of relation "applications" does not exist'.
--
-- Add the column back to match the intended schema. Safe and idempotent.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill existing rows so the column isn't null on old records.
UPDATE public.applications
  SET updated_at = COALESCE(updated_at, created_at, now())
  WHERE updated_at IS NULL;

NOTIFY pgrst, 'reload schema';

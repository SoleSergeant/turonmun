-- 029_application_status_defaults.sql
-- The live applications table has CHECK constraints on status and payment_status
-- but no DEFAULT values, so any INSERT that omits them inserts NULL and fails
-- the CHECK. Set proper defaults so the columns are forgiving.

ALTER TABLE public.applications
  ALTER COLUMN status        SET DEFAULT 'pending',
  ALTER COLUMN payment_status SET DEFAULT 'pending';

NOTIFY pgrst, 'reload schema';

-- 018_emergency_contact_columns.sql
-- Add the emergency contact name and phone columns that the registration
-- form tries to insert into. Without these the form throws a schema-cache error.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS emergency_contact_name  text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

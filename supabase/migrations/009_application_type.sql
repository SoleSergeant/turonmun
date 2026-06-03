-- Add application_type column to applications table
-- Distinguishes between delegate and chair/staff applications

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS application_type TEXT NOT NULL DEFAULT 'delegate';

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(application_type);

-- Constraint to only allow known types
ALTER TABLE applications
  ADD CONSTRAINT chk_application_type CHECK (application_type IN ('delegate', 'chair'));

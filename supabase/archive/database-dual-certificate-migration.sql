-- =============================================
-- DUAL CERTIFICATE UPLOAD MIGRATION
-- =============================================
-- This migration adds separate columns for IELTS and SAT certificates

-- Add separate certificate URL columns
DO $$ 
BEGIN 
    -- Add ielts_certificate_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='ielts_certificate_url') THEN
        ALTER TABLE applications ADD COLUMN ielts_certificate_url VARCHAR(500);
    END IF;
    
    -- Add sat_certificate_url column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='sat_certificate_url') THEN
        ALTER TABLE applications ADD COLUMN sat_certificate_url VARCHAR(500);
    END IF;
END $$;

-- Copy existing certificate_url data to ielts_certificate_url (if needed)
UPDATE applications 
SET ielts_certificate_url = certificate_url 
WHERE certificate_url IS NOT NULL AND ielts_certificate_url IS NULL;

-- Create indexes for better performance
DO $$ 
BEGIN 
    -- Index for IELTS certificate URL
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_ielts_cert') THEN
        CREATE INDEX idx_applications_ielts_cert ON applications(ielts_certificate_url);
    END IF;
    
    -- Index for SAT certificate URL
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_sat_cert') THEN
        CREATE INDEX idx_applications_sat_cert ON applications(sat_certificate_url);
    END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN applications.ielts_certificate_url IS 'Supabase Storage public URL for IELTS score certificate upload';
COMMENT ON COLUMN applications.sat_certificate_url IS 'Supabase Storage public URL for SAT score certificate upload';

-- Note: Keep the old certificate_url column for backward compatibility
-- It can be dropped later if not needed 
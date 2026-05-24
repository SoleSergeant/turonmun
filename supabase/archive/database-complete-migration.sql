-- =============================================
-- COMPLETE FILE UPLOAD MIGRATION
-- =============================================
-- This migration adds all missing columns for the file upload system

-- Add missing columns for file uploads and application tracking
DO $$ 
BEGIN 
    -- Add application_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='application_id') THEN
        ALTER TABLE applications ADD COLUMN application_id VARCHAR(100) UNIQUE;
    END IF;
    
    -- Add photo_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='photo_url') THEN
        ALTER TABLE applications ADD COLUMN photo_url VARCHAR(500);
    END IF;
    
    -- Add ielts_certificate_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='ielts_certificate_url') THEN
        ALTER TABLE applications ADD COLUMN ielts_certificate_url VARCHAR(500);
    END IF;
    
    -- Add sat_certificate_url column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='sat_certificate_url') THEN
        ALTER TABLE applications ADD COLUMN sat_certificate_url VARCHAR(500);
    END IF;
    
    -- Add certificate_url column for backward compatibility if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='certificate_url') THEN
        ALTER TABLE applications ADD COLUMN certificate_url VARCHAR(500);
    END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN 
    -- Index for application ID
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_app_id') THEN
        CREATE INDEX idx_applications_app_id ON applications(application_id);
    END IF;
    
    -- Index for photo URL
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_photo') THEN
        CREATE INDEX idx_applications_photo ON applications(photo_url);
    END IF;
    
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
COMMENT ON COLUMN applications.application_id IS 'Unique application identifier for file organization';
COMMENT ON COLUMN applications.photo_url IS 'Supabase Storage public URL for applicant photo upload';
COMMENT ON COLUMN applications.ielts_certificate_url IS 'Supabase Storage public URL for IELTS score certificate upload';
COMMENT ON COLUMN applications.sat_certificate_url IS 'Supabase Storage public URL for SAT score certificate upload';
COMMENT ON COLUMN applications.certificate_url IS 'Legacy certificate URL for backward compatibility'; 
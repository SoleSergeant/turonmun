-- =============================================
-- FILE UPLOAD SYSTEM MIGRATION
-- =============================================
-- This migration adds columns for file uploads (photos and certificates)

-- Add file URL columns to applications table
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
    
    -- Add certificate_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='certificate_url') THEN
        ALTER TABLE applications ADD COLUMN certificate_url VARCHAR(500);
    END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN 
    -- Index for application_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_app_id') THEN
        CREATE INDEX idx_applications_app_id ON applications(application_id);
    END IF;
    
    -- Index for photo_url (for quick lookups)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_photo_url') THEN
        CREATE INDEX idx_applications_photo_url ON applications(photo_url);
    END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN applications.application_id IS 'Unique identifier for file organization in Supabase Storage (format: app_timestamp_randomstring)';
COMMENT ON COLUMN applications.photo_url IS 'Supabase Storage public URL for applicant photo upload';
COMMENT ON COLUMN applications.certificate_url IS 'Supabase Storage public URL for discount proof certificate upload';

-- Update any existing records with unique application IDs (if needed)
UPDATE applications 
SET application_id = 'app_' || EXTRACT(EPOCH FROM created_at) || '_' || SUBSTRING(id::text FROM 1 FOR 8)
WHERE application_id IS NULL; 
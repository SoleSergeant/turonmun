-- =============================================
-- PRODUCTION-READY MIGRATION: DUAL CERTIFICATE SYSTEM
-- =============================================
-- This migration restores the system to production-ready state

-- Add all missing columns for the complete file upload system
DO $$ 
BEGIN 
    -- Add application_id column if it doesn't exist (for file organization)
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

    -- Add missing form fields that might be needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='telegram_username') THEN
        ALTER TABLE applications ADD COLUMN telegram_username VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='date_of_birth') THEN
        ALTER TABLE applications ADD COLUMN date_of_birth DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='previous_muns') THEN
        ALTER TABLE applications ADD COLUMN previous_muns TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='portfolio_link') THEN
        ALTER TABLE applications ADD COLUMN portfolio_link VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='unique_delegate_trait') THEN
        ALTER TABLE applications ADD COLUMN unique_delegate_trait TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='issue_interest') THEN
        ALTER TABLE applications ADD COLUMN issue_interest TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type1_selected_prompt') THEN
        ALTER TABLE applications ADD COLUMN type1_selected_prompt VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type1_insight_response') THEN
        ALTER TABLE applications ADD COLUMN type1_insight_response TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type2_selected_prompt') THEN
        ALTER TABLE applications ADD COLUMN type2_selected_prompt VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type2_political_response') THEN
        ALTER TABLE applications ADD COLUMN type2_political_response TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='fee_agreement') THEN
        ALTER TABLE applications ADD COLUMN fee_agreement VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='discount_eligibility') THEN
        ALTER TABLE applications ADD COLUMN discount_eligibility VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='final_confirmation') THEN
        ALTER TABLE applications ADD COLUMN final_confirmation BOOLEAN DEFAULT false;
    END IF;

END $$;

-- Create indexes for better performance
DO $$ 
BEGIN 
    -- Index for application ID (file organization)
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

-- Add column comments for documentation
COMMENT ON COLUMN applications.application_id IS 'Unique application identifier for file organization in Supabase Storage';
COMMENT ON COLUMN applications.photo_url IS 'Supabase Storage public URL for applicant photo upload';
COMMENT ON COLUMN applications.ielts_certificate_url IS 'Supabase Storage public URL for IELTS score certificate upload';
COMMENT ON COLUMN applications.sat_certificate_url IS 'Supabase Storage public URL for SAT score certificate upload';
COMMENT ON COLUMN applications.certificate_url IS 'Legacy certificate URL for backward compatibility';

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE '✅ DUAL CERTIFICATE UPLOAD SYSTEM - PRODUCTION READY!';
    RAISE NOTICE '📁 File Storage: applications/app_id/{photo.jpg, ielts_certificate.pdf, sat_certificate.pdf}';
    RAISE NOTICE '🎯 Features: Separate IELTS/SAT uploads, Admin panel integration, Complete form data';
    RAISE NOTICE '🚀 Status: READY FOR TESTING!';
END $$; 
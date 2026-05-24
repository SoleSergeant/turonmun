-- =============================================
-- SAFE REGISTRATION FORM UPDATE MIGRATION
-- =============================================
-- This migration safely adds new columns only if they don't already exist

-- Check and add telegram_username column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='telegram_username') THEN
        ALTER TABLE applications ADD COLUMN telegram_username VARCHAR(100);
    END IF;
END $$;

-- Check and add date_of_birth column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='date_of_birth') THEN
        ALTER TABLE applications ADD COLUMN date_of_birth DATE;
    END IF;
END $$;

-- Check and add previous_muns column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='previous_muns') THEN
        ALTER TABLE applications ADD COLUMN previous_muns TEXT;
    END IF;
END $$;

-- Check and add portfolio_link column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='portfolio_link') THEN
        ALTER TABLE applications ADD COLUMN portfolio_link VARCHAR(500);
    END IF;
END $$;

-- Check and add unique_delegate_trait column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='unique_delegate_trait') THEN
        ALTER TABLE applications ADD COLUMN unique_delegate_trait TEXT;
    END IF;
END $$;

-- Check and add issue_interest column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='issue_interest') THEN
        ALTER TABLE applications ADD COLUMN issue_interest TEXT;
    END IF;
END $$;

-- Check and add type1_selected_prompt column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type1_selected_prompt') THEN
        ALTER TABLE applications ADD COLUMN type1_selected_prompt VARCHAR(10);
    END IF;
END $$;

-- Check and add type1_insight_response column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type1_insight_response') THEN
        ALTER TABLE applications ADD COLUMN type1_insight_response TEXT;
    END IF;
END $$;

-- Check and add type2_selected_prompt column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type2_selected_prompt') THEN
        ALTER TABLE applications ADD COLUMN type2_selected_prompt VARCHAR(10);
    END IF;
END $$;

-- Check and add type2_political_response column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='type2_political_response') THEN
        ALTER TABLE applications ADD COLUMN type2_political_response TEXT;
    END IF;
END $$;

-- Check and add fee_agreement column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='fee_agreement') THEN
        ALTER TABLE applications ADD COLUMN fee_agreement VARCHAR(10);
    END IF;
END $$;

-- Check and add discount_eligibility column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='discount_eligibility') THEN
        ALTER TABLE applications ADD COLUMN discount_eligibility VARCHAR(100);
    END IF;
END $$;

-- Check and add final_confirmation column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='final_confirmation') THEN
        ALTER TABLE applications ADD COLUMN final_confirmation BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Safely create indexes (only if they don't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_telegram') THEN
        CREATE INDEX idx_applications_telegram ON applications(telegram_username);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_applications_date_of_birth') THEN
        CREATE INDEX idx_applications_date_of_birth ON applications(date_of_birth);
    END IF;
END $$;

-- Add comments (these are safe to run multiple times)
COMMENT ON COLUMN applications.telegram_username IS 'Telegram username for communication (e.g., @username)';
COMMENT ON COLUMN applications.date_of_birth IS 'Date of birth of the applicant';
COMMENT ON COLUMN applications.previous_muns IS 'List of previous MUNs and awards if any';
COMMENT ON COLUMN applications.portfolio_link IS 'Link to portfolio, LinkedIn, blog, or relevant social media';
COMMENT ON COLUMN applications.unique_delegate_trait IS 'What aspects of your background, thinking, or presence set you apart from most delegates - and how? (115 words)';
COMMENT ON COLUMN applications.issue_interest IS 'Topic or issue the applicant is passionate about (115 words)';
COMMENT ON COLUMN applications.type1_selected_prompt IS 'Selected prompt for Type I Personal Insight (1 or 2)';
COMMENT ON COLUMN applications.type1_insight_response IS 'Response to Type I Personal Insight prompt (115 words)';
COMMENT ON COLUMN applications.type2_selected_prompt IS 'Selected prompt for Type II Political Reflection (1 or 2)';
COMMENT ON COLUMN applications.type2_political_response IS 'Response to Type II Political Reflection prompt (115 words)';
COMMENT ON COLUMN applications.fee_agreement IS 'Agreement to pay application fee (Yes/No)';
COMMENT ON COLUMN applications.discount_eligibility IS 'Selected discount eligibility options (IELTS, SAT, None)';
COMMENT ON COLUMN applications.final_confirmation IS 'Final confirmation that all information is accurate'; 
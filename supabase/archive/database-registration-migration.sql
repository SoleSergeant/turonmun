-- =============================================
-- REGISTRATION FORM UPDATE MIGRATION
-- =============================================
-- This migration adds new columns to support the updated registration form

-- Add new columns to applications table
ALTER TABLE applications 
ADD COLUMN telegram_username VARCHAR(100),
ADD COLUMN date_of_birth DATE,
ADD COLUMN previous_muns TEXT,
ADD COLUMN portfolio_link VARCHAR(500),
ADD COLUMN unique_delegate_trait TEXT,
ADD COLUMN issue_interest TEXT,
ADD COLUMN type1_selected_prompt VARCHAR(10),
ADD COLUMN type1_insight_response TEXT,
ADD COLUMN type2_selected_prompt VARCHAR(10),
ADD COLUMN type2_political_response TEXT,
ADD COLUMN fee_agreement VARCHAR(10),
ADD COLUMN discount_eligibility VARCHAR(100),
ADD COLUMN final_confirmation BOOLEAN DEFAULT false;

-- Add indexes for the new columns
CREATE INDEX idx_applications_telegram ON applications(telegram_username);
CREATE INDEX idx_applications_date_of_birth ON applications(date_of_birth);

-- Update any existing records with placeholder values if needed
-- (This is safe since we're adding nullable columns)

-- Add comment to document the changes
COMMENT ON COLUMN applications.telegram_username IS 'Telegram username for communication (e.g., @username)';
COMMENT ON COLUMN applications.date_of_birth IS 'Date of birth of the applicant';
COMMENT ON COLUMN applications.previous_muns IS 'List of previous MUNs and awards if any';
COMMENT ON COLUMN applications.portfolio_link IS 'Link to portfolio, LinkedIn, blog, or relevant social media';
COMMENT ON COLUMN applications.unique_delegate_trait IS 'What sets the applicant apart as a delegate (115 words)';
COMMENT ON COLUMN applications.issue_interest IS 'Topic or issue the applicant is passionate about (115 words)';
COMMENT ON COLUMN applications.type1_selected_prompt IS 'Selected prompt for Type I Personal Insight (1 or 2)';
COMMENT ON COLUMN applications.type1_insight_response IS 'Response to Type I Personal Insight prompt (115 words)';
COMMENT ON COLUMN applications.type2_selected_prompt IS 'Selected prompt for Type II Political Reflection (1 or 2)';
COMMENT ON COLUMN applications.type2_political_response IS 'Response to Type II Political Reflection prompt (115 words)';
COMMENT ON COLUMN applications.fee_agreement IS 'Agreement to pay application fee (Yes/No)';
COMMENT ON COLUMN applications.discount_eligibility IS 'Selected discount eligibility options (IELTS, SAT, None)';
COMMENT ON COLUMN applications.final_confirmation IS 'Final confirmation that all information is accurate'; 
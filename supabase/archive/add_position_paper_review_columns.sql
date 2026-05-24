-- Add missing columns to position_papers table for chair review functionality

-- Add score column
ALTER TABLE position_papers 
ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score >= 0 AND score <= 100);

-- Add chair_feedback column (separate from general feedback)
ALTER TABLE position_papers 
ADD COLUMN IF NOT EXISTS chair_feedback TEXT;

-- Add reviewed_by column to track which chair reviewed
ALTER TABLE position_papers 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id);

-- Add reviewed_at timestamp
ALTER TABLE position_papers 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint to include more statuses
ALTER TABLE position_papers 
DROP CONSTRAINT IF EXISTS position_papers_status_check;

ALTER TABLE position_papers 
ADD CONSTRAINT position_papers_status_check 
CHECK (status IN ('draft', 'submitted', 'reviewed', 'pending', 'approved', 'needs_revision'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_position_papers_reviewed_by ON position_papers(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_position_papers_status ON position_papers(status);

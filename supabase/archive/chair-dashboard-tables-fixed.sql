-- =============================================
-- CHAIR DASHBOARD ADDITIONAL TABLES (FIXED VERSION)
-- =============================================
-- These tables are needed for the chair dashboard functionality

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CHAIR ASSIGNMENTS TABLE
-- =============================================
-- Links admin users to committees as chairs
CREATE TABLE IF NOT EXISTS chair_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'chair' CHECK (role IN ('chair', 'co_chair')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(admin_user_id, committee_id) -- One chair per committee
);

-- =============================================
-- 2. COUNTRY ASSIGNMENTS TABLE
-- =============================================
-- Assigns countries to delegates for their committee
CREATE TABLE IF NOT EXISTS country_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
    country VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(application_id, committee_id) -- One country per application per committee
);

-- Ensure country column exists even if table was created earlier without it
ALTER TABLE country_assignments
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- =============================================
-- 3. POSITION PAPERS TABLE
-- =============================================
-- Stores position paper submissions and reviews
CREATE TABLE IF NOT EXISTS position_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_url VARCHAR(500), -- Supabase Storage URL for PDF/doc
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'needs_revision')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    chair_feedback TEXT,
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id, committee_id) -- One paper per application per committee
);

-- Ensure scoring and feedback columns exist even if table was created earlier without them
ALTER TABLE position_papers
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score >= 0 AND score <= 100),
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS chair_feedback TEXT;

-- =============================================
-- 4. ANNOUNCEMENTS TABLE (if not exists)
-- For chair announcements to delegates
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID REFERENCES admin_users(id),
    committee_id UUID REFERENCES committees(id),
    target_audience VARCHAR(20) DEFAULT 'delegates' CHECK (target_audience IN ('delegates', 'all', 'committee')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    read_count INTEGER DEFAULT 0,
    total_recipients INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure announcement columns exist even if table was created earlier without them
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS sender_id UUID,
ADD COLUMN IF NOT EXISTS committee_id UUID,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- 6. ANNOUNCEMENT_READ_TRACK TABLE
-- =============================================
-- Tracks which delegates have read announcements
CREATE TABLE IF NOT EXISTS announcement_read_track (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, application_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Chair assignments indexes
CREATE INDEX IF NOT EXISTS idx_chair_assignments_admin ON chair_assignments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_chair_assignments_committee ON chair_assignments(committee_id);
CREATE INDEX IF NOT EXISTS idx_chair_assignments_active ON chair_assignments(is_active);

-- Country assignments indexes
CREATE INDEX IF NOT EXISTS idx_country_assignments_app ON country_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_country_assignments_committee ON country_assignments(committee_id);
CREATE INDEX IF NOT EXISTS idx_country_assignments_country ON country_assignments(country);

-- Position papers indexes
CREATE INDEX IF NOT EXISTS idx_position_papers_app ON position_papers(application_id);
CREATE INDEX IF NOT EXISTS idx_position_papers_committee ON position_papers(committee_id);
CREATE INDEX IF NOT EXISTS idx_position_papers_status ON position_papers(status);
CREATE INDEX IF NOT EXISTS idx_position_papers_score ON position_papers(score);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_sender ON announcements(sender_id);
CREATE INDEX IF NOT EXISTS idx_announcements_committee ON announcements(committee_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

--- Add triggers to new tables (idempotent)
DROP TRIGGER IF EXISTS update_position_papers_updated_at ON position_papers;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;

CREATE TRIGGER update_position_papers_updated_at
BEFORE UPDATE ON position_papers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample chair assignment (assuming admin user exists)
INSERT INTO chair_assignments (admin_user_id, committee_id, role) 
SELECT 
    (SELECT id FROM admin_users WHERE email = 'admin@turonmun.com' LIMIT 1),
    (SELECT id FROM committees WHERE abbreviation = 'ECOSOC' LIMIT 1),
    'chair'
WHERE EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@turonmun.com')
AND EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'ECOSOC');

-- Insert sample country assignments (for approved applications)
-- Only if applications table has the expected structure
INSERT INTO country_assignments (application_id, committee_id, country)
SELECT 
    a.id,
    c.id,
    'United States'
FROM applications a
CROSS JOIN committees c
WHERE a.status = 'approved' 
AND c.abbreviation = 'ECOSOC'
AND a.id NOT IN (SELECT application_id FROM country_assignments)
LIMIT 5;

-- Insert sample position papers
INSERT INTO position_papers (application_id, committee_id, title, content, status)
SELECT 
    ca.application_id,
    ca.committee_id,
    'Position Paper - ' || ca.country,
    'This is a sample position paper content for ' || ca.country || '. The delegate discusses various aspects of the topic and provides thoughtful analysis.',
    'submitted'
FROM country_assignments ca
WHERE ca.application_id NOT IN (SELECT application_id FROM position_papers)
LIMIT 3;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- Chair dashboard tables created successfully!
-- Ready for chair role functionality!

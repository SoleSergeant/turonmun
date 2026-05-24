-- =============================================
-- CHAIR DASHBOARD ADDITIONAL TABLES
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

-- =============================================
-- 4. MESSAGES TABLE
-- =============================================
-- For chair-delegate messaging system
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID, -- Can be admin_users (chair) or applications (delegate)
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('admin', 'delegate')),
    recipient_id UUID, -- Can be admin_users (chair) or applications (delegate)
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'delegate')),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'message' CHECK (message_type IN ('message', 'announcement', 'notification')),
    committee_id UUID REFERENCES committees(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES messages(id), -- For replies
    file_attachment_url VARCHAR(500), -- For file attachments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. ANNOUNCEMENTS TABLE (if not exists)
-- =============================================
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

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_messages_committee ON messages(committee_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

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

-- Add triggers to new tables
CREATE TRIGGER update_position_papers_updated_at BEFORE UPDATE ON position_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE chair_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_read_track ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Chair Assignments
CREATE POLICY "Chairs can view their own assignments" ON chair_assignments 
FOR SELECT USING (admin_user_id = auth.uid());

CREATE POLICY "Admins can manage chair assignments" ON chair_assignments 
FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
));

-- RLS Policies for Country Assignments
CREATE POLICY "Delegates can view their own assignments" ON country_assignments 
FOR SELECT USING (application_id IN (
    SELECT id FROM applications WHERE email = auth.email()
));

CREATE POLICY "Chairs can view assignments in their committee" ON country_assignments 
FOR SELECT USING (committee_id IN (
    SELECT committee_id FROM chair_assignments WHERE admin_user_id = auth.uid()
));

CREATE POLICY "Admins can manage country assignments" ON country_assignments 
FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
));

-- RLS Policies for Position Papers
CREATE POLICY "Delegates can view their own papers" ON position_papers 
FOR SELECT USING (application_id IN (
    SELECT id FROM applications WHERE email = auth.email()
));

CREATE POLICY "Chairs can view papers in their committee" ON position_papers 
FOR ALL USING (committee_id IN (
    SELECT committee_id FROM chair_assignments WHERE admin_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all papers" ON position_papers 
FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
));

-- RLS Policies for Messages
CREATE POLICY "Users can view their own messages" ON messages 
FOR SELECT USING (
    (sender_type = 'admin' AND sender_id = auth.uid()) OR
    (sender_type = 'delegate' AND sender_id IN (
        SELECT id FROM applications WHERE email = auth.email()
    )) OR
    (recipient_type = 'admin' AND recipient_id = auth.uid()) OR
    (recipient_type = 'delegate' AND recipient_id IN (
        SELECT id FROM applications WHERE email = auth.email()
    ))
);

CREATE POLICY "Users can send messages" ON messages 
FOR INSERT WITH CHECK (
    (sender_type = 'admin' AND sender_id = auth.uid()) OR
    (sender_type = 'delegate' AND sender_id IN (
        SELECT id FROM applications WHERE email = auth.email()
    ))
);

CREATE POLICY "Users can update their own messages" ON messages 
FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for Announcements
CREATE POLICY "Chairs can manage their announcements" ON announcements 
FOR ALL USING (sender_id = auth.uid() OR committee_id IN (
    SELECT committee_id FROM chair_assignments WHERE admin_user_id = auth.uid()
));

CREATE POLICY "Delegates can view announcements" ON announcements 
FOR SELECT USING (is_published = true AND (
    target_audience = 'all' OR 
    (target_audience = 'delegates' AND committee_id IN (
        SELECT assigned_committee_id FROM applications WHERE email = auth.email()
    ))
));

-- RLS Policies for Announcement Read Track
CREATE POLICY "Delegates can track their reads" ON announcement_read_track 
FOR ALL USING (application_id IN (
    SELECT id FROM applications WHERE email = auth.email()
));

CREATE POLICY "Chairs can view read stats" ON announcement_read_track 
FOR SELECT USING (announcement_id IN (
    SELECT id FROM announcements WHERE sender_id = auth.uid()
));

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
INSERT INTO country_assignments (application_id, committee_id, country)
SELECT a.id, c.id, 'United States'
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
WHERE ca.is_active = true
AND ca.application_id NOT IN (SELECT application_id FROM position_papers)
LIMIT 3;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- Chair dashboard tables created successfully!
-- Ready for chair role functionality!

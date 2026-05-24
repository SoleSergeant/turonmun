-- =============================================
-- FPS MODEL UNITED NATIONS DATABASE SCHEMA
-- =============================================
-- This schema includes all tables needed for the MUN website

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ADMIN USERS TABLE
-- =============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- 2. COMMITTEES TABLE
-- =============================================
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20),
    description TEXT NOT NULL,
    topics TEXT[] DEFAULT '{}',
    image_url TEXT,
    chair VARCHAR(255),
    co_chair VARCHAR(255),
    max_delegates INTEGER DEFAULT 20,
    current_delegates INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. APPLICATIONS TABLE (Delegate Registrations)
-- =============================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    institution VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    experience TEXT NOT NULL,
    committee_preference1 VARCHAR(255) NOT NULL,
    committee_preference2 VARCHAR(255) NOT NULL,
    committee_preference3 VARCHAR(255) NOT NULL,
    motivation TEXT,
    dietary_restrictions TEXT,
    has_ielts BOOLEAN DEFAULT false,
    has_sat BOOLEAN DEFAULT false,
    ielts_score DECIMAL(3,1),
    sat_score INTEGER,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted')),
    assigned_committee_id UUID REFERENCES committees(id),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_amount DECIMAL(10,2),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- =============================================
-- 4. CONTACT MESSAGES TABLE
-- =============================================
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES admin_users(id),
    response_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. SCHEDULE EVENTS TABLE
-- =============================================
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'session' CHECK (event_type IN ('session', 'break', 'meal', 'ceremony', 'social')),
    committee_id UUID REFERENCES committees(id),
    is_mandatory BOOLEAN DEFAULT true,
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. RESOURCES TABLE
-- =============================================
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, doc, ppt, etc.
    file_size INTEGER, -- in bytes
    category VARCHAR(100) NOT NULL, -- guides, templates, rules, etc.
    committee_id UUID REFERENCES committees(id),
    is_public BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. NEWSLETTER SUBSCRIBERS TABLE
-- =============================================
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100) DEFAULT 'website' -- website, registration, etc.
);

-- =============================================
-- 8. ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'delegates', 'admins', 'committee')),
    committee_id UUID REFERENCES committees(id),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. FEEDBACK TABLE
-- =============================================
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id),
    committee_id UUID REFERENCES committees(id),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    comments TEXT,
    suggestions TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Applications indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_country ON applications(country);
CREATE INDEX idx_applications_committee_prefs ON applications(committee_preference1, committee_preference2, committee_preference3);

-- Committees indexes
CREATE INDEX idx_committees_active ON committees(is_active);
CREATE INDEX idx_committees_name ON committees(name);

-- Contact messages indexes
CREATE INDEX idx_contact_messages_read ON contact_messages(is_read);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);

-- Schedule events indexes
CREATE INDEX idx_schedule_events_date ON schedule_events(event_date);
CREATE INDEX idx_schedule_events_committee ON schedule_events(committee_id);

-- Resources indexes
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_public ON resources(is_public);
CREATE INDEX idx_resources_committee ON resources(committee_id);

-- Newsletter subscribers indexes
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA INSERTION
-- =============================================

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, full_name, role) VALUES
('admin@turonmun.com', '$2b$10$K7L/gGXvMZo0pEMZFMfZJ.QCkQjZBOGc.bZFRZEOZYEMHaWMKHXbG', 'System Administrator', 'admin');

-- Insert default committees
INSERT INTO committees (name, abbreviation, description, topics, max_delegates) VALUES
('United Nations General Assembly', 'UNGA', 'The main deliberative assembly of the United Nations', ARRAY['Global governance', 'International cooperation', 'Sustainable development'], 25),
('World Trade Organization', 'WTO', 'International organization dealing with global trade rules', ARRAY['International trade', 'Economic development', 'Trade disputes'], 20),
('Economic and Social Council', 'ECOSOC', 'UN body responsible for economic and social issues', ARRAY['Economic development', 'Social progress', 'Human rights'], 20),
('Human Rights Council', 'HRC', 'UN body responsible for promoting and protecting human rights', ARRAY['Human rights', 'Civil liberties', 'Social justice'], 18);

-- Insert sample schedule events
INSERT INTO schedule_events (title, description, event_date, start_time, end_time, location, event_type) VALUES
('Opening Ceremony', 'Welcome and introduction to turonmun 2025', '2025-04-02', '09:00', '10:00', 'Main Auditorium', 'ceremony'),
('Committee Session 1', 'First committee session', '2025-04-02', '10:30', '12:00', 'Various Rooms', 'session'),
('Lunch Break', 'Lunch for all participants', '2025-04-02', '12:00', '13:00', 'Cafeteria', 'meal'),
('Committee Session 2', 'Second committee session', '2025-04-02', '13:00', '14:30', 'Various Rooms', 'session'),
('Closing Ceremony', 'Awards and farewell', '2025-04-02', '15:00', '16:00', 'Main Auditorium', 'ceremony');

-- Insert sample resources
INSERT INTO resources (title, description, file_url, file_type, category, is_public) VALUES
('Delegate Handbook', 'Complete guide for MUN delegates', 'https://example.com/handbook.pdf', 'pdf', 'guides', true),
('Position Paper Template', 'Template for writing position papers', 'https://example.com/template.docx', 'docx', 'templates', true),
('Rules of Procedure', 'Official rules and procedures', 'https://example.com/rules.pdf', 'pdf', 'rules', true);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on needs)
CREATE POLICY "Public read access for committees" ON committees FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for schedule" ON schedule_events FOR SELECT USING (true);
CREATE POLICY "Public read access for resources" ON resources FOR SELECT USING (is_public = true);

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

-- Application statistics view
CREATE VIEW application_stats AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN status = 'waitlisted' THEN 1 END) as waitlisted_applications,
    COUNT(DISTINCT country) as countries_represented,
    AVG(CASE WHEN has_ielts THEN ielts_score END) as avg_ielts_score,
    AVG(CASE WHEN has_sat THEN sat_score END) as avg_sat_score
FROM applications;

-- Committee popularity view
CREATE VIEW committee_popularity AS
SELECT 
    c.name as committee_name,
    c.abbreviation,
    COUNT(a1.id) as first_choice_count,
    COUNT(a2.id) as second_choice_count,
    COUNT(a3.id) as third_choice_count,
    COUNT(a1.id) + COUNT(a2.id) + COUNT(a3.id) as total_preferences
FROM committees c
LEFT JOIN applications a1 ON c.name = a1.committee_preference1
LEFT JOIN applications a2 ON c.name = a2.committee_preference2
LEFT JOIN applications a3 ON c.name = a3.committee_preference3
GROUP BY c.id, c.name, c.abbreviation
ORDER BY total_preferences DESC;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- Database schema created successfully!
-- Ready for FPS Model United Nations 2025! 
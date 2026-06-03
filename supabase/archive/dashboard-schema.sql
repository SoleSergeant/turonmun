-- TuronMUN Dashboard Database Schema
-- This file contains the complete database schema for the delegate dashboard

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'delegate' CHECK (role IN ('delegate', 'chair', 'secretariat', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Committees table
CREATE TABLE IF NOT EXISTS committees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  description TEXT,
  topic1 TEXT,
  topic2 TEXT,
  background_guide_url TEXT,
  rules_of_procedure_url TEXT,
  chair_id UUID REFERENCES users(id),
  co_chair_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  flag_url TEXT,
  committee_id UUID REFERENCES committees(id),
  profile_content TEXT,
  stance_guidance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  committee_preference1 UUID REFERENCES committees(id),
  committee_preference2 UUID REFERENCES committees(id),
  committee_preference3 UUID REFERENCES committees(id),
  assigned_committee UUID REFERENCES committees(id),
  assigned_country UUID REFERENCES countries(id),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'payment_pending', 'confirmed', 'allocated', 'rejected')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount DECIMAL(10,2),
  badge_number TEXT UNIQUE,
  documents JSONB DEFAULT '{}', -- Store document URLs and metadata
  emergency_contact JSONB,
  dietary_requirements TEXT,
  special_needs TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  motivation_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'personal' CHECK (message_type IN ('personal', 'announcement', 'system', 'committee')),
  files JSONB DEFAULT '[]', -- Array of file URLs and metadata
  read_status BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT, -- pdf, doc, image, etc.
  file_size INTEGER, -- in bytes
  category TEXT CHECK (category IN ('handbook', 'guide', 'sample', 'rules', 'background', 'crisis', 'general')),
  committee_id UUID REFERENCES committees(id), -- NULL for general resources
  access_level TEXT DEFAULT 'all' CHECK (access_level IN ('all', 'delegates', 'chairs', 'secretariat', 'admin')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Position Papers table
CREATE TABLE IF NOT EXISTS position_papers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  committee_id UUID REFERENCES committees(id) NOT NULL,
  country_id UUID REFERENCES countries(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'needs_revision')),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule Events table
CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type TEXT CHECK (event_type IN ('ceremony', 'session', 'break', 'social', 'workshop')),
  committee_id UUID REFERENCES committees(id), -- NULL for general events
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
  action_url TEXT, -- Optional URL for action button
  action_text TEXT, -- Text for action button
  read_status BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Chat Sessions table (for AI Assistant)
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]', -- Array of chat messages
  context_data JSONB DEFAULT '{}', -- User context for AI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_committee_id ON resources(committee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_committee_id ON schedule_events(committee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read their own applications
CREATE POLICY "Users can read own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own applications (with restrictions)
CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read messages sent to them
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read their own position papers
CREATE POLICY "Users can read own position papers" ON position_papers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own position papers
CREATE POLICY "Users can manage own position papers" ON position_papers
  FOR ALL USING (auth.uid() = user_id);

-- Users can read their own AI chat sessions
CREATE POLICY "Users can read own ai chats" ON ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own AI chat sessions
CREATE POLICY "Users can manage own ai chats" ON ai_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for committees, countries, resources, and schedule
CREATE POLICY "Public read committees" ON committees FOR SELECT USING (true);
CREATE POLICY "Public read countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Public read schedule" ON schedule_events FOR SELECT USING (true);

-- Functions for automatic badge number generation
CREATE OR REPLACE FUNCTION generate_badge_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.badge_number IS NULL THEN
    NEW.badge_number := 'DEL-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('badge_sequence')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for badge numbers
CREATE SEQUENCE IF NOT EXISTS badge_sequence START 1;

-- Trigger for badge number generation
CREATE TRIGGER generate_badge_number_trigger
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION generate_badge_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_position_papers_updated_at BEFORE UPDATE ON position_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO committees (name, abbreviation, description, topic1, topic2) VALUES
('Economic and Social Council', 'ECOSOC', 'The Economic and Social Council coordinates economic and social work of the UN', 'Sustainable Development Goals', 'Global Economic Recovery'),
('Security Council', 'SC', 'The Security Council maintains international peace and security', 'Regional Conflicts', 'Peacekeeping Operations'),
('General Assembly', 'GA', 'The General Assembly is the main deliberative organ of the UN', 'Climate Change', 'Human Rights'),
('Human Rights Council', 'HRC', 'The Human Rights Council addresses human rights situations', 'Freedom of Expression', 'Minority Rights')
ON CONFLICT DO NOTHING;

INSERT INTO countries (name, committee_id) VALUES
('United Kingdom', (SELECT id FROM committees WHERE abbreviation = 'ECOSOC' LIMIT 1)),
('United States', (SELECT id FROM committees WHERE abbreviation = 'SC' LIMIT 1)),
('Germany', (SELECT id FROM committees WHERE abbreviation = 'GA' LIMIT 1)),
('France', (SELECT id FROM committees WHERE abbreviation = 'HRC' LIMIT 1)),
('Japan', (SELECT id FROM committees WHERE abbreviation = 'ECOSOC' LIMIT 1)),
('Brazil', (SELECT id FROM committees WHERE abbreviation = 'SC' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample resources
INSERT INTO resources (name, description, category, file_url) VALUES
('Delegate Handbook 2024', 'Complete guide for delegates', 'handbook', '/resources/delegate-handbook-2024.pdf'),
('Rules of Procedure', 'Official rules and procedures', 'rules', '/resources/rules-of-procedure.pdf'),
('Position Paper Guide', 'How to write effective position papers', 'guide', '/resources/position-paper-guide.pdf'),
('Sample Position Paper', 'Example of a well-written position paper', 'sample', '/resources/sample-position-paper.pdf')
ON CONFLICT DO NOTHING;

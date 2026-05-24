-- Create Country Assignments Table
CREATE TABLE IF NOT EXISTS country_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id),
    committee_id UUID REFERENCES committees(id),
    country_code VARCHAR(10) NOT NULL, -- ISO code for flags (e.g., 'us', 'gb', 'uz')
    country_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Position Papers Table
CREATE TABLE IF NOT EXISTS position_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id),
    committee_id UUID REFERENCES committees(id),
    content TEXT,
    file_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE country_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_papers ENABLE ROW LEVEL SECURITY;

-- Policies for Country Assignments
-- Allow users to see their own assignment
CREATE POLICY "Users can read own country assignment" ON country_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications 
        WHERE applications.id = country_assignments.application_id 
        AND applications.email = (select auth.jwt() ->> 'email')
    )
);

-- Allow admins to manage assignments
CREATE POLICY "Admins can manage country assignments" ON country_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )
);

-- Policies for Position Papers
-- Allow users to CRUD their own papers
CREATE POLICY "Users can manage own position papers" ON position_papers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM applications 
        WHERE applications.id = position_papers.application_id 
        AND applications.email = (select auth.jwt() ->> 'email')
    )
);

-- Allow admins to view/grade papers
CREATE POLICY "Admins can manage position papers" ON position_papers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )
);

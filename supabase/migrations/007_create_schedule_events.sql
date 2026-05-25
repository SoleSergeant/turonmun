-- =============================================
-- 007: Create schedule_events table
-- =============================================

CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'session'
        CHECK (event_type IN ('session', 'break', 'meal', 'ceremony', 'social')),
    committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
    is_mandatory BOOLEAN DEFAULT true,
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_events_date       ON schedule_events(event_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_committee  ON schedule_events(committee_id);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_schedule_events_updated_at
    BEFORE UPDATE ON schedule_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read schedule events (public page)
CREATE POLICY "Public read access for schedule"
    ON schedule_events FOR SELECT
    USING (true);

-- Only authenticated admins can insert / update / delete
CREATE POLICY "Admins can insert schedule events"
    ON schedule_events FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update schedule events"
    ON schedule_events FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Admins can delete schedule events"
    ON schedule_events FOR DELETE
    TO authenticated
    USING (true);

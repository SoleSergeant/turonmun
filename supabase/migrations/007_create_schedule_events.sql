-- =============================================
-- 007: Create schedule_events table
-- =============================================

-- Create the updated_at helper function if it doesn't already exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Main table
CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_events_date       ON schedule_events(event_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_schedule_events_updated_at ON schedule_events;
CREATE TRIGGER update_schedule_events_updated_at
    BEFORE UPDATE ON schedule_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (same open pattern used by committee_sessions, motions, etc.)
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for schedule"     ON schedule_events;
DROP POLICY IF EXISTS "Admins can insert schedule events"   ON schedule_events;
DROP POLICY IF EXISTS "Admins can update schedule events"   ON schedule_events;
DROP POLICY IF EXISTS "Admins can delete schedule events"   ON schedule_events;
DROP POLICY IF EXISTS "Anyone can manage schedule events"   ON schedule_events;

CREATE POLICY "Public read access for schedule"   ON schedule_events FOR SELECT USING (true);
CREATE POLICY "Anyone can manage schedule events" ON schedule_events FOR ALL   USING (true);

-- Refine MUN Command: Add Yields, Attendance, and Session Logs

-- 1. Add yield columns to committee_sessions (global session state)
ALTER TABLE committee_sessions 
ADD COLUMN IF NOT EXISTS yield_type TEXT, -- chair, delegate, questions
ADD COLUMN IF NOT EXISTS yield_target_id UUID; -- ID of delegate if yielding to another

-- 2. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES committee_sessions(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent', -- present, absent, excused
  is_voting BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, application_id)
);

-- 3. Create session_logs table for the "Recent Motions" and event history
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES committee_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- motion_proposed, motion_passed, speaker_started, yield, etc.
  message TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Admins can manage attendance" ON attendance FOR ALL USING (true);

CREATE POLICY "Anyone can view logs" ON session_logs FOR SELECT USING (true);
CREATE POLICY "Admins can manage logs" ON session_logs FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE session_logs;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);

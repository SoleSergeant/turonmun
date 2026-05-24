-- MUN Command: Real-time committee session management
-- Tables: committee_sessions, speakers_list, motions, votes

-- 1. Committee Sessions - tracks the live state of a committee
CREATE TABLE IF NOT EXISTS committee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive', -- inactive, active, paused, ended
  current_mode TEXT NOT NULL DEFAULT 'gsl', -- gsl, moderated_caucus, unmoderated_caucus, voting, roll_call, suspension
  timer_duration INTEGER DEFAULT 0, -- total seconds for current timer
  timer_remaining INTEGER DEFAULT 0, -- seconds remaining
  timer_running BOOLEAN DEFAULT FALSE,
  timer_started_at TIMESTAMPTZ,
  current_speaker_id UUID, -- references speakers_list(id)
  current_topic TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Speakers List - real-time queue of delegates
CREATE TABLE IF NOT EXISTS speakers_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES committee_sessions(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  delegate_name TEXT NOT NULL,
  delegate_country TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, speaking, done, skipped
  position INTEGER NOT NULL DEFAULT 0, -- order in the queue
  speaking_time INTEGER DEFAULT 0, -- seconds allocated
  time_used INTEGER DEFAULT 0, -- seconds actually used
  added_at TIMESTAMPTZ DEFAULT NOW(),
  spoke_at TIMESTAMPTZ
);

-- 3. Motions - submitted and voted on during session
CREATE TABLE IF NOT EXISTS motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES committee_sessions(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES applications(id),
  proposer_name TEXT NOT NULL,
  proposer_country TEXT,
  motion_type TEXT NOT NULL, -- moderated_caucus, unmoderated_caucus, closure_of_debate, suspension, adjournment, other
  description TEXT NOT NULL,
  speaking_time INTEGER, -- seconds per speaker (for moderated caucus)
  total_time INTEGER, -- total duration in seconds
  status TEXT NOT NULL DEFAULT 'proposed', -- proposed, seconded, voting, passed, failed, withdrawn
  seconded_by UUID REFERENCES applications(id),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Votes - individual vote records
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_id UUID NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  vote TEXT NOT NULL, -- for, against, abstain
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(motion_id, application_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_committee_sessions_committee_id ON committee_sessions(committee_id);
CREATE INDEX IF NOT EXISTS idx_speakers_list_session_id ON speakers_list(session_id);
CREATE INDEX IF NOT EXISTS idx_motions_session_id ON motions(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_motion_id ON votes(motion_id);

-- Enable RLS
ALTER TABLE committee_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all authenticated users to read, chairs/admins to write
CREATE POLICY "Anyone can view sessions" ON committee_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage sessions" ON committee_sessions FOR ALL USING (true);

CREATE POLICY "Anyone can view speakers" ON speakers_list FOR SELECT USING (true);
CREATE POLICY "Anyone can manage speakers" ON speakers_list FOR ALL USING (true);

CREATE POLICY "Anyone can view motions" ON motions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage motions" ON motions FOR ALL USING (true);

CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Anyone can manage votes" ON votes FOR ALL USING (true);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE committee_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE speakers_list;
ALTER PUBLICATION supabase_realtime ADD TABLE motions;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

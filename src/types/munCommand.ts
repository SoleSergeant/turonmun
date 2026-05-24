// MUN Command Types - Real-time committee session management

export type SessionStatus = 'inactive' | 'active' | 'paused' | 'ended';
export type SessionMode = 'gsl' | 'moderated_caucus' | 'unmoderated_caucus' | 'voting' | 'roll_call' | 'suspension';
export type SpeakerStatus = 'waiting' | 'speaking' | 'done' | 'skipped';
export type MotionType = 'moderated_caucus' | 'unmoderated_caucus' | 'closure_of_debate' | 'suspension' | 'adjournment' | 'other';
export type MotionStatus = 'proposed' | 'seconded' | 'voting' | 'passed' | 'failed' | 'withdrawn';
export type VoteChoice = 'for' | 'against' | 'abstain';
export type YieldType = 'chair' | 'delegate' | 'questions' | 'none';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type EventType = 
  | 'session_started' 
  | 'mode_changed' 
  | 'timer_started' 
  | 'speaker_started' 
  | 'yield' 
  | 'motion_proposed' 
  | 'motion_passed' 
  | 'motion_failed' 
  | 'voting_opened' 
  | 'voting_closed' 
  | 'roll_call_started'
  | 'attendance_marked';

export interface CommitteeSession {
  id: string;
  committee_id: string;
  status: SessionStatus;
  current_mode: SessionMode;
  timer_duration: number;
  timer_remaining: number;
  timer_running: boolean;
  timer_started_at: string | null;
  current_speaker_id: string | null;
  current_topic: string | null;
  yield_type: YieldType;
  yield_target_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  application_id: string;
  status: AttendanceStatus;
  is_voting: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionLog {
  id: string;
  session_id: string;
  event_type: EventType;
  message: string;
  event_data: any;
  created_at: string;
}

export interface SpeakerEntry {
  id: string;
  session_id: string;
  application_id: string;
  delegate_name: string;
  delegate_country: string | null;
  status: SpeakerStatus;
  position: number;
  speaking_time: number;
  time_used: number;
  added_at: string;
  spoke_at: string | null;
}

export interface Motion {
  id: string;
  session_id: string;
  proposed_by: string | null;
  proposer_name: string;
  proposer_country: string | null;
  motion_type: MotionType;
  description: string;
  speaking_time: number | null;
  total_time: number | null;
  status: MotionStatus;
  seconded_by: string | null;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  created_at: string;
}

export interface Vote {
  id: string;
  motion_id: string;
  application_id: string;
  vote: VoteChoice;
  voted_at: string;
}

// UI helper constants
export const SESSION_MODE_LABELS: Record<SessionMode, string> = {
  gsl: 'General Speakers List',
  moderated_caucus: 'Moderated Caucus',
  unmoderated_caucus: 'Unmoderated Caucus',
  voting: 'Voting Procedure',
  roll_call: 'Roll Call',
  suspension: 'Suspension of Meeting',
};

export const MOTION_TYPE_LABELS: Record<MotionType, string> = {
  moderated_caucus: 'Motion for Moderated Caucus',
  unmoderated_caucus: 'Motion for Unmoderated Caucus',
  closure_of_debate: 'Motion for Closure of Debate',
  suspension: 'Motion for Suspension of Meeting',
  adjournment: 'Motion for Adjournment',
  other: 'Other Motion',
};

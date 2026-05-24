import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  CommitteeSession,
  SpeakerEntry,
  Motion,
  Vote,
  SessionMode,
  SessionStatus,
  MotionType,
  VoteChoice,
  YieldType,
  Attendance,
  AttendanceStatus,
  SessionLog,
  EventType,
} from '@/types/munCommand';

interface UseMunCommandOptions {
  committeeId: string;
  isChair?: boolean;
}

export function useMunCommand({ committeeId, isChair = false }: UseMunCommandOptions) {
  const [session, setSession] = useState<CommitteeSession | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerEntry[]>([]);
  const [motions, setMotions] = useState<Motion[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<CommitteeSession | null>(null);

  // ─── Load initial data ───────────────────────────────────
  const loadSession = useCallback(async () => {
    const { data } = await (supabase
      .from('committee_sessions') as any)
      .select('*')
      .eq('committee_id', committeeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setSession(data as CommitteeSession);
      sessionRef.current = data as CommitteeSession;
    }
    return data as CommitteeSession | null;
  }, [committeeId]);

  const loadSpeakers = useCallback(async (sessionId: string) => {
    const { data } = await (supabase
      .from('speakers_list') as any)
      .select('*')
      .eq('session_id', sessionId)
      .order('position', { ascending: true });
    setSpeakers((data || []) as SpeakerEntry[]);
  }, []);

  const loadMotions = useCallback(async (sessionId: string) => {
    const { data } = await (supabase
      .from('motions') as any)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    setMotions((data || []) as Motion[]);
  }, []);

  const loadVotes = useCallback(async (motionId: string) => {
    const { data } = await (supabase
      .from('votes') as any)
      .select('*')
      .eq('motion_id', motionId);
    setVotes((data || []) as Vote[]);
  }, []);

  const loadAttendance = useCallback(async (sessionId: string) => {
    const { data } = await (supabase
      .from('attendance') as any)
      .select('*')
      .eq('session_id', sessionId);
    setAttendance((data || []) as Attendance[]);
  }, []);

  const loadLogs = useCallback(async (sessionId: string) => {
    const { data } = await (supabase
      .from('session_logs') as any)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs((data || []) as SessionLog[]);
  }, []);

  // ─── Initial load + realtime subscriptions ───────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      const sess = await loadSession();
      if (sess && mounted) {
        await Promise.all([
          loadSpeakers(sess.id),
          loadMotions(sess.id),
          loadAttendance(sess.id),
          loadLogs(sess.id)
        ]);
      }
      if (mounted) setLoading(false);
    };
    init();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`mun-command-${committeeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'committee_sessions',
        filter: `committee_id=eq.${committeeId}`,
      }, (payload: any) => {
        if (payload.new) {
          setSession(payload.new as CommitteeSession);
          sessionRef.current = payload.new as CommitteeSession;
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'speakers_list',
      }, () => {
        if (sessionRef.current?.id) loadSpeakers(sessionRef.current.id);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'motions',
      }, () => {
        if (sessionRef.current?.id) loadMotions(sessionRef.current.id);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
      }, () => {
        if (sessionRef.current?.id) loadMotions(sessionRef.current.id);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
      }, () => {
        if (sessionRef.current?.id) loadAttendance(sessionRef.current.id);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_logs',
      }, () => {
        if (sessionRef.current?.id) loadLogs(sessionRef.current.id);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [committeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep sessionRef in sync with session state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // ─── Local timer countdown ──────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (session?.timer_running && session.timer_remaining > 0) {
      timerRef.current = setInterval(() => {
        setSession(prev => {
          if (!prev || !prev.timer_running) return prev;
          const remaining = Math.max(0, prev.timer_remaining - 1);
          if (remaining === 0 && isChair) {
            // Auto-pause when timer hits 0
            (supabase.from('committee_sessions') as any)
              .update({ timer_running: false, timer_remaining: 0, updated_at: new Date().toISOString() })
              .eq('id', prev.id)
              .then(() => {});
          }
          return { ...prev, timer_remaining: remaining };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.timer_running, session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Chair Actions ──────────────────────────────────────

  const createSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase
      .from('committee_sessions') as any)
      .insert({
        committee_id: committeeId,
        status: 'active',
        current_mode: 'roll_call',
        created_by: user?.id || null,
      })
      .select('*')
      .single();
    if (!error && data) setSession(data as CommitteeSession);
    return data as CommitteeSession;
  }, [committeeId]);

  const updateSession = useCallback(async (updates: Partial<CommitteeSession>) => {
    if (!session) return;
    const { data, error } = await (supabase
      .from('committee_sessions') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.id)
      .select('*')
      .single();
    if (!error && data) setSession(data as CommitteeSession);
  }, [session]);

  const setMode = useCallback(async (mode: SessionMode) => {
    await updateSession({ current_mode: mode });
    await logEvent('mode_changed', `Session mode changed to ${mode.replace('_', ' ')}`);
  }, [updateSession]);

  const logEvent = useCallback(async (type: EventType, message: string, data: any = {}) => {
    if (!session) return;
    await (supabase.from('session_logs') as any).insert({
      session_id: session.id,
      event_type: type,
      message,
      event_data: data
    });
  }, [session]);

  const startTimer = useCallback(async (durationSeconds: number) => {
    await updateSession({
      timer_duration: durationSeconds,
      timer_remaining: durationSeconds,
      timer_running: true,
      timer_started_at: new Date().toISOString(),
    });
    await logEvent('timer_started', `Timer set for ${durationSeconds} seconds`);
  }, [updateSession, logEvent]);

  const pauseTimer = useCallback(async () => {
    // Save the current local remaining time so DB doesn't snap back to original
    await updateSession({
      timer_running: false,
      timer_remaining: sessionRef.current?.timer_remaining ?? 0,
    });
  }, [updateSession]);

  const resumeTimer = useCallback(async () => {
    if (session && session.timer_remaining > 0) {
      await updateSession({ timer_running: true });
    }
  }, [updateSession, session]);

  const resetTimer = useCallback(async () => {
    // Reset to the last set duration, not 0
    const duration = sessionRef.current?.timer_duration ?? 0;
    await updateSession({
      timer_running: false,
      timer_remaining: duration,
      timer_started_at: null,
    });
  }, [updateSession]);

  // ─── Speakers List Actions ──────────────────────────────

  const addSpeaker = useCallback(async (applicationId: string, name: string, country: string, speakingTime = 60) => {
    if (!session) return;
    const nextPosition = speakers.length;
    const { data, error } = await (supabase
      .from('speakers_list') as any)
      .insert({
        session_id: session.id,
        application_id: applicationId,
        delegate_name: name,
        delegate_country: country,
        position: nextPosition,
        speaking_time: speakingTime,
      })
      .select('*')
      .single();
    if (!error && data) {
      setSpeakers(prev => [...prev, data as SpeakerEntry]);
    }
  }, [session, speakers.length]);

  const nextSpeaker = useCallback(async (bonusSeconds = 0) => {
    if (!session) return;
    // Mark the current speaker as done
    const currentSpeaker = speakers.find(s => s.status === 'speaking');
    if (currentSpeaker) {
      await (supabase.from('speakers_list') as any)
        .update({ status: 'done' })
        .eq('id', currentSpeaker.id);
    }
    // Find the next waiting speaker
    const next = speakers.find(s => s.status === 'waiting');
    if (next) {
      await (supabase.from('speakers_list') as any)
        .update({ status: 'speaking', spoke_at: new Date().toISOString() })
        .eq('id', next.id);
      const totalTime = next.speaking_time + bonusSeconds;
      await startTimer(totalTime);
      await updateSession({
        current_speaker_id: next.id,
        yield_type: 'none',
        yield_target_id: null,
      });
      await logEvent('speaker_started',
        `${next.delegate_name} (${next.delegate_country}) is now speaking${bonusSeconds > 0 ? ` (+${bonusSeconds}s bonus)` : ''}`
      );
    } else {
      await updateSession({ current_speaker_id: null, timer_running: false, timer_remaining: 0, yield_type: 'none' });
    }
    await loadSpeakers(session.id);
  }, [session, speakers, startTimer, updateSession, loadSpeakers]);

  const removeSpeaker = useCallback(async (speakerId: string) => {
    await (supabase.from('speakers_list') as any).delete().eq('id', speakerId);
    setSpeakers(prev => prev.filter(s => s.id !== speakerId));
  }, []);

  const requestFloor = useCallback(async (applicationId: string, name: string, country: string) => {
    await addSpeaker(applicationId, name, country);
  }, [addSpeaker]);

  const yieldTo = useCallback(async (type: YieldType) => {
    if (!session) return;

    if (type === 'chair') {
      // Remaining time is lost — next speaker starts with their own time
      await logEvent('yield', 'Yielded to chair — remaining time forfeited');
      await nextSpeaker(0);

    } else if (type === 'questions') {
      // Open to POI — stay on current speaker, timer keeps running
      await updateSession({ yield_type: 'questions' });
      await logEvent('yield', 'Floor open to Points of Information');

    } else if (type === 'delegate') {
      // Next speaker gets their own time PLUS current remaining time
      const remaining = sessionRef.current?.timer_remaining ?? 0;
      await logEvent('yield', `Yielded to next delegate with ${remaining}s bonus`);
      await nextSpeaker(remaining);
    }
  }, [session, nextSpeaker, updateSession, logEvent]);

  // ─── Attendance Actions ─────────────────────────────────

  const markAttendance = useCallback(async (applicationId: string, status: AttendanceStatus, isVoting = true) => {
    if (!session) return;
    // Optimistic update — flip immediately without waiting for realtime
    setAttendance(prev => {
      const exists = prev.find(a => a.application_id === applicationId && a.session_id === session.id);
      if (exists) {
        return prev.map(a =>
          a.application_id === applicationId && a.session_id === session.id
            ? { ...a, status, is_voting: isVoting }
            : a
        );
      }
      return [...prev, {
        id: crypto.randomUUID(),
        session_id: session.id,
        application_id: applicationId,
        status,
        is_voting: isVoting,
        updated_at: new Date().toISOString(),
      } as Attendance];
    });
    // Persist to DB
    await (supabase.from('attendance') as any).upsert({
      session_id: session.id,
      application_id: applicationId,
      status,
      is_voting: isVoting,
      updated_at: new Date().toISOString()
    });
  }, [session]);

  const toggleVotingPower = useCallback(async (applicationId: string, canVote: boolean) => {
    if (!session) return;
    await (supabase.from('attendance') as any).update({
      is_voting: canVote
    }).eq('session_id', session.id).eq('application_id', applicationId);
  }, [session]);

  // ─── Motion Actions ─────────────────────────────────────

  const proposeMotion = useCallback(async (
    applicationId: string,
    proposerName: string,
    proposerCountry: string,
    motionType: MotionType,
    description: string,
    speakingTime?: number,
    totalTime?: number,
  ) => {
    if (!session) return;
    const { data, error } = await (supabase
      .from('motions') as any)
      .insert({
        session_id: session.id,
        proposed_by: applicationId,
        proposer_name: proposerName,
        proposer_country: proposerCountry,
        motion_type: motionType,
        description,
        speaking_time: speakingTime || null,
        total_time: totalTime || null,
      })
      .select('*')
      .single();
    if (!error && data) {
      setMotions(prev => [data as Motion, ...prev]);
      await logEvent('motion_proposed', `New motion by ${proposerCountry}: ${description}`);
    }
  }, [session, logEvent]);

  const secondMotion = useCallback(async (motionId: string, applicationId: string) => {
    await (supabase.from('motions') as any)
      .update({ status: 'seconded', seconded_by: applicationId })
      .eq('id', motionId);
    if (session) await loadMotions(session.id);
  }, [session, loadMotions]);

  const openVoting = useCallback(async (motionId: string) => {
    await (supabase.from('motions') as any)
      .update({ status: 'voting' })
      .eq('id', motionId);
    await updateSession({ current_mode: 'voting' });
    await logEvent('voting_opened', `Voting opened for: ${motions.find(m => m.id === motionId)?.description}`);
    if (session) await loadMotions(session.id);
  }, [session, loadMotions, updateSession, logEvent, motions]);

  const castVote = useCallback(async (motionId: string, applicationId: string, choice: VoteChoice) => {
    await (supabase.from('votes') as any)
      .upsert({
        motion_id: motionId,
        application_id: applicationId,
        vote: choice,
      });
    await loadVotes(motionId);
  }, [loadVotes]);

  const closeVoting = useCallback(async (motionId: string) => {
    // Count votes
    const { data: voteData } = await (supabase.from('votes') as any)
      .select('*')
      .eq('motion_id', motionId);

    const allVotes = (voteData || []) as Vote[];
    const votesFor = allVotes.filter(v => v.vote === 'for').length;
    const votesAgainst = allVotes.filter(v => v.vote === 'against').length;
    const votesAbstain = allVotes.filter(v => v.vote === 'abstain').length;

    const passed = votesFor > votesAgainst;

    await (supabase.from('motions') as any)
      .update({
        status: passed ? 'passed' : 'failed',
        votes_for: votesFor,
        votes_against: votesAgainst,
        votes_abstain: votesAbstain,
      })
      .eq('id', motionId);

    await updateSession({ current_mode: 'gsl' });
    await logEvent(passed ? 'motion_passed' : 'motion_failed', `Motion ${passed ? 'PASSED' : 'FAILED'} (${votesFor}-${votesAgainst}-${votesAbstain})`);
    if (session) await loadMotions(session.id);
  }, [session, loadMotions, updateSession, logEvent]);

  // ─── Derived state ──────────────────────────────────────

  const currentSpeaker = speakers.find(s => s.status === 'speaking') || null;
  const waitingSpeakers = speakers.filter(s => s.status === 'waiting');
  const doneSpeakers = speakers.filter(s => s.status === 'done');
  const activeMotion = motions.find(m => m.status === 'voting' || m.status === 'seconded' || m.status === 'proposed') || null;

  return {
    // State
    session,
    speakers,
    motions,
    votes,
    loading,
    currentSpeaker,
    waitingSpeakers,
    doneSpeakers,
    activeMotion,
    attendance,
    logs,

    // Session actions
    createSession,
    updateSession,
    setMode,
    logEvent,

    // Timer
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,

    // Speakers
    addSpeaker,
    nextSpeaker,
    removeSpeaker,
    requestFloor,
    yieldTo,

    // Attendance
    markAttendance,
    toggleVotingPower,

    // Motions & Voting
    proposeMotion,
    secondMotion,
    openVoting,
    castVote,
    closeVoting,
    loadVotes,
  };
}

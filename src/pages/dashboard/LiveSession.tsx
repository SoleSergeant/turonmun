import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Timer,
  Vote,
  Gavel,
  Radio,
  Hand,
  Check,
  X,
  Minus,
  Activity,
  Users,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMunCommand } from '@/hooks/useMunCommand';
import type { MotionType, VoteChoice } from '@/types/munCommand';
import { SESSION_MODE_LABELS, MOTION_TYPE_LABELS } from '@/types/munCommand';
import type { Tables } from '@/integrations/supabase/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveSession() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Tables<'applications'> | null>(null);
  const [committeeId, setCommitteeId] = useState<string | null>(null);

  // Load delegate's application to get committee
  useEffect(() => {
    const loadApp = async () => {
      if (!user?.email) return;
      const { data } = await (supabase
        .from('applications') as any)
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setApplication(data as Tables<'applications'>);
        setCommitteeId(data.assigned_committee_id);
      }
    };
    loadApp();
  }, [user]);

  if (!committeeId || !application) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Radio className="h-12 w-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">No committee assigned yet</p>
          <p className="text-white/20 text-xs mt-2">You'll see the live session once your committee is assigned.</p>
        </div>
      </div>
    );
  }

  return <LiveSessionContent committeeId={committeeId} application={application} />;
}

function LiveSessionContent({
  committeeId,
  application,
}: {
  committeeId: string;
  application: Tables<'applications'>;
}) {
  const {
    session,
    loading,
    currentSpeaker,
    waitingSpeakers,
    doneSpeakers,
    motions,
    activeMotion,
    votes,
    logs,
    requestFloor,
    castVote,
    loadVotes,
  } = useMunCommand({ committeeId, isChair: false });

  const [hasVoted, setHasVoted] = useState(false);
  const [myVote, setMyVote] = useState<VoteChoice | null>(null);

  // Check if already in speakers list
  const isInQueue = waitingSpeakers.some(s => s.application_id === application.id) ||
                    currentSpeaker?.application_id === application.id;

  // Load votes for active motion
  useEffect(() => {
    if (activeMotion?.status === 'voting') {
      loadVotes(activeMotion.id);
    }
  }, [activeMotion?.id, activeMotion?.status]); // eslint-disable-line

  // Check if delegate already voted
  useEffect(() => {
    const myExistingVote = votes.find(v => v.application_id === application.id);
    if (myExistingVote) {
      setHasVoted(true);
      setMyVote(myExistingVote.vote);
    } else {
      setHasVoted(false);
      setMyVote(null);
    }
  }, [votes, application.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Activity className="h-8 w-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  if (!session || session.status === 'inactive') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Radio className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">No Active Session</h3>
          <p className="text-white/40 text-sm max-w-md">
            The committee chair has not started a live session yet. This page will update automatically when a session begins.
          </p>
        </div>
      </div>
    );
  }

  if (session.current_mode === 'roll_call') {
    return (
      <div className="flex flex-col items-center justify-center py-32 glass-card border-gold-400/30 bg-gold-400/5">
        <Users size={80} className="text-gold-400 mb-6 animate-pulse" />
        <h3 className="text-gold-400 text-2xl font-black uppercase tracking-widest mb-2 font-display">Roll Call in Progress</h3>
        <p className="text-white/40 text-sm max-w-sm text-center">
          Please wait as the Chair establishes quorum. You will be able to request the floor once the session officially begins.
        </p>
      </div>
    );
  }

  const timerPercent = session.timer_duration > 0
    ? (session.timer_remaining / session.timer_duration) * 100
    : 0;

  const timerColor = session.timer_remaining <= 10
    ? 'text-red-400'
    : session.timer_remaining <= 30
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <motion.div
      className="space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Live Status Header */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-white/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Radio size={100} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <Radio className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm uppercase tracking-widest block">Live Session</span>
              <span className="text-gold-400/70 text-[10px] font-bold uppercase tracking-widest">
                {SESSION_MODE_LABELS[session.current_mode]}
              </span>
            </div>
          </div>

          {/* Request Floor Button */}
          <motion.button
            onClick={() => requestFloor(application.id, application.full_name, application.country)}
            disabled={isInQueue}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              isInQueue
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                : 'bg-gold-400 text-diplomatic-950 hover:bg-gold-500 shadow-[0_4px_20px_rgba(247,163,28,0.2)]'
            }`}
            whileHover={isInQueue ? {} : { scale: 1.05, y: -2 }}
            whileTap={isInQueue ? {} : { scale: 0.95 }}
          >
            {isInQueue ? (
              <>
                <Check className="h-4 w-4" />
                In Queue
              </>
            ) : (
              <>
                <Hand className="h-4 w-4" />
                Request Floor
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Timer + Current Speaker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timer */}
        <motion.div variants={itemVariants} className="glass-card p-8 border border-white/15 flex flex-col items-center justify-center">
          <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Session Timer</h3>
          
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="90"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="90"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray="565"
                animate={{ strokeDashoffset: 565 - (565 * timerPercent) / 100 }}
                transition={{ duration: 1, ease: "linear" }}
                className={timerColor}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-mono font-black ${timerColor} tracking-tighter`}>
                {formatTime(session.timer_remaining)}
              </span>
              <span className="text-white/20 text-[8px] font-bold uppercase tracking-widest mt-1">
                {session.timer_running ? 'Running' : 'Paused'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Current Speaker */}
        <motion.div variants={itemVariants} className="glass-card p-8 border border-white/15 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Mic size={80} className="text-white" />
          </div>
          <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Now on Podium</h3>
          {currentSpeaker ? (
            <div className="text-center relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <Mic className="h-10 w-10 text-emerald-400" />
              </div>
              <p className="text-white font-bold text-xl mb-1">{currentSpeaker.delegate_name}</p>
              <p className="text-white/40 text-sm mb-6">{currentSpeaker.delegate_country}</p>
              
              {/* Yield Status */}
              {session.yield_type && session.yield_type !== 'none' && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest ${
                  session.yield_type === 'chair' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  session.yield_type === 'questions' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  'bg-diplomatic-400/10 border-diplomatic-400/30 text-diplomatic-400'
                }`}>
                  <Activity className="h-3 w-3" />
                  Yielded to {session.yield_type}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 relative z-10">
              <MicOff className="h-12 w-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Waiting for speaker</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Speakers Queue */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-white/15">
        <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          Speakers Queue
          <span className="text-gold-400 ml-2">{waitingSpeakers.length} waiting</span>
        </h3>
        <div className="space-y-2">
          {waitingSpeakers.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Queue is empty</p>
            </div>
          ) : (
            waitingSpeakers.map((speaker, index) => (
              <div
                key={speaker.id}
                className={`flex items-center gap-3 glass-panel p-3 rounded-xl border-white/5 ${
                  speaker.application_id === application.id
                    ? 'bg-gold-400/10 border-gold-400/20'
                    : 'bg-white/5'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/30 text-xs font-bold border border-white/10">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {speaker.delegate_name}
                    {speaker.application_id === application.id && (
                      <span className="text-gold-400 text-[10px] ml-2">(You)</span>
                    )}
                  </p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">{speaker.delegate_country}</p>
                </div>
                <span className="text-white/20 text-xs font-mono">{formatTime(speaker.speaking_time)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Active Voting */}
      {activeMotion && activeMotion.status === 'voting' && (
        <motion.div
          variants={itemVariants}
          className="glass-card p-6 border border-gold-400/30 bg-gradient-to-br from-gold-400/5 to-transparent relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Vote size={120} className="text-gold-400" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold-400/20 flex items-center justify-center border border-gold-400/30">
                <Vote className="h-5 w-5 text-gold-400" />
              </div>
              <div>
                <p className="text-gold-400 text-[10px] font-bold uppercase tracking-widest">Vote Required</p>
                <p className="text-white font-bold">{activeMotion.description}</p>
                <p className="text-white/40 text-xs">
                  {MOTION_TYPE_LABELS[activeMotion.motion_type]} • Proposed by {activeMotion.proposer_name}
                </p>
              </div>
            </div>

            {hasVoted ? (
              <div className="text-center py-6">
                <Check className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-bold mb-1">Vote Cast</p>
                <p className="text-white/40 text-sm">
                  You voted <span className={`font-bold ${
                    myVote === 'for' ? 'text-emerald-400' :
                    myVote === 'against' ? 'text-red-400' :
                    'text-white/60'
                  }`}>{myVote?.toUpperCase()}</span>
                </p>

                {/* Show current tally */}
                <div className="grid grid-cols-3 gap-3 mt-4 max-w-sm mx-auto">
                  <div className="glass-panel p-2 rounded-lg border-emerald-500/20 bg-emerald-500/5 text-center">
                    <p className="text-emerald-400 text-lg font-bold">{votes.filter(v => v.vote === 'for').length}</p>
                    <p className="text-emerald-400/60 text-[10px] font-bold uppercase">For</p>
                  </div>
                  <div className="glass-panel p-2 rounded-lg border-red-500/20 bg-red-500/5 text-center">
                    <p className="text-red-400 text-lg font-bold">{votes.filter(v => v.vote === 'against').length}</p>
                    <p className="text-red-400/60 text-[10px] font-bold uppercase">Against</p>
                  </div>
                  <div className="glass-panel p-2 rounded-lg border-white/10 bg-white/5 text-center">
                    <p className="text-white/60 text-lg font-bold">{votes.filter(v => v.vote === 'abstain').length}</p>
                    <p className="text-white/30 text-[10px] font-bold uppercase">Abstain</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {([
                  { choice: 'for' as VoteChoice, label: 'In Favor', icon: Check, color: 'emerald' },
                  { choice: 'against' as VoteChoice, label: 'Against', icon: X, color: 'red' },
                  { choice: 'abstain' as VoteChoice, label: 'Abstain', icon: Minus, color: 'gray' },
                ]).map(({ choice, label, icon: Icon, color }) => (
                  <motion.button
                    key={choice}
                    onClick={() => castVote(activeMotion.id, application.id, choice)}
                    className={`flex flex-col items-center gap-2 p-6 rounded-2xl border transition-all ${
                      color === 'emerald'
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
                        : color === 'red'
                        ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60'
                    }`}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-8 w-8" />
                    <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Bottom Grid: Recent History & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Motions */}
        <motion.div variants={itemVariants} className="lg:col-span-8 glass-card p-6 border border-white/15">
          <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Gavel className="h-3 w-3" />
            Motion History
          </h3>
          <div className="space-y-3 prose-white max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {motions.filter(m => m.status !== 'voting').length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <Gavel className="h-12 w-12 text-white/5 mb-4" />
                <p className="text-white/20 text-xs uppercase tracking-widest font-bold">No motion history available</p>
              </div>
            ) : (
              motions.filter(m => m.status !== 'voting').map(m => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className={`w-3 h-3 rounded-full ${
                    m.status === 'passed' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                    m.status === 'failed' ? 'bg-red-400' :
                    'bg-white/10'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm mb-0.5">{m.description}</p>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      {MOTION_TYPE_LABELS[m.motion_type]} • {m.proposer_country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black uppercase ${m.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.status}
                    </p>
                    <p className="text-[10px] text-white/20 font-mono">
                      {m.votes_for}-{m.votes_against}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Session Activity Log */}
        <motion.div variants={itemVariants} className="lg:col-span-4 glass-card p-6 border border-white/15">
          <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Activity Log
          </h3>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar h-[400px]">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="relative pl-5 pb-4 last:pb-0 border-l border-white/5">
                <div className="absolute left-[-4.5px] top-0 w-2 h-2 rounded-full bg-white/20" />
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-white/70 text-xs leading-relaxed">{log.message}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { LiveSession };

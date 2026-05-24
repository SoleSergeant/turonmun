import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  UserPlus,
  X,
  Gavel,
  Vote,
  Timer,
  Users,
  Mic,
  MicOff,
  Radio,
  ChevronDown,
  Check,
  XCircle,
  Zap,
  Activity,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useMunCommand } from '@/hooks/useMunCommand';
import type { SessionMode, MotionType } from '@/types/munCommand';
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

export default function CommandCenter() {
  const context = useOutletContext<any>();
  const committees = context?.committees || [];
  const applications = context?.applications || [];
  const committeeId = committees[0]?.id;

  const {
    session,
    loading,
    currentSpeaker,
    waitingSpeakers,
    doneSpeakers,
    motions,
    activeMotion,
    votes,
    attendance,
    markAttendance,
    logs,
    createSession,
    setMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    addSpeaker,
    nextSpeaker,
    removeSpeaker,
    openVoting,
    closeVoting,
    loadVotes,
    yieldTo,
  } = useMunCommand({ committeeId: committeeId || '', isChair: true });

  // Local UI state
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);
  const [showNewMotion, setShowNewMotion] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(30);
  const [speakerTime, setSpeakerTime] = useState(60);

  // New motion form
  const [motionType, setMotionType] = useState<MotionType>('moderated_caucus');
  const [motionDesc, setMotionDesc] = useState('');
  const [motionSpeakingTime, setMotionSpeakingTime] = useState(60);
  const [motionTotalTime, setMotionTotalTime] = useState(600);

  // Load votes for active motion
  useEffect(() => {
    if (activeMotion?.status === 'voting') {
      loadVotes(activeMotion.id);
    }
  }, [activeMotion?.id, activeMotion?.status]); // eslint-disable-line

  if (!committeeId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Gavel className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">No committee assigned</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Activity className="h-8 w-8 text-gold-400 animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  // Start session if none exists
  if (!session) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-gold-400/20 to-gold-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gold-400/30">
            <Gavel className="h-12 w-12 text-gold-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">MUN Command</h2>
          <p className="text-white/50 mb-8 max-w-md">Launch a live committee session to manage speakers, motions, and voting in real-time.</p>
          <motion.button
            onClick={createSession}
            className="bg-gold-400 hover:bg-gold-500 text-diplomatic-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(247,163,28,0.3)] transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Start Session
          </motion.button>
        </motion.div>
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
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Session Status Bar */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-4 border border-white/15 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <Radio className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-widest">Live Session</span>
          <span className="text-white/30 mx-2">•</span>
          <span className="text-gold-400 font-bold text-xs uppercase tracking-widest">
            {SESSION_MODE_LABELS[session.current_mode]}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SESSION_MODE_LABELS) as SessionMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                session.current_mode === mode
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {SESSION_MODE_LABELS[mode].split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Roll Call Interface (Overlay/Partial) ──────────────── */}
      <AnimatePresence>
        {session.current_mode === 'roll_call' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 border-gold-400/30 bg-gold-400/5 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Users size={180} className="text-gold-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-gold-400 text-xl font-display font-black uppercase tracking-widest mb-1">Roll Call</h3>
                  <p className="text-white/40 text-xs">Establish quorum and record attendance for today's session.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-emerald-400 text-2xl font-black">{attendance.filter(a => a.status === 'present').length}</p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gold-400 text-2xl font-black">{Math.ceil(applications.length / 2)}</p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Quorum</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                {applications.map((app: Tables<'applications'>) => {
                  const att = attendance.find(a => a.application_id === app.id);
                  return (
                    <div
                      key={app.id}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        att?.status === 'present'
                          ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                      onClick={() => markAttendance(app.id, att?.status === 'present' ? 'absent' : 'present')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/30 font-bold uppercase truncate max-w-[80%]">{app.country}</span>
                        {att?.status === 'present' && <Check className="h-3 w-3 text-emerald-400" />}
                      </div>
                      <p className={`text-xs font-bold truncate ${att?.status === 'present' ? 'text-white' : 'text-white/40'}`}>
                        {app.full_name}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setMode('gsl')}
                  className="bg-gold-400 hover:bg-gold-500 text-diplomatic-950 px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
                >
                  Confirm & Start Session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Timer Panel ─────────────────────────────── */}
        <motion.div variants={itemVariants} className="lg:col-span-5">
          <div className="glass-card p-8 border border-white/15 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="relative z-10">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 text-center">Session Timer</h3>

              {/* Enhanced Circular Timer Effect */}
              <div className="relative w-64 h-64 mx-auto mb-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="754"
                    animate={{ strokeDashoffset: 754 - (754 * timerPercent) / 100 }}
                    transition={{ duration: 1, ease: "linear" }}
                    className={timerColor}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-mono font-black ${timerColor} tracking-tighter`}>
                    {formatTime(session.timer_remaining)}
                  </span>
                  <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {session.timer_running ? 'Running' : 'Paused'}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-4 mb-8">
                {!session.timer_running ? (
                  <motion.button
                    onClick={resumeTimer}
                    className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Play className="h-8 w-8 ml-1" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={pauseTimer}
                    className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pause className="h-8 w-8" />
                  </motion.button>
                )}
                <motion.button
                  onClick={resetTimer}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 180].map(sec => (
                  <button
                    key={sec}
                    onClick={() => startTimer(sec)}
                    className="py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
                  >
                    {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Speakers & Yields Panel ─────────────────────── */}
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <div className="glass-card p-6 border border-white/15 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                Live Podium
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddSpeaker(!showAddSpeaker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/20 border border-gold-400/30 text-gold-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400/30 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Speaker
                </button>
                <button
                  onClick={nextSpeaker}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Next
                </button>
              </div>
            </div>

            {/* Current Speaker & Yields */}
            {currentSpeaker ? (
              <div className="mb-6">
                <div className="glass-panel p-6 rounded-2xl border-emerald-500/30 bg-emerald-500/5 mb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Mic size={80} className="text-emerald-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <Mic className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Now Speaking</p>
                      <h4 className="text-white text-xl font-bold">{currentSpeaker.delegate_name}</h4>
                      <p className="text-white/40 text-sm">{currentSpeaker.delegate_country}</p>
                    </div>
                  </div>

                  {/* Yield Controls */}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 text-center">Speaker Yielding Options</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => yieldTo('chair')}
                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          session.yield_type === 'chair'
                            ? 'bg-gold-400 text-diplomatic-950 border-gold-500 shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        Yield to Chair
                      </button>
                      <button
                        onClick={() => yieldTo('questions')}
                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          session.yield_type === 'questions'
                            ? 'bg-emerald-400 text-diplomatic-950 border-emerald-500 shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        Points/Quest.
                      </button>
                      <button
                        onClick={() => yieldTo('delegate')}
                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          session.yield_type === 'delegate'
                            ? 'bg-diplomatic-400 text-white border-diplomatic-500 shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        Yield Delegate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-2xl mb-6">
                <MicOff className="h-12 w-12 text-white/10 mb-4" />
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Podium is empty</p>
              </div>
            )}

            {/* Queue Management */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <h5 className="text-white/20 text-[9px] font-bold uppercase tracking-widest mb-4">Speaker Queue ({waitingSpeakers.length})</h5>
              <div className="space-y-2">
                {waitingSpeakers.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/15 transition-all">
                    <span className="w-6 text-[10px] font-black text-white/20">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm truncate">{s.delegate_name}</p>
                      <p className="text-white/30 text-[10px] uppercase font-bold">{s.delegate_country}</p>
                    </div>
                    <span className="text-emerald-400/50 font-mono text-xs">{formatTime(s.speaking_time)}</span>
                    <button
                      onClick={() => removeSpeaker(s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400/40 hover:text-red-400 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Bottom Grid: Motions & Logs ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Motions Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-8">
          <div className="glass-card p-6 border border-white/15 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Motions & Voting</h3>
              <button
                onClick={() => setShowNewMotion(!showNewMotion)}
                className="bg-diplomatic-400/20 text-diplomatic-400 border border-diplomatic-400/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              >
                {showNewMotion ? 'Close Form' : 'New Motion'}
              </button>
            </div>

            {/* Voting Phase High-Impact UI */}
            <AnimatePresence>
              {activeMotion?.status === 'voting' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-8"
                >
                  <div className="glass-panel p-8 rounded-3xl border-gold-400/30 bg-gold-400/5 shadow-[0_0_50px_rgba(247,163,28,0.05)]">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="flex-1 text-center md:text-left">
                        <span className="inline-block px-3 py-1 rounded-full bg-gold-400/20 text-gold-400 text-[10px] font-black uppercase tracking-widest mb-4 animate-pulse">
                          Active Voting Procedure
                        </span>
                        <h4 className="text-white text-2xl font-display font-black mb-2">{activeMotion.description}</h4>
                        <p className="text-white/40 text-sm">Proposed by {activeMotion.proposer_name} ({activeMotion.proposer_country})</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 min-w-[300px]">
                        <div className="text-center">
                          <p className="text-4xl font-black text-emerald-400 mb-1">{votes.filter(v => v.vote === 'for').length}</p>
                          <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">In Favor</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-black text-red-400 mb-1">{votes.filter(v => v.vote === 'against').length}</p>
                          <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Opposed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-black text-white/40 mb-1">{votes.filter(v => v.vote === 'abstain').length}</p>
                          <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Abstain</p>
                        </div>
                      </div>

                      <button
                        onClick={() => closeVoting(activeMotion.id)}
                        className="bg-white text-diplomatic-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all"
                      >
                        Finalize Result
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 prose-white max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {motions.map(m => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className={`w-3 h-3 rounded-full ${
                    m.status === 'passed' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                    m.status === 'failed' ? 'bg-red-400' :
                    m.status === 'voting' ? 'bg-gold-400 animate-pulse' : 'bg-white/20'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm mb-0.5">{m.description}</p>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      {MOTION_TYPE_LABELS[m.motion_type]} • {m.proposer_country}
                    </p>
                  </div>
                  {m.status === 'proposed' && (
                    <button
                      onClick={() => openVoting(m.id)}
                      className="px-4 py-2 bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-400 shadow-sm transition-all"
                    >
                      Open Vote
                    </button>
                  )}
                  {(m.status === 'passed' || m.status === 'failed') && (
                    <div className="text-right">
                      <p className={`text-xs font-black uppercase ${m.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.status}
                      </p>
                      <p className="text-[10px] text-white/20 font-mono">
                        {m.votes_for}-{m.votes_against}-{m.votes_abstain}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Real-time Session Log */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <div className="glass-card p-6 border border-white/15 h-full flex flex-col">
            <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Session Activity
            </h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
              {logs.map((log, i) => (
                <div key={log.id} className="relative pl-5 pb-4 last:pb-0 border-l border-white/5">
                  <div className="absolute left-[-4.5px] top-0 w-2 h-2 rounded-full bg-white/20" />
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <p className="text-white/70 text-xs leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

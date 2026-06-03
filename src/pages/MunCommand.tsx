import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  UserPlus,
  X,
  Gavel,
  Timer,
  Mic,
  MicOff,
  Radio,
  Check,
  Minus,
  Vote,
  Plus,
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Types ────────────────────────────────────────────────
type SessionMode = 'gsl' | 'moderated_caucus' | 'unmoderated_caucus' | 'voting' | 'roll_call';

interface Speaker {
  id: string;
  name: string;
  country: string;
  status: 'waiting' | 'speaking' | 'done';
  speakingTime: number;
}

interface MotionEntry {
  id: string;
  proposerName: string;
  proposerCountry: string;
  type: string;
  description: string;
  status: 'proposed' | 'voting' | 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
}

interface SessionLog {
  id: string;
  time: string;
  message: string;
}

type YieldType = 'chair' | 'questions' | 'delegate' | 'none';

const MODE_LABELS: Record<SessionMode, string> = {
  gsl: 'General Speakers List',
  moderated_caucus: 'Moderated Caucus',
  unmoderated_caucus: 'Unmoderated Caucus',
  voting: 'Voting Procedure',
  roll_call: 'Roll Call',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ════════════════════════════════════════════════════════════
//  PUBLIC MUN COMMAND PAGE
// ════════════════════════════════════════════════════════════
export default function MunCommand() {
  // Session state
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<SessionMode>('gsl');

  // Timer
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speakers
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [speakerTime, setSpeakerTime] = useState(60);

  const [motionCountry, setMotionCountry] = useState('');

  // Yields & Logs (Local)
  const [yieldType, setYieldType] = useState<YieldType>('none');
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'not_set'>>({});

  // ─── Timer logic ────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const startTimer = (secs: number) => {
    setTimerDuration(secs);
    setTimerRemaining(secs);
    setTimerRunning(true);
    addLog(`Timer started for ${secs} seconds`);
  };
  const pauseTimer = () => {
    setTimerRunning(false);
    addLog('Timer paused');
  };
  const resumeTimer = () => { 
    if (timerRemaining > 0) {
      setTimerRunning(true);
      addLog('Timer resumed');
    }
  };
  const resetTimer = () => { 
    setTimerRunning(false); 
    setTimerDuration(0); 
    setTimerRemaining(0); 
    addLog('Timer reset');
  };

  // ─── Logs & Helpers ─────────────────────────────────────
  const addLog = (msg: string) => {
    setLogs(prev => [{
      id: uid(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: msg
    }, ...prev]);
  };

  // ─── Speakers ───────────────────────────────────────────
  const addSpeaker = () => {
    if (!newName.trim()) return;
    setSpeakers(prev => [...prev, {
      id: uid(),
      name: newName.trim(),
      country: newCountry.trim(),
      status: 'waiting',
      speakingTime: speakerTime,
    }]);
    setNewName('');
    setNewCountry('');
    setShowAddSpeaker(false);
  };

  const nextSpeaker = () => {
    setSpeakers(prev => {
      const updated = prev.map(s => s.status === 'speaking' ? { ...s, status: 'done' as const } : s);
      const nextIdx = updated.findIndex(s => s.status === 'waiting');
      if (nextIdx >= 0) {
        updated[nextIdx] = { ...updated[nextIdx], status: 'speaking' };
        startTimer(updated[nextIdx].speakingTime);
        setYieldType('none');
        addLog(`Now speaking: ${updated[nextIdx].name} (${updated[nextIdx].country})`);
      }
      return updated;
    });
  };

  const removeSpeaker = (id: string) => {
    setSpeakers(prev => prev.filter(s => s.id !== id));
    addLog('Removed speaker from queue');
  };

  const yieldTo = (target: YieldType) => {
    setYieldType(target);
    addLog(`Speaker yielded to ${target}`);
  };

  const toggleAttendance = (id: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : 'present'
    }));
  };

  // ─── Motions ────────────────────────────────────────────
  const createMotion = () => {
    if (!motionDesc.trim()) return;
    setMotions(prev => [{
      id: uid(),
      proposerName: motionProposer || 'Anonymous',
      proposerCountry: motionCountry || '',
      type: 'motion',
      description: motionDesc.trim(),
      status: 'proposed',
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
    }, ...prev]);
    setMotionDesc('');
    setMotionProposer('');
    setMotionCountry('');
    setShowNewMotion(false);
  };

  const openVoting = (id: string) => {
    setMotions(prev => prev.map(m => m.id === id ? { ...m, status: 'voting' as const } : m));
    setMode('voting');
  };

  const addVote = (id: string, type: 'for' | 'against' | 'abstain') => {
    setMotions(prev => prev.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        votesFor: m.votesFor + (type === 'for' ? 1 : 0),
        votesAgainst: m.votesAgainst + (type === 'against' ? 1 : 0),
        votesAbstain: m.votesAbstain + (type === 'abstain' ? 1 : 0),
      };
    }));
  };

  const closeVoting = (id: string) => {
    setMotions(prev => prev.map(m => {
      if (m.id !== id) return m;
      return { ...m, status: m.votesFor > m.votesAgainst ? 'passed' as const : 'failed' as const };
    }));
    setMode('gsl');
  };

  const currentSpeaker = speakers.find(s => s.status === 'speaking');
  const waitingSpeakers = speakers.filter(s => s.status === 'waiting');
  const doneSpeakers = speakers.filter(s => s.status === 'done');
  const votingMotion = motions.find(m => m.status === 'voting');

  const timerPercent = timerDuration > 0 ? (timerRemaining / timerDuration) * 100 : 0;
  const timerColor = timerRemaining <= 10 ? 'text-red-400' : timerRemaining <= 30 ? 'text-amber-400' : 'text-emerald-400';
  const timerBarColor = timerRemaining <= 10 ? 'bg-red-400' : timerRemaining <= 30 ? 'bg-amber-400' : 'bg-emerald-400';

  // ════════════════════════════════════════════════════════
  //  Landing / Start Screen
  // ════════════════════════════════════════════════════════
  if (!isActive) {
    return (
      <>
        <Helmet>
          <title>MUN Command — Free Chairing Tool | TuronMUN</title>
          <meta name="description" content="Free, real-time MUN chairing tool. Timer, Speakers List, Motions, and Voting — all in one place. No login required." />
        </Helmet>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-950 pt-24 pb-16">
          <motion.div
            className="container mx-auto px-4 max-w-4xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Hero */}
            <motion.div variants={itemVariants} className="text-center mb-16 pt-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/20 mb-6">
                <Zap className="h-3.5 w-3.5 text-gold-400" />
                <span className="text-gold-400 text-xs font-bold uppercase tracking-widest">Free Tool — No Login Required</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4 tracking-tight">
                MUN <span className="text-gold-400">Command</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                The all-in-one chairing tool for Model United Nations. Timer, Speakers List, Motions, and Voting — right in your browser.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {[
                { icon: Timer, title: 'Session Timer', desc: 'Presets from 30s to 10min, plus custom. Auto-pauses at zero.', color: 'emerald' },
                { icon: Mic, title: 'Speakers List', desc: 'Add delegates, advance queue, track speaking time automatically.', color: 'gold' },
                { icon: Gavel, title: 'Motions & Voting', desc: 'Create motions, run live voting, see results instantly.', color: 'diplomatic' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="glass-card p-6 border border-white/10 text-center group hover:border-white/20 transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-${color}-400/20 flex items-center justify-center mx-auto mb-4 border border-${color}-400/30 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 text-${color}-400`} />
                  </div>
                  <h3 className="text-white font-bold mb-2">{title}</h3>
                  <p className="text-white/40 text-sm">{desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Launch Button */}
            <motion.div variants={itemVariants} className="text-center">
              <motion.button
                onClick={() => setIsActive(true)}
                className="bg-gold-400 hover:bg-gold-500 text-diplomatic-950 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_8px_30px_rgba(247,163,28,0.3)] transition-all"
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="h-5 w-5 inline mr-2 -mt-0.5" />
                Launch MUN Command
              </motion.button>
              <p className="text-white/20 text-xs mt-4 uppercase tracking-widest">Works on desktop, tablet, and phone</p>
            </motion.div>
          </motion.div>
        </div>
        <Footer />
      </>
    );
  }

  // ════════════════════════════════════════════════════════
  //  Active Command Center
  // ════════════════════════════════════════════════════════
  return (
    <>
      <Helmet>
        <title>MUN Command — Live Session | TuronMUN</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-950">
        {/* Top Bar */}
        <div className="glass-card border-b border-white/10 px-4 md:px-8 py-3 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <Gavel className="h-5 w-5 text-gold-400" />
              </div>
              <span className="text-white font-bold text-sm uppercase tracking-widest hidden sm:inline">MUN Command</span>
              <span className="text-white/20 mx-1 hidden sm:inline">•</span>
              <span className="text-gold-400/70 text-xs font-bold uppercase tracking-widest">{MODE_LABELS[mode]}</span>
            </div>

            {/* Mode selector */}
            <div className="flex flex-wrap gap-1">
              {(Object.keys(MODE_LABELS) as SessionMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                    mode === m
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {MODE_LABELS[m].split(' ').slice(-1)[0]}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setIsActive(false); resetTimer(); setSpeakers([]); setMotions([]); }}
              className="text-white/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ═══ Timer Panel ═══ */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              <div className="glass-card p-8 border border-white/15 relative overflow-hidden flex flex-col items-center">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Timer size={140} className="text-white" />
                </div>
                <div className="relative z-10 w-full">
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 text-center">Session Timer</h3>

                  <div className="relative w-56 h-56 mx-auto mb-10">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="112"
                        cy="112"
                        r="104"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-white/5"
                      />
                      <motion.circle
                        cx="112"
                        cy="112"
                        r="104"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray="653"
                        animate={{ strokeDashoffset: 653 - (653 * timerPercent) / 100 }}
                        transition={{ duration: 1, ease: "linear" }}
                        className={timerColor}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-mono font-black ${timerColor} tracking-tighter`}>
                        {formatTime(timerRemaining)}
                      </span>
                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-2">
                        {timerRunning ? 'Running' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4 mb-10">
                    {!timerRunning ? (
                      <motion.button onClick={resumeTimer} className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)]" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Play className="h-8 w-8 ml-1" />
                      </motion.button>
                    ) : (
                      <motion.button onClick={pauseTimer} className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)]" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Pause className="h-8 w-8" />
                      </motion.button>
                    )}
                    <motion.button onClick={resetTimer} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:bg-white/10 transition-all" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <RotateCcw className="h-6 w-6" />
                    </motion.button>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-2 px-4">
                    {[30, 45, 60, 90, 120, 180, 300, 600].map(sec => (
                      <button key={sec} onClick={() => startTimer(sec)} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 text-[10px] font-bold transition-all">
                        {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Activity Log (Standalone version) */}
              <div className="glass-card mt-6 p-6 border border-white/10">
                <h3 className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  Recent Activity
                </h3>
                <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {logs.length === 0 ? (
                    <p className="text-white/10 text-xs text-center py-12 italic">Session activity will appear here...</p>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex gap-3 text-xs">
                        <span className="text-white/20 font-mono shrink-0">{log.time}</span>
                        <span className="text-white/60">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            {/* ═══ Speakers List ═══ */}
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <div className="glass-card p-6 border border-white/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Mic size={120} className="text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Speakers List <span className="text-gold-400 ml-2">{waitingSpeakers.length} waiting</span>
                    </h3>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setShowAddSpeaker(!showAddSpeaker)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/20 border border-gold-400/30 text-gold-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400/30 transition-all"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Add
                      </motion.button>
                      <motion.button
                        onClick={nextSpeaker}
                        disabled={waitingSpeakers.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-all disabled:opacity-30"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      >
                        <SkipForward className="h-3.5 w-3.5" /> Next
                      </motion.button>
                    </div>
                  </div>

                  {/* Mode-Specific Overlays */}
                  {mode === 'roll_call' && (
                    <div className="glass-panel p-8 rounded-2xl border-gold-400/30 bg-gold-400/5 mb-6 text-center">
                      <Users size={60} className="text-gold-400 mx-auto mb-4 animate-pulse" />
                      <h4 className="text-white text-xl font-black uppercase tracking-widest mb-2 font-display">Roll Call Mode</h4>
                      <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">Establish quorum by marking delegate attendance. Delegates can be added below.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {waitingSpeakers.map(s => (
                          <button
                            key={s.id}
                            onClick={() => toggleAttendance(s.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              attendance[s.id] === 'present'
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-white/30'
                            }`}
                          >
                            {attendance[s.id] === 'present' ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                            {s.country}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Speaker Form */}
                  <AnimatePresence>
                    {showAddSpeaker && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="glass-panel p-5 rounded-2xl border-white/10 mb-6 space-y-4 bg-white/5">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Delegate Name</label>
                              <input
                                type="text"
                                placeholder="e.g. John Doe"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addSpeaker()}
                                className="w-full glass-panel px-4 py-2.5 text-white placeholder-white/10 border-white/10 rounded-xl text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Country</label>
                              <input
                                type="text"
                                placeholder="e.g. USA"
                                value={newCountry}
                                onChange={e => setNewCountry(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addSpeaker()}
                                className="w-full glass-panel px-4 py-2.5 text-white placeholder-white/10 border-white/10 rounded-xl text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Time limit:</span>
                              <input 
                                type="number" 
                                min={10} 
                                max={600} 
                                value={speakerTime} 
                                onChange={e => setSpeakerTime(parseInt(e.target.value) || 60)} 
                                className="w-20 glass-panel px-3 py-1.5 text-white font-bold text-center border-white/10 rounded-lg text-sm" 
                              />
                              <span className="text-white/20 text-[10px] font-bold">SECONDS</span>
                            </div>
                            <button onClick={addSpeaker} className="px-6 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all">
                              Add Delegate
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Current Speaker */}
                  {currentSpeaker && (
                    <div className="glass-panel p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5 mb-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Mic size={60} className="text-emerald-400" />
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Mic className="h-8 w-8 text-emerald-400 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">Floor is open</p>
                            <p className="text-white font-black text-xl">{currentSpeaker.name}</p>
                            <p className="text-white/40 text-sm font-medium">{currentSpeaker.country}</p>
                          </div>
                        </div>

                        {/* Yield Controls */}
                        <div className="flex flex-wrap gap-2">
                          {(['chair', 'questions', 'delegate'] as YieldType[]).map(type => (
                            <button
                              key={type}
                              onClick={() => yieldTo(type)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                yieldType === type
                                  ? 'bg-gold-400 border-gold-400 text-diplomatic-950 shadow-[0_0_15px_rgba(247,163,28,0.3)]'
                                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              Yield to {type}
                            </button>
                          ))}
                          {yieldType !== 'none' && (
                            <button onClick={() => yieldTo('none')} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Queue */}
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {waitingSpeakers.length === 0 && !currentSpeaker && (
                      <div className="text-center py-8">
                        <MicOff className="h-8 w-8 text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 text-xs uppercase tracking-widest font-bold">No speakers in queue</p>
                      </div>
                    )}
                    {waitingSpeakers.map((s, idx) => (
                      <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-3 glass-panel p-3 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/30 text-xs font-bold border border-white/10">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{s.name}</p>
                          <p className="text-white/30 text-[10px] uppercase tracking-wider">{s.country}</p>
                        </div>
                        <span className="text-white/20 text-xs font-mono">{formatTime(s.speakingTime)}</span>
                        <button onClick={() => removeSpeaker(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {doneSpeakers.length > 0 && (
                    <p className="mt-4 pt-3 border-t border-white/5 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                      {doneSpeakers.length} delegate{doneSpeakers.length !== 1 ? 's' : ''} have spoken
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ═══ Motions & Voting ═══ */}
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6 border border-white/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Gavel size={120} className="text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Motions & Voting</h3>
                  <motion.button
                    onClick={() => setShowNewMotion(!showNewMotion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-diplomatic-400/20 border border-diplomatic-400/30 text-diplomatic-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-diplomatic-400/30 transition-all"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    <Gavel className="h-3.5 w-3.5" /> {showNewMotion ? 'Cancel' : 'New Motion'}
                  </motion.button>
                </div>

                {/* New Motion Form */}
                <AnimatePresence>
                  {showNewMotion && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="glass-panel p-5 rounded-xl border-white/10 mb-6 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input type="text" placeholder="Proposer name" value={motionProposer} onChange={e => setMotionProposer(e.target.value)} className="glass-panel px-3 py-2 text-white placeholder-white/20 border-white/10 rounded-lg text-sm" />
                          <input type="text" placeholder="Country" value={motionCountry} onChange={e => setMotionCountry(e.target.value)} className="glass-panel px-3 py-2 text-white placeholder-white/20 border-white/10 rounded-lg text-sm" />
                          <input type="text" placeholder="Motion description" value={motionDesc} onChange={e => setMotionDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && createMotion()} className="glass-panel px-3 py-2 text-white placeholder-white/20 border-white/10 rounded-lg text-sm" />
                        </div>
                        <div className="text-right">
                          <button onClick={createMotion} className="px-4 py-1.5 bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded-lg text-xs font-bold hover:bg-gold-400/30 transition-all">
                            Submit Motion
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                    {/* Active Voting UI */}
                    {votingMotion && (
                      <div className="glass-panel p-8 rounded-3xl border-gold-400/30 bg-gold-400/5 mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Vote size={120} className="text-gold-400" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gold-400/20 flex items-center justify-center border border-gold-400/30">
                              <Vote className="h-7 w-7 text-gold-400 shadow-[0_0_15px_rgba(247,163,28,0.3)]" />
                            </div>
                            <div>
                              <p className="text-gold-400 text-xs font-black uppercase tracking-widest mb-1">Voting Procedure</p>
                              <h4 className="text-white text-2xl font-black tracking-tight">{votingMotion.description}</h4>
                              <p className="text-white/40 text-sm font-medium">Proposed by {votingMotion.proposerName} ({votingMotion.proposerCountry})</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-8">
                            <motion.button onClick={() => addVote(votingMotion.id, 'for')} className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                              <span className="text-3xl font-black text-white">{votingMotion.votesFor}</span>
                              <span className="text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.2em]">In Favor</span>
                            </motion.button>
                            <motion.button onClick={() => addVote(votingMotion.id, 'against')} className="glass-card p-6 border-red-500/20 bg-red-500/5 text-center flex flex-col items-center gap-2 hover:bg-red-500/10 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <X className="h-8 w-8 text-red-400" />
                              <span className="text-3xl font-black text-white">{votingMotion.votesAgainst}</span>
                              <span className="text-red-400/60 text-[10px] font-black uppercase tracking-[0.2em]">Against</span>
                            </motion.button>
                            <motion.button onClick={() => addVote(votingMotion.id, 'abstain')} className="glass-card p-6 border-white/10 bg-white/5 text-center flex flex-col items-center gap-2 hover:bg-white/10 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Minus className="h-8 w-8 text-white/40" />
                              <span className="text-3xl font-black text-white">{votingMotion.votesAbstain}</span>
                              <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Abstain</span>
                            </motion.button>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                              Total Votes: {votingMotion.votesFor + votingMotion.votesAgainst + votingMotion.votesAbstain}
                            </div>
                            <motion.button onClick={() => closeVoting(votingMotion.id)} className="px-8 py-3 bg-gold-400 text-diplomatic-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(247,163,28,0.2)]" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              End Procedure
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    )}

                {/* Motions list */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {motions.filter(m => m.status !== 'voting').length === 0 && !votingMotion && (
                    <div className="text-center py-6">
                      <Gavel className="h-8 w-8 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-xs uppercase tracking-widest font-bold">No motions yet</p>
                    </div>
                  )}
                  {motions.filter(m => m.status !== 'voting').map(m => (
                    <div key={m.id} className="flex items-center gap-3 glass-panel p-3 rounded-xl border-white/5 bg-white/5">
                      <div className={`w-2 h-2 rounded-full ${m.status === 'passed' ? 'bg-emerald-400' : m.status === 'failed' ? 'bg-red-400' : 'bg-white/20'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{m.description}</p>
                        <p className="text-white/30 text-[10px] uppercase tracking-wider">{m.proposerName} {m.proposerCountry && `• ${m.proposerCountry}`}</p>
                      </div>
                      {m.status === 'passed' && <span className="text-emerald-400 text-xs font-bold">PASSED ({m.votesFor}-{m.votesAgainst}-{m.votesAbstain})</span>}
                      {m.status === 'failed' && <span className="text-red-400 text-xs font-bold">FAILED ({m.votesFor}-{m.votesAgainst}-{m.votesAbstain})</span>}
                      {m.status === 'proposed' && (
                        <button onClick={() => openVoting(m.id)} className="px-3 py-1 bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400/30 transition-all">
                          Open Vote
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

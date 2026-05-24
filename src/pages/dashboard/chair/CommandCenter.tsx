import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Play, Pause, RotateCcw, SkipForward, UserPlus, X, Gavel, Vote,
  Users, Mic, MicOff, Radio, Check, Zap, Activity, GripVertical,
  Search, CheckCircle2, ChevronRight, Trophy, ClipboardList,
  AlertCircle, Minus,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useMunCommand } from '@/hooks/useMunCommand';
import type { SessionMode, MotionType } from '@/types/munCommand';
import { SESSION_MODE_LABELS, MOTION_TYPE_LABELS } from '@/types/munCommand';
import type { Tables } from '@/integrations/supabase/types';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.4);
  } catch (_) {}
}

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const iv = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

const MODE_SHORT: Record<SessionMode, string> = {
  gsl: 'GSL',
  moderated_caucus: 'Mod. Caucus',
  unmoderated_caucus: 'Unmod. Caucus',
  voting: 'Voting',
  roll_call: 'Roll Call',
  suspension: 'Suspension',
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CommandCenter() {
  const context = useOutletContext<any>();
  const committees: Tables<'committees'>[] = context?.committees || [];
  const applications: Tables<'applications'>[] = context?.applications || [];
  const committeeId = committees[0]?.id ?? '';
  const committeeName = (committees[0] as any)?.name ?? 'Committee';
  const committeeTopic = (committees[0] as any)?.topic ?? '';

  const {
    session, speakers, loading, currentSpeaker, waitingSpeakers, doneSpeakers,
    motions, activeMotion, votes, attendance, markAttendance, logs,
    createSession, setMode, startTimer, pauseTimer, resumeTimer, resetTimer,
    addSpeaker, nextSpeaker, removeSpeaker, openVoting, closeVoting, loadVotes,
    yieldTo, proposeMotion, updateSession,
  } = useMunCommand({ committeeId, isChair: true });

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);
  const [showNewMotion, setShowNewMotion] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Add speaker form
  const [addMode, setAddMode] = useState<'list' | 'manual'>('list');
  const [speakerSearch, setSpeakerSearch] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [speakerTime, setSpeakerTime] = useState(60);

  // Custom timer
  const [customMins, setCustomMins] = useState(1);
  const [customSecs, setCustomSecs] = useState(30);

  // Unmod caucus topic
  const [unmodTopic, setUnmodTopic] = useState('');

  // Motion form
  const [motionProposerName, setMotionProposerName] = useState('');
  const [motionProposerCountry, setMotionProposerCountry] = useState('');
  const [motionType, setMotionType] = useState<MotionType>('moderated_caucus');
  const [motionDesc, setMotionDesc] = useState('');
  const [motionSpeakingTime, setMotionSpeakingTime] = useState(60);
  const [motionTotalTime, setMotionTotalTime] = useState(600);

  // Drag reorder
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Sound on timer zero ──────────────────────────────────────────────────────
  const prevRemaining = useRef(0);
  useEffect(() => {
    const rem = session?.timer_remaining ?? 0;
    if (prevRemaining.current > 0 && rem === 0) playBeep();
    prevRemaining.current = rem;
  }, [session?.timer_remaining]);

  // ── Load votes when voting ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeMotion?.status === 'voting') loadVotes(activeMotion.id);
  }, [activeMotion?.id, activeMotion?.status]); // eslint-disable-line

  // ── Derived ─────────────────────────────────────────────────────────────────
  const timerPct = session && session.timer_duration > 0
    ? (session.timer_remaining / session.timer_duration) * 100 : 0;
  const rem = session?.timer_remaining ?? 0;
  const timerColor = rem <= 10 ? 'text-red-400' : rem <= 30 ? 'text-amber-400' : 'text-emerald-400';
  const timerBarColor = rem <= 10 ? '#f87171' : rem <= 30 ? '#fbbf24' : '#34d399';

  const queuedIds = new Set(speakers.filter(s => s.status !== 'done').map(s => s.application_id));
  const filteredDelegates = applications.filter(app =>
    !queuedIds.has(app.id) &&
    (!speakerSearch ||
      app.full_name.toLowerCase().includes(speakerSearch.toLowerCase()) ||
      (app.country ?? '').toLowerCase().includes(speakerSearch.toLowerCase()))
  );

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const quorum = Math.ceil(applications.length / 2);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddFromList = async (app: Tables<'applications'>) => {
    await addSpeaker(app.id, app.full_name, app.country ?? '', speakerTime);
    setShowAddSpeaker(false);
    setSpeakerSearch('');
  };

  const handleAddManual = async () => {
    if (!manualName.trim() || !session) return;
    await (supabase.from('speakers_list') as any).insert({
      session_id: session.id,
      application_id: null,
      delegate_name: manualName.trim(),
      delegate_country: manualCountry.trim() || null,
      position: speakers.length,
      speaking_time: speakerTime,
    });
    setManualName(''); setManualCountry('');
    setShowAddSpeaker(false);
  };

  const handleProposeMotion = async () => {
    if (!motionProposerName.trim() || !motionDesc.trim()) return;
    await proposeMotion(
      '', motionProposerName, motionProposerCountry,
      motionType, motionDesc, motionSpeakingTime, motionTotalTime
    );
    setMotionProposerName(''); setMotionProposerCountry(''); setMotionDesc('');
    setShowNewMotion(false);
  };

  const handleCustomTimer = () => {
    const total = customMins * 60 + customSecs;
    if (total > 0) startTimer(total);
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); setDragOverId(id);
  };
  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const di = waitingSpeakers.findIndex(s => s.id === draggedId);
    const ti = waitingSpeakers.findIndex(s => s.id === targetId);
    if (di === -1 || ti === -1) return;
    const newOrder = [...waitingSpeakers];
    const [removed] = newOrder.splice(di, 1);
    newOrder.splice(ti, 0, removed);
    await Promise.all(newOrder.map((s, idx) =>
      (supabase.from('speakers_list') as any).update({ position: idx }).eq('id', s.id)
    ));
    setDraggedId(null); setDragOverId(null);
  };

  const handleEndSession = async () => {
    await updateSession({ status: 'ended', timer_running: false } as any);
    setShowSummary(true);
  };

  // ── Guard screens ────────────────────────────────────────────────────────────
  if (!committeeId) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <Gavel className="h-16 w-16 text-white/10 mx-auto mb-4" />
        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">No committee assigned</p>
        <p className="text-white/20 text-xs mt-2">Ask an admin to assign you to a committee.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Activity className="h-8 w-8 text-gold-400 animate-spin mx-auto" />
    </div>
  );

  if (!session) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="w-24 h-24 bg-gradient-to-br from-gold-400/20 to-gold-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gold-400/30">
          <Gavel className="h-12 w-12 text-gold-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">MUN Command</h2>
        <p className="text-white/40 text-sm mb-2 font-semibold">{committeeName}</p>
        {committeeTopic && <p className="text-white/30 text-xs mb-8 italic">"{committeeTopic}"</p>}
        <p className="text-white/50 mb-8 text-sm">Launch a live committee session to manage speakers, motions, and voting in real-time.</p>
        <motion.button
          onClick={createSession}
          className="bg-gold-400 hover:bg-gold-500 text-diplomatic-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(247,163,28,0.3)] transition-all"
          whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
        >
          <Zap className="h-4 w-4 inline mr-2" />
          Start Session
        </motion.button>
      </motion.div>
    </div>
  );

  // ── Session Summary Overlay ──────────────────────────────────────────────────
  if (showSummary) return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-[80vh] flex items-center justify-center"
    >
      <div className="glass-card p-10 border border-white/15 max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-400/20 to-gold-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gold-400/30">
            <Trophy className="h-10 w-10 text-gold-400" />
          </div>
          <h2 className="text-3xl font-display font-black text-white mb-1">Session Complete</h2>
          <p className="text-white/40 text-sm">{committeeName} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Delegates Present', value: presentCount, sub: `/ ${applications.length} total` },
            { label: 'Speakers', value: doneSpeakers.length, sub: 'spoke this session' },
            { label: 'Motions', value: motions.filter(m => m.status === 'passed').length, sub: `/ ${motions.length} proposed` },
          ].map(stat => (
            <div key={stat.label} className="glass-panel p-5 rounded-2xl text-center border-white/5">
              <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-tight">{stat.label}</p>
              <p className="text-white/20 text-[9px] mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {doneSpeakers.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <ClipboardList className="h-3 w-3" /> Speakers Record
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {doneSpeakers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <span className="text-white/20 text-xs w-5 text-right">{i + 1}.</span>
                  <span className="text-white text-sm font-medium flex-1">{s.delegate_name}</span>
                  <span className="text-white/40 text-xs">{s.delegate_country}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {motions.length > 0 && (
          <div className="mb-8">
            <h4 className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Gavel className="h-3 w-3" /> Motions Summary
            </h4>
            <div className="space-y-2">
              {motions.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'passed' ? 'bg-emerald-400' : m.status === 'failed' ? 'bg-red-400' : 'bg-white/20'}`} />
                  <span className="text-white/70 text-sm flex-1 truncate">{m.description}</span>
                  <span className={`text-xs font-bold uppercase ${m.status === 'passed' ? 'text-emerald-400' : m.status === 'failed' ? 'text-red-400' : 'text-white/30'}`}>
                    {m.status === 'passed' || m.status === 'failed' ? `${m.status} (${m.votes_for}-${m.votes_against}-${m.votes_abstain})` : m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={createSession}
            className="bg-gold-400 hover:bg-gold-500 text-diplomatic-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            New Session
          </motion.button>
          <button
            onClick={() => setShowSummary(false)}
            className="px-6 py-3 rounded-xl text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
          >
            Review Session
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ── Main Command Center ──────────────────────────────────────────────────────
  return (
    <motion.div className="space-y-5" variants={cv} initial="hidden" animate="visible">

      {/* ── Session Status Bar ─────────────────────────────────────────────── */}
      <motion.div variants={iv} className="glass-card p-4 border border-white/15 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <Radio className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-widest hidden sm:inline">{committeeName}</span>
          <span className="text-white/20 mx-1 hidden sm:inline">•</span>
          <span className="text-gold-400 font-bold text-xs uppercase tracking-widest">{SESSION_MODE_LABELS[session.current_mode]}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MODE_SHORT) as SessionMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                session.current_mode === m
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent'
              }`}
            >
              {MODE_SHORT[m]}
            </button>
          ))}
        </div>

        <button
          onClick={handleEndSession}
          className="text-white/30 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-transparent hover:border-red-400/20"
        >
          <X className="h-3.5 w-3.5" /> End Session
        </button>
      </motion.div>

      {/* ── Roll Call Mode ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {session.current_mode === 'roll_call' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="glass-card p-8 border-gold-400/20 bg-gold-400/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5"><Users size={180} className="text-gold-400" /></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-gold-400 text-xl font-display font-black uppercase tracking-widest mb-1">Roll Call</h3>
                  <p className="text-white/40 text-xs">Click each delegate card to mark them present.</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-emerald-400 text-2xl font-black">{presentCount}</p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gold-400 text-2xl font-black">{quorum}</p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Quorum</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-black ${presentCount >= quorum ? 'text-emerald-400' : 'text-red-400'}`}>
                      {presentCount >= quorum ? '✓' : '✗'}
                    </p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Quorum Met</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                {applications.map(app => {
                  const att = attendance.find(a => a.application_id === app.id);
                  const isPresent = att?.status === 'present';
                  return (
                    <div
                      key={app.id}
                      onClick={() => markAttendance(app.id, isPresent ? 'absent' : 'present')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isPresent
                          ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/30 font-bold uppercase truncate max-w-[80%]">{app.country}</span>
                        {isPresent && <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <p className={`text-xs font-bold truncate ${isPresent ? 'text-white' : 'text-white/40'}`}>{app.full_name}</p>
                    </div>
                  );
                })}
                {applications.length === 0 && (
                  <div className="col-span-full text-center py-8 text-white/20 text-xs">
                    No delegates assigned to this committee yet.
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setMode('gsl')}
                  className="bg-gold-400 hover:bg-gold-500 text-diplomatic-950 px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
                >
                  Confirm Attendance &amp; Start GSL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unmoderated Caucus Banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {session.current_mode === 'unmoderated_caucus' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 border-blue-400/20 bg-blue-400/5"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">Unmoderated Caucus</p>
                <h4 className="text-white text-xl font-black">Informal Consultation Period</h4>
                <input
                  type="text"
                  value={unmodTopic}
                  onChange={e => setUnmodTopic(e.target.value)}
                  placeholder="Topic / purpose of caucus..."
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/40"
                />
              </div>
              <div className={`text-6xl font-mono font-black ${timerColor} text-center`}>
                {formatTime(session.timer_remaining)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Grid: Timer + Speakers ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Timer Panel */}
        <motion.div variants={iv} className="lg:col-span-5">
          <div className="glass-card p-8 border border-white/15 h-full flex flex-col">
            <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-center">Session Timer</h3>

            {/* Circular Timer */}
            <div className="relative w-56 h-56 mx-auto mb-8 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-white/5" />
                <motion.circle
                  cx="112" cy="112" r="104"
                  stroke={timerBarColor}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="653"
                  strokeLinecap="round"
                  animate={{ strokeDashoffset: 653 - (653 * timerPct) / 100 }}
                  transition={{ duration: 0.8, ease: 'linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-mono font-black ${timerColor} tracking-tighter`}>
                  {formatTime(session.timer_remaining)}
                </span>
                <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest mt-1">
                  {session.timer_running ? '● Running' : '◼ Paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {!session.timer_running ? (
                <motion.button onClick={resumeTimer} className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                  <Play className="h-7 w-7 ml-0.5" />
                </motion.button>
              ) : (
                <motion.button onClick={pauseTimer} className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                  <Pause className="h-7 w-7" />
                </motion.button>
              )}
              <motion.button onClick={resetTimer} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <RotateCcw className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[30, 60, 90, 120, 180, 300, 420, 600].map(sec => (
                <button key={sec} onClick={() => startTimer(sec)} className="py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-[10px] font-bold transition-all">
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                </button>
              ))}
            </div>

            {/* Custom Timer */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 p-3">
              <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Custom</span>
              <input type="number" min={0} max={99} value={customMins} onChange={e => setCustomMins(parseInt(e.target.value) || 0)}
                className="w-12 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center text-sm font-bold focus:outline-none focus:border-gold-400/40" />
              <span className="text-white/20 font-bold">:</span>
              <input type="number" min={0} max={59} value={customSecs} onChange={e => setCustomSecs(parseInt(e.target.value) || 0)}
                className="w-12 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center text-sm font-bold focus:outline-none focus:border-gold-400/40" />
              <button onClick={handleCustomTimer} className="flex-1 py-1.5 rounded-lg bg-gold-400/20 border border-gold-400/30 text-gold-400 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400/30 transition-all">
                Set
              </button>
            </div>
          </div>
        </motion.div>

        {/* Speakers Panel */}
        <motion.div variants={iv} className="lg:col-span-7 flex flex-col gap-5">
          <div className="glass-card p-6 border border-white/15 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
                Live Podium <span className="text-gold-400 ml-2">{waitingSpeakers.length} waiting</span>
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowAddSpeaker(s => !s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/20 border border-gold-400/30 text-gold-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400/30 transition-all">
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </button>
                <button onClick={nextSpeaker} disabled={waitingSpeakers.length === 0 && !currentSpeaker} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-all disabled:opacity-30">
                  <SkipForward className="h-3.5 w-3.5" /> Next
                </button>
              </div>
            </div>

            {/* Add Speaker Slide-down */}
            <AnimatePresence>
              {showAddSpeaker && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mb-5 bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      <button onClick={() => setAddMode('list')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${addMode === 'list' ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30' : 'text-white/30 hover:text-white/60 bg-white/5 border border-white/10'}`}>
                        From Delegate List
                      </button>
                      <button onClick={() => setAddMode('manual')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${addMode === 'manual' ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30' : 'text-white/30 hover:text-white/60 bg-white/5 border border-white/10'}`}>
                        Manual Entry
                      </button>
                    </div>

                    {/* Speaking time */}
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Speaking time:</span>
                      {[30, 60, 90, 120].map(t => (
                        <button key={t} onClick={() => setSpeakerTime(t)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${speakerTime === t ? 'bg-gold-400 text-diplomatic-950' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                          {t >= 60 ? `${t/60}m` : `${t}s`}
                        </button>
                      ))}
                      <input type="number" min={10} max={600} value={speakerTime} onChange={e => setSpeakerTime(parseInt(e.target.value) || 60)}
                        className="w-16 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-center text-xs font-bold focus:outline-none" />
                      <span className="text-white/20 text-[9px]">sec</span>
                    </div>

                    {addMode === 'list' ? (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                          <input
                            type="text" placeholder="Search delegates..." value={speakerSearch}
                            onChange={e => setSpeakerSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-400/30"
                          />
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {filteredDelegates.length === 0 ? (
                            <p className="text-white/20 text-xs text-center py-6">
                              {applications.length === 0 ? 'No delegates assigned to this committee.' : 'All delegates are already in queue.'}
                            </p>
                          ) : (
                            filteredDelegates.map(app => (
                              <button key={app.id} onClick={() => handleAddFromList(app)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-gold-400/10 hover:border-gold-400/20 transition-all text-left group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold text-sm truncate">{app.full_name}</p>
                                  <p className="text-white/30 text-[10px] uppercase tracking-wider">{app.country}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-gold-400 transition-colors" />
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Delegate name" value={manualName} onChange={e => setManualName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                            className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-400/30" />
                          <input type="text" placeholder="Country (optional)" value={manualCountry} onChange={e => setManualCountry(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                            className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-400/30" />
                        </div>
                        <button onClick={handleAddManual} disabled={!manualName.trim()}
                          className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-all disabled:opacity-30">
                          Add to Queue
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current Speaker */}
            {currentSpeaker ? (
              <div className="glass-panel p-5 rounded-2xl border-emerald-500/20 bg-emerald-500/5 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Mic size={70} className="text-emerald-400" /></div>
                <div className="flex items-center gap-4 relative z-10 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                    <Mic className="h-7 w-7 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Floor is Open</p>
                    <h4 className="text-white text-xl font-black">{currentSpeaker.delegate_name}</h4>
                    <p className="text-white/40 text-sm">{currentSpeaker.delegate_country}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  {(['chair', 'questions', 'delegate'] as const).map(type => (
                    <button key={type} onClick={() => yieldTo(type)}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        session.yield_type === type
                          ? 'bg-gold-400 text-diplomatic-950 border-gold-400 shadow-[0_0_15px_rgba(247,163,28,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Yield to {type === 'questions' ? 'Q&A' : type}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/5 rounded-2xl mb-5">
                <MicOff className="h-10 w-10 text-white/10 mb-3" />
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Podium is Empty</p>
              </div>
            )}

            {/* Speaker Queue — draggable */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-64">
              {waitingSpeakers.length === 0 && (
                <p className="text-white/20 text-[10px] text-center py-4 font-bold uppercase tracking-widest">No speakers in queue</p>
              )}
              {waitingSpeakers.map((s, idx) => (
                <motion.div
                  key={s.id}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(s.id)}
                  onDragOver={e => handleDragOver(e, s.id)}
                  onDrop={() => handleDrop(s.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-grab active:cursor-grabbing ${
                    dragOverId === s.id && draggedId !== s.id
                      ? 'border-gold-400/40 bg-gold-400/10'
                      : draggedId === s.id
                        ? 'opacity-40 border-white/20 bg-white/5'
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-white/15 group-hover:text-white/30 flex-shrink-0" />
                  <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 border border-white/10">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{s.delegate_name}</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider">{s.delegate_country}</p>
                  </div>
                  <span className="text-white/20 font-mono text-xs">{formatTime(s.speaking_time)}</span>
                  <button onClick={() => removeSpeaker(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400/50 hover:text-red-400 transition-all">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>

            {doneSpeakers.length > 0 && (
              <p className="mt-3 pt-3 border-t border-white/5 text-white/20 text-[9px] font-bold uppercase tracking-widest">
                {doneSpeakers.length} delegate{doneSpeakers.length !== 1 ? 's' : ''} have spoken
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom: Motions + Log ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Motions Panel */}
        <motion.div variants={iv} className="lg:col-span-8">
          <div className="glass-card p-6 border border-white/15">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Motions &amp; Voting</h3>
              <button
                onClick={() => setShowNewMotion(s => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-diplomatic-400/20 border border-diplomatic-400/30 text-diplomatic-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-diplomatic-400/30 transition-all"
              >
                <Gavel className="h-3.5 w-3.5" /> {showNewMotion ? 'Cancel' : 'New Motion'}
              </button>
            </div>

            {/* New Motion Form */}
            <AnimatePresence>
              {showNewMotion && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mb-6 bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Proposer name *" value={motionProposerName} onChange={e => setMotionProposerName(e.target.value)}
                        className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-diplomatic-400/40" />
                      <input type="text" placeholder="Country" value={motionProposerCountry} onChange={e => setMotionProposerCountry(e.target.value)}
                        className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-diplomatic-400/40" />
                    </div>

                    <select value={motionType} onChange={e => setMotionType(e.target.value as MotionType)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-diplomatic-400/40">
                      {Object.entries(MOTION_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-diplomatic-900">{v}</option>
                      ))}
                    </select>

                    <input type="text" placeholder="Motion description *" value={motionDesc} onChange={e => setMotionDesc(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleProposeMotion()}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-diplomatic-400/40" />

                    {(motionType === 'moderated_caucus') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-white/30 text-[9px] font-bold uppercase tracking-widest block mb-1.5">Total Caucus Time (sec)</label>
                          <input type="number" min={60} max={3600} value={motionTotalTime} onChange={e => setMotionTotalTime(parseInt(e.target.value) || 600)}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-white/30 text-[9px] font-bold uppercase tracking-widest block mb-1.5">Per Speaker Time (sec)</label>
                          <input type="number" min={10} max={600} value={motionSpeakingTime} onChange={e => setMotionSpeakingTime(parseInt(e.target.value) || 60)}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none" />
                        </div>
                      </div>
                    )}

                    <button onClick={handleProposeMotion} disabled={!motionProposerName.trim() || !motionDesc.trim()}
                      className="w-full py-2.5 bg-diplomatic-400/20 text-diplomatic-400 border border-diplomatic-400/30 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-diplomatic-400/30 transition-all disabled:opacity-30">
                      Submit Motion
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Voting */}
            <AnimatePresence>
              {activeMotion?.status === 'voting' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
                  <div className="glass-panel p-6 rounded-3xl border-gold-400/30 bg-gold-400/5 shadow-[0_0_40px_rgba(247,163,28,0.05)]">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gold-400/20 flex items-center justify-center border border-gold-400/30">
                        <Vote className="h-6 w-6 text-gold-400" />
                      </div>
                      <div>
                        <span className="text-gold-400 text-[9px] font-black uppercase tracking-widest animate-pulse">● Active Voting Procedure</span>
                        <h4 className="text-white text-lg font-black">{activeMotion.description}</h4>
                        <p className="text-white/40 text-xs">by {activeMotion.proposer_name} ({activeMotion.proposer_country})</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { label: 'In Favor', count: votes.filter(v => v.vote === 'for').length, color: 'emerald' },
                        { label: 'Against', count: votes.filter(v => v.vote === 'against').length, color: 'red' },
                        { label: 'Abstain', count: votes.filter(v => v.vote === 'abstain').length, color: 'white' },
                      ].map(({ label, count, color }) => (
                        <div key={label} className={`text-center p-4 rounded-2xl bg-${color}-500/5 border border-${color}-500/20`}>
                          <p className={`text-4xl font-black text-${color === 'white' ? 'white/50' : `${color}-400`} mb-1`}>{count}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-widest text-${color === 'white' ? 'white/30' : `${color}-400/60`}`}>{label}</p>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => closeVoting(activeMotion.id)}
                      className="w-full py-3 bg-white text-diplomatic-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] transition-all">
                      Finalize Voting Result
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Motions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {motions.filter(m => m.status !== 'voting').length === 0 && !activeMotion && (
                <div className="text-center py-8">
                  <Gavel className="h-8 w-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No motions yet</p>
                </div>
              )}
              {motions.filter(m => m.status !== 'voting').map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    m.status === 'passed' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' :
                    m.status === 'failed' ? 'bg-red-400' : 'bg-white/20'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{m.description}</p>
                    <p className="text-white/30 text-[9px] uppercase tracking-wider font-bold">{MOTION_TYPE_LABELS[m.motion_type]} · {m.proposer_country}</p>
                  </div>
                  {m.status === 'proposed' && (
                    <button onClick={() => openVoting(m.id)}
                      className="px-3 py-1.5 bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gold-400 hover:text-diplomatic-950 transition-all">
                      Open Vote
                    </button>
                  )}
                  {(m.status === 'passed' || m.status === 'failed') && (
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-black uppercase ${m.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>{m.status}</p>
                      <p className="text-[10px] text-white/20 font-mono">{m.votes_for}-{m.votes_against}-{m.votes_abstain}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div variants={iv} className="lg:col-span-4">
          <div className="glass-card p-6 border border-white/15 h-full flex flex-col">
            <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <Activity className="h-3 w-3" /> Session Log
            </h3>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[400px]">
              {logs.length === 0 && (
                <p className="text-white/10 text-xs text-center py-8 italic">Activity will appear here...</p>
              )}
              {logs.map(log => (
                <div key={log.id} className="relative pl-5 pb-3 last:pb-0 border-l border-white/5">
                  <div className="absolute left-[-4px] top-0.5 w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                  <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest mb-0.5">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <p className="text-white/60 text-xs leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

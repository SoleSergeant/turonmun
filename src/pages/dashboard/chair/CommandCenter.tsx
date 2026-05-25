import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getCountryCode } from '@/utils/countryCodes';
import {
  Play, Pause, RotateCcw, SkipForward, UserPlus, X, Gavel, Vote,
  Users, Mic, MicOff, Radio, Check, Zap, Activity, GripVertical,
  Search, CheckCircle2, ChevronRight, Trophy, ClipboardList,
  AlertCircle, Minus, Maximize2, Minimize2,
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
    addSpeaker, nextSpeaker, removeSpeaker, openVoting, resolveMotion, loadVotes,
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
  const [speakerTime, setSpeakerTime] = useState('60');

  // Custom timer
  const [customMins, setCustomMins] = useState(1);
  const [customSecs, setCustomSecs] = useState(30);

  // Unmod caucus topic
  const [unmodTopic, setUnmodTopic] = useState('');
  const [unmodFullscreen, setUnmodFullscreen] = useState(false);

  // Motion form
  const [motionProposerCountry, setMotionProposerCountry] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [motionType, setMotionType] = useState<MotionType>('moderated_caucus');
  const [motionDesc, setMotionDesc] = useState('');
  const [motionSpeakingTime, setMotionSpeakingTime] = useState('60');
  const [motionTotalTime, setMotionTotalTime] = useState('600');

  // MUN-assigned countries (applicationId → country name from country_assignments table)
  const [assignedCountries, setAssignedCountries] = useState<Record<string, string>>({});

  // Drag reorder
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Load MUN-assigned countries from country_assignments (live) ─────────────
  useEffect(() => {
    if (!committeeId) return;

    const loadCountries = () => {
      (supabase.from('country_assignments') as any)
        .select('application_id, country_name')
        .eq('committee_id', committeeId)
        .then(({ data }: { data: any[] | null }) => {
          if (!data) return;
          const map: Record<string, string> = {};
          data.forEach((r: any) => {
            if (r.application_id && (r.country_name || r.country)) {
              map[r.application_id] = r.country_name || r.country;
            }
          });
          setAssignedCountries(map);
        });
    };

    loadCountries();

    // Stay in sync if admin assigns/changes countries while session is live
    const channel = supabase
      .channel(`country-assignments-${committeeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'country_assignments',
        filter: `committee_id=eq.${committeeId}`,
      }, () => { loadCountries(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [committeeId]); // eslint-disable-line

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

  // ── Sync unmod topic from session when mode switches ────────────────────────
  useEffect(() => {
    if (session?.current_mode === 'unmoderated_caucus' && session.current_topic) {
      setUnmodTopic(session.current_topic);
    }
  }, [session?.current_mode, session?.current_topic]); // eslint-disable-line

  // ── Derived ─────────────────────────────────────────────────────────────────
  const timerPct = session && session.timer_duration > 0
    ? (session.timer_remaining / session.timer_duration) * 100 : 0;
  const rem = session?.timer_remaining ?? 0;
  const timerColor = rem <= 10 ? 'text-red-400' : rem <= 30 ? 'text-amber-400' : 'text-emerald-400';
  const timerBarColor = rem <= 10 ? '#f87171' : rem <= 30 ? '#fbbf24' : '#34d399';

  const queuedIds = new Set(speakers.filter(s => s.status !== 'done').map(s => s.application_id));
  const filteredDelegates = applications.filter(app => {
    if (queuedIds.has(app.id)) return false;
    // Hide delegates explicitly marked absent in roll call
    const att = attendance.find(a => a.application_id === app.id);
    if (att?.status === 'absent') return false;
    if (speakerSearch) {
      const assigned = assignedCountries[app.id] || app.country || '';
      return (
        app.full_name.toLowerCase().includes(speakerSearch.toLowerCase()) ||
        assigned.toLowerCase().includes(speakerSearch.toLowerCase())
      );
    }
    return true;
  });

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const quorum = Math.ceil(applications.length / 2);

  // Returns the MUN-assigned country for a delegate, falling back to their residential country
  const getAssignedCountry = (app: Tables<'applications'>) =>
    assignedCountries[app.id] || app.country || '';

  // Sorted list of unique assigned country names (for the motion proposer dropdown)
  const assignedCountryNames = [...new Set(Object.values(assignedCountries))].sort();

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddFromList = async (app: Tables<'applications'>) => {
    await addSpeaker(app.id, app.full_name, getAssignedCountry(app), parseInt(speakerTime) || 60);
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
      speaking_time: parseInt(speakerTime) || 60,
    });
    setManualName(''); setManualCountry('');
    setShowAddSpeaker(false);
  };

  const handleProposeMotion = async () => {
    if (!motionProposerCountry.trim()) return;
    // Unmod doesn't need a description — auto-label it
    const descToSubmit = motionType === 'unmoderated_caucus'
      ? (motionDesc.trim() || 'Unmoderated Caucus')
      : motionDesc.trim();
    if (motionType !== 'unmoderated_caucus' && !descToSubmit) return;
    const newMotion = await proposeMotion(
      '', motionProposerCountry, motionProposerCountry,
      motionType, descToSubmit,
      parseInt(motionSpeakingTime) || 60,
      parseInt(motionTotalTime) || 600,
    );
    setMotionProposerCountry(''); setMotionDesc('');
    setShowNewMotion(false);
    // Immediately open voting so the chair can see the voting panel right away
    if (newMotion?.id) await openVoting(newMotion.id);
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

  // ── Roll Call helpers ────────────────────────────────────────────────────────
  const getRollStatus = (appId: string): 'PV' | 'P' | 'A' => {
    const att = attendance.find(a => a.application_id === appId);
    if (!att || att.status === 'absent') return 'A';
    return att.is_voting ? 'PV' : 'P';
  };

  const handleRollStatus = (appId: string, type: 'PV' | 'P' | 'A') => {
    if (type === 'PV') markAttendance(appId, 'present', true);
    else if (type === 'P') markAttendance(appId, 'present', false);
    else markAttendance(appId, 'absent', false);
  };

  const handleSetAll = (type: 'PV' | 'A') => {
    applications.forEach(app => handleRollStatus(app.id, type));
  };

  const pvCount = attendance.filter(a => a.status === 'present' && a.is_voting).length;
  const pCount  = attendance.filter(a => a.status === 'present' && !a.is_voting).length;

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
                  <span className="text-white text-sm font-medium flex-1">{s.delegate_country || s.delegate_name}</span>
                  <span className="text-white/40 text-xs">{s.delegate_country ? s.delegate_name : ''}</span>
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
            onClick={async () => { await createSession(); setShowSummary(false); }}
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <Radio className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-sm uppercase tracking-widest hidden sm:inline">{committeeName}</span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="text-gold-400 font-bold text-xs uppercase tracking-widest">{SESSION_MODE_LABELS[session.current_mode]}</span>
            </div>
            {session.current_topic && (
              <p className="text-white/55 text-xs font-medium mt-0.5 hidden sm:block truncate max-w-lg">{session.current_topic}</p>
            )}
          </div>
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

      {/* ── Roll Call Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {session.current_mode === 'roll_call' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Roll Call</h3>
                <button onClick={() => setMode('gsl')} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-10 py-4 border-b border-gray-100">
                {/* PV */}
                <div className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" fill="#0f766e" />
                  </svg>
                  <span className="text-gray-600 text-sm font-medium">{pvCount}</span>
                </div>
                {/* P */}
                <div className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" fill="none" stroke="#0f766e" strokeWidth="2" />
                    <path d="M11 1 A10 10 0 0 1 11 21 Z" fill="#0f766e" />
                  </svg>
                  <span className="text-gray-600 text-sm font-medium">{pCount}</span>
                </div>
                {/* A */}
                <div className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" fill="none" stroke="#0f766e" strokeWidth="2" />
                    <path d="M11 1 A10 10 0 0 1 16 19 Z" fill="#0f766e" />
                  </svg>
                  <span className="text-gray-600 text-sm font-medium">
                    {applications.length - pvCount - pCount}
                  </span>
                </div>
              </div>

              {/* Bulk actions */}
              <div className="flex gap-3 px-5 py-3 border-b border-gray-100">
                <button
                  onClick={() => handleSetAll('PV')}
                  className="flex-1 py-2 rounded-full border border-teal-600 text-teal-700 text-xs font-semibold uppercase tracking-wider hover:bg-teal-50 transition-colors"
                >
                  Set All Present
                </button>
                <button
                  onClick={() => handleSetAll('A')}
                  className="flex-1 py-2 rounded-full border border-teal-600 text-teal-700 text-xs font-semibold uppercase tracking-wider hover:bg-teal-50 transition-colors"
                >
                  Set All Absent
                </button>
              </div>

              {/* Delegate list */}
              <div className="overflow-y-auto flex-1">
                {applications.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No delegates assigned to this committee yet.
                  </div>
                ) : (
                  applications.map(app => {
                    const status = getRollStatus(app.id);
                    const munCountry = getAssignedCountry(app);
                    const code = getCountryCode(munCountry || (app.country ?? '')).toLowerCase();
                    return (
                      <div key={app.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
                        <img
                          src={`https://flagcdn.com/24x18/${code}.png`}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          alt=""
                          className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
                        />
                        <span className="flex-1 text-sm text-gray-800 font-medium truncate">{munCountry || app.full_name}</span>
                        <div className="flex gap-1">
                          {(['PV', 'P', 'A'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => handleRollStatus(app.id, type)}
                              className={`w-9 h-8 rounded border text-xs font-bold transition-all ${
                                status === type
                                  ? type === 'PV' ? 'bg-teal-50 border-teal-600 text-teal-700'
                                  : type === 'P'  ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                                  :                 'bg-red-50 border-red-500 text-red-600'
                                  : 'border-gray-300 text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Done */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setMode('gsl')}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unmoderated Caucus Banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {session.current_mode === 'unmoderated_caucus' && (
          <>
            {/* Fullscreen overlay */}
            <AnimatePresence>
              {unmodFullscreen && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-diplomatic-950 flex flex-col items-center justify-center gap-8 p-12"
                >
                  <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Unmoderated Caucus</p>
                  <div className={`text-[12rem] font-mono font-black ${timerColor} leading-none tracking-tighter tabular-nums`}>
                    {formatTime(session.timer_remaining)}
                  </div>
                  {/* Timer controls */}
                  <div className="flex items-center gap-4">
                    {!session.timer_running ? (
                      <button onClick={resumeTimer}
                        className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all"
                        title="Start">
                        <Play className="h-8 w-8 ml-1" />
                      </button>
                    ) : (
                      <button onClick={pauseTimer}
                        className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all"
                        title="Pause">
                        <Pause className="h-8 w-8" />
                      </button>
                    )}
                    <button onClick={resetTimer}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all"
                      title="Reset">
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>
                  {unmodTopic && (
                    <p className="text-white/50 text-2xl font-semibold text-center max-w-2xl">{unmodTopic}</p>
                  )}
                  <input
                    type="text"
                    value={unmodTopic}
                    onChange={e => setUnmodTopic(e.target.value)}
                    onBlur={() => updateSession({ current_topic: unmodTopic })}
                    placeholder="Topic / purpose of caucus..."
                    className="w-full max-w-xl bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-base placeholder-white/20 focus:outline-none focus:border-blue-400/40 text-center"
                  />
                  <button
                    onClick={() => setUnmodFullscreen(false)}
                    className="absolute top-6 right-6 p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline banner */}
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
                    onBlur={() => updateSession({ current_topic: unmodTopic })}
                    placeholder="Topic / purpose of caucus..."
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/40"
                  />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`text-6xl font-mono font-black ${timerColor} tabular-nums`}>
                    {formatTime(session.timer_remaining)}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!session.timer_running ? (
                      <button onClick={resumeTimer}
                        className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all"
                        title="Start">
                        <Play className="h-4 w-4 ml-0.5" />
                      </button>
                    ) : (
                      <button onClick={pauseTimer}
                        className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all"
                        title="Pause">
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={resetTimer}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all"
                      title="Reset">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setUnmodFullscreen(true)}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                    title="Fullscreen"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Grid: Timer + Speakers (GSL / Mod only) ──────────────────── */}
      {(session.current_mode === 'gsl' || session.current_mode === 'moderated_caucus') && <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

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
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest text-center">Custom</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Minutes */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-2">
                  <p className="text-white/20 text-[8px] uppercase tracking-widest text-center mb-2">min</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCustomMins(m => Math.max(0, m - 1))}
                      className="w-8 h-8 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-lg font-bold flex items-center justify-center transition-all">−</button>
                    <span className="flex-1 text-center text-white text-3xl font-black tabular-nums">
                      {String(customMins).padStart(2, '0')}
                    </span>
                    <button onClick={() => setCustomMins(m => Math.min(99, m + 1))}
                      className="w-8 h-8 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-lg font-bold flex items-center justify-center transition-all">+</button>
                  </div>
                </div>
                {/* Seconds */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-2">
                  <p className="text-white/20 text-[8px] uppercase tracking-widest text-center mb-2">sec</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCustomSecs(s => Math.max(0, s - 15))}
                      className="w-8 h-8 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-[10px] font-bold flex items-center justify-center transition-all">−15</button>
                    <span className="flex-1 text-center text-white text-3xl font-black tabular-nums">
                      {String(customSecs).padStart(2, '0')}
                    </span>
                    <button onClick={() => setCustomSecs(s => Math.min(59, s + 15))}
                      className="w-8 h-8 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-[10px] font-bold flex items-center justify-center transition-all">+15</button>
                  </div>
                </div>
              </div>
              <button onClick={handleCustomTimer}
                className="w-full py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 text-xs font-black uppercase tracking-widest hover:bg-gold-400/30 transition-all">
                Set Timer
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
                        <button key={t} onClick={() => setSpeakerTime(String(t))} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${parseInt(speakerTime) === t ? 'bg-gold-400 text-diplomatic-950' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                          {t >= 60 ? `${t/60}m` : `${t}s`}
                        </button>
                      ))}
                      <input type="number" min={10} max={600} value={speakerTime} onChange={e => setSpeakerTime(e.target.value)}
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
                                  <p className="text-white font-bold text-sm truncate">{getAssignedCountry(app) || app.full_name}</p>
                                  <p className="text-white/30 text-[10px] uppercase tracking-wider truncate">{app.full_name}</p>
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
                {/* Large flag background */}
                {currentSpeaker.delegate_country && (
                  <img
                    src={`https://flagcdn.com/w320/${getCountryCode(currentSpeaker.delegate_country).toLowerCase()}.png`}
                    alt=""
                    aria-hidden
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    className="absolute right-0 top-0 h-full w-auto object-cover opacity-25 pointer-events-none select-none"
                    style={{ maskImage: 'linear-gradient(to left, black 10%, transparent 75%)', WebkitMaskImage: 'linear-gradient(to left, black 10%, transparent 75%)' }}
                  />
                )}
                <div className="relative z-10 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em]">Floor is Open</p>
                  </div>
                  <h4 className="text-white text-3xl font-black leading-none mb-1">{currentSpeaker.delegate_country || currentSpeaker.delegate_name}</h4>
                  {currentSpeaker.delegate_country && (
                    <p className="text-white/40 text-sm">{currentSpeaker.delegate_name}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  {/* Yield to Chair — immediate, loses remaining time */}
                  <button onClick={() => yieldTo('chair')}
                    className="py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10">
                    Yield to Chair
                  </button>
                  {/* Open to POI — stays, timer keeps running, highlighted when active */}
                  <button onClick={() => yieldTo('questions')}
                    className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                      session.yield_type === 'questions'
                        ? 'bg-gold-400 text-diplomatic-950 border-gold-400 shadow-[0_0_15px_rgba(247,163,28,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                    }`}>
                    Open to POI
                  </button>
                  {/* Yield to Delegate — next speaker gets time + remaining */}
                  <button onClick={() => yieldTo('delegate')}
                    className="py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10">
                    Yield to Delegate
                  </button>
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
                  className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-grab active:cursor-grabbing ${
                    dragOverId === s.id && draggedId !== s.id
                      ? 'border-gold-400/40 bg-gold-400/10'
                      : draggedId === s.id
                        ? 'opacity-40 border-white/20 bg-white/5'
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Country flag background */}
                  {s.delegate_country && (
                    <img
                      src={`https://flagcdn.com/w160/${getCountryCode(s.delegate_country).toLowerCase()}.png`}
                      alt=""
                      aria-hidden
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      className="absolute right-0 top-0 h-full w-auto object-cover opacity-20 pointer-events-none select-none"
                      style={{ maskImage: 'linear-gradient(to left, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)' }}
                    />
                  )}
                  <GripVertical className="h-4 w-4 text-white/15 group-hover:text-white/30 flex-shrink-0 relative z-10" />
                  <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 border border-white/10 relative z-10">{idx + 1}</div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-white font-bold text-sm truncate">{s.delegate_country || s.delegate_name}</p>
                    {s.delegate_country && (
                      <p className="text-white/30 text-[10px] uppercase tracking-wider truncate">{s.delegate_name}</p>
                    )}
                  </div>
                  <button onClick={() => removeSpeaker(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400/50 hover:text-red-400 transition-all relative z-10">
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
      </div>}

      {/* ── Voting mode: Motions ──────────────────────────────────────────── */}
      {session.current_mode === 'voting' && (
        <motion.div variants={iv} className="space-y-4">

          {/* Header bar */}
          <div className="glass-card p-5 border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-diplomatic-400/20 border border-diplomatic-400/30 flex items-center justify-center flex-shrink-0">
                <Vote className="h-4 w-4 text-diplomatic-400" />
              </div>
              <div>
                <h3 className="text-white font-black text-base leading-none">Voting Procedure</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {motions.filter(m => m.status === 'passed' || m.status === 'failed').length} resolved · {motions.length} total
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewMotion(s => !s)}
              className="flex items-center gap-1.5 px-4 py-2 bg-diplomatic-400/20 border border-diplomatic-400/30 text-diplomatic-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-diplomatic-400/30 transition-all"
            >
              <Gavel className="h-3.5 w-3.5" /> {showNewMotion ? 'Cancel' : 'New Motion'}
            </button>
          </div>

          {/* New Motion Form */}
          <AnimatePresence>
            {showNewMotion && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="glass-card p-6 border border-diplomatic-400/20 bg-diplomatic-400/5 space-y-4">
                  <p className="text-diplomatic-300 text-[10px] font-black uppercase tracking-widest">Propose a Motion</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Searchable country combobox */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Proposing country *"
                        value={motionProposerCountry}
                        onChange={e => { setMotionProposerCountry(e.target.value); setShowCountryDropdown(true); }}
                        onFocus={() => setShowCountryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCountryDropdown(false), 150)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-diplomatic-400/40"
                      />
                      {showCountryDropdown && (() => {
                        const filtered = assignedCountryNames.filter(c =>
                          c.toLowerCase().includes(motionProposerCountry.toLowerCase())
                        );
                        return filtered.length > 0 ? (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-diplomatic-900 border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                            {filtered.map(c => (
                              <button
                                key={c}
                                type="button"
                                onMouseDown={() => { setMotionProposerCountry(c); setShowCountryDropdown(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                  motionProposerCountry === c
                                    ? 'bg-diplomatic-400/30 text-white font-bold'
                                    : 'text-white/80 hover:bg-white/10'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <select
                      value={motionType} onChange={e => setMotionType(e.target.value as MotionType)}
                      className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-diplomatic-400/40"
                    >
                      {Object.entries(MOTION_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-diplomatic-900">{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description — hidden for unmoderated caucus (no topic needed) */}
                  {motionType !== 'unmoderated_caucus' && (
                    <input
                      type="text" placeholder="Motion description / topic *"
                      value={motionDesc} onChange={e => setMotionDesc(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleProposeMotion()}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-diplomatic-400/40"
                    />
                  )}

                  {/* Time fields — total for both mod & unmod, per-speaker only for mod */}
                  {(motionType === 'moderated_caucus' || motionType === 'unmoderated_caucus') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/30 text-[9px] font-bold uppercase tracking-widest block mb-1.5">Total Time (sec)</label>
                        <input type="number" min={1} value={motionTotalTime}
                          onChange={e => setMotionTotalTime(e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none" />
                      </div>
                      {motionType === 'moderated_caucus' && (
                        <div>
                          <label className="text-white/30 text-[9px] font-bold uppercase tracking-widest block mb-1.5">Per Speaker (sec)</label>
                          <input type="number" min={1} value={motionSpeakingTime}
                            onChange={e => setMotionSpeakingTime(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none" />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleProposeMotion}
                    disabled={!motionProposerCountry.trim() || (motionType !== 'unmoderated_caucus' && !motionDesc.trim())}
                    className="w-full py-3 bg-diplomatic-400/30 text-diplomatic-300 border border-diplomatic-400/40 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-diplomatic-400/40 transition-all disabled:opacity-30"
                  >
                    Submit &amp; Open for Vote
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Active Motion — Voting Decision ──────────────────────────────── */}
          <AnimatePresence>
            {activeMotion && (activeMotion.status === 'voting' || activeMotion.status === 'proposed') && (
              <motion.div
                key={activeMotion.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="glass-card p-8 border-2 border-gold-400/30 bg-gold-400/5"
              >
                {/* Type badge + live indicator */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 border border-gold-400/30 text-gold-400 text-[10px] font-black uppercase tracking-widest">
                    {MOTION_TYPE_LABELS[activeMotion.motion_type]}
                  </span>
                  <span className="flex items-center gap-1.5 text-gold-300 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 inline-block animate-pulse" />
                    Vote in Progress
                  </span>
                </div>

                {/* Description */}
                <h2 className="text-white text-2xl font-black mb-2 leading-snug">{activeMotion.description}</h2>
                <p className="text-white/40 text-sm mb-4">
                  Proposed by <span className="text-white/70 font-bold">{activeMotion.proposer_country}</span>
                </p>

                {/* Time details */}
                {(activeMotion.total_time || activeMotion.speaking_time) && (
                  <div className="flex items-center gap-3 mb-8">
                    {activeMotion.total_time && (
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                        <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1">Total Time</p>
                        <p className="text-white font-black text-lg font-mono">{formatTime(activeMotion.total_time)}</p>
                      </div>
                    )}
                    {activeMotion.speaking_time && (
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                        <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1">Per Speaker</p>
                        <p className="text-white font-black text-lg font-mono">{formatTime(activeMotion.speaking_time)}</p>
                      </div>
                    )}
                  </div>
                )}
                {!(activeMotion.total_time || activeMotion.speaking_time) && <div className="mb-8" />}

                {/* Pass / Fail decision */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => resolveMotion(activeMotion.id, true)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-500/70 transition-all"
                  >
                    <Check className="h-7 w-7" />
                    <span className="font-black uppercase tracking-widest text-sm">Passes</span>
                  </motion.button>
                  <motion.button
                    onClick={() => resolveMotion(activeMotion.id, false)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-red-500/20 border-2 border-red-500/40 text-red-400 hover:bg-red-500/30 hover:border-red-500/70 transition-all"
                  >
                    <X className="h-7 w-7" />
                    <span className="font-black uppercase tracking-widest text-sm">Fails</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Motion History ───────────────────────────────────────────────── */}
          <div className="glass-card p-6 border border-white/15">
            <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Gavel className="h-3 w-3" /> Motion History
            </h3>
            {motions.filter(m => m.status !== 'voting' && m.status !== 'proposed').length === 0 ? (
              <div className="text-center py-10">
                <Gavel className="h-10 w-10 text-white/5 mx-auto mb-3" />
                <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No resolved motions yet</p>
                <p className="text-white/10 text-[9px] mt-1">Submit a motion and decide its outcome above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {motions.filter(m => m.status !== 'voting' && m.status !== 'proposed').map(m => (
                  <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      m.status === 'passed'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                        : 'bg-red-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{m.description}</p>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider font-bold mt-0.5">
                        {MOTION_TYPE_LABELS[m.motion_type]} · {m.proposer_country}
                      </p>
                    </div>
                    <span className={`text-sm font-black uppercase flex-shrink-0 ${
                      m.status === 'passed' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </motion.div>
      )}

      {/* ── Suspension banner ─────────────────────────────────────────────── */}
      {session.current_mode === 'suspension' && (
        <motion.div variants={iv} className="glass-card p-10 border border-white/10 text-center">
          <p className="text-white/30 text-xs font-black uppercase tracking-widest mb-2">Session</p>
          <h3 className="text-white text-3xl font-black mb-3">Suspended</h3>
          <p className="text-white/30 text-sm">The session is currently suspended. Switch to another mode to resume proceedings.</p>
        </motion.div>
      )}

    </motion.div>
  );
}

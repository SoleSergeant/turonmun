import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  Upload,
  Calendar,
  MapPin,
  Clock,
  User,
  Send,
  Edit3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface PositionPaperRow {
  id?: string;
  application_id: string;
  committee_id: string | null;
  content: string | null;
  file_url?: string | null;
  status: string | null;
  feedback?: string | null;
  score?: number | null;
  chair_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

function MyCommittee() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [positionPaperText, setPositionPaperText] = useState('');
  const [application, setApplication] = useState<Tables<'applications'> | null>(null);
  const [committee, setCommittee] = useState<Tables<'committees'> | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<Tables<'schedule_events'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionPaperRecord, setPositionPaperRecord] = useState<PositionPaperRow | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  console.log('Position Paper state:', { application, committee, positionPaperRecord });

  useEffect(() => {
    const loadCommitteeData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data: app, error } = await (supabase
          .from('applications') as any)
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('MyCommittee - Application:', app, 'Error:', error);

        if (!error && app) {
          setApplication(app);

          if (app.assigned_committee_id) {
            console.log('MyCommittee - Fetching committee with ID:', app.assigned_committee_id);

            const { data: comm, error: commError } = await (supabase
              .from('committees') as any)
              .select('*')
              .eq('id', app.assigned_committee_id)
              .single();

            console.log('MyCommittee - Committee data:', comm, 'Error:', commError);

            if (comm) setCommittee(comm);

            const { data: events } = await supabase
              .from('schedule_events')
              .select('*')
              .eq('committee_id', app.assigned_committee_id)
              .order('event_date', { ascending: true })
              .order('start_time', { ascending: true });
            setScheduleEvents(events || []);

            const { data: paper, error: paperError } = await (supabase
              .from('position_papers') as any)
              .select('*')
              .eq('application_id', app.id)
              .eq('committee_id', app.assigned_committee_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            console.log('MyCommittee - Position Paper:', paper, 'Error:', paperError);

            if (paper) {
              setPositionPaperRecord(paper as PositionPaperRow);
              setPositionPaperText(paper.content || '');
            }
          } else {
            console.warn('MyCommittee - No committee assigned to this application yet');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadCommitteeData();
  }, [user]);

  const committeeName = committee?.name || 'Committee not assigned yet';
  const committeeAbbr = committee?.abbreviation || '';
  const committeeDescription = committee?.description || 'Once your committee is assigned, details will appear here.';
  const topics = committee?.topics || [];
  const chairName = committee?.chair || 'To be announced';
  const coChairName = committee?.co_chair || 'To be announced';

  const calculateProgress = () => {
    let progress = 0;
    if (application?.status === 'approved') progress += 20;
    if (application?.payment_status === 'paid') progress += 30;
    if (positionPaperRecord?.status === 'submitted' || (positionPaperRecord as any)?.status === 'reviewed') progress += 50;
    return progress;
  };

  const progressPercentage = calculateProgress();

  const positionPaperStatus = {
    submitted: (positionPaperRecord as any)?.status === 'submitted',
    deadline: 'TBA',
    feedback: null,
    status: ((positionPaperRecord as any)?.status as 'draft' | 'submitted' | 'reviewed' | undefined) || 'draft'
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Users },
    { id: 'position-paper', name: 'Position Paper', icon: FileText },
    { id: 'schedule', name: 'Schedule', icon: Calendar }
  ];

  return (
    <motion.div
      className="space-y-8 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Premium Header */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6 md:p-8 relative overflow-hidden border border-white/15"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-gold-400/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-diplomatic-400/15 blur-3xl rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5" />
          <div className="absolute inset-0 bg-noise opacity-10 mix-blend-soft-light" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Committee Center</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-2 tracking-tight">
              {committeeName}
            </h1>
            <p className="text-white/50 text-sm md:text-base max-w-2xl leading-relaxed">
              {committeeAbbr} · Official Delegate Portal
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="glass-panel px-4 py-2 border-white/10 flex flex-col items-end">
              <span className="text-[9px] font-bold text-gold-400/60 uppercase tracking-widest mb-1">Assigned To</span>
              <span className="text-sm font-bold text-white tracking-tight">{committeeAbbr || 'Awaiting Assignment'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Committee Hero Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-card p-8 group relative overflow-hidden border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={160} className="text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-gold-500/30 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-gold-400/30 transition-colors">
                <Users className="h-6 w-6 text-gold-400" />
              </div>
              <div>
                <span className="text-gold-400/60 text-[10px] font-bold uppercase tracking-widest block mb-0.5">Mandate & Reach</span>
                <h3 className="text-lg font-bold text-white tracking-tight">Committee Overview</h3>
              </div>
            </div>

            <p className="text-white/70 leading-relaxed max-w-3xl text-sm md:text-base">
              {committeeDescription}
            </p>

            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 text-white/40">
                <MapPin size={14} className="text-gold-400/60" />
                <span className="text-xs font-mono">{scheduleEvents.find(e => e.location)?.location || 'Registan School'}</span>
              </div>
              <div className="flex items-center space-x-2 text-white/40">
                <Clock size={14} className="text-gold-400/60" />
                <span className="text-xs font-mono">TuronMUN 2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 bg-gradient-to-br from-diplomatic-900/80 to-diplomatic-950/90 border-white/15 h-full flex flex-col justify-center">
            <span className="text-gold-400/60 text-[9px] font-bold uppercase tracking-[0.2em] block mb-2">Delegate Badge</span>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/5 rounded-full border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-gold-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <User size={28} className="text-white/40 group-hover:text-gold-400/60 transition-colors" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight leading-none mb-1 line-clamp-1">{application?.full_name || 'Delegate'}</h4>
                <p className="text-white/30 text-[10px] font-mono tracking-tighter uppercase">{committeeAbbr || 'AWAITING ASSIGNMENT'}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full bg-gradient-to-r from-gold-600 to-gold-400"
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                <span className="text-white/40">Preparation Progress</span>
                <span className="text-gold-400">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex justify-center md:justify-start">
        <div className="glass-panel p-1 rounded-xl bg-white/5 border border-white/10 flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-gold-400 text-diplomatic-950 shadow-[0_0_20px_rgba(247,163,28,0.3)]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Committee Topics */}
            <div className="glass-card p-8 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileText size={120} className="text-white" />
              </div>

              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
                <FileText className="h-5 w-5 text-gold-400" />
                Substantive Agenda
              </h3>

              {topics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topics.map((topic, index) => (
                    <motion.div
                      key={index}
                      className="glass-panel p-5 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all group overflow-hidden relative"
                      whileHover={{ y: -2 }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gold-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center text-sm font-black border border-gold-400/20 shrink-0">
                          0{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold leading-snug tracking-tight group-hover:text-gold-400 transition-colors uppercase text-xs mb-1">Topic Area</p>
                          <p className="text-white/80 text-sm font-medium leading-relaxed">{topic}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-white/10">
                  <p className="text-white/30 text-sm font-mono uppercase tracking-widest">Agenda not yet finalized by the Secretariat</p>
                </div>
              )}
            </div>

            {/* Committee Leadership */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-8 border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <User size={80} className="text-white" />
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-diplomatic-400/20 to-diplomatic-600/30 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-diplomatic-400/30 transition-colors">
                    <User className="h-7 w-7 text-diplomatic-400" />
                  </div>
                  <div>
                    <span className="text-gold-400/60 text-[9px] font-bold uppercase tracking-[0.2em] block mb-1">Presidium</span>
                    <h4 className="text-lg font-bold text-white tracking-tight">{chairName}</h4>
                    <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Committee Chair</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed italic border-l-2 border-gold-400/30 pl-4">
                  The Chair coordinates the debate and ensures adherence to the Rules of Procedure.
                </p>
              </div>

              <div className="glass-card p-8 border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <User size={80} className="text-white" />
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400/20 to-emerald-600/30 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-emerald-400/30 transition-colors">
                    <User className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-gold-400/60 text-[9px] font-bold uppercase tracking-[0.2em] block mb-1">Secretariat</span>
                    <h4 className="text-lg font-bold text-white tracking-tight">{coChairName}</h4>
                    <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Co-Chair</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed italic border-l-2 border-gold-400/30 pl-4">
                  The Co-Chair assists in managing the assembly and evaluating delegate performance.
                </p>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'position-paper' && (
          <div className="space-y-6">
            {/* Position Paper Status & Feedback */}
            <div className="glass-card p-8 border-white/10 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-1">Position Paper</h3>
                  <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">Policy & Representation Statement</p>
                </div>

                <div className="flex items-center gap-3">
                  {positionPaperStatus.status === 'submitted' ? (
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Submitted</span>
                    </div>
                  ) : positionPaperStatus.status === 'reviewed' ? (
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Reviewed</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">Drafting</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chair Feedback & Score - Elite View */}
              {positionPaperRecord && ((positionPaperRecord as any).score || (positionPaperRecord as any).chair_feedback) && (
                <div className="glass-panel p-8 mb-8 border-gold-400/20 bg-gradient-to-br from-gold-400/5 to-transparent rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <CheckCircle size={140} className="text-gold-400" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-gold-400/20 flex items-center justify-center border border-gold-400/30">
                        <CheckCircle className="h-5 w-5 text-gold-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight leading-none mb-1">Academic Evaluation</h4>
                        <p className="text-gold-400/60 text-[10px] font-bold uppercase tracking-widest">Secretariat Feedback</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {(positionPaperRecord as any).score !== null && (positionPaperRecord as any).score !== undefined && (
                        <div className="md:col-span-3">
                          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5 text-center">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Final Score</p>
                            <div className="flex items-center justify-center gap-1">
                              <span className={`text-5xl font-black ${(positionPaperRecord as any).score >= 90 ? 'text-emerald-400' : 'text-gold-400'}`}>
                                {(positionPaperRecord as any).score}
                              </span>
                              <span className="text-white/20 text-xl font-bold self-end mb-1">/100</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-9">
                        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5 h-full">
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Chair's Commentary</p>
                          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium indent-4">
                            {(positionPaperRecord as any).chair_feedback || "No specific feedback provided yet."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-400/20 to-diplomatic-400/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <textarea
                    value={positionPaperText}
                    onChange={(e) => setPositionPaperText(e.target.value)}
                    placeholder="Commence drafting your policy statement here..."
                    className="relative w-full h-[500px] glass-panel px-6 py-6 text-white placeholder-white/20 border-white/10 focus:border-gold-400/40 focus:ring-1 focus:ring-gold-400/20 transition-all rounded-2xl resize-none font-medium text-sm md:text-base leading-relaxed"
                  />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <motion.button
                      className="flex-1 md:flex-none flex items-center justify-center space-x-2 glass-panel px-5 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-xl border-white/10 text-xs font-bold uppercase tracking-widest"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload PDF</span>
                    </motion.button>

                    <motion.button
                      disabled={!application || !committee || savingDraft}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-2 glass-panel px-5 py-3 text-white/70 hover:text-gold-400 hover:bg-gold-400/5 transition-all rounded-xl border-white/10 disabled:opacity-30 text-xs font-bold uppercase tracking-widest"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        if (!application || !committee) return;
                        try {
                          setSavingDraft(true);
                          const payload: any = {
                            id: (positionPaperRecord as any)?.id,
                            application_id: (application as any).id,
                            committee_id: (application as any).assigned_committee_id,
                            content: positionPaperText,
                            status: 'draft'
                          };
                          const { data, error } = await (supabase
                            .from('position_papers') as any)
                            .upsert(payload)
                            .select('*')
                            .single();
                          if (!error && data) {
                            setPositionPaperRecord(data as PositionPaperRow);
                          }
                        } finally {
                          setSavingDraft(false);
                        }
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
                    </motion.button>
                  </div>

                  <motion.button
                    disabled={!application || !committee || submitting}
                    className="w-full md:w-auto flex items-center justify-center space-x-3 bg-gold-400 hover:bg-gold-500 px-8 py-3 text-diplomatic-950 transition-all rounded-xl disabled:opacity-30 shadow-[0_4px_20px_rgba(247,163,28,0.25)] group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (!application || !committee) return;
                      try {
                        setSubmitting(true);
                        const payload: any = {
                          id: (positionPaperRecord as any)?.id,
                          application_id: (application as any).id,
                          committee_id: (application as any).assigned_committee_id,
                          content: positionPaperText,
                          status: 'submitted'
                        };
                        const { data, error } = await (supabase
                          .from('position_papers') as any)
                          .upsert(payload)
                          .select('*')
                          .single();
                        if (!error && data) {
                          setPositionPaperRecord(data as PositionPaperRow);
                        }
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    <span className="text-xs font-black uppercase tracking-[0.15em]">{submitting ? 'Transmitting...' : 'Full Submission'}</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Position Paper Guidelines - Premium List */}
            <div className="glass-card p-8 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <AlertTriangle size={100} className="text-white" />
              </div>

              <h4 className="text-white font-bold mb-6 flex items-center gap-3 tracking-tight">
                <AlertTriangle className="h-5 w-5 text-gold-400" />
                Submission Guidelines
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Address all committee topics from your nation's specific perspective",
                  "Maximum 2 pages, single-spaced, 12pt professional typography",
                  "Integrate minimum 3 peer-reviewed or official UN sources",
                  "Incorporate feasible solutions aligned with national interests"
                ].map((guideline, i) => (
                  <div key={i} className="flex items-center space-x-4 glass-panel p-4 rounded-xl border-white/5 bg-white/5">
                    <div className="w-6 h-6 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-gold-400 rounded-full" />
                    </div>
                    <p className="text-white/70 text-[13px] font-medium leading-tight">{guideline}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="glass-card p-8 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calendar size={120} className="text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-1">Session Schedule</h3>
                <p className="text-gold-400/60 text-[10px] font-bold uppercase tracking-[0.2em]">Chrono-Sequence of Assembly</p>
              </div>
              <motion.button
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar className="h-4 w-4 text-gold-400" />
                <span>Sync to Calendar</span>
              </motion.button>
            </div>

            <div className="space-y-4 relative z-10">
              {scheduleEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {scheduleEvents.map((session, idx) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all group flex flex-col md:flex-row md:items-center gap-6"
                    >
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-diplomatic-400/10 to-diplomatic-600/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-inner group-hover:border-diplomatic-400/30 transition-colors">
                          <Clock className="h-5 w-5 text-diplomatic-400 mb-1" />
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Session</span>
                        </div>
                        <div className="md:hidden">
                          <h4 className="text-white font-bold tracking-tight mb-1">{session.title}</h4>
                          <p className="text-gold-400 text-xs font-mono">{session.start_time} - {session.end_time}</p>
                        </div>
                      </div>

                      <div className="flex-1 hidden md:block">
                        <h4 className="text-lg font-bold text-white tracking-tight mb-1 group-hover:text-gold-400 transition-colors">{session.title}</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2 text-white/40">
                            <MapPin size={12} className="text-gold-400/60" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{session.location || 'Venue TBA'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Interval</span>
                          <span className="text-sm font-mono text-gold-400 font-bold">{session.start_time} — {session.end_time}</span>
                        </div>
                        <div className="md:hidden flex items-center space-x-2 text-white/40 mb-2">
                          <MapPin size={12} className="text-gold-400/60" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{session.location || 'Venue TBA'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="text-white/10" />
                  </div>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em]">Operational schedule pending publication</p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest text-center md:text-left">
                * Times are subject to quorum requirements and presiding chair discretion
              </p>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/60">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] font-bold tracking-widest uppercase">Live Updates Enabled</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default React.memo(MyCommittee);

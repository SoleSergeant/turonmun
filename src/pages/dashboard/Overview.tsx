import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Flag,
  Users,
  ChevronRight
} from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
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

function Overview() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Tables<'applications'> | null>(null);
  const [committee, setCommittee] = useState<any | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagError, setFlagError] = useState(false);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        console.log('Overview querying applications for email:', user.email);
        const { data: app, error } = await (supabase as any)
          .from('applications')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && app) {
          setApplication(app as any);

          if (app.assigned_committee_id) {
            const { data: comm } = await supabase
              .from('committees')
              .select('*')
              .eq('id', app.assigned_committee_id)
              .single();
            if (comm) setCommittee(comm);
          }

          // Fetch country assignment
          const { data: assign } = await supabase
            .from('country_assignments')
            .select('*')
            .eq('application_id', app.id)
            .single();

          if (assign) setAssignment(assign);
        }

        const { data: upcoming } = await supabase
          .from('schedule_events')
          .select('*')
          .order('event_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5);


        setEvents(upcoming || []);

        // Fetch all resources as requested (global visibility)
        const { data: res } = await (supabase as any)
          .from('resources')
          .select('*');

        setResources(res || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const displayName = (application?.full_name || (user?.user_metadata as any)?.full_name || user?.email || 'Delegate');
  const displayCountry = assignment?.country_name || 'Not assigned yet';
  const committeeName = committee?.name || 'Not assigned yet';
  const badgeNumber = application?.id || 'Pending';
  const status = application?.status || 'pending';

  const isAllocated = !!assignment;
  const isApproved = status === 'approved' || isAllocated;
  const isPaid = application?.payment_status === 'paid';
  const isReviewed = !!application?.reviewed_at || isApproved || isPaid;

  const applicationSteps = [
    { 
      name: 'Submitted', 
      status: 'completed' as "completed" | "current" | "pending", 
      date: application?.created_at ? new Date(application.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null 
    },
    { 
      name: 'Reviewed', 
      status: (isReviewed ? 'completed' : 'current') as "completed" | "current" | "pending", 
      date: application?.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null 
    },
    { 
      name: 'Payment', 
      status: (isPaid ? 'completed' : isReviewed ? 'current' : 'pending') as "completed" | "current" | "pending", 
      date: null 
    },
    { 
      name: 'Confirmed', 
      status: (isApproved ? 'completed' : isPaid ? 'current' : 'pending') as "completed" | "current" | "pending", 
      date: null 
    },
    { 
      name: 'Allocated', 
      status: (isAllocated ? 'completed' : isApproved ? 'current' : 'pending') as "completed" | "current" | "pending", 
      date: null 
    },
  ];

  const conferenceDate = new Date('2026-03-21T23:59:00');

  return (
    <motion.div
      className="space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6 md:p-8 relative overflow-hidden border border-white/15"
      >
        {/* Background halo + noise for premium feel */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-gold-400/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-diplomatic-400/15 blur-3xl rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5" />
          <div className="absolute inset-0 bg-noise opacity-10 mix-blend-soft-light" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Delegate Dashboard</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-2 leading-tight">
              Welcome back, <span className="text-gold-400">{displayName}</span>! 👋
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-xl">
              Ready to make your mark at TuronMUN Season 6? Your diplomatic journey continues here.
            </p>
          </div>
          <div className="hidden md:block flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-gold-400/40 via-transparent to-diplomatic-400/40 blur-xl" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-glow">
                <User className="h-10 w-10 text-white/90" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top Row - Profile & Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="glass-card p-0 lg:col-span-5 flex flex-col h-full overflow-hidden group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-diplomatic-400/20 to-diplomatic-500/30 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-gold-400/30 transition-colors">
                  <User className="h-6 w-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">Delegate Profile</h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Official Credential</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/60">{application?.id?.slice(0, 8) || '---'}</span>
              </div>
            </div>

            <div className="space-y-1">
              {[
                { label: 'Full Name', value: displayName, icon: User },
                { label: 'Committee', value: committeeName, icon: Users, color: 'text-gold-400' },
                { label: 'Organization', value: application?.institution || 'Not specified', icon: FileText },
              ].map((row, idx) => (
                <div key={idx} className="flex flex-col py-3 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.color || 'text-white'} truncate`}>{row.value}</span>
                </div>
              ))}

              <div className="flex flex-col py-3 last:border-0">
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Representing</span>
                <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                  {assignment?.country_code && !flagError ? (
                    <div className="relative">
                      <div className="absolute -inset-1 bg-white/20 blur-sm rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img
                        src={`https://flagcdn.com/w80/${assignment.country_code.toLowerCase()}.png`}
                        alt="Flag"
                        className="w-10 h-auto rounded-sm shadow-md relative z-10 border border-white/20"
                        onError={() => setFlagError(true)}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center">
                      <Flag className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none">{displayCountry}</span>
                    <span className="text-[10px] text-white/40 font-mono mt-1">{assignment?.country_code || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-white/5 border-t border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                  status === 'approved' ? 'bg-emerald-400 shadow-emerald-400/20 animate-pulse' : 
                  status === 'pending' ? 'bg-amber-400 shadow-amber-400/20' : 
                  'bg-white/20'
                }`} />
                <span className="text-white font-bold text-[11px] uppercase tracking-widest">
                  Status: <span className={status === 'approved' ? 'text-emerald-400' : 'text-white'}>{status}</span>
                </span>
              </div>
              <button className="text-[10px] text-gold-400 hover:text-gold-300 font-bold uppercase tracking-wider transition-all hover:translate-x-1 flex items-center gap-1">
                View All Details
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-7 hidden md:flex flex-col h-full bg-gradient-to-br from-diplomatic-900/80 to-diplomatic-950/90">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-gold-500/30 rounded-xl flex items-center justify-center border border-white/10">
              <Clock className="h-6 w-6 text-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Conference Countdown</h3>
              <p className="text-white/50 text-xs">Time remaining until the opening ceremony</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full">
              <CountdownTimer targetDate={conferenceDate} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle Row - Application Status & Committee Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Tracker */}
        <motion.div variants={itemVariants} className="glass-card p-6 border-white/10">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-500/30 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Application Journey</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Process Tracking</p>
            </div>
          </div>

          <div className="relative pl-10 space-y-10 group/journey">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500/50 via-white/10 to-white/5" />
            
            {applicationSteps.map((step, index) => (
              <div key={step.name} className="relative flex items-start group/step">
                {/* Status indicator */}
                <div className={`absolute -left-[31px] w-6 h-6 rounded-full border-4 border-diplomatic-900 z-10 transition-all duration-500 flex items-center justify-center ${
                  step.status === 'completed'
                    ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : step.status === 'current'
                      ? 'bg-gold-500 shadow-[0_0_15px_rgba(247,163,28,0.5)] animate-pulse'
                      : 'bg-white/10 border-white/5'
                }`}>
                  {step.status === 'completed' && <CheckCircle size={10} className="text-diplomatic-900" />}
                </div>

                <div className={`flex-1 transition-all duration-300 ${
                  step.status === 'completed' || step.status === 'current' ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`flex items-center justify-between gap-4 mb-1`}>
                    <p className={`text-sm font-bold tracking-tight ${
                      step.status === 'current' ? 'text-gold-400' : 'text-white'
                    }`}>
                      {step.name}
                    </p>
                    {step.date && (
                      <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {step.date}
                      </span>
                    )}
                  </div>
                  
                  {step.status === 'current' ? (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gold-400/10 border border-gold-400/20 mt-1"
                    >
                      <AlertCircle size={10} className="text-gold-400" />
                      <span className="text-[9px] text-gold-400 font-bold uppercase tracking-wider">Action required</span>
                    </motion.div>
                  ) : step.status === 'completed' ? (
                    <p className="text-[10px] text-emerald-400/60 font-medium">Verified by academic team</p>
                  ) : (
                    <p className="text-[10px] text-white/20 font-medium">Pending previous steps</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Committee & Country Assignment */}
        <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col group min-h-[400px]">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-purple-500/30 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-purple-400/30 transition-colors">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Academic Allocation</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Research & Resources</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 group-hover:border-white/10 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Users size={40} className="text-white/5" />
              </div>
              
              <div className="relative z-10">
                <span className="text-gold-400/60 text-[9px] font-bold uppercase tracking-[0.2em] block mb-2">Allocated Committee</span>
                <h4 className="text-xl font-bold text-white mb-3 tracking-tight">{committeeName}</h4>
                <p className="text-white/60 text-xs leading-relaxed italic line-clamp-3 mb-6">
                  {committee?.description || 'Your committee assignment and detailed background guide will appear here shortly.'}
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                   <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-white/80 font-bold uppercase tracking-wider transition-all">
                    <FileText size={14} className="text-gold-400" />
                    Handbook
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-white/80 font-bold uppercase tracking-wider transition-all">
                    <FileText size={14} className="text-gold-400" />
                    ROP
                  </button>
                  <button className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-gold-400/10 hover:bg-gold-400/20 border border-gold-400/20 rounded-lg text-[10px] text-gold-400 font-bold uppercase tracking-wider transition-all">
                    <FileText size={14} />
                    Position Paper Template
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-diplomatic-400/10 to-transparent rounded-2xl p-6 border border-white/5 flex items-center justify-between group/allocation">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {assignment?.country_code && !flagError ? (
                    <img
                      src={`https://flagcdn.com/w160/${assignment.country_code.toLowerCase()}.png`}
                      alt="Flag"
                      className="w-16 h-auto rounded shadow-xl border border-white/20 relative z-10"
                      onError={() => setFlagError(true)}
                    />
                  ) : (
                    <div className="w-16 h-10 bg-diplomatic-800 rounded flex items-center justify-center border border-white/10">
                      <Flag size={20} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute -inset-2 bg-gold-400/20 blur-xl rounded-full opacity-0 group-hover/allocation:opacity-100 transition-opacity" />
                </div>
                <div>
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] block mb-1">Representing</span>
                  <span className="text-lg font-bold text-white tracking-tight">{displayCountry}</span>
                </div>
              </div>
              <button className="p-3 bg-gold-400 text-diplomatic-900 rounded-xl hover:scale-110 transition-all shadow-lg shadow-gold-400/20">
                <FileText size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400/20 to-red-500/30 rounded-xl flex items-center justify-center border border-white/10">
                <Calendar className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Agenda & Timeline</h3>
                <p className="text-white/50 text-xs">Stay synchronized with the conference flow</p>
              </div>
            </div>
            <button className="hidden sm:block text-xs text-gold-400 hover:text-gold-300 font-bold uppercase tracking-wider transition-colors">
              Full Schedule →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="glass-panel p-4 bg-white/5 hover:bg-white/10 transition-all border-white/10 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gold-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm tracking-tight truncate mr-2">{event.title}</span>
                  <div className="flex items-center space-x-1 whitespace-nowrap px-2 py-0.5 bg-white/10 rounded-full">
                    <Clock className="w-3 h-3 text-gold-400" />
                    <span className="text-gold-400 text-[10px] font-bold">{event.start_time}</span>
                  </div>
                </div>
                <div className="flex items-center text-white/50 text-[10px] font-medium uppercase tracking-widest">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {event.event_date}
                </div>
              </div>
            ))}
            {!loading && events.length === 0 && (
              <div className="col-span-full border border-dashed border-white/10 rounded-xl p-8 text-center bg-white/5">
                <p className="text-white/40 text-sm italic">The conference agenda is currently being finalized. Please check back later.</p>
              </div>
            )}
          </div>

          <div className="mt-6 sm:hidden">
            <button className="w-full text-center text-gold-400 hover:text-gold-300 text-xs font-bold uppercase tracking-widest py-3 bg-white/5 rounded-lg border border-white/10 transition-colors">
              View Master Schedule
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default React.memo(Overview);

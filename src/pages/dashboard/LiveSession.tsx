import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Vote,
  Gavel,
  Radio,
  Check,
  X,
  Minus,
  Activity,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMunCommand } from '@/hooks/useMunCommand';
import type { VoteChoice } from '@/types/munCommand';
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
      if (!user?.id) return;
      const { data } = await (supabase
        .from('applications') as any)
        .select('*')
        .eq('user_id', user.id)
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
}: {
  committeeId: string;
  application: Tables<'applications'>;
}) {
  const {
    session,
    loading,
    currentSpeaker,
    motions,
    activeMotion,
  } = useMunCommand({ committeeId, isChair: false });

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
          Please wait as the Chair establishes quorum.
        </p>
      </div>
    );
  }

  const timerColor = session.timer_remaining <= 10
    ? 'text-red-400'
    : session.timer_remaining <= 30
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <motion.div
      className="space-y-5 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Status bar */}
      <motion.div variants={itemVariants} className="glass-card p-4 border border-white/15 flex items-center gap-3">
        <div className="relative">
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <Radio className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="text-white font-bold text-sm uppercase tracking-widest">Live Session</span>
        <span className="text-white/20 mx-1">•</span>
        <span className="text-gold-400 font-bold text-xs uppercase tracking-widest">
          {SESSION_MODE_LABELS[session.current_mode]}
        </span>
      </motion.div>

      {/* Timer + Current Speaker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Timer */}
        <motion.div variants={itemVariants} className="glass-card p-8 border border-white/15 flex flex-col items-center justify-center">
          <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Session Timer</h3>
          <span className={`text-7xl font-mono font-black ${timerColor} tracking-tighter`}>
            {formatTime(session.timer_remaining)}
          </span>
          <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest mt-3">
            {session.timer_running ? '● Running' : '◼ Paused'}
          </span>
        </motion.div>

        {/* Current Speaker */}
        <motion.div variants={itemVariants} className="glass-card p-8 border border-white/15 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Mic size={80} className="text-white" /></div>
          <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Now on Podium</h3>
          {currentSpeaker ? (
            <div className="text-center relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-white font-black text-xl mb-1">{currentSpeaker.delegate_name}</p>
              <p className="text-white/40 text-sm">{currentSpeaker.delegate_country}</p>
            </div>
          ) : (
            <div className="text-center relative z-10">
              <MicOff className="h-12 w-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-xs uppercase tracking-widest font-bold">Podium is empty</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Active Motion */}
      {activeMotion && (
        <motion.div variants={itemVariants} className="glass-card p-6 border border-gold-400/30 bg-gold-400/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gold-400/20 flex items-center justify-center border border-gold-400/30 flex-shrink-0">
              <Vote className="h-4 w-4 text-gold-400" />
            </div>
            <div>
              <p className="text-gold-400 text-[9px] font-black uppercase tracking-widest">
                {activeMotion.status === 'voting' ? '● Active Voting' : 'Motion on the Floor'}
              </p>
              <p className="text-white font-bold text-lg leading-tight">{activeMotion.description}</p>
            </div>
          </div>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest ml-12">
            {MOTION_TYPE_LABELS[activeMotion.motion_type]} · {activeMotion.proposer_country}
          </p>
        </motion.div>
      )}

      {/* Motion History */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-white/15">
        <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Gavel className="h-3 w-3" /> Motion History
        </h3>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {motions.filter(m => m.status !== 'voting' && m.status !== 'proposed').length === 0 ? (
            <div className="text-center py-10">
              <Gavel className="h-8 w-8 text-white/5 mx-auto mb-3" />
              <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No motions yet</p>
            </div>
          ) : (
            motions.filter(m => m.status !== 'voting' && m.status !== 'proposed').map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  m.status === 'passed' ? 'bg-emerald-400' : 'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{m.description}</p>
                  <p className="text-white/30 text-[9px] uppercase tracking-wider font-bold">
                    {MOTION_TYPE_LABELS[m.motion_type]} · {m.proposer_country}
                  </p>
                </div>
                <span className={`text-xs font-black uppercase flex-shrink-0 ${m.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.status}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export { LiveSession };

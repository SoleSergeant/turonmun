import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Bell, Clock, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Messages() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }

      // Get delegate's assigned committee
      const { data: app } = await supabase
        .from('applications')
        .select('assigned_committee_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (app?.assigned_committee_id) {
        const { data } = await (supabase
          .from('committee_announcements' as any) as any)
          .select('*')
          .eq('committee_id', app.assigned_committee_id)
          .order('created_at', { ascending: false });
        setAnnouncements(data || []);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">Messages</h1>
        <p className="text-white/50">Announcements from your committee chair</p>
      </motion.div>

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-card p-12 text-center border border-white/10">
          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Your chair hasn't sent any announcements yet. Check back once the conference gets closer.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <motion.div
              key={ann.id}
              variants={itemVariants}
              className="glass-card p-6 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-400/20 border border-gold-400/30 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-gold-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-bold">{ann.title}</h3>
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ann.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment contact info — always visible */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-5 border border-gold-400/20 bg-gradient-to-r from-gold-400/5 to-transparent"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold-400/20 border border-gold-400/30 flex items-center justify-center shrink-0">
            <Send className="h-5 w-5 text-gold-400" />
          </div>
          <div>
            <p className="text-gold-300 font-semibold text-sm mb-1">Questions or payment?</p>
            <p className="text-white/50 text-xs leading-relaxed">
              After your application is accepted, our team will contact you via Telegram to arrange payment.
              You can also reach us directly at{' '}
              <a href="https://t.me/TuronMUN" target="_blank" rel="noreferrer" className="text-gold-400 hover:underline">
                @TuronMUN
              </a>.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  X,
  Clock,
  Users,
  CheckCircle,
  Bell,
  Search,
  Trash2,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnnouncementsProps {
  committees: any[];
  applications: any[];
  positionPapers: any[];
  loading: boolean;
  assignedDelegates: any[];
  submittedPapers: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ChairAnnouncements() {
  const context = useOutletContext<AnnouncementsProps>();
  const { committees, assignedDelegates, loading: ctxLoading } = context || {};
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnn, setLoadingAnn] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load announcements for all the chair's committees
  useEffect(() => {
    if (!committees?.length) return;
    const ids = committees.map((c: any) => c.id);
    supabase
      .from('committee_announcements' as any)
      .select('*')
      .in('committee_id', ids)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAnnouncements(data);
        setLoadingAnn(false);
      });
  }, [committees]);

  const handleSend = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast({ title: 'Missing fields', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }
    const committeeId = selectedCommittee || committees?.[0]?.id;
    if (!committeeId) {
      toast({ title: 'No committee', description: 'No committee selected.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      const { data, error } = await (supabase
        .from('committee_announcements' as any) as any)
        .insert({
          committee_id: committeeId,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          sent_by: adminUser?.id ?? null,
          recipients: 'all',
        })
        .select()
        .single();

      if (error) throw error;

      setAnnouncements(prev => [data, ...prev]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setShowNewModal(false);
      toast({ title: 'Announcement sent', description: 'All delegates in this committee will see it.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to send announcement.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await (supabase.from('committee_announcements' as any) as any).delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const filtered = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCommitteeName = (id: string) =>
    committees?.find((c: any) => c.id === id)?.name || 'Unknown Committee';

  if (ctxLoading || loadingAnn) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading announcements…</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search announcements…"
            className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
          />
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 px-4 py-2 text-white transition-colors rounded-lg font-semibold"
        >
          <Send className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Sent', value: announcements.length, icon: Bell, color: 'text-blue-400' },
          { label: 'Delegates in Committee', value: assignedDelegates?.length || 0, icon: Users, color: 'text-gold-400' },
          { label: 'This Week', value: announcements.filter(a => new Date(a.created_at) > new Date(Date.now() - 7 * 86400000)).length, icon: Clock, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <motion.div variants={itemVariants} className="glass-card p-12 text-center border border-white/10">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No announcements yet</h3>
            <p className="text-white/50 text-sm">Click "New Announcement" to send a message to your delegates.</p>
          </motion.div>
        ) : (
          filtered.map((ann) => (
            <motion.div key={ann.id} variants={itemVariants} className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{ann.title}</h3>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Sent
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 text-white/40 text-xs rounded-full">
                      {getCommitteeName(ann.committee_id)}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-3 whitespace-pre-wrap">{ann.content}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> All delegates
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ann.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* New Announcement Modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-diplomatic-900 border border-white/20 rounded-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">New Announcement</h3>
                <button onClick={() => setShowNewModal(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {committees && committees.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Committee</label>
                    <select
                      value={selectedCommittee}
                      onChange={(e) => setSelectedCommittee(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                    >
                      {committees.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-diplomatic-900">{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="e.g. Position paper deadline reminder"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Message</label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Write your announcement here…"
                    rows={5}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2.5 text-white/70 hover:text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !announcementTitle.trim() || !announcementContent.trim()}
                  className="flex-1 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending…' : 'Send to All Delegates'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

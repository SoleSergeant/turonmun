import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send,
  X,
  Clock,
  Users,
  CheckCircle,
  Bell,
  MessageSquare,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ChairAnnouncements() {
  const context = useOutletContext<AnnouncementsProps>();
  const { committees, applications, positionPapers, loading, assignedDelegates, submittedPapers } = context || {};
  const [showNewModal, setShowNewModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'draft'>('all');

  // Mock announcements data
  const [announcements, setAnnouncements] = useState([
    {
      id: '1',
      title: 'Welcome to ECOSOC - Opening Session',
      content: 'Dear delegates, welcome to the Economic and Social Council. Our opening session will begin promptly at 9:00 AM in Room A. Please arrive 10 minutes early for roll call.',
      recipients: 'all',
      status: 'sent',
      sentAt: '2024-03-15T08:00:00Z',
      readCount: 28,
      totalRecipients: 32
    },
    {
      id: '2',
      title: 'Position Paper Deadline Reminder',
      content: 'This is a friendly reminder that position papers are due by 11:59 PM tonight. Please ensure you have submitted your paper through the delegate portal. Late submissions will not be accepted.',
      recipients: 'all',
      status: 'sent',
      sentAt: '2024-03-14T18:00:00Z',
      readCount: 31,
      totalRecipients: 32
    },
    {
      id: '3',
      title: 'Room Change Notice',
      content: 'Please note that tomorrow\'s session will be held in Room B instead of Room A due to scheduling conflicts. Update your schedules accordingly.',
      recipients: 'committee',
      status: 'draft',
      sentAt: null,
      readCount: 0,
      totalRecipients: 32
    }
  ]);

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Error: No authenticated user found');
        return;
      }

      // Get admin user record
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (adminError || !adminUser) {
        alert('Error: User not authorized');
        return;
      }

      // Calculate recipients
      let totalRecipients = 0;
      if (selectedRecipients === 'all') {
        totalRecipients = assignedDelegates.length;
      } else if (selectedRecipients === 'committee') {
        totalRecipients = applications.length;
      }

      // Insert announcement
      const { error: insertError } = await supabase
        .from('announcements')
        .insert([{
          title: announcementTitle,
          content: announcementContent,
          sender_id: adminUser.id,
          committee_id: committees[0]?.id, // Use first committee for now
          target_audience: selectedRecipients === 'all' ? 'delegates' : 'committee',
          is_published: true,
          published_at: new Date().toISOString(),
          total_recipients: totalRecipients
        }]);

      if (insertError) {
        console.error('Error creating announcement:', insertError);
        alert('Error sending announcement');
        return;
      }

      // Add to local state
      const newAnnouncement = {
        id: Date.now().toString(),
        title: announcementTitle,
        content: announcementContent,
        recipients: selectedRecipients,
        status: 'sent',
        sentAt: new Date().toISOString(),
        readCount: 0,
        totalRecipients: totalRecipients
      };

      setAnnouncements([newAnnouncement, ...announcements]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setSelectedRecipients('all');
      setShowNewModal(false);

      alert('Announcement sent successfully!');
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Error sending announcement');
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || announcement.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading announcements...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 px-4 py-2 text-white transition-colors rounded-lg"
          >
            <Send className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <motion.div
            key={announcement.id}
            variants={itemVariants}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                  {announcement.status === 'sent' ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Sent
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-white/80 mb-3">{announcement.content}</p>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {announcement.recipients === 'all' ? 'All Delegates' : 'Committee Only'} ({announcement.totalRecipients})
                    </span>
                  </div>
                  {announcement.status === 'sent' && announcement.sentAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(announcement.sentAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {announcement.status === 'sent' && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{announcement.readCount}/{announcement.totalRecipients} read</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                {announcement.status === 'draft' && (
                  <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No announcements found</p>
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">New Announcement</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Title</label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Enter announcement title..."
                    className="w-full px-4 py-3 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Message</label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Type your announcement message..."
                    rows={6}
                    className="w-full px-4 py-3 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Recipients</label>
                  <select
                    value={selectedRecipients}
                    onChange={(e) => setSelectedRecipients(e.target.value)}
                    className="w-full px-4 py-3 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                  >
                    <option value="all">All Delegates ({assignedDelegates.length})</option>
                    <option value="committee">Committee Only</option>
                    <option value="specific">Specific Delegates</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-3 glass-panel text-white hover:bg-white/15 transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={!announcementTitle.trim() || !announcementContent.trim()}
                  className="flex-1 px-4 py-3 bg-gold-500 hover:bg-gold-600 text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Announcement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

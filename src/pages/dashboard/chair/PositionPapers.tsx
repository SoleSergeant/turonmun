import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  Star,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  X,
  Send,
  Award,
  TrendingUp
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PositionPapersProps {
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

export default function ChairPositionPapers() {
  const context = useOutletContext<PositionPapersProps>();
  const { committees, applications, positionPapers: papersData, loading, assignedDelegates, submittedPapers } = context || {};
  const [positionPapers, setPositionPapers] = useState(papersData || []);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'draft'>('all');
  const [filterCommittee, setFilterCommittee] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'needs_revision'>('pending');

  const filteredPapers = positionPapers.filter((paper: any) => {
    const delegate = applications.find(app => app.id === paper.application_id);
    const matchesSearch = paper.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delegate?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;
    const matchesCommittee = filterCommittee === 'all' || delegate?.assigned_committee_id === filterCommittee;
    return matchesSearch && matchesStatus && matchesCommittee;
  });

  const handleReviewPaper = (paper: any) => {
    setSelectedPaper(paper);
    setReviewScore(paper.score || 0);
    setReviewFeedback(paper.feedback || '');
    setReviewStatus(paper.status || 'pending');
    setShowReviewModal(true);
  };

  const handleDownload = (paper: any) => {
    const delegate = applications.find(app => app.id === paper.application_id);
    const fileName = `position_paper_${delegate?.full_name || 'delegate'}_${new Date().toISOString().split('T')[0]}.txt`;
    const content = `Position Paper\n\nDelegate: ${delegate?.full_name}\nEmail: ${delegate?.email}\nCommittee: ${committees.find(c => c.id === delegate?.assigned_committee_id)?.name}\nSubmitted: ${new Date(paper.created_at).toLocaleDateString()}\n\n${paper.content}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitReview = async () => {
    if (!selectedPaper) return;

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

      // Update position paper with review
      const { error: updateError } = await supabase
        .from('position_papers')
        .update({
          score: reviewScore,
          feedback: reviewFeedback,
          chair_feedback: reviewFeedback,
          status: reviewStatus,
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedPaper.id);

      if (updateError) {
        console.error('Error updating position paper:', updateError);
        alert('Error submitting review');
        return;
      }

      // Update local state
      setPositionPapers(positionPapers.map(paper =>
        paper.id === selectedPaper.id
          ? { ...paper, score: reviewScore, feedback: reviewFeedback, status: reviewStatus }
          : paper
      ));

      alert('Review submitted successfully!');
      setShowReviewModal(false);
      setSelectedPaper(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/20 text-blue-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'needs_revision': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading position papers...</p>
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{positionPapers.length}</h3>
          <p className="text-sm text-white/60">Total Papers</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-400">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{submittedPapers}</h3>
          <p className="text-sm text-white/60">Submitted</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{positionPapers.length - submittedPapers}</h3>
          <p className="text-sm text-white/60">Pending</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search papers or delegates..."
            className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={filterCommittee}
          onChange={(e) => setFilterCommittee(e.target.value)}
          className="px-4 py-2 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
        >
          <option value="all">All Committees</option>
          {committees.map((committee) => (
            <option key={committee.id} value={committee.id}>
              {committee.name}
            </option>
          ))}
        </select>
      </div>

      {/* Papers List */}
      <div className="space-y-4">
        {filteredPapers.map((paper: any) => {
          const delegate = applications.find(app => app.id === paper.application_id);
          const committee = committees.find(c => c.id === delegate?.assigned_committee_id);

          return (
            <motion.div
              key={paper.id}
              variants={itemVariants}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {delegate?.full_name || 'Unknown Delegate'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(paper.status)}`}>
                      {paper.status}
                    </span>
                    {committee && (
                      <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs rounded-full">
                        {committee.abbreviation}
                      </span>
                    )}
                  </div>

                  <p className="text-white/80 mb-3 line-clamp-3">{paper.content}</p>

                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>{delegate?.email}</span>
                    <span>•</span>
                    <span>Submitted {new Date(paper.created_at).toLocaleDateString()}</span>
                    {paper.score && (
                      <>
                        <span>•</span>
                        <span className={`font-medium ${getScoreColor(paper.score)}`}>
                          Score: {paper.score}/100
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownload(paper)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Download paper"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReviewPaper(paper)}
                    className="p-2 text-white/60 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors"
                    title="View and review paper"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredPapers.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No position papers found</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedPaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Review Position Paper</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Paper Info */}
                <div className="glass-panel p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">
                      {applications.find(app => app.id === selectedPaper.application_id)?.full_name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPaper.status)}`}>
                      {selectedPaper.status}
                    </span>
                  </div>
                  <p className="text-white/80 whitespace-pre-wrap">{selectedPaper.content}</p>
                </div>

                {/* Review Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Score (0-100)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={reviewScore}
                        onChange={(e) => setReviewScore(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className={`text-lg font-bold ${getScoreColor(reviewScore)} w-12 text-center`}>
                        {reviewScore}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Review Status</label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as any)}
                      className="w-full px-4 py-2 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="needs_revision">Needs Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Feedback</label>
                    <textarea
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      placeholder="Provide detailed feedback for the delegate..."
                      rows={4}
                      className="w-full px-4 py-3 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-3 glass-panel text-white hover:bg-white/15 transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewScore === 0}
                  className="flex-1 px-4 py-3 bg-gold-500 hover:bg-gold-600 text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

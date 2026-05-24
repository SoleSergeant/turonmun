import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users,
  FileText,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

interface OverviewProps {
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

export default function ChairOverview() {
  const context = useOutletContext<OverviewProps>();
  const { committees, applications, positionPapers, loading, assignedDelegates, submittedPapers } = context || {};
  const totalDelegates = assignedDelegates?.length || 0;
  const totalCommittees = committees?.length || 0;
  const totalPapers = positionPapers?.length || 0;
  const submissionRate = totalDelegates > 0
    ? Math.round((submittedPapers / totalDelegates) * 100)
    : 0;

  const stats = [
    {
      title: 'Total Delegates',
      value: totalDelegates,
      change: `${totalDelegates} currently assigned`,
      icon: Users,
      color: 'from-blue-400 to-blue-500'
    },
    {
      title: 'Papers Submitted',
      value: submittedPapers,
      change: `${submissionRate}% submission rate`,
      icon: FileText,
      color: 'from-green-400 to-green-500'
    },
    {
      title: 'Committees You Chair',
      value: totalCommittees,
      change: `${totalCommittees} active committee${totalCommittees === 1 ? '' : 's'}`,
      icon: CheckCircle,
      color: 'from-purple-400 to-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading chair dashboard...</p>
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <div className="glass-card p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-gold-400/5 opacity-60" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-sm text-white/60">{stat.title}</p>
                  <p className="text-xs text-gold-400 mt-2">{stat.change}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Your Committees */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Committees
          </h2>
          <span className="text-sm text-gold-400">{totalCommittees} active</span>
        </div>
        {totalCommittees === 0 ? (
          <p className="text-sm text-white/60">You are not assigned to any committees yet.</p>
        ) : (
          <div className="space-y-4">
            {committees.map((committee) => {
              const delegateCount = assignedDelegates.filter(app => app.assigned_committee_id === committee.id).length;
              return (
                <div key={committee.id} className="glass-panel p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{committee.name}</h3>
                      <p className="text-xs text-white/60">{committee.abbreviation}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>{delegateCount} delegate{delegateCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

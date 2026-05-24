import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Globe, Flag, Search, Download, FileText } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

interface DelegatesProps {
  committees: any[];
  applications: any[];
  positionPapers: any[];
  loading: boolean;
  assignedDelegates: any[];
  submittedPapers: number;
}

export default function ChairDelegates() {
  const context = useOutletContext<DelegatesProps>();
  const { committees, applications, positionPapers, loading, assignedDelegates } = context || {};
  const [searchTerm, setSearchTerm] = useState('');

  // Filter delegates based on search
  const filteredDelegates = (assignedDelegates || []).filter(delegate =>
    delegate.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delegate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delegate.institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get position paper status for a delegate
  const getDelegatePositionPaper = (delegateId: string) => {
    return positionPapers?.find(paper => paper.application_id === delegateId);
  };

  // Export delegates to CSV
  const handleExport = () => {
    if (!assignedDelegates || assignedDelegates.length === 0) {
      alert('No delegates to export');
      return;
    }

    // Create CSV header
    const headers = ['Name', 'Email', 'Phone', 'Institution', 'Country', 'Position Paper Status'];

    // Create CSV rows
    const rows = assignedDelegates.map(delegate => {
      const positionPaper = getDelegatePositionPaper(delegate.id);
      const paperStatus = positionPaper?.status || 'not_submitted';
      const statusText = paperStatus === 'submitted' ? 'Submitted' : paperStatus === 'draft' ? 'Draft' : 'Not Submitted';

      return [
        delegate.full_name || '',
        delegate.email || '',
        delegate.phone || '',
        delegate.institution || '',
        delegate.country || '',
        statusText
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `delegates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/60">Loading delegates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Delegates</h2>
          <p className="text-white/60 mt-1">
            {filteredDelegates.length} delegate{filteredDelegates.length !== 1 ? 's' : ''} assigned to your committee
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export List
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search delegates by name, email, or institution..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Delegates</p>
              <p className="text-2xl font-bold text-white">{assignedDelegates?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Papers Submitted</p>
              <p className="text-2xl font-bold text-white">
                {positionPapers?.filter(p => p.status === 'submitted').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Pending Papers</p>
              <p className="text-2xl font-bold text-white">
                {(assignedDelegates?.length || 0) - (positionPapers?.filter(p => p.status === 'submitted').length || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delegates List */}
      {filteredDelegates.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/10">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'No delegates found' : 'No delegates assigned yet'}
          </h3>
          <p className="text-white/60">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Delegates will appear here once they are assigned to your committee'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDelegates.map((delegate, index) => {
            const positionPaper = getDelegatePositionPaper(delegate.id);
            const hasPaper = !!positionPaper;
            const paperStatus = positionPaper?.status || 'not_submitted';

            return (
              <motion.div
                key={delegate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 border border-white/10 hover:border-gold-400/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center text-white font-bold">
                        {delegate.full_name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{delegate.full_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {delegate.email}
                          </span>
                          {delegate.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {delegate.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Institution</p>
                        <p className="text-white text-sm flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {delegate.institution}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Country</p>
                        <p className="text-white text-sm flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {delegate.country}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Position Paper</p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${paperStatus === 'submitted'
                            ? 'bg-green-500/20 text-green-400'
                            : paperStatus === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                          {paperStatus === 'submitted' ? '✓ Submitted' : paperStatus === 'draft' ? '⏳ Draft' : '✗ Not Submitted'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasPaper && (
                    <button className="ml-4 px-4 py-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg transition-colors text-sm font-medium">
                      View Paper
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

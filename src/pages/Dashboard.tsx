import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700">
        <div className="text-white/70 text-sm">Loading your dashboard...</div>
      </div>
    );
  }

  const dashboardUser = {
    id: user.id,
    name: (user.user_metadata as any)?.full_name || user.email || 'Delegate',
    email: user.email || '',
    role: 'delegate',
    avatar_url: (user.user_metadata as any)?.avatar_url || null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-20 w-72 h-72 bg-gold-300/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-diplomatic-300/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gold-200/5 blur-2xl rounded-full" />
      </div>

      {/* Top back-to-site bar */}
      <div className="relative z-20 flex justify-center px-4 pt-3">
        <div className="w-full max-w-7xl h-14 flex justify-between items-center glass-panel px-6 rounded-full border border-white/15 bg-diplomatic-900/70 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold-400 to-diplomatic-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative w-9 h-9 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                <img
                  src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png"
                  alt="TuronMUN Logo"
                  className="w-6 h-6 object-contain drop-shadow-md"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold text-white tracking-tight leading-none mb-1">TuronMUN Season 6</span>
              <span className="text-[10px] text-white/60 font-medium tracking-wider uppercase leading-none">Delegate Dashboard</span>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs sm:text-sm h-9 px-5 rounded-full bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white border border-white/20 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center"
          >
            ← Back to Site
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex h-[calc(100vh-3.75rem)] mt-2">
        {/* Sidebar */}
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader
            onMenuClick={() => setSidebarOpen(true)}
            user={dashboardUser}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

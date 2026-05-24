import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, User } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  user: any; // Will be properly typed when we set up auth
}

export default function DashboardHeader({ onMenuClick, user }: DashboardHeaderProps) {
  return (
    <header className="glass-nav border-b border-white/10 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side - Menu Button & Search */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Search dashboard..."
              className="glass-panel pl-10 pr-4 py-2 w-64 text-sm text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all"
            />
          </div>
        </div>
        {/* Right Side - Notifications & Profile */}
        <div className="flex items-center space-x-4">
          {/* Profile Dropdown */}
          <div className="relative">
            <motion.button
              className="flex items-center space-x-3 h-10 px-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-7 h-7 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center shadow-inner">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="hidden md:flex flex-col justify-center text-left">
                <p className="text-xs font-bold text-white leading-none mb-0.5">
                  {user?.name || 'Delegate'}
                </p>
                <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider leading-none">
                  {user?.role || 'delegate'}
                </p>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}

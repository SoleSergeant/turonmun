import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  X,
  LogOut,
  Radio
} from 'lucide-react';
interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'My Application', href: '/dashboard/application', icon: FileText },
  { name: 'My Committee', href: '/dashboard/committee', icon: Users },
  { name: 'Live Session', href: '/dashboard/live', icon: Radio },
];

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const location = useLocation();

  const handleLogout = async () => {
    // Mock logout for UI preview
    console.log('Logout clicked - would redirect to login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={`hidden lg:flex lg:flex-col lg:w-64 glass-nav border-r border-white/10`}
        initial={false}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold-400 to-diplomatic-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                  <img
                    src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png"
                    alt="TuronMUN Logo"
                    className="w-7 h-7 object-contain drop-shadow-md"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-display font-bold text-base tracking-tight">TuronMUN</span>
                <span className="text-[10px] text-diplomatic-200 font-medium tracking-wider uppercase">Season 6</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? 'bg-gold-400/20 text-gold-300 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-gold-300' : 'text-white/50 group-hover:text-white/70'}`} />
                  {item.name}
                  {isActive && (
                    <motion.div
                      className="ml-auto w-1 h-4 bg-gold-400 rounded-full"
                      layoutId="activeIndicator"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200 group"
            >
              <LogOut className="mr-3 h-5 w-5 text-white/50 group-hover:text-red-400" />
              Logout
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-nav border-r border-white/10 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold-400 to-diplomatic-400 rounded-xl blur opacity-25"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                  <img
                    src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png"
                    alt="TuronMUN Logo"
                    className="w-7 h-7 object-contain drop-shadow-md"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-display font-bold text-base tracking-tight">TuronMUN</span>
                <span className="text-[10px] text-diplomatic-200 font-medium tracking-wider uppercase">Season 6</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? 'bg-gold-400/20 text-gold-300 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-gold-300' : 'text-white/50 group-hover:text-white/70'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200 group"
            >
              <LogOut className="mr-3 h-5 w-5 text-white/50 group-hover:text-red-400" />
              Logout
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

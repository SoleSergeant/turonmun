
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSubdomain } from '@/hooks/use-subdomain';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Mail,
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const subdomain = useSubdomain();
  const isAdminSubdomain = subdomain === 'admin';

  const navItems = [
    { path: isAdminSubdomain ? '/dashboard' : '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: isAdminSubdomain ? '/committees' : '/admin/committees', label: 'Committees', icon: Users },
    { path: isAdminSubdomain ? '/schedule' : '/admin/schedule', label: 'Schedule', icon: Calendar },
    { path: isAdminSubdomain ? '/resources' : '/admin/resources', label: 'Resources', icon: FileText },
    { path: isAdminSubdomain ? '/applications' : '/admin/applications', label: 'Applications', icon: Users },
    { path: isAdminSubdomain ? '/messages' : '/admin/messages', label: 'Messages', icon: Mail },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate(isAdminSubdomain ? '/' : '/admin');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gradient-to-b from-diplomatic-900 to-diplomatic-800 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
              <img
                src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png"
                alt="TuronMUN Logo"
                className="w-7 h-7 object-contain drop-shadow-md"
              />
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight text-white">TuronMUN</span>
              <span className="block text-xs text-diplomatic-200 font-medium tracking-wider uppercase">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="px-3 py-2 text-[10px] font-bold text-diplomatic-200 uppercase tracking-widest opacity-80">
            Management
          </div>
          <ul className="mt-1 space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${location.pathname === item.path
                      ? 'bg-white/10 text-white shadow-sm border border-white/5'
                      : 'text-diplomatic-100 hover:bg-white/5 hover:text-white hover:translate-x-1'
                    }`}
                >
                  <item.icon size={18} className={`mr-3 transition-colors ${location.pathname === item.path ? 'text-diplomatic-200' : 'text-diplomatic-400 group-hover:text-diplomatic-200'}`} />
                  <span>{item.label}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-diplomatic-200 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-3 py-2 mt-8 text-[10px] font-bold text-diplomatic-200 uppercase tracking-widest opacity-80">
            Account
          </div>
          <ul className="mt-1 space-y-1">
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-diplomatic-100 hover:bg-red-500/10 hover:text-red-200 hover:border hover:border-red-500/20 transition-all duration-200 group"
              >
                <LogOut size={18} className="mr-3 text-diplomatic-400 group-hover:text-red-300 transition-colors" />
                <span>Logout</span>
              </button>
            </li>
            <li>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-diplomatic-100 hover:bg-white/5 hover:text-white transition-all duration-200 group"
              >
                <Globe size={18} className="mr-3 text-diplomatic-400 group-hover:text-diplomatic-200 transition-colors" />
                <span>View Website</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* User Profile Snippet at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-sm border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-diplomatic-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-diplomatic-300 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-700 hover:text-diplomatic-600 mr-4"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-medium">{title}</h1>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

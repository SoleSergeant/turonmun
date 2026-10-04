
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole, ROLE_LABELS, AdminRole } from '@/hooks/useAdminRole';
import { adminPath } from '@/lib/adminPath';
import { getCurrentSeason } from '@/lib/season';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Mail,
  LogOut,
  Menu,
  X,
  Globe,
  ClipboardList,
  Shield,
  BarChart3,
  Map,
  Award,
  Home,
  QrCode,
  Heart,
  UserCog,
  History,
  CalendarRange,
  LucideIcon,
} from 'lucide-react';

type NavItem = { path: string; label: string; icon: LucideIcon; roles: NonNullable<AdminRole>[] };

const SG: NonNullable<AdminRole>[] = ['sg'];
const ACADEMIC: NonNullable<AdminRole>[] = ['sg', 'academics'];

// One place that decides who sees what. Keep in sync with the allow lists
// on the routes in App.tsx (and the database policies in migration 036).
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['sg', 'academics', 'logistics'] }],
  },
  {
    group: 'People',
    items: [
      { path: '/applications', label: 'Applications', icon: FileText, roles: ACADEMIC },
      { path: '/delegates', label: 'Delegates', icon: Users, roles: ACADEMIC },
      { path: '/chairs', label: 'Chairs', icon: Shield, roles: ACADEMIC },
      { path: '/volunteers', label: 'Volunteers', icon: Heart, roles: ['sg', 'logistics'] },
    ],
  },
  {
    group: 'Conference',
    items: [
      { path: '/committees', label: 'Committees', icon: Globe, roles: ACADEMIC },
      { path: '/allocation', label: 'Allocation', icon: Map, roles: ACADEMIC },
      { path: '/schedule', label: 'Schedule', icon: Calendar, roles: ACADEMIC },
      { path: '/resources', label: 'Resources', icon: FileText, roles: ACADEMIC },
      { path: '/awards', label: 'Awards', icon: Award, roles: ACADEMIC },
      { path: '/check-in', label: 'Check-in', icon: QrCode, roles: ['sg', 'academics', 'logistics', 'registration'] },
    ],
  },
  {
    group: 'Site',
    items: [
      { path: '/content', label: 'Site content', icon: Home, roles: SG },
      { path: '/forms', label: 'Forms', icon: ClipboardList, roles: SG },
      { path: '/messages', label: 'Messages', icon: Mail, roles: SG },
    ],
  },
  {
    group: 'Insights',
    items: [{ path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ACADEMIC }],
  },
  {
    group: 'Administration',
    items: [
      { path: '/accounts', label: 'Admin accounts', icon: UserCog, roles: SG },
      { path: '/seasons', label: 'Seasons', icon: CalendarRange, roles: SG },
      { path: '/activity', label: 'Activity log', icon: History, roles: SG },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, fullName, loading: roleLoading } = useAdminRole();
  const displayName = fullName || 'Admin';

  const isRealAdminSubdomain = window.location.hostname.startsWith('admin.');
  const [seasonName, setSeasonName] = useState<string | null>(null);

  useEffect(() => {
    getCurrentSeason().then(season => setSeasonName(season?.name ?? null));
  }, []);

  // While the role is still loading, render no nav items so a restricted
  // role never sees a flash of pages it can't open.
  const navGroups = roleLoading || !role
    ? []
    : NAV
        .map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(role)) }))
        .filter(g => g.items.length > 0);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate(isRealAdminSubdomain ? '/' : '/?subdomain=admin');
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
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gradient-to-b from-diplomatic-900 to-diplomatic-800 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
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
              <span className="block text-xs text-diplomatic-200 font-medium tracking-wider uppercase">
                Admin Panel{seasonName ? ` · ${seasonName}` : ''}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto pb-4">
          {navGroups.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <div className="px-3 py-1.5 text-[10px] font-bold text-diplomatic-200 uppercase tracking-widest opacity-80">
                {group}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={adminPath(item.path)}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${active
                            ? 'bg-white/10 text-white shadow-sm border border-white/5'
                            : 'text-diplomatic-100 hover:bg-white/5 hover:text-white hover:translate-x-1'
                          }`}
                      >
                        <item.icon size={18} className={`mr-3 transition-colors ${active ? 'text-diplomatic-200' : 'text-diplomatic-400 group-hover:text-diplomatic-200'}`} />
                        <span>{item.label}</span>
                        {active && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-diplomatic-200 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="px-3 py-1.5 mt-4 text-[10px] font-bold text-diplomatic-200 uppercase tracking-widest opacity-80">
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
        <div className="shrink-0 p-4 bg-black/20 backdrop-blur-sm border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-diplomatic-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
              {(displayName?.charAt(0) || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-diplomatic-300 truncate">
                {role ? ROLE_LABELS[role] : 'Admin'}
              </p>
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

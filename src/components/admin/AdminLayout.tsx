
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole, ROLE_LABELS, AdminRole } from '@/hooks/useAdminRole';
import { adminPath } from '@/lib/adminPath';
import { getCurrentSeason } from '@/lib/season';
import { ConfirmHost } from '@/components/admin/ConfirmDialog';
import { confirmLeave } from '@/hooks/useUnsavedChanges';
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
  Mic,
  Swords,
  Gavel,
  UsersRound,
  ScrollText,
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
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['sg', 'academics', 'logistics'] },
      { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ACADEMIC },
    ],
  },
  {
    group: 'People',
    items: [
      { path: '/delegates', label: 'Delegates', icon: Users, roles: ACADEMIC },
      { path: '/chairs', label: 'Chairs', icon: Shield, roles: ACADEMIC },
      { path: '/volunteers', label: 'Volunteers', icon: Heart, roles: ['sg', 'logistics'] },
    ],
  },
  {
    group: 'Turon Debate',
    items: [
      { path: '/debate', label: 'Registrations', icon: Mic, roles: ACADEMIC },
      { path: '/debate-day', label: 'Debate day', icon: Swords, roles: ACADEMIC },
      { path: '/judging', label: 'Judging', icon: Gavel, roles: ['sg', 'academics', 'judge'] },
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
      { path: '/certificates', label: 'Certificates', icon: ScrollText, roles: ACADEMIC },
      { path: '/check-in', label: 'Check-in', icon: QrCode, roles: ['sg', 'academics', 'logistics', 'registration'] },
    ],
  },
  {
    group: 'Site',
    items: [
      { path: '/content', label: 'Site content', icon: Home, roles: SG },
      { path: '/team', label: 'Team', icon: UsersRound, roles: SG },
      { path: '/forms', label: 'Forms', icon: ClipboardList, roles: SG },
      { path: '/messages', label: 'Messages', icon: Mail, roles: SG },
    ],
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
    if (!(await confirmLeave())) return;
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
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r border-gray-200 text-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl lg:shadow-none flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-panel-700 rounded-lg flex items-center justify-center">
              <img
                src="/logos/turonmun-logo-320.png"
                alt="TuronMUN Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <span className="block text-base font-semibold tracking-tight text-gray-900">TuronMUN</span>
              <span className="block text-xs text-gray-500">
                Admin panel{seasonName ? ` · ${seasonName}` : ''}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="lg:hidden text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto pb-4">
          {navGroups.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {group}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={adminPath(item.path)}
                        onClick={async (e) => {
                          // Ask before leaving a page with unsaved edits
                          // (new-tab clicks open normally).
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                          e.preventDefault();
                          if (!(await confirmLeave())) return;
                          setSidebarOpen(false);
                          navigate(adminPath(item.path));
                        }}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${active
                            ? 'bg-panel-50 text-panel-800'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <item.icon size={18} className={`mr-3 transition-colors ${active ? 'text-panel-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Account
          </div>
          <ul className="mt-1 space-y-0.5">
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
              >
                <LogOut size={18} className="mr-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                <span>Logout</span>
              </button>
            </li>
            <li>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
              >
                <Globe size={18} className="mr-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span>View Website</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* User Profile Snippet at Bottom */}
        <div className="shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-panel-100 flex items-center justify-center text-xs font-semibold text-panel-700">
              {(displayName?.charAt(0) || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">
                {role ? ROLE_LABELS[role] : 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="lg:hidden text-gray-700 hover:text-panel-600 mr-4"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
      <ConfirmHost />
    </div>
  );
};

export default AdminLayout;

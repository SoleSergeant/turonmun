
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole, ROLE_LABELS } from '@/hooks/useAdminRole';
import { adminPath } from '@/lib/adminPath';
import { getCurrentSeason, inSeason } from '@/lib/season';
import { ConfirmHost } from '@/components/admin/ConfirmDialog';
import { confirmLeave } from '@/hooks/useUnsavedChanges';
import { PROJECT_KEY, SHARED, locate, readProject, visibleGroups, visibleProjects, type BadgeKey, type NavGroup, type ProjectId } from '@/lib/adminNav';
import {
  Award, Calendar, Gavel, Globe, Home, LogOut, Mail, Menu, Mic, Monitor, QrCode, ScrollText, Settings, Swords, Users, X,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  home: Home, users: Users, globe: Globe, calendar: Calendar, qr: QrCode, award: Award, mail: Mail,
  mic: Mic, swords: Swords, gavel: Gavel, scroll: ScrollText, monitor: Monitor, settings: Settings,
};

// ── Menu badges: things waiting for someone ─────────────────────────────
// shortcut: counts are cached for a minute across page changes, so a badge can
// lag a decision by up to 60 s; refetch on the change itself if that ever matters.
type Counts = Partial<Record<BadgeKey, number>>;
let countCache: { at: number; data: Counts } | null = null;
async function fetchCounts(): Promise<Counts> {
  if (countCache && Date.now() - countCache.at < 60_000) return countCache.data;
  const season = await getCurrentSeason();
  const head = { count: 'exact' as const, head: true };
  const pending = 'status.is.null,status.eq.pending';
  const [apps, vols, debaters, messages] = await Promise.all([
    inSeason(supabase.from('applications').select('id', head), season).or(pending),
    inSeason(supabase.from('volunteer_applications').select('id', head), season).eq('status', 'pending'),
    supabase.from('debate_registrations').select('id', head).eq('status', 'pending'),
    supabase.from('contact_messages').select('id', head).is('responded_at', null),
  ]);
  // A role that can't read a table gets an error or 0, never someone else's count.
  const n = (r: { count: number | null; error: unknown }) => (r.error ? 0 : r.count ?? 0);
  const data = { applications: n(apps) + n(vols), debaters: n(debaters), messages: n(messages) };
  countCache = { at: Date.now(), data };
  return data;
}

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
  const [counts, setCounts] = useState<Counts>(countCache?.data ?? {});

  useEffect(() => {
    getCurrentSeason().then(season => setSeasonName(season?.name ?? null));
  }, []);
  useEffect(() => {
    if (role) fetchCounts().then(setCounts).catch(() => {});
  }, [role, location.pathname]);

  // While the role is still loading, render no menu so a restricted role
  // never sees a flash of pages it can't open.
  const ready = !roleLoading && !!role;
  const projects = ready ? visibleProjects(role) : [];
  const here = locate(location.pathname, readProject());
  const projectId: ProjectId = projects.some(p => p.id === here?.project) ? here!.project
    : projects.some(p => p.id === readProject()) ? readProject() : projects[0]?.id ?? 'mun';
  const project = projects.find(p => p.id === projectId);
  const shared = ready ? visibleGroups(SHARED, role) : [];
  const group = here ? [...(project?.groups ?? []), ...shared].find(g => g.id === here.group.id) : undefined;

  useEffect(() => {
    try { sessionStorage.setItem(PROJECT_KEY, projectId); } catch { /* private mode: falls back to TuronMUN */ }
  }, [projectId]);

  // Ask before leaving a page with unsaved edits (new-tab clicks open normally).
  const go = async (e: React.MouseEvent, path: string, nextProject?: ProjectId) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (!(await confirmLeave())) return;
    if (nextProject) { try { sessionStorage.setItem(PROJECT_KEY, nextProject); } catch { /* ignore */ } }
    setSidebarOpen(false);
    navigate(adminPath(path));
  };

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

  const navLink = (g: NavGroup) => {
    const Icon = ICONS[g.icon] ?? Home;
    const active = group?.id === g.id;
    const count = g.badge ? counts[g.badge] ?? 0 : 0;
    return (
      <li key={g.id}>
        <Link
          to={adminPath(g.tabs[0].path)}
          onClick={e => go(e, g.tabs[0].path)}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${active
              ? 'bg-panel-50 text-panel-800'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
          <Icon size={18} className={`mr-3 transition-colors ${active ? 'text-panel-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
          <span>{g.label}</span>
          {count > 0 && (
            <span className="ml-auto rounded-full bg-panel-100 px-2 text-xs font-semibold tabular-nums text-panel-800" aria-label={`${count} waiting`}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      </li>
    );
  };

  const tabs = group && group.tabs.length > 1 ? group.tabs : [];

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
              <span className="block text-base font-semibold tracking-tight text-gray-900">{project?.label ?? 'TuronMUN'}</span>
              <span className="block text-xs text-gray-500">
                Admin panel{seasonName && projectId === 'mun' ? ` · ${seasonName}` : ''}
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

        <nav className="mt-3 px-3 flex-1 overflow-y-auto pb-4" aria-label="Admin menu">
          {projects.length > 1 && (
            <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="Project">
              {projects.map(p => (
                <a
                  key={p.id}
                  href={adminPath(p.groups[0].tabs[0].path)}
                  onClick={e => go(e, p.groups[0].tabs[0].path, p.id)}
                  aria-current={p.id === projectId ? 'true' : undefined}
                  className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold transition-colors ${p.id === projectId
                      ? 'bg-white text-panel-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  {p.label}
                </a>
              ))}
            </div>
          )}

          <ul className="space-y-0.5">
            {(project?.groups ?? []).map(navLink)}
          </ul>

          {shared.length > 0 && (
            <ul className="mt-3 space-y-0.5 border-t border-gray-200 pt-3">
              {shared.map(navLink)}
            </ul>
          )}

          <ul className="mt-3 space-y-0.5 border-t border-gray-200 pt-3">
            <li>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
              >
                <Globe size={18} className="mr-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span>View website</span>
              </a>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
              >
                <LogOut size={18} className="mr-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                <span>Log out</span>
              </button>
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
        {/* Header: the menu item's name, and its pages as tabs */}
        <header className="bg-white border-b border-gray-200 z-10">
          <div className={`flex items-center px-4 ${tabs.length ? 'pt-4 pb-2' : 'py-4'}`}>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden text-gray-700 hover:text-panel-600 mr-4"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{group?.label ?? title}</h1>
          </div>
          {tabs.length > 0 && (
            <nav className="flex gap-1 overflow-x-auto px-4" aria-label={`${group!.label} pages`}>
              {tabs.map(t => {
                const active = location.pathname === t.path;
                return (
                  <Link
                    key={t.path}
                    to={adminPath(t.path)}
                    onClick={e => go(e, t.path)}
                    aria-current={active ? 'page' : undefined}
                    className={`whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors ${active
                        ? 'border-panel-600 font-medium text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                      }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          )}
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

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Users, Calendar, FileText, Home, LogOut, Gavel, Award, Megaphone, Menu, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChairNavItem {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const isChairSubdomain = window.location.hostname.startsWith('chair.');
const at = (sub: string) => (isChairSubdomain ? `/${sub || 'dashboard'}` : `/chair-dashboard${sub ? `/${sub}` : ''}`);

const NAV: ChairNavItem[] = [
  { id: 'overview', label: 'Overview', subtitle: 'Your committee at a glance', icon: Home, path: at('') },
  { id: 'command', label: 'MUN Command', subtitle: 'Run the session: roll call, speakers, motions and votes', icon: Gavel, path: at('command') },
  { id: 'announcements', label: 'Announcements', subtitle: 'Messages your delegates see on their dashboard', icon: Megaphone, path: at('announcements') },
  { id: 'papers', label: 'Position papers', subtitle: 'Read and grade submitted papers', icon: FileText, path: at('papers') },
  { id: 'awards', label: 'Awards', subtitle: "Pick your committee's award winners", icon: Award, path: at('awards') },
  { id: 'schedule', label: 'Schedule', subtitle: 'Conference sessions and events', icon: Calendar, path: at('schedule') },
  { id: 'delegates', label: 'Delegates', subtitle: 'Who is seated in your committee', icon: Users, path: at('delegates') },
];

// Chairs only see what they need to run a committee: no contact, payment or emergency details.
const DELEGATE_COLUMNS = 'id, full_name, institution, assigned_committee_id, status, checked_in_at';

export default function ChairDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [committees, setCommittees] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [positionPapers, setPositionPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noCommittee, setNoCommittee] = useState(false);
  const [chairName, setChairName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('full_name, committee_id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
        if (adminError) throw adminError;

        setChairName((adminUser as any)?.full_name || '');
        // Always scoped to the chair's own committee, even for SG accounts.
        const committeeId: string | null = (adminUser as any)?.committee_id ?? null;
        if (!committeeId) { setNoCommittee(true); return; }

        const [c, apps, papers, seats] = await Promise.all([
          supabase.from('committees').select('*').eq('id', committeeId),
          supabase.from('applications').select(DELEGATE_COLUMNS).eq('status', 'approved').eq('assigned_committee_id', committeeId),
          supabase.from('position_papers').select('*').eq('committee_id', committeeId),
          (supabase.from('country_assignments') as any).select('application_id, country, country_name').eq('committee_id', committeeId),
        ]);
        const failed = [c, apps, papers].find(r => r.error);
        if (failed) throw failed.error;

        const countryOf: Record<string, string> = {};
        ((seats.data || []) as any[]).forEach(s => { countryOf[s.application_id] = s.country_name || s.country || ''; });
        setCommittees(c.data || []);
        setApplications(((apps.data || []) as any[]).map(a => ({ ...a, assigned_country: countryOf[a.id] || '' })));
        setPositionPapers(papers.data || []);
      } catch (err: any) {
        setError(err?.message || 'Could not load your committee.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const active = NAV.find(item => location.pathname === item.path)
    ?? NAV.find(item => item.id !== 'overview' && location.pathname.startsWith(item.path))
    ?? NAV[0];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(isChairSubdomain ? '/' : '/chair-login');
  };

  const assignedDelegates = applications;
  // A paper counts as "submitted" once it leaves draft (submitted / reviewed / approved / needs_revision).
  const submittedPapers = positionPapers.filter(p => p.status && p.status !== 'draft').length;
  const toReview = positionPapers.filter(p => p.status === 'submitted').length;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-semibold text-white">{chairName || 'Committee chair'}</p>
        <p className="text-sm text-white/60">{committees[0]?.name || 'Committee chair'}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Chair dashboard">
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = item.id === active.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-gold-400/15 text-gold-300' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.id === 'papers' && toReview > 0 && (
                <span className="rounded-full bg-gold-400 px-2 py-0.5 text-xs font-semibold text-diplomatic-950" aria-label={`${toReview} to review`}>{toReview}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-red-400/10 hover:text-red-300">
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-diplomatic-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-diplomatic-900 lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} aria-hidden />
          <aside className="relative h-full w-72 max-w-[85%] border-r border-white/10 bg-diplomatic-900">
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-2 text-white/70 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-diplomatic-950/95 px-4 py-3 md:px-8 md:py-4">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-white md:text-2xl">{active.label}</h1>
            <p className="hidden text-sm text-white/60 sm:block">{active.subtitle}</p>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {error && (
            <p className="mb-6 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error} Reload the page to try again.
            </p>
          )}
          {noCommittee && (
            <p className="mb-6 rounded-lg border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-100">
              You haven't been assigned a committee yet. Ask the Secretariat to assign you, then reload this page.
            </p>
          )}
          <Outlet context={{ committees, applications, positionPapers, setPositionPapers, loading, assignedDelegates, submittedPapers, noCommittee }} />
        </main>
      </div>
    </div>
  );
}

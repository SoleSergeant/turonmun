import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight, ExternalLink, Gavel, History, Loader2, Mic, Swords, type LucideIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useContent } from '@/content/store';
import { adminPath } from '@/lib/adminPath';
import { DEBATE_SITE_URL } from '@/pages/debate/paths';
import { useDebateRegistrationOpen } from '@/pages/debate/DebateLayout';

interface Snapshot {
  byStatus: Record<string, number>;
  teams: number;
  judgesScored: number;
  scoredAt: string | null;
  savedAt: string | null;
}

/** Turon Debate → Home: what's waiting, the numbers, and the event details. */
export default function DebateHome() {
  const debate = useContent('debate');
  const registration = useDebateRegistrationOpen();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [regs, teams, scores, saved] = await Promise.all([
        supabase.from('debate_registrations').select('status'),
        supabase.from('debate_teams').select('id', { count: 'exact', head: true }),
        supabase.from('debate_scores').select('judge_id, updated_at').order('updated_at', { ascending: false }),
        supabase.from('participations').select('created_at').eq('role', 'debater').order('created_at', { ascending: false }).limit(1),
      ]);
      if (regs.error) { setError(regs.error.message); return; }
      const byStatus: Record<string, number> = {};
      for (const r of regs.data ?? []) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      setSnap({
        byStatus,
        teams: teams.count ?? 0,
        judgesScored: new Set((scores.data ?? []).map(s => s.judge_id)).size,
        scoredAt: scores.data?.[0]?.updated_at ?? null,
        savedAt: saved.data?.[0]?.created_at ?? null,
      });
    })();
  }, []);

  const s = snap?.byStatus ?? {};
  const total = Object.values(s).reduce((a, b) => a + b, 0);
  const todos: { key: string; count: number; title: string; hint: string; path: string; icon: LucideIcon }[] = snap ? [
    { key: 'review', count: s.pending ?? 0, title: 'Registrations to review', hint: 'Accept, waitlist or reject (select several to do it at once)', path: '/debate', icon: Mic },
    { key: 'teams', count: (s.approved ?? 0) && !snap.teams ? s.approved : 0, title: 'Accepted debaters without teams', hint: 'Add teams and shuffle debaters into them', path: '/debate-day', icon: Swords },
    { key: 'history', count: snap.scoredAt && (!snap.savedAt || snap.scoredAt > snap.savedAt) ? (s.approved ?? 0) : 0, title: 'Results not saved to history', hint: 'Judges have scored: Event day → Results → Save to history', path: '/debate-day', icon: History },
  ] : [];
  const open = todos.filter(t => t.count > 0);
  const done = todos.filter(t => t.count === 0);
  const details = (debate.info ?? []) as { label: string; value: string }[];

  return (
    <AdminLayout title="Turon Debate">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <h3 className="mb-1 flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" /> Couldn't load Turon Debate</h3>
          <p className="text-sm">{error}</p>
        </div>
      ) : !snap ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-panel-600" /></div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{debate.name || 'Turon Debate'}</h2>
              <p className="text-gray-600">
                {details.map(d => `${d.label}: ${d.value}`).join(' · ') || 'Add the date and venue in Debate website.'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Registration is {registration.open ? 'open' : 'closed'}
                {registration.deadline ? ` · deadline ${registration.deadline.toLocaleString()}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={DEBATE_SITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <ExternalLink className="h-4 w-4" /> Open debate site
              </a>
              <Link to={adminPath('/judging')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Gavel className="h-4 w-4" /> Judges' panel
              </Link>
            </div>
          </div>

          <section aria-labelledby="dtodo" className="rounded-xl border bg-white shadow-sm">
            <h3 id="dtodo" className="border-b px-5 py-3 font-semibold text-gray-900">To do</h3>
            {open.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {open.map(t => (
                  <li key={t.key}>
                    <Link to={adminPath(t.path)} className="group flex items-center gap-4 px-5 py-3 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none">
                      <span className="w-10 shrink-0 text-right text-xl font-semibold tabular-nums text-gray-900">{t.count}</span>
                      <t.icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-gray-900">{t.title}</span>
                        <span className="block text-sm text-gray-500">{t.hint}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-panel-600" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {done.length > 0 && (
              <p className={`flex items-start gap-2 px-5 py-3 text-sm text-gray-500 ${open.length ? 'border-t' : ''}`}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                <span><span className="font-medium text-gray-700">All clear:</span> {done.map(t => t.title.toLowerCase()).join(', ')}.</span>
              </p>
            )}
          </section>

          <section aria-label="Numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Registered', total], ['Pending', s.pending ?? 0], ['Accepted', s.approved ?? 0],
              ['Waitlisted', s.waitlisted ?? 0], ['Teams', snap.teams], ['Judges scored', snap.judgesScored],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

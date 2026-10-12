import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Shield,
  UserCheck,
  LucideIcon,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import { adminPath } from '@/lib/adminPath';
import { isChairApplication } from '@/lib/applications';
import { getCurrentSeason, inSeason } from '@/lib/season';
import DashboardStats, { type DelegateRow, type StatRow } from '@/components/admin/DashboardStats';

type Role = NonNullable<AdminRole>;

interface Todo {
  key: string;
  count: number | null;       // null = not available (e.g. migration not applied)
  title: string;
  hint: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

// null = couldn't be counted (query failed or migration not applied); never shown as "all clear".
interface Snapshot {
  pendingReview: number;
  decisionsUnsent: number | null;
  unpaid: number;
  paidNoSeat: number | null;
  seatsUnannounced: number | null;
  pendingChairs: number;
  pendingVolunteers: number | null;
  unansweredMessages: number | null;
}

interface Stats {
  delegates: DelegateRow[];
  chairs: StatRow[];
  volunteers: StatRow[];
  debaters: StatRow[] | null;
}

const ACADEMIC: Role[] = ['sg', 'academics'];
const STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Accepted', rejected: 'Rejected', waitlisted: 'Waitlisted' };

const APP_COLUMNS = 'id, status, payment_status, payment_amount, assigned_committee_id, application_type, checked_in_at, created_at';

/** Runs a select; when an optional column is missing (migration not applied) retries without it. */
async function selectWithOptional(table: string, base: string, optional: string, season: Awaited<ReturnType<typeof getCurrentSeason>>) {
  const run = (cols: string) => inSeason((supabase.from(table as any) as any).select(cols), season);
  const first = await run(`${base}, ${optional}`);
  if (!first.error) return { rows: (first.data || []) as any[], hasOptional: true };
  const second = await run(base);
  if (second.error) throw second.error;
  return { rows: (second.data || []) as any[], hasOptional: false };
}

const AdminDashboard = () => {
  const { role, fullName, loading: roleLoading } = useAdminRole();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const season = await getCurrentSeason();
        const [apps, seats, messages, volunteers, recentApps, debate] = await Promise.all([
          selectWithOptional('applications', APP_COLUMNS, 'decision_emailed_at', season),
          (async () => {
            const r = await (supabase.from('country_assignments') as any).select('application_id, notified_at');
            if (!r.error) return { rows: (r.data || []) as any[], hasOptional: true };
            const r2 = await (supabase.from('country_assignments') as any).select('application_id');
            return { rows: (r2.data || []) as any[], hasOptional: false, failed: !!r2.error };
          })(),
          (supabase.from('contact_messages') as any).select('id, responded_at'),
          inSeason((supabase.from('volunteer_applications') as any).select('id, status, created_at'), season),
          inSeason(supabase.from('applications').select('id, full_name, institution, status, created_at, notes, application_type'), season)
            .order('created_at', { ascending: false })
            .limit(6),
          (supabase.from('debate_registrations' as any) as any).select('status, created_at'),
        ]);

        const delegates = apps.rows.filter(a => !isChairApplication(a));
        const chairs = apps.rows.filter(a => isChairApplication(a));
        const approved = delegates.filter(a => a.status === 'approved');
        const seatedIds = new Set(seats.rows.map(s => s.application_id));

        setSnap({
          pendingReview: delegates.filter(a => !a.status || a.status === 'pending').length,
          decisionsUnsent: apps.hasOptional
            ? delegates.filter(a => (a.status === 'approved' || a.status === 'rejected') && !a.decision_emailed_at).length
            : null,
          unpaid: approved.filter(a => a.payment_status !== 'paid').length,
          paidNoSeat: (seats as any).failed ? null : approved.filter(a => a.payment_status === 'paid' && !seatedIds.has(a.id)).length,
          seatsUnannounced: seats.hasOptional ? seats.rows.filter(s => !s.notified_at).length : null,
          pendingChairs: chairs.filter(a => !a.status || a.status === 'pending').length,
          pendingVolunteers: volunteers.error ? null : ((volunteers.data || []) as any[]).filter(v => v.status === 'pending').length,
          unansweredMessages: messages.error ? null : ((messages.data || []) as any[]).filter(m => !m.responded_at).length,
        });
        setRecent((recentApps.data || []) as any[]);
        setStats({
          delegates: delegates.map(a => ({
            created_at: a.created_at, status: a.status, payment_status: a.payment_status, payment_amount: a.payment_amount,
            seated: seatedIds.has(a.id), checked_in: !!a.checked_in_at,
          })),
          chairs: chairs.map(a => ({ created_at: a.created_at, status: a.status })),
          volunteers: volunteers.error ? [] : (volunteers.data || []) as StatRow[],
          debaters: debate.error ? null : ((debate.data || []) as StatRow[]),
        });
      } catch (err: any) {
        setError(err.message || 'Could not load the dashboard');
      }
    })();
  }, []);

  const todos: Todo[] = snap ? [
    { key: 'review', count: snap.pendingReview, title: 'Applications to review', hint: 'Delegate applications waiting for a decision', path: '/delegates?stage=review', icon: UserCheck, roles: ACADEMIC },
    { key: 'decisions', count: snap.decisionsUnsent, title: 'Decision emails not sent', hint: 'Accepted or rejected, but not told yet', path: '/delegates', icon: Send, roles: ACADEMIC },
    { key: 'unpaid', count: snap.unpaid, title: 'Accepted but unpaid', hint: 'Send a payment reminder from Delegates', path: '/delegates?stage=unpaid', icon: CreditCard, roles: ACADEMIC },
    { key: 'seat', count: snap.paidNoSeat, title: 'Paid, no seat yet', hint: 'Ready to allocate', path: '/allocation', icon: MapPin, roles: ACADEMIC },
    { key: 'announce', count: snap.seatsUnannounced, title: 'Seats not announced', hint: 'Seated delegates who haven’t been emailed', path: '/allocation', icon: Mail, roles: ACADEMIC },
    { key: 'chairs', count: snap.pendingChairs, title: 'Chair applications', hint: 'Waiting for a decision', path: '/chairs', icon: Shield, roles: ACADEMIC },
    { key: 'volunteers', count: snap.pendingVolunteers, title: 'Volunteer applications', hint: 'Waiting for a decision', path: '/volunteers', icon: Heart, roles: ['sg', 'logistics'] },
    { key: 'messages', count: snap.unansweredMessages, title: 'Unanswered messages', hint: 'Contact form messages without a reply', path: '/messages', icon: MessageSquare, roles: ['sg'] },
  ] : [];

  const mine = role ? todos.filter(t => t.roles.includes(role)) : [];
  const open = mine.filter(t => (t.count ?? 0) > 0);
  const done = mine.filter(t => t.count === 0);
  // Decision/announce counts are null by design until their migrations run; only flag real failures.
  const unknown = mine.filter(t => t.count === null && t.key !== 'decisions' && t.key !== 'announce');
  const canSeeDelegates = !!role && ACADEMIC.includes(role);

  return (
    <AdminLayout title="Dashboard">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <h3 className="mb-1 flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" /> Couldn't load the dashboard</h3>
          <p className="text-sm">{error}</p>
        </div>
      ) : !snap || roleLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-diplomatic-600" /></div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Welcome{fullName ? `, ${fullName.split(' ')[0]}` : ''}</h2>
            <p className="text-gray-600">
              {open.length === 0 ? 'Nothing needs your attention right now.' : `${open.length} thing${open.length === 1 ? '' : 's'} need${open.length === 1 ? 's' : ''} attention.`}
            </p>
          </div>

          {(open.length > 0 || done.length > 0) && (
            <section aria-labelledby="todo-title" className="rounded-xl border bg-white shadow-sm">
              <h3 id="todo-title" className="border-b px-5 py-3 font-semibold text-gray-900">To do</h3>
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
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-diplomatic-600" aria-hidden />
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
          )}

          {unknown.length > 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              Couldn't count: {unknown.map(t => t.title.toLowerCase()).join(', ')}. Reload the page to try again.
            </p>
          )}

          {canSeeDelegates && stats && <DashboardStats {...stats} />}

          {canSeeDelegates && recent.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <h3 className="font-semibold text-gray-800">Latest applications</h3>
                <Link to={adminPath('/delegates')} className="text-sm text-diplomatic-600 hover:underline">All delegates</Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {recent.map(a => (
                  <li key={a.id}>
                    <Link
                      to={adminPath(isChairApplication(a) ? '/chairs' : `/delegates?open=${a.id}`)}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                    >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {a.full_name}
                        {isChairApplication(a) && <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Chair</span>}
                      </p>
                      <p className="truncate text-xs text-gray-500">{a.institution}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${
                        a.status === 'approved' ? 'bg-green-100 text-green-700'
                        : a.status === 'rejected' ? 'bg-red-100 text-red-700'
                        : a.status === 'waitlisted' ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}>{STATUS_LABEL[a.status || 'pending'] ?? a.status}</span>
                    </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;

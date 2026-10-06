import React, { useEffect, useMemo, useState } from 'react';
import { History, Loader2, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface Entry {
  id: number;
  created_at: string;
  actor_email: string | null;
  actor_name: string | null;
  action: string;
  entity: string;
  summary: string;
}

const PAGE = 100;

const AREAS: { key: string; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'application', label: 'Applications' },
  { key: 'seat', label: 'Seats' },
  { key: 'email', label: 'Emails' },
  { key: 'admin_user', label: 'Accounts' },
  { key: 'volunteer', label: 'Volunteers' },
  { key: 'debate', label: 'Turon Debate' },
  { key: 'season', label: 'Seasons' },
];

const ACTION_TONE: Record<string, string> = {
  deleted: 'bg-red-100 text-red-700',
  seat_removed: 'bg-red-100 text-red-700',
  account_deleted: 'bg-red-100 text-red-700',
  account_disabled: 'bg-red-100 text-red-700',
  email_sent: 'bg-blue-100 text-blue-700',
  seat_assigned: 'bg-purple-100 text-purple-700',
  payment_changed: 'bg-amber-100 text-amber-700',
  season_started: 'bg-green-100 text-green-700',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Who changed what (SG only). Rows are written by database triggers. */
const ActivityLog = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [area, setArea] = useState('all');
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const load = async (append = false) => {
    setLoading(true);
    let q = (supabase.from('activity_log' as any) as any)
      .select('id, created_at, actor_email, actor_name, action, entity, summary')
      .order('created_at', { ascending: false })
      .limit(PAGE);
    if (area !== 'all') q = q.eq('entity', area);
    if (append && entries.length > 0) q = q.lt('created_at', entries[entries.length - 1].created_at);
    const { data, error } = await q;
    if (error) {
      setMissing(true);
      setLoading(false);
      return;
    }
    const rows = (data || []) as Entry[];
    setEntries(prev => (append ? [...prev, ...rows] : rows));
    setHasMore(rows.length === PAGE);
    setLoading(false);
  };

  useEffect(() => { load(); }, [area]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(e =>
      e.summary.toLowerCase().includes(q) ||
      (e.actor_name || '').toLowerCase().includes(q) ||
      (e.actor_email || '').toLowerCase().includes(q),
    );
  }, [entries, search]);

  return (
    <AdminLayout title="Activity Log">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Activity log</h2>
          <p className="text-gray-600">Status, payment, seat, account and email changes, and who made them.</p>
        </div>

        {missing ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            The activity log isn't set up yet. Run <code className="font-mono">supabase/migrations/038_activity_log_and_email.sql</code> first.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search names or changes…"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4"
                />
              </div>
              <select value={area} onChange={e => setArea(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {AREAS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              {shown.length === 0 && !loading ? (
                <div className="flex flex-col items-center py-12 text-gray-500">
                  <History className="mb-2 h-8 w-8 text-gray-300" />
                  Nothing recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {shown.map(e => (
                    <li key={e.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                      <span className="w-32 shrink-0 text-xs text-gray-500">{when(e.created_at)}</span>
                      <span className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACTION_TONE[e.action] ?? 'bg-gray-100 text-gray-700'}`}>
                        {e.action.replace(/_/g, ' ')}
                      </span>
                      <span className="flex-1 text-sm text-gray-900">{e.summary}</span>
                      <span className="shrink-0 text-xs text-gray-500" title={e.actor_email ?? undefined}>
                        {e.actor_name || e.actor_email || 'system / applicant'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>}
            </div>

            {hasMore && !loading && (
              <div className="flex justify-center">
                <button onClick={() => load(true)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50">
                  Load older
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ActivityLog;

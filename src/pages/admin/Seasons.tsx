import React, { useEffect, useState } from 'react';
import { CalendarRange, Download, Loader2, Archive, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { resetSeasonCache } from '@/lib/season';

interface SeasonRow {
  number: number;
  name: string;
  is_current: boolean;
  created_at: string;
  archived_at: string | null;
}

interface SeasonStats {
  applications: number;
  approved: number;
  volunteers: number;
}

const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * Seasons (SG only). Starting a season archives the outgoing season's seats,
 * awards and announcements and deactivates chair accounts — applications are
 * never deleted, they stay filed under their season.
 */
const Seasons = () => {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [stats, setStats] = useState<Record<number, SeasonStats>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [starting, setStarting] = useState(false);
  const [exporting, setExporting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('seasons' as any) as any)
      .select('*')
      .order('number', { ascending: false });
    if (error) {
      setMissing(true);
      setLoading(false);
      return;
    }
    const rows = (data || []) as SeasonRow[];
    setSeasons(rows);

    const entries = await Promise.all(rows.map(async (s) => {
      const count = (q: any) => q.then((r: any) => r.count ?? 0);
      const [applications, approved, volunteers] = await Promise.all([
        count((supabase.from('applications') as any).select('id', { count: 'exact', head: true }).eq('season', s.number)),
        count((supabase.from('applications') as any).select('id', { count: 'exact', head: true }).eq('season', s.number).eq('status', 'approved')),
        count((supabase.from('volunteer_applications') as any).select('id', { count: 'exact', head: true }).eq('season', s.number)),
      ]);
      return [s.number, { applications, approved, volunteers }] as const;
    }));
    setStats(Object.fromEntries(entries));

    const current = rows.find(r => r.is_current);
    if (current) setNewNumber(String(current.number + 1));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const current = seasons.find(s => s.is_current);
  const n = parseInt(newNumber, 10);
  const valid = Number.isInteger(n) && (!current || n > current.number);
  const confirmPhrase = valid ? `START SEASON ${n}` : '';

  const startSeason = async () => {
    if (!valid || confirmText !== confirmPhrase) return;
    setStarting(true);
    try {
      const { error } = await (supabase.rpc as any)('start_new_season', { p_number: n, p_name: newName.trim() || null });
      if (error) throw error;
      resetSeasonCache();
      toast({ title: `Season ${n} started`, description: 'The previous season has been archived.' });
      setConfirmText('');
      setNewName('');
      await load();
    } catch (err: any) {
      toast({ title: 'Could not start the season', description: err.message, variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const exportSeason = async (season: SeasonRow) => {
    setExporting(season.number);
    try {
      const { data, error } = await (supabase.from('applications') as any)
        .select('*')
        .eq('season', season.number)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const { exportApplicationsToExcel } = await import('@/utils/excelExport');
      exportApplicationsToExcel(data || [], `TuronMUN_${season.name.replace(/\s+/g, '_')}_Applications`);
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout title="Seasons">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Seasons</h2>
          <p className="text-gray-600">The admin panel shows the current season. Past seasons are kept, never deleted.</p>
        </div>

        {missing ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Seasons aren't set up yet. Run <code className="font-mono">supabase/migrations/039_seasons.sql</code> first.
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Season</th>
                    <th className="px-4 py-3">Applications</th>
                    <th className="px-4 py-3">Approved</th>
                    <th className="px-4 py-3">Volunteers</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {seasons.map(s => (
                    <tr key={s.number}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.name}
                        {s.is_current ? (
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Current</span>
                        ) : (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400"><Archive className="h-3 w-3" /> archived {s.archived_at ? formatDate(s.archived_at) : ''}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{stats[s.number]?.applications ?? '—'}</td>
                      <td className="px-4 py-3">{stats[s.number]?.approved ?? '—'}</td>
                      <td className="px-4 py-3">{stats[s.number]?.volunteers ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => exportSeason(s)}
                          disabled={exporting !== null}
                          className="inline-flex items-center gap-1 text-sm text-diplomatic-600 hover:underline disabled:opacity-50"
                        >
                          {exporting === s.number ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CalendarRange className="h-5 w-5 text-diplomatic-600" /> Start a new season
              </h3>
              <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
                <p className="mb-1 flex items-center gap-1 font-semibold"><AlertTriangle className="h-4 w-4" /> This will:</p>
                <ul className="ml-5 list-disc space-y-0.5">
                  <li>file {current ? current.name : 'the current season'} away — its applications stay, but leave the admin lists</li>
                  <li>archive all committee seats, awards and chair announcements</li>
                  <li>deactivate every chair / co-chair account (reassign them in Chairs)</li>
                  <li>unlock awards</li>
                </ul>
                <p className="mt-2">Committees, schedule, resources and forms are kept. Review them for the new season afterwards.</p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Season number</span>
                  <input
                    type="number"
                    value={newNumber}
                    onChange={e => { setNewNumber(e.target.value); setConfirmText(''); }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Name (optional)</span>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder={valid ? `Season ${n}` : ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>

              {valid ? (
                <label className="mt-4 block text-sm">
                  <span className="mb-1 block text-gray-700">Type <code className="rounded bg-gray-100 px-1 font-mono">{confirmPhrase}</code> to confirm</span>
                  <input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono"
                  />
                </label>
              ) : (
                <p className="mt-4 text-sm text-red-600">The new season number must be greater than {current?.number}.</p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={startSeason}
                  disabled={!valid || confirmText !== confirmPhrase || starting}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {starting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Start season {valid ? n : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Seasons;

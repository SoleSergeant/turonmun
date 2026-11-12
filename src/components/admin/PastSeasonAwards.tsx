import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Participation } from '@/lib/participations';

const AWARDS = ['Best Delegate', 'Best Speaker', 'Honorable Mention'];
const hasAward = (p: Participation, award: string) => (p.award ?? '').split(', ').includes(award);

/**
 * Awards for archived seasons. They only feed delegates' My History and the
 * admin "returning" badge; the public Awards page shows the current season.
 */
export default function PastSeasonAwards() {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<{ number: number; name: string }[]>([]);
  const [season, setSeason] = useState<number | null>(null);
  const [rows, setRows] = useState<Participation[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('seasons').select('number, name').eq('is_current', false).order('number', { ascending: false })
      .then(({ data }) => { setSeasons(data ?? []); setSeason(data?.[0]?.number ?? null); });
  }, []);

  const load = useCallback(async () => {
    if (season === null) return;
    const { data, error } = await supabase.from('participations').select('*')
      .eq('season', season).eq('role', 'delegate').not('committee', 'is', null).order('full_name');
    if (error) toast({ title: 'Could not load delegates', description: error.message, variant: 'destructive' });
    setRows(data ?? []);
  }, [season, toast]);
  useEffect(() => { load(); }, [load]);

  const byCommittee = useMemo(() => {
    const map = new Map<string, Participation[]>();
    for (const r of rows) {
      if (!map.has(r.committee!)) map.set(r.committee!, []);
      map.get(r.committee!)!.push(r);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const setAward = async (committee: string, award: string, participationId: string) => {
    if (season === null) return;
    setSaving(`${committee}|${award}`);
    const { error } = await supabase.rpc('set_past_award', {
      p_season: season, p_committee: committee, p_award: award, p_participation: participationId || null,
    });
    setSaving(null);
    if (error) { toast({ title: 'Could not save award', description: error.message, variant: 'destructive' }); return; }
    toast({ title: participationId ? `${award} saved` : `${award} cleared` });
    load();
  };

  if (seasons.length === 0) return null;

  return (
    <section className="space-y-4 border-t pt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" /> Past seasons
          </h2>
          <p className="text-gray-600 text-sm">
            Record awards from earlier conferences. They show in delegates' My History and on returning applications, not on the public Awards page.
          </p>
        </div>
        <select
          value={season ?? ''}
          onChange={e => setSeason(Number(e.target.value))}
          aria-label="Season"
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {seasons.map(s => <option key={s.number} value={s.number}>{s.name}</option>)}
        </select>
      </div>

      {byCommittee.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500 text-sm">No seated delegates recorded for this season.</div>
      ) : byCommittee.map(([committee, delegates]) => (
        <div key={committee} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 font-semibold text-gray-900">
            {committee} <span className="ml-1 text-xs font-normal text-gray-500">{delegates.length} delegates</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {AWARDS.map(award => {
              const key = `${committee}|${award}`;
              const winner = delegates.find(d => hasAward(d, award));
              return (
                <label key={award} className="block">
                  <span className="block text-xs font-bold uppercase tracking-wide text-amber-600 mb-1.5">🏆 {award}</span>
                  <select
                    value={winner?.id ?? ''}
                    disabled={saving === key}
                    onChange={e => setAward(committee, award, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">— Not set —</option>
                    {delegates.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}{d.country ? ` · ${d.country}` : ''}</option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

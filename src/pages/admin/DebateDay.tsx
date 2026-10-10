import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Shuffle, Loader2, Users, Swords, Trophy, Gavel } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import DebateResults from '@/components/admin/DebateResults';
import { confirmAction } from '@/components/admin/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/content/store';
import { adminPath } from '@/lib/adminPath';
import {
  type EventData, type Debater, loadEvent, generatePairings, nextSlot, seatLabel, TEAM_TONES,
} from '@/lib/debateEvent';

const table = (name: string) => supabase.from(name as any) as any;
type Tab = 'teams' | 'pairings' | 'results';

/** Admin → Debate day: teams, one-on-one pairings and live results (SG + Academics). */
export default function DebateDay() {
  const { toast } = useToast();
  const debate = useContent('debate');
  const [data, setData] = useState<EventData | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<Tab>('teams');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await loadEvent());
    } catch {
      setMissing(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Results change while judges score: refresh quietly every 15 s on that tab.
  useEffect(() => {
    if (tab !== 'results') return;
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15_000);
    return () => clearInterval(id);
  }, [tab, load]);

  const fail = (title: string, error: any) => toast({ title, description: error?.message, variant: 'destructive' });

  // ── Teams ───────────────────────────────────────────────────────────
  const addTeam = async () => {
    if (!data) return;
    const used = new Set(data.teams.map(t => t.label));
    const label = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(l => !used.has(l));
    if (!label) return;
    const { error } = await table('debate_teams').insert({ label });
    if (error) return fail('Could not add team', error);
    load();
  };

  const saveTeam = async (id: string, fields: { name?: string; position?: string }) => {
    const { error } = await table('debate_teams').update(fields).eq('id', id);
    if (error) return fail('Could not save team', error);
    setData(d => d && { ...d, teams: d.teams.map(t => (t.id === id ? { ...t, ...fields } : t)) });
  };

  const removeTeam = async (id: string, label: string) => {
    if (!(await confirmAction(`Delete team ${label}? Its members go back to unassigned, and its score sheets are deleted.`, { title: 'Delete team', danger: true }))) return;
    const { error } = await table('debate_teams').delete().eq('id', id);
    if (error) return fail('Could not delete team', error);
    load();
  };

  const assign = async (person: Debater, teamId: string) => {
    if (!data) return;
    const fields = teamId ? { team_id: teamId, slot: nextSlot(data.roster, teamId) } : { team_id: null, slot: null };
    const { error } = await table('debate_registrations').update(fields).eq('id', person.id);
    if (error) return fail('Could not move debater', error);
    setData(d => d && { ...d, roster: d.roster.map(r => (r.id === person.id ? { ...r, ...fields } : r)) });
  };

  // ── Pairings ────────────────────────────────────────────────────────
  const seated = useMemo(() => (data?.roster || []).filter(d => d.team_id), [data]);

  const generate = async () => {
    if (!data) return;
    if (seated.length < 2) { toast({ title: 'Put debaters in teams first' }); return; }
    if (data.pairings.length && !(await confirmAction('Replace the current pairings? Judges\' one-on-one votes for them are deleted too.', { title: 'New pairings', confirmLabel: 'Replace', danger: true }))) return;
    setBusy(true);
    try {
      const { pairs, bye } = generatePairings(seated);
      if (data.pairings.length) {
        const { error } = await table('debate_pairings').delete().in('id', data.pairings.map(p => p.id));
        if (error) throw error;
      }
      const { error } = await table('debate_pairings').insert(pairs.map(([a, b], i) => ({ round: 1, position: i, a_id: a.id, b_id: b.id })));
      if (error) throw error;
      await load();
      toast({ title: `${pairs.length} pairs created`, description: bye ? `${bye.full_name} sits this round out (odd number).` : undefined });
    } catch (err) {
      fail('Could not create pairings', err);
    } finally {
      setBusy(false);
    }
  };

  const editPair = async (id: string, side: 'a_id' | 'b_id', value: string) => {
    const { error } = await table('debate_pairings').update({ [side]: value }).eq('id', id);
    if (error) return fail('Could not change pair', error);
    load();
  };

  const addPair = async () => {
    if (!data || seated.length < 2) return;
    const { error } = await table('debate_pairings').insert({ round: 1, position: data.pairings.length, a_id: seated[0].id, b_id: seated[1].id });
    if (error) return fail('Could not add pair', error);
    load();
  };

  const removePair = async (id: string) => {
    if (!(await confirmAction('Remove this pair and its votes?', { title: 'Remove pair', confirmLabel: 'Remove', danger: true }))) return;
    const { error } = await table('debate_pairings').delete().eq('id', id);
    if (error) return fail('Could not remove pair', error);
    load();
  };

  // ── Render ──────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'teams', label: 'Teams', icon: Users },
    { key: 'pairings', label: 'One-on-one', icon: Swords },
    { key: 'results', label: 'Results', icon: Trophy },
  ];
  const input = 'w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-debate-blue/30';
  const inPairs = new Set((data?.pairings || []).flatMap(p => [p.a_id, p.b_id]));

  return (
    <AdminLayout title="Debate day">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Debate day</h2>
            <p className="text-gray-600">Teams, one-on-one pairings and live results for {debate.name}. Accepted debaters only.</p>
          </div>
          <Link to={adminPath('/judging')} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Gavel className="h-4 w-4" /> Open the judges' panel
          </Link>
        </div>

        {missing ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Debate day isn't set up yet. Run <code className="font-mono">supabase/migrations/045_debate_judging.sql</code> first.
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <>
            <div className="flex gap-2 border-b" role="tablist">
              {tabs.map(t => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); if (t.key === 'results') load(); }}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t.key ? 'border-debate-blue text-debate-blue' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            {tab === 'teams' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    {data.roster.length} accepted · {seated.length} in teams.{' '}
                    Debaters see their team only when <Link to={adminPath('/content')} className="text-debate-blue hover:underline">Site content → Turon Debate → Show teams to debaters</Link> is on
                    {debate.reveal_teams ? ' (it is).' : ' (it is off).'}
                  </p>
                  <button onClick={addTeam} className="inline-flex items-center gap-1.5 rounded-lg bg-debate-blue px-3 py-2 text-sm font-medium text-white hover:bg-debate-blue-700">
                    <Plus className="h-4 w-4" /> Add team
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {data.teams.map((t, i) => {
                    const members = data.roster.filter(d => d.team_id === t.id).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
                    return (
                      <div key={t.id} className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-white ${TEAM_TONES[i % 2]}`}>{t.label}</span>
                          <button onClick={() => removeTeam(t.id, t.label)} aria-label={`Delete team ${t.label}`} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <label className="block text-xs font-medium text-gray-500">Team name
                          <input defaultValue={t.name || ''} onBlur={e => e.target.value !== (t.name || '') && saveTeam(t.id, { name: e.target.value })} placeholder={`Team ${t.label}`} className={`${input} mt-1`} />
                        </label>
                        <label className="mt-2 block text-xs font-medium text-gray-500">Position / role
                          <input defaultValue={t.position || ''} onBlur={e => e.target.value !== (t.position || '') && saveTeam(t.id, { position: e.target.value })} placeholder="e.g. Government" className={`${input} mt-1`} />
                        </label>
                        <ul className="mt-3 space-y-1.5 border-t pt-3 text-sm">
                          {members.length === 0 && <li className="text-gray-400">No members yet</li>}
                          {members.map(m => (
                            <li key={m.id} className="flex items-center justify-between gap-2">
                              <span><span className="mr-1.5 font-mono text-xs text-gray-500">{t.label}{m.slot}</span>{m.full_name}</span>
                              <button onClick={() => assign(m, '')} className="text-xs text-gray-400 hover:text-red-600">Remove</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  {data.teams.length === 0 && <p className="text-sm text-gray-500 md:col-span-2">Add your teams (A, B, C, D …), then put debaters in them below.</p>}
                </div>

                <div className="rounded-xl border bg-white shadow-sm">
                  <h3 className="border-b px-5 py-3 font-semibold text-gray-900">Accepted debaters</h3>
                  {data.roster.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-gray-500">Nobody is accepted yet. Accept debaters in Turon Debate first.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {data.roster.map(d => (
                        <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 text-sm">
                          <span>
                            <span className="font-medium text-gray-900">{d.full_name}</span>
                            {d.institution && <span className="ml-2 text-xs text-gray-500">{d.institution}</span>}
                          </span>
                          <select value={d.team_id || ''} onChange={e => assign(d, e.target.value)} aria-label={`Team for ${d.full_name}`} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                            <option value="">No team</option>
                            {data.teams.map(t => <option key={t.id} value={t.id}>Team {t.label}{t.name ? ` · ${t.name}` : ''}</option>)}
                          </select>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === 'pairings' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">Pairs are made across teams. Change anyone with the drop-downs.</p>
                  <div className="flex gap-2">
                    <button onClick={addPair} disabled={seated.length < 2} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"><Plus className="h-4 w-4" /> Add pair</button>
                    <button onClick={generate} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-debate-blue px-3 py-2 text-sm font-medium text-white hover:bg-debate-blue-700 disabled:opacity-50">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />} {data.pairings.length ? 'Re-generate' : 'Generate pairings'}
                    </button>
                  </div>
                </div>
                {data.pairings.length === 0 ? (
                  <p className="rounded-xl border bg-white px-5 py-10 text-center text-sm text-gray-500">No pairings yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border bg-white shadow-sm">
                    {data.pairings.map((p, i) => (
                      <li key={p.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                        <span className="w-8 shrink-0 text-xs font-semibold text-gray-400">#{i + 1}</span>
                        {(['a_id', 'b_id'] as const).map((side, k) => (
                          <React.Fragment key={side}>
                            {k === 1 && <span className="text-center text-xs font-semibold uppercase text-gray-400">vs</span>}
                            <select value={p[side]} onChange={e => editPair(p.id, side, e.target.value)} className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                              {seated.map(d => <option key={d.id} value={d.id}>{seatLabel(d, data.teams)} · {d.full_name}</option>)}
                            </select>
                          </React.Fragment>
                        ))}
                        <button onClick={() => removePair(p.id)} aria-label="Remove pair" className="self-end rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 sm:self-auto"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
                {data.pairings.length > 0 && seated.some(d => !inPairs.has(d.id)) && (
                  <p className="text-sm text-amber-700">Not paired: {seated.filter(d => !inPairs.has(d.id)).map(d => d.full_name).join(', ')}</p>
                )}
              </div>
            )}

            {tab === 'results' && <DebateResults data={data} criteria={debate.judging_criteria} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

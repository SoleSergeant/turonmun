import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ClipboardList, Swords, Trophy, Printer } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import DebateResults from '@/components/admin/DebateResults';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useContent } from '@/content/store';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { confirmAction } from '@/components/admin/ConfirmDialog';
import { adminPath } from '@/lib/adminPath';
import {
  type EventData, type DebateTeam, type Criterion, loadEvent, seatLabel, sheetTotal, TEAM_TONES,
} from '@/lib/debateEvent';

type Tab = 'scores' | 'pairs' | 'rankings';

/** One team's score sheet for the signed-in judge. */
function ScoreCard({ team, tone, data, criteria, userId, judgeName, onSaved, onDirty }: {
  team: DebateTeam; tone: string; data: EventData; criteria: Criterion[];
  userId: string; judgeName: string | null; onSaved: () => void; onDirty: (team: string, dirty: boolean) => void;
}) {
  const { toast } = useToast();
  const mine = data.scores.find(s => s.team_id === team.id && s.judge_id === userId);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.map(c => [c.label, mine?.scores?.[c.label] != null ? String(mine.scores[c.label]) : ''])));
  const [notes, setNotes] = useState(mine?.notes || '');
  const [saving, setSaving] = useState(false);
  const members = data.roster.filter(d => d.team_id === team.id).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  const numbers = Object.fromEntries(criteria.map(c => [c.label, Math.min(Number(c.max) || 0, Math.max(0, Number(values[c.label]) || 0))]));
  const total = sheetTotal(numbers, criteria);
  const max = criteria.reduce((s, c) => s + (Number(c.max) || 0), 0);
  // `?? ''`: criteria can change after the card mounts (site content loads late on a fresh phone).
  const complete = criteria.every(c => (values[c.label] ?? '') !== '');
  const dirty = criteria.some(c => (values[c.label] || '') !== (mine?.scores?.[c.label] != null ? String(mine.scores[c.label]) : '')) || notes !== (mine?.notes || '');

  useEffect(() => { onDirty(team.id, dirty); }, [dirty, team.id, onDirty]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('debate_scores').upsert(
      { judge_id: userId, judge_name: judgeName, team_id: team.id, scores: numbers, total, notes: notes || null, updated_at: new Date().toISOString() },
      { onConflict: 'judge_id,team_id' },
    );
    setSaving(false);
    if (error) { toast({ title: 'Could not save scores', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Team ${team.label} scored ${total} / ${max}` });
    onSaved();
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white ${tone}`}>{team.label}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{team.name || `Team ${team.label}`}</h3>
          {team.position && <p className="text-sm text-gray-600">{team.position}</p>}
          <p className="mt-1 text-xs text-gray-500">{members.map(m => `${team.label}${m.slot} ${m.full_name}`).join(' · ') || 'No members'}</p>
        </div>
        {mine && !dirty && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-label="Saved" />}
      </div>

      <div className="mt-4 space-y-2.5">
        {criteria.map(c => (
          <label key={c.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-700">{c.label}</span>
            <span className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={c.max}
                step={1}
                value={values[c.label] ?? ''}
                onChange={e => setValues(v => ({ ...v, [c.label]: e.target.value }))}
                aria-label={`${c.label} for team ${team.label}, out of ${c.max}`}
                className={`w-20 rounded-md border px-2 py-1.5 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-panel-600/30 ${Number(values[c.label]) > c.max ? 'border-red-400' : 'border-gray-300'}`}
              />
              <span className="w-8 text-xs text-gray-400">/{c.max}</span>
            </span>
          </label>
        ))}
      </div>

      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes (optional, only the panel sees them)" className="mt-3 w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm" />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">Total <span className="text-lg font-semibold tabular-nums text-gray-900">{total}</span> / {max}</p>
        <button onClick={save} disabled={saving || !complete || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-panel-600 px-4 py-2 text-sm font-semibold text-white hover:bg-panel-700 disabled:opacity-40">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {mine ? 'Update' : 'Save'}
        </button>
      </div>
      {!complete && <p className="mt-1 text-right text-xs text-gray-500">Fill in every criterion to save.</p>}
    </div>
  );
}

/** Judges' panel: score teams, pick one-on-one winners, see rankings. */
export default function Judging() {
  const { toast } = useToast();
  const debate = useContent('debate');
  const { fullName, role } = useAdminRole();
  const [userId, setUserId] = useState<string | null>(null);
  // SG/Academics can type in a paper judge's sheet; null = scoring as myself.
  const [scoringFor, setScoringFor] = useState<{ id: string; name: string } | null>(null);
  const [newJudge, setNewJudge] = useState<string | null>(null);
  const isStaff = role === 'sg' || role === 'academics';
  const [data, setData] = useState<EventData | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<Tab>('scores');
  const [dirtyTeams, setDirtyTeams] = useState<Record<string, boolean>>({});
  const criteria: Criterion[] = (debate.judging_criteria || []).filter((c: Criterion) => c.label);

  useUnsavedChanges(Object.values(dirtyTeams).some(Boolean));
  const onDirty = useCallback((team: string, dirty: boolean) => setDirtyTeams(prev => (prev[team] === dirty ? prev : { ...prev, [team]: dirty })), []);

  const load = useCallback(async () => {
    try { setData(await loadEvent()); } catch { setMissing(true); }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    load();
  }, [load]);

  // Rankings update as other judges score.
  useEffect(() => {
    if (tab === 'scores') return;
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 10_000);
    return () => clearInterval(id);
  }, [tab, load]);

  const judgeId = scoringFor?.id ?? userId;
  const judgeName = scoringFor?.name ?? fullName;

  const vote = async (pairingId: string, winnerId: string) => {
    if (!judgeId) return;
    const { error } = await supabase.from('debate_pair_votes').upsert(
      { judge_id: judgeId, judge_name: judgeName, pairing_id: pairingId, winner_id: winnerId, updated_at: new Date().toISOString() },
      { onConflict: 'judge_id,pairing_id' },
    );
    if (error) { toast({ title: 'Could not save the vote', description: error.message, variant: 'destructive' }); return; }
    setData(d => d && {
      ...d,
      votes: [...d.votes.filter(v => !(v.pairing_id === pairingId && v.judge_id === judgeId)),
        { id: 'local', judge_id: judgeId, judge_name: judgeName, pairing_id: pairingId, winner_id: winnerId }],
    });
  };

  // Everyone else who has a sheet or a vote: paper judges and judges with accounts (for corrections).
  // A paper judge just added has nothing saved yet, so add them too or the drop-down shows "Me".
  const otherJudges = data
    ? [...new Map([
        ...[...data.scores, ...data.votes].filter(s => s.judge_id !== userId).map(s => [s.judge_id, s.judge_name || 'Unnamed judge'] as const),
        ...(scoringFor ? [[scoringFor.id, scoringFor.name] as const] : []),
      ]).entries()]
    : [];
  const switchJudge = async (next: { id: string; name: string } | null) => {
    if (Object.values(dirtyTeams).some(Boolean) && !(await confirmAction('Unsaved scores on this page will be lost.', { title: 'Switch judge', confirmLabel: 'Switch' }))) return;
    setDirtyTeams({});
    setScoringFor(next);
  };

  const tabs: { key: Tab; label: string; icon: typeof Trophy }[] = [
    { key: 'scores', label: 'Score teams', icon: ClipboardList },
    { key: 'pairs', label: 'One-on-one', icon: Swords },
    { key: 'rankings', label: 'Rankings', icon: Trophy },
  ];
  const scored = data && judgeId ? data.scores.filter(s => s.judge_id === judgeId).length : 0;
  const voted = data && judgeId ? data.votes.filter(v => v.judge_id === judgeId).length : 0;

  return (
    <AdminLayout title="Judging">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{debate.name} · Judging</h2>
            <p className="text-gray-600">Score here or on paper. Sheets are saved under the judge's name; rankings average all judges.</p>
          </div>
          <a href={adminPath('/judging/print')} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Print paper sheets
          </a>
        </div>

        {isStaff && data && (
          <div className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm ${scoringFor ? 'border-amber-300 bg-amber-50' : 'bg-white'}`}>
            <label htmlFor="scoring-for" className="font-medium text-gray-700">Scoring for</label>
            <select
              id="scoring-for"
              value={newJudge !== null ? '__new' : scoringFor?.id ?? ''}
              onChange={e => {
                const v = e.target.value;
                if (v === '__new') { setNewJudge(''); return; }
                setNewJudge(null);
                switchJudge(v ? { id: v, name: otherJudges.find(([id]) => id === v)?.[1] ?? '' } : null);
              }}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5"
            >
              <option value="">Me ({fullName || 'my account'})</option>
              {otherJudges.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              <option value="__new">+ Add a paper judge…</option>
            </select>
            {newJudge !== null && (
              <form
                className="flex gap-2"
                onSubmit={e => { e.preventDefault(); if (newJudge.trim()) { switchJudge({ id: crypto.randomUUID(), name: newJudge.trim() }); setNewJudge(null); } }}
              >
                <input autoFocus value={newJudge} onChange={e => setNewJudge(e.target.value)} placeholder="Judge's name" className="rounded-md border border-gray-300 px-2 py-1.5" />
                <button className="rounded-md bg-panel-600 px-3 py-1.5 font-medium text-white hover:bg-panel-700">Start</button>
              </form>
            )}
            {scoringFor && <span className="text-amber-800">Typing in {scoringFor.name}'s paper sheet. Scores and votes below are saved under their name.</span>}
          </div>
        )}

        {missing ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The judging panel isn't set up yet (migration 045).</div>
        ) : !data || !userId ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 border-b sm:flex sm:gap-1" role="tablist">
              {tabs.map(t => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); load(); }}
                  className={`-mb-px flex flex-col items-center justify-center gap-0.5 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium sm:flex-row sm:justify-start sm:gap-2 sm:px-4 sm:py-2.5 ${tab === t.key ? 'border-panel-600 text-panel-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  <t.icon className="hidden h-4 w-4 sm:block" aria-hidden /> {t.label}
                  {t.key === 'scores' && <span className="text-xs text-gray-400">{scored}/{data.teams.length}</span>}
                  {t.key === 'pairs' && <span className="text-xs text-gray-400">{voted}/{data.pairings.length}</span>}
                </button>
              ))}
            </div>

            {/* Kept mounted (just hidden) so unsaved scores survive switching tabs. */}
            <div hidden={tab !== 'scores'}>
              {data.teams.length === 0 ? (
                <p className="rounded-xl border bg-white px-5 py-10 text-center text-sm text-gray-500">The organisers haven't set up the teams yet.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.teams.map((t, i) => (
                    <ScoreCard key={`${judgeId}:${t.id}`} team={t} tone={TEAM_TONES[i % 2]} data={data} criteria={criteria} userId={judgeId!} judgeName={judgeName} onSaved={load} onDirty={onDirty} />
                  ))}
                </div>
              )}
            </div>

            {tab === 'pairs' && (
              data.pairings.length === 0 ? (
                <p className="rounded-xl border bg-white px-5 py-10 text-center text-sm text-gray-500">No one-on-one pairs yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.pairings.map((p, i) => {
                    const myVote = data.votes.find(v => v.pairing_id === p.id && v.judge_id === judgeId)?.winner_id;
                    return (
                      <li key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Pair {i + 1} · tap the winner</p>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          {[p.a_id, p.b_id].map((id, k) => {
                            const d = data.roster.find(r => r.id === id);
                            const chosen = myVote === id;
                            return (
                              <React.Fragment key={id}>
                                {k === 1 && <span className="text-xs font-semibold uppercase text-gray-400">vs</span>}
                                <button
                                  onClick={() => vote(p.id, id)}
                                  aria-pressed={chosen}
                                  className={`rounded-lg border-2 px-3 py-3 text-left transition ${chosen ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                  <span className="block text-xs font-mono text-gray-500">{seatLabel(d, data.teams)}</span>
                                  <span className="block font-medium text-gray-900">{chosen && '✓ '}{d?.full_name ?? 'Removed'}</span>
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {tab === 'rankings' && <DebateResults data={data} criteria={criteria} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

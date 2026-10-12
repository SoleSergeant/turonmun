import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Shuffle } from 'lucide-react';
import { type EventData, shuffle, TEAM_TONES } from '@/lib/debateEvent';

const ROUNDS = [
  { title: 'Team presentations', what: 'Teams prepare, then each presents its position.', seconds: 180, per: 'per team' },
  { title: 'One-on-one', what: 'Pairs from different teams debate one after another.', seconds: 120, per: 'per participant' },
  { title: 'Rebuttal', what: 'Each other team makes one challenge; the challenged team defends.', seconds: 90, per: 'per challenge, incl. defence' },
  { title: 'Consolidation', what: 'Teams review the criticism and prepare their final position.', seconds: 600, per: 'in total' },
  { title: 'Conclusion', what: "One speaker per team: why is our final position the strongest?", seconds: 120, per: 'per speaker' },
];

// shortcut: rebuttal order and final speakers live in this browser only; move to the DB if several organisers need them.
const STORE = 'turon-debate:run-sheet';
type Saved = { round: number; order: string[]; speakers: Record<string, string> };
const read = (): Saved => {
  try { return { round: 0, order: [], speakers: {}, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { round: 0, order: [], speakers: {} }; }
};

const clock = (s: number) => `${s < 0 ? '+' : ''}${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;

function RoundTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => { setLeft(seconds); setRunning(false); }, [seconds]);
  useEffect(() => {
    if (!running) return;
    const end = Date.now() + left * 1000;
    const id = setInterval(() => setLeft(Math.round((end - Date.now()) / 1000)), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only on start/pause
  }, [running]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span role="timer" aria-live="off" className={`font-mono text-6xl font-bold tabular-nums sm:text-7xl ${left < 0 ? 'text-red-600' : left <= 15 ? 'text-amber-600' : 'text-gray-900'}`}>
        {clock(left)}
      </span>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)} className="inline-flex items-center gap-1.5 rounded-lg bg-debate-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-debate-blue-700">
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button onClick={() => { setRunning(false); setLeft(seconds); }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm hover:bg-gray-50">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
      {left < 0 && <span className="text-sm font-medium text-red-600">Time is up</span>}
    </div>
  );
}

/** Debate day → Rounds: the five rounds with a timer, the rebuttal order and the final speakers. */
export default function DebateRunSheet({ data }: { data: EventData }) {
  const [saved, setSaved] = useState<Saved>(read);
  const update = (patch: Partial<Saved>) => setSaved(s => {
    const next = { ...s, ...patch };
    try { localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* private mode: keep it in memory */ }
    return next;
  });
  const team = (id: string) => data.teams.find(t => t.id === id);
  const toneOf = (id: string) => TEAM_TONES[Math.max(0, data.teams.findIndex(t => t.id === id)) % 2];
  const order = saved.order.filter(team);
  const current = ROUNDS[saved.round] ?? ROUNDS[0];

  return (
    <div className="space-y-6">
      <ol className="grid gap-2 sm:grid-cols-5">
        {ROUNDS.map((r, i) => (
          <li key={r.title}>
            <button onClick={() => update({ round: i })} aria-current={saved.round === i ? 'step' : undefined}
              className={`h-full w-full rounded-xl border p-3 text-left text-sm transition ${saved.round === i ? 'border-debate-blue bg-debate-blue text-white' : 'bg-white hover:border-gray-300'}`}>
              <span className={`block text-xs font-semibold uppercase ${saved.round === i ? 'text-white/70' : 'text-gray-400'}`}>Round {i + 1}</span>
              <span className="font-medium">{r.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Round {saved.round + 1}: {current.title}</h3>
        <p className="mb-4 text-sm text-gray-600">{current.what} Suggested time: {clock(current.seconds)} {current.per}.</p>
        <RoundTimer seconds={current.seconds} />
      </section>

      {saved.round === 2 && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Who is challenged, in order</h3>
            <button onClick={() => update({ order: shuffle(data.teams.map(t => t.id)) })} disabled={!data.teams.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
              <Shuffle className="h-4 w-4" /> {order.length ? 'Draw again' : 'Draw the order'}
            </button>
          </div>
          {order.length === 0 ? (
            <p className="text-sm text-gray-500">Draw a random order. Every team is challenged once.</p>
          ) : (
            <ol className="space-y-2">
              {order.map((id, i) => (
                <li key={id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right font-semibold text-gray-400">{i + 1}.</span>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white ${toneOf(id)}`}>{team(id)!.label}</span>
                  <span className="text-gray-900">{team(id)!.name || `Team ${team(id)!.label}`}</span>
                  {team(id)!.position && <span className="text-gray-500">· {team(id)!.position}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {saved.round === 4 && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Final speakers</h3>
          {data.teams.length === 0 && <p className="text-sm text-gray-500">No teams yet.</p>}
          <ul className="space-y-2">
            {data.teams.map(t => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`flex h-7 w-7 items-center justify-center rounded-md font-bold text-white ${toneOf(t.id)}`}>{t.label}</span>
                <select value={saved.speakers[t.id] || ''} onChange={e => update({ speakers: { ...saved.speakers, [t.id]: e.target.value } })}
                  aria-label={`Final speaker for team ${t.label}`} className="min-w-[14rem] rounded-md border border-gray-300 px-2 py-1.5">
                  <option value="">Choose the speaker</option>
                  {data.roster.filter(d => d.team_id === t.id).map(d => <option key={d.id} value={d.id}>{t.label}{d.slot} · {d.full_name}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

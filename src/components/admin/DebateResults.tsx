import React from 'react';
import { Trophy } from 'lucide-react';
import { type Criterion, type EventData, pairResults, seatLabel, teamRankings, TEAM_TONES } from '@/lib/debateEvent';

/** Live rankings: teams by average judge score, then one-on-one results. */
export default function DebateResults({ data, criteria }: { data: EventData; criteria: Criterion[] }) {
  const ranking = teamRankings(data, criteria);
  const pairs = pairResults(data);
  const maxTotal = criteria.reduce((s, c) => s + (Number(c.max) || 0), 0);
  const name = (id: string) => data.roster.find(d => d.id === id);
  const judges = new Set(data.scores.map(s => s.judge_id)).size;

  if (data.teams.length === 0) {
    return <p className="rounded-lg border bg-white p-6 text-center text-gray-500">No teams yet. They're set up in Debate day → Teams.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3">
          <h3 className="font-semibold text-gray-900">Team ranking</h3>
          <p className="text-xs text-gray-500">Average score from {judges} judge{judges === 1 ? '' : 's'} · out of {maxTotal} · ties broken by one-on-one wins</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Team</th>
                {criteria.map(c => <th key={c.label} className="hidden px-3 py-2.5 text-right lg:table-cell">{c.label} <span className="normal-case text-gray-400">/{c.max}</span></th>)}
                <th className="px-4 py-2.5 text-right">1-on-1 wins</th>
                <th className="px-4 py-2.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranking.map((r, i) => (
                <tr key={r.team.id} className={r.rank === 1 && r.judges > 0 ? 'bg-amber-50/60' : ''}>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {r.rank === 1 && r.judges > 0 ? <Trophy className="h-4 w-4 text-amber-500" aria-label="First place" /> : r.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${TEAM_TONES[data.teams.indexOf(r.team) % 2]}`}>{r.team.label}</span>
                      <div>
                        <div className="font-medium text-gray-900">{r.team.name || `Team ${r.team.label}`}</div>
                        {r.team.position && <div className="text-xs text-gray-500">{r.team.position}</div>}
                      </div>
                    </div>
                  </td>
                  {criteria.map(c => <td key={c.label} className="hidden px-3 py-3 text-right tabular-nums text-gray-700 lg:table-cell">{r.judges ? r.byCriterion[c.label].toFixed(1) : '—'}</td>)}
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{r.oneOnOneWins}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-lg font-semibold tabular-nums text-gray-900">{r.judges ? r.average.toFixed(1) : '—'}</span>
                    <span className="block text-xs text-gray-500">{r.judges} sheet{r.judges === 1 ? '' : 's'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pairs.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold text-gray-900">One-on-one results</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {pairs.map(({ pairing, aVotes, bVotes, winnerId }) => {
              const a = name(pairing.a_id);
              const b = name(pairing.b_id);
              const side = (d: typeof a, votes: number, id: string) => (
                <div className={`flex-1 ${id === pairing.b_id ? 'text-right' : ''}`}>
                  <span className={`font-medium ${winnerId === id ? 'text-green-700' : 'text-gray-900'}`}>
                    {winnerId === id && '✓ '}{d?.full_name ?? 'Removed'}
                  </span>
                  <span className="ml-1.5 text-xs text-gray-500">{seatLabel(d, data.teams)}</span>
                  <span className="block text-xs text-gray-500">{votes} vote{votes === 1 ? '' : 's'}</span>
                </div>
              );
              return (
                <li key={pairing.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  {side(a, aVotes, pairing.a_id)}
                  <span className="shrink-0 text-xs font-semibold uppercase text-gray-400">{winnerId ? 'vs' : aVotes || bVotes ? 'tied' : 'vs'}</span>
                  {side(b, bVotes, pairing.b_id)}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

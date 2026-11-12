import React, { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { useContent } from '@/content/store';
import { type EventData, type Criterion, loadEvent, seatLabel } from '@/lib/debateEvent';

const line = 'border-b border-gray-400';

/**
 * Admin → Judging → Print paper sheets: the judges' guide score sheet, one page
 * per team, plus a one-on-one page. Paper sheets are typed in afterwards on
 * Judging → "Scoring for".
 */
export default function JudgingPrint() {
  const debate = useContent('debate');
  const [data, setData] = useState<EventData | null>(null);
  const [error, setError] = useState(false);
  const criteria: Criterion[] = (debate.judging_criteria || []).filter((c: Criterion) => c.label);
  const max = criteria.reduce((s, c) => s + (Number(c.max) || 0), 0);

  useEffect(() => { loadEvent().then(setData).catch(() => setError(true)); }, []);

  if (error) return <p className="p-8 text-red-700">Could not load the teams.</p>;
  if (!data) return <div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;

  const header = (title: string) => (
    <div className="mb-6 flex items-end justify-between border-b-2 border-gray-900 pb-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{debate.name}</p>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="w-64 space-y-3 text-sm">
        <p className="flex gap-2">Judge: <span className={`flex-1 ${line}`} /></p>
        <p className="flex gap-2">Date: <span className={`flex-1 ${line}`} /></p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white [print-color-adjust:exact]">
    <div className="mx-auto max-w-3xl p-8 text-gray-900 print:max-w-none print:p-0">
      <div className="mb-8 flex items-center justify-between rounded-lg border bg-gray-50 p-4 print:hidden">
        <p className="text-sm text-gray-600">{data.teams.length} team sheet{data.teams.length === 1 ? '' : 's'}{data.pairings.length ? ' + one-on-one page' : ''}. Print one set per paper judge.</p>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-panel-700 px-4 py-2 text-sm font-medium text-white hover:bg-panel-800">
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      {data.teams.length === 0 && <p className="text-gray-500">No teams yet. Set them up in Debate day → Teams first.</p>}

      {data.teams.map(t => {
        const members = data.roster.filter(d => d.team_id === t.id).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
        return (
          <section key={t.id} className="mb-12 break-after-page print:mb-0">
            {header(`Score sheet · Team ${t.label}${t.name ? ` · ${t.name}` : ''}`)}
            {t.position && <p className="mb-1 text-sm"><span className="font-semibold">Position:</span> {t.position}</p>}
            {members.length > 0 && <p className="mb-4 text-sm text-gray-600">{members.map(m => `${t.label}${m.slot} ${m.full_name}`).join(' · ')}</p>}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-900 text-left text-white print:bg-gray-900">
                  <th className="border border-gray-900 px-3 py-2">Criterion</th>
                  <th className="w-20 border border-gray-900 px-3 py-2">Maximum</th>
                  <th className="w-20 border border-gray-900 px-3 py-2">Score</th>
                  <th className="border border-gray-900 px-3 py-2">Short notes</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map(c => (
                  <tr key={c.label}>
                    <td className="h-16 border border-gray-400 px-3">{c.label}</td>
                    <td className="border border-gray-400 px-3">{c.max}</td>
                    <td className="border border-gray-400" />
                    <td className="border border-gray-400" />
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="h-12 border border-gray-400 px-3">FINAL TOTAL</td>
                  <td className="border border-gray-400 px-3">{max}</td>
                  <td className="border border-gray-400" />
                  <td className="border border-gray-400" />
                </tr>
              </tbody>
            </table>
            <p className="mt-6 font-semibold">Best thing this team did</p>
            <div className={`mt-6 ${line}`} /><div className={`mt-6 ${line}`} />
            <p className="mt-6 font-semibold">One thing to improve</p>
            <div className={`mt-6 ${line}`} /><div className={`mt-6 ${line}`} />
          </section>
        );
      })}

      {data.pairings.length > 0 && (
        <section>
          {header('One-on-one · tick the winner')}
          <p className="mb-4 text-sm text-gray-600">Individual notes only; one-on-one results are not added to the team's {max} points.</p>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {data.pairings.map((p, i) => (
                <tr key={p.id}>
                  <td className="w-8 border border-gray-400 px-2 text-gray-500">{i + 1}</td>
                  {[p.a_id, p.b_id].map(id => {
                    const d = data.roster.find(r => r.id === id);
                    return (
                      <td key={id} className="h-14 w-[38%] border border-gray-400 px-3">
                        <span className="mr-2 inline-block h-4 w-4 border-2 border-gray-700 align-middle" />
                        <span className="font-mono text-xs text-gray-500">{seatLabel(d, data.teams)}</span> {d?.full_name ?? '—'}
                      </td>
                    );
                  })}
                  <td className="border border-gray-400 px-2 text-xs text-gray-400">notes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
    </div>
  );
}

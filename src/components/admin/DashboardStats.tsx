import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Heart, Mic, Shield, Users, LucideIcon } from 'lucide-react';
import { adminPath } from '@/lib/adminPath';

export interface StatRow {
  created_at: string;
  status?: string | null;
}

export interface DelegateRow extends StatRow {
  payment_status?: string | null;
  payment_amount?: number | null;
  seated: boolean;
  checked_in: boolean;
}

interface Props {
  delegates: DelegateRow[];
  chairs: StatRow[];
  volunteers: StatRow[];
  /** null when the debate table isn't readable / set up. */
  debaters: StatRow[] | null;
}

const DAY = 86_400_000;
const DAYS = 30;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const thisWeek = (rows: StatRow[]) => rows.filter(r => Date.now() - new Date(r.created_at).getTime() < 7 * DAY).length;
const money = (n: number) => `${n.toLocaleString('en-US').replace(/,/g, ' ')} UZS`;

// Application states. Each segment also carries its name in the legend and
// tooltip, so colour is never the only cue.
const STATUSES = [
  { key: 'pending', label: 'Pending', color: 'bg-amber-400' },
  { key: 'approved', label: 'Accepted', color: 'bg-green-500' },
  { key: 'waitlisted', label: 'Waitlisted', color: 'bg-orange-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
] as const;

function TypeTile({ icon: Icon, label, total, week, to }: { icon: LucideIcon; label: string; total: number; week: number; to: string }) {
  return (
    <Link to={adminPath(to)} className="group rounded-xl border bg-white p-4 shadow-sm transition hover:border-diplomatic-200 hover:shadow-md">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className="h-4 w-4 text-gray-400" /> {label}
      </div>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900">{total}</p>
      <p className={`text-xs ${week > 0 ? 'text-green-700' : 'text-gray-400'}`}>
        {week > 0 ? `+${week} this week` : 'none this week'}
      </p>
    </Link>
  );
}

/** "Applications this season" block on the admin dashboard. */
export default function DashboardStats({ delegates, chairs, volunteers, debaters }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const all = useMemo(() => [...delegates, ...chairs, ...volunteers, ...(debaters || [])], [delegates, chairs, volunteers, debaters]);

  // New applications per day, last 30 days (all types).
  const days = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const buckets = Array.from({ length: DAYS }, (_, i) => ({ date: new Date(today - (DAYS - 1 - i) * DAY), count: 0 }));
    all.forEach(r => {
      const idx = DAYS - 1 - Math.round((today - startOfDay(new Date(r.created_at)).getTime()) / DAY);
      if (idx >= 0 && idx < DAYS) buckets[idx].count++;
    });
    return buckets;
  }, [all]);
  const maxDay = Math.max(1, ...days.map(d => d.count));
  const last30 = days.reduce((s, d) => s + d.count, 0);

  const statusCounts = STATUSES.map(s => ({
    ...s,
    count: delegates.filter(d => (d.status || 'pending') === s.key).length,
  }));

  const approved = delegates.filter(d => d.status === 'approved');
  const paid = approved.filter(d => d.payment_status === 'paid');
  const funnel = [
    { label: 'Applied', value: delegates.length },
    { label: 'Accepted', value: approved.length },
    { label: 'Paid', value: paid.length },
    { label: 'Seated', value: approved.filter(d => d.seated).length },
    { label: 'Checked in', value: approved.filter(d => d.checked_in).length },
  ];
  const funnelMax = Math.max(1, funnel[0].value);

  const expected = approved.reduce((s, d) => s + (d.payment_amount || 0), 0);
  const collected = paid.reduce((s, d) => s + (d.payment_amount || 0), 0);

  return (
    <section aria-labelledby="season-stats" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="season-stats" className="text-lg font-semibold text-gray-900">Applications this season</h3>
        <Link to={adminPath('/analytics')} className="inline-flex items-center gap-1 text-sm text-diplomatic-600 hover:underline">
          <BarChart3 className="h-4 w-4" /> Full analytics
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TypeTile icon={Users} label="Delegates" total={delegates.length} week={thisWeek(delegates)} to="/delegates" />
        <TypeTile icon={Shield} label="Chairs" total={chairs.length} week={thisWeek(chairs)} to="/chairs" />
        <TypeTile icon={Heart} label="Volunteers" total={volunteers.length} week={thisWeek(volunteers)} to="/volunteers" />
        {debaters && <TypeTile icon={Mic} label="Turon Debate" total={debaters.length} week={thisWeek(debaters)} to="/debate" />}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* New applications per day */}
        <div className="rounded-xl border bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex items-baseline justify-between">
            <h4 className="font-medium text-gray-900">New applications per day</h4>
            <p className="text-sm text-gray-500"><span className="font-semibold tabular-nums text-gray-900">{last30}</span> in the last 30 days</p>
          </div>
          <div className="relative mt-4">
            <div
              className="flex h-40 items-end gap-[2px] border-b border-gray-200"
              role="img"
              aria-label={`New applications per day over the last 30 days, ${last30} in total. Busiest day: ${maxDay}.`}
              onMouseLeave={() => setHover(null)}
            >
              {days.map((d, i) => (
                <div
                  key={i}
                  className="flex h-full flex-1 items-end"
                  onMouseEnter={() => setHover(i)}
                >
                  <div
                    className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-diplomatic-700' : 'bg-diplomatic-500'}`}
                    style={{ height: d.count ? `${Math.max(4, (d.count / maxDay) * 100)}%` : 0 }}
                  />
                </div>
              ))}
            </div>
            {hover !== null && (
              <div
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow"
                style={{ left: `${((hover + 0.5) / DAYS) * 100}%` }}
              >
                {days[hover].date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: <b>{days[hover].count}</b>
              </div>
            )}
            <div className="mt-1 flex justify-between text-[11px] text-gray-400">
              <span>{days[0].date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Delegate pipeline */}
        <div className="rounded-xl border bg-white p-5 shadow-sm xl:col-span-2">
          <h4 className="font-medium text-gray-900">Delegate pipeline</h4>
          <ul className="mt-4 space-y-3">
            {funnel.map((f, i) => (
              <li key={f.label} className="text-sm">
                <div className="mb-1 flex justify-between">
                  <span className="text-gray-600">{f.label}</span>
                  <span className="tabular-nums text-gray-900">
                    <b>{f.value}</b>
                    {i > 0 && funnel[0].value > 0 && <span className="ml-1 text-xs text-gray-400">{Math.round((f.value / funnel[0].value) * 100)}%</span>}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-diplomatic-500" style={{ width: `${(f.value / funnelMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Delegate status breakdown */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h4 className="font-medium text-gray-900">Delegate applications by status</h4>
          {delegates.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No delegate applications yet.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full">
                {statusCounts.filter(s => s.count > 0).map(s => (
                  <div key={s.key} className={s.color} style={{ width: `${(s.count / delegates.length) * 100}%` }} title={`${s.label}: ${s.count}`} />
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {statusCounts.map(s => (
                  <li key={s.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-gray-600"><span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />{s.label}</span>
                    <span className="tabular-nums text-gray-900">
                      <b>{s.count}</b> <span className="text-xs text-gray-400">{Math.round((s.count / delegates.length) * 100)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Fees */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h4 className="font-medium text-gray-900">Delegate fees</h4>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="break-words text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">{money(collected)}</p>
              <p className="text-xs text-gray-400">{paid.length} paid</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Still to collect</p>
              <p className="break-words text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">{money(Math.max(0, expected - collected))}</p>
              <p className="text-xs text-gray-400">{approved.length - paid.length} accepted, unpaid</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100" role="img" aria-label={`${expected ? Math.round((collected / expected) * 100) : 0}% of expected fees collected`}>
            <div className="h-full rounded-full bg-diplomatic-500" style={{ width: `${expected ? (collected / expected) * 100 : 0}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {expected ? `${Math.round((collected / expected) * 100)}% of ${money(expected)} expected from accepted delegates` : 'No accepted delegates yet'}
          </p>
        </div>
      </div>
    </section>
  );
}

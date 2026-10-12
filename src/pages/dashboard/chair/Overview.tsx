import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CheckInPass from '@/components/dashboard/CheckInPass';
import { AWARD_DEFS } from './Awards';

interface OverviewContext {
  committees: any[];
  positionPapers: any[];
  loading: boolean;
  assignedDelegates: any[];
  noCommittee: boolean;
}

const isChairSubdomain = window.location.hostname.startsWith('chair.');
const at = (sub: string) => (isChairSubdomain ? `/${sub}` : `/chair-dashboard/${sub}`);

export default function ChairOverview() {
  const { committees = [], positionPapers = [], loading, assignedDelegates = [], noCommittee } = useOutletContext<OverviewContext>() || ({} as OverviewContext);
  const committee = committees[0];
  const [me, setMe] = useState<{ id: string; full_name: string | null; checked_in_at: string | null } | null>(null);
  const [awardsPicked, setAwardsPicked] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data } = await supabase
        .from('admin_users')
        .select('id, full_name, checked_in_at')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
      if (data) setMe(data as any);
    })();
  }, []);

  useEffect(() => {
    if (!committee?.id) return;
    (supabase.from('committee_awards' as any) as any)
      .select('award_type', { count: 'exact', head: true })
      .eq('committee_id', committee.id)
      .then(({ count, error }: any) => setAwardsPicked(error ? null : count ?? 0));
  }, [committee?.id]);

  if (loading) return <p className="py-16 text-center text-white/60">Loading…</p>;

  const seated = assignedDelegates.length;
  const arrived = assignedDelegates.filter(d => d.checked_in_at).length;
  const submitted = positionPapers.filter(p => p.status && p.status !== 'draft').length;
  const toReview = positionPapers.filter(p => p.status === 'submitted').length;

  const rows = [
    { label: 'Delegates seated', value: seated, hint: seated ? `${arrived} checked in` : 'None yet', to: 'delegates' },
    { label: 'Position papers', value: submitted, hint: toReview ? `${toReview} waiting for your review` : submitted ? 'All reviewed' : 'None submitted yet', to: 'papers' },
    { label: 'Awards picked', value: awardsPicked ?? '–', hint: `of ${AWARD_DEFS.length}`, to: 'awards' },
  ];

  return (
    <div className="space-y-6">
      {me && !me.checked_in_at && <CheckInPass kind="chair" id={me.id} name={me.full_name || 'Chair'} detail={committee?.name} />}
      {me?.checked_in_at && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-emerald-200">
          You're checked in ({new Date(me.checked_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}).
        </p>
      )}

      {!noCommittee && committee && (
        <>
          <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">{committee.name}</h2>
            {committee.description && <p className="mt-1 max-w-3xl text-white/65">{committee.description}</p>}
            <Link to={at('command')} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-semibold text-diplomatic-950 hover:bg-gold-300">
              Open MUN Command <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>

          <ul className="grid gap-4 sm:grid-cols-3">
            {rows.map(r => (
              <li key={r.label}>
                <Link to={at(r.to)} className="block h-full rounded-xl border border-white/10 bg-white/[0.04] p-5 hover:border-white/25">
                  <p className="text-sm text-white/60">{r.label}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{r.value}</p>
                  <p className="mt-1 text-sm text-white/55">{r.hint}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

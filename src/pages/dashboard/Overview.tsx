import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, FileText, Flag } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useContent } from '@/content/store';
import CheckInPass from '@/components/dashboard/CheckInPass';
import DelegateStatusCard from '@/components/dashboard/DelegateStatusCard';
import { delegateStatus } from '@/lib/delegateStatus';
import { getCountryCode } from '@/utils/countryCodes';

const card = 'rounded-xl border border-white/10 bg-white/[0.04] p-5 sm:p-6';
const heading = 'text-base font-semibold text-white';

function Overview() {
  const general = useContent('general');
  const { user } = useAuth();
  const [application, setApplication] = useState<Tables<'applications'> | null>(null);
  const [committee, setCommittee] = useState<any | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagError, setFlagError] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const { data: app } = await (supabase as any)
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (app) {
          setApplication(app);
          const [comm, assign] = await Promise.all([
            app.assigned_committee_id
              ? supabase.from('committees').select('*').eq('id', app.assigned_committee_id).maybeSingle()
              : Promise.resolve({ data: null }),
            supabase.from('country_assignments').select('*').eq('application_id', app.id).maybeSingle(),
          ]);
          setCommittee(comm.data);
          setAssignment(assign.data);
        }

        const today = new Date().toISOString().slice(0, 10);
        const [upcoming, res] = await Promise.all([
          supabase.from('schedule_events').select('*')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(4),
          (supabase as any).from('resources').select('*'),
        ]);
        setEvents(upcoming.data || []);
        setResources(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) return <p className="py-16 text-center text-white/60">Loading…</p>;

  const firstName = (application?.full_name || (user?.user_metadata as any)?.full_name || '').split(' ')[0];
  const conferenceDate = general.conference_date ? new Date(general.conference_date) : null;

  const countdown = (
    <section className={card} aria-labelledby="countdown-title">
      <h2 id="countdown-title" className={heading}>Conference starts in</h2>
      <div className="mt-4">
        {conferenceDate ? <CountdownTimer targetDate={conferenceDate} /> : <p className="text-white/60">The date will be announced soon.</p>}
      </div>
    </section>
  );

  if (!application) {
    return (
      <div className="space-y-6 pb-12">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">Hello{firstName ? `, ${firstName}` : ''}</h1>
        <section className={card}>
          <h2 className="text-xl font-semibold text-white">You haven't applied yet</h2>
          <p className="mt-1 text-white/70">Fill in the delegate application to take part in {general.season_label || 'the next season'}.</p>
          <Link to="/register" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-semibold text-diplomatic-950 hover:bg-gold-300">
            Apply now <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
        {countdown}
      </div>
    );
  }

  const country = assignment?.country_name || assignment?.country || null;
  const code = (assignment?.country_code || (country ? getCountryCode(country) : null))?.toLowerCase();
  const status = delegateStatus(application as any, { committee: committee?.name, country });
  const app = application as any;
  const docs = [
    { label: 'Delegate handbook', file: resources.find(r => r.category === 'handbook')?.file_url },
    { label: 'Rules of procedure', file: resources.find(r => r.category === 'rop')?.file_url },
    { label: 'Position paper template', file: resources.find(r => r.category === 'position_paper')?.file_url },
  ].filter(d => d.file);

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">Hello{firstName ? `, ${firstName}` : ''}</h1>

      <DelegateStatusCard status={status} telegramUrl={general.telegram_url}>
        <Link to="/dashboard/application" className="mt-5 inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200">
          Application details <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </DelegateStatusCard>

      {app.status === 'approved' && app.assigned_committee_id && !app.checked_in_at && (
        <CheckInPass kind="delegate" id={app.id} name={app.full_name || firstName} detail={[committee?.name, country].filter(Boolean).join(' · ')} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {(country || committee) && (
          <section className={card} aria-labelledby="seat-title">
            <h2 id="seat-title" className={heading}>Your seat</h2>
            <div className="mt-4 flex items-center gap-4">
              {code && !flagError ? (
                <img src={`https://flagcdn.com/w80/${code}.png`} alt={`Flag of ${country}`} className="w-14 rounded-sm border border-white/20"
                  onError={() => setFlagError(true)} loading="lazy" />
              ) : (
                <span className="flex h-10 w-14 items-center justify-center rounded-sm bg-white/10"><Flag className="h-4 w-4 text-white/40" aria-hidden /></span>
              )}
              <div>
                <p className="text-lg font-semibold text-white">{country || 'Country not assigned yet'}</p>
                <p className="text-sm text-white/60">{committee?.name || 'Committee not assigned yet'}</p>
              </div>
            </div>
            {committee?.description && <p className="mt-4 line-clamp-3 text-sm text-white/60">{committee.description}</p>}
            <Link to="/dashboard/committee" className="mt-4 inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200">
              Committee page <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        )}

        {countdown}

        {docs.length > 0 && (
          <section className={card} aria-labelledby="docs-title">
            <h2 id="docs-title" className={heading}>Documents</h2>
            <ul className="mt-3 divide-y divide-white/10">
              {docs.map(d => (
                <li key={d.label}>
                  <a href={d.file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2.5 text-white/85 hover:text-white">
                    <FileText className="h-4 w-4 shrink-0 text-gold-400" aria-hidden /> {d.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={card} aria-labelledby="agenda-title">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="agenda-title" className={heading}>Coming up</h2>
            <Link to="/schedule" className="text-sm text-gold-300 hover:text-gold-200">Full schedule</Link>
          </div>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">The schedule hasn't been published yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10">
              {events.map(e => (
                <li key={e.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-white">{e.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-white/60">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    {new Date(`${e.event_date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {e.start_time ? `, ${String(e.start_time).slice(0, 5)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default React.memo(Overview);

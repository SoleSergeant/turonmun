import * as React from 'react';
import { ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomButton } from './ui/custom-button';
import { useContent } from '@/content/store';
import { useFormSettings } from '@/hooks/useFormSettings';
import CountdownMini from './CountdownMini';

const Hero = () => {
  const season = useContent('next_season');
  const hero = useContent('hero');
  const { settings: delegateSettings, isEffectivelyClosed: delegateClosed, notOpenYet } = useFormSettings('delegate');

  // Countdown logic:
  //  - "Applications open in" → opens_at in the future (form not open yet)
  //  - "Applications close in" → form open + deadline in the future
  const _now = Date.now();
  const _deadline = delegateSettings?.deadline ? new Date(delegateSettings.deadline) : null;
  const _opensAt = delegateSettings?.opens_at ? new Date(delegateSettings.opens_at) : null;
  let countdown: { target: Date; label: string; accent: 'gold' | 'emerald' | 'amber' } | null = null;
  if (notOpenYet && _opensAt) {
    countdown = { target: _opensAt, label: 'Applications open in', accent: 'emerald' };
  } else if (!delegateClosed && _deadline && _deadline.getTime() > _now) {
    countdown = { target: _deadline, label: 'Applications close in', accent: 'amber' };
  }

  // While nothing is announced, the season card is a short "coming soon" note
  // instead of four rows of TBD.
  const isUnknown = (v: string) => !v || /^(tbd|tba|to be announced)$/i.test(v.trim());
  const details = [
    { icon: Calendar, label: 'Date',     value: season.date_text },
    { icon: Clock,    label: 'Duration', value: season.duration_text },
    { icon: MapPin,   label: 'Location', value: season.location_text },
    { icon: Users,    label: 'Delegates', value: season.delegates_text },
  ];
  const announced = details.filter(d => !isUnknown(d.value));
  const subtitle = season.subtitle && season.subtitle.replace(/[!.]/g, '').toLowerCase() !== (season.badge_label || '').replace(/[!.]/g, '').toLowerCase()
    ? season.subtitle : null;

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-diplomatic-950 pt-24 pb-12 sm:pt-28 lg:pb-16">
      <img src="/images/hero.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-diplomatic-950/95 via-diplomatic-950/85 to-diplomatic-950/60" />

      <div className="container relative z-10">
        <div className="flex flex-col items-center gap-10 lg:grid lg:grid-cols-[1.2fr_1fr]">
          <div className="px-4 text-white sm:px-0">
            <p className="mb-4 text-sm font-medium text-gold-300">{hero.eyebrow}</p>
            <h1 className="mb-5 font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">TuronMUN</h1>
            <p className="mb-8 max-w-xl text-base text-white/85 sm:text-lg">{hero.intro}</p>

            <div className="flex flex-wrap gap-3">
              <CustomButton to="/register" variant="accent" size="lg" className="group w-full sm:w-auto">
                {hero.apply_button}
                <ChevronRight className="transition-transform group-hover:translate-x-1" size={16} />
              </CustomButton>
              <CustomButton
                to="/committees"
                variant="outline"
                size="lg"
                className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              >
                {hero.committees_button}
              </CustomButton>
            </div>

            {hero.accolades.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
                {hero.accolades.map(text => <li key={text}>{text}</li>)}
              </ul>
            )}
          </div>

          <div className="mx-auto w-full max-w-md px-4 sm:px-0 lg:max-w-sm lg:justify-self-end">
            <div className="rounded-xl border border-white/15 bg-diplomatic-950/70 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">{season.badge_label}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{season.heading}</h2>
              {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}

              {announced.length === 0 ? (
                <p className="mt-4 text-sm text-white/60">Dates and venue will be announced soon.</p>
              ) : (
                <dl className="mt-4 space-y-2.5 text-sm">
                  {announced.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                      <dt className="w-16 shrink-0 text-white/50">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {countdown && (
                <div className="mt-5 flex justify-center">
                  <CountdownMini targetDate={countdown.target} label={countdown.label} accent={countdown.accent} />
                </div>
              )}

              <Link
                to="/register"
                className="mt-5 block w-full rounded-lg border border-gold-400/50 px-4 py-3 text-center text-sm font-semibold text-gold-300 transition-colors hover:bg-gold-400/10"
              >
                {season.apply_label}
              </Link>
              <Link to="/past-conferences" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/50 transition-colors hover:text-gold-400">
                Past seasons <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

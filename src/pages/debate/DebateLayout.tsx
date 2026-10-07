import React from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Send, Instagram, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useContent } from '@/content/store';
import { useAuth } from '@/hooks/useAuth';
import { useDebatePath } from './paths';

/** Registration is open when switched on and the deadline (if any) hasn't passed. */
export function useDebateRegistrationOpen() {
  const d = useContent('debate');
  const deadline = d.registration_deadline ? new Date(d.registration_deadline) : null;
  const beforeDeadline = !deadline || isNaN(deadline.getTime()) || Date.now() < deadline.getTime();
  return { open: !!d.registration_open && beforeDeadline, deadline };
}

/** Visible keyboard focus for links and buttons on the dark background. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-diplomatic-950';

/** Primary gold button. */
export const goldButton =
  `inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 font-semibold text-diplomatic-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-300 active:scale-[0.98] disabled:opacity-60 ${focusRing}`;

/**
 * Text inputs and selects. color-scheme darkens native date pickers; the
 * option colours are set explicitly because Chrome on Windows draws the
 * dropdown list itself with a white background, which made the (inherited)
 * white option text invisible.
 */
export const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-white [color-scheme:dark] placeholder:text-white/40 transition focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30 [&_option]:bg-diplomatic-900 [&_option]:text-white';

/** Header + footer for the Turon Debate site (turonmun.com/debat). */
export default function DebateLayout({ title, children, nav }: {
  title?: string;
  children: React.ReactNode;
  /** In-page section links shown in the header on wide screens. */
  nav?: { href: string; label: string }[];
}) {
  const d = useContent('debate');
  const general = useContent('general');
  const seo = useContent('seo');
  const { user } = useAuth();
  const path = useDebatePath();
  const navLink = `rounded-lg px-3 py-2 font-medium text-white/80 transition hover:bg-white/10 hover:text-white ${focusRing}`;
  const iconLink = `rounded-lg p-2.5 transition hover:bg-white/10 hover:text-white ${focusRing}`;

  return (
    // Respect the visitor's "reduce motion" setting for every animation inside.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-diplomatic-950 text-white antialiased">
        <Helmet>
          <title>{title ? `${title} | ${d.name}` : `${d.name} — ${d.tagline}`}</title>
          <meta name="description" content={d.intro} />
          <meta name="theme-color" content="#050f1d" />
        </Helmet>

        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:font-semibold focus:text-diplomatic-950"
        >
          Skip to content
        </a>

        {/* fixed, not sticky: the site-wide overflow-x on <body> breaks sticky */}
        <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-diplomatic-950/85 backdrop-blur-md">
          <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16">
            <Link to={path('/')} className={`flex min-w-0 items-center gap-2.5 rounded-lg ${focusRing}`}>
              <img src={general.logo_url} alt="" width={32} height={32} className="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8" />
              <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">{d.name}</span>
            </Link>

            {nav && nav.length > 0 && (
              <nav aria-label="Sections" className="hidden items-center gap-1 text-sm md:flex">
                {nav.map(item => (
                  <a key={item.href} href={item.href} className={navLink}>{item.label}</a>
                ))}
              </nav>
            )}

            <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
              {user ? (
                <Link to={path('/register')} className={navLink}>
                  <span className="hidden sm:inline">My registration</span>
                  <span className="sm:hidden">Account</span>
                </Link>
              ) : (
                <Link to={`${path('/login')}?redirect=${encodeURIComponent(path('/register'))}`} className={navLink}>
                  Sign in
                </Link>
              )}
              <Link to={path('/register')} className={`${goldButton} px-4 py-2 text-sm`}>
                {d.register_button}
              </Link>
            </div>
          </div>
        </header>

        <main id="content" className="flex-1 pt-14 sm:pt-16">{children}</main>

        <footer className="border-t border-white/10 py-8 text-sm text-white/65">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {d.name} · by{' '}
              <a href={seo.site_url} className={`rounded underline underline-offset-2 hover:text-white ${focusRing}`}>{general.site_name}</a>
            </p>
            <div className="flex items-center gap-1">
              {general.telegram_url && (
                <a href={general.telegram_url} target="_blank" rel="noreferrer" aria-label="Telegram" className={iconLink}><Send className="h-4 w-4" /></a>
              )}
              {general.instagram_url && (
                <a href={general.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className={iconLink}><Instagram className="h-4 w-4" /></a>
              )}
              {general.contact_email && (
                <a href={`mailto:${general.contact_email}`} aria-label="Email" className={iconLink}><Mail className="h-4 w-4" /></a>
              )}
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

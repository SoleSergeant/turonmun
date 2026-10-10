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

// ── Brand tokens ──────────────────────────────────────────────────────
// Turon Debate: blue #013399 leads, maroon #800032 is for actions (the two
// podiums in the logo). Light pages, like the logo's primary version.

/** Visible keyboard focus. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-debate-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/** Primary action (maroon). */
export const primaryButton =
  `inline-flex items-center justify-center gap-2 rounded-xl bg-debate-maroon font-semibold text-white shadow-lg shadow-debate-maroon/20 transition hover:bg-debate-maroon-700 active:scale-[0.98] disabled:opacity-60 ${focusRing}`;

/** Secondary action (blue outline). */
export const secondaryButton =
  `inline-flex items-center justify-center gap-2 rounded-xl border-2 border-debate-blue font-semibold text-debate-blue transition hover:bg-debate-blue-50 active:scale-[0.98] disabled:opacity-60 ${focusRing}`;

/** Text inputs and selects. */
export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-debate-blue focus:outline-none focus:ring-2 focus:ring-debate-blue/20';

/** Headings in the wordmark's typeface. */
export const headingCls = 'font-debate font-extrabold tracking-tight [font-stretch:112%]';

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
  const navLink = `rounded-lg px-3 py-2 font-medium text-slate-700 transition hover:bg-debate-blue-50 hover:text-debate-blue ${focusRing}`;
  const iconLink = `rounded-lg p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`;

  return (
    // Respect the visitor's "reduce motion" setting for every animation inside.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        <Helmet>
          <title>{title ? `${title} | ${d.name}` : `${d.name} — ${d.tagline}`}</title>
          <meta name="description" content={d.intro} />
          <meta name="theme-color" content="#013399" />
          <link rel="icon" type="image/svg+xml" href="/debate/favicon.svg" />
          <link rel="apple-touch-icon" href="/debate/apple-touch-icon.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&display=swap" />
        </Helmet>

        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-debate-maroon focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        {/* fixed, not sticky: the site-wide overflow-x on <body> breaks sticky */}
        <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16">
            <Link to={path('/')} className={`flex min-w-0 items-center gap-2 rounded-lg ${focusRing}`}>
              <img src="/debate/podium.svg" alt="" width={502} height={671} className="h-8 w-auto shrink-0 sm:h-9" />
              <span className={`${headingCls} truncate text-lg leading-none text-debate-blue sm:text-xl`}>{d.name}</span>
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
              <Link to={path('/register')} className={`${primaryButton} px-4 py-2 text-sm`}>
                {d.register_button}
              </Link>
            </div>
          </div>
        </header>

        <main id="content" className="flex-1 pt-14 sm:pt-16">{children}</main>

        <footer className="bg-debate-blue-900 text-sm text-white/75">
          <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <div className="flex items-center gap-2.5">
                <img src="/debate/podium-reversed.svg" alt="" width={502} height={671} loading="lazy" className="h-10 w-auto" />
                <span className={`${headingCls} text-xl leading-none text-white`}>{d.name}</span>
              </div>
              <p>
                © {new Date().getFullYear()} · A{' '}
                <a href={seo.site_url} className="rounded font-medium text-white underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{general.site_name}</a>{' '}
                initiative
              </p>
            </div>
            <div className="flex items-center gap-1">
              {general.telegram_url && (
                <a href={general.telegram_url} target="_blank" rel="noreferrer" aria-label="Telegram" className={iconLink}><Send className="h-5 w-5" /></a>
              )}
              {general.instagram_url && (
                <a href={general.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className={iconLink}><Instagram className="h-5 w-5" /></a>
              )}
              {general.contact_email && (
                <a href={`mailto:${general.contact_email}`} aria-label="Email" className={iconLink}><Mail className="h-5 w-5" /></a>
              )}
            </div>
          </div>
          {/* The two podium colours as a closing stripe. */}
          <div aria-hidden className="flex h-1.5"><span className="flex-1 bg-white/90" /><span className="flex-1 bg-debate-maroon" /></div>
        </footer>
      </div>
    </MotionConfig>
  );
}

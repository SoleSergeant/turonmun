import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Instagram, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useContent } from '@/content/store';
import { useAuth } from '@/hooks/useAuth';

/** Registration is open when switched on and the deadline (if any) hasn't passed. */
export function useDebateRegistrationOpen() {
  const d = useContent('debate');
  const deadline = d.registration_deadline ? new Date(d.registration_deadline) : null;
  const beforeDeadline = !deadline || isNaN(deadline.getTime()) || Date.now() < deadline.getTime();
  return { open: !!d.registration_open && beforeDeadline, deadline };
}

/** Header + footer for debat.turonmun.com. */
export default function DebateLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  const d = useContent('debate');
  const general = useContent('general');
  const seo = useContent('seo');
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-diplomatic-950 text-white">
      <Helmet>
        <title>{title ? `${title} | ${d.name}` : `${d.name} — ${d.tagline}`}</title>
        <meta name="description" content={d.intro} />
      </Helmet>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-diplomatic-950/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={general.logo_url} alt="" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight">{d.name}</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {user ? (
              <Link to="/register" className="rounded-lg px-3 py-2 font-medium text-white/80 hover:bg-white/10 hover:text-white">
                My registration
              </Link>
            ) : (
              <Link to="/login?redirect=%2Fregister" className="rounded-lg px-3 py-2 font-medium text-white/80 hover:bg-white/10 hover:text-white">
                Sign in
              </Link>
            )}
            <Link to="/register" className="rounded-lg bg-gold-400 px-4 py-2 font-semibold text-diplomatic-950 hover:bg-gold-300">
              {d.register_button}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 py-8 text-sm text-white/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <p>© {new Date().getFullYear()} {d.name} · by <a href={seo.site_url} className="underline hover:text-white">{general.site_name}</a></p>
          <div className="flex items-center gap-4">
            {general.telegram_url && <a href={general.telegram_url} target="_blank" rel="noreferrer" aria-label="Telegram" className="hover:text-white"><Send className="h-4 w-4" /></a>}
            {general.instagram_url && <a href={general.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white"><Instagram className="h-4 w-4" /></a>}
            {general.contact_email && <a href={`mailto:${general.contact_email}`} aria-label="Email" className="hover:text-white"><Mail className="h-4 w-4" /></a>}
          </div>
        </div>
      </footer>
    </div>
  );
}

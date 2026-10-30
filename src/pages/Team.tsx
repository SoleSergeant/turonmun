import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UsersRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Seo } from '../components/seo';
import { supabase } from '@/integrations/supabase/client';
import { useContent, useFill } from '@/content/store';
import { photoStyle, type TeamMember } from '@/lib/teamPhoto';

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const LinkWrap = ({ m, children }: { m: TeamMember; children: React.ReactNode }) =>
  m.link_url ? (
    <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500">
      {children}
    </a>
  ) : <>{children}</>;

const Card = ({ m }: { m: TeamMember }) => (
  <li className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
    <LinkWrap m={m}>
      <div className="aspect-square bg-diplomatic-100 flex items-center justify-center overflow-hidden">
        {m.photo_url ? (
          <img loading="lazy" decoding="async" src={m.photo_url} alt={m.name} className="w-full h-full object-cover" style={photoStyle(m)} />
        ) : (
          <span className="text-3xl font-display font-bold text-diplomatic-400" aria-hidden="true">{initials(m.name)}</span>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="font-bold text-diplomatic-900 leading-tight">{m.name}</p>
        {m.role && <p className="text-sm text-neutral-500 mt-1">{m.role}</p>}
      </div>
    </LinkWrap>
  </li>
);

/** Past members: smaller, so the current team stays the focus. */
const PastCard = ({ m }: { m: TeamMember }) => (
  <li>
    <LinkWrap m={m}>
      <div className="flex items-center gap-3 bg-white rounded-xl border border-neutral-200 p-2.5">
        <div className="w-11 h-11 rounded-full bg-diplomatic-100 flex items-center justify-center overflow-hidden shrink-0">
          {m.photo_url ? (
            <img loading="lazy" decoding="async" src={m.photo_url} alt={m.name} className="w-full h-full object-cover" style={photoStyle(m)} />
          ) : (
            <span className="text-sm font-bold text-diplomatic-400" aria-hidden="true">{initials(m.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-diplomatic-900 text-sm leading-tight">{m.name}</p>
          {m.role && <p className="text-xs text-neutral-500 mt-0.5">{m.role}</p>}
        </div>
      </div>
    </LinkWrap>
  </li>
);

const isSecretariat = (t: string) => t.trim().toLowerCase() === 'secretariat';

/** Groups by team: Secretariat first, then teams in the order of their first (lowest sort_order) member. */
const byTeam = (list: TeamMember[]) =>
  Array.from(new Set(list.map(m => m.team)))
    .sort((a, b) => Number(isSecretariat(b)) - Number(isSecretariat(a)))
    .map(t => [t, list.filter(m => m.team === t)] as const);

const Team = () => {
  const text = useContent('pages');
  const fill = useFill();
  // RLS only returns visible rows to the public.
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('team_members' as any) as any)
        .select('id, name, role, team, photo_url, link_url, sort_order, is_past, photo_x, photo_y, photo_zoom')
        .order('sort_order').order('name');
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });
  const current = members.filter(m => !m.is_past);
  const past = members.filter(m => m.is_past);

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Seo title={fill(text.team_title)} description={fill(text.team_intro)} />
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-100 text-gold-600 mb-4">
              <UsersRound className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-diplomatic-900 mb-3">{fill(text.team_title)}</h1>
            <p className="text-neutral-600 max-w-xl mx-auto">{fill(text.team_intro)}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-neutral-400">Loading…</div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">The team will be introduced here soon.</div>
          ) : (
            <div className="space-y-12 max-w-5xl mx-auto">
              {byTeam(current).map(([t, list]) => (
                <section key={t}>
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-5 border-b border-neutral-200 pb-2">{t}</h2>
                  {/* [display:grid], not .grid: mobile.css forces every .grid to one column, too big for portraits */}
                  <ul className="[display:grid] grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                    {list.map(m => <Card key={m.id} m={m} />)}
                  </ul>
                </section>
              ))}

              {past.length > 0 && (
                <section className="pt-8 border-t-2 border-neutral-200">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-diplomatic-900 mb-2 text-center">Past Members</h2>
                  <p className="text-neutral-500 text-center mb-8">Thank you to everyone who helped build TuronMUN.</p>
                  <div className="space-y-8">
                    {byTeam(past).map(([t, list]) => (
                      <div key={t}>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">{t}</h3>
                        <ul className="[display:grid] grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {list.map(m => <PastCard key={m.id} m={m} />)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Team;

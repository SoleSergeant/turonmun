import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UsersRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Seo } from '../components/seo';
import { supabase } from '@/integrations/supabase/client';
import { useContent, useFill } from '@/content/store';
import type { TeamMember } from './admin/AdminTeam';

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const Team = () => {
  const text = useContent('pages');
  const fill = useFill();
  // RLS only returns visible rows to the public.
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('team_members' as any) as any)
        .select('id, name, role, team, photo_url, link_url, sort_order')
        .order('sort_order').order('name');
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });
  // Teams appear in the order of their first (lowest sort_order) member.
  const teams = Array.from(new Set(members.map(m => m.team)));

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
              {teams.map(t => (
                <section key={t}>
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-5 border-b border-neutral-200 pb-2">{t}</h2>
                  {/* [display:grid], not .grid: mobile.css forces every .grid to one column, too big for portraits */}
                  <ul className="[display:grid] grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                    {members.filter(m => m.team === t).map(m => {
                      const card = (
                        <>
                          <div className="aspect-square bg-diplomatic-100 flex items-center justify-center overflow-hidden">
                            {m.photo_url ? (
                              <img loading="lazy" decoding="async" src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl font-display font-bold text-diplomatic-400" aria-hidden="true">{initials(m.name)}</span>
                            )}
                          </div>
                          <div className="p-3 text-center">
                            <p className="font-bold text-diplomatic-900 leading-tight">{m.name}</p>
                            {m.role && <p className="text-sm text-neutral-500 mt-1">{m.role}</p>}
                          </div>
                        </>
                      );
                      return (
                        <li key={m.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                          {m.link_url ? (
                            <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500">
                              {card}
                            </a>
                          ) : card}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Team;

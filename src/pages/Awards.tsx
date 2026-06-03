import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';

const AWARD_DEFS = [
  { key: 'best_delegate', label: 'Best Delegate' },
  { key: 'best_speaker', label: 'Best Speaker' },
  { key: 'honorable_mention', label: 'Honorable Mention' },
];

const Awards = () => {
  const [published, setPublished] = useState(false);
  const [committees, setCommittees] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        const { data: settings } = await (supabase.from('award_settings' as any) as any)
          .select('published').eq('id', 1).single();
        const isPub = !!settings?.published;
        setPublished(isPub);
        if (isPub) {
          const [{ data: aw }, { data: comms }] = await Promise.all([
            (supabase.from('committee_awards' as any) as any).select('*'),
            supabase.from('committees').select('id, name').order('name'),
          ]);
          setAwards(aw || []);
          setCommittees(comms || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const awardFor = (committeeId: string, type: string) =>
    awards.find(a => a.committee_id === committeeId && a.award_type === type);

  // Only show committees that actually have at least one award
  const committeesWithAwards = committees.filter(c =>
    AWARD_DEFS.some(d => awardFor(c.id, d.key))
  );

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-100 text-gold-600 mb-4">
              <Trophy className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-diplomatic-900 mb-3">Award Winners</h1>
            <p className="text-neutral-600 max-w-xl mx-auto">Celebrating the outstanding delegates of TuronMUN.</p>
          </motion.div>

          {loading ? (
            <div className="text-center py-16 text-neutral-400">Loading…</div>
          ) : !published ? (
            <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
              <Trophy className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-diplomatic-900 mb-2">Winners announced after the conference</h2>
              <p className="text-neutral-500">Award winners will be published here once the conference concludes. Stay tuned!</p>
            </div>
          ) : committeesWithAwards.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">Winners will appear here shortly.</div>
          ) : (
            <div className="space-y-10 max-w-5xl mx-auto">
              {committeesWithAwards.map(c => (
                <div key={c.id}>
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4 border-b border-neutral-200 pb-2">{c.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {AWARD_DEFS.map(d => {
                      const a = awardFor(c.id, d.key);
                      if (!a) return null;
                      return (
                        <div key={d.key} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                          <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                            {a.photo_url ? (
                              <img src={a.photo_url} alt={a.winner_name} className="w-full h-full object-cover" />
                            ) : (
                              <Trophy className="h-12 w-12 text-neutral-300" />
                            )}
                          </div>
                          <div className="p-4 text-center">
                            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-gold-600 bg-gold-50 rounded-full px-3 py-0.5 mb-2">
                              {d.label}
                            </span>
                            <p className="font-bold text-diplomatic-900">{a.winner_name}</p>
                            {a.winner_country && <p className="text-sm text-neutral-500">{a.winner_country}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Awards;

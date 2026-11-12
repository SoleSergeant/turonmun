import React, { useEffect, useState } from 'react';
import { Award, History, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABEL, type Participation } from '@/lib/participations';

/** Every TuronMUN event this account took part in, newest first. */
export default function MyHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Participation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('participations').select('*').eq('user_id', user.id)
      // Rows are saved when each event ends, so this is newest event first (debates have no season).
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows(data ?? []);
      });
  }, [user?.id]);

  const awards = rows?.filter(r => r.award).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">My history</h1>
        <p className="text-white/50">
          {rows && rows.length > 0
            ? `${rows.length} ${rows.length === 1 ? 'event' : 'events'} with TuronMUN${awards ? ` · ${awards} ${awards === 1 ? 'award' : 'awards'}` : ''}`
            : 'Your TuronMUN conferences, roles and awards'}
        </p>
      </div>

      {rows === null ? (
        <div className="flex items-center gap-2 text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : error ? (
        <div className="glass-card p-6 text-red-300">Could not load your history: {error}</div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <History className="mx-auto mb-3 h-8 w-8 text-white/30" />
          <p className="text-white/80 font-medium">No past events yet</p>
          <p className="mt-1 text-sm text-white/50">
            Your record appears here after each conference ends. Took part in an earlier season with a different email? Contact the Secretariat to link it.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-white/10 pl-6">
          {rows.map(r => (
            <li key={r.id} className="relative">
              <span className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-diplomatic-950 ${r.award ? 'bg-gold-400' : 'bg-white/40'}`} aria-hidden />
              <div className="glass-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">{r.event}</h2>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">{ROLE_LABEL[r.role] ?? r.role}</span>
                </div>
                {(r.committee || r.country) && (
                  <p className="mt-1 text-white/70">
                    {r.committee}{r.committee && r.country && ' · '}{r.country && <span className="text-white">{r.country}</span>}
                  </p>
                )}
                {r.award && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold-400/15 px-3 py-1.5 text-sm font-semibold text-gold-300">
                    <Award className="h-4 w-4" /> {r.award}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

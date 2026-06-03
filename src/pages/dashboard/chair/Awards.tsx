import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Lock, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AWARD_DEFS = [
  { key: 'best_delegate', label: 'Best Delegate', color: 'text-gold-400' },
  { key: 'best_speaker', label: 'Best Speaker', color: 'text-emerald-400' },
  { key: 'honorable_mention', label: 'Honorable Mention', color: 'text-blue-400' },
];

interface Ctx {
  committees: any[];
  assignedDelegates: any[];
  loading: boolean;
}

export default function ChairAwards() {
  const ctx = useOutletContext<Ctx>();
  const { committees = [], assignedDelegates = [], loading } = ctx || ({} as Ctx);
  const { toast } = useToast();

  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({}); // `${committeeId}:${awardKey}` -> application_id
  const [countryByApp, setCountryByApp] = useState<Record<string, string>>({});
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: admin } = await supabase.from('admin_users').select('id').eq('email', user?.email).single();
        setAdminId((admin as any)?.id ?? null);

        const { data: settings } = await (supabase.from('award_settings' as any) as any).select('locked').eq('id', 1).single();
        setLocked(!!settings?.locked);

        const ids = committees.map((c: any) => c.id);
        if (ids.length) {
          const { data: awards } = await (supabase.from('committee_awards' as any) as any).select('*').in('committee_id', ids);
          const p: Record<string, string> = {};
          (awards || []).forEach((a: any) => { p[`${a.committee_id}:${a.award_type}`] = a.application_id || ''; });
          setPicks(p);
        }

        const appIds = assignedDelegates.map((d: any) => d.id);
        if (appIds.length) {
          const { data: ca } = await supabase.from('country_assignments').select('application_id, country, country_name').in('application_id', appIds);
          const m: Record<string, string> = {};
          (ca || []).forEach((x: any) => { m[x.application_id] = x.country || x.country_name || ''; });
          setCountryByApp(m);
        }
      } finally {
        setLoadingData(false);
      }
    };
    if (committees) load();
  }, [committees, assignedDelegates]);

  const delegatesFor = (committeeId: string) =>
    assignedDelegates.filter((d: any) => d.assigned_committee_id === committeeId);

  const labelFor = (d: any) => {
    const c = countryByApp[d.id] || d.country;
    return c ? `${d.full_name} — ${c}` : d.full_name;
  };

  const saveCommittee = async (committeeId: string) => {
    setSaving(committeeId);
    try {
      for (const def of AWARD_DEFS) {
        const key = `${committeeId}:${def.key}`;
        const appId = picks[key];
        if (appId) {
          const d = assignedDelegates.find((x: any) => x.id === appId);
          const { error } = await (supabase.from('committee_awards' as any) as any).upsert({
            committee_id: committeeId,
            award_type: def.key,
            application_id: appId,
            winner_name: d?.full_name ?? null,
            winner_country: countryByApp[appId] ?? d?.country ?? null,
            nominated_by: adminId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'committee_id,award_type' });
          if (error) throw error;
        } else {
          await (supabase.from('committee_awards' as any) as any)
            .delete().eq('committee_id', committeeId).eq('award_type', def.key);
        }
      }
      toast({ title: 'Awards saved' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Could not save awards', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  if (loading || loadingData) {
    return <div className="flex items-center justify-center min-h-64"><p className="text-white/60">Loading…</p></div>;
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gold-400" /> Committee Awards
        </h2>
        <p className="text-white/60 mt-1">Select the award winners for your committee.</p>
      </div>

      {locked && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300 text-sm">
          <Lock className="w-4 h-4" /> Awards are locked by the organizers — selections can no longer be changed.
        </div>
      )}

      {committees.length === 0 && (
        <div className="glass-card p-12 text-center border border-white/10">
          <p className="text-white/50">You aren't assigned to a committee yet.</p>
        </div>
      )}

      {committees.map((committee: any) => {
        const dels = delegatesFor(committee.id);
        return (
          <div key={committee.id} className="glass-card p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-1">{committee.name}</h3>
            <p className="text-white/40 text-xs mb-5">{dels.length} delegate{dels.length === 1 ? '' : 's'}</p>

            <div className="space-y-4">
              {AWARD_DEFS.map((def) => {
                const key = `${committee.id}:${def.key}`;
                const value = picks[key] || '';
                // exclude delegates picked for the OTHER awards in this committee
                const takenByOthers = AWARD_DEFS
                  .filter(d => d.key !== def.key)
                  .map(d => picks[`${committee.id}:${d.key}`])
                  .filter(Boolean);
                const options = dels.filter((d: any) => d.id === value || !takenByOthers.includes(d.id));
                return (
                  <div key={def.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className={`w-40 shrink-0 text-sm font-bold ${def.color}`}>🏆 {def.label}</span>
                    <select
                      disabled={locked}
                      value={value}
                      onChange={(e) => setPicks(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 bg-diplomatic-900 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gold-400 disabled:opacity-50"
                    >
                      <option value="" className="bg-diplomatic-900">— None —</option>
                      {options.map((d: any) => (
                        <option key={d.id} value={d.id} className="bg-diplomatic-900">{labelFor(d)}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {!locked && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => saveCommittee(committee.id)}
                  disabled={saving === committee.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving === committee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Awards
                </button>
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

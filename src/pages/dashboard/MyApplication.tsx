import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { useContent } from '@/content/store';
import DelegateStatusCard from '@/components/dashboard/DelegateStatusCard';
import { delegateStatus } from '@/lib/delegateStatus';

const card = 'rounded-xl border border-white/10 bg-white/[0.04] p-5 sm:p-6';

export default function MyApplication() {
  const general = useContent('general');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<Tables<'applications'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  // The name on the application row is what the admin exports and prints on
  // certificates. Google sign-in pre-fills it from the account's display name,
  // which isn't always the delegate's real/official name — so let them correct
  // it here. Updates the applications row (source of truth) and mirrors it to
  // the auth profile so greetings/avatars stay in sync.
  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      toast({ title: 'Name required', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }
    if (!application) return;
    setSavingName(true);
    try {
      // Owners have no direct UPDATE on applications (RLS); this SECURITY DEFINER
      // RPC updates only full_name on the caller's own row (migration 034).
      const { error } = await (supabase as any).rpc('update_own_application_name', {
        p_full_name: trimmed,
      });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      setApplication(prev => (prev ? ({ ...prev, full_name: trimmed } as any) : prev));
      setEditingName(false);
      toast({ title: 'Name updated', description: 'Your name for certificates has been saved.' });
    } catch (err: any) {
      console.error('Error updating name:', err);
      toast({ title: 'Update failed', description: err.message || 'Could not update your name.', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  useEffect(() => {
    const loadApplication = async () => {
      // Wait for auth to finish initialising before doing anything
      if (authLoading) return;

      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setApplication(data);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading your application...</p>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">My application</h1>
        <section className={card}>
          <h2 className="text-xl font-semibold text-white">No application yet</h2>
          <p className="mt-1 max-w-xl text-white/70">
            We couldn't find an application for this account. If you already applied, check that you're signed in with the same email you used on the form.
          </p>
          <Link to="/register" className="mt-4 inline-block rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-semibold text-diplomatic-950 hover:bg-gold-300">Apply now</Link>
        </section>
      </div>
    );
  }

  const status = delegateStatus(application as any);

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">My application</h1>

      <DelegateStatusCard status={status} telegramUrl={general.telegram_url} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-12">
          {/* Personal Information */}
          <section className={card}>
            <h2 className="mb-5 text-base font-semibold text-white">Your details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              {[
                { label: 'Full name (used on certificates)', value: application?.full_name, editable: true },
                { label: 'Email', value: application?.email },
                { label: 'Phone', value: application?.phone },
                { label: 'School or university', value: application?.institution },
                { label: 'MUN experience', value: application?.experience, capitalize: true },
                { label: 'Country and city', value: application?.country },
              ].map((field, idx) => {
                const f = field as any;
                return (
                <div key={idx} className="flex flex-col border-b border-white/5 pb-4 last:border-0 md:last:border-b">
                  <span className="mb-1 text-xs text-white/50">{field.label}</span>
                  {f.editable && editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                        autoFocus
                        maxLength={100}
                        className="flex-1 min-w-0 bg-white/10 border border-white/20 focus:border-gold-400/50 rounded-md px-2 py-1 text-sm text-white outline-none"
                        placeholder="Your official full name"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        title="Save"
                        className="p-1.5 rounded-md bg-gold-500 hover:bg-gold-600 text-white disabled:opacity-50"
                      >
                        {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        disabled={savingName}
                        title="Cancel"
                        className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold text-white/90 ${f.capitalize && field.value ? 'capitalize' : ''}`}>
                        {field.value || 'Not provided'}
                      </span>
                      {f.editable && (
                        <button
                          onClick={() => { setNameDraft(application?.full_name || ''); setEditingName(true); }}
                          title="Edit your name (used for certificates)"
                          aria-label="Edit your name"
                          className="text-white/40 hover:text-gold-400 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-5 text-base font-semibold text-white">Committee preferences</h2>

            <div className="space-y-4">
              {[
                { label: 'First choice', value: application?.committee_preference1, color: 'text-white', weight: 'font-semibold' },
                { label: 'Second choice', value: application?.committee_preference2, color: 'text-white/80', weight: 'font-medium' },
                { label: 'Third choice', value: application?.committee_preference3, color: 'text-white/80', weight: 'font-medium' },
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
                  <span className="text-sm text-white/50">{pref.label}</span>
                  <span className={`text-sm ${pref.weight} ${pref.color} tracking-tight`}>
                    {pref.value || 'No selection'}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-white/50">
              We use your choices when assigning seats, but the final committee also depends on which countries are still free.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

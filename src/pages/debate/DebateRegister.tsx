import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Hourglass, Loader2, Pencil, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/content/store';
import DebateLayout, { useDebateRegistrationOpen, inputCls, goldButton, focusRing } from './DebateLayout';
import { useDebatePath } from './paths';
import { useSideStats } from './sides';

export interface DebateRegistration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  telegram: string | null;
  date_of_birth: string | null;
  gender: string | null;
  institution: string;
  grade: string | null;
  city: string | null;
  english_level: string | null;
  experience: string | null;
  past_tournaments: string | null;
  motivation: string | null;
  heard_from: string | null;
  preferred_side: string | null;
  agreed_to_rules: boolean;
  status: 'pending' | 'approved' | 'waitlisted' | 'rejected';
  admin_notes: string | null;
  decision_emailed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const ENGLISH_LEVELS = ['Beginner', 'Intermediate', 'Upper-intermediate', 'Advanced', 'Native / fluent'];
export const EXPERIENCE = [
  { value: 'none', label: 'No experience — this is my first' },
  { value: 'some', label: 'Some — 1 to 3 tournaments' },
  { value: 'experienced', label: 'Experienced — 4 or more tournaments' },
];
const HEARD_FROM = ['Telegram', 'Instagram', 'A friend', 'My school', 'TuronMUN', 'Other'];

export const STATUS_INFO: Record<DebateRegistration['status'], { label: string; icon: typeof Clock; tone: string }> = {
  pending: { label: 'Under review', icon: Clock, tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  approved: { label: 'Accepted', icon: CheckCircle2, tone: 'border-green-400/30 bg-green-400/10 text-green-200' },
  waitlisted: { label: 'Waitlisted', icon: Hourglass, tone: 'border-orange-400/30 bg-orange-400/10 text-orange-200' },
  rejected: { label: 'Not accepted', icon: XCircle, tone: 'border-red-400/30 bg-red-400/10 text-red-200' },
};

type Form = Omit<DebateRegistration, 'id' | 'user_id' | 'status' | 'admin_notes' | 'created_at' | 'updated_at'>;

const emptyForm = (name: string, email: string): Form => ({
  full_name: name, email, phone: '', telegram: '', date_of_birth: '', gender: '', institution: '', grade: '',
  city: '', english_level: '', experience: '', past_tournaments: '', motivation: '', heard_from: '', preferred_side: '', agreed_to_rules: false,
});

function Field({ label, required, children, hint }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/80">{label}{required && <span className="text-gold-300"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/60">{hint}</span>}
    </label>
  );
}

/** Registration form, or the debater's registration + status once submitted. */
export default function DebateRegister() {
  const d = useContent('debate');
  const { open } = useDebateRegistrationOpen();
  const { user, logout, loading: authLoading } = useAuth();
  const path = useDebatePath();
  const [existing, setExisting] = useState<DebateRegistration | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const sideStats = useSideStats();
  const showShares = d.show_side_stats && sideStats.total > 0;

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error: loadErr } = await (supabase.from('debate_registrations' as any) as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (loadErr) setError('Registration is not available yet. Please try again later.');
      setExisting((data as DebateRegistration) || null);
      setForm(data ? { ...emptyForm('', ''), ...(data as DebateRegistration) } : emptyForm(user.user_metadata?.full_name || '', user.email || ''));
      setLoading(false);
    })();
  }, [user]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(f => (f ? { ...f, [key]: value } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form) return;
    if (sideStats.sides.length > 0 && !form.preferred_side) { setError('Please choose the side you would like to be on.'); return; }
    if (!form.agreed_to_rules) { setError('Please agree to the rules to continue.'); return; }
    setError(null);
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: user.email || form.email,
      phone: form.phone.trim(),
      telegram: form.telegram?.trim() || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      institution: form.institution.trim(),
      grade: form.grade?.trim() || null,
      city: form.city?.trim() || null,
      english_level: form.english_level || null,
      experience: form.experience || null,
      past_tournaments: form.past_tournaments?.trim() || null,
      motivation: form.motivation?.trim() || null,
      heard_from: form.heard_from || null,
      preferred_side: form.preferred_side || null,
      agreed_to_rules: true,
    };
    try {
      const table = supabase.from('debate_registrations' as any) as any;
      const { data, error: saveErr } = existing
        ? await table.update(payload).eq('id', existing.id).select().single()
        : await table.insert({ ...payload, user_id: user.id }).select().single();
      if (saveErr) {
        if (saveErr.code === '23505') throw new Error('This account is already registered.');
        throw saveErr;
      }
      setExisting(data as DebateRegistration);
      setEditing(false);
      sideStats.refetch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Could not save your registration.');
    } finally {
      setSaving(false);
    }
  };

  // Signed-out visitors go to the debate sign-in page and come back here.
  if (!authLoading && !user) {
    return <Navigate to={`${path('/login')}?redirect=${encodeURIComponent(path('/register'))}`} replace />;
  }

  if (loading || !form) {
    return (
      <DebateLayout title="Register">
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gold-300" /></div>
      </DebateLayout>
    );
  }

  const signedInAs = (
    <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
      Signed in as {user?.email}
      <button onClick={() => logout()} className={`inline-flex items-center gap-1 rounded hover:text-white ${focusRing}`}><LogOut className="h-3 w-3" /> Sign out</button>
    </p>
  );

  // ── Already registered: show status ──────────────────────────────────
  if (existing && !editing) {
    const info = STATUS_INFO[existing.status];
    const rows: [string, string | null | undefined][] = [
      ['Name', existing.full_name], ['Email', existing.email], ['Phone', existing.phone], ['Telegram', existing.telegram],
      ['School / university', existing.institution], ['Grade / year', existing.grade], ['City', existing.city],
      ['English level', existing.english_level],
      ['Preferred side', existing.preferred_side],
      ['Experience', EXPERIENCE.find(x => x.value === existing.experience)?.label ?? existing.experience],
    ];
    return (
      <DebateLayout title="My registration">
        <div className="container mx-auto max-w-2xl px-4 py-10 sm:py-16">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-gold-300" />
            <h1 className="mt-4 font-display text-3xl font-bold">{d.success_title}</h1>
            <p className="mt-2 text-white/70">{d.success_text}</p>
          </div>

          <div className={`mt-8 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold ${info.tone}`}>
            <info.icon className="h-5 w-5" /> Status: {info.label}
          </div>

          <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.04]">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-white/65">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>

          {existing.status === 'pending' && (
            <div className="mt-6 text-center">
              <button onClick={() => setEditing(true)} className={`inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10 ${focusRing}`}>
                <Pencil className="h-4 w-4" /> Edit my answers
              </button>
            </div>
          )}
          {signedInAs}
        </div>
      </DebateLayout>
    );
  }

  // ── Closed and not registered ────────────────────────────────────────
  if (!existing && !open) {
    return (
      <DebateLayout title="Register">
        <div className="container mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">{d.form_title}</h1>
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white/70">{d.closed_message}</p>
          <Link to={path('/')} className={`mt-6 inline-block rounded text-sm text-gold-300 hover:underline ${focusRing}`}>← Back</Link>
          {signedInAs}
        </div>
      </DebateLayout>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────
  return (
    <DebateLayout title="Register">
      <div className="container mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <h1 className="text-center font-display text-3xl font-bold">{d.form_title}</h1>
        <p className="mt-2 text-center text-white/70">{d.form_intro}</p>

        <form onSubmit={submit} className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 sm:p-8">
          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-300">About you</legend>
            <Field label="Full name" required>
              <input required value={form.full_name} onChange={e => set('full_name', e.target.value)} className={inputCls} autoComplete="name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" hint="From your account">
                <input value={user?.email || form.email} disabled className={`${inputCls} opacity-60`} />
              </Field>
              <Field label="Phone" required>
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" inputMode="tel" placeholder="+998 90 123 45 67" className={inputCls} />
              </Field>
              <Field label="Telegram username">
                <input value={form.telegram ?? ''} onChange={e => set('telegram', e.target.value)} autoComplete="off" placeholder="@username" className={inputCls} />
              </Field>
              <Field label="Date of birth">
                <input type="date" value={form.date_of_birth ?? ''} onChange={e => set('date_of_birth', e.target.value)} autoComplete="bday" className={inputCls} />
              </Field>
              <Field label="Gender">
                <select value={form.gender ?? ''} onChange={e => set('gender', e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
              <Field label="City / region">
                <input value={form.city ?? ''} onChange={e => set('city', e.target.value)} autoComplete="address-level2" className={inputCls} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-300">Education</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="School / university" required>
                <input required value={form.institution} onChange={e => set('institution', e.target.value)} autoComplete="organization" className={inputCls} />
              </Field>
              <Field label="Grade / year">
                <input value={form.grade ?? ''} onChange={e => set('grade', e.target.value)} placeholder="e.g. 10th grade" className={inputCls} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-300">Debate</legend>
            {sideStats.sides.length > 0 && (
              <div role="radiogroup" aria-labelledby="side-label" aria-describedby={d.side_hint ? 'side-hint' : undefined} aria-required="true">
                <p id="side-label" className="text-sm text-white/80">{d.side_label}<span className="text-gold-300"> *</span></p>
                {d.side_hint && <p id="side-hint" className="mt-1 text-xs text-white/60">{d.side_hint}</p>}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {sideStats.shares.map(({ side, percent }) => {
                    const checked = form.preferred_side === side;
                    return (
                      <label
                        key={side}
                        className={`relative cursor-pointer rounded-xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-300 ${checked ? 'border-gold-400 bg-gold-400/10' : 'border-white/15 bg-white/[0.03] hover:border-white/30'}`}
                      >
                        <input
                          type="radio"
                          name="preferred_side"
                          value={side}
                          checked={checked}
                          onChange={() => set('preferred_side', side)}
                          className="sr-only"
                        />
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{side}</span>
                          <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? 'border-gold-400' : 'border-white/30'}`}>
                            {checked && <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />}
                          </span>
                        </span>
                        {showShares && (
                          <span className="mt-3 block">
                            <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                              <span className="block h-full rounded-full bg-gold-400/80 transition-all" style={{ width: `${percent}%` }} />
                            </span>
                            <span className="mt-1.5 block text-xs text-white/65">{percent}% of registrations</span>
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="English level">
                <select value={form.english_level ?? ''} onChange={e => set('english_level', e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {ENGLISH_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Debate experience">
                <select value={form.experience ?? ''} onChange={e => set('experience', e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {EXPERIENCE.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Tournaments you've taken part in">
              <textarea rows={2} value={form.past_tournaments ?? ''} onChange={e => set('past_tournaments', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Why do you want to join?">
              <textarea rows={4} value={form.motivation ?? ''} onChange={e => set('motivation', e.target.value)} className={inputCls} />
            </Field>
            <Field label="How did you hear about us?">
              <select value={form.heard_from ?? ''} onChange={e => set('heard_from', e.target.value)} className={inputCls}>
                <option value="">—</option>
                {HEARD_FROM.map(h => <option key={h}>{h}</option>)}
              </select>
            </Field>
          </fieldset>

          <label className="flex items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.agreed_to_rules}
              onChange={e => set('agreed_to_rules', e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/30 bg-white/10 accent-gold-400"
            />
            <span>{d.rules_label} <span className="text-gold-300">*</span></span>
          </label>

          <div ref={errorRef} aria-live="polite">{error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}</div>

          <div className="flex flex-col-reverse items-center justify-end gap-3 sm:flex-row">
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className={`rounded-lg px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 ${focusRing}`}>Cancel</button>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`${goldButton} w-full px-6 py-3.5 sm:w-auto`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {existing ? 'Save changes' : 'Submit registration'}
            </button>
          </div>
        </form>
        {signedInAs}
      </div>
    </DebateLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, ChevronLeft, CheckCircle, Send, AlertCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFormSettings } from '@/hooks/useFormSettings';

const COMMITTEES = ['UNGA', 'WTO', 'ECOSOC', 'HRC'];
const ROLES = ['Chair', 'Co-Chair'];
const EXPERIENCE_LEVELS = ['None', '1 conference', '2-3 conferences', '4+ conferences'];

interface ChairFormData {
  fullName: string;
  email: string;
  telegramUsername: string;
  institution: string;
  countryAndCity: string;
  rolePreference: string;
  committeePreference1: string;
  committeePreference2: string;
  munExperienceYears: string;
  previousChairExperience: string;
  whyChair: string;
  leadershipExample: string;
  agreeToTerms: boolean;
}

const EMPTY_FORM: ChairFormData = {
  fullName: '',
  email: '',
  telegramUsername: '',
  institution: '',
  countryAndCity: '',
  rolePreference: '',
  committeePreference1: '',
  committeePreference2: '',
  munExperienceYears: '',
  previousChairExperience: '',
  whyChair: '',
  leadershipExample: '',
  agreeToTerms: false,
};

const TOTAL_STEPS = 4;

export default function ChairApplication() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: formSettings, isEffectivelyClosed, closedReason, deadlineSoon } = useFormSettings('chair');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ChairFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Pre-fill from auth user
  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      email: user.email ?? '',
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    }));

    // Check for existing chair application by looking for the notes marker
    // (application_type column may not exist yet — migration 009 pending)
    (supabase.from('applications') as any)
      .select('id, notes')
      .eq('user_id', user.id)
      .limit(20)
      .then(({ data }: { data: any[] | null }) => {
        if (data?.some((a: any) => a.notes?.includes('APPLICATION TYPE: chair'))) {
          setAlreadyApplied(true);
        }
      });
  }, [user]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const set = (field: keyof ChairFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.telegramUsername || !formData.institution || !formData.countryAndCity) {
        toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.rolePreference || !formData.committeePreference1 || !formData.committeePreference2) {
        toast({ title: 'Missing Preferences', description: 'Please select your role and committee preferences.', variant: 'destructive' });
        return false;
      }
    }
    if (step === 3) {
      if (!formData.munExperienceYears || !formData.whyChair || formData.whyChair.length < 50) {
        toast({ title: 'Essay Required', description: 'Please answer all essay questions (minimum 50 characters for main essay).', variant: 'destructive' });
        return false;
      }
    }
    if (step === 4) {
      if (!formData.agreeToTerms) {
        toast({ title: 'Agreement Required', description: 'Please agree to the terms to submit.', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => { if (validate()) setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const basePayload: Record<string, any> = {
        user_id: user?.id ?? null,
        full_name: formData.fullName,
        email: formData.email,
        telegram_username: formData.telegramUsername,
        institution: formData.institution,
        country: formData.countryAndCity,
        phone: '',
        experience: formData.munExperienceYears,
        committee_preference1: formData.committeePreference1,
        committee_preference2: formData.committeePreference2,
        committee_preference3: '',
        motivation: formData.whyChair,
        has_ielts: false,
        has_sat: false,
        discount_eligibility: 'None',
        fee_agreement: true,
        final_confirmation: true,
        payment_amount: 0,
        // Notes always carry the type marker so the admin filter works
        // regardless of whether the application_type column exists.
        notes: [
          'APPLICATION TYPE: chair',
          `Role Preference: ${formData.rolePreference}`,
          `Previous Chair Experience: ${formData.previousChairExperience || 'None'}`,
          `Leadership Example: ${formData.leadershipExample || 'N/A'}`,
        ].join('\n'),
      };

      // Try inserting with application_type column (migration 009).
      // If the column doesn't exist yet, fall back to base payload alone —
      // the notes marker is enough for the admin to identify chair applications.
      let { error } = await (supabase.from('applications') as any)
        .insert({ ...basePayload, application_type: 'chair' });

      if (error?.message?.includes('application_type')) {
        // Column not yet created — retry without it
        const { error: retryError } = await (supabase.from('applications') as any)
          .insert(basePayload);
        error = retryError;
      }

      if (error) throw error;

      setSubmitted(true);
      toast({ title: 'Application Submitted!', description: 'Your chair application has been received. We will be in touch soon.' });
      setTimeout(() => navigate('/'), 5000);
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadyApplied) {
    return (
      <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
        <Navbar />
        <main className="flex-grow pt-20 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-diplomatic-900 mb-3">Already Applied</h2>
            <p className="text-neutral-600 mb-6">You have already submitted a chair application. Each person may only apply once per season.</p>
            <Link to="/" className="inline-block bg-diplomatic-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-diplomatic-800 transition-colors">
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isEffectivelyClosed) {
    return (
      <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
        <Navbar />
        <main className="flex-grow pt-20 pb-12 flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-diplomatic-900 mb-3">Chair Applications Closed</h2>
            <p className="text-neutral-600 mb-6">
              {closedReason ?? 'Chair applications are not currently open.'}
            </p>
            <Link to="/" className="inline-block bg-diplomatic-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-diplomatic-800 transition-colors">
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
        <Navbar />
        <main className="flex-grow pt-20 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-diplomatic-900 mb-3">Application Received!</h2>
            <p className="text-neutral-600 mb-2">Thank you for applying to be a chair/staff at TuronMUN.</p>
            <p className="text-neutral-500 text-sm">We will review your application and reach out via Telegram or email. Redirecting to home…</p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-400 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-diplomatic-800 mb-1';
  const selectCls = `${inputCls} bg-white`;

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      {deadlineSoon && formSettings?.deadline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-800 text-sm">
          <Clock size={15} />
          <span>Application deadline: <strong>{new Date(formSettings.deadline).toLocaleString()}</strong></span>
        </div>
      )}
      <main className="flex-grow pt-20 pb-12">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-diplomatic-100 text-diplomatic-700 text-sm font-semibold mb-4">
              <Shield className="w-4 h-4" />
              Chair Application
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-diplomatic-900 mb-2">
              Apply as Chair or Co-Chair
            </h1>
            <p className="text-neutral-500 text-sm">Season 7 — Lead a committee and shape the TuronMUN experience</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <React.Fragment key={i}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i + 1 <= step ? 'bg-diplomatic-700 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={`flex-1 h-1 rounded-full transition-colors ${i + 1 < step ? 'bg-diplomatic-700' : 'bg-neutral-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">Personal Information</h2>
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input className={inputCls} value={formData.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address *</label>
                    <input className={inputCls} type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Telegram Username *</label>
                    <input className={inputCls} value={formData.telegramUsername} onChange={e => set('telegramUsername', e.target.value)} placeholder="@username" />
                  </div>
                  <div>
                    <label className={labelCls}>Institution / School *</label>
                    <input className={inputCls} value={formData.institution} onChange={e => set('institution', e.target.value)} placeholder="Your school or university" />
                  </div>
                  <div>
                    <label className={labelCls}>Country & City *</label>
                    <input className={inputCls} value={formData.countryAndCity} onChange={e => set('countryAndCity', e.target.value)} placeholder="e.g. Uzbekistan, Tashkent" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">Role & Committee Preferences</h2>
                  <div>
                    <label className={labelCls}>Preferred Role *</label>
                    <select className={selectCls} value={formData.rolePreference} onChange={e => set('rolePreference', e.target.value)}>
                      <option value="">Select a role</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>First Committee Preference *</label>
                    <select className={selectCls} value={formData.committeePreference1} onChange={e => set('committeePreference1', e.target.value)}>
                      <option value="">Select committee</option>
                      {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Second Committee Preference *</label>
                    <select className={selectCls} value={formData.committeePreference2} onChange={e => set('committeePreference2', e.target.value)}>
                      <option value="">Select committee</option>
                      {COMMITTEES.filter(c => c !== formData.committeePreference1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">Experience & Essays</h2>
                  <div>
                    <label className={labelCls}>MUN Experience Level *</label>
                    <select className={selectCls} value={formData.munExperienceYears} onChange={e => set('munExperienceYears', e.target.value)}>
                      <option value="">Select experience level</option>
                      {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Previous Chair / Staff Experience</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      value={formData.previousChairExperience}
                      onChange={e => set('previousChairExperience', e.target.value)}
                      placeholder="List any previous chairing or staff experience (optional)"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Why do you want to be a Chair at TuronMUN? *</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={5}
                      value={formData.whyChair}
                      onChange={e => set('whyChair', e.target.value)}
                      placeholder="Explain your motivation, what you hope to contribute, and why TuronMUN (min. 50 characters)"
                    />
                    <p className="text-xs text-neutral-400 mt-1">{formData.whyChair.length} / 50 min. characters</p>
                  </div>
                  <div>
                    <label className={labelCls}>Describe a time you led a group through a challenge</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={4}
                      value={formData.leadershipExample}
                      onChange={e => set('leadershipExample', e.target.value)}
                      placeholder="Optional — but strongly recommended"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">Review & Submit</h2>

                  {/* Summary */}
                  <div className="bg-diplomatic-50 rounded-xl p-4 space-y-2 text-sm">
                    {[
                      ['Name', formData.fullName],
                      ['Email', formData.email],
                      ['Telegram', formData.telegramUsername],
                      ['Institution', formData.institution],
                      ['Location', formData.countryAndCity],
                      ['Role', formData.rolePreference],
                      ['Committee 1', formData.committeePreference1],
                      ['Committee 2', formData.committeePreference2],
                      ['Experience', formData.munExperienceYears],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-neutral-500 flex-shrink-0">{label}</span>
                        <span className="text-diplomatic-900 font-medium text-right">{value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={e => set('agreeToTerms', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-diplomatic-700 focus:ring-diplomatic-400"
                    />
                    <span className="text-sm text-neutral-600">
                      I confirm that the information provided is accurate. I understand that TuronMUN may contact me via Telegram or email about my application.
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium text-sm hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-diplomatic-700 hover:bg-diplomatic-800 text-white font-semibold text-sm transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-neutral-400 mt-4">
            <Link to="/register" className="hover:text-neutral-600 transition-colors">← Back to Registration</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

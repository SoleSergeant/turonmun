import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, ChevronLeft, CheckCircle, Send, AlertCircle, Clock, Save, Wallet } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFormSettings } from '@/hooks/useFormSettings';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import DynamicFormStep from '@/components/registration/DynamicFormStep';
import type { FormQuestion } from '@/hooks/useFormSettings';

const TOTAL_STEPS = 3;
const STEP_SUBTITLES: Record<number, string> = {
  1: 'Tell us a bit about yourself',
  2: 'Tell us why you want to volunteer',
};

const EMPTY_FORM: Record<string, any> = {
  fullName: '',
  dateOfBirth: '',
  location: '',
  telegramOrPhone: '',
  schoolName: '',
  whatYouBring: '',
  anythingElse: '',
  commitToDeposit: '', // '' | 'yes' | 'no'
};

export default function VolunteerApplication() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: formSettings, isEffectivelyClosed, closedReason, deadlineSoon } = useFormSettings('volunteer');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const depositAmount = formSettings?.fee_amount ?? 40000;

  const { restoredAt, clearDraft } = useFormAutosave(
    'turonmun:draft:volunteer', formData, setFormData, step, setStep,
  );

  // Pre-fill name + check for existing volunteer application
  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      fullName: prev.fullName || user.user_metadata?.full_name || user.user_metadata?.name || '',
    }));
    (supabase.from('volunteer_applications') as any)
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }: { data: any[] | null }) => {
        if (data && data.length > 0) setAlreadyApplied(true);
      });
  }, [user]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Helpers ──────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const questionsForStep = (s: number): FormQuestion[] =>
    (formSettings?.form_questions ?? [])
      .filter(q => q.step === s)
      .sort((a, b) => a.order - b.order);

  const hasDynamicQuestions = (s: number) =>
    (formSettings?.form_questions ?? []).some(q => q.step === s);

  // ── Navigation ───────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 1 && !hasDynamicQuestions(1)) {
      if (!formData.fullName.trim()) return 'Please enter your full name.';
      if (!formData.dateOfBirth) return 'Please enter your birthday.';
      if (!formData.location.trim()) return 'Please tell us where you live.';
      if (!formData.telegramOrPhone.trim()) return 'Please share a Telegram username or phone number.';
    }
    if (s === 2 && !hasDynamicQuestions(2)) {
      if (!formData.whatYouBring.trim() || formData.whatYouBring.trim().length < 30) {
        return 'Please tell us what you will bring to the team (at least 30 characters).';
      }
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      toast({ title: 'Missing information', description: err, variant: 'destructive' });
      return;
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (formData.commitToDeposit !== 'yes' && formData.commitToDeposit !== 'no') {
      toast({ title: 'One more thing', description: 'Please answer the commitment question.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect any dynamic-question answers that aren't part of the fixed
      // S6 fieldset into `notes` so admins can see them.
      const HARDCODED_KEYS = new Set([
        'fullName', 'dateOfBirth', 'location', 'telegramOrPhone',
        'schoolName', 'whatYouBring', 'anythingElse', 'commitToDeposit',
      ]);
      const dynamicLines = (formSettings?.form_questions ?? [])
        .filter(q => q.visible && !HARDCODED_KEYS.has(q.name))
        .map(q => {
          const v = formData[q.name];
          const str =
            typeof v === 'boolean' ? (v ? 'Yes' : 'No')
            : Array.isArray(v) ? v.join(', ')
            : v == null ? ''
            : String(v).trim();
          return str ? `${q.label}: ${str}` : null;
        })
        .filter((line): line is string => !!line);

      const payload = {
        user_id: user?.id ?? null,
        email: user?.email ?? '',
        full_name: formData.fullName.trim(),
        date_of_birth: formData.dateOfBirth,
        location: formData.location.trim(),
        telegram_or_phone: formData.telegramOrPhone.trim(),
        school_name: formData.schoolName.trim() || null,
        what_you_bring: formData.whatYouBring.trim(),
        anything_else: formData.anythingElse.trim() || null,
        commit_to_deposit: formData.commitToDeposit === 'yes',
        notes: dynamicLines.length ? dynamicLines.join('\n') : null,
        status: 'pending',
        payment_status: 'pending',
      };

      const { error } = await (supabase.from('volunteer_applications') as any).insert(payload);
      if (error) throw error;

      clearDraft();
      setSubmitted(true);
      toast({ title: 'Application Submitted!', description: 'Your volunteer application has been received. We will be in touch soon.' });
      setTimeout(() => navigate('/'), 5000);
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Early-return screens ─────────────────────────────────────────────
  if (alreadyApplied) {
    return (
      <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
        <Navbar />
        <main className="flex-grow pt-20 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-diplomatic-900 mb-3">Already Applied</h2>
            <p className="text-neutral-600 mb-6">You have already submitted a volunteer application. Each person may only apply once per season.</p>
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
            <h2 className="text-2xl font-bold text-diplomatic-900 mb-3">Volunteer Applications Closed</h2>
            <p className="text-neutral-600 mb-6">{closedReason ?? 'Volunteer applications are not currently open.'}</p>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-diplomatic-900 mb-3">Application Received!</h2>
            <p className="text-neutral-600 mb-2">Thank you for applying to volunteer at TuronMUN.</p>
            <p className="text-neutral-500 text-sm">We will review your application and reach out via Telegram or email. Redirecting to home…</p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Shared CSS helpers ───────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-400 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-diplomatic-800 mb-1';
  const helpCls  = 'text-xs text-neutral-500 mt-1';

  // Use admin-configured step labels when available, otherwise sensible defaults.
  const stepLabels = formSettings?.step_labels?.length
    ? formSettings.step_labels.slice(0, TOTAL_STEPS)
    : ['Personal Info', 'Motivation', 'Commitment'];

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      {deadlineSoon && formSettings?.deadline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-800 text-sm">
          <Clock size={15} />
          <span>Application deadline: <strong>{new Date(formSettings.deadline).toLocaleString()}</strong></span>
        </div>
      )}
      {restoredAt && !submitted && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-center gap-3 text-emerald-800 text-sm">
          <Save size={15} />
          <span>Restored your saved draft from <strong>{restoredAt.toLocaleString()}</strong> — keep going where you left off.</span>
          <button
            onClick={() => { if (confirm('Discard the saved draft and start over?')) { clearDraft(); window.location.reload(); } }}
            className="ml-2 text-emerald-700 underline hover:text-emerald-900 text-xs"
          >
            Start over
          </button>
        </div>
      )}
      <main className="flex-grow pt-20 pb-12">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-6 mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold mb-4">
              <Heart className="w-4 h-4" />
              Volunteer Application
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-diplomatic-900 mb-2">
              Volunteer at TuronMUN
            </h1>
            <p className="text-neutral-500 text-sm">Season 7 — Help make the conference unforgettable</p>
          </div>

          {/* Deposit notice — surfaced up-front, like the S6 Google Form intro */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Wallet className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <strong>Refundable deposit:</strong> To ensure commitment and avoid
              last-minute absences, selected volunteers pay a <strong>{depositAmount.toLocaleString()} UZS</strong> deposit
              that is refunded after the conference.
            </div>
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

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Step 1: Personal Info ─────────────────────────────── */}
              {step === 1 && (hasDynamicQuestions(1) ? (
                <DynamicFormStep
                  step={1}
                  stepTitle={`Step 1 — ${stepLabels[0]}`}
                  stepSubtitle={STEP_SUBTITLES[1]}
                  questions={questionsForStep(1)}
                  formData={formData}
                  handleChange={handleChange}
                  nextStep={nextStep}
                  prevStep={prevStep}
                  isFirst
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8 space-y-4">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">About You</h2>
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input className={inputCls} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your full name" />
                    <p className={helpCls}>Used for badges and certificates — please make sure it is correct.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Birthday *</label>
                    <input className={inputCls} type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={labelCls}>Where do you live? *</label>
                    <input className={inputCls} name="location" value={formData.location} onChange={handleChange} placeholder="City, Region" />
                  </div>
                  <div>
                    <label className={labelCls}>Telegram username and/or phone number *</label>
                    <input className={inputCls} name="telegramOrPhone" value={formData.telegramOrPhone} onChange={handleChange} placeholder="@username or +998…" />
                  </div>
                  <div>
                    <label className={labelCls}>Name of school <span className="text-neutral-400 text-xs font-normal">(Optional)</span></label>
                    <input className={inputCls} name="schoolName" value={formData.schoolName} onChange={handleChange} placeholder="Leave blank if you have already graduated" />
                  </div>
                </div>
              ))}

              {/* ── Step 2: Motivation ────────────────────────────────── */}
              {step === 2 && (hasDynamicQuestions(2) ? (
                <DynamicFormStep
                  step={2}
                  stepTitle={`Step 2 — ${stepLabels[1]}`}
                  stepSubtitle={STEP_SUBTITLES[2]}
                  questions={questionsForStep(2)}
                  formData={formData}
                  handleChange={handleChange}
                  nextStep={nextStep}
                  prevStep={prevStep}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8 space-y-4">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">Why You?</h2>
                  <div>
                    <label className={labelCls}>What will you bring to the team and to the event? *</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      name="whatYouBring" rows={6}
                      value={formData.whatYouBring}
                      onChange={handleChange}
                      placeholder="Creativity, leadership, hard work, passion for global issues — tell us how you can contribute (min. 30 characters)"
                    />
                    <p className={helpCls}>{formData.whatYouBring.length} / 30 min. characters</p>
                  </div>
                  <div>
                    <label className={labelCls}>Anything else you'd like us to know? <span className="text-neutral-400 text-xs font-normal">(Optional)</span></label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      name="anythingElse" rows={4}
                      value={formData.anythingElse}
                      onChange={handleChange}
                      placeholder="Anything else about you, your experience, or how we can best work with you"
                    />
                  </div>
                </div>
              ))}

              {/* ── Step 3: Commitment & Review (always hardcoded) ────── */}
              {step === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-diplomatic-900 mb-4">Commitment & Review</h2>

                  <div className="bg-diplomatic-50 rounded-xl p-4 space-y-2 text-sm">
                    {[
                      ['Name', formData.fullName],
                      ['Birthday', formData.dateOfBirth],
                      ['Location', formData.location],
                      ['Telegram / Phone', formData.telegramOrPhone],
                      ['School', formData.schoolName],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-neutral-500 flex-shrink-0">{label}</span>
                        <span className="text-diplomatic-900 font-medium text-right">{value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-diplomatic-800 mb-3">
                      Are you ready to commit to all requirements, including paying
                      the <strong>{depositAmount.toLocaleString()} UZS</strong> attendance fee
                      which will be refunded after participation, if selected? *
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['yes', 'no'] as const).map(opt => {
                        const selected = formData.commitToDeposit === opt;
                        return (
                          <label
                            key={opt}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                              selected
                                ? 'border-diplomatic-600 bg-diplomatic-50 ring-2 ring-diplomatic-200'
                                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="commitToDeposit"
                              value={opt}
                              checked={selected}
                              onChange={handleChange}
                              className="w-4 h-4 text-diplomatic-700 focus:ring-diplomatic-400"
                            />
                            <span className="text-sm font-medium capitalize text-diplomatic-900">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons — shown only for hardcoded steps (DynamicFormStep has its own) */}
          {(step === 3 || (step <= 2 && !hasDynamicQuestions(step))) && (
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
          )}

          <p className="text-center text-xs text-neutral-400 mt-4">
            <Link to="/register" className="hover:text-neutral-600 transition-colors">← Back to Registration</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

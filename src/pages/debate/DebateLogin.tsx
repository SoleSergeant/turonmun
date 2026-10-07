import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/content/store';
import DebateLayout from './DebateLayout';
import { useDebatePath } from './paths';

type Mode = 'signin' | 'signup' | 'reset';

const inputCls = 'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30';

/** Sign in / create account for Turon Debate (same accounts as the MUN site). */
export default function DebateLogin() {
  const d = useContent('debate');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const path = useDebatePath();
  const redirect = params.get('redirect') || path('/register');
  const { user, login, signup, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate(redirect, { replace: true });
  }, [user, redirect, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const res = await login(email.trim(), password);
        if (!res.success) throw new Error(res.error?.message || 'Could not sign in');
        navigate(redirect, { replace: true });
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
        const res = await signup(email.trim(), password, fullName.trim(), redirect);
        if (!res.success) throw new Error(res.error?.message || 'Could not create the account');
        // If email confirmation is on, there's no session yet.
        setNotice(`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account — it brings you straight back to registration.`);
      } else {
        const res = await resetPassword(email.trim());
        if (!res.success) throw new Error(res.error?.message || 'Could not send the reset email');
        setNotice(`If ${email.trim()} has an account, a password reset link is on its way.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const res = await signInWithGoogle(redirect);
    if (!res.success) setError(res.error?.message || 'Google sign-in failed');
  };

  const titles: Record<Mode, string> = { signin: 'Sign in', signup: 'Create your account', reset: 'Reset your password' };

  return (
    <DebateLayout title={titles[mode]}>
      <div className="container mx-auto flex max-w-md flex-col px-4 py-14">
        <h1 className="text-center font-display text-3xl font-bold">{titles[mode]}</h1>
        <p className="mt-2 text-center text-sm text-white/60">
          {mode === 'reset' ? 'Enter your email and we’ll send you a link.' : `To register for ${d.name}. Already have a TuronMUN account? Use it here.`}
        </p>

        {notice ? (
          <div className="mt-8 rounded-xl border border-green-400/30 bg-green-400/10 p-5 text-center">
            <MailCheck className="mx-auto h-8 w-8 text-green-300" />
            <p className="mt-3 text-sm text-green-100">{notice}</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            {mode !== 'reset' && (
              <>
                <button
                  type="button"
                  onClick={google}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-2.5 font-medium text-gray-800 hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                  Continue with Google
                </button>
                <div className="my-5 flex items-center gap-3 text-xs text-white/40">
                  <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
                </div>
              </>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <label className="block text-sm">
                  <span className="mb-1 block text-white/70">Full name</span>
                  <input required value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} autoComplete="name" />
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Email</span>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
              </label>
              {mode !== 'reset' && (
                <label className="block text-sm">
                  <span className="mb-1 block text-white/70">Password</span>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputCls}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </label>
              )}

              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-400 px-4 py-2.5 font-semibold text-diplomatic-950 hover:bg-gold-300 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm text-white/60">
              {mode === 'signin' && (
                <>
                  <p>New here? <button type="button" onClick={() => setMode('signup')} className="font-medium text-gold-300 hover:underline">Create an account</button></p>
                  <p><button type="button" onClick={() => setMode('reset')} className="hover:underline">Forgot your password?</button></p>
                </>
              )}
              {mode !== 'signin' && (
                <p>Already have an account? <button type="button" onClick={() => setMode('signin')} className="font-medium text-gold-300 hover:underline">Sign in</button></p>
              )}
            </div>
          </div>
        )}
      </div>
    </DebateLayout>
  );
}

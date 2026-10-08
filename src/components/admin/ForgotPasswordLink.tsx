import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * "Forgot password?" for the admin and chair logins. Emails a reset link
 * that comes back to this same subdomain's /reset-password-change page.
 * (Add https://admin.turonmun.com/** and https://chair.turonmun.com/** to
 * Supabase → Authentication → URL Configuration → Redirect URLs.)
 */
export default function ForgotPasswordLink({ email, subdomain }: { email: string; subdomain: 'admin' | 'chair' }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast({ title: 'Enter your email first', description: 'Type your email above, then click "Forgot password?" again.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const onSubdomain = window.location.hostname.startsWith(`${subdomain}.`);
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password-change${onSubdomain ? '' : `?subdomain=${subdomain}`}`,
    });
    setBusy(false);
    if (error) toast({ title: 'Could not send the reset email', description: error.message, variant: 'destructive' });
    // Same message whether or not the account exists, so it can't be used to probe emails.
    else toast({ title: 'Check your email', description: `If ${address} has an account, a password reset link is on its way.` });
  };

  return (
    <button
      type="button"
      onClick={send}
      disabled={busy}
      className="text-sm font-medium text-diplomatic-700 hover:underline disabled:opacity-60"
    >
      {busy ? 'Sending…' : 'Forgot password?'}
    </button>
  );
}

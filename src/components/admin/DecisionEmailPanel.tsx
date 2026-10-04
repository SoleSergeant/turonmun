import React, { useMemo, useState } from 'react';
import { Mail, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendEmails, templates } from '@/lib/email';
import { isChairApplication } from '@/lib/applications';

interface DecisionApp {
  id: string;
  full_name: string;
  email: string;
  status: string;
  application_type?: string | null;
  notes?: string | null;
  decision_emailed_at?: string | null;
}

/**
 * Emails accepted / rejected delegates their decision, once. Each send
 * stamps applications.decision_emailed_at so nobody is emailed twice.
 * Chair applicants are left out: they are handled in Chair Management.
 */
const DecisionEmailPanel: React.FC<{ applications: DecisionApp[]; onSent: () => void }> = ({ applications, onSent }) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<'approved' | 'rejected' | null>(null);

  const pending = useMemo(() => {
    const delegates = applications.filter(a => !isChairApplication(a) && !a.decision_emailed_at);
    return {
      approved: delegates.filter(a => a.status === 'approved'),
      rejected: delegates.filter(a => a.status === 'rejected'),
    };
  }, [applications]);

  const send = async (kind: 'approved' | 'rejected') => {
    const list = pending[kind];
    if (list.length === 0) return;
    const label = kind === 'approved' ? 'acceptance' : 'rejection';
    if (!confirm(`Send the ${label} email to ${list.length} delegate${list.length === 1 ? '' : 's'}?`)) return;

    setBusy(kind);
    try {
      const messages = list.map(a =>
        kind === 'approved'
          ? templates.decisionAccepted({ to: a.email, name: a.full_name })
          : templates.decisionRejected({ to: a.email, name: a.full_name }),
      );
      const sent = await sendEmails(messages, kind === 'approved' ? 'decision_accepted' : 'decision_rejected');

      const { error } = await (supabase.from('applications') as any)
        .update({ decision_emailed_at: new Date().toISOString() })
        .in('id', list.slice(0, sent).map(a => a.id));
      if (error) {
        toast({
          title: `Sent ${sent} email${sent === 1 ? '' : 's'}`,
          description: 'Could not record the send (has migration 038 been applied?). These people may be emailed again.',
          variant: 'destructive',
        });
      } else {
        toast({ title: `Sent ${sent} ${label} email${sent === 1 ? '' : 's'}` });
      }
      onSent();
    } catch (err: any) {
      toast({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const copy = async (kind: 'approved' | 'rejected') => {
    const emails = pending[kind].map(a => a.email).join(', ');
    await navigator.clipboard.writeText(emails);
    toast({ title: 'Copied', description: `${pending[kind].length} address${pending[kind].length === 1 ? '' : 'es'}` });
  };

  const Row = ({ kind, title, tone }: { kind: 'approved' | 'rejected'; title: string; tone: string }) => {
    const n = pending[kind].length;
    return (
      <div className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${tone}`}>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-600">
            {n === 0 ? (
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Everyone has been emailed</span>
            ) : (
              `${n} delegate${n === 1 ? '' : 's'} not emailed yet`
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => copy(kind)}
            disabled={n === 0}
            title="Copy addresses"
            className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => send(kind)}
            disabled={n === 0 || busy !== null}
            className="flex items-center gap-2 rounded-md bg-diplomatic-600 px-3 py-2 text-sm font-medium text-white hover:bg-diplomatic-700 disabled:opacity-40"
          >
            {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Email {n}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Row kind="approved" title="Acceptance emails" tone="border-green-200 bg-green-50" />
      <Row kind="rejected" title="Rejection emails" tone="border-red-200 bg-red-50" />
    </div>
  );
};

export default DecisionEmailPanel;

import React, { useMemo, useState } from 'react';
import { Mail, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendEmails, templates, partialResult, wasDelivered, type SendResult } from '@/lib/email';
import { isChairApplication } from '@/lib/applications';
import { confirmAction } from '@/components/admin/ConfirmDialog';

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
    if (!(await confirmAction(`Send the ${label} email to ${list.length} delegate${list.length === 1 ? '' : 's'}?`, { title: 'Send decision emails', confirmLabel: 'Send' }))) return;

    setBusy(kind);
    const messages = list.map(a =>
      kind === 'approved'
        ? templates.decisionAccepted({ to: a.email, name: a.full_name })
        : templates.decisionRejected({ to: a.email, name: a.full_name }),
    );
    // Even when a send fails partway, record who did get it so nobody is
    // emailed twice on retry.
    let result: SendResult;
    let failure: string | null = null;
    try {
      result = await sendEmails(messages, kind === 'approved' ? 'decision_accepted' : 'decision_rejected');
    } catch (err: any) {
      result = partialResult(err);
      failure = err.message;
    }

    const ids = list.filter(a => wasDelivered(result, a.email)).map(a => a.id);
    let recordError: string | null = null;
    if (ids.length) {
      const { error } = await (supabase.from('applications') as any)
        .update({ decision_emailed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) recordError = error.message;
    }

    const sentLine = `${ids.length} ${label} email${ids.length === 1 ? '' : 's'} sent`;
    if (failure) {
      toast({ title: 'Email stopped', description: `${failure}. ${sentLine} and recorded; try again for the rest.`, variant: 'destructive' });
    } else if (recordError) {
      toast({ title: sentLine, description: `Could not record the send (${recordError}). These people may be emailed again.`, variant: 'destructive' });
    } else {
      toast({
        title: sentLine,
        description: result.skipped.length ? `Skipped ${result.skipped.length} invalid address${result.skipped.length === 1 ? '' : 'es'}: ${result.skipped.join(', ')}` : undefined,
      });
    }
    onSent();
    setBusy(null);
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

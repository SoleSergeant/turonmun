import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendEmails, templates } from '@/lib/email';

interface PendingSeat {
  id: string;
  country: string;
  committee: string;
  name: string;
  email: string;
}

/**
 * Emails every seated delegate who hasn't been told their allocation yet
 * (country_assignments.notified_at is null), then stamps notified_at.
 */
const NotifySeatsButton: React.FC = () => {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingSeat[]>([]);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(true);

  const load = useCallback(async (): Promise<PendingSeat[]> => {
    const { data, error } = await (supabase.from('country_assignments') as any)
      .select('id, country, country_name, notified_at, committees(name), applications(full_name, email)')
      .is('notified_at', null);
    if (error) {
      // notified_at arrives with migration 038; hide the button until then.
      setAvailable(false);
      return [];
    }
    setAvailable(true);
    const list: PendingSeat[] = (data || [])
      .filter((r: any) => r.applications?.email)
      .map((r: any) => ({
        id: r.id,
        country: r.country || r.country_name || '',
        committee: r.committees?.name || '',
        name: r.applications.full_name,
        email: r.applications.email,
      }));
    setPending(list);
    return list;
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = async () => {
    const fresh = await load();
    if (fresh.length === 0) return;
    if (!confirm(`Email ${fresh.length} delegate${fresh.length === 1 ? '' : 's'} their committee and country?`)) return;
    setBusy(true);
    try {
      const sent = await sendEmails(
        fresh.map(p => templates.seatAssigned({ to: p.email, name: p.name, committee: p.committee, country: p.country })),
        'seat_assigned',
      );
      await (supabase.from('country_assignments') as any)
        .update({ notified_at: new Date().toISOString() })
        .in('id', fresh.slice(0, sent).map(p => p.id));
      toast({ title: `Sent ${sent} allocation email${sent === 1 ? '' : 's'}` });
      await load();
    } catch (err: any) {
      toast({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (!available) return null;

  return (
    <button
      onClick={notify}
      disabled={busy || pending.length === 0}
      title={pending.length === 0 ? 'Every seated delegate has been notified' : undefined}
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
      Notify seated delegates{pending.length > 0 ? ` (${pending.length})` : ''}
    </button>
  );
};

export default NotifySeatsButton;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, MapPin, Pencil, PhoneCall, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { adminPath } from '@/lib/adminPath';

export const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'refunded'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const paymentTone = (s: string | null | undefined) =>
  s === 'paid' ? 'bg-green-100 text-green-800'
  : s === 'overdue' ? 'bg-red-100 text-red-800'
  : s === 'refunded' ? 'bg-gray-100 text-gray-700'
  : 'bg-yellow-100 text-yellow-800';

export interface DelegateFields {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  institution: string;
  country: string | null;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  payment_reminded_at?: string | null;
  contacted?: boolean | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  dietary_restrictions?: string | null;
  checked_in_at?: string | null;
}

/**
 * The operational side of a delegate, shown at the top of the application
 * pop-up: payment, seat, contacted, emergency contact, and editing the
 * contact details (through update_delegate_info).
 */
export default function DelegateAdminPanel({ app, seat, onChange }: {
  app: DelegateFields;
  seat: { committee: string; country: string } | null;
  onChange: (fields: Partial<DelegateFields>) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const accepted = app.status === 'approved';

  const update = async (fields: Partial<DelegateFields>, label: string) => {
    const { error } = await (supabase.from('applications') as any).update(fields).eq('id', app.id);
    if (error) { toast({ title: `Could not update ${label}`, description: error.message, variant: 'destructive' }); return; }
    onChange(fields);
    toast({ title: `${label[0].toUpperCase()}${label.slice(1)} updated` });
  };

  const saveDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = {
      full_name: String(f.get('full_name') || '').trim(),
      email: String(f.get('email') || '').trim(),
      phone: String(f.get('phone') || '').trim(),
      institution: String(f.get('institution') || '').trim(),
      country: String(f.get('country') || '').trim(),
    };
    setSaving(true);
    const { error } = await (supabase as any).rpc('update_delegate_info', {
      p_id: app.id,
      p_full_name: next.full_name,
      p_email: next.email,
      p_phone: next.phone,
      p_institution: next.institution,
      p_country: next.country,
      p_payment_status: app.payment_status || 'pending',
    });
    setSaving(false);
    if (error) { toast({ title: 'Could not save details', description: error.message, variant: 'destructive' }); return; }
    onChange(next);
    setEditing(false);
    toast({ title: 'Details saved' });
  };

  const emergency = [
    app.emergency_contact_name,
    app.emergency_contact_phone,
    app.emergency_contact_relation && `(${app.emergency_contact_relation})`,
  ].filter(Boolean).join(' · ');

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-500';

  return (
    <div className="rounded-xl border border-diplomatic-200 bg-diplomatic-50/60 p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"><CreditCard size={13} /> Payment</p>
          {accepted ? (
            <>
              <select
                value={app.payment_status || 'pending'}
                onChange={e => update({ payment_status: e.target.value }, 'payment')}
                className={`rounded-full border-0 px-3 py-1 text-sm font-semibold ${paymentTone(app.payment_status)}`}
              >
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {app.payment_amount != null && <p className="mt-1 text-sm text-gray-700">{app.payment_amount.toLocaleString()} UZS</p>}
              {app.payment_reminded_at && <p className="text-xs text-gray-500">Reminded {new Date(app.payment_reminded_at).toLocaleDateString()}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-500">After acceptance</p>
          )}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"><MapPin size={13} /> Seat</p>
          {seat ? (
            <p className="text-sm font-medium text-gray-900">{seat.country}<span className="block text-xs font-normal text-gray-600">{seat.committee}</span></p>
          ) : accepted && app.payment_status === 'paid' ? (
            <Link to={adminPath('/allocation')} className="text-sm font-medium text-diplomatic-700 hover:underline">Allocate a seat →</Link>
          ) : (
            <p className="text-sm text-gray-500">After payment</p>
          )}
          {app.checked_in_at && <p className="mt-1 text-xs font-medium text-green-700">Checked in {new Date(app.checked_in_at).toLocaleString()}</p>}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"><PhoneCall size={13} /> Contacted</p>
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={!!app.contacted}
              onChange={e => update({ contacted: e.target.checked, ...({ contacted_at: e.target.checked ? new Date().toISOString() : null } as any) }, 'contacted')}
              className="h-4 w-4 rounded border-gray-300"
            />
            We've been in touch
          </label>
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"><ShieldAlert size={13} /> Emergency contact</p>
          <p className="text-sm text-gray-900">{emergency || <span className="text-gray-500">Not given</span>}</p>
          {app.dietary_restrictions && <p className="mt-1 text-xs text-gray-600">Diet: {app.dietary_restrictions}</p>}
        </div>
      </div>

      {editing ? (
        <form onSubmit={saveDetails} className="mt-5 grid gap-3 border-t border-diplomatic-200 pt-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-gray-600">Full name<input name="full_name" required defaultValue={app.full_name} className={input} /></label>
          <label className="text-xs font-medium text-gray-600">Email<input name="email" type="email" required defaultValue={app.email} className={input} /></label>
          <label className="text-xs font-medium text-gray-600">Phone<input name="phone" type="tel" defaultValue={app.phone || ''} className={input} /></label>
          <label className="text-xs font-medium text-gray-600">School / university<input name="institution" required defaultValue={app.institution} className={input} /></label>
          <label className="text-xs font-medium text-gray-600 sm:col-span-2">Home city / country<input name="country" defaultValue={app.country || ''} className={input} /></label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-diplomatic-600 px-4 py-2 text-sm font-semibold text-white hover:bg-diplomatic-700 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save details
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setEditing(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-diplomatic-700 hover:underline">
          <Pencil size={14} /> Edit contact details
        </button>
      )}
    </div>
  );
}

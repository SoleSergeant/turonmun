import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Download, Mail, Loader2, X, Settings, MessageSquare, FileText, ChevronDown,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ApplicationManagementModal from '@/components/admin/ApplicationManagementModal';
import DecisionEmailPanel from '@/components/admin/DecisionEmailPanel';
import DelegateAdminPanel, { PAYMENT_STATUSES, paymentTone, type DelegateFields } from '@/components/admin/DelegateAdminPanel';
import { confirmAction } from '@/components/admin/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getCurrentSeason, inSeason } from '@/lib/season';
import { downloadCsv, datedFilename } from '@/lib/csv';
import { sendEmails, templates, partialResult, wasDelivered, type SendResult } from '@/lib/email';

/**
 * Delegates: the whole delegate pipeline on one page, from application to
 * check-in. (Replaces the separate Applications and Delegates pages; chair
 * applications live in Chairs.)
 */

type Row = DelegateFields & Record<string, any> & {
  created_at: string;
  committee_preference1?: string | null;
  committee_preference2?: string | null;
  committee_preference3?: string | null;
  telegram_username?: string | null;
  decision_emailed_at?: string | null;
};

interface Seat { committee_id: string; committee: string; country: string }

const STAGES = [
  { key: 'all', label: 'All' },
  { key: 'review', label: 'To review' },
  { key: 'waitlisted', label: 'Waitlisted' },
  { key: 'unpaid', label: 'Accepted · unpaid' },
  { key: 'paid', label: 'Paid · no seat' },
  { key: 'seated', label: 'Seated' },
  { key: 'arrived', label: 'Checked in' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'refunded', label: 'Refunded' },
] as const;
type Stage = typeof STAGES[number]['key'];

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  waitlisted: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
};
const STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Accepted', waitlisted: 'Waitlisted', rejected: 'Rejected' };

const REMIND_GAP_MS = 3 * 24 * 60 * 60 * 1000;

const Delegates = () => {
  const { toast } = useToast();
  const { role } = useAdminRole();
  const canDelete = role === 'sg';
  const [params, setParams] = useSearchParams();
  const stage = (STAGES.some(s => s.key === params.get('stage')) ? params.get('stage') : 'all') as Stage;

  const [rows, setRows] = useState<Row[]>([]);
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [committees, setCommittees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailTo, setEmailTo] = useState<Row[] | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const loadedRef = useRef(false);

  // ── Data ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!loadedRef.current) setLoading(true);
    try {
      const season = await getCurrentSeason();
      const [apps, asg, comms] = await Promise.all([
        inSeason((supabase.from('applications') as any).select('*'), season)
          .neq('application_type', 'chair')
          .order('created_at', { ascending: false }),
        (supabase.from('country_assignments') as any).select('application_id, committee_id, country, country_name, committees(name)'),
        supabase.from('committees').select('id, name').eq('is_active', true).order('name'),
      ]);
      if (apps.error) throw apps.error;
      setRows(((apps.data || []) as Row[]).map(r => ({ ...r, status: r.status || 'pending' })));
      const map: Record<string, Seat> = {};
      for (const a of (asg.data || []) as any[]) {
        map[a.application_id] = { committee_id: a.committee_id, committee: a.committees?.name || '', country: a.country || a.country_name || '' };
      }
      setSeats(map);
      setCommittees((comms.data || []) as any);
      loadedRef.current = true;
    } catch (err: any) {
      toast({ title: 'Could not load delegates', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    // Live updates, one quiet refresh per burst of changes.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel('admin-delegates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        clearTimeout(timer);
        timer = setTimeout(load, 1000);
      })
      .subscribe();
    return () => { clearTimeout(timer); channel.unsubscribe(); };
  }, [load]);

  const patch = (ids: string[], fields: Partial<Row>) =>
    setRows(prev => prev.map(r => (ids.includes(r.id) ? { ...r, ...fields } : r)));

  // ── Stages ──────────────────────────────────────────────────────────
  const stageOf = useCallback((r: Row): Exclude<Stage, 'all'> => {
    if (r.status === 'pending') return 'review';
    if (r.status === 'waitlisted') return 'waitlisted';
    if (r.status === 'rejected') return 'rejected';
    if (r.payment_status === 'refunded') return 'refunded';
    if (r.checked_in_at) return 'arrived';
    if (seats[r.id]) return 'seated';
    if (r.payment_status === 'paid') return 'paid';
    return 'unpaid';
  }, [seats]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    rows.forEach(r => { const s = stageOf(r); c[s] = (c[s] || 0) + 1; });
    return c;
  }, [rows, stageOf]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (stage !== 'all' && stageOf(r) !== stage) return false;
      if (committeeFilter !== 'all') {
        const name = committees.find(c => c.id === committeeFilter)?.name;
        const prefs = [r.committee_preference1, r.committee_preference2, r.committee_preference3];
        if (seats[r.id]?.committee_id !== committeeFilter && !prefs.includes(name)) return false;
      }
      if (!q) return true;
      return [r.full_name, r.email, r.institution, r.country, r.phone, r.telegram_username, seats[r.id]?.country]
        .some(v => (v || '').toLowerCase().includes(q));
    });
  }, [rows, stage, stageOf, search, committeeFilter, committees, seats]);

  // Bulk actions must never reach rows the filters hide.
  useEffect(() => {
    const visible = new Set(shown.map(r => r.id));
    setSelected(prev => ([...prev].every(id => visible.has(id)) ? prev : new Set([...prev].filter(id => visible.has(id)))));
  }, [shown]);

  const setStage = (s: Stage) => {
    const next = new URLSearchParams(params);
    if (s === 'all') next.delete('stage'); else next.set('stage', s);
    setParams(next, { replace: true });
  };

  const selectedRows = rows.filter(r => selected.has(r.id));
  const allShownSelected = shown.length > 0 && shown.every(r => selected.has(r.id));

  // ── Actions ─────────────────────────────────────────────────────────
  const setStatus = async (ids: string[], status: 'approved' | 'waitlisted' | 'rejected') => {
    if (ids.length > 1 && !(await confirmAction(`Mark ${ids.length} applications as ${STATUS_LABEL[status].toLowerCase()}?`, { title: 'Bulk update', confirmLabel: 'Apply' }))) return;
    const { error } = await (supabase.from('applications') as any)
      .update({ status, reviewed_at: new Date().toISOString() })
      .in('id', ids);
    if (error) { toast({ title: 'Could not update status', description: error.message, variant: 'destructive' }); return; }
    patch(ids, { status });
    setSelected(new Set());
    toast({ title: ids.length === 1 ? `Marked as ${STATUS_LABEL[status].toLowerCase()}` : `Updated ${ids.length} applications` });
  };

  const setPayment = async (ids: string[], payment_status: string) => {
    if (ids.length > 1 && !(await confirmAction(`Mark ${ids.length} delegates as ${payment_status}?`, { title: 'Update payment', confirmLabel: 'Apply' }))) return;
    const { error } = await (supabase.from('applications') as any).update({ payment_status }).in('id', ids);
    if (error) { toast({ title: 'Could not update payment', description: error.message, variant: 'destructive' }); return; }
    patch(ids, { payment_status });
    setSelected(new Set());
    toast({ title: ids.length === 1 ? `Payment marked ${payment_status}` : `Marked ${ids.length} as ${payment_status}` });
  };

  // Payment reminders: accepted, not paid, not refunded. Without a selection,
  // anyone reminded in the last 3 days is skipped.
  const remind = async (onlySelected: boolean) => {
    const list = (onlySelected ? selectedRows : rows).filter(r =>
      r.status === 'approved' && r.payment_status !== 'paid' && r.payment_status !== 'refunded' &&
      (onlySelected || !r.payment_reminded_at || Date.now() - new Date(r.payment_reminded_at).getTime() > REMIND_GAP_MS),
    );
    if (!list.length) {
      toast({ title: 'Nobody to remind', description: onlySelected ? 'None of the selected delegates are accepted and unpaid.' : 'Every unpaid delegate was reminded in the last 3 days.' });
      return;
    }
    if (!(await confirmAction(`Send a payment reminder to ${list.length} unpaid delegate${list.length === 1 ? '' : 's'}?`, { title: 'Send payment reminders', confirmLabel: 'Send' }))) return;
    setBusy(true);
    let result: SendResult;
    let failure: string | null = null;
    try {
      result = await sendEmails(list.map(r => templates.paymentReminder({ to: r.email, name: r.full_name, amount: r.payment_amount })), 'payment_reminder');
    } catch (err: any) {
      result = partialResult(err);
      failure = err.message;
    }
    const ids = list.filter(r => wasDelivered(result, r.email)).map(r => r.id);
    const now = new Date().toISOString();
    if (ids.length) {
      const { error } = await (supabase.from('applications') as any).update({ payment_reminded_at: now }).in('id', ids);
      if (!error) patch(ids, { payment_reminded_at: now });
    }
    const line = `Sent ${ids.length} payment reminder${ids.length === 1 ? '' : 's'}`;
    if (failure) toast({ title: 'Reminders stopped', description: `${failure}. ${line.toLowerCase()}; try again for the rest.`, variant: 'destructive' });
    else toast({ title: line, description: result.skipped.length ? `Skipped invalid: ${result.skipped.join(', ')}` : undefined });
    setBusy(false);
  };

  const sendCustom = async (subject: string, body: string) => {
    if (!emailTo) return;
    setBusy(true);
    try {
      const { sent, skipped } = await sendEmails(emailTo.map(r => templates.custom({ to: r.email, subject, body })), 'custom');
      toast({ title: `Email sent to ${sent}`, description: skipped.length ? `Skipped invalid: ${skipped.join(', ')}` : undefined });
      setEmailTo(null);
    } catch (err: any) {
      toast({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const r = rows.find(x => x.id === id);
    if (!(await confirmAction(`Delete ${r?.full_name ?? 'this'}'s application? This is permanent.`, { title: 'Delete application', danger: true }))) return;
    const { data, error } = await (supabase.from('applications') as any).delete().eq('id', id).select('id');
    if (error || !data?.length) {
      toast({ title: 'Could not delete', description: error?.message || 'Only the Secretary-General can delete applications.', variant: 'destructive' });
      return;
    }
    setRows(prev => prev.filter(x => x.id !== id));
    setOpenId(null);
    toast({ title: 'Application deleted' });
  };

  // ── Exports ─────────────────────────────────────────────────────────
  const exportCsv = () => {
    setExportOpen(false);
    downloadCsv(datedFilename('delegates'), [
      ['Name', 'Email', 'Phone', 'Telegram', 'School', 'Home city / country', 'Status', 'Stage', 'Payment', 'Amount (UZS)',
        'Committee', 'Country', 'Preference 1', 'Preference 2', 'Preference 3', 'Emergency contact', 'Emergency phone',
        'Relation', 'Dietary', 'Checked in', 'Applied'],
      ...shown.map(r => [
        r.full_name, r.email, r.phone, r.telegram_username, r.institution, r.country, STATUS_LABEL[r.status] ?? r.status,
        STAGES.find(s => s.key === stageOf(r))?.label, r.payment_status, r.payment_amount,
        seats[r.id]?.committee, seats[r.id]?.country, r.committee_preference1, r.committee_preference2, r.committee_preference3,
        r.emergency_contact_name, r.emergency_contact_phone, r.emergency_contact_relation, r.dietary_restrictions,
        r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : '', new Date(r.created_at).toLocaleDateString(),
      ]),
    ]);
    toast({ title: `Exported ${shown.length} delegates` });
  };

  const exportExcel = async () => {
    setExportOpen(false);
    try {
      // xlsx is ~200 KB; load it only when someone exports.
      const { exportApplicationsToExcel } = await import('@/utils/excelExport');
      exportApplicationsToExcel(shown as any, 'TuronMUN_Delegate_Applications');
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    }
  };

  const open = rows.find(r => r.id === openId) || null;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Delegates">
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-diplomatic-600" /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Delegates</h2>
              <p className="text-gray-600">Every delegate from application to check-in. Chair applications are in Chairs.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => remind(false)} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50">
                <Mail className="h-4 w-4" /> Remind unpaid
              </button>
              <div className="relative">
                <button onClick={() => setExportOpen(v => !v)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700" aria-expanded={exportOpen}>
                  <Download className="h-4 w-4" /> Export <ChevronDown className="h-4 w-4" />
                </button>
                {exportOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border bg-white text-sm shadow-lg">
                    <button onClick={exportCsv} className="block w-full px-4 py-2.5 text-left hover:bg-gray-50">
                      <span className="font-medium text-gray-900">Working list (CSV)</span>
                      <span className="block text-xs text-gray-500">Contacts, payment, seat, emergency contact</span>
                    </button>
                    <button onClick={exportExcel} className="block w-full border-t px-4 py-2.5 text-left hover:bg-gray-50">
                      <span className="font-medium text-gray-900">Full applications (Excel)</span>
                      <span className="block text-xs text-gray-500">Every answer from the form</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DecisionEmailPanel applications={rows as any} onSent={load} />

          {/* Pipeline stages */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Pipeline stage">
            {STAGES.filter(s => s.key !== 'refunded' || counts.refunded).map(s => (
              <button
                key={s.key}
                role="tab"
                aria-selected={stage === s.key}
                onClick={() => setStage(s.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${stage === s.key ? 'bg-diplomatic-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {s.label} <span className="opacity-70">({counts[s.key] ?? 0})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, school, phone, country…" className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4" />
            </div>
            <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="Committee">
              <option value="all">All committees</option>
              {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selected.size > 0 && (
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-diplomatic-200 bg-diplomatic-50 px-4 py-3">
              <span className="mr-1 text-sm font-semibold text-diplomatic-900">{selected.size} selected</span>
              <button onClick={() => setStatus([...selected], 'approved')} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Accept</button>
              <button onClick={() => setStatus([...selected], 'waitlisted')} className="rounded-md bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-600">Waitlist</button>
              <button onClick={() => setStatus([...selected], 'rejected')} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Reject</button>
              <span className="mx-1 hidden h-5 w-px bg-diplomatic-200 sm:block" />
              <button onClick={() => setPayment([...selected], 'paid')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Mark paid</button>
              <button onClick={() => remind(true)} disabled={busy} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">Payment reminder</button>
              <button onClick={() => setEmailTo(selectedRows)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"><Mail className="h-4 w-4" /> Email</button>
              <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-500 hover:text-gray-800">Clear</button>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            {shown.length === 0 ? (
              <p className="py-12 text-center text-gray-500">{rows.length === 0 ? 'No delegate applications yet this season.' : 'Nobody matches.'}</p>
            ) : (
              <div className="overflow-x-auto">
                {/* Secondary columns are hidden on phones; everything is in the detail view. */}
                <table className="min-w-full divide-y divide-gray-200 text-sm max-md:[&_th:nth-child(3)]:hidden max-md:[&_td:nth-child(3)]:hidden max-lg:[&_th:nth-child(6)]:hidden max-lg:[&_td:nth-child(6)]:hidden max-lg:[&_th:nth-child(7)]:hidden max-lg:[&_td:nth-child(7)]:hidden">
                  <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" aria-label="Select all shown" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map(r => r.id)))} />
                      </th>
                      <th className="px-4 py-3">Delegate</th>
                      <th className="px-4 py-3">Preferences</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Seat</th>
                      <th className="px-4 py-3">Applied</th>
                      <th className="px-4 py-3"><span className="sr-only">Manage</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shown.map(r => {
                      const seat = seats[r.id];
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 align-top">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" aria-label={`Select ${r.full_name}`} checked={selected.has(r.id)} onChange={() => setSelected(prev => {
                              const next = new Set(prev);
                              if (next.has(r.id)) next.delete(r.id); else next.add(r.id);
                              return next;
                            })} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button onClick={() => setOpenId(r.id)} className="text-left">
                              <span className="block font-medium text-gray-900 hover:underline">{r.full_name}</span>
                              <span className="block text-xs text-gray-500">{r.email}</span>
                              <span className="block text-xs text-gray-500">{r.institution}</span>
                            </button>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {r.telegram_username && (
                                <a href={`https://t.me/${String(r.telegram_username).replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline">
                                  <MessageSquare className="h-3 w-3" /> {r.telegram_username}
                                </a>
                              )}
                              {r.has_ielts && <span className="rounded-full bg-green-50 px-1.5 text-[10px] font-medium text-green-700"><FileText className="mr-0.5 inline h-2.5 w-2.5" />IELTS</span>}
                              {r.has_sat && <span className="rounded-full bg-blue-50 px-1.5 text-[10px] font-medium text-blue-700"><FileText className="mr-0.5 inline h-2.5 w-2.5" />SAT</span>}
                              {r.contacted && <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-medium text-gray-600">Contacted</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-gray-600">
                            {[r.committee_preference1, r.committee_preference2, r.committee_preference3].filter(Boolean).map((p, i) => (
                              <div key={i} className={i === 0 ? 'font-medium text-gray-800' : ''}>{i + 1}. {p}</div>
                            ))}
                            {r.country && <div className="mt-1 text-gray-400">From {r.country}</div>}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={r.status}
                              onChange={e => setStatus([r.id], e.target.value as any)}
                              aria-label={`Status of ${r.full_name}`}
                              className={`rounded-full border-0 px-2 py-1 text-xs font-semibold ${STATUS_TONE[r.status] || ''}`}
                            >
                              {r.status === 'pending' && <option value="pending" disabled>Pending</option>}
                              <option value="approved">Accepted</option>
                              <option value="waitlisted">Waitlisted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {r.status === 'approved' ? (
                              <>
                                <select
                                  value={r.payment_status || 'pending'}
                                  onChange={e => setPayment([r.id], e.target.value)}
                                  aria-label={`Payment of ${r.full_name}`}
                                  className={`rounded-full border-0 px-2 py-1 text-xs font-semibold ${paymentTone(r.payment_status)}`}
                                >
                                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {r.payment_amount != null && <div className="mt-1 text-xs text-gray-500">{r.payment_amount.toLocaleString()} UZS</div>}
                              </>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-xs">
                            {seat ? (
                              <><div className="font-medium text-gray-900">{seat.country}</div><div className="text-gray-500">{seat.committee}</div></>
                            ) : <span className="text-gray-400">—</span>}
                            {r.checked_in_at && <div className="mt-1 font-medium text-green-700">Checked in</div>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 align-top text-right">
                            <button onClick={() => setOpenId(r.id)} className="inline-flex items-center gap-1 rounded-lg bg-diplomatic-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-diplomatic-700">
                              <Settings className="h-3.5 w-3.5" /> Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {open && (
        <ApplicationManagementModal
          application={open as any}
          onClose={() => setOpenId(null)}
          onUpdateStatus={(id, status) => setStatus([id], status)}
          onDelete={canDelete ? remove : undefined}
          adminPanel={
            <DelegateAdminPanel
              app={open}
              seat={seats[open.id] ? { committee: seats[open.id].committee, country: seats[open.id].country } : null}
              onChange={fields => patch([open.id], fields)}
            />
          }
        />
      )}

      {emailTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); sendCustom(String(f.get('subject')), String(f.get('body'))); }}
            className="w-full max-w-xl space-y-4 rounded-lg bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Email {emailTo.length === 1 ? emailTo[0].full_name : `${emailTo.length} delegates`}</h3>
              <button type="button" onClick={() => setEmailTo(null)} aria-label="Close"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <input name="subject" required placeholder="Subject" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <textarea name="body" required rows={7} placeholder="Message" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <p className="text-xs text-gray-500">Each person gets their own copy.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEmailTo(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default Delegates;

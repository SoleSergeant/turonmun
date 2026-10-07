import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download, Mail, ChevronDown, ChevronRight, Loader2, ExternalLink, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { downloadCsv, datedFilename } from '@/lib/csv';
import { sendEmails, templates } from '@/lib/email';
import { EXPERIENCE, type DebateRegistration } from '@/pages/debate/DebateRegister';
import { DEBATE_SITE_URL } from '@/pages/debate/paths';
import { sideShares } from '@/pages/debate/sides';
import { useContent } from '@/content/store';

type Status = DebateRegistration['status'];

const STATUSES: { value: Status; label: string; tone: string }[] = [
  { value: 'pending', label: 'Pending', tone: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Accepted', tone: 'bg-green-100 text-green-800' },
  { value: 'waitlisted', label: 'Waitlisted', tone: 'bg-orange-100 text-orange-800' },
  { value: 'rejected', label: 'Rejected', tone: 'bg-red-100 text-red-800' },
];
const toneFor = (s: Status) => STATUSES.find(x => x.value === s)?.tone ?? '';
const experienceLabel = (v: string | null) => EXPERIENCE.find(x => x.value === v)?.label.split(' — ')[0] ?? '—';

/** Admin → Debate: Turon Debate registrations (SG + Academics). */
const DebateRegistrations = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<DebateRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');
  const debate = useContent('debate');
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('debate_registrations' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setMissing(true);
    setRows((data || []) as DebateRegistration[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    STATUSES.forEach(s => { c[s.value] = rows.filter(r => r.status === s.value).length; });
    return c;
  }, [rows]);

  // Same rule as the public numbers on the form: rejected registrations don't count.
  const sides = useMemo(() => {
    const listed = (debate.sides || []).filter(Boolean);
    const counts: Record<string, number> = {};
    rows.forEach(r => { if (r.preferred_side && r.status !== 'rejected') counts[r.preferred_side] = (counts[r.preferred_side] || 0) + 1; });
    // Answers for sides that were renamed or removed still show up here.
    const all = [...listed, ...Object.keys(counts).filter(k => !listed.includes(k))];
    return { ...sideShares(all, counts), noSide: rows.filter(r => !r.preferred_side && r.status !== 'rejected').length };
  }, [rows, debate.sides]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      (sideFilter === 'all' || (sideFilter === 'none' ? !r.preferred_side : r.preferred_side === sideFilter)) &&
      (!q || [r.full_name, r.email, r.institution, r.city, r.phone, r.telegram].some(v => (v || '').toLowerCase().includes(q))),
    );
  }, [rows, search, statusFilter, sideFilter]);

  const patchLocal = (ids: string[], fields: Partial<DebateRegistration>) =>
    setRows(prev => prev.map(r => (ids.includes(r.id) ? { ...r, ...fields } : r)));

  const setStatus = async (ids: string[], status: Status) => {
    if (ids.length > 1 && !confirm(`Mark ${ids.length} registrations as ${STATUSES.find(s => s.value === status)?.label.toLowerCase()}?`)) return;
    const { error } = await (supabase.from('debate_registrations' as any) as any)
      .update({ status, reviewed_at: new Date().toISOString() })
      .in('id', ids);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    patchLocal(ids, { status });
    setSelected(new Set());
    toast({ title: `Updated ${ids.length}` });
  };

  const saveNotes = async (r: DebateRegistration, admin_notes: string) => {
    if ((r.admin_notes || '') === admin_notes) return;
    const { error } = await (supabase.from('debate_registrations' as any) as any).update({ admin_notes: admin_notes || null }).eq('id', r.id);
    if (error) { toast({ title: 'Could not save note', description: error.message, variant: 'destructive' }); return; }
    patchLocal([r.id], { admin_notes });
    toast({ title: 'Note saved' });
  };

  const remove = async (r: DebateRegistration) => {
    if (!confirm(`Delete ${r.full_name}'s registration? They will be able to register again.`)) return;
    const { error } = await (supabase.from('debate_registrations' as any) as any).delete().eq('id', r.id);
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return; }
    setRows(prev => prev.filter(x => x.id !== r.id));
  };

  const exportCsv = () => {
    downloadCsv(datedFilename('turon-debate-registrations'), [
      ['Name', 'Email', 'Phone', 'Telegram', 'Date of birth', 'Gender', 'School / university', 'Grade', 'City',
        'English level', 'Experience', 'Preferred side', 'Past tournaments', 'Motivation', 'Heard from', 'Status', 'Notes', 'Registered'],
      ...shown.map(r => [
        r.full_name, r.email, r.phone, r.telegram, r.date_of_birth, r.gender, r.institution, r.grade, r.city,
        r.english_level, experienceLabel(r.experience), r.preferred_side, r.past_tournaments, r.motivation, r.heard_from,
        r.status, r.admin_notes, new Date(r.created_at).toLocaleString(),
      ]),
    ]);
  };

  const sendEmail = async (subject: string, body: string) => {
    const recipients = rows.filter(r => selected.has(r.id));
    setEmailBusy(true);
    try {
      const sent = await sendEmails(recipients.map(r => templates.custom({ to: r.email, subject, body })), 'custom');
      toast({ title: `Email sent to ${sent}` });
      setEmailOpen(false);
    } catch (err: any) {
      toast({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setEmailBusy(false);
    }
  };

  const allShownSelected = shown.length > 0 && shown.every(r => selected.has(r.id));
  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const debateSiteUrl = DEBATE_SITE_URL;

  return (
    <AdminLayout title="Turon Debate">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Turon Debate</h2>
            <p className="text-gray-600">Registrations from {debateSiteUrl.replace('https://', '')}. Edit the site itself in Site content → Turon Debate.</p>
          </div>
          <div className="flex gap-2">
            <a href={debateSiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <ExternalLink className="h-4 w-4" /> Open site
            </a>
            <button onClick={exportCsv} disabled={shown.length === 0} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-40">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {missing ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Debate registrations aren't set up yet. Run <code className="font-mono">supabase/migrations/041_turon_debate.sql</code> first.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {[{ value: 'all', label: 'All' }, ...STATUSES].map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value as Status | 'all')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${statusFilter === s.value ? 'bg-diplomatic-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {s.label} <span className="opacity-70">({counts[s.value] ?? 0})</span>
                </button>
              ))}
            </div>

            {sides.shares.length > 0 && (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">Preferred side</h3>
                  <p className="text-xs text-gray-500">
                    {sides.total} picked a side{sides.noSide > 0 && ` · ${sides.noSide} didn't answer`} · rejected not counted · click to filter
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {sides.shares.map(({ side, count, percent }) => (
                    <button
                      key={side}
                      onClick={() => setSideFilter(sideFilter === side ? 'all' : side)}
                      className={`rounded-lg border p-3 text-left transition ${sideFilter === side ? 'border-diplomatic-500 bg-diplomatic-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-gray-800">{side}</span>
                        <span className="text-lg font-semibold text-gray-900">{percent}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-diplomatic-500" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{count} registration{count === 1 ? '' : 's'}</div>
                    </button>
                  ))}
                </div>
                {sideFilter !== 'all' && (
                  <button onClick={() => setSideFilter('all')} className="mt-3 text-xs text-diplomatic-700 hover:underline">Show all sides</button>
                )}
              </div>
            )}

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, school, city…" className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4" />
            </div>

            {selected.size > 0 && (
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-diplomatic-200 bg-diplomatic-50 px-4 py-3">
                <span className="mr-2 text-sm font-semibold text-diplomatic-900">{selected.size} selected</span>
                {STATUSES.filter(s => s.value !== 'pending').map(s => (
                  <button key={s.value} onClick={() => setStatus([...selected], s.value)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                    {s.label}
                  </button>
                ))}
                <button onClick={() => setEmailOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-500 hover:text-gray-800">Clear</button>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              ) : shown.length === 0 ? (
                <p className="py-12 text-center text-gray-500">{rows.length === 0 ? 'No registrations yet.' : 'Nothing matches.'}</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map(r => r.id)))} />
                      </th>
                      <th className="px-4 py-3">Name</th>
                      <th className="hidden px-4 py-3 md:table-cell">School</th>
                      <th className="hidden px-4 py-3 md:table-cell">Side</th>
                      <th className="hidden px-4 py-3 lg:table-cell">Experience</th>
                      <th className="hidden px-4 py-3 lg:table-cell">Registered</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shown.map(r => {
                      const isOpen = openId === r.id;
                      return (
                        <React.Fragment key={r.id}>
                          <tr className={isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                            <td className="px-4 py-3">
                              <button onClick={() => setOpenId(isOpen ? null : r.id)} className="flex items-start gap-1 text-left">
                                {isOpen ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />}
                                <span>
                                  <span className="block font-medium text-gray-900">{r.full_name}</span>
                                  <span className="block text-xs text-gray-500">{r.email}</span>
                                </span>
                              </button>
                            </td>
                            <td className="hidden px-4 py-3 text-gray-700 md:table-cell">{r.institution}{r.grade ? <span className="text-gray-400"> · {r.grade}</span> : null}</td>
                            <td className="hidden px-4 py-3 text-gray-700 md:table-cell">{r.preferred_side || '—'}</td>
                            <td className="hidden px-4 py-3 text-gray-700 lg:table-cell">{experienceLabel(r.experience)}</td>
                            <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{new Date(r.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <select
                                value={r.status}
                                onChange={e => setStatus([r.id], e.target.value as Status)}
                                className={`rounded-full border-0 px-2 py-1 text-xs font-semibold ${toneFor(r.status)}`}
                              >
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-gray-50">
                              <td />
                              <td colSpan={6} className="px-4 pb-5">
                                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                  {([
                                    ['Phone', r.phone], ['Telegram', r.telegram], ['Date of birth', r.date_of_birth], ['Gender', r.gender],
                                    ['City', r.city], ['English level', r.english_level], ['Heard from', r.heard_from],
                                  ] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                                    <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="text-gray-900">{v}</dd></div>
                                  ))}
                                </dl>
                                {r.past_tournaments && <p className="mt-3 text-sm"><span className="text-xs text-gray-500">Past tournaments</span><br />{r.past_tournaments}</p>}
                                {r.motivation && <p className="mt-3 whitespace-pre-line text-sm"><span className="text-xs text-gray-500">Why they want to join</span><br />{r.motivation}</p>}
                                <label className="mt-4 block text-sm">
                                  <span className="text-xs text-gray-500">Internal note (only admins see this)</span>
                                  <textarea defaultValue={r.admin_notes ?? ''} onBlur={e => saveNotes(r, e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
                                </label>
                                <button onClick={() => remove(r)} className="mt-3 text-xs text-red-600 hover:underline">Delete registration</button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); sendEmail(String(f.get('subject')), String(f.get('body'))); }}
            className="w-full max-w-xl space-y-4 rounded-lg bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Email {selected.size} registrant{selected.size === 1 ? '' : 's'}</h3>
              <button type="button" onClick={() => setEmailOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <input name="subject" required placeholder="Subject" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <textarea name="body" required rows={7} placeholder="Message" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <p className="text-xs text-gray-500">Each person gets their own copy.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEmailOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={emailBusy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                {emailBusy && <Loader2 className="h-4 w-4 animate-spin" />} Send
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default DebateRegistrations;

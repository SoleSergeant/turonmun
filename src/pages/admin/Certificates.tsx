import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, Printer, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCertificateDesign } from '@/hooks/useCertificateDesign';
import { downloadCertificate, openPrintWindow, printCertificates } from '@/lib/certificate';
import { ROLE_LABEL, type Participation } from '@/lib/participations';
import { adminPath } from '@/lib/adminPath';
import { readProject } from '@/lib/adminNav';

/**
 * Admin → Certificates: per event, who attended (only they get a
 * certificate), single downloads and a print-everything window.
 */
export default function Certificates() {
  const { toast } = useToast();
  const design = useCertificateDesign();
  const [rows, setRows] = useState<Participation[] | null>(null);
  const [event, setEvent] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('participations').select('*').order('created_at', { ascending: false });
    if (error) toast({ title: 'Could not load records', description: error.message, variant: 'destructive' });
    setRows(data ?? []);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  // This page sits in both menus: show the events of the project you're in.
  // Newest event first (rows come newest first).
  const debateMenu = readProject() === 'debate';
  const events = useMemo(() => [...new Set((rows ?? [])
    .filter(r => (r.role === 'debater' || r.role === 'judge') === debateMenu)
    .map(r => r.event))], [rows, debateMenu]);
  const current = event || events[0] || '';
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? [])
      .filter(r => r.event === current && (!q || [r.full_name, r.email, r.committee, r.country].some(v => v?.toLowerCase().includes(q))))
      .sort((a, b) => a.role.localeCompare(b.role) || a.full_name.localeCompare(b.full_name));
  }, [rows, current, search]);
  const eventRows = (rows ?? []).filter(r => r.event === current);
  const attended = eventRows.filter(r => r.attended);

  const setAttended = async (r: Participation, value: boolean) => {
    setRows(prev => prev?.map(x => (x.id === r.id ? { ...x, attended: value || null } : x)) ?? null);
    const { error } = await supabase.rpc('set_participation_attended', { p_id: r.id, p_attended: value });
    if (error) {
      toast({ title: 'Could not save attendance', description: error.message, variant: 'destructive' });
      load();
    }
  };

  const download = async (r: Participation) => {
    setBusyId(r.id);
    try { await downloadCertificate(r, design); }
    catch (e: any) { toast({ title: 'Could not create the certificate', description: e?.message, variant: 'destructive' }); }
    finally { setBusyId(null); }
  };

  const printAll = async () => {
    const win = openPrintWindow();
    if (!win) return toast({ title: 'Allow pop-ups for this site to print', variant: 'destructive' });
    setPrinting(`0 / ${attended.length}`);
    try {
      await printCertificates(win, [...attended].sort((a, b) => a.full_name.localeCompare(b.full_name)), design,
        done => setPrinting(`${done} / ${attended.length}`));
    } catch (e: any) {
      win.close();
      toast({ title: 'Could not prepare certificates', description: e?.message, variant: 'destructive' });
    } finally {
      setPrinting(null);
    }
  };

  return (
    <AdminLayout title="Certificates">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-gray-600">
              Only people marked attended get a certificate (in My History and here). The design is in{' '}
              <Link to={adminPath('/content')} className="text-panel-600 hover:underline">Site content → Certificates</Link>.
            </p>
          </div>
          <button
            onClick={printAll}
            disabled={!attended.length || !!printing}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-panel-700 px-4 py-2 text-sm font-medium text-white hover:bg-panel-800 disabled:opacity-50"
          >
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {printing ? `Preparing ${printing}` : `Print all (${attended.length})`}
          </button>
        </div>

        {rows === null ? (
          <div className="py-16 text-center text-gray-500"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center text-gray-500">
            {debateMenu ? 'No debate records yet. They appear after Event day → Results → Save to history.' : 'No participation records yet.'}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select value={current} onChange={e => setEvent(e.target.value)} aria-label="Event"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, committee, country…"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" />
              </div>
            </div>
            <p className="text-sm text-gray-600">{attended.length} of {eventRows.length} marked attended.</p>

            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Committee · Country</th>
                    <th className="px-4 py-3">Award</th>
                    <th className="px-4 py-3">Attended</th>
                    <th className="px-4 py-3 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {list.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="block font-medium text-gray-900">{r.full_name}</span>
                        <span className="block text-xs text-gray-500">{r.email}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{ROLE_LABEL[r.role] ?? r.role}</td>
                      <td className="px-4 py-3 text-gray-700">{[r.committee, r.country].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3 text-amber-700">{r.award || ''}</td>
                      <td className="px-4 py-3">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300"
                          aria-label={`${r.full_name} attended`}
                          checked={!!r.attended} onChange={e => setAttended(r, e.target.checked)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => download(r)} disabled={!r.attended || busyId === r.id}
                          title={r.attended ? 'Download certificate (PNG)' : 'Mark attended first'}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50 disabled:opacity-40">
                          {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PNG
                        </button>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No one matches.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

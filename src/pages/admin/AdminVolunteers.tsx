import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import VolunteerApplicationModal, { VolunteerApplication } from '@/components/admin/VolunteerApplicationModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Filter, Download, RefreshCw, Heart, CheckCircle, XCircle, Clock,
  MessageSquare, Wallet, Eye, AlertCircle,
} from 'lucide-react';

const STATUSES = ['all', 'pending', 'approved', 'rejected', 'waitlisted', 'contacted'] as const;
type StatusFilter = typeof STATUSES[number];

const statusBadge = (s: string) => {
  switch (s) {
    case 'approved':   return 'bg-green-100 text-green-700 border-green-200';
    case 'rejected':   return 'bg-red-100 text-red-700 border-red-200';
    case 'waitlisted': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'contacted':  return 'bg-sky-100 text-sky-700 border-sky-200';
    default:           return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }
};

const formatDate = (d: string) => {
  try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return d; }
};

const toCsv = (rows: VolunteerApplication[]) => {
  const headers = [
    'Full Name', 'Email', 'Telegram/Phone', 'Birthday', 'Location', 'School',
    'What They Bring', 'Anything Else', 'Committed to Deposit', 'Status',
    'Payment Status', 'Submitted',
  ];
  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  rows.forEach(r => {
    lines.push([
      r.full_name, r.email, r.telegram_or_phone, r.date_of_birth, r.location,
      r.school_name ?? '', r.what_you_bring, r.anything_else ?? '',
      r.commit_to_deposit ? 'Yes' : 'No', r.status, r.payment_status,
      r.created_at,
    ].map(escape).join(','));
  });
  return lines.join('\n');
};

const AdminVolunteers: React.FC = () => {
  const { toast } = useToast();
  const [apps, setApps] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await (supabase.from('volunteer_applications') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApps((data ?? []) as VolunteerApplication[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load volunteer applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.location ?? '').toLowerCase().includes(q) ||
        (a.school_name ?? '').toLowerCase().includes(q) ||
        (a.telegram_or_phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [apps, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: apps.length };
    apps.forEach(a => { c[a.status] = (c[a.status] ?? 0) + 1; });
    return c;
  }, [apps]);

  const updateLocal = (id: string, patch: Partial<VolunteerApplication>) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    setSelected(prev => prev && prev.id === id ? { ...prev, ...patch } : prev);
  };

  const handleStatusChange = async (id: string, status: VolunteerApplication['status']) => {
    const { error } = await (supabase.from('volunteer_applications') as any)
      .update({ status }).eq('id', id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    updateLocal(id, { status });
    toast({ title: `Marked as ${status}` });
  };

  const handlePaymentStatusChange = async (id: string, payment_status: VolunteerApplication['payment_status']) => {
    const { error } = await (supabase.from('volunteer_applications') as any)
      .update({ payment_status }).eq('id', id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    updateLocal(id, { payment_status });
    toast({ title: `Payment marked as ${payment_status}` });
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('volunteer_applications') as any).delete().eq('id', id);
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return; }
    setApps(prev => prev.filter(a => a.id !== id));
    setSelected(null);
    toast({ title: 'Application deleted' });
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteer-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Volunteer Applications">
      <div className="space-y-5 max-w-6xl">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',      value: counts.total ?? 0,      color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Heart },
            { label: 'Pending',    value: counts.pending ?? 0,    color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: Clock },
            { label: 'Approved',   value: counts.approved ?? 0,   color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle },
            { label: 'Rejected',   value: counts.rejected ?? 0,   color: 'text-red-700 bg-red-50 border-red-200', icon: XCircle },
            { label: 'Contacted',  value: counts.contacted ?? 0,  color: 'text-sky-700 bg-sky-50 border-sky-200', icon: MessageSquare },
          ].map(c => (
            <div key={c.label} className={`rounded-xl border p-3 ${c.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide">{c.label}</span>
                <c.icon size={14} />
              </div>
              <div className="text-2xl font-bold mt-1">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search name, email, location, school…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <Filter size={14} className="text-gray-400 ml-1.5" />
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {s}
              </button>
            ))}
          </div>

          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={load} title="Refresh" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">Loading volunteer applications…</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
            {apps.length === 0 ? 'No volunteer applications yet.' : 'No applications match your filters.'}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-rose-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{a.full_name}</div>
                      <div className="text-xs text-gray-500">{a.school_name ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 truncate max-w-[200px]">{a.email}</div>
                      <div className="text-xs text-sky-600 truncate max-w-[200px]">{a.telegram_or_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        a.commit_to_deposit
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        <Wallet size={11} /> {a.commit_to_deposit ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(a)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        <Eye size={13} /> Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <VolunteerApplicationModal
          application={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
};

export default AdminVolunteers;

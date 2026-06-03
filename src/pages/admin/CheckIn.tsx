import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search, CheckCircle2, AlertTriangle, Undo2,
  Users, Download, Loader2, Sparkles, X, Shield,
} from 'lucide-react';

type PersonKind = 'delegate' | 'chair';

interface Person {
  kind: PersonKind;
  id: string;                       // application.id OR admin_users.id
  full_name: string;
  email: string;
  photo_url?: string | null;
  committee_id: string | null;
  // delegate-only
  country?: string | null;
  payment_status?: string | null;
  // chair-only
  role?: string;                    // 'chair' | 'co_chair'
  // common
  checked_in_at: string | null;
  checked_in_by: string | null;
}

interface Committee { id: string; name: string }
interface Assignment { application_id: string; country?: string | null; country_name?: string | null }

const CheckIn = () => {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hideArrived, setHideArrived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Person | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: admin } = await supabase.from('admin_users').select('id').eq('email', user?.email).single();
      setAdminId((admin as any)?.id ?? null);

      const [{ data: dels }, { data: chairs }, { data: comms }, { data: asgs }] = await Promise.all([
        // Delegates: accepted AND allocated to a committee.
        supabase.from('applications')
          .select('id, full_name, email, country, photo_url, payment_status, assigned_committee_id, checked_in_at, checked_in_by')
          .eq('status', 'approved')
          .not('assigned_committee_id', 'is', null)
          .order('full_name'),
        // Chairs/co-chairs assigned to a committee.
        supabase.from('admin_users')
          .select('id, full_name, email, role, committee_id, checked_in_at, checked_in_by')
          .in('role', ['chair', 'co_chair'])
          .eq('is_active', true)
          .not('committee_id', 'is', null)
          .order('full_name'),
        supabase.from('committees').select('id, name'),
        supabase.from('country_assignments').select('application_id, country, country_name'),
      ]);

      const delegatePeople: Person[] = ((dels as any) || []).map((d: any) => ({
        kind: 'delegate',
        id: d.id,
        full_name: d.full_name,
        email: d.email,
        photo_url: d.photo_url,
        committee_id: d.assigned_committee_id,
        country: d.country,
        payment_status: d.payment_status,
        checked_in_at: d.checked_in_at,
        checked_in_by: d.checked_in_by,
      }));
      const chairPeople: Person[] = ((chairs as any) || []).map((c: any) => ({
        kind: 'chair',
        id: c.id,
        full_name: c.full_name || c.email,
        email: c.email,
        committee_id: c.committee_id,
        role: c.role,
        checked_in_at: c.checked_in_at,
        checked_in_by: c.checked_in_by,
      }));

      setPeople([...delegatePeople, ...chairPeople].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')));
      setCommittees((comms as any) || []);
      setAssignments((asgs as any) || []);
    } catch (err: any) {
      toast({ title: 'Error loading check-in list', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const committeeName = (id: string | null | undefined) =>
    committees.find(c => c.id === id)?.name || 'Unassigned';
  const assignedCountry = (appId: string) => {
    const a = assignments.find(x => x.application_id === appId);
    return a?.country || a?.country_name || null;
  };
  const displayLocation = (p: Person) => {
    if (p.kind === 'delegate') {
      return assignedCountry(p.id) || p.country || '—';
    }
    return p.role === 'co_chair' ? 'Co-Chair' : 'Chair';
  };
  const roleLabel = (p: Person) =>
    p.kind === 'chair'
      ? (p.role === 'co_chair' ? 'Co-Chair' : 'Chair')
      : 'Delegate';

  const arrivedCount = people.filter(p => !!p.checked_in_at).length;
  const totalCount = people.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter(p => {
      if (hideArrived && p.checked_in_at) return false;
      if (!q) return true;
      const loc = (p.kind === 'delegate' ? assignedCountry(p.id) || p.country || '' : roleLabel(p)).toLowerCase();
      const comm = committeeName(p.committee_id).toLowerCase();
      return (p.full_name || '').toLowerCase().includes(q)
        || (p.email || '').toLowerCase().includes(q)
        || loc.includes(q)
        || comm.includes(q);
    });
  }, [people, search, hideArrived, assignments, committees]);

  const tableFor = (p: Person) => (p.kind === 'delegate' ? 'applications' : 'admin_users');

  const confirmCheckIn = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from(tableFor(selected))
        .update({ checked_in_at: nowIso, checked_in_by: adminId } as any)
        .eq('id', selected.id);
      if (error) throw error;
      setPeople(prev => prev.map(p => p.id === selected.id ? { ...p, checked_in_at: nowIso, checked_in_by: adminId } : p));
      toast({ title: 'Checked in', description: `${selected.full_name} — hand them their badge.` });
      setSelected(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const undoCheckIn = async (p: Person) => {
    if (!confirm(`Undo check-in for ${p.full_name}?`)) return;
    try {
      const { error } = await supabase.from(tableFor(p))
        .update({ checked_in_at: null, checked_in_by: null } as any)
        .eq('id', p.id);
      if (error) throw error;
      setPeople(prev => prev.map(x => x.id === p.id ? { ...x, checked_in_at: null, checked_in_by: null } : x));
      toast({ title: 'Check-in reverted', description: p.full_name });
      setSelected(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const rows = [['Type', 'Name', 'Email', 'Committee', 'Country / Role', 'Status', 'Checked in at']];
    people.forEach(p => {
      rows.push([
        roleLabel(p),
        p.full_name,
        p.email,
        committeeName(p.committee_id),
        displayLocation(p) || '',
        p.checked_in_at ? 'Arrived' : 'No-show',
        p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : '',
      ]);
    });
    const csv = rows.map(r => r.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `turonmun_checkin_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Per-committee breakdown (everyone — delegates + chairs)
  const breakdown = useMemo(() => {
    const byCommittee: Record<string, { arrived: number; total: number }> = {};
    people.forEach(p => {
      const k = p.committee_id || 'unassigned';
      byCommittee[k] = byCommittee[k] || { arrived: 0, total: 0 };
      byCommittee[k].total++;
      if (p.checked_in_at) byCommittee[k].arrived++;
    });
    return byCommittee;
  }, [people]);

  return (
    <AdminLayout title="Check-in">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" /> Event Check-in
            </h2>
            <p className="text-gray-600 text-sm">Search a delegate or chair by name, then confirm to hand out their badge.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >Refresh</button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            ><Download className="h-4 w-4" /> Export CSV</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Arrived</p>
            <p className="text-2xl font-semibold text-green-600">{arrivedCount} <span className="text-base text-gray-400">/ {totalCount}</span></p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Awaiting</p>
            <p className="text-2xl font-semibold text-amber-600">{totalCount - arrivedCount}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Progress</p>
            <div className="h-3 bg-gray-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: totalCount ? `${(arrivedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Per-committee mini breakdown */}
        {committees.length > 0 && (
          <div className="bg-white border rounded-lg p-3 flex flex-wrap gap-2 text-xs">
            {committees.map(c => {
              const b = breakdown[c.id] || { arrived: 0, total: 0 };
              const done = b.total > 0 && b.arrived >= b.total;
              return (
                <span
                  key={c.id}
                  className={`px-2 py-1 rounded-full font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {c.name.replace(/\s\([^)]+\)$/, '')}: <strong>{b.arrived}/{b.total}</strong>
                </span>
              );
            })}
          </div>
        )}

        {/* Tools row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, country, committee, or 'chair'…"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={hideArrived} onChange={(e) => setHideArrived(e.target.checked)} />
            Hide arrived
          </label>
        </div>

        {/* People grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.length === 0 && (
              <div className="md:col-span-3 bg-white border rounded-lg p-10 text-center text-gray-500">
                {search ? 'No matches.' : 'No one to show.'}
              </div>
            )}
            {filtered.map((p) => {
              const isIn = !!p.checked_in_at;
              return (
                <div
                  key={`${p.kind}-${p.id}`}
                  className={`border rounded-lg p-3 flex items-center gap-3 ${isIn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${p.kind === 'chair' ? 'bg-purple-100 text-purple-500' : 'bg-gray-100 text-gray-400'}`}>
                      {p.kind === 'chair' ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{p.full_name}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        p.kind === 'chair' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                      }`}>{roleLabel(p)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{committeeName(p.committee_id)} · {displayLocation(p)}</p>
                  </div>
                  {isIn ? (
                    <button
                      onClick={() => undoCheckIn(p)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
                      title={`Arrived at ${new Date(p.checked_in_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {new Date(p.checked_in_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelected(p)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >Check in</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Badge handoff modal */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className={`px-6 py-4 text-white flex items-center justify-between ${
                selected.kind === 'chair'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}>
                <span className="text-sm font-bold uppercase tracking-wider">
                  🎫 Hand them their {selected.kind === 'chair' ? `${roleLabel(selected)} badge` : 'badge'}
                </span>
                <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-8 text-center space-y-4">
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-amber-100 mx-auto" />
                ) : (
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
                    selected.kind === 'chair' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {selected.kind === 'chair' ? <Shield className="h-10 w-10" /> : <Users className="h-10 w-10" />}
                  </div>
                )}
                <div>
                  <p className="text-3xl font-bold text-gray-900 leading-tight">{selected.full_name}</p>
                  <p className="text-xl text-gray-700 mt-1">
                    {selected.kind === 'chair' ? (
                      <>
                        <span className="font-semibold">{committeeName(selected.committee_id)}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-purple-700 font-bold">{roleLabel(selected)}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">{displayLocation(selected)}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span>{committeeName(selected.committee_id)}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{selected.email}</p>
                </div>

                {selected.kind === 'delegate' && selected.payment_status !== 'paid' && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Payment marked as <strong>{selected.payment_status || 'pending'}</strong>
                  </div>
                )}

                {selected.checked_in_at ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                      ✓ Already arrived at {new Date(selected.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button
                      onClick={() => undoCheckIn(selected)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm font-semibold"
                    >
                      <Undo2 className="h-4 w-4" /> Undo check-in
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={confirmCheckIn}
                    disabled={confirming}
                    className="w-full px-4 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {confirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    Confirm & Check In
                  </button>
                )}

                <button
                  onClick={() => setSelected(null)}
                  className="w-full px-4 py-2 text-gray-500 hover:text-gray-800 text-sm"
                >Wrong person — go back</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CheckIn;

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCountryCode } from '@/utils/countryCodes';
import { COMMON_COUNTRIES } from '@/data/countries';
import {
  Users, MapPin, Search, Lock, Trash2, UserPlus, RefreshCw, Check, Flag,
} from 'lucide-react';

interface Committee {
  id: string;
  name: string;
  abbreviation: string | null;
  total_spots: number | null;
  countries: string[] | null;
}

interface Delegate {
  id: string;
  full_name: string;
  email: string;
  institution?: string;
  payment_status?: string;
}

interface Assignment {
  id: string;
  application_id: string;
  committee_id: string;
  country: string | null;
}

const CommitteeAllocation = () => {
  const { toast } = useToast();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // editable draft country label for open numbered slots, keyed `${committeeId}:${index}`
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [countryOptions, setCountryOptions] = useState<string[]>(COMMON_COUNTRIES);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: comms, error: commErr }, { data: dels }, { data: asgs }] = await Promise.all([
        supabase.from('committees').select('*').order('name'),
        supabase.from('applications').select('id, full_name, email, institution, payment_status').eq('status', 'approved'),
        supabase.from('country_assignments').select('id, application_id, committee_id, country'),
      ]);
      if (commErr) {
        toast({ title: 'Could not load committees', description: commErr.message, variant: 'destructive' });
      }
      setCommittees((comms as any) || []);
      setDelegates((dels as any) || []);
      setAssignments((asgs as any) || []);

      // Build the country suggestion list: shared matrix list + any custom-added ones
      const { data: matrixCountries } = await (supabase.from('matrix_countries') as any).select('country_name');
      const custom = (matrixCountries || []).map((m: any) => m.country_name).filter(Boolean);
      setCountryOptions(Array.from(new Set([...COMMON_COUNTRIES, ...custom])).sort());
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load allocation data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Delegates eligible for allocation: paid AND not yet assigned to ANY committee
  const availableDelegates = useMemo(() => {
    const assignedIds = new Set(assignments.map(a => a.application_id));
    return delegates.filter(d => !assignedIds.has(d.id) && d.payment_status === 'paid');
  }, [delegates, assignments]);

  const delegateName = (id: string) => delegates.find(d => d.id === id)?.full_name || 'Unknown';

  const assignDelegate = async (committeeId: string, country: string, delegateId: string) => {
    const label = (country || '').trim();
    if (!label) {
      toast({ title: 'Pick a country first', variant: 'destructive' });
      return;
    }
    // Hard payment gate — only paid delegates can be allocated
    const delegate = delegates.find(d => d.id === delegateId);
    if (!delegate || delegate.payment_status !== 'paid') {
      toast({ title: 'Payment required', description: 'This delegate has not paid yet — only paid delegates can be allocated.', variant: 'destructive' });
      return;
    }
    // No duplicate country within the same committee
    const dup = assignments.some(a => a.committee_id === committeeId && (a.country || '').toLowerCase() === label.toLowerCase());
    if (dup) {
      toast({ title: 'Country already used', description: `${label} is already assigned in this committee.`, variant: 'destructive' });
      return;
    }
    try {
      const code = getCountryCode(label);
      const { data, error } = await (supabase.from('country_assignments') as any)
        .insert({
          application_id: delegateId,
          committee_id: committeeId,
          country: label,
          country_name: label,
          country_code: code ? code.toUpperCase() : null,
        })
        .select()
        .single();
      if (error) throw error;

      await (supabase.from('applications') as any)
        .update({ assigned_committee_id: committeeId })
        .eq('id', delegateId);

      setAssignments(prev => [...prev, data as Assignment]);
      toast({ title: 'Assigned', description: `${delegateName(delegateId)} → ${label}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
    }
  };

  const unassign = async (assignment: Assignment) => {
    try {
      const { error } = await supabase.from('country_assignments').delete().eq('id', assignment.id);
      if (error) throw error;
      // Clear the delegate's committee link
      await (supabase.from('applications') as any)
        .update({ assigned_committee_id: null })
        .eq('id', assignment.application_id);
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      toast({ title: 'Unassigned' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const updateAssignmentCountry = async (committee: Committee, assignment: Assignment, newCountry: string) => {
    const label = newCountry.trim();
    if (!label || label === assignment.country) return;
    // No duplicate country within the same committee
    const dup = assignments.some(a =>
      a.id !== assignment.id &&
      a.committee_id === committee.id &&
      (a.country || '').toLowerCase() === label.toLowerCase()
    );
    if (dup) {
      toast({ title: 'Country already used', description: `${label} is already assigned in this committee.`, variant: 'destructive' });
      return;
    }
    try {
      const code = getCountryCode(label);
      const { error } = await (supabase.from('country_assignments') as any)
        .update({ country: label, country_name: label, country_code: code ? code.toUpperCase() : null })
        .eq('id', assignment.id);
      if (error) throw error;
      setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, country: label } : a));
      toast({ title: 'Country updated', description: label });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filteredCommittees = committees.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.abbreviation || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSeats = committees.reduce((acc, c) => acc + Math.max(c.total_spots ?? 20, (c.countries || []).length), 0);
  const totalFilled = assignments.length;

  return (
    <AdminLayout title="Committee Allocation">
      {/* Shared country suggestions for all slot inputs */}
      <datalist id="country-options">
        {countryOptions.map((c) => <option key={c} value={c} />)}
      </datalist>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Committee Allocation</h2>
            <p className="text-gray-600">Assign delegates to each committee's seats. Set spots & countries in Committees.</p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <p className="text-sm text-gray-500">Total Seats</p>
            <p className="text-2xl font-semibold text-gray-900">{totalSeats}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <p className="text-sm text-gray-500">Filled</p>
            <p className="text-2xl font-semibold text-green-600">{totalFilled}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <p className="text-sm text-gray-500">Paid &amp; Unassigned</p>
            <p className="text-2xl font-semibold text-amber-600">{availableDelegates.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Only paid delegates can be allocated</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search committees..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : filteredCommittees.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-lg border">No committees found.</div>
        ) : (
          <div className="space-y-6">
            {filteredCommittees.map((committee) => {
              const committeeAssignments = assignments.filter(a => a.committee_id === committee.id);
              const configuredCountries = committee.countries || [];
              const totalSpots = Math.max(committee.total_spots ?? 20, configuredCountries.length, committeeAssignments.length);
              const filled = committeeAssignments.length;
              const openCount = Math.max(0, totalSpots - filled);

              // Country options: the committee's configured roster first (prioritised),
              // then the full global list — so every country is still pickable.
              const roster = Array.from(new Set([...configuredCountries, ...countryOptions]));
              const usedCountries = new Set(committeeAssignments.map(a => (a.country || '').toLowerCase()));

              return (
                <div key={committee.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Committee header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-diplomatic-50 to-white border-b">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-diplomatic-600" />
                      <span className="font-semibold text-gray-900">{committee.name}</span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      filled >= totalSpots ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {filled} / {totalSpots} filled
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Filled slots */}
                    {committeeAssignments.map((a) => {
                      // options = this assignment's own country + countries not used by others
                      const editOptions = roster.filter(
                        c => c.toLowerCase() === (a.country || '').toLowerCase() ||
                             !usedCountries.has(c.toLowerCase())
                      );
                      const known = roster.some(c => c.toLowerCase() === (a.country || '').toLowerCase());
                      return (
                        <div key={a.id} className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                          <Flag className="h-4 w-4 text-purple-500 shrink-0" />
                          <select
                            value={known ? (a.country || '') : ''}
                            onChange={(e) => updateAssignmentCountry(committee, a, e.target.value)}
                            className="w-32 bg-white text-sm font-medium text-purple-900 border border-purple-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-purple-400 focus:outline-none"
                            title="Country"
                          >
                            {!known && <option value="">{a.country || 'Pick country'}</option>}
                            {editOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <span className="text-sm text-gray-700 truncate flex-1">{delegateName(a.application_id)}</span>
                          <button onClick={() => unassign(a)} className="text-red-500 hover:text-red-700 shrink-0" title="Unassign">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Open slots */}
                    {Array.from({ length: openCount }).map((_, i) => {
                      const key = `${committee.id}:${i}`;
                      // countries chosen in other open-slot drafts for this committee
                      const otherDrafts = Object.entries(drafts)
                        .filter(([k, v]) => k.startsWith(`${committee.id}:`) && k !== key && v)
                        .map(([, v]) => v.toLowerCase());
                      const taken = new Set([...usedCountries, ...otherDrafts]);
                      const options = roster.filter(c => !taken.has(c.toLowerCase()));
                      const draftVal = drafts[key] ?? '';
                      return (
                        <div key={key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          <select
                            value={draftVal}
                            onChange={(e) => setDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-32 text-sm border border-gray-300 rounded px-1.5 py-1 bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          >
                            <option value="">Pick country…</option>
                            {options.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                if (!draftVal) {
                                  toast({ title: 'Pick a country first', variant: 'destructive' });
                                  return;
                                }
                                assignDelegate(committee.id, draftVal, e.target.value);
                                setDrafts(prev => { const n = { ...prev }; delete n[key]; return n; });
                              }
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Assign delegate…</option>
                            {availableDelegates.map(d => (
                              <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}

                    {openCount === 0 && (
                      <div className="md:col-span-2 flex items-center justify-center gap-2 py-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> All seats filled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CommitteeAllocation;

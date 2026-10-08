import React, { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ApplicationManagementModal from '@/components/admin/ApplicationManagementModal';
import DecisionEmailPanel from '@/components/admin/DecisionEmailPanel';
import { isChairApplication } from '@/lib/applications';
import { supabase, checkAuthState } from '@/integrations/supabase/client';
import { getCurrentSeason, inSeason } from '@/lib/season';
import {
  Check,
  XCircle,
  Clock,
  User,
  Users,
  School,
  MapPin,
  Download,
  Filter,
  Search,
  Trash2,
  Settings,
  Mail,
  Building,
  Calendar,
  Globe,
  Award,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ChevronDown,
  FileText,
  AlertCircle,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';

interface Application {
  id: string;
  full_name: string;
  application_type?: string | null;
  email: string;
  telegram_username?: string;
  institution: string;
  date_of_birth?: string;
  country: string;
  phone?: string;
  experience: string;
  previous_muns?: string;
  portfolio_link?: string;
  unique_delegate_trait?: string;
  issue_interest?: string;
  type1_selected_prompt?: string;
  type1_insight_response?: string;
  type2_selected_prompt?: string;
  type2_political_response?: string;
  committee_preference1: string;
  committee_preference2: string;
  committee_preference3: string;
  motivation?: string;
  fee_agreement?: string;
  discount_eligibility?: string;
  final_confirmation?: boolean;
  has_ielts: boolean;
  has_sat: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  created_at: string;
  application_id?: string;
  photo_url?: string;
  certificate_url?: string;
  ielts_certificate_url?: string;
  sat_certificate_url?: string;
  notes?: string;
  payment_status?: string | null;
  decision_emailed_at?: string | null;
}

const AdminApplications = () => {
  const { role } = useAdminRole();
  // Academics Manager has read/update access to applications but cannot
  // delete (single or bulk). SG is the only role allowed to remove rows;
  // the database RLS in migration 031 enforces this server-side too.
  const canDelete = role === 'sg';
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalApplication, setModalApplication] = useState<Application | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [convertConfirm, setConvertConfirm] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);

        const { isAuthenticated, user } = await checkAuthState();

        if (isAuthenticated) {
          await fetchApplications();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to verify authentication status",
          variant: "destructive",
        });
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuth();

    // Live updates: one quiet refresh per burst of changes (a bulk update
    // fires one event per row).
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = supabase
      .channel('admin-applications')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => {
          clearTimeout(timer);
          timer = setTimeout(() => fetchApplications(), 1000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter, typeFilter, searchQuery]);

  // Only the first load shows the full-page spinner; later refreshes keep the
  // list (and any open application) on screen.
  const loadedRef = useRef(false);

  const fetchApplications = async () => {
    try {
      if (!loadedRef.current) setLoading(true);

      const season = await getCurrentSeason();
      const { data, error } = await inSeason(supabase
        .from('applications')
        .select('*'), season)
        .order('created_at', { ascending: false });


      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        setApplications([]);
        return;
      }


      // Convert the string status to the defined type
      const typedData = (data as any[]).map(app => ({
        ...app,
        status: (app.status || 'pending') as 'pending' | 'approved' | 'rejected'
      })) as Application[];

      setApplications(typedData);
      loadedRef.current = true;
    } catch (error: any) {
      console.error('Error in fetchApplications:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load applications. Please check your connection and try again.",
        variant: "destructive",
      });
      // Keep what's already on screen after a failed refresh.
      if (!loadedRef.current) setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Apply application type filter.
    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => (typeFilter === 'chair') === isChairApplication(app));
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        app =>
          app.full_name?.toLowerCase().includes(query) ||
          app.email?.toLowerCase().includes(query) ||
          app.institution?.toLowerCase().includes(query) ||
          app.country?.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
    // Bulk actions must never reach rows the filter hides.
    const visible = new Set(filtered.map(a => a.id));
    setSelected(prev => ([...prev].every(id => visible.has(id)) ? prev : new Set([...prev].filter(id => visible.has(id)))));
  };

  const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected' | 'waitlisted') => {
    try {
      const { error } = await (supabase
        .from('applications') as any)
        .update({ 
          status,
          reviewed_at: new Date().toISOString()
        } as any)
        .eq('id', id);

      if (error) throw error;

      // Update local applications state
      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status } : app
        )
      );

      if (modalApplication?.id === id) {
        setModalApplication(prev => prev ? { ...prev, status } : null);
      }

      // Refresh email collections from database

      toast({
        title: "Status Updated",
        description: `Application has been ${status}`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  // Convert a rejected chair application into a delegate so it re-enters the
  // delegate pipeline. Rejected chairs are often still strong delegates, so
  // this lets admins reuse them instead of asking them to re-apply.
  //   - application_type   → 'delegate'
  //   - notes              → drop the legacy 'APPLICATION TYPE: chair' line
  //                          and record the conversion
  //   - status             → 'pending' so they show up as a fresh delegate to
  //                          approve; once approved they can be assigned a
  //                          country & committee in Delegate Management.
  const convertChairToDelegate = async (app: Application) => {
    try {
      const strippedNotes = (app.notes || '')
        .split('\n')
        .filter(line => !line.includes('APPLICATION TYPE: chair'))
        .join('\n')
        .trim();
      const conversionNote = `Converted from a rejected chair application on ${new Date().toLocaleDateString()}.`;
      const newNotes = strippedNotes ? `${conversionNote}\n${strippedNotes}` : conversionNote;

      const { error } = await (supabase
        .from('applications') as any)
        .update({
          application_type: 'delegate',
          notes: newNotes,
          status: 'pending',
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq('id', app.id);

      if (error) throw error;

      setApplications(prev =>
        prev.map(a =>
          a.id === app.id
            ? ({ ...a, application_type: 'delegate', notes: newNotes, status: 'pending' } as any)
            : a
        )
      );


      toast({
        title: 'Converted to Delegate',
        description: `${app.full_name} is now a pending delegate. Approve them to assign a country & committee.`,
      });
    } catch (error: any) {
      console.error('Error converting chair to delegate:', error);
      toast({
        title: 'Conversion Failed',
        description: error.message || 'Could not convert this application.',
        variant: 'destructive',
      });
    }
  };

  const deleteApplication = async (id: string | null) => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('applications' as any)
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw error;
      // RLS hides a refused delete (no error, nothing deleted).
      if (!data?.length) throw new Error('Nothing was deleted. Only the Secretary-General can delete applications.');

      // Update local state
      setApplications(prev => prev.filter(app => app.id !== id));
      setFilteredApplications(prev => prev.filter(app => app.id !== id));

      // Clear selected application if it was deleted
      if (modalApplication?.id === id) {
        setModalApplication(null);
      }

      // Refresh email collections from database

      toast({
        title: "Application Deleted",
        description: "The application has been permanently deleted",
      });
    } catch (error: any) {
      console.error('Error deleting application:', error);
      const errorMessage = error.message || (typeof error === 'string' ? error : "Unknown error");
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allShownSelected = filteredApplications.length > 0 && filteredApplications.every(a => selected.has(a.id));
  const toggleSelectAllShown = () => {
    setSelected(allShownSelected ? new Set() : new Set(filteredApplications.map(a => a.id)));
  };

  const bulkUpdate = async (fields: Record<string, string>, label: string) => {
    const ids = Array.from(selected);
    if (!confirm(`${label}: apply to ${ids.length} application${ids.length === 1 ? '' : 's'}?`)) return;
    setBulkBusy(true);
    try {
      const { error } = await (supabase.from('applications') as any)
        .update({ ...fields, ...(fields.status ? { reviewed_at: new Date().toISOString() } : {}) })
        .in('id', ids);
      if (error) throw error;
      toast({ title: `${label}: ${ids.length}` });
      setSelected(new Set());
      await fetchApplications();
    } catch (err: any) {
      toast({ title: 'Bulk update failed', description: err.message, variant: 'destructive' });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // xlsx is ~200 KB; load it only when someone actually exports.
      const { exportApplicationsToExcel } = await import('@/utils/excelExport');
      const fileName = exportApplicationsToExcel(filteredApplications, 'TuronMUN_Applications');
      toast({
        title: "Export Successful",
        description: `Applications exported to ${fileName}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export applications. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Applications Management">
      {!authChecked || loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-diplomatic-600"></div>
          <p className="text-diplomatic-600">Loading applications...</p>
        </div>
      ) : (
        <>
          <DecisionEmailPanel applications={applications} onSent={fetchApplications} />

          <div className="flex flex-col h-full">
            {/* Applications Grid */}
            <div className="w-full">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold mb-2 md:mb-0">Applications Management</h3>

                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      {/* Type filter */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users size={14} className="text-gray-400" />
                        </div>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="all">All Types</option>
                          <option value="delegate">Delegates</option>
                          <option value="chair">Chairs / Co-Chairs</option>
                        </select>
                      </div>

                      {/* Status filter */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Filter size={14} className="text-gray-400" />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="waitlisted">Waitlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <button
                        onClick={handleExportExcel}
                        className="bg-green-600 text-white py-2 px-3 rounded-md text-sm flex items-center hover:bg-green-700 transition-colors"
                      >
                        <Download size={14} className="mr-1" />
                        Export Excel
                      </button>

                      <button
                        onClick={toggleSelectAllShown}
                        disabled={filteredApplications.length === 0}
                        className="border border-gray-300 bg-white text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-50 disabled:opacity-40"
                      >
                        {allShownSelected ? 'Clear selection' : `Select all ${filteredApplications.length}`}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, school, country..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {selected.size > 0 && (
                  <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-diplomatic-50 px-4 py-3">
                    <span className="mr-2 text-sm font-semibold text-diplomatic-900">{selected.size} selected</span>
                    <button disabled={bulkBusy} onClick={() => bulkUpdate({ status: 'approved' }, 'Approved')} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
                    <button disabled={bulkBusy} onClick={() => bulkUpdate({ status: 'waitlisted' }, 'Waitlisted')} className="rounded-md bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-600 disabled:opacity-50">Waitlist</button>
                    <button disabled={bulkBusy} onClick={() => bulkUpdate({ status: 'rejected' }, 'Rejected')} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                    <button disabled={bulkBusy} onClick={() => bulkUpdate({ payment_status: 'paid' }, 'Marked paid')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Mark paid</button>
                    <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-500 hover:text-gray-800">Clear</button>
                  </div>
                )}

                <div className="p-6">
                  {filteredApplications.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {applications.length === 0
                        ? 'No applications have been submitted yet'
                        : 'No applications match your search criteria'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredApplications.map((app) => (
                        <div
                          key={app.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selected.has(app.id)}
                                onChange={() => toggleSelected(app.id)}
                                aria-label={`Select ${app.full_name}`}
                                className="mr-3 h-4 w-4 rounded border-gray-300 text-diplomatic-600 focus:ring-diplomatic-500"
                              />
                              <div className="mr-3">
                                {app.status === 'approved' ? (
                                  <Check size={16} className="text-green-500" strokeWidth={2} />
                                ) : app.status === 'rejected' ? (
                                  <XCircle size={20} className="text-red-500" />
                                ) : app.status === 'waitlisted' ? (
                                  <Clock size={20} className="text-orange-500" />
                                ) : (
                                  <Clock size={20} className="text-yellow-500" />
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                app.status === 'approved'   ? 'bg-green-100 text-green-800'
                                : app.status === 'rejected'   ? 'bg-red-100 text-red-800'
                                : app.status === 'waitlisted' ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              #{app.id.substring(0, 8)}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="font-semibold text-gray-900 text-lg">{app.full_name}</h4>
                              {isChairApplication(app) ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold">Chair/Co-Chair</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-bold">Delegate</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">{app.email}</div>

                            <div className="flex flex-col gap-2 text-sm mt-3">
                              <div className="flex items-center text-gray-500">
                                <School size={14} className="mr-2" />
                                {app.institution}
                              </div>
                              <div className="flex items-center text-gray-500">
                                <MapPin size={14} className="mr-2" />
                                {app.country}
                              </div>
                              {app.telegram_username && (
                                <div className="flex items-center text-blue-600 font-medium">
                                  <MessageSquare size={14} className="mr-2" />
                                  {app.telegram_username}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                               {(app.photo_url || app.notes?.includes('Photo URL: http')) && (
                                 <div className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                                   <User size={10} /> Photo
                                 </div>
                               )}
                               {(app.ielts_certificate_url || app.notes?.includes('IELTS URL: http')) && (
                                 <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                                   <FileText size={10} /> IELTS
                                 </div>
                               )}
                               {(app.sat_certificate_url || app.notes?.includes('SAT URL: http')) && (
                                 <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                   <FileText size={10} /> SAT
                                 </div>
                               )}
                               {app.certificate_url && !app.ielts_certificate_url && !app.sat_certificate_url && (
                                 <div className="flex items-center gap-1 text-[10px] bg-diplomatic-50 text-diplomatic-700 px-2 py-0.5 rounded-full border border-diplomatic-100">
                                   <FileText size={10} /> Cert
                                 </div>
                               )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Telegram — always shown when available */}
                              {(app as any).telegram_username && (
                                <a
                                  href={`https://t.me/${((app as any).telegram_username as string).replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg text-xs font-semibold transition-colors"
                                  title="Open Telegram chat"
                                >
                                  <MessageSquare size={13} /> Telegram
                                </a>
                              )}
                              {/* Quick accept — only for waitlisted */}
                              {app.status === 'waitlisted' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateApplicationStatus(app.id, 'approved'); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                  title="Accept this waitlisted delegate"
                                >
                                  <Check size={13} /> Accept Now
                                </button>
                              )}
                              {/* Convert to delegate — only for rejected chairs */}
                              {app.status === 'rejected' && isChairApplication(app) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConvertConfirm(app); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                  title="Convert this rejected chair into a delegate"
                                >
                                  <UserPlus size={13} /> Make Delegate
                                </button>
                              )}
                            </div>

                            <div className="text-xs text-gray-400">
                              {new Date(app.created_at).toLocaleDateString()}
                            </div>

                            <button
                              onClick={() => setModalApplication(app)}
                              className="bg-diplomatic-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-diplomatic-700 transition-colors"
                            >
                              <Settings size={16} />
                              <span>Manage</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Application Management Modal (view) */}
          {modalApplication && (
            <ApplicationManagementModal
              application={modalApplication}
              onClose={() => setModalApplication(null)}
              onUpdateStatus={updateApplicationStatus}
              onDelete={canDelete ? (id) => setDeleteConfirmId(id) : undefined}
            />
              )}

              {/* Delete Confirmation Modal */}
              {deleteConfirmId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="text-red-600" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                      <p className="text-gray-600">
                        Are you sure you want to delete this application? This action is permanent and cannot be undone.
                      </p>
                      <div className="flex w-full space-x-3 pt-4">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            deleteApplication(deleteConfirmId);
                            setDeleteConfirmId(null);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
                        >
                          Permanently Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Convert Chair → Delegate Confirmation Modal */}
              {convertConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                        <UserPlus className="text-sky-600" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Convert to Delegate</h3>
                      <p className="text-gray-600">
                        Convert <span className="font-semibold">{convertConfirm.full_name}</span> from a
                        rejected chair into a delegate? Their status will reset to{' '}
                        <span className="font-semibold">pending</span> so you can approve them and assign
                        a country &amp; committee.
                      </p>
                      <div className="flex w-full space-x-3 pt-4">
                        <button
                          onClick={() => setConvertConfirm(null)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            convertChairToDelegate(convertConfirm);
                            setConvertConfirm(null);
                          }}
                          className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors shadow-sm"
                        >
                          Make Delegate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminApplications;

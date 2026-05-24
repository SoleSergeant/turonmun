import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { getCountryCode } from '@/utils/countryCodes';
import { COMMON_COUNTRIES } from '@/data/countries';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  AlertTriangle,
  Users,
  School,
  MapPin,
  CreditCard,
  FileText,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from 'react-router-dom';

// Shared country list moved to @/data/countries.ts

interface Delegate {
  id: string;
  full_name: string;
  email: string;
  school: string;
  grade: string;
  phone: string;
  committee_preference_1: string;
  committee_preference_2: string;
  committee_preference_3: string;
  country_preference: string;
  assigned_committee?: string;
  assigned_country?: string;
  application_status: 'pending' | 'accepted' | 'rejected' | 'waitlist' | 'more_info';
  payment_status: 'pending' | 'paid' | 'overdue';
  documents_submitted: boolean;
  registration_date: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  dietary_requirements?: string;
  emergency_contact: string;
}

const DelegateManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [filteredDelegates, setFilteredDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedDelegates, setSelectedDelegates] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [managedCountries, setManagedCountries] = useState<string[]>([]);

  // Assignment modal state
  const [assignModal, setAssignModal] = useState<{
    delegateId: string;
    delegateName: string;
    committeeId: string;
    committeeName: string;
  } | null>(null);
  const [assignCountry, setAssignCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // Fetch real data from Supabase
  useEffect(() => {
    fetchDelegates();
  }, []);

  const fetchDelegates = async () => {
    try {
      setLoading(true);
      // Only fetch approved applications
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch country assignments
      const { data: assignments } = await (supabase
        .from('country_assignments') as any)
        .select('*, committees(name)');

      // Fetch managed countries
      const { data: managedData } = await (supabase
        .from('matrix_countries') as any)
        .select('country_name');

      setManagedCountries(managedData?.map((m: any) => m.country_name) || []);

      // Map database records to Delegate interface
      const mappedDelegates: Delegate[] = (data || []).map(app => {
        // Parse notes to extract grade, emergency contact, etc.
        const notes = app.notes || '';
        const gradeMatch = notes.match(/Grade:\s*([^\n]+)/);

        // Find assignment for this delegate
        const assignment = assignments?.find(a => a.application_id === app.id);

        return {
          id: app.id,
          full_name: app.full_name,
          email: app.email,
          school: app.institution,
          grade: gradeMatch ? gradeMatch[1].trim() : 'N/A',
          phone: app.phone || 'N/A',
          committee_preference_1: app.committee_preference1,
          committee_preference_2: app.committee_preference2,
          committee_preference_3: app.committee_preference3,
          country_preference: app.country,
          assigned_committee: assignment?.committees?.name,
          assigned_country: assignment?.country || assignment?.country_name,
          application_status: (app.status || 'pending') as any,
          payment_status: (app.payment_status || 'pending') as any,
          documents_submitted: !!(app.has_ielts || app.has_sat),
          registration_date: new Date(app.created_at || '').toLocaleDateString(),
          experience_level: app.experience === '6+' ? 'advanced' : app.experience === '3-5' ? 'intermediate' : 'beginner',
          dietary_requirements: app.dietary_restrictions || undefined,
          emergency_contact: app.emergency_contact_relation || 'N/A'
        };
      });

      setDelegates(mappedDelegates);
      setFilteredDelegates(mappedDelegates);
    } catch (error: any) {
      console.error('Error fetching delegates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load delegates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch committees from database
  const [committees, setCommittees] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('committees')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
    }
  };

  // Modal states
  const [selectedDelegate, setSelectedDelegate] = useState<Delegate | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleViewDelegate = (delegate: Delegate) => {
    setSelectedDelegate(delegate);
    setShowViewModal(true);
  };

  const handleEditDelegate = (delegate: Delegate) => {
    setSelectedDelegate(delegate);
    setShowEditModal(true);
  };

  const handleEmailDelegate = (delegate: Delegate) => {
    setSelectedDelegate(delegate);
    setShowEmailModal(true);
  };

  const sendEmail = async (to: string, subject: string, body: string) => {
    // TODO: Implement email sending via your backend/API
    toast({
      title: 'Email Sent',
      description: `Email sent to ${to}`,
    });
    setShowEmailModal(false);
  };

  const handleDeleteDelegate = async (delegateId: string) => {
    if (!confirm('Are you sure you want to delete this delegate? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', delegateId);

      if (error) throw error;

      setDelegates(prev => prev.filter(d => d.id !== delegateId));

      toast({
        title: 'Success',
        description: 'Delegate deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting delegate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delegate',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'School',
      'Grade',
      'Country',
      'Committee 1',
      'Committee 2',
      'Committee 3',
      'Status',
      'Payment Status',
      'Experience Level',
      'Registration Date',
      'Dietary Requirements',
      'Emergency Contact'
    ];

    // Prepare CSV rows
    const rows = filteredDelegates.map(delegate => [
      delegate.full_name,
      delegate.email,
      delegate.phone,
      delegate.school,
      delegate.grade,
      delegate.country_preference,
      delegate.committee_preference_1,
      delegate.committee_preference_2,
      delegate.committee_preference_3,
      delegate.application_status,
      delegate.payment_status,
      delegate.experience_level,
      delegate.registration_date,
      delegate.dietary_requirements || '',
      delegate.emergency_contact
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `delegates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Exported ${filteredDelegates.length} delegates to CSV`,
    });
  };

  // Filter delegates based on search and filters
  useEffect(() => {
    let filtered = delegates.filter(delegate => {
      const matchesSearch =
        delegate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delegate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delegate.school.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCommittee = committeeFilter === 'all' ||
        delegate.committee_preference_1 === committeeFilter ||
        delegate.committee_preference_2 === committeeFilter ||
        delegate.committee_preference_3 === committeeFilter ||
        delegate.assigned_committee === committeeFilter;
      const matchesPayment = paymentFilter === 'all' || delegate.payment_status === paymentFilter;

      return matchesSearch && matchesCommittee && matchesPayment;
    });

    setFilteredDelegates(filtered);
  }, [delegates, searchTerm, committeeFilter, paymentFilter]);

  // Open the assignment modal instead of using prompt()
  const openAssignModal = (delegateId: string, committeeId: string) => {
    const delegate = delegates.find(d => d.id === delegateId);
    const committee = committees.find(c => c.id === committeeId);
    if (!delegate || !committee) return;

    setAssignModal({
      delegateId,
      delegateName: delegate.full_name,
      committeeId,
      committeeName: committee.name,
    });
    setAssignCountry('');
    setCountrySearch('');
  };

  const handleAssignCommittee = async () => {
    if (!assignModal || !assignCountry) {
      toast({ title: 'Error', description: 'Please select a country', variant: 'destructive' });
      return;
    }

    const { delegateId, committeeId } = assignModal;

    try {
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('country_assignments')
        .select('*')
        .eq('application_id', delegateId)
        .eq('committee_id', committeeId)
        .single();

      if (existingAssignment) {
        toast({
          title: 'Already Assigned',
          description: 'This delegate is already assigned to this committee',
          variant: 'destructive',
        });
        return;
      }

      // Insert new assignment into country_assignments table
      // Providing all potential column names to ensure compatibility with different schema versions
      const { error } = await (supabase
        .from('country_assignments') as any)
        .insert({
          country: assignCountry,
          country_name: assignCountry,
          country_code: getCountryCode(assignCountry).toUpperCase(),
          committee_id: committeeId,
          application_id: delegateId,
        });

      if (error) throw error;

      await (supabase
        .from('applications') as any)
        .update({ 
          assigned_committee_id: committeeId,
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', delegateId);

      // Update local state
      const committeeName = committees.find(c => c.id === committeeId)?.name;
      setDelegates(prev => prev.map(delegate =>
        delegate.id === delegateId
          ? {
            ...delegate,
            assigned_committee: committeeName,
            assigned_country: assignCountry,
            application_status: 'accepted'
          }
          : delegate
      ));

      toast({
        title: 'Success',
        description: `Assigned to ${committeeName} representing ${assignCountry}`,
      });

      setAssignModal(null);
    } catch (error: any) {
      console.error('Error assigning committee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign committee',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlist': return 'bg-yellow-100 text-yellow-800';
      case 'more_info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Countries list is now at the top of the file (COMMON_COUNTRIES)

  return (
    <AdminLayout title="Delegate Management">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Delegate Management</h2>
            <p className="text-gray-600">Manage applications, assignments, and delegate status</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{delegates.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-semibold text-green-600">
                  {delegates.filter(d => d.application_status === 'accepted').length}
                </p>
              </div>
              <Check className="h-5 w-5 text-green-500" strokeWidth={2} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {delegates.filter(d => d.application_status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Pending</p>
                <p className="text-2xl font-semibold text-red-600">
                  {delegates.filter(d => d.payment_status === 'pending' || d.payment_status === 'overdue').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
                  <select
                    value={committeeFilter}
                    onChange={(e) => setCommitteeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Committees</option>
                    {committees.map(committee => (
                      <option key={committee.id} value={committee.name}>{committee.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Payment Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delegates Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectedDelegates.length === filteredDelegates.length && filteredDelegates.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setSelectedDelegates(filteredDelegates.map(d => d.id));
                        } else {
                          setSelectedDelegates([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delegate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School & Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Committee Preferences
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Loading delegates...
                    </td>
                  </tr>
                ) : filteredDelegates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No delegates found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDelegates.map((delegate) => (
                    <tr key={delegate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={selectedDelegates.includes(delegate.id)}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setSelectedDelegates(prev => [...prev, delegate.id]);
                            } else {
                              setSelectedDelegates(prev => prev.filter(id => id !== delegate.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delegate.full_name}</div>
                          <div className="text-sm text-gray-500">{delegate.email}</div>
                          <div className="text-xs text-gray-400">{delegate.phone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <School className="h-3 w-3" />
                            {delegate.school}
                          </div>
                          <div className="text-sm text-gray-500">{delegate.grade}</div>
                          <div className="text-xs text-gray-400">
                            {delegate.experience_level} • {delegate.registration_date}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-blue-600">1. {delegate.committee_preference_1}</div>
                          <div className="text-xs text-gray-500">2. {delegate.committee_preference_2}</div>
                          <div className="text-xs text-gray-400">3. {delegate.committee_preference_3}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {delegate.country_preference}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {delegate.assigned_committee ? (
                          <div>
                            <div className="text-sm font-medium text-green-700">{delegate.assigned_committee}</div>
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {delegate.assigned_country}
                            </div>
                            <button
                              onClick={() => navigate('/admin/country-matrix')}
                              className="text-[10px] text-blue-500 hover:underline mt-1"
                            >
                              View in Matrix →
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  openAssignModal(delegate.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                              defaultValue=""
                            >
                              <option value="">Assign Committee</option>
                              {committees.map(committee => (
                                <option key={committee.id} value={committee.id}>{committee.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(delegate.payment_status)}`}>
                          {delegate.payment_status}
                        </span>

                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDelegate(delegate)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditDelegate(delegate)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDelegate(delegate.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDelegates.length > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedDelegates.length} delegate(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                  Accept All
                </button>
                <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                  Reject All
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Send Email
                </button>
                <button
                  onClick={() => setSelectedDelegates([])}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Country Assignment Modal */}
        {assignModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Assign Committee & Country</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {assignModal.delegateName} → {assignModal.committeeName}
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Country to Represent
                  </label>
                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>
                  {/* Country list */}
                  <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                    {Array.from(new Set([...COMMON_COUNTRIES, ...managedCountries]))
                      .sort()
                      .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                      .map(country => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => setAssignCountry(country)}
                          className={`w-full text-left px-4 py-2 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                            assignCountry === country
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{country}</span>
                            {assignCountry === country && <Check className="h-4 w-4 text-blue-600" />}
                          </div>
                        </button>
                      ))
                    }
                    {COMMON_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No country found</div>
                    )}
                  </div>
                  {assignCountry && (
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      ✓ Selected: {assignCountry}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end bg-gray-50">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignCommittee}
                  disabled={!assignCountry}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Delegate Modal */}
        {showViewModal && selectedDelegate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">Delegate Details</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">{selectedDelegate.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedDelegate.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedDelegate.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">School</label>
                      <p className="text-gray-900">{selectedDelegate.school}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Grade</label>
                      <p className="text-gray-900">{selectedDelegate.grade}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience Level</label>
                      <p className="text-gray-900 capitalize">{selectedDelegate.experience_level}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDelegate.application_status)}`}>
                        {selectedDelegate.application_status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(selectedDelegate.payment_status)}`}>
                        {selectedDelegate.payment_status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Committee Preferences</label>
                    <ol className="list-decimal list-inside text-gray-900">
                      <li>{selectedDelegate.committee_preference_1}</li>
                      <li>{selectedDelegate.committee_preference_2}</li>
                      <li>{selectedDelegate.committee_preference_3}</li>
                    </ol>
                  </div>
                  {selectedDelegate.dietary_requirements && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dietary Requirements</label>
                      <p className="text-gray-900">{selectedDelegate.dietary_requirements}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">{selectedDelegate.emergency_contact}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Delegate Modal */}
        {showEditModal && selectedDelegate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">Edit Delegate</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);

                  try {
                    const { error } = await (supabase
                      .from('applications') as any)
                      .update({
                        full_name: formData.get('full_name') as string,
                        email: formData.get('email') as string,
                        phone: formData.get('phone') as string,
                        institution: formData.get('institution') as string,
                        country: formData.get('country') as string,
                        payment_status: formData.get('payment_status') as string,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', selectedDelegate.id);

                    if (error) {
                      console.error('Supabase error details:', error);
                      throw error;
                    }

                    toast({
                      title: 'Success',
                      description: 'Delegate information updated successfully',
                    });

                    setShowEditModal(false);
                    fetchDelegates(); // Refresh the list
                  } catch (error: any) {
                    console.error('Error updating delegate:', error);
                    toast({
                      title: 'Error',
                      description: error.message || error.hint || 'Failed to update delegate information',
                      variant: 'destructive',
                    });
                  }
                }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="full_name"
                          defaultValue={selectedDelegate.full_name}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={selectedDelegate.email}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={selectedDelegate.phone}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                        <input
                          type="text"
                          name="institution"
                          defaultValue={selectedDelegate.school}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          name="country"
                          defaultValue={selectedDelegate.country_preference}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                        <select
                          name="payment_status"
                          defaultValue={selectedDelegate.payment_status}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && selectedDelegate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">Send Email to {selectedDelegate.full_name}</h3>
                  <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  sendEmail(
                    selectedDelegate.email,
                    formData.get('subject') as string,
                    formData.get('body') as string
                  );
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                      <input
                        type="email"
                        value={selectedDelegate.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        name="body"
                        required
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your message here..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowEmailModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Send Email
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DelegateManagement;

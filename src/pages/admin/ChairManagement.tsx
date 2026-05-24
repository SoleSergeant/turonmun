import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Globe,
  Key,
  Check,
  XCircle,
  Loader2,
  X,
  Search,
  UserCheck
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Constants for secondary client to create users without logging out admin
const SUPABASE_URL = "https://sasuvkcqdqmmjobmgida.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc3V2a2NxZHFtbWpvYm1naWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjkwNTEsImV4cCI6MjA2NjEwNTA1MX0.ZbjusSyiN3kBTVM10Ws_nKoqvblBQFvy8kZE6U3IqoQ";

interface Chair {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  committee_name?: string;
  committee_id?: string;
}

interface Committee {
  id: string;
  name: string;
  chair: string | null;
  co_chair: string | null;
}

const ChairManagement = () => {
  const { toast } = useToast();
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChair, setSelectedChair] = useState<Chair | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'chair',
    committee_id: '',
    user_id: '',
  });

  // 'existing' = promote existing user, 'new' = create new account
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [isRealAdmin, setIsRealAdmin] = useState(false);

  useEffect(() => {
    checkRealAdmin();
    fetchData();
  }, []);

  const checkRealAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsRealAdmin(!!session);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch committees first
      const { data: committeesData, error: committeesError } = await supabase
        .from('committees')
        .select('*');

      if (committeesError) throw committeesError;
      setCommittees(committeesData || []);

      // Fetch chairs (admin_users with role chair/co-chair/co_chair)
      const { data: usersData, error: usersError } = await supabase
        .from('admin_users')
        .select('*')
        .in('role', ['chair', 'co-chair', 'co_chair', 'director']);

      if (usersError) throw usersError;

      // Map chairs to committees
      const mappedChairs = (usersData || []).map(user => {
        // Find committee where this user is chair or co-chair
        // Note: This relies on name matching which is fragile but consistent with current schema
        const committee = committeesData?.find(c =>
          c.chair === user.full_name || c.co_chair === user.full_name
        );

        return {
          ...user,
          committee_name: committee?.name,
          committee_id: committee?.id
        };
      });

      setChairs(mappedChairs);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load chair data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setUserSearchLoading(true);
    try {
      // Uses the search_users_for_admin function that searches both
      // auth.users AND applications tables
      const { data } = await supabase
        .rpc('search_users_for_admin', { search_query: query });
      setUserSearchResults((data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name || u.email,
        email: u.email,
      })));
    } catch {
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  const handleAddChair = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRealAdmin) {
      toast({
        title: "Access Denied",
        description: "You are using demo admin access. Please log out and sign in with a real admin account to manage chairs.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);

    try {
      let userId = '';
      let fullName = formData.full_name;
      let email = formData.email;

      if (addMode === 'existing') {
        if (!selectedExistingUser) throw new Error('Please search for and select an existing user.');
        userId = selectedExistingUser.id;
        fullName = selectedExistingUser.full_name;
        email = selectedExistingUser.email;
      } else {
        // Create new user via secondary client (keeps admin session intact)
        const tempClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false }
        });
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email,
          password: formData.password,
          options: { data: { full_name: fullName } }
        });
        if (authError) {
          if (authError.message.includes('already registered')) {
            throw new Error("This email is already registered. Switch to the 'Existing User' tab instead.");
          }
          throw authError;
        }
        if (!authData.user) throw new Error('Failed to create user account.');
        userId = authData.user.id;
      }

      // Insert into admin_users
      const { error: dbError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role: formData.role,
          committee_id: formData.committee_id || null,
          password_hash: addMode === 'existing' ? 'existing_user' : 'managed_by_auth',
          is_active: true
        });
      if (dbError) throw dbError;

      // Assign to committee if selected
      if (formData.committee_id) {
        const field = formData.role === 'chair' ? 'chair' : 'co_chair';
        await supabase.from('committees').update({ [field]: fullName }).eq('id', formData.committee_id);
      }

      toast({
        title: "Success",
        description: addMode === 'existing' ? `${fullName} promoted to ${formData.role}` : 'New chair account created',
      });

      setShowAddModal(false);
      setFormData({ full_name: '', email: '', password: '', role: 'chair', committee_id: '', user_id: '' });
      setSelectedExistingUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      fetchData();

    } catch (error: any) {
      console.error('Error adding chair:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to add chair',
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditChair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChair) return;

    if (!isRealAdmin) {
      toast({
        title: "Access Denied",
        description: "You are using demo admin access. Please log out and sign in with a real admin account to manage chairs.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);

    try {
      // 1. Update admin_users
      const { error: dbError } = await supabase
        .from('admin_users')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          committee_id: formData.committee_id || null,
        })
        .eq('id', selectedChair.id);

      if (dbError) throw dbError;

      // 2. Handle Committee Assignment
      // If committee changed or role changed, we need to update committees table

      // First, remove from old committee if exists
      if (selectedChair.committee_id) {
        // We need to check if they were chair or co-chair in the old committee
        // But since we rely on name matching, we can just check both fields for the OLD name
        const oldCommittee = committees.find(c => c.id === selectedChair.committee_id);
        if (oldCommittee) {
          const updates: any = {};
          if (oldCommittee.chair === selectedChair.full_name) updates.chair = null;
          if (oldCommittee.co_chair === selectedChair.full_name) updates.co_chair = null;

          if (Object.keys(updates).length > 0) {
            await supabase.from('committees').update(updates).eq('id', selectedChair.committee_id);
          }
        }
      }

      // Then assign to new committee
      if (formData.committee_id) {
        const updateField = formData.role === 'chair' ? 'chair' : 'co_chair';
        await supabase
          .from('committees')
          .update({ [updateField]: formData.full_name })
          .eq('id', formData.committee_id);
      }

      toast({
        title: "Success",
        description: "Chair updated successfully",
      });

      setShowEditModal(false);
      fetchData();

    } catch (error: any) {
      console.error('Error updating chair:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update chair",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChair = async (id: string, fullName: string) => {
    if (!isRealAdmin) {
      toast({
        title: "Access Denied",
        description: "You are using demo admin access. Please log out and sign in with a real admin account to manage chairs.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this chair? This action cannot be undone.')) return;

    try {
      // 1. Remove from any committees
      // We need to find committees where this person is assigned
      const { data: committeeData } = await supabase
        .from('committees')
        .select('*')
        .or(`chair.eq.${fullName},co_chair.eq.${fullName}`);

      if (committeeData && committeeData.length > 0) {
        for (const committee of committeeData) {
          const updates: any = {};
          if (committee.chair === fullName) updates.chair = null;
          if (committee.co_chair === fullName) updates.co_chair = null;

          await supabase.from('committees').update(updates).eq('id', committee.id);
        }
      }

      // 2. Delete from admin_users
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chair deleted successfully (Auth account may still exist)",
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting chair:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete chair",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (chair: Chair) => {
    setSelectedChair(chair);
    setFormData({
      full_name: chair.full_name,
      email: chair.email,
      password: '', // Don't load password
      role: chair.role,
      committee_id: chair.committee_id || '',
    });
    setShowEditModal(true);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <AdminLayout title="Chair Management">
      <div className="space-y-6">
        {!isRealAdmin && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You are viewing this page in <strong>Demo Mode</strong>. To add, edit, or delete chairs, you must <a href="/admin" className="font-medium underline hover:text-yellow-600">log in</a> with a real admin account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Chair Management</h2>
            <p className="text-gray-600">Manage committee chairs and their permissions</p>
          </div>
          <button
            onClick={() => {
              setFormData({ full_name: '', email: '', password: '', role: 'chair', committee_id: '', user_id: '' });
              setAddMode('existing');
              setSelectedExistingUser(null);
              setUserSearchQuery('');
              setUserSearchResults([]);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Chair
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Chairs</p>
                <p className="text-2xl font-semibold text-gray-900">{chairs.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-green-600">
                  {chairs.filter(c => c.is_active).length}
                </p>
              </div>
              <Check className="h-4 w-4 text-green-500" strokeWidth={2} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {chairs.filter(c => c.committee_id).length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {chairs.filter(c => !c.committee_id).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Chairs Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chair</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Committee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading chairs...
                    </td>
                  </tr>
                ) : chairs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No chairs found. Click "Add Chair" to create one.
                    </td>
                  </tr>
                ) : (
                  chairs.map((chair) => (
                    <tr key={chair.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{chair.full_name}</div>
                          <div className="text-sm text-gray-500">{chair.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {chair.committee_name ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-900">{chair.committee_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 capitalize">
                          {chair.role === 'co_chair' || chair.role === 'co-chair' ? 'Co-Chair' : chair.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(chair.is_active)}`}>
                          {chair.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900">
                          {chair.last_login ? new Date(chair.last_login).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(chair)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChair(chair.id, chair.full_name)}
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

        {/* Add Chair Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Add Chair</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Promote an existing user or create a new account</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg border border-gray-200 p-1 mb-5 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => { setAddMode('existing'); setSelectedExistingUser(null); setUserSearchQuery(''); setUserSearchResults([]); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${addMode === 'existing' ? 'bg-white shadow text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    Existing User
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('new')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${addMode === 'new' ? 'bg-white shadow text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Plus className="h-4 w-4" />
                    New Account
                  </button>
                </div>

                <form onSubmit={handleAddChair} className="space-y-4">
                  {/* EXISTING USER TAB */}
                  {addMode === 'existing' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or email</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => {
                              setUserSearchQuery(e.target.value);
                              setSelectedExistingUser(null);
                              searchUsers(e.target.value);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Type name or email..."
                          />
                          {userSearchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                        </div>
                      </div>

                      {/* Search Results */}
                      {userSearchResults.length > 0 && !selectedExistingUser && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                          {userSearchResults.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => { setSelectedExistingUser(u); setUserSearchQuery(u.full_name); setUserSearchResults([]); }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900 text-sm">{u.full_name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected User Card */}
                      {selectedExistingUser && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {selectedExistingUser.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{selectedExistingUser.full_name}</div>
                            <div className="text-xs text-gray-500 truncate">{selectedExistingUser.email}</div>
                          </div>
                          <button type="button" onClick={() => { setSelectedExistingUser(null); setUserSearchQuery(''); }} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {userSearchQuery.length >= 2 && userSearchResults.length === 0 && !userSearchLoading && !selectedExistingUser && (
                        <p className="text-sm text-gray-500 text-center py-2">No users found. Try the "New Account" tab to create one.</p>
                      )}
                    </div>
                  )}

                  {/* NEW ACCOUNT TAB */}
                  {addMode === 'new' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="jane@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Min. 6 characters"
                        />
                      </div>
                    </div>
                  )}

                  {/* Shared fields: Role + Committee */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="chair">Chair</option>
                        <option value="co_chair">Co-Chair</option>
                        <option value="director">Director</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
                      <select
                        value={formData.committee_id}
                        onChange={(e) => setFormData({ ...formData, committee_id: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {committees.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || (addMode === 'existing' && !selectedExistingUser)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {addMode === 'existing' ? 'Promote to Chair' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Chair Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">Edit Chair</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleEditChair} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="chair">Chair</option>
                      <option value="co_chair">Co-Chair</option>
                      <option value="director">Director</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Committee</label>
                    <select
                      value={formData.committee_id}
                      onChange={(e) => setFormData({ ...formData, committee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {committees.map(committee => (
                        <option key={committee.id} value={committee.id}>{committee.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Changes
                    </button>
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

export default ChairManagement;

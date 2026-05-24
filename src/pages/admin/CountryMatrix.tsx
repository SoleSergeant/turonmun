import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload,
  Download,
  Save,
  RefreshCw,
  MapPin,
  Globe,
  Check,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Filter,
  Search,
  UserPlus,
  Trash2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getCountryCode } from '@/utils/countryCodes';
import { COMMON_COUNTRIES } from '@/data/countries';

interface Committee {
  id: string;
  name: string;
  abbreviation: string;
}

interface Delegate {
  id: string;
  full_name: string;
  email: string;
  institution?: string;
}

interface CountryAssignment {
  id?: string;
  country: string;
  committee_id: string;
  application_id?: string;
  delegate?: Delegate;
  assigned_at?: string;
}

interface CountryAvailability {
  country: string;
  committees: {
    [committeeId: string]: {
      available: boolean;
      assigned: boolean;
      assignedTo?: string;
      assignmentId?: string;
      delegateId?: string;
      delegateName?: string;
    };
  };
}

// Shared country list moved to @/data/countries.ts

const CountryMatrix = () => {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<CountryAvailability[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(COMMON_COUNTRIES);
  const [showAddCountryDialog, setShowAddCountryDialog] = useState(false);
  const [newCountry, setNewCountry] = useState('');

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch active committees
      const { data: committeesData, error: committeesError } = await supabase
        .from('committees')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (committeesError) throw committeesError;
      setCommittees(committeesData || []);

      // Fetch approved delegates
      const { data: delegatesData, error: delegatesError } = await supabase
        .from('applications')
        .select('id, full_name, email, institution')
        .eq('status', 'approved');

      if (delegatesError) throw delegatesError;
      setDelegates(delegatesData || []);

      // 3. Fetch custom managed countries from database
      const { data: managedData, error: managedError } = await (supabase
        .from('matrix_countries') as any)
        .select('country_name');
        
      if (managedError) {
        console.error('Error fetching managed countries:', managedError);
        // We don't throw yet to allow assigned countries to still load
      }

      const managedCountriesList = managedData?.map((m: any) => m.country_name) || [];

      // 4. Fetch assignments to see which countries are already assigned
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('country_assignments')
        .select('*');

      if (committeesError) throw committeesError;
      if (delegatesError) throw delegatesError;
      if (assignmentsError) throw assignmentsError;

      // Combine all sources: COMMON_COUNTRIES + managed + assigned
      const assignedCountriesList = assignmentsData?.map((a: any) => a.country || a.country_name).filter(Boolean) || [];
      const allCountries = Array.from(new Set([
        ...COMMON_COUNTRIES,
        ...managedCountriesList,
        ...assignedCountriesList
      ])).sort();

      setSelectedCountries(allCountries);

      // Build the matrix
      buildMatrix(committeesData || [], delegatesData || [], assignmentsData || [], allCountries);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildMatrix = (
    committeesData: Committee[],
    delegatesData: Delegate[],
    assignmentsData: any[],
    countries: string[] = selectedCountries
  ) => {
    const matrixData: CountryAvailability[] = countries.map(country => {
      const countryCommittees: CountryAvailability['committees'] = {};

      committeesData.forEach(committee => {
        const assignment = assignmentsData.find(
          a => (a.country === country || a.country_name === country) && a.committee_id === committee.id
        );

        const delegate = assignment
          ? delegatesData.find(d => d.id === assignment.application_id)
          : undefined;

        countryCommittees[committee.id] = {
          available: true, // All countries available by default
          assigned: !!assignment,
          assignedTo: assignment ? assignment.application_id : undefined,
          assignmentId: assignment?.id,
          delegateId: assignment?.application_id,
          delegateName: delegate?.full_name,
        };
      });

      return {
        country,
        committees: countryCommittees,
      };
    });

    setMatrix(matrixData);
  };

  const assignCountry = async (country: string, committeeId: string, delegateId: string) => {
    try {
      const delegate = delegates.find(d => d.id === delegateId);
      if (!delegate) {
        toast({
          title: "Error",
          description: "Delegate not found",
          variant: "destructive",
        });
        return;
      }

      // Check if this delegate already has an assignment for this committee
      const existingAssignment = matrix.find(m =>
        Object.entries(m.committees).some(([cId, c]) =>
          cId === committeeId && c.delegateId === delegateId
        )
      );

      if (existingAssignment) {
        toast({
          title: "Warning",
          description: `${delegate.full_name} is already assigned to ${existingAssignment.country} in this committee. Please remove that assignment first.`,
          variant: "destructive",
        });
        return;
      }

      // Delete any existing assignment for this country+committee slot first (fail-safe)
      // We do separate calls to avoid failing if one column is missing
      try {
        await (supabase.from('country_assignments') as any)
          .delete()
          .eq('country', country)
          .eq('committee_id', committeeId);
      } catch (e) {}

      try {
        await (supabase.from('country_assignments') as any)
          .delete()
          .eq('country_name', country)
          .eq('committee_id', committeeId);
      } catch (e) {}

      // Now insert the new assignment and get the data back
      // Providing all potential column names to ensure compatibility with different schema versions
      const insertData: any = {
        application_id: delegateId,
        committee_id: committeeId,
        country: country,
        country_name: country,
        country_code: getCountryCode(country).toUpperCase()
      };

      const { data, error } = await (supabase
        .from('country_assignments') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // IMPORTANT: Also update the application's assigned_committee_id
      const { error: updateError } = await (supabase.from('applications') as any)
        .update({ assigned_committee_id: committeeId })
        .eq('id', delegateId);

      if (updateError) {
        console.error('Error updating application committee:', updateError);
        // Don't throw - assignment was created, just log the error
      }

      // Update local state with the actual data from the database
      setMatrix(prev => prev.map(item => {
        if (item.country === country) {
          return {
            ...item,
            committees: {
              ...item.committees,
              [committeeId]: {
                ...item.committees[committeeId],
                assigned: true,
                assignedTo: delegateId,
                assignmentId: data.id, // Use real ID from DB
                delegateId: delegateId,
                delegateName: delegate.full_name,
              }
            }
          };
        }
        return item;
      }));

      toast({
        title: "Success",
        description: `Assigned ${country} to ${delegate.full_name} in ${committees.find(c => c.id === committeeId)?.abbreviation}`,
      });
    } catch (error: any) {
      console.error('Error assigning country:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign country",
        variant: "destructive",
      });
    }
  };

  const unassignCountry = async (country: string, committeeId: string) => {
    try {
      const assignment = matrix.find(m => m.country === country)?.committees[committeeId];
      if (!assignment?.assignmentId) return;

      // Since assignmentId might be a temporary mock ID from assignCountry(),
      // we must delete by country and committee_id instead of just id.
      // Use separate calls for fail-safety if columns are missing.
      try {
        await supabase
          .from('country_assignments')
          .delete()
          .eq('committee_id', committeeId)
          .eq('country', country);
      } catch (e) {}

      try {
        await supabase
          .from('country_assignments')
          .delete()
          .eq('committee_id', committeeId)
          .eq('country_name', country);
      } catch (e) {}

      // Also remove assigned_committee_id from the application
      // We don't throw on error because RLS might block this specific update
      // but the country_assignment deletion was successful
      if (assignment.delegateId) {
        await (supabase.from('applications') as any)
          .update({ assigned_committee_id: null })
          .eq('id', assignment.delegateId);
      }

      // Update local state
      setMatrix(prev => prev.map(item => {
        if (item.country === country) {
          return {
            ...item,
            committees: {
              ...item.committees,
              [committeeId]: {
                ...item.committees[committeeId],
                assigned: false,
                assignedTo: undefined,
                assignmentId: undefined,
                delegateId: undefined,
                delegateName: undefined,
              }
            }
          };
        }
        return item;
      }));

      toast({
        title: "Success",
        description: `Unassigned ${country}`,
      });
    } catch (error: any) {
      console.error('Error unassigning country:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unassign country",
        variant: "destructive",
      });
    }
  };

  const deleteCountry = async (countryName: string) => {
    // Check if there are active assignments
    const hasAssignments = matrix.find(m => m.country === countryName && Object.values(m.committees).some(c => c.assigned));

    if (hasAssignments) {
      toast({
        title: "Cannot delete country",
        description: "This country has active assignments. Please unassign delegates first.",
        variant: "destructive",
      });
      return;
    }
    const countryToDelete = countryName;
    
    // 1. Update database
    if (!COMMON_COUNTRIES.includes(countryToDelete)) {
      const { error } = await (supabase
        .from('matrix_countries') as any)
        .delete()
        .eq('country_name', countryToDelete);
      
      if (error) {
        console.error('Error removing country from database:', error);
        toast({
          title: "Delete Failed",
          description: "Could not remove country from database.",
          variant: "destructive"
        });
        return;
      }
    }

    const updatedCountries = selectedCountries.filter(c => c !== countryToDelete);
    setSelectedCountries(updatedCountries);

    // Rebuild matrix with updated countries list
    // We can just filter the current matrix to avoid a full rebuild/refetch
    setMatrix(prev => prev.filter(m => m.country !== countryToDelete));

    toast({
      title: "Success",
      description: `Removed ${countryToDelete} from the matrix`,
    });
  };

  const addCustomCountry = async () => {
    if (!newCountry.trim()) return;

    if (selectedCountries.includes(newCountry.trim())) {
      toast({
        title: "Error",
        description: "Country already exists in the matrix",
        variant: "destructive",
      });
      return;
    }

    const countryToAdd = newCountry.trim();

    // 1. Store in database
    if (!COMMON_COUNTRIES.includes(countryToAdd)) {
      const { error } = await (supabase
        .from('matrix_countries') as any)
        .insert({ country_name: countryToAdd });
      
      if (error && error.code !== '23505') {
        console.error('Could not save to matrix_countries table:', error);
        toast({
          title: "Database Error",
          description: "Failed to save country to database. Please ensure you have run the migration.",
          variant: "destructive"
        });
        return;
      }
    }

    const updatedCountries = Array.from(new Set([...selectedCountries, countryToAdd])).sort();
    setSelectedCountries(updatedCountries);

    // Add to matrix
    const newCountryData: CountryAvailability = {
      country: countryToAdd,
      committees: {}
    };

    committees.forEach(committee => {
      newCountryData.committees[committee.id] = {
        available: true,
        assigned: false,
      };
    });

    setMatrix(prev => [...prev, newCountryData]);
    setNewCountry('');
    setShowAddCountryDialog(false);

    toast({
      title: "Success",
      description: `Added ${newCountry.trim()} to the matrix`,
    });
  };

  const filteredMatrix = matrix.filter(item => {
    const matchesSearch = item.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAssigned === 'all' ||
      (filterAssigned === 'assigned' && Object.values(item.committees).some(c => c.assigned)) ||
      (filterAssigned === 'available' && Object.values(item.committees).some(c => c.available && !c.assigned));
    return matchesSearch && matchesFilter;
  });

  const getStats = () => {
    const totalSlots = matrix.length * committees.length;
    const availableSlots = matrix.reduce((acc, country) =>
      acc + Object.values(country.committees).filter(c => c.available).length, 0
    );
    const assignedSlots = matrix.reduce((acc, country) =>
      acc + Object.values(country.committees).filter(c => c.assigned).length, 0
    );

    return { totalSlots, availableSlots, assignedSlots };
  };

  const stats = getStats();

  const exportToCSV = () => {
    let csv = 'Country,' + committees.map(c => c.abbreviation).join(',') + '\n';

    matrix.forEach(country => {
      csv += country.country;
      committees.forEach(committee => {
        const assignment = country.committees[committee.id];
        if (assignment?.assigned && assignment.delegateName) {
          csv += ',' + assignment.delegateName;
        } else {
          csv += ',';
        }
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `country-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Success",
      description: "Matrix exported to CSV",
    });
  };

  return (
    <AdminLayout title="Country Matrix Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Country Matrix</h2>
            <p className="text-gray-600">Assign countries to delegates across committees</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddCountryDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Add Country
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Slots</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSlots}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-semibold text-green-600">{stats.availableSlots}</p>
              </div>
              <Check className="h-5 w-5 text-green-500" strokeWidth={2} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.assignedSlots}</p>
              </div>
              <Lock className="h-8 w-8 text-purple-500" />
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
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterAssigned}
                  onChange={(e) => setFilterAssigned(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Countries</option>
                  <option value="assigned">Has Assignments</option>
                  <option value="available">Has Available Slots</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Add Country Dialog */}
        {showAddCountryDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Country</h3>
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomCountry()}
                placeholder="Enter country name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddCountryDialog(false);
                    setNewCountry('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomCountry}
                  disabled={!newCountry.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Country
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Matrix Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Country
                  </th>
                  {committees.map(committee => (
                    <th key={committee.id} className="px-4 py-3 text-center text-xs font-medium text-gray-700 tracking-wider min-w-[200px] bg-gradient-to-b from-gray-50 to-gray-100">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-sm text-diplomatic-800">{committee.abbreviation}</span>
                        <span className="font-normal text-[10px] text-gray-600 normal-case">{committee.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={committees.length + 1} className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={committees.length + 1} className="px-4 py-8 text-center text-gray-500">
                      No countries found
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((country) => (
                    <tr key={country.country} className="hover:bg-gray-50">
                      <td className="px-4 py-4 sticky left-0 bg-white z-10 border-r group">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{country.country}</span>
                          </div>
                          <button
                            onClick={() => deleteCountry(country.country)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                            title="Remove country"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      {committees.map(committee => {
                        const slot = country.committees[committee.id];
                        return (
                          <td key={committee.id} className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-2">
                              {slot?.assigned ? (
                                <div className="w-full">
                                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                                    <Lock className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm text-purple-900 font-medium truncate max-w-[150px]">
                                      {slot.delegateName}
                                    </span>
                                    <button
                                      onClick={() => unassignCountry(country.country, committee.id)}
                                      className="ml-1 text-red-600 hover:text-red-700"
                                      title="Unassign"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full">
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        assignCountry(country.country, committee.id, e.target.value);
                                        e.target.value = ''; // Reset selection
                                      }
                                    }}
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Assign delegate...</option>
                                    {delegates.map(delegate => (
                                      <option key={delegate.id} value={delegate.id}>
                                        {delegate.full_name}{delegate.institution ? ` (${delegate.institution})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Assigned</p>
                <p className="text-sm text-gray-600">Shows the delegate assigned to this country. Click the trash icon to unassign.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Available</p>
                <p className="text-sm text-gray-600">Select a delegate from the dropdown to assign them to this country.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only approved delegates appear in the assignment dropdowns</li>
                <li>Each delegate can only be assigned to one country per committee</li>
                <li>All changes are saved immediately to the database</li>
                <li>Use "Export CSV" to download the current matrix for records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CountryMatrix;


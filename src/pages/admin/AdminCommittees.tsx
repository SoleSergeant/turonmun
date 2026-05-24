
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { PlusCircle } from 'lucide-react';
import CommitteeList from '@/components/admin/committees/CommitteeList';
import CommitteeForm from '@/components/admin/committees/CommitteeForm';
import { initialFormState, CommitteeFormData } from '@/components/admin/committees/types';
import { useCommitteeData } from '@/components/admin/committees/hooks/useCommitteeData';

const AdminCommittees = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CommitteeFormData>(initialFormState);
  
  const { 
    committees, 
    loading, 
    authLoading, 
    isAuthenticated, 
    setIsAuthenticated, 
    fetchCommittees 
  } = useCommitteeData();

  const handleEdit = (committee: any) => {
    // Extract abbreviation from committee name if present
    const nameMatch = committee.name.match(/\(([^)]+)\)/);
    const abbreviation = nameMatch ? nameMatch[1] : '';
    
    setFormData({
      id: committee.id,
      name: committee.name.replace(/\s\([^)]+\)$/, ''), // Remove abbreviation from name
      abbreviation,
      description: committee.description,
      topics: committee.topics.length > 0 ? committee.topics : [''],
      image_url: committee.image_url || '',
      chair: committee.chair || '',
      co_chair: committee.co_chair || '',
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  // Display authentication loading state
  if (authLoading) {
    return (
      <AdminLayout title="Committees Management">
        <div className="flex items-center justify-center h-64">
          <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Authenticating...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Committees Management">
      {!isAuthenticated && (
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6 rounded-lg">
          <p className="text-amber-800">
            Warning: You are not authenticated as an admin. Some actions may be restricted.
          </p>
        </div>
      )}
      
      {isEditing ? (
        <CommitteeForm 
          formData={formData}
          setFormData={setFormData}
          onCancel={resetForm}
          fetchCommittees={fetchCommittees}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Committee List</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="btn bg-diplomatic-700 text-white py-2 px-4 rounded-md hover:bg-diplomatic-800 flex items-center"
            >
              <PlusCircle size={18} className="mr-2" /> Add Committee
            </button>
          </div>
          
          <CommitteeList 
            committees={committees}
            onEdit={handleEdit}
            loading={loading}
            fetchCommittees={fetchCommittees}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default AdminCommittees;


import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { PlusCircle } from 'lucide-react';
import ResourceForm from '@/components/admin/resources/ResourceForm';
import ResourceList from '@/components/admin/resources/ResourceList';
import { useResourcesManager } from '@/components/admin/resources/useResourcesManager';
import { CustomButton } from '@/components/ui/custom-button';

const AdminResources = () => {
  const {
    resources,
    loading,
    isEditing,
    formData,
    setFormData,
    setIsEditing,
    handleEdit,
    handleDelete,
    fetchResources,
    resetForm
  } = useResourcesManager();

  return (
    <AdminLayout title="Resources Management">
      {loading && !isEditing ? (
        <div className="flex items-center justify-center h-64">
          <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isEditing ? (
        <ResourceForm
          formData={formData}
          setFormData={setFormData}
          resetForm={resetForm}
          fetchResources={fetchResources}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Resource List</h2>
            <CustomButton
              onClick={() => setIsEditing(true)}
              className="flex items-center"
              variant="primary"
            >
              <PlusCircle size={18} className="mr-2" /> Add Resource
            </CustomButton>
          </div>
          
          <ResourceList
            resources={resources}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            setIsEditing={setIsEditing}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default AdminResources;

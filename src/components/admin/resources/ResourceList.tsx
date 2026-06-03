
import React from 'react';
import { Edit, Trash2, Link, ExternalLink } from 'lucide-react';
import { Resource } from './types';
import { getCategoryIcon } from './resourcesConfig';
import { CustomButton } from '@/components/ui/custom-button';

interface ResourceListProps {
  resources: Resource[];
  handleEdit: (resource: Resource) => void;
  handleDelete: (id: string) => void;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  handleEdit,
  handleDelete,
  setIsEditing,
}) => {
  if (resources.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <p className="text-gray-500 mb-4">No resources found</p>
        <button
          onClick={() => setIsEditing(true)}
          className="text-diplomatic-600 hover:text-diplomatic-800 font-medium"
        >
          Create your first resource
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {resources.map((resource) => {
            const IconComponent = getCategoryIcon(resource.category);
            
            return (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <IconComponent size={18} className="text-diplomatic-700" />
                    </div>
                    <span>{resource.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 line-clamp-2">{resource.description}</div>
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={resource.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-diplomatic-600 hover:text-diplomatic-800 flex items-center"
                  >
                    <Link size={16} className="mr-1" />
                    <span className="text-sm">View</span>
                    <ExternalLink size={12} className="ml-1" />
                  </a>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(resource)}
                    className="text-diplomatic-600 hover:text-diplomatic-900 mr-3"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceList;

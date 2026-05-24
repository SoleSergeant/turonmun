
import React from 'react';
import { Edit, Trash2, Globe, FileBarChart, Landmark, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Committee } from './types';

interface CommitteeListProps {
  committees: Committee[];
  onEdit: (committee: Committee) => void;
  loading: boolean;
  fetchCommittees: () => Promise<void>;
}

const CommitteeList = ({ committees, onEdit, loading, fetchCommittees }: CommitteeListProps) => {
  const { toast } = useToast();

  // Icons for committees
  const committeeIcons: Record<string, any> = {
    'UNGA': Globe,
    'WTO': FileBarChart,
    'ECOSOC': Landmark,
    'HRC': Shield,
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this committee? It will be hidden from all lists.')) return;

    try {
      // Soft-delete: set is_active = false.
      // Hard-deleting is blocked by a FK constraint on admin_users.committee_id
      // which can't be cleared from the client due to RLS policies.
      const { error } = await supabase
        .from('committees')
        .update({ is_active: false } as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Committee deactivated",
        description: "The committee has been hidden. You can reactivate it from the database if needed.",
      });

      fetchCommittees();
    } catch (error: any) {
      console.error('Error deleting committee:', error);
      toast({
        title: "Could not deactivate committee",
        description: error?.message || "Failed to deactivate committee.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (committees.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <p className="text-gray-500 mb-4">No committees found</p>
        <button
          onClick={() => onEdit({ id: '', name: '', description: '', topics: [], created_at: '' })}
          className="text-diplomatic-600 hover:text-diplomatic-800 font-medium"
        >
          Create your first committee
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chairs</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topics</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {committees.map((committee) => {
            // Extract abbreviation if present
            const nameMatch = committee.name.match(/\(([^)]+)\)/);
            const abbreviation = nameMatch ? nameMatch[1] : '';
            const displayName = committee.name.replace(/\s\([^)]+\)$/, '');
            const IconComponent = abbreviation && committeeIcons[abbreviation]
              ? committeeIcons[abbreviation]
              : Globe;

            return (
              <tr key={committee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-diplomatic-100 flex items-center justify-center">
                      <IconComponent size={18} className="text-diplomatic-700" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{displayName}</div>
                      {abbreviation && (
                        <div className="text-sm text-gray-500">{abbreviation}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">{committee.description}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {committee.chair && (
                      <div className="mb-1">
                        <span className="font-medium">Chair:</span> {committee.chair}
                      </div>
                    )}
                    {committee.co_chair && (
                      <div>
                        <span className="font-medium">Co-Chair:</span> {committee.co_chair}
                      </div>
                    )}
                    {!committee.chair && !committee.co_chair && (
                      <span className="text-gray-400 italic">No chairs assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {committee.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => onEdit(committee)}
                    className="text-diplomatic-600 hover:text-diplomatic-900 mr-3"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(committee.id)}
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

export default CommitteeList;

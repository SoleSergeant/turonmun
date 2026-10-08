
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Resource } from './types';
import { useToast } from '@/hooks/use-toast';
import { confirmAction } from '@/components/admin/ConfirmDialog';

export const initialFormState = {
  id: '',
  category: '',
  title: '',
  description: '',
  link: '',
};

export const useResourcesManager = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('resources')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const mappedResources = (data || []).map((r: any) => ({
        ...r,
        link: r.file_url || r.link || ''
      }));

      setResources(mappedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Could not load resources",
        description: (error as any)?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData(resource);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmAction('Are you sure you want to delete this resource?', { title: 'Delete resource', danger: true }))) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setResources(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Resource deleted",
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Could not delete resource",
        description: (error as any)?.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  return {
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
  };
};

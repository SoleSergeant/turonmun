
import React, { useState, useEffect } from 'react';
import { Trash2, Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomButton } from '@/components/ui/custom-button';
import { categories } from './resourcesConfig';

export interface ResourceFormData {
  id: string;
  category: string;
  title: string;
  description: string;
  link: string;
  committee_id?: string | null;
}

interface ResourceFormProps {
  formData: ResourceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ResourceFormData>>;
  resetForm: () => void;
  fetchResources: () => Promise<void>;
}

const ResourceForm: React.FC<ResourceFormProps> = ({
  formData,
  setFormData,
  resetForm,
  fetchResources,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [committees, setCommittees] = useState<{ id: string, name: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCommittees = async () => {
      const { data } = await supabase.from('committees').select('id, name');
      setCommittees(data || []);
    };
    fetchCommittees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill out required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let finalLink = formData.link;

      if (file) {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `resources/${fileName}`;

        const { error: uploadError } = await (supabase.storage as any)
          .from('resources')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = (supabase.storage as any)
          .from('resources')
          .getPublicUrl(filePath);

        finalLink = publicUrl;
      }

      if (!finalLink && !file) {
        toast({
          title: "Validation Error",
          description: "Please provide a link or upload a file",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const resourceData = {
        category: formData.category,
        title: formData.title,
        description: formData.description,
        file_url: finalLink,
        file_type: file ? file.type : (finalLink.endsWith('.pdf') ? 'application/pdf' : 'link'),
        committee_id: formData.committee_id || null,
        is_public: true
      };

      if (formData.id) {
        // Update
        const { error } = await (supabase as any)
          .from('resources')
          .update(resourceData)
          .eq('id', formData.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Resource updated successfully",
        });
      } else {
        // Create
        const { error } = await (supabase as any)
          .from('resources')
          .insert(resourceData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Resource created successfully",
        });
      }

      resetForm();
      setFile(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save resource",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {formData.id ? 'Edit Resource' : 'Create Resource'}
        </h2>
        <button
          onClick={resetForm}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Category</Label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Committee (Optional)</Label>
            <select
              name="committee_id"
              value={formData.committee_id || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
            >
              <option value="">All Committees (Global)</option>
              {committees.map((comm) => (
                <option key={comm.id} value={comm.id}>
                  {comm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Title</Label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full"
            placeholder="e.g., ECOSOC Background Guide"
            required
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Description</Label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
            placeholder="Provide a brief overview of this resource"
            required
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Resource Source</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Option 1: Upload File</p>
                <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-diplomatic-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">
                      {file ? file.name : 'Click to upload file'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">PDF, DOCX, PPTX up to 10MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Option 2: External Link</p>
                <Input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full h-full min-h-[5.5rem]"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <CustomButton
            variant="outline"
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="primary"
            type="submit"
            disabled={isSubmitting || uploading}
            className="min-w-[120px]"
          >
            {isSubmitting ? (uploading ? 'Uploading...' : 'Saving...') : formData.id ? 'Update Resource' : 'Create Resource'}
          </CustomButton>
        </div>
      </form>
    </div>
  );
};

export default ResourceForm;

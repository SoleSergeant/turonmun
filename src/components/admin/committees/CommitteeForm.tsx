import React, { useState } from 'react';
import { PlusCircle, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CommitteeFormData } from './types';
import ImageUpload from './ImageUpload';

interface CommitteeFormProps {
  formData: CommitteeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CommitteeFormData>>;
  onCancel: () => void;
  fetchCommittees: () => Promise<void>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const CommitteeForm = ({ 
  formData, 
  setFormData, 
  onCancel, 
  fetchCommittees,
  isAuthenticated,
  setIsAuthenticated
}: CommitteeFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTopicChange = (index: number, value: string) => {
    setFormData(prev => {
      const newTopics = [...prev.topics];
      newTopics[index] = value;
      return { ...prev, topics: newTopics };
    });
  };

  const addTopic = () => {
    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, '']
    }));
  };

  const removeTopic = (index: number) => {
    if (formData.topics.length <= 1) return;
    setFormData(prev => {
      const newTopics = [...prev.topics];
      newTopics.splice(index, 1);
      return { ...prev, topics: newTopics };
    });
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.topics.some(t => t.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Relying on AdminRoute and standard session for authentication
    try {
      setIsSubmitting(true);
      
      const filteredTopics = formData.topics.filter(t => t.trim());
      
      // Format the committee name with abbreviation if provided
      const fullName = formData.abbreviation 
        ? `${formData.name} (${formData.abbreviation})` 
        : formData.name;
      
      if (formData.id) {
        // Update
        const { error } = await supabase
          .from('committees')
          .update({
            name: fullName,
            description: formData.description,
            topics: filteredTopics,
            image_url: formData.image_url || null,
            chair: formData.chair || null,
            co_chair: formData.co_chair || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Committee updated successfully",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('committees')
          .insert({
            name: fullName,
            description: formData.description,
            topics: filteredTopics,
            image_url: formData.image_url || null,
            chair: formData.chair || null,
            co_chair: formData.co_chair || null,
            is_active: true, // Make sure new committees are active by default
          });
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Committee created successfully",
        });
      }
      
      onCancel();
      fetchCommittees();
    } catch (error: any) {
      console.error('Error saving committee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save committee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {formData.id ? 'Edit Committee' : 'Create Committee'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committee Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation</label>
            <input
              type="text"
              name="abbreviation"
              value={formData.abbreviation}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="UNGA, WTO, etc."
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Topics</label>
            <button
              type="button"
              onClick={addTopic}
              className="text-sm text-diplomatic-600 hover:text-diplomatic-800 flex items-center"
            >
              <PlusCircle size={16} className="mr-1" /> Add Topic
            </button>
          </div>
          
          {formData.topics.map((topic, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md mr-2"
                placeholder={`Topic ${index + 1}`}
                required
              />
              <button
                type="button"
                onClick={() => removeTopic(index)}
                className="p-2 text-red-500 hover:text-red-700"
                disabled={formData.topics.length <= 1}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chair</label>
          <input
              type="text"
              name="chair"
              value={formData.chair}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Committee Chair Name"
          />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Co-Chair</label>
            <input
              type="text"
              name="co_chair"
              value={formData.co_chair}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Committee Co-Chair Name"
              />
            </div>
        </div>
        
        <ImageUpload
          currentImageUrl={formData.image_url}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
        />
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-diplomatic-700 text-white rounded-md hover:bg-diplomatic-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : formData.id ? 'Update Committee' : 'Create Committee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommitteeForm;

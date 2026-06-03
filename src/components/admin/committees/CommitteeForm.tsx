import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { COMMON_COUNTRIES } from '@/data/countries';
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
  const [countryOptions, setCountryOptions] = useState<string[]>(COMMON_COUNTRIES);
  const [chairCandidates, setChairCandidates] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    (supabase.from('matrix_countries') as any).select('country_name').then(({ data }: any) => {
      const custom = (data || []).map((m: any) => m.country_name).filter(Boolean);
      setCountryOptions(Array.from(new Set([...COMMON_COUNTRIES, ...custom])).sort());
    });
    // Pull names of approved chair applicants (delegate-only apps are filtered out)
    (supabase
      .from('applications') as any)
      .select('full_name, application_type, notes')
      .eq('status', 'approved')
      .then(({ data }: any) => {
        const names = (data || [])
          .filter((a: any) =>
            a.application_type === 'chair' ||
            (a.notes || '').includes('APPLICATION TYPE: chair'))
          .map((a: any) => a.full_name)
          .filter(Boolean);
        setChairCandidates(Array.from(new Set(names)).sort());
      });
  }, []);

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

  const handleCountryChange = (index: number, value: string) => {
    setFormData(prev => {
      const next = [...prev.countries];
      next[index] = value;
      return { ...prev, countries: next };
    });
  };

  const addCountry = () => {
    setFormData(prev => ({ ...prev, countries: [...prev.countries, ''] }));
  };

  const removeCountry = (index: number) => {
    setFormData(prev => {
      const next = [...prev.countries];
      next.splice(index, 1);
      return { ...prev, countries: next };
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
      const filteredCountries = formData.countries.map(c => c.trim()).filter(Boolean);
      const totalSpots = Number(formData.total_spots) > 0 ? Number(formData.total_spots) : 1;

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
            total_spots: totalSpots,
            countries: filteredCountries,
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
            total_spots: totalSpots,
            countries: filteredCountries,
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
      
      <datalist id="committee-country-options">
        {countryOptions.map((c) => <option key={c} value={c} />)}
      </datalist>
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
            <select
              name="chair"
              value={formData.chair}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">— Not assigned —</option>
              {/* Keep the current value visible even if they aren't a chair candidate
                  (e.g. typed in before this dropdown existed). */}
              {formData.chair && !chairCandidates.includes(formData.chair) && (
                <option value={formData.chair}>{formData.chair} (legacy)</option>
              )}
              {chairCandidates.map(name => (
                <option key={`ch-${name}`} value={name}>{name}</option>
              ))}
            </select>
            {chairCandidates.length === 0 && (
              <p className="text-[11px] text-gray-400 mt-1">No accepted chair applicants yet.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Co-Chair</label>
            <select
              name="co_chair"
              value={formData.co_chair}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">— Not assigned —</option>
              {formData.co_chair && !chairCandidates.includes(formData.co_chair) && (
                <option value={formData.co_chair}>{formData.co_chair} (legacy)</option>
              )}
              {chairCandidates
                .filter(n => n !== formData.chair) // can't be both chair and co-chair
                .map(name => (
                  <option key={`co-${name}`} value={name}>{name}</option>
                ))}
            </select>
          </div>
        </div>
        
        {/* Allocation setup */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">Allocation Setup</h3>
          <p className="text-xs text-gray-500 mb-4">
            Set how many delegate seats this committee has. Optionally list the exact countries —
            leave the country list empty and the allocation screen will use numbered placeholders (Slot 1, Slot 2…).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Spots</label>
              <input
                type="number"
                name="total_spots"
                min={1}
                value={formData.total_spots}
                onChange={(e) => setFormData(prev => ({ ...prev, total_spots: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. 20"
              />
              <p className="text-xs text-gray-400 mt-1">Number of delegate seats in this committee.</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Countries <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={addCountry}
                className="text-sm text-diplomatic-600 hover:text-diplomatic-800 flex items-center"
              >
                <PlusCircle size={16} className="mr-1" /> Add Country
              </button>
            </div>

            {formData.countries.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                No countries set — {Number(formData.total_spots) || 0} numbered placeholder slots will be used during allocation.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.countries.map((country, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      list="committee-country-options"
                      value={country}
                      onChange={(e) => handleCountryChange(index, e.target.value)}
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-md mr-2"
                      placeholder={`Country ${index + 1} (e.g. France)`}
                    />
                    <button
                      type="button"
                      onClick={() => removeCountry(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {formData.countries.filter(c => c.trim()).length > Number(formData.total_spots) && (
                  <p className="text-xs text-amber-600">
                    You have more countries than total spots — total spots will be raised to match.
                  </p>
                )}
              </div>
            )}
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

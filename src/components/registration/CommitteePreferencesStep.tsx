import React from 'react';
import { ArrowRight, ArrowLeft, Users, Trophy, Star } from 'lucide-react';
import { useCommittees } from '@/hooks/useCommittees';

interface CommitteePreferencesStepProps {
  formData: {
    committee_preference1: string;
    committee_preference2: string;
    committee_preference3: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const CommitteePreferencesStep: React.FC<CommitteePreferencesStepProps> = ({ 
  formData, 
  handleChange, 
  nextStep, 
  prevStep 
}) => {
  const { committees, loading } = useCommittees();

  const isFormValid = () => {
    return (
      formData.committee_preference1 !== '' && 
      formData.committee_preference1 !== 'Not Selected' &&
      formData.committee_preference2 !== '' && 
      formData.committee_preference2 !== 'Not Selected' &&
      formData.committee_preference3 !== '' && 
      formData.committee_preference3 !== 'Not Selected'
    );
  };

  // Get available options for each preference (excluding already selected ones)
  const getAvailableCommittees = (currentPreference: string, excludePreferences: string[]) => {
    return committees.filter(committee => 
      committee.name === currentPreference || 
      !excludePreferences.includes(committee.name)
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-diplomatic-600"></div>
          <span className="ml-3 text-diplomatic-600">Loading committees...</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">Committee Preferences</h2>
      <p className="text-neutral-600 mb-6">
        Select your preferred committees in order of preference. We'll do our best to assign you to your top choice.
      </p>
      
      <div className="space-y-6">
        {/* First Choice */}
        <div className="form-group">
          <label htmlFor="committee_preference1" className="block text-sm font-medium text-neutral-700 mb-1">
            <div className="flex items-center">
              <Star className="text-gold-500 mr-2" size={18} />
              First Choice Committee <span className="text-red-500">*</span>
            </div>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Trophy size={18} className="text-gold-500" />
            </div>
            <select
              id="committee_preference1"
              name="committee_preference1"
              value={formData.committee_preference1}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your first choice</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.name}>
                  {committee.name} ({committee.abbreviation})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Your most preferred committee</p>
        </div>

        {/* Second Choice */}
        <div className="form-group">
          <label htmlFor="committee_preference2" className="block text-sm font-medium text-neutral-700 mb-1">
            <div className="flex items-center">
              <Users className="text-diplomatic-500 mr-2" size={18} />
              Second Choice Committee <span className="text-red-500">*</span>
            </div>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users size={18} className="text-diplomatic-500" />
            </div>
            <select
              id="committee_preference2"
              name="committee_preference2"
              value={formData.committee_preference2}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your second choice</option>
              {getAvailableCommittees(formData.committee_preference2, [formData.committee_preference1]).map((committee) => (
                <option key={committee.id} value={committee.name}>
                  {committee.name} ({committee.abbreviation})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Your alternative preference</p>
        </div>

        {/* Third Choice */}
        <div className="form-group">
          <label htmlFor="committee_preference3" className="block text-sm font-medium text-neutral-700 mb-1">
            <div className="flex items-center">
              <Users className="text-neutral-500 mr-2" size={18} />
              Third Choice Committee <span className="text-red-500">*</span>
            </div>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users size={18} className="text-neutral-500" />
            </div>
            <select
              id="committee_preference3"
              name="committee_preference3"
              value={formData.committee_preference3}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your third choice</option>
              {getAvailableCommittees(formData.committee_preference3, [formData.committee_preference1, formData.committee_preference2]).map((committee) => (
                <option key={committee.id} value={committee.name}>
                  {committee.name} ({committee.abbreviation})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Your backup option</p>
        </div>

        {/* Committee Information */}
        <div className="bg-diplomatic-50 border border-diplomatic-200 rounded-lg p-4">
          <h4 className="font-semibold text-diplomatic-800 mb-2">💡 Committee Selection Tips</h4>
          <ul className="text-sm text-diplomatic-700 space-y-1">
            <li>• Choose committees that align with your interests and expertise</li>
            <li>• Consider the topics and complexity level of each committee</li>
            <li>• Your preferences help us create balanced and engaging committees</li>
            <li>• Final assignments depend on availability and application quality</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={!isFormValid()}
          className={`btn-primary flex items-center gap-2 ${
            !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-diplomatic-700'
          }`}
        >
          Next Step <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CommitteePreferencesStep; 
import React from 'react';
import { ArrowRight, ArrowLeft, Users, Award, Globe, Check } from 'lucide-react';
import { useCommittees } from '@/hooks/useCommittees';
import { CustomButton } from '../ui/custom-button';

interface CommitteeSelectionStepProps {
  formData: {
    committee_preference1: string;
    committee_preference2: string;
    committee_preference3: string;
    motivation: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const CommitteeSelectionStep: React.FC<CommitteeSelectionStepProps> = ({
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
      formData.committee_preference3 !== 'Not Selected' &&
      formData.committee_preference1 !== formData.committee_preference2 &&
      formData.committee_preference1 !== formData.committee_preference3 &&
      formData.committee_preference2 !== formData.committee_preference3 &&
      formData.motivation.trim() !== ''
    );
  };

  const getSelectedCommittees = () => {
    return [formData.committee_preference1, formData.committee_preference2, formData.committee_preference3];
  };

  const getAvailableCommittees = (excludeChoices: string[] = []) => {
    return committees.filter(committee => !excludeChoices.includes(committee.name));
  };

  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getWordCountColor = (text: string, limit: number = 150) => {
    const count = wordCount(text);
    if (count === 0) return 'text-gray-400';
    if (count <= limit) return 'text-green-600';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-diplomatic-600"></div>
          <span className="ml-3 text-neutral-600">Loading committees...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">Page 3 — Committee Preferences</h2>
      <p className="text-neutral-600 mb-6">Select your preferred committees in order of preference. Choose wisely as these selections will influence your committee assignment.</p>

      <div className="space-y-8">
        {/* Committee Information */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-diplomatic-800 flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            Available Committees
          </h3>
          <div className="grid gap-3">
            {committees.map((committee) => (
              <div key={committee.id} className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-diplomatic-800">
                      {committee.name} ({committee.abbreviation})
                    </h4>
                    <p className="text-sm text-neutral-600 mt-1">{committee.description}</p>
                    {committee.topics && committee.topics.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-neutral-700">Topics:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {committee.topics.map((topic, index) => (
                            <span key={index} className="text-xs bg-diplomatic-100 text-diplomatic-700 px-2 py-1 rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Committee Preferences */}
        <div className="space-y-6">
          {/* First Choice */}
          <div className="form-group">
            <label htmlFor="committee_preference1" className="block text-sm font-medium text-neutral-700 mb-1">
              <span className="flex items-center gap-2">
                <Award size={16} className="text-yellow-500" />
                First Choice Committee <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              id="committee_preference1"
              name="committee_preference1"
              value={formData.committee_preference1}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your first choice...</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.name}>
                  {committee.name} ({committee.abbreviation})
                </option>
              ))}
            </select>
            {formData.committee_preference1 && formData.committee_preference1 !== 'Not Selected' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <Check size={16} strokeWidth={2} />
                First choice selected
              </div>
            )}
          </div>

          {/* Second Choice */}
          <div className="form-group">
            <label htmlFor="committee_preference2" className="block text-sm font-medium text-neutral-700 mb-1">
              <span className="flex items-center gap-2">
                <Award size={16} className="text-gray-400" />
                Second Choice Committee <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              id="committee_preference2"
              name="committee_preference2"
              value={formData.committee_preference2}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your second choice...</option>
              {getAvailableCommittees([formData.committee_preference1]).map((committee) => (
                <option key={committee.id} value={committee.name}>
                  {committee.name} ({committee.abbreviation})
                </option>
              ))}
            </select>
            {formData.committee_preference2 && formData.committee_preference2 !== 'Not Selected' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <Check size={16} strokeWidth={2} />
                Second choice selected
              </div>
            )}
          </div>

          {/* Third Choice */}
          <div className="form-group">
            <label htmlFor="committee_preference3" className="block text-sm font-medium text-neutral-700 mb-1">
              <span className="flex items-center gap-2">
                <Award size={16} className="text-bronze-500" />
                Third Choice Committee <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              id="committee_preference3"
              name="committee_preference3"
              value={formData.committee_preference3}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your third choice...</option>
              {getAvailableCommittees([formData.committee_preference1, formData.committee_preference2]).map((committee) => (
                <option key={committee.id} value={committee.name}>
                  {committee.name} ({committee.abbreviation})
                </option>
              ))}
            </select>
            {formData.committee_preference3 && formData.committee_preference3 !== 'Not Selected' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <Check size={16} strokeWidth={2} />
                Third choice selected
              </div>
            )}
          </div>
        </div>

        {/* Motivation */}
        <div className="form-group">
          <label htmlFor="motivation" className="block text-sm font-medium text-neutral-700 mb-1">
            Why are you interested in these committees? <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
              <Users size={18} className="text-neutral-400" />
            </div>
            <textarea
              id="motivation"
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              rows={4}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all resize-none"
              placeholder="Explain your interest in your selected committees and what you hope to contribute to the discussions..."
              required
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-neutral-500">Explain your interest and what you hope to contribute</p>
            <span className={`text-xs font-medium ${getWordCountColor(formData.motivation, 150)}`}>
              {wordCount(formData.motivation)}/150 words
            </span>
          </div>
        </div>

        {/* Selection Summary */}
        {(formData.committee_preference1 || formData.committee_preference2 || formData.committee_preference3) && (
          <div className="bg-diplomatic-50 rounded-lg p-4 border border-diplomatic-200">
            <h3 className="text-lg font-semibold mb-3 text-diplomatic-800">Your Committee Preferences</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                <span className="text-sm font-medium">
                  {formData.committee_preference1 || 'Not selected'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-400 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                <span className="text-sm font-medium">
                  {formData.committee_preference2 || 'Not selected'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-amber-600 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
                <span className="text-sm font-medium">
                  {formData.committee_preference3 || 'Not selected'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Important Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">📝 Important Notes:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Committee assignments are based on preferences, qualifications, and availability</li>
            <li>• You must select three different committees</li>
            <li>• Final assignments will be communicated after the application review process</li>
            <li>• Your motivation statement helps us understand your interests and make better assignments</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <CustomButton
          variant="outline"
          onClick={prevStep}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </CustomButton>

        <CustomButton
          variant="primary"
          onClick={nextStep}
          disabled={!isFormValid()}
        >
          Next Step
          <ArrowRight size={16} className="ml-2" />
        </CustomButton>
      </div>
    </div>
  );
};

export default CommitteeSelectionStep;
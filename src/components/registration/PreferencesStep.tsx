import React from 'react';
import { ArrowRight, ArrowLeft, Trophy, Link, Award } from 'lucide-react';

interface PreferencesStepProps {
  formData: {
    experience: string;
    previousMUNs: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({ formData, handleChange, nextStep, prevStep }) => {
  const isFormValid = () => {
    return formData.experience.trim() !== '';
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">Page 2 — Experience & Background</h2>
      <p className="text-neutral-600 mb-6">Tell us about your MUN experience and background</p>

      <div className="space-y-6">
        {/* MUN Experience Level */}
        <div className="form-group">
          <label htmlFor="experience" className="block text-sm font-medium text-neutral-700 mb-1">
            MUN Experience Level <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Award size={18} className="text-neutral-400" />
            </div>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            >
              <option value="">Select your experience level</option>
              <option value="none">None</option>
              <option value="1-2">1-2</option>
              <option value="3-5">3-5</option>
              <option value="6+">6+</option>
            </select>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Used to gauge experience and balance delegation</p>
        </div>

        {/* List previous MUNs and awards */}
        <div className="form-group">
          <label htmlFor="previousMUNs" className="block text-sm font-medium text-neutral-700 mb-1">
            List previous MUNs and awards (if any) <span className="text-neutral-500">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
              <Trophy size={18} className="text-neutral-400" />
            </div>
            <textarea
              id="previousMUNs"
              name="previousMUNs"
              value={formData.previousMUNs}
              onChange={handleChange}
              rows={4}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all resize-none"
              placeholder="Names of conferences, awards, roles — helps evaluate track record and dedication"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Names of conferences, awards, roles — helps evaluate track record and dedication</p>
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
          className={`btn-primary flex items-center gap-2 ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-diplomatic-700'
            }`}
        >
          Next Step <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PreferencesStep;

import React from 'react';
import { ArrowRight, ArrowLeft, Lightbulb, Users2 } from 'lucide-react';

interface EssayStepProps {
  formData: {
    issueInterest: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const EssayStep: React.FC<EssayStepProps> = ({
  formData,
  handleChange,
  nextStep,
  prevStep
}) => {
  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const isFormValid = () => {
    return (
      formData.issueInterest.trim() !== ''
    );
  };

  const getWordCountColor = (text: string, limit: number = 115) => {
    const count = wordCount(text);
    if (count === 0) return 'text-gray-400';
    if (count <= limit) return 'text-green-600';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">Page 4 — Essay Section</h2>
      <p className="text-red-600 mb-6">Kindly ensure all responses are original; any use of AI will be detected and may adversely affect your performance evaluation.</p>

      <div className="space-y-8">


        {/* A topic or issue you're passionate about */}
        <div className="form-group">
          <label htmlFor="issueInterest" className="block text-sm font-medium text-neutral-700 mb-1">
            A topic or issue you're passionate or knowledgeable about <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
              <Lightbulb size={18} className="text-neutral-400" />
            </div>
            <textarea
              id="issueInterest"
              name="issueInterest"
              value={formData.issueInterest}
              onChange={handleChange}
              rows={4}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all resize-none"
              placeholder="Pick an issue or theme you'd dive into for hours. Tell us why it grips you — even briefly."
              required
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-neutral-500">Pick an issue or theme you'd dive into for hours. Tell us why it grips you — even briefly.</p>
            <span className={`text-xs font-medium ${getWordCountColor(formData.issueInterest)}`}>
              {wordCount(formData.issueInterest)}/115 words
            </span>
          </div>
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

export default EssayStep;
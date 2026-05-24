import React from 'react';
import { Check } from 'lucide-react';

interface RegistrationStepsProps {
  currentStep: number;
}

const RegistrationSteps: React.FC<RegistrationStepsProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Personal Info" },
    { number: 2, label: "Experience" },
    { number: 3, label: "Committees" },
    { number: 4, label: "Essays" },
    { number: 5, label: "Details" },
    { number: 6, label: "Confirmation" },
  ];

  return (
    <div className="max-w-4xl mx-auto mb-10">
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-diplomatic-600">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-neutral-900">
            {steps[currentStep - 1].label}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-diplomatic-600 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${currentStep === step.number
                  ? 'bg-diplomatic-600 text-white shadow-lg scale-110'
                  : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-400'
                  }`}
              >
                {currentStep > step.number ? <Check size={12} strokeWidth={2} /> : step.number}
              </div>
              <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${currentStep === step.number ? 'text-diplomatic-700' : 'text-neutral-500'
                }`}>
                {step.label}
              </span>
            </div>
          ))}

          {/* Connecting Line (Behind circles) */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-neutral-200 -z-0 hidden md:block" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-diplomatic-600 -z-0 transition-all duration-500 hidden md:block"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RegistrationSteps;

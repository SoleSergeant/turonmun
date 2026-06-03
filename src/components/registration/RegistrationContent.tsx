import React from 'react';
import { motion } from 'framer-motion';
import RegistrationSteps from './RegistrationSteps';
import DynamicFormStep from './DynamicFormStep';
import PersonalInfoStep from './PersonalInfoStep';
import PreferencesStep from './PreferencesStep';
import CommitteePreferencesStep from './CommitteePreferencesStep';
import EssayStep from './EssayStep';
import AdditionalInfoStep from './AdditionalInfoStep';
import ConfirmationStep from './ConfirmationStep';
import type { FormQuestion } from '@/hooks/useFormSettings';

interface RegistrationContentProps {
  step: number;
  formData: any;
  isSubmitting: boolean;
  calculateFee: () => { originalFee: number; discount: number; finalFee: number };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  nextStep: () => void;
  prevStep: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  photoFile?: File | null;
  updatePhotoFile?: (file: File | null) => void;
  stepLabels?: string[];
  formQuestions?: FormQuestion[];  // if provided, use dynamic rendering
}

const STEP_SUBTITLES: Record<number, string> = {
  1: 'Please provide your basic information for registration',
  2: 'Tell us about your MUN experience and background',
  3: 'Select your preferred committees in order of preference',
  4: 'Share your interests and motivation',
  5: 'Final details and confirmation',
};

const RegistrationContent: React.FC<RegistrationContentProps> = ({
  step,
  formData,
  isSubmitting,
  calculateFee,
  handleChange,
  nextStep,
  prevStep,
  handleSubmit,
  photoFile,
  updatePhotoFile,
  stepLabels,
  formQuestions,
}) => {
  const fee = calculateFee();

  // Questions for a specific step from the DB config
  const questionsForStep = (s: number): FormQuestion[] =>
    (formQuestions ?? [])
      .filter(q => q.step === s)
      .sort((a, b) => a.order - b.order);

  const hasDynamicQuestions = (s: number) =>
    formQuestions && formQuestions.some(q => q.step === s);

  const resolvedLabels = stepLabels ?? [
    'Personal Info', 'Experience', 'Committees', 'Essays', 'Details',
  ];

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="chip-gold mb-3"
        >
          Delegate Application
        </motion.span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-diplomatic-900 mb-6">
          Join the Global Dialogue
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-6">
          Begin your journey as a delegate in our prestigious Model United Nations conference. Complete the form below to secure your place.
        </p>
      </motion.div>

      {/* Registration steps indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <RegistrationSteps currentStep={step} labels={stepLabels} />
      </motion.div>

      {/* Registration form */}
      <div className="max-w-3xl mx-auto" id="registration-form-section" style={{ scrollMarginTop: '80px' }}>
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Steps 1–4: use DynamicFormStep if config is loaded, else fall back to original components */}
          {step === 1 && (hasDynamicQuestions(1) ? (
            <DynamicFormStep
              step={1} stepTitle={`Page 1 — ${resolvedLabels[0]}`}
              stepSubtitle={STEP_SUBTITLES[1]}
              questions={questionsForStep(1)} formData={formData}
              handleChange={handleChange} photoFile={photoFile}
              updatePhotoFile={updatePhotoFile} nextStep={nextStep}
              prevStep={prevStep} isFirst
            />
          ) : (
            <PersonalInfoStep formData={formData} handleChange={handleChange}
              nextStep={nextStep} photoFile={photoFile} updatePhotoFile={updatePhotoFile} />
          ))}

          {step === 2 && (hasDynamicQuestions(2) ? (
            <DynamicFormStep
              step={2} stepTitle={`Page 2 — ${resolvedLabels[1]}`}
              stepSubtitle={STEP_SUBTITLES[2]}
              questions={questionsForStep(2)} formData={formData}
              handleChange={handleChange} nextStep={nextStep} prevStep={prevStep}
            />
          ) : (
            <PreferencesStep formData={formData} handleChange={handleChange}
              nextStep={nextStep} prevStep={prevStep} />
          ))}

          {step === 3 && (hasDynamicQuestions(3) ? (
            <DynamicFormStep
              step={3} stepTitle={`Page 3 — ${resolvedLabels[2]}`}
              stepSubtitle={STEP_SUBTITLES[3]}
              questions={questionsForStep(3)} formData={formData}
              handleChange={handleChange} nextStep={nextStep} prevStep={prevStep}
            />
          ) : (
            <CommitteePreferencesStep formData={formData} handleChange={handleChange}
              nextStep={nextStep} prevStep={prevStep} />
          ))}

          {step === 4 && (hasDynamicQuestions(4) ? (
            <DynamicFormStep
              step={4} stepTitle={`Page 4 — ${resolvedLabels[3]}`}
              stepSubtitle={STEP_SUBTITLES[4]}
              questions={questionsForStep(4)} formData={formData}
              handleChange={handleChange} nextStep={nextStep} prevStep={prevStep}
            />
          ) : (
            <EssayStep formData={formData} handleChange={handleChange}
              nextStep={nextStep} prevStep={prevStep} />
          ))}

          {step === 5 && (
            <AdditionalInfoStep
              formData={formData} handleChange={handleChange}
              calculateFee={calculateFee} handleSubmit={handleSubmit}
              prevStep={prevStep} isSubmitting={isSubmitting}
            />
          )}

          {step === 6 && <ConfirmationStep fee={fee} />}
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationContent;

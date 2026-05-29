import React from 'react';
import { AlertCircle, Loader2, DollarSign, Check } from 'lucide-react';
import { CustomButton } from '../ui/custom-button';
import { Checkbox } from '../ui/checkbox';

interface FeeInfo {
  originalFee: number;
  discount: number;
  finalFee: number;
}

interface AdditionalInfoStepProps {
  formData: {
    feeAgreement: string;
    finalConfirmation: boolean;
    agreeToTerms: boolean;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  calculateFee: () => FeeInfo;
  handleSubmit: (e: React.FormEvent) => void;
  prevStep: () => void;
  isSubmitting?: boolean;
}

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  formData,
  handleChange,
  calculateFee,
  handleSubmit,
  prevStep,
  isSubmitting = false,
}) => {
  const fee = calculateFee();

  const isFormValid = () => {
    return (
      formData.feeAgreement === 'Yes' &&
      formData.finalConfirmation &&
      formData.agreeToTerms
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">Page 5 — Details</h2>
      <p className="text-neutral-600 mb-6">Complete your registration with final details and confirmations</p>

      <div className="space-y-8">

        {/* Application Fee Agreement */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-diplomatic-800 flex items-center gap-2">
            <DollarSign size={20} className="text-diplomatic-600" />
            Application Fee Agreement
          </h3>

          <div className="mb-4">
            <p className="text-sm text-neutral-700 mb-3">
              <strong>
                The delegate application fee is {fee.originalFee.toLocaleString()} UZS
                {fee.discount > 0 && (
                  <> — after your discount: <span className="text-green-700">{fee.finalFee.toLocaleString()} UZS</span></>
                )}
                . Are you aware of this and ready to pay upon acceptance?
              </strong>
            </p>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="feeYes"
                  name="feeAgreement"
                  value="Yes"
                  checked={formData.feeAgreement === "Yes"}
                  onChange={handleChange}
                  className="w-4 h-4 text-diplomatic-600 border-neutral-300 focus:ring-diplomatic-500"
                  required
                />
                <label htmlFor="feeYes" className="text-sm text-neutral-700 cursor-pointer">
                  <strong>Yes</strong> - I am aware and ready to pay upon acceptance
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="feeNo"
                  name="feeAgreement"
                  value="No"
                  checked={formData.feeAgreement === "No"}
                  onChange={handleChange}
                  className="w-4 h-4 text-diplomatic-600 border-neutral-300 focus:ring-diplomatic-500"
                />
                <label htmlFor="feeNo" className="text-sm text-neutral-700 cursor-pointer">
                  No - I am not ready to pay
                </label>
              </div>
            </div>

            <p className="text-xs text-neutral-500 mt-2">Must select "Yes" to proceed</p>
          </div>
        </div>


        {/* Final Confirmation */}
        <div className="p-4 bg-diplomatic-50 rounded-lg border border-diplomatic-200">
          <h3 className="text-lg font-semibold mb-3 text-diplomatic-800 flex items-center gap-2">
            <Check size={20} className="text-diplomatic-600" strokeWidth={2.5} />
            Final Confirmation
          </h3>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id="finalConfirmation"
                  checked={formData.finalConfirmation}
                  onCheckedChange={(checked) => {
                    const event = {
                      target: {
                        name: 'finalConfirmation',
                        type: 'checkbox',
                        checked: checked === true
                      }
                    } as any;
                    handleChange(event);
                  }}
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="finalConfirmation" className="text-neutral-700 cursor-pointer">
                  <strong>I confirm that all information above is accurate and I am committed to participating if selected.</strong> <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-neutral-500 mt-1">Required to submit</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => {
                    const event = {
                      target: {
                        name: 'agreeToTerms',
                        type: 'checkbox',
                        checked: checked === true
                      }
                    } as any;
                    handleChange(event);
                  }}
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-neutral-700 cursor-pointer">
                  I agree to the <a href="#" className="text-diplomatic-600 hover:underline">Terms and Conditions</a> and <a href="#" className="text-diplomatic-600 hover:underline">Privacy Policy</a>. <span className="text-red-500">*</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-neutral-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-neutral-700">
              <strong>Note:</strong> Your application will be saved to our database and sent to Google Sheets for processing. You will receive a confirmation email shortly after submission.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <CustomButton
          variant="outline"
          onClick={prevStep}
          disabled={isSubmitting}
        >
          Back
        </CustomButton>

        <CustomButton
          variant="primary"
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </CustomButton>
      </div>
    </div>
  );
};

export default AdditionalInfoStep;

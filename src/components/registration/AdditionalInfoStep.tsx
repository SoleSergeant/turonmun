import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, Upload, DollarSign, Award, Check, CheckCircle } from 'lucide-react';
import { CustomButton } from '../ui/custom-button';
import { Checkbox } from '../ui/checkbox';

interface FeeInfo {
  originalFee: number;
  discount: number;
  finalFee: number;
}

interface AdditionalInfoStepProps {
  formData: {
    committeePreference1: string;
    committeePreference2: string;
    committeePreference3: string;
    motivation: string;
    feeAgreement: string;
    discountEligibility: string[];
    proofDocument: File | null;
    finalConfirmation: boolean;
    agreeToTerms: boolean;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  calculateFee: () => FeeInfo;
  handleSubmit: (e: React.FormEvent) => void;
  prevStep: () => void;
  isSubmitting?: boolean;
  updateIeltsCertificate?: (file: File | null) => void;
  ieltsFile?: File | null;
  updateSatCertificate?: (file: File | null) => void;
  satFile?: File | null;
}

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  formData,
  handleChange,
  calculateFee,
  handleSubmit,
  prevStep,
  isSubmitting = false,
  updateIeltsCertificate,
  ieltsFile,
  updateSatCertificate,
  satFile
}) => {
  const fee = calculateFee();

  const isFormValid = () => {
    return (
      formData.feeAgreement === 'Yes' &&
      formData.finalConfirmation &&
      formData.agreeToTerms
    );
  };

  const maxDiscount = 20000;
  const currentDiscount = fee.discount;

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
              <strong>The delegate application fee is 79,000 UZS. Are you aware of this and ready to pay upon acceptance?</strong>
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

        {/* Discount Eligibility */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-3 text-diplomatic-800 flex items-center gap-2">
            <Award size={20} className="text-green-600" />
            Discount Eligibility
          </h3>

          <div className="mb-4">
            <p className="text-sm text-neutral-700 mb-3">
              <strong>We offer a 10,000 UZS discount for each of the following:</strong>
            </p>
            <ul className="text-sm text-neutral-600 mb-3 ml-4">
              <li>– IELTS 6.5+</li>
              <li>– SAT 1350+</li>
            </ul>
            <p className="text-sm text-neutral-600 mb-4">
              <em>Do you qualify for either?</em>
            </p>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="discountIELTS"
                  checked={formData.discountEligibility?.includes("IELTS") || false}
                  onCheckedChange={(checked) => {
                    const event = {
                      target: {
                        name: 'discountEligibility',
                        value: 'IELTS',
                        type: 'checkbox',
                        checked: checked === true
                      }
                    } as any;
                    handleChange(event);
                  }}
                />
                <label htmlFor="discountIELTS" className="text-sm text-neutral-700 cursor-pointer">
                  IELTS 6.5+ (10,000 UZS discount)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="discountSAT"
                  checked={formData.discountEligibility?.includes("SAT") || false}
                  onCheckedChange={(checked) => {
                    const event = {
                      target: {
                        name: 'discountEligibility',
                        value: 'SAT',
                        type: 'checkbox',
                        checked: checked === true
                      }
                    } as any;
                    handleChange(event);
                  }}
                />
                <label htmlFor="discountSAT" className="text-sm text-neutral-700 cursor-pointer">
                  SAT 1350+ (10,000 UZS discount)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="discountNone"
                  checked={formData.discountEligibility?.includes("None") || false}
                  onCheckedChange={(checked) => {
                    const event = {
                      target: {
                        name: 'discountEligibility',
                        value: 'None',
                        type: 'checkbox',
                        checked: checked === true
                      }
                    } as any;
                    handleChange(event);
                  }}
                />
                <label htmlFor="discountNone" className="text-sm text-neutral-700 cursor-pointer">
                  None - I don't qualify for discounts
                </label>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white rounded border border-green-100 overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-neutral-700">Application Fee:</span>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {currentDiscount > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-neutral-400 line-through"
                      >
                        {fee.originalFee.toLocaleString()} UZS
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {currentDiscount === 0 && (
                    <span className="text-sm text-diplomatic-800">{fee.originalFee.toLocaleString()} UZS</span>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {currentDiscount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 4 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-green-600">Your Discount:</span>
                    <motion.span
                      key={currentDiscount}
                      initial={{ scale: 1.3, color: '#16a34a' }}
                      animate={{ scale: 1, color: '#16a34a' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-sm font-semibold text-green-600"
                    >
                      -{currentDiscount.toLocaleString()} UZS
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between items-center pt-1 border-t">
                <span className="text-sm font-bold text-diplomatic-900">Your Total:</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={fee.finalFee}
                    initial={{ opacity: 0, scale: 1.15, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-sm font-bold text-diplomatic-900"
                  >
                    {fee.finalFee.toLocaleString()} UZS
                  </motion.span>
                </AnimatePresence>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Max discount: {maxDiscount.toLocaleString()} UZS</p>
            </div>
          </div>
        </div>

        {/* Upload Proof for Discounts */}
        {formData.discountEligibility?.some(item => item === 'IELTS' || item === 'SAT') && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold mb-3 text-diplomatic-800 flex items-center gap-2">
              <Upload size={20} className="text-yellow-600" />
              Upload Proof for Discounts
            </h3>

            <div className="space-y-4">
              {/* IELTS Certificate Upload */}
              {formData.discountEligibility?.includes('IELTS') && (
                <div className="form-group">
                  <label htmlFor="ieltsDocument" className="block text-sm font-medium text-neutral-700 mb-1">
                    📄 Upload your IELTS Score Report
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="ieltsDocument"
                      name="ieltsDocument"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        // Handle IELTS file upload via props
                        if (updateIeltsCertificate) {
                          updateIeltsCertificate(file);
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Upload IELTS score certificate (PDF, JPG, PNG only, max 10MB)
                  </p>
                  {ieltsFile && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="text-green-600" size={14} strokeWidth={1.5} />
                      IELTS file selected: {ieltsFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* SAT Certificate Upload */}
              {formData.discountEligibility?.includes('SAT') && (
                <div className="form-group">
                  <label htmlFor="satDocument" className="block text-sm font-medium text-neutral-700 mb-1">
                    📊 Upload your SAT Score Report
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="satDocument"
                      name="satDocument"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        // Handle SAT file upload via props
                        if (updateSatCertificate) {
                          updateSatCertificate(file);
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Upload SAT score certificate (PDF, JPG, PNG only, max 10MB)
                  </p>
                  {satFile && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      SAT file selected: {satFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Upload Instructions */}
              <div className="p-3 bg-white rounded border border-yellow-100">
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">📝 Upload Guidelines:</h4>
                <ul className="text-xs text-neutral-600 space-y-1">
                  <li>• Upload only the certificates for discounts you selected above</li>
                  <li>• Accepted formats: PDF, JPG, PNG (max 10MB each)</li>
                  <li>• Make sure scores are clearly visible</li>
                  <li>• Files will be securely stored and reviewed by admins</li>
                </ul>
              </div>
            </div>
          </div>
        )}

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

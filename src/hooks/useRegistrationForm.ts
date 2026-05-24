import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendRegistrationToGoogleSheets } from '@/utils/googleSheetsIntegration';
import { uploadPhoto, uploadCertificate, generateApplicationId, uploadIELTSCertificate, uploadSATCertificate } from '@/utils/fileUpload';

interface RegistrationFormData {
  fullName: string;
  email: string;
  telegramUsername: string;
  institution: string;
  dateOfBirth: string;
  countryAndCity: string;
  phone: string;
  photo: File | null;
  experience: string;
  previousMUNs: string;
  portfolioLink: string;
  uniqueDelegateTrait: string;
  issueInterest: string;
  feeAgreement: string;
  discountEligibility: string[];
  proofDocument: File | null;
  finalConfirmation: boolean;
  hasIELTS: boolean;
  hasSAT: boolean;
  agreeToTerms: boolean;
  committee_preference1: string;
  committee_preference2: string;
  committee_preference3: string;
  applicationId: string;
}

interface FeeCalculation {
  originalFee: number;
  discount: number;
  finalFee: number;
}

// Define a proper type for the application data to be sent to Supabase
interface ApplicationData {
  full_name: string;
  email: string;
  telegram_username: string;
  institution: string;
  date_of_birth: string;
  country: string;
  phone: string;
  experience: string;
  previous_muns: string;
  portfolio_link: string;
  unique_delegate_trait: string;
  issue_interest: string;
  fee_agreement: string;
  discount_eligibility: string;
  final_confirmation: boolean;
  has_ielts: boolean;
  has_sat: boolean;
  status: string;
  committee_preference1: string;
  committee_preference2: string;
  committee_preference3: string;
  application_id: string;
  photo_url: string;
  certificate_url: string;
}

export const useRegistrationForm = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    telegramUsername: '',
    institution: '',
    dateOfBirth: '',
    countryAndCity: '',
    phone: '',
    photo: null,
    experience: '',
    previousMUNs: '',
    portfolioLink: '',
    uniqueDelegateTrait: '',
    issueInterest: '',
    feeAgreement: '',
    discountEligibility: [],
    proofDocument: null,
    finalConfirmation: false,
    hasIELTS: false,
    hasSAT: false,
    agreeToTerms: false,
    committee_preference1: '',
    committee_preference2: '',
    committee_preference3: '',
    applicationId: generateApplicationId(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload State - Updated for dual certificates
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ieltsFile, setIeltsFile] = useState<File | null>(null);
  const [satFile, setSatFile] = useState<File | null>(null);

  // Calculate registration fee based on discount eligibility
  const calculateFee = (): FeeCalculation => {
    let baseFee = 79000; // Season 5 delegate fee
    let discount = 0;
    
    if (formData.discountEligibility.includes('IELTS')) discount += 10000;
    if (formData.discountEligibility.includes('SAT')) discount += 10000;
    
    return {
      originalFee: baseFee,
      discount: discount,
      finalFee: baseFee - discount
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isFile = type === 'file';
    
    if (isFile) {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0] || null;
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else if (name === 'discountEligibility') {
      // Handle multi-select checkboxes for discount eligibility
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => {
        if (checkbox.checked) {
          return {
            ...prev,
            discountEligibility: [...prev.discountEligibility, value]
          };
        } else {
          return {
            ...prev,
            discountEligibility: prev.discountEligibility.filter(item => item !== value)
          };
        }
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
    // Scroll to registration form section instead of top
    setTimeout(() => {
      const formElement = document.getElementById('registration-form-section');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    // Scroll to registration form section instead of top
    setTimeout(() => {
      const formElement = document.getElementById('registration-form-section');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  /**
   * Update photo file
   */
  const updatePhotoFile = (file: File | null) => {
    setPhotoFile(file);
  };

  /**
   * Update IELTS certificate file
   */
  const updateIeltsCertificate = (file: File | null) => {
    setIeltsFile(file);
  };

  /**
   * Update SAT certificate file  
   */
  const updateSatCertificate = (file: File | null) => {
    setSatFile(file);
  };

  /**
   * Handle form submission - wrapper that manages success/failure flow
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await submitForm();
      if (success) {
        // Move to confirmation step on success
        nextStep();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submit the complete registration form
   */
  const submitForm = async (): Promise<boolean> => {
    try {
      // Generate unique application ID
      const applicationId = generateApplicationId();
      
      let photoUrl = '';
      let ieltsUrl = '';
      let satUrl = '';

      // Upload photo if provided
      if (photoFile) {
        toast({
          title: "Uploading photo...",
          description: "Please wait while we upload your photo.",
        });
        
        const photoResult = await uploadPhoto(photoFile, applicationId);
        if (!photoResult.success) {
          toast({
            title: "Photo upload failed",
            description: photoResult.error,
            variant: "destructive",
          });
          return false;
        }
        photoUrl = photoResult.url || '';
      }

      // Upload IELTS certificate if provided
      if (ieltsFile) {
        toast({
          title: "Uploading IELTS certificate...",
          description: "Please wait while we upload your IELTS certificate.",
        });
        
        const ieltsResult = await uploadIELTSCertificate(ieltsFile, applicationId);
        if (!ieltsResult.success) {
          toast({
            title: "IELTS certificate upload failed",
            description: ieltsResult.error,
            variant: "destructive",
          });
          return false;
        }
        ieltsUrl = ieltsResult.url || '';
      }

      // Upload SAT certificate if provided  
      if (satFile) {
        toast({
          title: "Uploading SAT certificate...",
          description: "Please wait while we upload your SAT certificate.",
        });
        
        const satResult = await uploadSATCertificate(satFile, applicationId);
        if (!satResult.success) {
          toast({
            title: "SAT certificate upload failed",
            description: satResult.error,
            variant: "destructive",
          });
          return false;
        }
        satUrl = satResult.url || '';
      }

      // Prepare form data with file URLs - INCLUDE ALL FORM FIELDS!
      const submissionData = {
        // Basic info fields
        full_name: formData.fullName,
        email: formData.email,
        telegram_username: formData.telegramUsername,
        institution: formData.institution,
        date_of_birth: formData.dateOfBirth,
        country: formData.countryAndCity,
        phone: formData.phone,
        experience: formData.experience,
        
        // Extended personal info
        previous_muns: formData.previousMUNs,
        portfolio_link: formData.portfolioLink,
        
        // Essay responses
        unique_delegate_trait: formData.uniqueDelegateTrait,
        issue_interest: formData.issueInterest,
        
        // Committee preferences
        committee_preference1: formData.committee_preference1 || 'Not Selected',
        committee_preference2: formData.committee_preference2 || 'Not Selected', 
        committee_preference3: formData.committee_preference3 || 'Not Selected',
        
        // Fee and agreement data (THE MISSING DATA!)
        fee_agreement: formData.feeAgreement,
        discount_eligibility: formData.discountEligibility.join(', '),
        final_confirmation: formData.finalConfirmation,
        
        // Scores
        has_ielts: formData.discountEligibility.includes('IELTS'),
        has_sat: formData.discountEligibility.includes('SAT'),
        
        // File URLs
        application_id: applicationId,
        photo_url: photoUrl,
        ielts_certificate_url: ieltsUrl,
        sat_certificate_url: satUrl,
        certificate_url: ieltsUrl || satUrl || '', // Backward compatibility
        
        // Status
        status: 'pending'
      };

      // Submit to database
      toast({
        title: "Submitting application...",
        description: "Please wait while we process your application.",
      });

      const { error: dbError } = await supabase
        .from('applications')
        .insert([submissionData]);

      if (dbError) {
        console.error('Database submission error:', dbError);
        toast({
          title: "Submission failed",
          description: "Failed to submit your application. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    step,
    formData,
    isSubmitting,
    calculateFee,
    handleChange,
    nextStep,
    prevStep,
    handleSubmit,
    photoFile,
    ieltsFile,
    satFile,
    updatePhotoFile,
    updateIeltsCertificate,
    updateSatCertificate
  };
};

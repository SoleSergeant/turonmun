import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RegistrationContent from '../components/registration/RegistrationContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Registration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    telegramUsername: '',  // Added missing field
    institution: '',
    countryAndCity: '',    // Added missing field
    grade: '',
    munExperience: '',

    // Preferences (Step 2)
    experience: '',        // MUN experience level
    previousMUNs: '',      // Previous MUN conferences
    delegationType: 'individual',
    participationType: 'in-person',

    // Committee Preferences
    committee_preference1: '',
    committee_preference2: '',
    committee_preference3: '',

    // Essay
    motivationEssay: '', // Keeping for backward compatibility if needed, but mainly using new fields
    issueInterest: '',

    // Additional Info
    dietaryRestrictions: '',
    medicalConditions: '',
    emergencyContact: '',
    emergencyPhone: '',
    feeAgreement: '',
    discountEligibility: [] as string[],
    finalConfirmation: false,
    hasIELTS: 'no',
    hasSAT: 'no',
    ieltsScore: '',
    satScore: '',
    agreeToTerms: false,
  });

  const fillTestData = () => {
    setFormData({
      fullName: 'John Doe',
      dateOfBirth: '2005-05-15',
      gender: 'male',
      email: `test_${Math.random().toString(36).substring(2, 7)}@example.com`,
      phone: '+998901234567',
      telegramUsername: '@johndoe_test',
      institution: 'Global Academy',
      countryAndCity: 'Uzbekistan, Tashkent',
      grade: '11',
      munExperience: '1-2',
      experience: '1-2',
      previousMUNs: 'Tashkent MUN 2023, WIUT MUN 2024',
      delegationType: 'individual',
      participationType: 'in-person',
      committee_preference1: 'United Nations Security Council',
      committee_preference2: 'United Nations Human Rights Council',
      committee_preference3: 'DISEC',
      motivationEssay: 'I am highly motivated to participate in this MUN to improve my debating and diplomatic skills.',
      issueInterest: 'International security and climate change mitigation strategies.',
      dietaryRestrictions: 'None',
      medicalConditions: 'None',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+998907654321',
      feeAgreement: 'Yes',
      discountEligibility: ['IELTS', 'SAT'],
      finalConfirmation: true,
      hasIELTS: 'yes',
      hasSAT: 'yes',
      ieltsScore: '7.5',
      satScore: '1450',
      agreeToTerms: true,
    });
    setStep(5); // Skip directly to file upload step
    toast({
      title: "Test Data Loaded",
      description: "Skipped to step 5 for file upload testing.",
    });
  };

  // Auto-fill name & email from signed-in user, and check for existing application
  useEffect(() => {
    if (!user) return;

    const email = user.email ?? '';
    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';

    setFormData(prev => ({
      ...prev,
      email,
      fullName,
    }));

    // Check if user already submitted an application
    const checkExisting = async () => {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (data && data.length > 0) {
        setAlreadyApplied(true);
      }
      setCheckingApplication(false);
    };

    checkExisting();
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Scroll to form section when step changes
    const formSection = document.getElementById('registration-form-section');
    if (formSection && step > 1) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'discountEligibility') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => {
        if (checked) {
          // If "None" is selected, clear all other discount options
          if (value === 'None') {
            return { ...prev, discountEligibility: ['None'] };
          }
          // If a discount option is selected, remove "None" and add the new value
          const withoutNone = prev.discountEligibility.filter(item => item !== 'None');
          return { ...prev, discountEligibility: [...withoutNone, value] };
        } else {
          return { ...prev, discountEligibility: prev.discountEligibility.filter(item => item !== value) };
        }
      });
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateFee = () => {
    const baseFee = 90000; // 90K UZS — Season 6
    return {
      originalFee: baseFee,
      discount: 0,
      finalFee: baseFee
    };
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.telegramUsername || !formData.institution || !formData.dateOfBirth || !formData.countryAndCity) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 2) {
      if (!formData.experience) {
        toast({
          title: "Missing Experience",
          description: "Please select your MUN experience level",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 3) {
      if (!formData.committee_preference1 || !formData.committee_preference2 || !formData.committee_preference3) {
        toast({
          title: "Missing Committees",
          description: "Please select all three committee preferences",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 4) {
      if (!formData.issueInterest) {
        toast({
          title: "Essay Required",
          description: "Please complete the essay question",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 5) {
      if (formData.feeAgreement !== 'Yes' || !formData.finalConfirmation || !formData.agreeToTerms) {
        toast({
          title: "Missing Confirmation",
          description: "Please agree to the fee and terms to proceed",
          variant: "destructive",
        });
        return;
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    console.log(`[Upload] Starting upload for ${folder}/${file.name} (${file.size} bytes)`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log(`[Upload] Uploading to bucket: applications, path: ${filePath}`);
      const { data, error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, file);

      if (uploadError) {
        console.error(`[Upload] Storage error for ${folder}:`, uploadError);
        throw uploadError;
      }
      
      console.log(`[Upload] Upload successful for ${folder}:`, data);

      const { data: { publicUrl } } = supabase.storage
        .from('applications')
        .getPublicUrl(filePath);

      console.log(`[Upload] Public URL generated for ${folder}: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error(`[Upload] Catch block error for ${folder}:`, error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[Submit] Form submission started');
    console.log('[Submit] Current Step:', step);
    console.log('[Submit] FormData Summary:', {
      fullName: formData.fullName,
      email: formData.email,
      hasPhoto: !!photoFile,
      hasIELTS: !!ieltsFile,
      hasSAT: !!satFile,
      discounts: formData.discountEligibility
    });

    setIsSubmitting(true);

    try {
      // Upload files
      let photoUrl = null;

      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'photos');
      }

      // Calculate final fee
      const fee = calculateFee();

      console.log('[Submit] Inserting into database...', {
        full_name: formData.fullName,
        email: formData.email,
        photo: !!photoUrl,
        ielts: !!ieltsUrl,
        sat: !!satUrl
      });
      
      // Insert application into database
      const { data, error } = await supabase
        .from('applications')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || '',
          telegram_username: formData.telegramUsername,
          institution: formData.institution,
          country: formData.countryAndCity,
          date_of_birth: formData.dateOfBirth,
          committee_preference1: formData.committee_preference1,
          committee_preference2: formData.committee_preference2,
          committee_preference3: formData.committee_preference3,
          experience: formData.experience || 'None',
          motivation: `Interest: ${formData.issueInterest}`,
          dietary_restrictions: formData.dietaryRestrictions || null,
          emergency_contact_relation: formData.telegramUsername,
          has_ielts: false,
          has_sat: false,
          discount_eligibility: 'None',
          fee_agreement: formData.feeAgreement,
          final_confirmation: formData.finalConfirmation,
          payment_amount: fee.finalFee,
          photo_url: photoUrl,
          ielts_certificate_url: null,
          sat_certificate_url: null,
          certificate_url: null,
          notes: `
Date of Birth: ${formData.dateOfBirth}
Gender: ${formData.gender || 'Not Specified'}
Grade: ${formData.grade || 'N/A'}
Medical Conditions: ${formData.medicalConditions || 'None'}
Previous MUNs: ${formData.previousMUNs || 'N/A'}
Telegram: ${formData.telegramUsername}
Phone: ${formData.phone}
Country/City: ${formData.countryAndCity}
Photo URL: ${photoUrl || 'N/A'}
          `.trim(),
          ielts_score: null,
          sat_score: null,
        } as any)
        .select();

      console.log('[Submit] Database response:', { data, error });

      if (error) {
        console.error('[Submit] Database error details:', error);
        throw error;
      }

      console.log('[Submit] Submission successful!');

      toast({
        title: "Application Submitted!",
        description: "Your registration has been submitted successfully. Check your email for further instructions.",
      });

      // Move to confirmation step
      setStep(6);

      // Redirect to dashboard after 5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-diplomatic-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
        <Navbar />
        <main className="flex-grow pt-20 pb-12 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-diplomatic-900 mb-3">Already Applied</h2>
            <p className="text-neutral-600 mb-6">
              You have already submitted an application with this account. Each person may only apply once.
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-diplomatic-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-diplomatic-800 transition-colors"
            >
              View My Application
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <RegistrationContent
          step={step}
          formData={formData}
          isSubmitting={isSubmitting}
          calculateFee={calculateFee}
          handleChange={handleChange}
          nextStep={nextStep}
          prevStep={prevStep}
          handleSubmit={handleSubmit}
          photoFile={photoFile}
          updatePhotoFile={setPhotoFile}
        />
      </main>
      <Footer />

      {/* Dev Helper - Fill Test Data */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={fillTestData}
          className="bg-diplomatic-800 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-diplomatic-900 shadow-2xl border border-white/20 transition-all active:scale-95"
          type="button"
        >
          DEBUG: Fill Test Data
        </button>
      </div>
    </div>
  );
};

export default Registration;


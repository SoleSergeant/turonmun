import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RegistrationContent from '../components/registration/RegistrationContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

const Registration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ieltsFile, setIeltsFile] = useState<File | null>(null);
  const [satFile, setSatFile] = useState<File | null>(null);

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
    const baseFee = 80000; // 80K UZS
    let discount = 0;

    // Apply IELTS discount (10K) — show in UI immediately on selection
    if (formData.discountEligibility.includes('IELTS')) {
      discount += 10000;
    }

    // Apply SAT discount (10K) — show in UI immediately on selection
    if (formData.discountEligibility.includes('SAT')) {
      discount += 10000;
    }

    const finalFee = baseFee - discount;

    return {
      originalFee: baseFee,
      discount,
      finalFee
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
      
      // Validate that files are uploaded for selected discounts
      if (formData.discountEligibility.includes('IELTS') && !ieltsFile) {
        toast({
          title: "IELTS Certificate Missing",
          description: "Please upload your IELTS certificate to receive the discount.",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.discountEligibility.includes('SAT') && !satFile) {
        toast({
          title: "SAT Certificate Missing",
          description: "Please upload your SAT certificate to receive the discount.",
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
      let ieltsUrl = null;
      let satUrl = null;

      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'photos');
      }

      if (ieltsFile) {
        ieltsUrl = await uploadFile(ieltsFile, 'certificates');
      }

      if (satFile) {
        satUrl = await uploadFile(satFile, 'certificates');
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
          has_ielts: formData.discountEligibility.includes('IELTS'),
          has_sat: formData.discountEligibility.includes('SAT'),
          discount_eligibility: formData.discountEligibility.join(', '),
          fee_agreement: formData.feeAgreement,
          final_confirmation: formData.finalConfirmation,
          payment_amount: fee.finalFee,
          // Removed status payload to rely on secure database defaults
          photo_url: photoUrl,
          ielts_certificate_url: ieltsUrl,
          sat_certificate_url: satUrl,
          certificate_url: ieltsUrl || satUrl,
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
IELTS URL: ${ieltsUrl || 'N/A'}
SAT URL: ${satUrl || 'N/A'}
IELTS Score: ${formData.ieltsScore || 'N/A'}
SAT Score: ${formData.satScore || 'N/A'}
          `.trim(),
          ielts_score: formData.ieltsScore ? parseFloat(formData.ieltsScore) : null,
          sat_score: formData.satScore ? parseInt(formData.satScore) : null,
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
          ieltsFile={ieltsFile}
          satFile={satFile}
          updatePhotoFile={setPhotoFile}
          updateIeltsCertificate={setIeltsFile}
          updateSatCertificate={setSatFile}
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


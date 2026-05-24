import React from 'react';
import { User, Mail, MessageCircle, Building, Calendar, Globe, Phone, Upload, ArrowRight } from 'lucide-react';

interface PersonalInfoStepProps {
  formData: {
    fullName: string;
    email: string;
    telegramUsername: string;
    institution: string;
    dateOfBirth: string;
    countryAndCity: string;
    phone: string;
    photo: File | null;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  nextStep: () => void;
  photoFile?: File | null;
  updatePhotoFile?: (file: File | null) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  formData,
  handleChange,
  nextStep,
  photoFile,
  updatePhotoFile
}) => {
  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.telegramUsername.trim() !== '' &&
      formData.institution.trim() !== '' &&
      formData.dateOfBirth.trim() !== '' &&
      formData.countryAndCity.trim() !== ''
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">Page 1 — Personal Information</h2>
      <p className="text-neutral-600 mb-6">Please provide your basic information for registration</p>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-neutral-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              placeholder="Enter your email address"
              required
            />
          </div>
        </div>

        {/* Telegram Username */}
        <div className="form-group">
          <label htmlFor="telegramUsername" className="block text-sm font-medium text-neutral-700 mb-1">
            Telegram Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageCircle size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              id="telegramUsername"
              name="telegramUsername"
              value={formData.telegramUsername}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              placeholder="e.g., @username"
              required
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Format hint (e.g., @username)</p>
        </div>

        {/* Institution of Study or Workplace */}
        <div className="form-group">
          <label htmlFor="institution" className="block text-sm font-medium text-neutral-700 mb-1">
            Institution of Study or Workplace <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              placeholder="School, university, or workplace"
              required
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Accept both school/university or job place</p>
        </div>

        {/* Date of Birth */}
        <div className="form-group">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-neutral-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-neutral-400" />
            </div>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              required
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Format: MM/DD/YYYY</p>
        </div>

        {/* Country and City */}
        <div className="form-group">
          <label htmlFor="countryAndCity" className="block text-sm font-medium text-neutral-700 mb-1">
            Country and City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              id="countryAndCity"
              name="countryAndCity"
              value={formData.countryAndCity}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              placeholder="Country, City"
              required
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Format: Country, City</p>
        </div>

        {/* Contact Phone Number (Optional) */}
        <div className="form-group">
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
            Contact Phone Number <span className="text-neutral-500">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-neutral-400" />
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
              placeholder="Enter your phone number"
            />
          </div>
        </div>


      </div>

      <div className="mt-8 flex justify-end">
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

export default PersonalInfoStep;
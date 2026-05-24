import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CustomButton } from '../components/ui/custom-button';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordChange = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setError(null);

    // Validation
    if (!formData.password || !formData.confirmPassword) {
      setError({ message: 'Please fill in all fields' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError({ message: 'Passwords do not match!' });
      return;
    }

    if (formData.password.length < 6) {
      setError({ message: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      setIsLoading(true);

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError({
          message: updateError.message || 'Failed to update password',
        });
        return;
      }

      setSuccessMessage('✅ Password updated successfully! Redirecting to login...');
      setFormData({ password: '', confirmPassword: '' });

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError({
        message: err.message || 'An error occurred while updating password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      <main className="flex-grow pt-20 pb-12 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-md mx-auto"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants} className="mb-6">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-diplomatic-600 hover:text-diplomatic-700 font-medium transition-colors"
              >
                <ArrowLeft size={18} />
                Back to Login
              </button>
            </motion.div>

            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <h1 className="text-4xl font-bold text-diplomatic-900 mb-2">Create New Password</h1>
              <p className="text-neutral-600">Enter your new password below</p>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                variants={itemVariants}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6"
              >
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error.message}</p>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.div
                variants={itemVariants}
                className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-6"
              >
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-green-800 font-medium">Success!</p>
                  <p className="text-green-700 text-sm">{successMessage}</p>
                </div>
              </motion.div>
            )}

            {/* Form Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-elegant border border-neutral-100 p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-diplomatic-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-neutral-500 hover:text-neutral-700"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Minimum 6 characters
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-diplomatic-500" size={20} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-neutral-500 hover:text-neutral-700"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-diplomatic-50 border border-diplomatic-200 rounded-lg">
                  <p className="text-sm text-diplomatic-700 font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-diplomatic-600 space-y-1">
                    <li>✓ At least 6 characters</li>
                    <li>✓ Mix of uppercase and lowercase letters</li>
                    <li>✓ Include numbers and special characters for better security</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <CustomButton
                  type="submit"
                  variant="accent"
                  size="lg"
                  disabled={isLoading}
                  className="w-full group"
                >
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                  {!isLoading && <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} />}
                </CustomButton>
              </form>
            </motion.div>

            {/* Info Box */}
            <motion.div variants={itemVariants} className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>💡 Tip:</strong> Use a strong password with a mix of uppercase, lowercase, numbers, and special characters for better security.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordChange;

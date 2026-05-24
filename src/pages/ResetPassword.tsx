import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CustomButton } from '../components/ui/custom-button';
import { useAuth } from '../hooks/useAuth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword, isLoading, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!email) {
      setError({
        message: 'Please enter your email address',
      });
      return;
    }

    const result = await resetPassword(email);

    if (result.success) {
      setSuccessMessage('✅ Password reset link sent! Check your email for instructions.');
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => {
        navigate('/login');
      }, 5000);
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
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-diplomatic-600 hover:text-diplomatic-700 font-medium transition-colors"
              >
                <ArrowLeft size={18} />
                Back to Login
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <h1 className="text-4xl font-bold text-diplomatic-900 mb-2">Reset Password</h1>
              <p className="text-neutral-600">Enter your email to receive a password reset link</p>
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
              {!isSubmitted ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-diplomatic-500" size={20} />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={email}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
                          placeholder="your@email.com"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        We'll send you a link to reset your password
                      </p>
                    </div>

                    {/* Submit Button */}
                    <CustomButton
                      type="submit"
                      variant="accent"
                      size="lg"
                      disabled={isLoading}
                      className="w-full group"
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                      {!isLoading && <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} />}
                    </CustomButton>
                  </form>

                  {/* Info Box */}
                  <div className="mt-6 p-4 bg-diplomatic-50 border border-diplomatic-200 rounded-lg">
                    <p className="text-sm text-diplomatic-700">
                      <strong>💡 Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-diplomatic-900 mb-2">Check Your Email</h2>
                  <p className="text-neutral-600 mb-4">
                    We've sent a password reset link to your email address. The link will expire in 1 hour.
                  </p>
                  <p className="text-sm text-neutral-500">
                    Redirecting to login in a few seconds...
                  </p>
                </div>
              )}
            </motion.div>

            {/* Back to Login Link */}
            <motion.div variants={itemVariants} className="text-center mt-6">
              <p className="text-neutral-600">
                Remember your password?{' '}
                <Link to="/login" className="text-diplomatic-600 hover:text-diplomatic-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;

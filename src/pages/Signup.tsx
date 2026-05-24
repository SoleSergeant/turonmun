import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CustomButton } from '../components/ui/custom-button';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { signup, signInWithGoogle, isLoading, error, setError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleGoogleSignup = async () => {
    const result = await signInWithGoogle();
    if (!result.success) {
      console.error('Google signup failed:', result.error);
    }
  };

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

    if (formData.password !== formData.confirmPassword) {
      setError({
        message: 'Passwords do not match!',
      });
      return;
    }

    if (formData.password.length < 6) {
      setError({
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    const result = await signup(formData.email, formData.password, formData.fullName);

    if (result.success) {
      // Auto sign-in immediately after account creation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (!signInError) {
        navigate(redirectTo, { replace: true });
      } else {
        // If auto-login fails (e.g. email confirmation required), show a friendly message
        setSuccessMessage('Account created! Please check your email to confirm, then log in.');
      }
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

  const features = [
    'Access exclusive MUN resources',
    'Register for conferences',
    'Track your delegate progress',
    'Connect with other diplomats'
  ];

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto"
          >
            {/* Left Side - Features */}
            <motion.div variants={itemVariants} className="hidden lg:block">
              <h2 className="text-3xl font-bold text-diplomatic-900 mb-8">Join TuronMUN</h2>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <Check className="text-diplomatic-600 mt-1 flex-shrink-0" size={14} strokeWidth={1.5} />
                    <span className="text-neutral-700">{feature}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                variants={itemVariants}
                className="mt-8 p-6 bg-diplomatic-50 rounded-xl border border-diplomatic-200"
              >
                <p className="text-sm text-diplomatic-700">
                  <span className="font-semibold">🎓 Tip:</span> Create an account to get early access to Season 6 registration when it opens!
                </p>
              </motion.div>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-8 lg:text-left">
                <h1 className="text-4xl font-bold text-diplomatic-900 mb-2">Create Account</h1>
                <p className="text-neutral-600">Join our community of young diplomats</p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  variants={itemVariants}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6"
                >
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-800 font-medium">Signup Error</p>
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
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} strokeWidth={2} />
                  <p className="text-green-800">{successMessage}</p>
                </motion.div>
              )}

              <div className="bg-white rounded-2xl shadow-elegant border border-neutral-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name Field */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 text-diplomatic-500" size={20} />
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

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
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                      Password
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
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox id="terms" required />
                    <span className="text-sm text-neutral-600">
                      I agree to the{' '}
                      <a href="#" className="text-diplomatic-600 hover:text-diplomatic-700 font-medium">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-diplomatic-600 hover:text-diplomatic-700 font-medium">
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <CustomButton
                    type="submit"
                    variant="accent"
                    size="lg"
                    disabled={isLoading}
                    className="w-full group"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                    {!isLoading && <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} />}
                  </CustomButton>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-neutral-200"></div>
                  <span className="text-sm text-neutral-500">or</span>
                  <div className="flex-1 h-px bg-neutral-200"></div>
                </div>

                {/* Google Signup Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-70 font-medium text-neutral-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isLoading ? 'Creating Account...' : 'Sign up with Google'}
                </button>

              </div>

              {/* Sign In Link */}
              <motion.div variants={itemVariants} className="text-center mt-6">
                <p className="text-neutral-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-diplomatic-600 hover:text-diplomatic-700 font-semibold">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;

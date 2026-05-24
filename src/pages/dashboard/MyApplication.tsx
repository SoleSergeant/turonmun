import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit3,
  Save,
  X,
  Eye,
  Calendar,
  CreditCard,
  User,
  Mail,
  School,
  MapPin,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function MyApplication() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Tables<'applications'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const documents = [
    { name: 'Application Form', status: 'uploaded', uploadDate: application?.created_at || 'N/A', size: '—', type: 'Record' },
  ];

  useEffect(() => {
    const loadApplication = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        console.log('Querying applications for email:', user.email);
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Supabase response:', { data, error });
        if (!error && data) {
          setApplication(data);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [user]);

  const isAllocated = !!application?.assigned_committee_id;
  const isApproved = application?.status === 'approved' || isAllocated;
  const isPaid = application?.payment_status === 'paid';
  const isReviewed = !!application?.reviewed_at || isApproved || isPaid;

  const applicationStatus = {
    current: isAllocated ? 'completed' : isApproved ? 'allocated' : isPaid ? 'confirmed' : isReviewed ? 'payment' : 'review',
    steps: [
      { 
        name: 'Application Submitted', 
        status: 'completed' as "completed" | "current" | "pending", 
        date: application?.created_at || null, 
        description: 'Your application has been received' 
      },
      { 
        name: 'Reviewed', 
        status: (isReviewed ? 'completed' : 'current') as "completed" | "current" | "pending", 
        date: application?.reviewed_at || null, 
        description: 'Application reviewed by the team' 
      },
      { 
        name: 'Payment', 
        status: (isPaid ? 'completed' : isReviewed ? 'current' : 'pending') as "completed" | "current" | "pending", 
        date: null, 
        description: 'Conference fee payment status' 
      },
      { 
        name: 'Confirmation', 
        status: (isApproved ? 'completed' : isPaid ? 'current' : 'pending') as "completed" | "current" | "pending", 
        date: null, 
        description: 'Application confirmation' 
      },
      { 
        name: 'Committee Allocation', 
        status: (isAllocated ? 'completed' : isApproved ? 'current' : 'pending') as "completed" | "current" | "pending", 
        date: null, 
        description: 'Committee and country assignment' 
      },
    ]
  };

  const paymentInfo = {
    amount: application?.payment_amount || 0,
    currency: 'USD',
    status: application?.payment_status || 'unpaid',
    transactionId: application?.payment_reference || 'Not available',
    paymentDate: application?.updated_at || 'Not available',
    method: 'Bank transfer',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading your application...</p>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
            My Application
          </h1>
          <p className="text-white/70">
            Manage your conference application and track progress
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-gold-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Application Found</h3>
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            We couldn’t find an application associated with your account. Make sure you submitted the registration form with the same email you’re using to log in.
          </p>
          <motion.button
            className="bg-gold-500 hover:bg-gold-600 px-6 py-3 text-white transition-colors rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/register'}
          >
            Go to Registration
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-display font-bold text-white mb-2 tracking-tight">
            My Application
          </h1>
          <p className="text-white/50 text-sm md:text-base font-medium">
            Manage your conference application and track progress
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          <Clock size={12} className="text-gold-400" />
          <span>Last Sync: {new Date().toLocaleDateString()}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Application Status */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6 flex flex-col h-full">
           <div className="glass-card p-6 border-white/10 flex-1">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-500/30 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">Application Journey</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Process Tracking</p>
              </div>
            </div>

            <div className="relative pl-10 space-y-10 group/journey">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500/50 via-white/10 to-white/5" />
              
              {applicationStatus.steps.map((step, index) => (
                <div key={step.name} className="relative flex items-start group/step">
                  {/* Status indicator */}
                  <div className={`absolute -left-[31px] w-6 h-6 rounded-full border-4 border-diplomatic-900 z-10 transition-all duration-500 flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : step.status === 'current'
                        ? 'bg-gold-500 shadow-[0_0_15px_rgba(247,163,28,0.5)] animate-pulse'
                        : 'bg-white/10 border-white/5'
                  }`}>
                    {step.status === 'completed' && <CheckCircle size={10} className="text-diplomatic-900" />}
                  </div>

                  <div className={`flex-1 transition-all duration-300 ${
                    step.status === 'completed' || step.status === 'current' ? 'opacity-100' : 'opacity-40'
                  }`}>
                    <div className={`flex items-center justify-between gap-4 mb-1`}>
                      <p className={`text-sm font-bold tracking-tight ${
                        step.status === 'current' ? 'text-gold-400' : 'text-white'
                      }`}>
                        {step.name}
                      </p>
                      {step.date && (
                        <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          {new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-white/60 font-medium leading-relaxed">{step.description}</p>
                    
                    {step.status === 'current' && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gold-400/10 border border-gold-400/20 mt-2"
                      >
                        <AlertCircle size={10} className="text-gold-400" />
                        <span className="text-[9px] text-gold-400 font-bold uppercase tracking-wider">In Progress</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Data Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information */}
          <motion.div variants={itemVariants} className="glass-card hover:border-white/20 transition-colors p-6 flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <User className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">Delegates details</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Profile</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              {[
                { label: 'Full Name', value: application?.full_name, icon: User },
                { label: 'Email Address', value: application?.email, icon: Mail },
                { label: 'Mobile Number', value: application?.phone, icon: Clock },
                { label: 'Institution', value: application?.institution, icon: School },
                { label: 'Experience Level', value: application?.experience, icon: FileText, capitalize: true },
                { label: 'Country & City', value: application?.country, icon: MapPin },
              ].map((field, idx) => (
                <div key={idx} className="flex flex-col border-b border-white/5 pb-4 last:border-0 md:last:border-b">
                  <span className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">{field.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-semibold text-white/90 ${field.capitalize ? 'capitalize' : ''}`}>
                      {field.value || 'Not provided'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Committee Preferences */}
          <motion.div variants={itemVariants} className="glass-card hover:border-white/20 transition-colors p-6 flex flex-col group">
             <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <Users className="w-5 h-5 text-purple-400/80 group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">Academic Preferences</h3>
              </div>
               <div className="px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/20">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Allocation</span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Priority 1', value: application?.committee_preference1, color: 'text-gold-400', weight: 'font-bold' },
                { label: 'Priority 2', value: application?.committee_preference2, color: 'text-white/80', weight: 'font-medium' },
                { label: 'Priority 3', value: application?.committee_preference3, color: 'text-white/80', weight: 'font-medium' },
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-white/5 rounded-md flex items-center justify-center text-[10px] font-bold text-white/40 border border-white/10">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{pref.label}</span>
                  </div>
                  <span className={`text-sm ${pref.weight} ${pref.color} tracking-tight`}>
                    {pref.value || 'No selection'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-blue-400/5 border border-blue-400/10">
              <div className="flex items-start space-x-3">
                <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  Note: Preferences are taken into account but final allocation depends on country availability and delegate background.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

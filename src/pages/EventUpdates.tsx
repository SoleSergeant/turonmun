import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';

const EventUpdates = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Event Updates | TuronMUN</title>
        <meta name="description" content="Latest information about TuronMUN committees and schedule." />
      </Helmet>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-diplomatic-800 mb-4">
            Event Updates
          </h1>
          <p className="text-lg text-diplomatic-600 max-w-2xl mx-auto">
            Stay informed about the latest developments for TuronMUN Season 1, including committee information and event schedules.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Committees Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="h-48 bg-diplomatic-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-diplomatic-800 to-diplomatic-600 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/images/committees/unga.png" 
                  alt="Committees" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-display font-bold text-diplomatic-800 mb-3">Committees</h2>
              <p className="text-diplomatic-600 mb-6">
                Explore the various committees that will be part of TuronMUN Season 1, including topics, background guides, and committee structures.
              </p>
              <Link 
                to="/committees" 
                className="inline-flex items-center text-gold-500 font-medium hover:text-gold-600 transition-colors"
              >
                View Committees <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Schedule Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="h-48 bg-gold-400 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gold-500 to-gold-300 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-display font-bold text-diplomatic-800 mb-3">Schedule</h2>
              <p className="text-diplomatic-600 mb-6">
                View the complete schedule for TuronMUN Season 1, including opening and closing ceremonies, committee sessions, and social events.
              </p>
              <Link 
                to="/schedule" 
                className="inline-flex items-center text-gold-500 font-medium hover:text-gold-600 transition-colors"
              >
                View Schedule <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default EventUpdates;

import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegistrationSelection = () => {
  return (
    <div className="page-transition-container min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <div className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700 min-h-screen">
          <div className="absolute inset-0 opacity-50"></div>

          <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
            <div className="w-full max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                {/* Closed Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-8 w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-400/40 flex items-center justify-center"
                >
                  <Clock className="w-12 h-12 text-red-400" />
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                  Registration Closed
                </h1>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 mb-8"
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-gold-400" />
                    <span className="text-gold-400 font-semibold text-lg">Deadline Has Passed</span>
                  </div>
                  
                  <p className="text-xl text-white/80 max-w-2xl mx-auto mb-6">
                    The registration deadline for TuronMUN 2026 Season 6 has passed. 
                    All applications are now closed for Delegate, Chair, and Observer roles.
                  </p>

                  <p className="text-white/60 max-w-xl mx-auto">
                    Thank you for your interest! Follow us on social media for updates on future conferences and events.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm"
                  >
                    Back to Home
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 bg-gold-500 hover:bg-gold-600 text-black border border-gold-400"
                  >
                    Contact Us
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegistrationSelection;
import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegistrationSelection = () => {
  return (
    <div className="page-transition-container min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <div className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700 min-h-screen">
          <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
                  Apply Now
                </h1>
                <p className="text-white/70 text-lg max-w-xl mx-auto">
                  Choose your role for the upcoming TuronMUN season and begin your application.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Delegate */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="relative block backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl p-8 opacity-60 cursor-not-allowed select-none">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                      <Users className="w-7 h-7 text-white/40" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Delegate</h2>
                    <p className="text-white/40 text-sm mb-6">
                      Represent a country in one of our committees. Debate, draft resolutions, and practise diplomacy.
                    </p>
                    <span className="inline-flex items-center gap-2 text-white/30 font-semibold text-sm">
                      Coming Soon
                    </span>
                  </div>
                </motion.div>

                {/* Chair */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="relative block backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl p-8 opacity-60 cursor-not-allowed select-none">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                      <Shield className="w-7 h-7 text-white/40" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Chair / Staff</h2>
                    <p className="text-white/40 text-sm mb-6">
                      Lead a committee as a chair or join the secretariat. Applications open separately.
                    </p>
                    <span className="inline-flex items-center gap-2 text-white/30 font-semibold text-sm">
                      Coming Soon
                    </span>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center mt-10"
              >
                <Link to="/" className="text-white/50 hover:text-white/80 text-sm transition-colors">
                  ← Back to Home
                </Link>
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

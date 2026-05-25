import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Shield, Bell, Calendar, ArrowRight, Send } from 'lucide-react';
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
                className="text-center mb-10"
              >
                {/* Status badge */}
                <span className="inline-block mb-5 px-4 py-1.5 rounded-full bg-gold-500/20 border border-gold-400/30 text-gold-300 text-sm font-semibold tracking-wide uppercase">
                  Season 7 — Applications Opening Soon
                </span>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
                  Apply for Season 7
                </h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto">
                  We're preparing the next chapter of TuronMUN. Applications for delegates and chairs will open shortly — follow us to be the first to know.
                </p>
              </motion.div>

              {/* Role cards — preview, not interactive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
                {/* Delegate */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="relative backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl p-8 select-none"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-white/60" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Delegate</h2>
                  <p className="text-white/50 text-sm mb-5">
                    Represent a country in one of our committees. Debate, draft resolutions, and practise diplomacy.
                  </p>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-semibold">
                    <Bell className="w-3 h-3" /> Coming Soon
                  </span>
                </motion.div>

                {/* Chair */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl p-8 select-none"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                    <Shield className="w-7 h-7 text-white/60" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Chair / Staff</h2>
                  <p className="text-white/50 text-sm mb-5">
                    Lead a committee as a chair or join the secretariat. Applications open separately.
                  </p>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-semibold">
                    <Bell className="w-3 h-3" /> Coming Soon
                  </span>
                </motion.div>
              </div>

              {/* Action row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              >
                <a
                  href="https://t.me/TuronMUN"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Get notified on Telegram
                </a>
                <Link
                  to="/committees"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20"
                >
                  <Calendar className="w-4 h-4" />
                  View Committees
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center"
              >
                <Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
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

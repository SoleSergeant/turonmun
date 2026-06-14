import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Shield, Heart, Eye, Bell, Calendar, ArrowRight, Send, Clock, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CountdownMini from '../components/CountdownMini';
import { useFormSettings } from '@/hooks/useFormSettings';

const RegistrationSelection = () => {
  const { settings: delegateSettings, isEffectivelyClosed: delegateClosed, loading: delegateLoading, notOpenYet: delegateNotOpenYet } = useFormSettings('delegate');
  const { settings: chairSettings, isEffectivelyClosed: chairClosed, loading: chairLoading } = useFormSettings('chair');
  const { settings: volunteerSettings, isEffectivelyClosed: volunteerClosed, loading: volunteerLoading } = useFormSettings('volunteer');

  const loading = delegateLoading || chairLoading || volunteerLoading;
  const allClosed = delegateClosed && chairClosed && volunteerClosed;

  // Countdown: prefer the "opens in" countdown when a future opens_at is set,
  // otherwise show "closes in" while the form is open and a deadline is set.
  const now = Date.now();
  const deadline = delegateSettings?.deadline ? new Date(delegateSettings.deadline) : null;
  const opensAt = delegateSettings?.opens_at ? new Date(delegateSettings.opens_at) : null;
  let countdown: { target: Date; label: string; accent: 'gold' | 'emerald' | 'amber' } | null = null;
  if (delegateNotOpenYet && opensAt) {
    countdown = { target: opensAt, label: 'Applications open in', accent: 'emerald' };
  } else if (!delegateClosed && deadline && deadline.getTime() > now) {
    countdown = { target: deadline, label: 'Applications close in', accent: 'amber' };
  }

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
                  {loading
                    ? 'Loading…'
                    : allClosed
                      ? 'Season 7 — Applications Opening Soon'
                      : 'Season 7 — Applications Open'}
                </span>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
                  Apply for Season 7
                </h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto">
                  {allClosed
                    ? "We're preparing the next chapter of TuronMUN. Applications for delegates, chairs, and volunteers will open shortly — follow us to be the first to know."
                    : 'Choose your role below and begin your TuronMUN journey.'}
                </p>
              </motion.div>

              {/* Open/Close countdown */}
              {!loading && countdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="flex justify-center mb-10"
                >
                  <CountdownMini targetDate={countdown.target} label={countdown.label} accent={countdown.accent} />
                </motion.div>
              )}

              {/* Role cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-10">
                {/* Delegate */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`relative backdrop-blur-lg bg-white/5 border rounded-3xl p-8 transition-all ${
                    !delegateClosed
                      ? 'border-white/30 hover:bg-white/10 hover:border-white/40'
                      : 'border-white/10 select-none'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                    <Users className={`w-7 h-7 ${!delegateClosed ? 'text-white' : 'text-white/60'}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Delegate</h2>
                  <p className="text-white/50 text-sm mb-5">
                    Represent a country in one of our committees. Debate, draft resolutions, and practise diplomacy.
                  </p>

                  {loading ? (
                    <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
                  ) : delegateClosed ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-semibold">
                      <Bell className="w-3 h-3" /> Coming Soon
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {delegateSettings?.deadline && (
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(delegateSettings.deadline).toLocaleDateString()}
                        </p>
                      )}
                      <Link
                        to="/register/delegate"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-diplomatic-900 text-sm font-bold hover:bg-white/90 transition-colors"
                      >
                        Apply Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </motion.div>

                {/* Chair */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={`relative backdrop-blur-lg bg-white/5 border rounded-3xl p-8 transition-all ${
                    !chairClosed
                      ? 'border-white/30 hover:bg-white/10 hover:border-white/40'
                      : 'border-white/10 select-none'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                    <Shield className={`w-7 h-7 ${!chairClosed ? 'text-white' : 'text-white/60'}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Chair</h2>
                  <p className="text-white/50 text-sm mb-5">
                    Lead a committee as a chair. Shape the debate and guide delegates through the session.
                  </p>

                  {loading ? (
                    <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
                  ) : chairClosed ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-semibold">
                      <Bell className="w-3 h-3" /> Coming Soon
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {chairSettings?.deadline && (
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(chairSettings.deadline).toLocaleDateString()}
                        </p>
                      )}
                      <Link
                        to="/register/chair"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-diplomatic-900 text-sm font-bold hover:bg-white/90 transition-colors"
                      >
                        Apply Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </motion.div>

                {/* Volunteer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className={`relative backdrop-blur-lg bg-white/5 border rounded-3xl p-8 transition-all ${
                    !volunteerClosed
                      ? 'border-white/30 hover:bg-white/10 hover:border-white/40'
                      : 'border-white/10 select-none'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                    <Heart className={`w-7 h-7 ${!volunteerClosed ? 'text-white' : 'text-white/60'}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Volunteer</h2>
                  <p className="text-white/50 text-sm mb-5">
                    Help run the conference behind the scenes. Logistics, hospitality, press, and more.
                  </p>

                  {loading ? (
                    <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
                  ) : volunteerClosed ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-semibold">
                      <Bell className="w-3 h-3" /> Coming Soon
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {volunteerSettings?.deadline && (
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(volunteerSettings.deadline).toLocaleDateString()}
                        </p>
                      )}
                      <Link
                        to="/register/volunteer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-diplomatic-900 text-sm font-bold hover:bg-white/90 transition-colors"
                      >
                        Apply Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </motion.div>

                {/* Observer — external Google Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative backdrop-blur-lg bg-white/5 border border-white/30 hover:bg-white/10 hover:border-white/40 rounded-3xl p-8 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Observer</h2>
                  <p className="text-white/50 text-sm mb-5">
                    Attend the conference as an observer. Watch debates, take notes, and learn from the floor.
                  </p>
                  <a
                    href="https://forms.gle/95J7rWqQoTEvo2Rr7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-diplomatic-900 text-sm font-bold hover:bg-white/90 transition-colors"
                  >
                    Apply Now <ExternalLink className="w-4 h-4" />
                  </a>
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
                  Follow us on Telegram
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

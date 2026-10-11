import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomButton } from './ui/custom-button';
import { transitionVariants } from '@/lib/transition-utils';
import { useContent } from '@/content/store';
import { useFormSettings } from '@/hooks/useFormSettings';
import CountdownMini from './CountdownMini';

const Hero = () => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const season = useContent('next_season');
  const hero = useContent('hero');
  const phrases = hero.phrases.length > 0 ? hero.phrases : [''];
  const { settings: delegateSettings, isEffectivelyClosed: delegateClosed, notOpenYet } = useFormSettings('delegate');

  // Countdown logic:
  //  - "Applications open in" → opens_at in the future (form not open yet)
  //  - "Applications close in" → form open + deadline in the future
  const _now = Date.now();
  const _deadline = delegateSettings?.deadline ? new Date(delegateSettings.deadline) : null;
  const _opensAt = delegateSettings?.opens_at ? new Date(delegateSettings.opens_at) : null;
  let countdown: { target: Date; label: string; accent: 'gold' | 'emerald' | 'amber' } | null = null;
  if (notOpenYet && _opensAt) {
    countdown = { target: _opensAt, label: 'Applications open in', accent: 'emerald' };
  } else if (!delegateClosed && _deadline && _deadline.getTime() > _now) {
    countdown = { target: _deadline, label: 'Applications close in', accent: 'amber' };
  }
  const typingSpeed = 100; // ms per character
  const deletingSpeed = 50; // ms per character when deleting
  const pauseDuration = 1500; // pause between phrases
  const pauseBeforeNew = 800; // pause before starting a new phrase

  useEffect(() => {
    setIsVisible(true);

    const handleTyping = () => {
      const currentFullPhrase = phrases[phraseIndex % phrases.length];

      if (!isDeleting && currentPhrase !== currentFullPhrase) {
        setCurrentPhrase(currentFullPhrase.substring(0, currentPhrase.length + 1));
        return typingSpeed;
      }
      else if (!isDeleting && currentPhrase === currentFullPhrase) {
        setIsDeleting(true);
        return pauseDuration;
      }
      else if (isDeleting && currentPhrase !== '') {
        setCurrentPhrase(currentPhrase.substring(0, currentPhrase.length - 1));
        return deletingSpeed;
      }
      else if (isDeleting && currentPhrase === '') {
        setIsDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
        return pauseBeforeNew;
      }

      return typingSpeed;
    };

    const timeout = setTimeout(() => {
      const nextDelay = handleTyping();
      if (nextDelay) clearTimeout(timeout);
      return setTimeout(() => handleTyping(), nextDelay);
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentPhrase, isDeleting, phraseIndex, phrases]);

  // Background animation variants
  const backgroundVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 0.05,
      transition: {
        duration: 2,
        ease: [0.25, 0.1, 0.25, 1] as const
      }
    }
  };

  // Subtle floating light particles. Generated once: the typing effect
  // re-renders every ~100 ms and must not restart their animations.
  const particles = useMemo(() => Array.from({ length: 10 }).map((_, index) => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    return {
      id: index,
      size: Math.random() * 1.5 + 1,
      opacity: Math.random() * 0.18 + 0.06,
      duration: Math.random() * 60 + 70,
      delay: Math.random() * 12,
      initial: { x, y },
      animate: {
        y: [y, y - 40 - Math.random() * 30, y + 40 + Math.random() * 30, y],
        x: [x, x + 40 + Math.random() * 30, x - 40 - Math.random() * 30, x],
      },
    };
  }), []);

  // While nothing is announced, the season card is a short "coming soon" note
  // instead of four rows of TBD.
  const isUnknown = (v: string) => !v || /^(tbd|tba|to be announced)$/i.test(v.trim());
  const details = [
    { icon: Calendar, label: 'Date',     value: season.date_text },
    { icon: Clock,    label: 'Duration', value: season.duration_text },
    { icon: MapPin,   label: 'Location', value: season.location_text },
    { icon: Users,    label: 'Delegates', value: season.delegates_text },
  ];
  const announced = details.filter(d => !isUnknown(d.value));
  const subtitle = season.subtitle && season.subtitle.replace(/[!.]/g, '').toLowerCase() !== (season.badge_label || '').replace(/[!.]/g, '').toLowerCase()
    ? season.subtitle : null;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-diplomatic-900 via-diplomatic-800 to-diplomatic-700 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:py-16">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-world-map bg-no-repeat bg-center opacity-5"
          variants={backgroundVariants}
          initial="initial"
          animate="animate"
        />

        {/* Subtle floating light particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gold-400"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size}px rgba(247, 163, 28, 0.15)`
            }}
            initial={particle.initial}
            animate={particle.animate}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.delay
            }}
          />
        ))}

        <motion.div
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-diplomatic-600 blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gold-400 blur-3xl"
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.04, 0.07, 0.04],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 md:gap-10 items-center">
          <motion.div
            variants={transitionVariants.containerVariants}
            initial="initial"
            animate="animate"
            className="text-white px-4 sm:px-0"
          >
            <motion.span
              variants={transitionVariants.slideInDown}
              className="inline-block px-4 py-2 rounded-full glass-panel text-sm font-medium mb-4 md:mb-6 border border-gold-400/30 shadow-gold"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-gradient-gold">{hero.eyebrow}</span>
            </motion.span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
              <motion.span
                variants={transitionVariants.slideInLeft}
                className="block text-white whitespace-nowrap"
              >
                <span className="text-gradient-gold">TuronMUN</span>
              </motion.span>
              <motion.span
                variants={transitionVariants.fadeVariants}
                className="block text-white/90 mt-2 min-h-[40px] text-base sm:text-xl md:text-2xl lg:text-3xl"
              >
                {currentPhrase}
                <span className="animate-pulse ml-1 text-gold-400">|</span>
              </motion.span>
            </h1>

            <motion.p
              variants={transitionVariants.slideInLeft}
              className="text-sm sm:text-base md:text-lg text-white/80 mb-6 md:mb-8 max-w-xl"
            >
              {hero.intro}
            </motion.p>

            <motion.div
              variants={transitionVariants.containerVariants}
              className="flex flex-wrap gap-3 md:gap-4 mb-8 lg:mb-0"
            >
              <motion.div
                variants={transitionVariants.itemVariants}
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 10
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <CustomButton to="/register" variant="accent" size="lg" className="group w-full sm:w-auto">
                  {hero.apply_button}
                  <ChevronRight className="transition-transform group-hover:translate-x-1" size={16} />
                </CustomButton>
              </motion.div>

              <motion.div
                variants={transitionVariants.itemVariants}
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 10
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <CustomButton
                  to="/committees"
                  variant="outline"
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 w-full sm:w-auto"
                >
                  {hero.committees_button}
                </CustomButton>
              </motion.div>
            </motion.div>
            <motion.div
              className="mt-6 hidden md:block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <style>{`@keyframes hero-badges-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
              <div className="relative overflow-hidden rounded-full glass-panel border border-gold-400/20 shadow-gold">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-400/5 via-diplomatic-400/5 to-gold-400/5 pointer-events-none" />
                {/* Fade masks on edges */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-diplomatic-900/60 to-transparent z-10 pointer-events-none rounded-l-full" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-diplomatic-900/60 to-transparent z-10 pointer-events-none rounded-r-full" />
                <div
                  className="flex items-center gap-8 px-6 py-3 text-xs sm:text-sm text-white/90 whitespace-nowrap relative z-0"
                  style={{ animation: 'hero-badges-marquee 32s linear infinite' }}
                >
                  {/* Two identical sets — second set makes it loop seamlessly */}
                  {[0, 1].map(set => (
                    <React.Fragment key={set}>
                      {hero.accolades.map(text => (
                        <span key={text} className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-400" />{text}</span>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative w-full max-w-md lg:max-w-none mx-auto px-4 sm:px-0"
            variants={transitionVariants.scaleVariants}
            initial="initial"
            animate="animate"
          >
            <div className="relative z-10 glass-card p-2 sm:p-3 shadow-2xl">
              <div className="relative z-10 bg-diplomatic-800/80 backdrop-blur-sm rounded-lg p-5 sm:p-6 border border-white/5">

                {/* Header */}
                <motion.div
                  className="text-center mb-5 relative z-10"
                  variants={transitionVariants.fadeVariants}
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 text-xs font-semibold uppercase tracking-widest mb-3">
                    <Sparkles size={11} />
                    {season.badge_label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">
                    {season.heading}
                  </h2>
                  {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
                </motion.div>

                {/* Info rows */}
                {announced.length === 0 ? (
                  <p className="relative z-10 mb-5 text-center text-sm text-white/60">Dates and venue will be announced soon.</p>
                ) : (
                <motion.div
                  variants={transitionVariants.staggerContainerVariants}
                  className="space-y-3 relative z-10 mb-5"
                >
                  {announced.map(({ icon: Icon, label, value }) => (
                    <motion.div
                      key={label}
                      variants={transitionVariants.staggerItemVariants}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <Icon className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span className="text-white/50 w-16 flex-shrink-0">{label}</span>
                      <span className="text-white font-medium">{value}</span>
                    </motion.div>
                  ))}
                </motion.div>
                )}

                {/* Open/Close countdown */}
                {countdown && (
                  <div className="flex justify-center mb-5 relative z-10">
                    <CountdownMini targetDate={countdown.target} label={countdown.label} accent={countdown.accent} />
                  </div>
                )}

                {/* Apply button */}
                <motion.div
                  variants={transitionVariants.fadeVariants}
                  className="relative z-10"
                >
                  <Link
                    to="/register"
                    className="block w-full text-center border border-gold-400/50 text-gold-300 hover:bg-gold-400/10 font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
                  >
                    {season.apply_label}
                  </Link>
                </motion.div>

                {/* Footer link */}
                <motion.div
                  className="mt-4 pt-4 border-t border-white/10 text-center relative z-10"
                  variants={transitionVariants.fadeVariants}
                >
                  <Link
                    to="/past-conferences"
                    className="text-white/40 hover:text-gold-400 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    View past seasons
                    <ChevronRight size={12} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

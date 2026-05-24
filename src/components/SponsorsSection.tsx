import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { CustomButton } from './ui/custom-button';

type Sponsor = { name: string; src: string };

const defaultSponsors: Sponsor[] = [
  { name: 'Sponsor 1', src: '/logos/logo1.png' },
  { name: 'Sponsor 2', src: '/logos/logo2.png' },
  { name: 'Sponsor 4', src: '/logos/logo4.png' },
  { name: 'Sponsor 5', src: '/logos/logo5.png' },
  { name: 'Sponsor 6', src: '/logos/logo6.png' },
];

const MARQUEE_DURATION_S = 40;
const SLIDE_GAP_PX = 20;

const SponsorsSection = () => {
  const [sponsorLogos, setSponsorLogos] = useState<Sponsor[]>(defaultSponsors);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/sponsors.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Sponsor[] | null) => {
        if (Array.isArray(data) && data.length > 0) {
          setSponsorLogos(data);
        }
      })
      .catch(() => {
      });
  }, []);

  const marqueeItems = [...sponsorLogos, ...sponsorLogos];
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-diplomatic-900 via-diplomatic-950 to-black overflow-hidden">
      <div className="absolute inset-0 opacity-30 blur-3xl bg-[radial-gradient(circle_at_top,_rgba(255,215,141,0.3),_transparent_60%)] pointer-events-none" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-gold-300 text-sm font-semibold uppercase tracking-wide mb-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles size={16} />
            Proud Partners
          </motion.div>

          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Sponsors Powering <span className="text-gradient-gold">TuronMUN</span>
          </motion.h2>

          <motion.p 
            className="text-white/75 text-base sm:text-lg leading-relaxed mb-10"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Our Season 6 partners help us deliver immersive diplomatic simulations, scholarships, and a world-class experience for every delegate. Explore the brands shaping the future with us.
          </motion.p>
        </div>

        <div 
          className="max-w-6xl mx-auto select-none"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          <div className="overflow-hidden">
            <div
              className="flex items-stretch"
              style={{ gap: `${SLIDE_GAP_PX}px`, animation: `marquee ${MARQUEE_DURATION_S}s linear infinite`, animationPlayState: paused ? 'paused' : 'running' }}
            >
              {marqueeItems.map((logo, idx) => (
                <div key={`${logo.name}-${idx}`} className="min-w-0 flex-[0_0_70%] sm:flex-[0_0_40%] md:flex-[0_0_28%] lg:flex-[0_0_20%]">
                  <motion.a
                    href={(logo as any).url || undefined}
                    target={((logo as any).url && '_blank') || undefined}
                    rel={((logo as any).url && 'noreferrer') || undefined}
                    className="group block"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-6 flex items-center justify-center shadow-lg shadow-black/30 transition-all will-change-transform">
                      <motion.div
                        whileHover={{ scale: 1.03, rotateX: 2, rotateY: -2 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img
                          src={logo.src}
                          alt={logo.name}
                          loading="lazy"
                          className="h-16 sm:h-20 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                      </motion.div>
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-diplomatic-400/0 via-diplomatic-400/30 to-diplomatic-400/0 opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity" />
                    </div>
                  </motion.a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-white/80"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="text-center sm:text-left max-w-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-gold-300 mb-1">Become A Sponsor</p>
            <p className="text-base sm:text-lg text-white/80">
              Partner with TuronMUN Season 6 to inspire the next generation of diplomats through workshops, scholarships, and immersive experiences.
            </p>
          </div>

          <CustomButton 
            to="/contact"
            variant="accent"
            size="lg"
            className="group shadow-lg shadow-gold-400/30"
          >
            Sponsor With Us
            <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
          </CustomButton>
        </motion.div>
      </div>
    </section>
  );
};

export default SponsorsSection;


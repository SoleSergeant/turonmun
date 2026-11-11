
import React, { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Seo } from '../components/seo';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import CommitteesSection from '../components/CommitteesSection';
import SchedulePreview from '../components/SchedulePreview';
import FAQSection from '../components/FAQSection';
import SponsorsSection from '../components/SponsorsSection';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import { usePastSeasons } from '@/content/seasons';


const Index = () => {
  const seasons = usePastSeasons();
  const latestSeason = seasons[seasons.length - 1];
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Pointer glow: mouse devices only, at most one update per frame, and the
  // position is set on the glow itself so the rest of the page isn't restyled.
  // Phones never get the glow layer at all: a full-screen blended layer is costly to draw.
  const [hasMouse] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMouse) return;
    let frame = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        glowRef.current?.style.setProperty('--cursor-x', `${(e.clientX / window.innerWidth) * 100}%`);
        glowRef.current?.style.setProperty('--cursor-y', `${(e.clientY / window.innerHeight) * 100}%`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frame);
    };
  }, [hasMouse]);

  // Animation variants for staggered reveals
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className="page-transition-container min-h-screen flex flex-col"
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Seo 
        event={latestSeason && {
          name: `TuronMUN ${latestSeason.title}`,
          startDate: latestSeason.date,
          endDate: latestSeason.endDate || latestSeason.date,
          location: latestSeason.location,
          description: latestSeason.description,
        }}
      />
      {hasMouse && <div ref={glowRef} className="cursor-highlight" aria-hidden="true" />}
      <Navbar />
      <motion.main
        variants={containerVariants}
        animate="visible"
      >
        <Hero />

        <motion.div variants={sectionVariants}>
          <ErrorBoundary label="About section">
            <AboutSection />
          </ErrorBoundary>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <ErrorBoundary label="Committees section">
            <CommitteesSection />
          </ErrorBoundary>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <ErrorBoundary label="Schedule preview">
            <SchedulePreview />
          </ErrorBoundary>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <ErrorBoundary label="Sponsors section">
            <SponsorsSection />
          </ErrorBoundary>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <ErrorBoundary label="FAQ section">
            <FAQSection />
          </ErrorBoundary>
        </motion.div>
      </motion.main>
      
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Footer />
      </motion.div>
    </motion.div>
  );
};

export default Index;

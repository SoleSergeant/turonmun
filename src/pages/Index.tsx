
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Seo } from '../components/seo';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import CommitteesSection from '../components/CommitteesSection';
import SchedulePreview from '../components/SchedulePreview';
import FAQSection from '../components/FAQSection';
import SponsorsSection from '../components/SponsorsSection';
import Footer from '../components/Footer';
import { seasonsData } from '../data/seasonsData';

// Get the latest season data
const latestSeason = seasonsData[seasonsData.length - 1];

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cursor highlight & magnetic effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--cursor-x', `${xPercent}%`);
      document.documentElement.style.setProperty('--cursor-y', `${yPercent}%`);
    };

    const handleMagneticMove = (e: MouseEvent) => {
      const targets = document.querySelectorAll<HTMLElement>('[data-magnetic="true"]');
      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        const strength = 0.08;
        el.style.transform = `translate3d(${relX * strength}px, ${relY * strength}px, 0)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleMagneticMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleMagneticMove);
    };
  }, []);

  // Animation variants for staggered reveals
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const sectionVariants = {
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Seo 
        title="TuronMUN - Model United Nations Conference"
        description="Join TuronMUN for an enriching Model United Nations experience. Develop diplomacy, debate, and leadership skills with students from around the world."
        event={{
          name: `TuronMUN ${latestSeason.title}`,
          startDate: latestSeason.date,
          endDate: latestSeason.endDate || latestSeason.date,
          location: latestSeason.location,
          description: latestSeason.description,
        }}
      />
      <div className="cursor-highlight" aria-hidden="true" />
      <Navbar />
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Hero />
        
        <motion.div variants={sectionVariants}>
          <AboutSection />
        </motion.div>
        
        <motion.div variants={sectionVariants}>
          <CommitteesSection />
        </motion.div>
        
        <motion.div variants={sectionVariants}>
          <SchedulePreview />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <SponsorsSection />
        </motion.div>
        
        <motion.div variants={sectionVariants}>
          <FAQSection />
        </motion.div>
      </motion.main>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Footer />
      </motion.div>
    </motion.div>
  );
};

export default Index;

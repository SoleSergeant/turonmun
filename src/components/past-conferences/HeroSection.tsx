import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeasonData } from '@/data/seasonsData';

interface HeroSectionProps {
  selectedSeason: SeasonData;
  activeTab: string;
  setActiveTab: (value: string) => void;
  getPatternBackground: () => string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  selectedSeason,
  activeTab,
  setActiveTab,
  getPatternBackground
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className={`relative py-20 md:py-32 overflow-hidden ${selectedSeason.lightBg} transition-colors duration-300 z-0`}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1.2 }}
        className={`absolute inset-0 ${getPatternBackground()} opacity-20 pointer-events-none`}
      />
      <div className="container relative mx-auto px-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants}>
            <Badge variant="outline" className={`mb-4 ${selectedSeason.borderColor} ${selectedSeason.textColor}`}>
              Season {selectedSeason.year}
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r ${selectedSeason.color}`}
          >
            Past Conferences
          </motion.h1>
          
          <motion.div
            variants={itemVariants}
            className="text-lg md:text-xl text-neutral-600 mb-10 max-w-3xl mx-auto"
          >
            <p>{selectedSeason.description}</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mb-8">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="bg-white/70 backdrop-blur-sm border shadow-sm w-full max-w-md mx-auto rounded-lg">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="team">Organizers</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

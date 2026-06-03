import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Globe2, Users, Award, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeasonData } from '@/data/seasonsData';

interface SeasonOverviewProps {
  season: SeasonData;
}

const SeasonOverview: React.FC<SeasonOverviewProps> = ({ season }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const highlightVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-20"
    >
      <motion.div 
        variants={itemVariants}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-white shadow-sm">
          <div className={`${season.accentColor} p-3 rounded-full text-white`}>
            <Calendar size={24} />
          </div>
        </div>
        <h1 className={`text-4xl md:text-5xl font-bold ${season.textColor}`}>
          Season {season.year}
        </h1>
        <div className="w-20 h-1 mx-auto my-6 rounded-full bg-gradient-to-r from-diplomatic-400 to-diplomatic-600"></div>
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-700 dark:text-neutral-200">
          {season.theme}
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <motion.div variants={itemVariants}>
          <div className={`p-8 rounded-2xl ${season.lightBg} shadow-lg border border-white/50 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
              <Globe2 size={128} />
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${season.textColor}`}>Conference Overview</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 leading-relaxed">
              {season.description}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white/70 dark:bg-neutral-800/70 px-4 py-2 rounded-full">
                <Users className="text-diplomatic-600" size={18} />
                <span className="text-sm font-medium">{season.statistics.participants} Participants</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-neutral-800/70 px-4 py-2 rounded-full">
                <Globe2 className="text-diplomatic-600" size={18} />
                <span className="text-sm font-medium">{season.statistics.countries} Countries</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-neutral-800/70 px-4 py-2 rounded-full">
                <FileText className="text-diplomatic-600" size={18} />
                <span className="text-sm font-medium">{season.statistics.resolutions} Resolutions</span>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button 
                variant="default" 
                className={`group ${season.accentColor} hover:brightness-110 text-white`}
              >
                Conference Resources
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className={`p-8 rounded-2xl bg-white dark:bg-neutral-800 shadow-lg border ${season.borderColor} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
              <Award size={128} />
            </div>
            <h3 className={`text-2xl font-bold mb-6 ${season.textColor}`}>Season Highlights</h3>
            
            <motion.ul 
              variants={containerVariants}
              className="space-y-4"
            >
              {season.highlights.map((highlight, index) => (
                <motion.li 
                  key={index}
                  variants={highlightVariants}
                  className="flex items-start gap-3"
                >
                  <div className={`${season.lightBg} ${season.textColor} p-1 rounded-full mt-1 flex-shrink-0`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300">{highlight}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SeasonOverview;

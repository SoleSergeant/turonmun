
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, Map, Calendar, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from './StatCard';
import { SeasonData } from '@/data/seasonsData';

interface SeasonStatisticsProps {
  season: SeasonData;
}

const SeasonStatistics: React.FC<SeasonStatisticsProps> = ({ season }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="text-center mb-12">
        <h2 className={`text-3xl font-bold ${season.textColor}`}>
          Season {season.year} Statistics
        </h2>
        <p className="text-neutral-600 mt-3 max-w-2xl mx-auto">
          Exploring the numbers behind our {season.year} conference, highlighting our global reach and impact.
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16"
      >
        <motion.div variants={itemVariants}>
          <StatCard 
            value={season.statistics.participants} 
            label="Participants"
            icon={<Users className="w-8 h-8" />}
            color={season.lightBg}
            textColor={season.textColor}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            value={season.statistics.countries} 
            label="Countries"
            icon={<Globe className="w-8 h-8" />}
            color={season.lightBg}
            textColor={season.textColor}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            value={season.statistics.committees} 
            label="Committees"
            icon={<Map className="w-8 h-8" />}
            color={season.lightBg}
            textColor={season.textColor}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            value={season.statistics.resolutions} 
            label="Resolutions"
            icon={<Calendar className="w-8 h-8" />}
            color={season.lightBg}
            textColor={season.textColor}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            value={season.statistics.awards} 
            label="Awards"
            icon={<Award className="w-8 h-8" />}
            color={season.lightBg}
            textColor={season.textColor}
          />
        </motion.div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`${season.lightBg} border-none shadow-md overflow-hidden group`}>
            <CardContent className="p-7">
              <h3 className={`text-xl font-bold mb-4 ${season.textColor}`}>Geographic Distribution</h3>
              <div className="h-64 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/70">
                <div className={`${season.mediumBg} p-4 rounded-lg shadow-sm transition-all duration-300 transform group-hover:scale-105`}>
                  <p className="text-neutral-700">Interactive map visualization would display here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`${season.lightBg} border-none shadow-md overflow-hidden group`}>
            <CardContent className="p-7">
              <h3 className={`text-xl font-bold mb-4 ${season.textColor}`}>Participation Growth</h3>
              <div className="h-64 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/70">
                <div className={`${season.mediumBg} p-4 rounded-lg shadow-sm transition-all duration-300 transform group-hover:scale-105`}>
                  <p className="text-neutral-700">Timeline chart of participation would display here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SeasonStatistics;

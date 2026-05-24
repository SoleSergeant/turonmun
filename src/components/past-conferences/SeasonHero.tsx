import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SeasonHeroProps {
  title: string;
  subtitle: string;
  background: string;
  color: string;
  accentColor: string;
}

const SeasonHero: React.FC<SeasonHeroProps> = ({ 
  title, 
  subtitle, 
  background, 
  color,
  accentColor
}) => {
  return (
    <section className={`relative py-24 md:py-32 overflow-hidden ${background}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-pattern-dots"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link 
              to="/past-conferences" 
              className={`inline-flex items-center ${color} hover:opacity-80 transition-opacity mb-6`}
            >
              <ArrowLeft size={16} className="mr-2" />
              <span className="text-sm font-medium">Back to All Seasons</span>
            </Link>
          </motion.div>
          
          <motion.h1 
            className={`text-4xl md:text-6xl font-bold mb-4 ${color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {title}
          </motion.h1>
          
          <motion.div 
            className="w-24 h-1 mx-auto my-6 rounded-full"
            style={{ background: `var(--${accentColor.replace('bg-', '')})` }}
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          
          <motion.h2 
            className={`text-xl md:text-2xl font-medium ${color} opacity-90 max-w-2xl mx-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {subtitle}
          </motion.h2>
        </div>
      </div>
    </section>
  );
};

export default SeasonHero;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { seasonsData } from '@/data/seasonsData';
import { ArrowRight } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

export default function PastConferences() {
  // Animation variants
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

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-diplomatic-50 to-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-pattern-dots"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-4 text-diplomatic-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Past Conferences
            </motion.h1>
            
            <motion.div 
              className="w-24 h-1 mx-auto my-6 rounded-full bg-gradient-to-r from-diplomatic-400 to-diplomatic-600"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            
            <motion.p 
              className="text-xl text-neutral-700 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Explore our previous conference seasons, each focused on critical global issues and featuring distinguished delegates from around the world.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Seasons List */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-10"
          >
            {seasonsData.map((season, index) => (
              <motion.div
                key={season.id}
                variants={itemVariants}
                className={`rounded-2xl overflow-hidden shadow-lg border border-white/50 hover:shadow-xl transition-shadow duration-300`}
              >
                <div className="grid md:grid-cols-2 items-center">
                  <div className="relative h-64 md:h-80 overflow-hidden">
                    <img 
                      src={`/${season.photos?.[0]?.url || 'seasons/placeholder.jpg'}`} 
                      alt={season.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        // Fallback to path without leading slash if absolute path fails
                        const rel = (season.photos?.[0]?.url) ? season.photos[0].url : 'seasons/placeholder.jpg';
                        if (img.src.endsWith(rel)) return; // avoid infinite loop
                        img.src = rel;
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${season.color} opacity-30`}></div>
                    <div className="absolute top-4 left-4 bg-white/90 text-diplomatic-800 font-bold px-4 py-2 rounded-full">
                      {season.title}
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-10">
                    <h2 className={`text-2xl md:text-3xl font-bold mb-1 ${season.textColor}`}>{season.theme}</h2>
                    <p className="text-neutral-500 text-sm mb-4">{season.date}{season.location ? ` • ${season.location}` : ''}</p>
                    
                    <p className="text-neutral-600 mb-6 line-clamp-3">
                      {season.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mb-8">
                      {season.statistics?.participants && (
                        <div className={`${season.lightBg} px-3 py-1 rounded-full text-sm font-medium ${season.textColor}`}>
                          {season.statistics.participants} Participants
                        </div>
                      )}
                      {season.statistics?.countries && (
                        <div className={`${season.lightBg} px-3 py-1 rounded-full text-sm font-medium ${season.textColor}`}>
                          {season.statistics.countries} Countries
                        </div>
                      )}
                      {season.statistics?.committees && (
                        <div className={`${season.lightBg} px-3 py-1 rounded-full text-sm font-medium ${season.textColor}`}>
                          {season.statistics.committees} Committees
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      to={season.route || (season.id === "turonmun-camu" ? "/seasons/camu" : `/seasons/Season${index + 1}`)} 
                      className={`inline-flex items-center ${season.accentColor} text-white px-6 py-3 rounded-lg font-medium hover:brightness-110 transition-all group`}
                    >
                      Explore {season.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}

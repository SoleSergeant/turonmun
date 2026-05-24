import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { seasonsData } from '@/data/seasonsData';
import PageLayout from '@/components/layout/PageLayout';
import SeasonOverview from '@/components/past-conferences/SeasonOverview';
import CallToAction from '@/components/past-conferences/CallToAction';
import { ArrowLeft, Activity, Heart, Users, Award } from 'lucide-react';
import ExperienceSection from '@/components/seasons/ExperienceSection';
import { Link } from 'react-router-dom';

export default function Season1() {
  // Get the season data for Season 1
  const seasonData = seasonsData.find(season => season.id === "season1") || seasonsData[0];
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 0.3,
        ease: "easeIn" 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <PageLayout>
      <motion.div
        key="season-1"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="bg-gradient-to-b from-white to-diplomatic-50"
      >
        {/* Hero Section - Health Theme */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-r from-diplomatic-600 to-diplomatic-800">
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0">
              {/* Health pattern */}
              <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M30,10 L70,10 L70,30 L90,30 L90,70 L70,70 L70,90 L30,90 L30,70 L10,70 L10,30 L30,30 Z" fill="#ffffff"/>
              </svg>
            </div>
          </div>
          
          {/* Floating health symbols animation */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`health-${i}`}
                className="absolute text-white/20"
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%", 
                  rotate: Math.random() * 20 - 10,
                  scale: 0.5 + Math.random() * 1
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  rotate: Math.random() * 20 - 10,
                }}
                transition={{ 
                  duration: 20 + Math.random() * 10, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <Activity size={24} />
              </motion.div>
            ))}
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <Link 
                to="/past-conferences" 
                className="inline-flex items-center text-white hover:text-diplomatic-100 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span className="text-sm font-medium">Back to All Seasons</span>
              </Link>
            </motion.div>

            <div className="max-w-4xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6"
              >
                <Activity size={32} className="text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-2 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {seasonData.title}
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-diplomatic-100 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {seasonData.date}
              </motion.p>
              
              <motion.div 
                className="w-24 h-1 mx-auto my-6 rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              
              <motion.h2 
                className="text-xl md:text-2xl font-medium text-white opacity-90 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {seasonData.theme}
              </motion.h2>
            </div>
          </div>

          {/* Curved bottom edge */}
          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z" fill="white"></path>
          </svg>
        </section>

        {/* Season Overview */}
        <section className="py-20 bg-white relative z-0">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2
                    }
                  }
                }}
              >
                <motion.div variants={itemVariants} className="mb-16">
                  <div className="flex items-center justify-center mb-6">
                    <div className="h-0.5 w-10 bg-diplomatic-200 rounded-full mr-4"></div>
                    <h2 className="text-diplomatic-600 font-semibold text-lg uppercase tracking-wider">Overview</h2>
                    <div className="h-0.5 w-10 bg-diplomatic-200 rounded-full ml-4"></div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800">
                    {seasonData.theme}
                  </h3>
                  
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 mb-6 text-center">
                      {seasonData.description}
                    </p>
                    
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-diplomatic-100 mb-8">
                      <h4 className="font-semibold text-lg text-center mb-4 text-diplomatic-700">Season Highlights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {seasonData.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 text-diplomatic-500 mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="ml-2 text-gray-700">{highlight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                      <div className="bg-gradient-to-br from-white to-diplomatic-50 p-6 rounded-xl shadow-sm border border-diplomatic-100 hover:shadow-md transition-shadow duration-300">
                        <div className="w-14 h-14 bg-gradient-to-br from-diplomatic-500 to-diplomatic-700 rounded-full flex items-center justify-center mb-4 mx-auto text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-center text-gray-800">Delegates</h4>
                        <p className="text-gray-600 text-center text-sm">
                          {seasonData.statistics.participants} passionate participants
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-white to-diplomatic-50 p-6 rounded-xl shadow-sm border border-diplomatic-100 hover:shadow-md transition-shadow duration-300">
                        <div className="w-14 h-14 bg-gradient-to-br from-diplomatic-500 to-diplomatic-700 rounded-full flex items-center justify-center mb-4 mx-auto text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-center text-gray-800">Committees</h4>
                        <p className="text-gray-600 text-center text-sm">
                          {seasonData.statistics.committees} specialized committees
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-white to-diplomatic-50 p-6 rounded-xl shadow-sm border border-diplomatic-100 hover:shadow-md transition-shadow duration-300">
                        <div className="w-14 h-14 bg-gradient-to-br from-diplomatic-500 to-diplomatic-700 rounded-full flex items-center justify-center mb-4 mx-auto text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-center text-gray-800">Location</h4>
                        <p className="text-gray-600 text-center text-sm">
                          {seasonData.statistics.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>


        {/* Experience Section */}
        <section className="relative py-20 bg-gradient-to-b from-diplomatic-900 to-diplomatic-800 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0dGVybiBpZD0icGF0dGVybi1iYXNlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIHNjYWxlKDAuMDUpIj48cGF0aCBkPSJNMCwwSDEwMFYxMDBIMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPiA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4tYmFzZSkiLz48L3N2Zz4=')]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-diplomatic-200 via-diplomatic-100 to-diplomatic-300 bg-clip-text text-transparent"
              >
                {seasonData.theme}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xl text-diplomatic-200 leading-relaxed font-light max-w-3xl mx-auto"
              >
                {seasonData.experience}
              </motion.p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              {/* Experience content */}
            </div>
          </div>
          
          {/* Gradient divider */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-diplomatic-900 to-transparent"></div>
        </section>

        {/* Conference Highlights Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-diplomatic-800 mb-4">Conference Highlights</h2>
              <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-6"></div>
              <p className="text-diplomatic-600 max-w-2xl mx-auto">Relive the memorable moments from our {seasonData.title} conference</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((num) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.5,
                    delay: num * 0.1
                  }}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <img
                    src={`/seasons/season 1/${num}.jpg`}
                    alt={`${seasonData.title} highlight ${num}`}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-1">
                        {seasonData.title} - Highlight #{num}
                      </h3>
                      <p className="text-diplomatic-200 text-sm">
                        {seasonData.date}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button className="bg-diplomatic-600 hover:bg-diplomatic-700 text-white font-medium py-3 px-8 rounded-full transition-colors duration-300 inline-flex items-center">
                View All Photos
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <CallToAction selectedSeason={seasonData} />
      </motion.div>
    </PageLayout>
  );
}

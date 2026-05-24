import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommitteeCard from '../components/CommitteeCard';
import NewsletterForm from '../components/NewsletterForm';
import { motion } from 'framer-motion';
import { Globe, FileBarChart, Landmark, Shield } from 'lucide-react';
import { useToast } from "../hooks/use-toast";
import { useCommittees } from '../hooks/useCommittees';

const Committees = () => {
  const { toast } = useToast();
  const { committees, loading } = useCommittees();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      <main className="flex-grow pt-20">
        <div className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-diplomatic-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gold-100 rounded-full opacity-20 blur-3xl"></div>
          
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-12 text-center"
            >
              <span className="inline-block px-3 py-1 bg-gold-100 text-gold-600 rounded-full text-sm font-medium mb-3">TURON x CAMU MUN</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-diplomatic-900 mb-6">
                Our Committees
              </h1>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Join one of our carefully designed committees to debate pressing international issues, develop diplomatic skills, and forge connections with fellow delegates.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
              {loading ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                committees.map((committee, index) => {
                  // Map icon based on abbreviation
                  const getIcon = (abbr?: string) => {
                    switch (abbr) {
                      case 'UNGA': return Globe;
                      case 'WTO': return FileBarChart;
                      case 'ECOSOC': return Landmark;
                      case 'HRC': return Shield;
                      default: return Globe;
                    }
                  };

                  return (
                    <motion.div
                      key={committee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="committee-detail-card h-96"
                    >
                      <CommitteeCard 
                        name={committee.name}
                        abbreviation={committee.abbreviation || ''}
                        description={committee.description}
                        topics={committee.topics}
                        imageUrl={committee.imageUrl}
                        icon={getIcon(committee.abbreviation)}
                        chairs={committee.chairs}
                      />
                    </motion.div>
                  );
                })
              )}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="glass-panel p-8 text-center max-w-3xl mx-auto"
            >
              <h3 className="text-2xl font-display font-semibold mb-4">Ready to Join the Deliberation?</h3>
              <p className="mb-6 text-neutral-600">
                Apply now to secure your place in one of our prestigious committees. Spaces are limited and allocated on a first-come, first-served basis.
              </p>
              <a 
                href="/register" 
                className="btn-primary bg-diplomatic-700 hover:bg-diplomatic-800 transition-colors duration-200"
              >
                Register as a Delegate
              </a>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Committees;

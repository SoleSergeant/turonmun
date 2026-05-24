import React from 'react';
import CommitteeCard from './CommitteeCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CustomButton } from './ui/custom-button';
import { useCommittees } from '../hooks/useCommittees';

export default function CommitteesSection() {
  const { committees, loading } = useCommittees();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <section className="section bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-hero-pattern opacity-5" />
      <div className="absolute -top-40 left-0 w-72 h-72 bg-diplomatic-200/40 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-64 h-64 bg-gold-200/50 blur-3xl rounded-full pointer-events-none" />
      
      {/* Reduce number of animated dots for better performance */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-diplomatic-300"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.2, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 6,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Simplify floating curved lines */}
      <motion.div
        className="absolute w-64 h-64 border-2 border-diplomatic-200/10 rounded-full"
        style={{ top: '10%', right: '5%' }}
        animate={{ 
          rotate: 360,
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="container relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.span 
              className="glass-panel px-4 py-2 text-sm font-medium text-diplomatic-700 border border-diplomatic-300/50 shadow-subtle mb-3 inline-block rounded-full"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              For Delegates
            </motion.span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-diplomatic-800">
              Our Committees
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-neutral-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Explore our diverse committees where you can debate critical global issues, forge diplomatic relationships, and develop leadership skills.
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            committees.map((committee, idx) => (
              <motion.div 
                key={committee.id}
                variants={itemVariants}
                custom={idx}
                className="h-96 premium-card-hover"
              >
                <CommitteeCard 
                  name={committee.name}
                  abbreviation={committee.abbreviation || ''}
                  description={committee.description}
                  topics={committee.topics}
                  imageUrl={committee.imageUrl}
                  chairs={committee.chairs}
                />
              </motion.div>
            ))
          )}
        </motion.div>
        
        <motion.div 
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-block premium-transition hover:-translate-y-1 hover:shadow-glow">
            <CustomButton 
              to="/committees" 
              variant="ghost"
              className="group"
            >
              <span>View All Committees</span>
              <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </CustomButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

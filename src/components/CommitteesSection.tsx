import React from 'react';
import CommitteeCard from './CommitteeCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { CustomButton } from './ui/custom-button';
import { useCommittees } from '../hooks/useCommittees';
import { useContent, useFill, rich } from '@/content/store';


export default function CommitteesSection() {
  const text = useContent('home_sections');
  const { committees } = useCommittees();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <section className="section bg-white relative overflow-hidden">
      <div className="container relative z-10">
        <motion.div 
          className="text-center mb-12"
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-4"
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-diplomatic-800">
              {text.committees_title}
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-neutral-600 max-w-2xl mx-auto"
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {text.committees_intro}
          </motion.p>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {committees.map((committee, idx) => (
            <motion.div
              key={committee.id}
              variants={itemVariants}
              custom={idx}
              className="h-full premium-card-hover"
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
          ))}
        </motion.div>
        
        <motion.div 
          className="text-center mt-10"
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
              <span>{text.committees_button}</span>
              <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </CustomButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

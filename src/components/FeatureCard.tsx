import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'outlined' | 'filled';
}

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  variant = 'default' 
}: FeatureCardProps) {
  
  const getStyles = () => {
    switch(variant) {
      case 'outlined':
        return {
          card: 'border border-diplomatic-100 hover:border-diplomatic-200 rounded-xl p-6 bg-white backdrop-blur-sm',
          iconBox: 'p-3 border border-diplomatic-100 rounded-xl bg-white text-diplomatic-700 mb-4 group-hover:bg-diplomatic-50'
        };
      case 'filled':
        return {
          card: 'bg-white/90 rounded-xl p-6 hover:bg-diplomatic-50/50 shadow-elegant transition-all duration-300 border border-neutral-100 backdrop-blur-sm',
          iconBox: 'p-3 bg-gradient-to-br from-diplomatic-50 to-diplomatic-100/80 rounded-xl text-diplomatic-700 mb-4 group-hover:from-diplomatic-100 group-hover:to-diplomatic-200/80'
        };
      default:
        return {
          card: 'bg-white/90 rounded-xl p-6 shadow-elegant hover:shadow-gold transition-all duration-300 border border-neutral-100 backdrop-blur-sm',
          iconBox: 'p-3 bg-gradient-to-br from-gold-50 to-gold-100/80 rounded-xl text-gold-700 mb-4 group-hover:from-gold-100 group-hover:to-gold-200/80'
        };
    }
  };
  
  const styles = getStyles();
  
  return (
    <motion.div 
      className={cn(`feature-card group flex flex-col items-start h-full transition-all duration-300`, styles.card)}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.1)"
      }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, type: "tween" }}
    >
      <div className={cn(`transition-all duration-200`, styles.iconBox)}>
        <Icon size={24} className="transform hover:scale-110 transition-transform duration-200" />
      </div>
      <h3 className="text-xl font-display font-semibold mb-3 text-diplomatic-800 group-hover:text-diplomatic-900 transition-colors duration-200">
        {title}
      </h3>
      <p className="text-neutral-600 leading-relaxed">
        {description}
      </p>
      
      <div className="w-12 h-0.5 bg-gradient-to-r from-gold-300 to-gold-200 mt-4 rounded-full group-hover:w-20 transition-all duration-300" />
    </motion.div>
  );
}

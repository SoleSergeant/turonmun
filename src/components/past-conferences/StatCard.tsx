
import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, color, textColor }) => {
  return (
    <motion.div
      className={`${color} p-6 rounded-xl shadow-sm border border-white/20 dark:border-white/10 h-full group`}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`${textColor} mb-2 opacity-90 transition-all duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            delay: 0.2
          }}
        >
          <span className={`block text-4xl font-bold ${textColor}`}>{value}</span>
        </motion.div>
        <span className="text-neutral-600 dark:text-neutral-300 font-medium">{label}</span>
      </div>
    </motion.div>
  );
};

export default StatCard;

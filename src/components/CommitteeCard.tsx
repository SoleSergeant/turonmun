import React, { useState } from 'react';
import { LucideIcon, Globe, Award, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommitteeCardProps {
  name: string;
  abbreviation: string;
  description: string;
  topics: string[];
  imageUrl?: string;
  icon?: LucideIcon;
  chairs?: string[];
}

export default function CommitteeCard({ 
  name, 
  abbreviation, 
  description, 
  topics,
  imageUrl = '/images/committees/unga.png',
  icon: Icon = Globe,
  chairs = []
}: CommitteeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.div 
      className="committee-card h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-elegant border border-neutral-100"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        y: -5,
        boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.15)",
        transition: { duration: 0.2, type: "tween" }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence>
          <motion.div 
            key="main-content"
            className="relative w-full"
            animate={{ 
              height: isHovered ? '160px' : '100%',
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className={`absolute inset-0 bg-gradient-to-t from-diplomatic-900/90 to-diplomatic-800/30 z-10 ${isHovered ? 'opacity-80' : 'opacity-60'}`}></div>
            <motion.img 
              src={imageError ? '/images/committees/unga.png' : imageUrl} 
              alt={name} 
              className="object-cover w-full h-full"
              animate={{ 
                filter: isHovered ? 'blur(1px)' : 'none',
                scale: isHovered ? 1.05 : 1
              }}
              transition={{ duration: 0.3 }}
              onLoad={() => {
                console.log(`Successfully loaded image: ${imageUrl}`);
              }}
              onError={(e) => {
                console.error(`Failed to load image: ${imageUrl}`);
                setImageError(true);
              }}
            />
            
            <motion.div 
              className="absolute top-3 left-3 z-20"
              animate={{ 
                rotate: isHovered ? [-2, 2, -2] : 0 
              }}
              transition={{ 
                duration: 0.3, 
                ease: "easeInOut"
              }}
            >
              <motion.div 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                  {Icon && <Icon size={18} className="text-diplomatic-700" />}
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="absolute bottom-3 left-3 z-10 text-white"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
            >
              <motion.span 
                className="bg-diplomatic-600 text-white text-xs font-medium px-2.5 py-1 rounded-md mb-1 inline-block shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {abbreviation}
              </motion.span>
              <motion.h3 
                className="text-xl font-display font-semibold text-white line-clamp-1 drop-shadow-sm"
              >
                {name}
              </motion.h3>
            </motion.div>
          </motion.div>
          
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                key="hover-details"
                className="p-5 flex flex-col flex-grow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.p 
                  className="text-neutral-600 mb-4 line-clamp-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {description}
                </motion.p>
                
                {chairs.length > 0 && (
                  <motion.div 
                    className="mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                      <Award size={16} className="text-diplomatic-500" />
                      <h4>Committee Chairs:</h4>
                    </div>
                    <p className="text-sm text-neutral-700 pl-6">
                      {chairs.join(' • ')}
                    </p>
                  </motion.div>
                )}
                
                <motion.div 
                  className="mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-2">
                    <FileText size={16} className="text-diplomatic-500" />
                    <h4>Topics:</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {topics.map((topic, index) => (
                      <span 
                        key={index} 
                        className="bg-diplomatic-50 text-diplomatic-700 text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap border border-diplomatic-100 hover:bg-diplomatic-100 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

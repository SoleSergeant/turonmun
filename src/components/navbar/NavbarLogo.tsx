import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavbarLogoProps {
  scrolled: boolean;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ scrolled }) => {
  return (
    <Link 
      to="/" 
      className="flex items-center gap-3 text-xl font-display transition-all duration-300"
    >
      <motion.div 
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
        className="w-10 h-10 rounded-full bg-diplomatic-800 flex items-center justify-center overflow-hidden shadow-glow relative"
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-diplomatic-700/0 via-diplomatic-700/20 to-diplomatic-700/0"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <motion.img 
          src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png" 
          alt="TuronMUN Logo" 
          className="w-8 h-8 object-contain"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
      <div className={scrolled ? "text-white" : "text-white"}>
        <motion.span 
          className="font-bold text-white"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          TURON
        </motion.span>
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: [1, 0.8, 1],
            y: [0, -1, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1 }}
        >
          MUN
        </motion.span>
      </div>
    </Link>
  );
};

export default NavbarLogo;

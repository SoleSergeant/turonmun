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
        <img
          src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png"
          alt="TuronMUN Logo"
          className="w-8 h-8 object-contain"
        />
      </motion.div>
      <div className={scrolled ? "text-white" : "text-white"}>
        <span className="font-bold text-white">TURON</span>
        <span>MUN</span>
      </div>
    </Link>
  );
};

export default NavbarLogo;

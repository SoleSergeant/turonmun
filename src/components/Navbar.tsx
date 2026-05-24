import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavbarLogo from './navbar/NavbarLogo';
import NavbarDesktop from './navbar/NavbarDesktop';
import NavbarMobile from './navbar/NavbarMobile';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import navLinks from './navbar/NavLinks';  // Import default export

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Determine if we're on the homepage
  const isHomePage = location.pathname === '/';

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Detect scroll to change navbar style
  useEffect(() => {
    // If not on homepage, always set scrolled to true
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, location.pathname]);

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-0',
        isScrolled || !isHomePage
          ? 'bg-diplomatic-900 text-white backdrop-blur-md shadow-md py-2'
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <NavbarLogo scrolled={isScrolled} />

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          <NavbarDesktop scrolled={isScrolled} isHomePage={isHomePage} navLinks={navLinks} />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center lg:hidden gap-2">
          <button
            onClick={toggleMenu}
            className={cn("p-2", isScrolled ? "text-white" : "text-diplomatic-800")}
            aria-label="Toggle menu"
          >
            <div className="flex flex-col justify-center w-6 h-6 space-y-1.5 relative">
              <motion.span
                animate={mobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className={cn("w-6 h-0.5 block transition-transform origin-center", 
                  isScrolled ? "bg-white" : "bg-diplomatic-800")}
              ></motion.span>
              <motion.span
                animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className={cn("w-6 h-0.5 block transition-opacity", 
                  isScrolled ? "bg-white" : "bg-diplomatic-800")}
              ></motion.span>
              <motion.span
                animate={mobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className={cn("w-6 h-0.5 block transition-transform origin-center", 
                  isScrolled ? "bg-white" : "bg-diplomatic-800")}
              ></motion.span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <NavbarMobile 
        scrolled={isScrolled} 
        isMenuOpen={mobileMenuOpen} 
        toggleMenu={toggleMenu} 
        isHomePage={isHomePage} 
        navLinks={navLinks}
      />
    </header>
  );
}

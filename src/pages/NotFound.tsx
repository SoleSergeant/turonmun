
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-white">
      <Navbar />
      <motion.main 
        className="flex-grow flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container py-20 text-center">
          <div className="max-w-lg mx-auto">
            <motion.h1 
              className="text-6xl font-bold text-diplomatic-600 mb-4"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              404
            </motion.h1>
            <motion.h2 
              className="text-2xl font-semibold mb-4 text-gray-800"
              initial={{ y: -15 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Page Not Found
            </motion.h2>
            <motion.p 
              className="text-neutral-600 mb-8"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              The page you are looking for doesn't exist or has been moved.
            </motion.p>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="btn-primary inline-flex items-center gap-2 bg-diplomatic-600 hover:bg-diplomatic-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <ArrowLeft size={16} /> Return to Home
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default NotFound;

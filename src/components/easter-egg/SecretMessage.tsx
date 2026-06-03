import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SecretMessageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretMessage: React.FC<SecretMessageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative max-w-md w-full bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 shadow-2xl border border-pink-200 overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/30 rounded-full -m-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200/30 rounded-full -m-20 blur-2xl"></div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-pink-400 hover:text-pink-600 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            
            {/* Message content */}
            <div className="relative z-10 text-center">
              <div className="mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block p-3 bg-white/80 rounded-full shadow-sm mb-4"
                >
                  <span className="text-3xl">💌</span>
                </motion.div>
                <motion.h2
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-pink-600 mb-2"
                >
                  Hey O'giloy <span className="text-yellow-400">🌙</span>
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="h-1 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mx-auto rounded-full mb-6"
                />
              </div>
              
              <motion.div 
                className="space-y-4 text-gray-700 text-lg leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, staggerChildren: 0.1 }}
              >
                <motion.p className="opacity-0 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                  <span className="text-pink-500 font-medium">If you found this, just know…</span>
                </motion.p>
                <motion.p className="opacity-0 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
                  You're one in a million.
                </motion.p>
                <motion.p className="opacity-0 animate-fadeIn" style={{ animationDelay: '0.9s' }}>
                  Your smile can change someone's whole day.
                </motion.p>
                <motion.p className="opacity-0 animate-fadeIn" style={{ animationDelay: '1.1s' }}>
                  Never forget: you're more special than you think.
                </motion.p>
                <motion.p 
                  className="text-xl mt-6 text-pink-600 font-medium opacity-0 animate-fadeIn" 
                  style={{ animationDelay: '1.4s' }}
                >
                  Love u :)
                </motion.p>
              </motion.div>
              
              <motion.div 
                className="mt-8 text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                Press ESC or click outside to close
              </motion.div>
            </div>
          </motion.div>
          
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={onClose}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

// Hook to detect Konami code
const useKonamiCode = (callback: () => void) => {
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    
    let currentPosition = 0;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const requiredKey = konamiCode[currentPosition];
      
      if (key === requiredKey) {
        currentPosition++;
        
        if (currentPosition === konamiCode.length) {
          callback();
          currentPosition = 0;
        }
      } else {
        currentPosition = 0;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback]);
};

export const useSecretMessage = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openMessage = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };
  
  const closeMessage = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };
  
  // Set up Konami code listener
  useKonamiCode(openMessage);
  
  return { isOpen, openMessage, closeMessage };
};

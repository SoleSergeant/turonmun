
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition-colors hover:bg-neutral-100 focus:outline-none"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      aria-label="Toggle theme"
    >
      <Sun 
        className="h-4 w-4 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0 text-diplomatic-900" 
      />
      <Moon 
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-diplomatic-900" 
      />
    </motion.button>
  );
}

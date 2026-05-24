import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LoaderProps {
  className?: string;
  fullPage?: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({
  className,
  fullPage = false,
  text
}) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.2,
        duration: 0.4
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullPage ? "min-h-[80vh]" : "",
        className
      )}
    >
      <div className="loader" />
      
      {text && (
        <motion.p 
          variants={textVariants}
          className="text-neutral-600 font-medium mt-2 text-center"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
};

export { Loader };

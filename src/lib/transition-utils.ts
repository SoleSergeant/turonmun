import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Variants } from 'framer-motion';

/**
 * Hook to manage page transitions
 * @param delay - Delay in milliseconds before showing content
 * @returns Object containing loading state
 */
export function usePageTransition(delay: number = 300) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [prevPathname, setPrevPathname] = useState<string | null>(null);

  useEffect(() => {
    const currentPathname = location.pathname;
    const currentSearch = location.search;
    const currentKey = `${currentPathname}${currentSearch}`;
    const prevKey = prevPathname ? `${prevPathname}${location.search}` : null;
    
    // Only trigger loading state when path or search params change
    if (prevKey !== null && prevKey !== currentKey) {
      setIsLoading(true);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (prevPathname === null) {
      // First load
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, delay / 2); // Faster initial load
      
      return () => clearTimeout(timer);
    }
    
    setPrevPathname(currentPathname);
  }, [location.pathname, location.search, prevPathname, delay]);

  return { isLoading };
}

/**
 * Hook to manage component transitions
 * @param delay - Delay in milliseconds before showing content
 * @param dependencies - Array of dependencies that trigger loading state when changed
 * @returns Object containing loading state
 */
export function useComponentTransition(delay: number = 200, dependencies: any[] = []) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { isLoading };
}

/**
 * Enhanced variants for framer-motion animations
 */
export const transitionVariants = {
  pageVariants: {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        when: "beforeChildren",
        staggerChildren: 0.08
      }
     },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
  },
  
  itemVariants: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  },
  
  fadeVariants: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },
  
  containerVariants: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },
  
  scaleVariants: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { opacity: 0, x: 20, transition: { duration: 0.3 } }
  },
  
  slideInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
  },
  
  slideInDown: {
    initial: { opacity: 0, y: -30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  },
  
  staggerContainerVariants: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        when: "beforeChildren",
        staggerChildren: 0.15
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },
  
  staggerItemVariants: {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: { opacity: 0, y: 5, transition: { duration: 0.2 } }
  },
  
  // New staggered container variant with more pronounced staggering
  staggerContainer: {
    initial: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    },
    exit: { opacity: 0 }
  },
  
  // New fade-in item variant with a spring animation
  itemFadeIn: {
    initial: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 15 
      }
    },
    exit: { opacity: 0, y: -20 }
  }
};

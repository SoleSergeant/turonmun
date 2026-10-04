import type { Variants } from 'framer-motion';

const easeOut = [0.25, 0.1, 0.25, 1] as const;
const spring = { type: 'spring', stiffness: 300, damping: 20 } as const;

/**
 * Shared framer-motion variants
 */
export const transitionVariants = {
  itemVariants: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: spring },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  },

  fadeVariants: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5, ease: easeOut } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },

  containerVariants: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: easeOut,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },

  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: spring },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  },

  slideInDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0, transition: spring },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  },
} satisfies Record<string, Variants>;

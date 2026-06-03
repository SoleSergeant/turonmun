import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface ExperienceSectionProps {
  title: string;
  subtitle: string;
  description: string;
  children?: ReactNode;
  themeColor?: 'light' | 'dark';
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export default function ExperienceSection({
  title,
  subtitle,
  description,
  children,
  themeColor = 'dark'
}: ExperienceSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    const element = document.getElementById('experience-section');
    if (element) observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  const bgColor = themeColor === 'dark' 
    ? 'bg-diplomatic-900' 
    : 'bg-diplomatic-100';
    
  const textColor = themeColor === 'dark' 
    ? 'text-white' 
    : 'text-diplomatic-900';
    
  const accentColor = themeColor === 'dark'
    ? 'bg-diplomatic-200'
    : 'bg-diplomatic-700';
    
  const cardBg = themeColor === 'dark'
    ? 'bg-diplomatic-800/80 border-diplomatic-700 hover:border-diplomatic-600'
    : 'bg-white/90 border-diplomatic-200 hover:border-diplomatic-400';
    
  const cardText = themeColor === 'dark'
    ? 'text-diplomatic-100'
    : 'text-diplomatic-800';

  return (
    <section 
      id="experience-section"
      className={`relative overflow-hidden py-20 md:py-28 ${bgColor} transition-colors duration-500`}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0dGVybiBpZD0icGF0dGVybi1iYXNlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIHNjYWxlKDAuMDUpIj48cGF0aCBkPSJNMCwwSDEwMFYxMDBIMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMDIsMTE5LDEzOCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPiA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4tYmFzZSkiLz48L3N2Zz4=')]" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <AnimatePresence>
          <motion.div
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2
                }
              }
            }}
            className="max-w-5xl mx-auto"
          >
            <motion.div 
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <motion.span 
                className={`text-sm font-semibold tracking-wider uppercase mb-3 inline-block ${textColor} opacity-90`}
              >
                {subtitle}
              </motion.span>
              <motion.h2 
                className={`text-4xl md:text-5xl font-bold mb-6 ${textColor} leading-tight`}
              >
                {title}
              </motion.h2>
              <motion.div 
                className={`w-20 h-1 mx-auto mb-8 rounded-full ${accentColor}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.p 
                className={`text-lg md:text-xl leading-relaxed ${textColor} opacity-90 max-w-3xl mx-auto`}
              >
                {description}
              </motion.p>
            </motion.div>
            
            {children && (
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.3
                    }
                  }
                }}
                className="grid md:grid-cols-3 gap-6 mt-16"
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Subtle divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-diplomatic-900/10 to-transparent"></div>
    </section>
  );
}

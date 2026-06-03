import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: Date;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        // If the target date has passed
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Calculate days, hours, minutes and seconds
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    // Calculate initial time left
    calculateTimeLeft();

    // Update time every second
    const timer = setInterval(calculateTimeLeft, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {[
        { value: timeLeft.days, label: 'Days', color: 'from-gold-400/20 to-gold-500/30' },
        { value: timeLeft.hours, label: 'Hours', color: 'from-diplomatic-400/20 to-diplomatic-500/30' },
        { value: timeLeft.minutes, label: 'Minutes', color: 'from-gold-400/20 to-gold-500/30' },
        { value: timeLeft.seconds, label: 'Seconds', color: 'from-diplomatic-400/20 to-diplomatic-500/30' }
      ].map((item, index) => (
        <motion.div
          key={index}
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <motion.div
            className="w-full aspect-square glass-panel relative overflow-hidden flex items-center justify-center mb-2 group"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>

            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-400/0 via-gold-400/30 to-gold-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

            <AnimatePresence mode="wait">
              <motion.span
                key={item.value}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-display font-bold text-white relative z-10 drop-shadow-sm"
                initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 1.2, rotateX: 90 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {String(item.value).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>

            {/* Pulse effect for seconds */}
            {index === 3 && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-gold-400/50"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>

          <motion.span
            className="text-xs sm:text-sm text-white/80 font-medium tracking-wide uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
          >
            {item.label}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

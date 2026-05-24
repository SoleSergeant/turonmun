import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Show splash screen for 2 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 2000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-diplomatic-900 overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    {/* Background Effects */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-gold-400/5 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-diplomatic-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo Animation */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative mb-8"
                        >
                            <div className="absolute inset-0 bg-gold-400/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png"
                                alt="TuronMUN Logo"
                                className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-2xl"
                            />
                        </motion.div>

                        {/* Text Animation */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="text-center"
                        >
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 tracking-tight">
                                TuronMUN
                            </h1>
                            <p className="text-gold-400 text-sm md:text-base font-medium tracking-widest uppercase opacity-90">
                                Season 6
                            </p>
                        </motion.div>

                        {/* Loading Indicator */}
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 100, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 1.5 }}
                            className="mt-12 h-1 bg-white/10 rounded-full overflow-hidden w-32"
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

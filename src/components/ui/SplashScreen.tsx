import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/content/store';

interface SplashScreenProps {
    onComplete?: () => void;
}

// Long enough to read as a greeting, short enough not to hold the page back
// (it used to cover the site for 2.5 seconds on every first visit).
const VISIBLE_MS = 900;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const general = useContent('general');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, VISIBLE_MS);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-diplomatic-900"
                    // Soft corner glows as plain gradients: the blurred, pulsing layers
                    // they replace were costly to draw on phones.
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 10% 10%, rgba(247,163,28,0.08), transparent 45%), radial-gradient(circle at 90% 90%, rgba(79,102,155,0.18), transparent 45%)',
                    }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="mb-8"
                        >
                            <img
                                src={general.logo_url}
                                alt="TuronMUN Logo"
                                width={160}
                                height={160}
                                className="h-32 w-32 object-contain drop-shadow-2xl md:h-40 md:w-40"
                            />
                        </motion.div>

                        <div className="text-center">
                            <p className="mb-2 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                                {general.site_name}
                            </p>
                            <p className="text-sm font-medium uppercase tracking-widest text-gold-400 opacity-90 md:text-base">
                                {general.season_label}
                            </p>
                        </div>

                        <div className="mt-12 h-1 w-32 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                                className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: VISIBLE_MS / 1000, ease: 'easeInOut' }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

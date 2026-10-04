import React, { useEffect, useState, useRef } from 'react';
import FeatureCard from './FeatureCard';
import { Users, Award, Globe, PenTool } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { motion, useInView } from 'framer-motion';
import { useContent, rich } from '@/content/store';

// Card icons cycle in this order; the text comes from Site content → Homepage → About block.
const FEATURE_ICONS = [Globe, Users, Award, PenTool];

export default function AboutSection() {
  const content = useContent('home_about');
  const stats = content.stats.map(s => ({ ...s, value: Number(s.value) || 0 }));
  const features = content.features.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i % FEATURE_ICONS.length] }));
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  

  const [counts, setCounts] = useState<number[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(statsRef, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!isInView) return;

    let animationFrame: number;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCounts(
        stats.map((stat) => Math.floor(stat.value * progress))
      );
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, content.stats]);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-100 border-y border-neutral-200">
      <div className="absolute inset-0 bg-world-map opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-40 -right-20 w-72 h-72 bg-gold-300/30 blur-3xl rounded-full pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -left-10 w-80 h-80 bg-diplomatic-300/25 blur-3xl rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gold-200/20 blur-2xl rounded-full pointer-events-none" />
      <div className="container relative">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Text content */}
          <motion.div 
            className="lg:w-1/2 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Badge variant="outline" className="mb-4 glass-panel text-diplomatic-700 border-diplomatic-300/50 px-4 py-2 text-sm font-medium shadow-subtle">
                {content.badge}
              </Badge>
            </motion.div>
            
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-diplomatic-900 leading-tight">
                {rich(content.headline, 'text-gold-500')}
              </h2>
              <div className="w-20 h-1 bg-gold-400 rounded-full" />
            </div>

            <div className="space-y-6 pt-6">
              {content.paragraphs.map((text, i) => (
                <p key={i} className="text-neutral-700 leading-relaxed">{text}</p>
              ))}
            </div>

            <motion.div
              ref={statsRef}
              className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="glass-panel p-4 sm:p-5 text-center premium-transition hover:-translate-y-2 hover:shadow-glow group relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1 + 0.5,
                    hover: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-diplomatic-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-diplomatic-900 mb-1">
                      {counts[index] ?? 0}
                      <span className="text-gold-500 ml-0.5">{stat.suffix}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600 group-hover:text-neutral-700 transition-colors">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Feature cards */}
          <motion.div 
            className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((feature, index) => (
              <div key={index} className="h-full">
                <FeatureCard 
                  {...feature} 
                  variant={index % 2 === 0 ? 'default' : 'filled'}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
